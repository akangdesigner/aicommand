"""
Reddit crawler using public JSON API (no OAuth required).
Reddit exposes .json endpoints for all public content.
"""
import hashlib
import time
from dataclasses import dataclass, field
from typing import Generator

import httpx

TARGET_SUBREDDITS = [
    "ClaudeAI", "ChatGPT", "LocalLLaMA",
    "MachineLearning", "programming", "webdev",
    "artificial", "SideProject", "ExperiencedDevs",
]

SEARCH_QUERIES = [
    "claude code review",
    "cursor vs copilot",
    "claude vs chatgpt developer",
    "best AI coding tool",
    "github copilot alternative",
    "n8n automation review",
    "windsurf cursor comparison",
    "AI tool solo developer",
    "bolt lovable comparison",
    "perplexity vs chatgpt",
]

BASE_URL = "https://www.reddit.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ai-tool-discovery/1.0; research bot)"
}

MIN_POST_SCORE = 5
MIN_COMMENT_SCORE = 3
RATE_LIMIT_DELAY = 3.0  # seconds between requests


@dataclass
class RawMention:
    source: str = "reddit"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _get(client: httpx.Client, url: str, params: dict = {}) -> dict | None:
    try:
        time.sleep(RATE_LIMIT_DELAY)
        resp = client.get(url, params=params, headers=HEADERS, timeout=30)
        if resp.status_code == 429:
            print("  Rate limited, waiting 60s...")
            time.sleep(60)
            resp = client.get(url, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  Request error {url}: {e}")
        return None


def _parse_post(post_data: dict) -> RawMention | None:
    data = post_data.get("data", {})
    score = data.get("score", 0)
    if score < MIN_POST_SCORE:
        return None

    title = data.get("title", "")
    body = data.get("selftext", "").strip()
    if body in ("[removed]", "[deleted]", ""):
        body = ""

    content = f"{title}\n\n{body}".strip() if body else title
    if len(content) < 30:
        return None

    return RawMention(
        source_id=f"reddit_post_{data['id']}",
        content=content,
        metadata={
            "type": "post",
            "title": title,
            "subreddit": data.get("subreddit", ""),
            "score": score,
            "url": f"https://reddit.com{data.get('permalink', '')}",
            "author": data.get("author", "[deleted]"),
            "created_utc": data.get("created_utc", 0),
            "num_comments": data.get("num_comments", 0),
        },
        content_hash=_hash(content),
    )


def crawl_subreddit(client: httpx.Client, subreddit: str) -> Generator[RawMention, None, None]:
    """Fetch hot + top posts from a subreddit."""
    for sort in ("hot", "top"):
        params = {"limit": 50, "t": "month"} if sort == "top" else {"limit": 50}
        data = _get(client, f"{BASE_URL}/r/{subreddit}/{sort}.json", params)
        if not data:
            continue

        posts = data.get("data", {}).get("children", [])
        for post in posts:
            mention = _parse_post(post)
            if mention:
                yield mention


def crawl_comments(client: httpx.Client, post_id: str, subreddit: str, post_title: str) -> Generator[RawMention, None, None]:
    """Fetch top comments for a post."""
    data = _get(client, f"{BASE_URL}/r/{subreddit}/comments/{post_id}.json", {"limit": 20, "sort": "top", "depth": 2})
    if not data or not isinstance(data, list) or len(data) < 2:
        return

    comment_listing = data[1].get("data", {}).get("children", [])
    for item in comment_listing:
        if item.get("kind") != "t1":
            continue
        d = item.get("data", {})
        body = d.get("body", "").strip()
        score = d.get("score", 0)

        if score < MIN_COMMENT_SCORE or len(body) < 60 or body in ("[removed]", "[deleted]"):
            continue

        content = f"[Post: {post_title}]\n\n{body}"
        yield RawMention(
            source_id=f"reddit_comment_{d['id']}",
            content=content,
            metadata={
                "type": "comment",
                "subreddit": subreddit,
                "score": score,
                "url": f"https://reddit.com{d.get('permalink', '')}",
                "author": d.get("author", "[deleted]"),
                "created_utc": d.get("created_utc", 0),
                "post_title": post_title,
            },
            content_hash=_hash(content),
        )


def crawl_search(client: httpx.Client, query: str) -> Generator[RawMention, None, None]:
    """Search Reddit for a query."""
    params = {
        "q": query,
        "sort": "relevance",
        "t": "month",
        "limit": 25,
        "type": "link",
    }
    data = _get(client, f"{BASE_URL}/search.json", params)
    if not data:
        return

    for post in data.get("data", {}).get("children", []):
        mention = _parse_post(post)
        if mention:
            yield mention


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()
    post_ids: list[tuple[str, str, str]] = []  # (post_id, subreddit, title)

    def _add(mention: RawMention) -> None:
        if mention.content_hash not in seen_hashes:
            seen_hashes.add(mention.content_hash)
            mentions.append(mention)

    with httpx.Client() as client:
        # Hot/top posts per subreddit
        for sub in TARGET_SUBREDDITS:
            print(f"Reddit crawling r/{sub}...")
            try:
                for m in crawl_subreddit(client, sub):
                    _add(m)
                    if m.metadata["type"] == "post":
                        post_id = m.source_id.replace("reddit_post_", "")
                        post_ids.append((post_id, sub, m.metadata["title"]))
            except Exception as e:
                print(f"  Error r/{sub}: {e}")

        # Search queries
        for query in SEARCH_QUERIES:
            print(f"Reddit searching: '{query}'...")
            try:
                for m in crawl_search(client, query):
                    _add(m)
                    if m.metadata["type"] == "post":
                        post_id = m.source_id.replace("reddit_post_", "")
                        sub = m.metadata.get("subreddit", "")
                        post_ids.append((post_id, sub, m.metadata["title"]))
            except Exception as e:
                print(f"  Error search '{query}': {e}")

        # Fetch comments for collected posts (top 100 by engagement)
        post_ids_unique = list({pid: (pid, sub, title) for pid, sub, title in post_ids}.values())[:100]
        print(f"Fetching comments for {len(post_ids_unique)} posts...")
        for post_id, sub, title in post_ids_unique:
            try:
                for m in crawl_comments(client, post_id, sub, title):
                    _add(m)
            except Exception as e:
                print(f"  Error comments {post_id}: {e}")

    print(f"Reddit total unique mentions: {len(mentions)}")
    return mentions
