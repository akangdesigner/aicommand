"""
掘金 (juejin.cn) crawler.
Uses recommend_all_feed + search API.
"""
import hashlib
import time
from dataclasses import dataclass, field
from typing import Generator

import httpx

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://juejin.cn/",
    "Content-Type": "application/json",
}

SEARCH_KEYWORDS = [
    "Claude", "Cursor编辑器", "ChatGPT", "AI编程工具",
    "GitHub Copilot", "n8n", "Windsurf", "AI工具推荐",
    "大模型", "LLM应用", "AI自动化", "Midjourney",
    "Zapier", "make.com", "Dify", "工作流自动化",
]

AI_KEYWORDS = [
    "claude", "cursor", "chatgpt", "copilot", "ai工具", "ai编程",
    "windsurf", "n8n", "大模型", "llm", "midjourney", "ai写作",
    "人工智能", "自动化", "gpt", "gemini", "perplexity",
]

MIN_DIGG = 5
RATE_LIMIT_DELAY = 1.0


@dataclass
class RawMention:
    source: str = "juejin"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _is_ai_related(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in AI_KEYWORDS)


def _post(client: httpx.Client, url: str, body: dict) -> dict | None:
    try:
        time.sleep(RATE_LIMIT_DELAY)
        resp = client.post(url, json=body, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  掘金 error: {e}")
        return None


def _parse_article(item: dict) -> RawMention | None:
    info = item.get("article_info", {})
    title = info.get("title", "")
    brief = info.get("brief_content", "") or ""
    digg = info.get("digg_count", 0)
    article_id = info.get("article_id", "")

    combined = f"{title} {brief}"
    if not _is_ai_related(combined) or digg < MIN_DIGG or not article_id:
        return None

    content = f"{title}\n\n{brief}".strip() if brief else title
    if len(content) < 15:
        return None

    return RawMention(
        source_id=f"juejin_article_{article_id}",
        content=content,
        metadata={
            "type": "article",
            "title": title,
            "digg_count": digg,
            "view_count": info.get("view_count", 0),
            "comment_count": info.get("comment_count", 0),
            "url": f"https://juejin.cn/post/{article_id}",
            "author": item.get("author_user_info", {}).get("user_name", ""),
        },
        content_hash=_hash(content),
    )


def crawl_feed(client: httpx.Client) -> Generator[RawMention, None, None]:
    """Fetch recommended articles feed."""
    for cursor in ("0", "10", "20"):
        data = _post(client, "https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed",
                     {"cursor": cursor, "limit": 10, "id_type": 2})
        if not data or data.get("err_no") != 0:
            break
        for item in data.get("data", []):
            m = _parse_article(item)
            if m:
                yield m


def crawl_search(client: httpx.Client, keyword: str) -> Generator[RawMention, None, None]:
    """Search articles by keyword."""
    data = _post(client, "https://api.juejin.cn/search_api/v1/search",
                 {"key_word": keyword, "search_type": 0, "cursor": "0", "limit": 20})
    if not data or data.get("err_no") != 0:
        return

    for item in (data.get("data") or []):
        article_info = item.get("result_model", {}).get("article_info", {})
        if not article_info:
            continue
        # Wrap in expected format
        wrapped = {
            "article_info": article_info,
            "author_user_info": item.get("result_model", {}).get("author_user_info", {}),
        }
        m = _parse_article(wrapped)
        if m:
            yield m


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    def _add(m: RawMention) -> None:
        if m and m.content_hash not in seen_hashes:
            seen_hashes.add(m.content_hash)
            mentions.append(m)

    with httpx.Client() as client:
        print("juejin: crawling feed...")
        for m in crawl_feed(client):
            _add(m)

        for kw in SEARCH_KEYWORDS:
            print(f"juejin: searching {kw.encode('ascii','replace').decode()}...")
            for m in crawl_search(client, kw):
                _add(m)

    print(f"juejin total: {len(mentions)}")
    return mentions
