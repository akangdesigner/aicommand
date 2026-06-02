"""
V2EX crawler via public v1 API (no auth required).
"""
import hashlib
import time
from dataclasses import dataclass, field
from typing import Generator

import httpx

BASE_URL = "https://www.v2ex.com/api"
HEADERS = {"User-Agent": "ai-tool-discovery/1.0"}

AI_KEYWORDS = [
    "claude", "cursor", "chatgpt", "copilot", "ai工具", "ai 工具",
    "ai编程", "ai 編程", "windsurf", "n8n", "大模型", "llm",
    "midjourney", "ai写作", "人工智能", "人工智慧", "自动化", "自動化",
    "gpt", "gemini", "perplexity", "bolt", "lovable",
    "zapier", "make.com", "dify", "工作流", "workflow",
]

NODE_NAMES = [
    "ai", "chatgpt", "programmer", "python", "share",
    "qna", "career", "working", "startup",
]

MIN_REPLIES = 1
RATE_LIMIT_DELAY = 1.5


@dataclass
class RawMention:
    source: str = "v2ex"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _get(client: httpx.Client, url: str) -> list | dict | None:
    try:
        time.sleep(RATE_LIMIT_DELAY)
        resp = client.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  V2EX error {url[-50:]}: {e}")
        return None


def _is_ai_related(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in AI_KEYWORDS)


def _parse_topic(topic: dict) -> RawMention | None:
    title = topic.get("title", "")
    content_text = topic.get("content", "") or ""
    combined = f"{title} {content_text}"

    if not _is_ai_related(combined):
        return None
    if topic.get("replies", 0) < MIN_REPLIES:
        return None

    content = f"{title}\n\n{content_text}".strip() if content_text else title
    if len(content) < 15:
        return None

    return RawMention(
        source_id=f"v2ex_topic_{topic['id']}",
        content=content,
        metadata={
            "type": "topic",
            "title": title,
            "node": topic.get("node", {}).get("name", "") if isinstance(topic.get("node"), dict) else "",
            "replies": topic.get("replies", 0),
            "url": f"https://www.v2ex.com/t/{topic['id']}",
            "author": topic.get("member", {}).get("username", "") if isinstance(topic.get("member"), dict) else "",
            "created": topic.get("created", 0),
        },
        content_hash=_hash(content),
    )


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    def _add(m: RawMention) -> None:
        if m and m.content_hash not in seen_hashes:
            seen_hashes.add(m.content_hash)
            mentions.append(m)

    with httpx.Client() as client:
        # Hot & latest topics
        for endpoint in ("hot", "latest"):
            print(f"V2EX crawling {endpoint}...")
            data = _get(client, f"{BASE_URL}/topics/{endpoint}.json")
            if isinstance(data, list):
                for topic in data:
                    m = _parse_topic(topic)
                    _add(m)

        # Topics by node
        for node in NODE_NAMES:
            print(f"V2EX node: {node}...")
            data = _get(client, f"{BASE_URL}/topics/show.json?node_name={node}")
            if isinstance(data, list):
                for topic in data:
                    m = _parse_topic(topic)
                    _add(m)

    print(f"V2EX total: {len(mentions)}")
    return mentions
