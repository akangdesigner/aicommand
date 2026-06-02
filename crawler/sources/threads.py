"""
Threads crawler using official Threads API (keyword_search endpoint).
Requires THREADS_ACCESS_TOKEN in .env (threads_basic + threads_keyword_search permissions).
API docs: https://developers.facebook.com/docs/threads/keyword-search/
"""
import hashlib
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import httpx

from crawler.filter import is_genuine_review

API_BASE = "https://graph.threads.net/v1.0"
KEYWORDS = [
    "Claude Code", "Cursor", "Windsurf", "Trae", "Codex",
    "n8n", "Zapier", "make.com", "Dify",
    "Midjourney", "ComfyUI", "Adobe Firefly", "Ideogram", "Leonardo AI",
    "Seedance", "可靈", "Kling",
    "ChatGPT", "Notion AI", "Perplexity", "Grammarly",
]
THREE_MONTHS_AGO = datetime.now(timezone.utc) - timedelta(days=90)
FIELDS = "id,text,media_type,permalink,timestamp,username"


@dataclass
class RawMention:
    source: str = "threads"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def search_keyword(client: httpx.Client, token: str, keyword: str) -> list[RawMention]:
    mentions: list[RawMention] = []
    seen: set[str] = set()

    try:
        resp = client.get(
            f"{API_BASE}/keyword_search",
            params={
                "q": keyword,
                "search_type": "RECENT",
                "limit": 100,
                "fields": FIELDS,
                "access_token": token,
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
    except Exception as e:
        print(f"  Threads API error [{keyword}]: {e}")
        return []

    for post in data:
        post_id = post.get("id", "")
        text = (post.get("text") or "").strip()
        permalink = post.get("permalink", "")
        timestamp = post.get("timestamp", "")
        username = post.get("username", "")

        if not text or len(text) < 20:
            continue
        if post_id in seen:
            continue

        # Date filter
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                if dt < THREE_MONTHS_AGO:
                    continue
            except Exception:
                pass

        if not is_genuine_review(text):
            continue

        seen.add(post_id)
        mentions.append(RawMention(
            source_id=f"threads_{post_id}",
            content=text,
            metadata={
                "title": text[:60],
                "author": username,
                "url": permalink,
                "created_at": timestamp,
                "source": "threads",
                "type": "post",
            },
            content_hash=_hash(text),
        ))

    return mentions


def run_full_crawl() -> list[RawMention]:
    token = os.environ.get("THREADS_ACCESS_TOKEN", "")
    if not token:
        print("  Threads: 缺少 THREADS_ACCESS_TOKEN，略過")
        return []

    mentions: list[RawMention] = []
    with httpx.Client(timeout=20) as client:
        for kw in KEYWORDS:
            print(f"Threads [{kw}]...")
            results = search_keyword(client, token, kw)
            mentions.extend(results)
            print(f"  → {len(results)} 筆")

    # Deduplicate
    seen_hashes: set[str] = set()
    unique = []
    for m in mentions:
        if m.content_hash not in seen_hashes:
            seen_hashes.add(m.content_hash)
            unique.append(m)

    print(f"Threads total unique: {len(unique)}")
    return unique
