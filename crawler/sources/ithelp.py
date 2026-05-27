"""
iT邦幫忙 crawler (ithelp.ithome.com.tw).
Searches questions and articles for AI tool mentions.
"""
import hashlib
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://ithelp.ithome.com.tw/search"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

KEYWORDS = ["Claude Code", "Cursor", "Windsurf", "Trae", "Codex"]
TABS = ["question", "article"]
PAGES_PER_SEARCH = 3
RATE_LIMIT_DELAY = 1.0
LOOKBACK = datetime.now() - timedelta(days=365)


@dataclass
class RawMention:
    source: str = "ithelp"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _get(client: httpx.Client, params: dict) -> str | None:
    try:
        time.sleep(RATE_LIMIT_DELAY)
        r = client.get(BASE_URL, headers=HEADERS, params=params, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            return None
        return r.text
    except Exception as e:
        print(f"  iT邦 error: {e}")
        return None


def _parse_questions(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for block in soup.select(".search-qa-list"):
        link = block.select_one("a.search-qa-list__title-link")
        summary = block.select_one(".qa-list__summary")
        date_tag = block.select_one(".qa-list__info-time")
        if not link:
            continue
        items.append({
            "url": link.get("href", ""),
            "title": link.text.strip(),
            "summary": summary.text.strip() if summary else "",
            "date": date_tag.get("title", date_tag.text.strip())[:10] if date_tag else "",
            "type": "question",
        })
    return items


def _parse_articles(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for block in soup.select(".search-article-list, .article-list"):
        link = block.select_one("a[href*='/articles/']")
        summary = block.select_one(".article-list__summary, p")
        date_tag = block.select_one(".article-list__info-time, time, [class*=time]")
        if not link:
            continue
        items.append({
            "url": link.get("href", ""),
            "title": link.text.strip(),
            "summary": summary.text.strip() if summary else "",
            "date": date_tag.get("title", date_tag.text.strip())[:10] if date_tag else "",
            "type": "article",
        })
    return items


def _parse_date(date_str: str) -> datetime | None:
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d")
    except Exception:
        return None


def _is_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in KEYWORDS)


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen: set[str] = set()

    with httpx.Client() as client:
        for kw in KEYWORDS:
            for tab in TABS:
                for page in range(1, PAGES_PER_SEARCH + 1):
                    print(f"iT邦 [{kw}] {tab} p{page}...")
                    html = _get(client, {"tab": tab, "search": kw, "page": page})
                    if not html:
                        continue

                    items = _parse_questions(html) if tab == "question" else _parse_articles(html)
                    if not items:
                        break  # no more pages

                    for item in items:
                        url = item["url"]
                        if not url or url in seen:
                            continue

                        dt = _parse_date(item["date"])
                        if dt and dt < LOOKBACK:
                            continue

                        combined = f"{item['title']}\n\n{item['summary']}".strip()
                        if len(combined) < 15 or not _is_relevant(combined):
                            continue

                        seen.add(url)
                        source_id = url.rstrip("/").split("/")[-1]
                        mentions.append(RawMention(
                            source_id=f"ithelp_{source_id}",
                            content=combined,
                            metadata={
                                "title": item["title"],
                                "type": item["type"],
                                "url": url,
                                "date": item["date"],
                                "author": "",
                                "source": "ithelp",
                            },
                            content_hash=_hash(combined),
                        ))

    print(f"iT邦 total: {len(mentions)}")
    return mentions
