"""
Threads crawler via Apify igview-owner/threads-search-scraper (actor: FP43CZrdHtiSNn4SY).
Requires APIFY_TOKEN in .env.

Input schema:
  searchQuery  string   required  — 搜尋關鍵字
  sort         string   "recent"  — "top" | "recent"
  maxPosts     int      50        — 每個關鍵字最多幾筆（20–1000）

Output 關鍵欄位:
  caption / text_content  — 貼文內容
  thread_id               — post ID
  thread_url              — 永久連結
  user.username           — 作者
  timestamp               — ISO 8601
"""
import hashlib
import os
import time
from dataclasses import dataclass, field

import httpx

from crawler.filter import is_genuine_review

APIFY_BASE = "https://api.apify.com/v2"
ACTOR_ID = "FP43CZrdHtiSNn4SY"

KEYWORDS = [
    "Claude Code", "Cursor AI", "Windsurf IDE", "Trae AI", "Codex OpenAI",
    "n8n workflow", "Zapier automation", "Make.com", "Dify AI",
    "Midjourney", "ComfyUI", "Adobe Firefly", "Ideogram AI", "Leonardo AI",
    "Seedance AI", "可靈 Kling", "Kling video",
    "ChatGPT", "Notion AI", "Perplexity AI", "Grammarly",
    "ElevenLabs", "GitHub Copilot",
]

MAX_POSTS_PER_KW = 50


@dataclass
class RawMention:
    source: str = "threads"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _extract_text(item: dict) -> str:
    # 實際欄位名稱依 API 回傳確認
    for key in ("captionText", "caption", "text_content", "text", "content"):
        v = item.get(key, "")
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def search_keyword(client: httpx.Client, token: str, keyword: str) -> list[RawMention]:
    """執行單一關鍵字搜尋，同步等待結果。"""
    try:
        resp = client.post(
            f"{APIFY_BASE}/acts/{ACTOR_ID}/run-sync-get-dataset-items",
            params={"token": token, "timeout": 120, "memory": 256},
            json={
                "searchQuery": keyword,
                "sort": "recent",
                "maxPosts": MAX_POSTS_PER_KW,
            },
            timeout=130,
        )
        resp.raise_for_status()
        items = resp.json()
        if not isinstance(items, list):
            return []
    except Exception as e:
        print(f"  Apify error [{keyword}]: {e}")
        return []

    mentions: list[RawMention] = []
    seen: set[str] = set()

    for item in items:
        text = _extract_text(item)
        if not text or not is_genuine_review(text, min_len=30):
            continue

        content_hash = _hash(text)
        if content_hash in seen:
            continue
        seen.add(content_hash)

        thread_id = str(item.get("postId") or item.get("thread_id") or item.get("post_id") or "")
        url = item.get("postUrl") or item.get("thread_url") or item.get("url") or ""
        # username 直接在 item 上（不是巢狀 user 物件）
        username = item.get("username") or ""
        if not username:
            user = item.get("user") or {}
            username = user.get("username", "") if isinstance(user, dict) else ""
        timestamp = item.get("takenAtISO") or item.get("timestamp") or item.get("created_at") or ""

        mentions.append(RawMention(
            source_id=f"threads_{thread_id}" if thread_id else f"threads_{content_hash[:16]}",
            content=text,
            metadata={
                "title": text[:60],
                "author": username or "",
                "url": url,
                "created_at": timestamp,
                "source": "threads",
                "type": "post",
            },
            content_hash=content_hash,
        ))

    return mentions


def run_full_crawl() -> list[RawMention]:
    token = os.environ.get("APIFY_TOKEN", "")
    if not token:
        print("  Threads (Apify): 缺少 APIFY_TOKEN，略過")
        return []

    all_mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    with httpx.Client(timeout=140) as client:
        for kw in KEYWORDS:
            print(f"  Threads [{kw}]...", end=" ", flush=True)
            results = search_keyword(client, token, kw)
            # 跨關鍵字去重
            unique = [m for m in results if m.content_hash not in seen_hashes]
            for m in unique:
                seen_hashes.add(m.content_hash)
            all_mentions.extend(unique)
            print(f"{len(unique)} 筆（raw {len(results)}）")
            # 避免打太快被 rate limit
            time.sleep(1)

    print(f"Threads/Apify total unique: {len(all_mentions)}")
    return all_mentions
