"""
Hacker News crawler via Algolia API.
Free, no auth required, 10,000 req/hour.
"""
import hashlib
import html
from dataclasses import dataclass, field
from typing import Generator

import httpx

from crawler.filter import is_genuine_review

ALGOLIA_BASE = "https://hn.algolia.com/api/v1"
MIN_POINTS = 5
MIN_COMMENT_LENGTH = 80

HN_QUERIES = [
    "Claude AI", "Claude Code", "Cursor IDE", "GitHub Copilot",
    "ChatGPT developer", "LLM coding", "AI coding tool",
    "n8n automation", "AI tool comparison",
]


@dataclass
class RawMention:
    source: str = "hn"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def search_hn(query: str, tags: str = "story,comment", days_back: int = 30) -> Generator[RawMention, None, None]:
    """Search HN via Algolia API."""
    from datetime import datetime, timedelta, timezone
    cutoff = int((datetime.now(timezone.utc) - timedelta(days=days_back)).timestamp())

    params = {
        "query": query,
        "tags": f"({tags})" if "," in tags else tags,
        "numericFilters": f"created_at_i>{cutoff}",
        "hitsPerPage": 50,
    }

    with httpx.Client(timeout=30) as client:
        try:
            resp = client.get(f"{ALGOLIA_BASE}/search", params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"HN search error for '{query}': {e}")
            return

    for hit in data.get("hits", []):
        object_type = hit.get("_tags", [])
        is_story = "story" in object_type
        is_comment = "comment" in object_type

        if is_story:
            title = html.unescape(hit.get("title") or "")
            text = html.unescape(hit.get("story_text") or "")
            content = f"{title}\n\n{text}".strip()
            if not content or hit.get("points", 0) < MIN_POINTS or not is_genuine_review(content):
                continue
            yield RawMention(
                source_id=f"hn_story_{hit['objectID']}",
                content=content,
                metadata={
                    "type": "story",
                    "title": title,
                    "points": hit.get("points", 0),
                    "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit['objectID']}",
                    "author": hit.get("author", ""),
                    "created_at": hit.get("created_at", ""),
                    "num_comments": hit.get("num_comments", 0),
                },
                content_hash=_hash(content),
            )

        elif is_comment:
            text = html.unescape(hit.get("comment_text") or "")
            content = text.strip()
            if len(content) < MIN_COMMENT_LENGTH or not is_genuine_review(content):
                continue
            yield RawMention(
                source_id=f"hn_comment_{hit['objectID']}",
                content=content,
                metadata={
                    "type": "comment",
                    "author": hit.get("author", ""),
                    "story_title": hit.get("story_title", ""),
                    "story_id": hit.get("story_id"),
                    "url": f"https://news.ycombinator.com/item?id={hit['objectID']}",
                    "created_at": hit.get("created_at", ""),
                    "points": hit.get("points", 0),
                },
                content_hash=_hash(content),
            )


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    for query in HN_QUERIES:
        print(f"HN searching: '{query}'...")
        for mention in search_hn(query):
            if mention.content_hash not in seen_hashes:
                seen_hashes.add(mention.content_hash)
                mentions.append(mention)

    print(f"HN total unique mentions: {len(mentions)}")
    return mentions
