"""
PTT crawler via web interface (over18 cookie, no login required).
Searches Soft_Job and AI_ML_Data boards for AI tool mentions.
"""
import hashlib
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from crawler.filter import is_genuine_review

BASE_URL = "https://www.ptt.cc"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ai-tool-discovery/1.0)",
    "Cookie": "over18=1",
}

KEYWORDS = ["Claude Code", "Cursor", "Windsurf", "Trae", "Codex"]
BOARDS = ["Soft_Job", "C_Chat", "Programming"]
PAGES_PER_SEARCH = 3
RATE_LIMIT_DELAY = 1.5
THREE_MONTHS_AGO = datetime.now() - timedelta(days=90)


@dataclass
class RawMention:
    source: str = "ptt"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _get(client: httpx.Client, url: str, params: dict = {}) -> str | None:
    try:
        time.sleep(RATE_LIMIT_DELAY)
        r = client.get(url, headers=HEADERS, params=params, timeout=30, follow_redirects=True)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  PTT error {url[-60:]}: {e}")
        return None


def _parse_article_list(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    articles = []
    for ent in soup.select("div.r-ent"):
        title_tag = ent.select_one("div.title a")
        if not title_tag:
            continue
        articles.append({
            "href": title_tag.get("href", ""),
            "title": title_tag.text.strip(),
            "date_str": (ent.select_one("div.date") or type("", (), {"text": ""})()).text.strip(),
            "author": (ent.select_one("div.author") or type("", (), {"text": ""})()).text.strip(),
        })
    return articles


def _parse_article_body(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="main-content")
    if not main:
        return ""
    for tag in main.select("span.article-meta-tag, span.article-meta-value, div.push"):
        tag.decompose()
    text = main.get_text("\n").strip()
    if "\n--\n" in text:
        text = text.split("\n--\n")[0]
    return text[:2000].strip()


def _parse_date(date_str: str) -> datetime | None:
    try:
        parts = date_str.strip().split("/")
        if len(parts) != 2:
            return None
        now = datetime.now()
        dt = datetime(now.year, int(parts[0]), int(parts[1]))
        if dt > now:
            dt = datetime(now.year - 1, int(parts[0]), int(parts[1]))
        return dt
    except Exception:
        return None


def _is_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in KEYWORDS)


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen: set[str] = set()

    with httpx.Client() as client:
        for board in BOARDS:
            for kw in KEYWORDS:
                for page in range(1, PAGES_PER_SEARCH + 1):
                    search_url = f"{BASE_URL}/bbs/{board}/search"
                    print(f"PTT {board} [{kw}] p{page}...")
                    html = _get(client, search_url, {"q": kw, "page": page})
                    if not html:
                        continue

                    for art in _parse_article_list(html):
                        href = art["href"]
                        if not href or href in seen:
                            continue

                        dt = _parse_date(art["date_str"])
                        if dt and dt < THREE_MONTHS_AGO:
                            continue

                        art_html = _get(client, BASE_URL + href, {})
                        body = _parse_article_body(art_html) if art_html else ""

                        combined = f"{art['title']}\n\n{body}".strip()
                        if len(combined) < 30 or not _is_relevant(combined) or not is_genuine_review(combined):
                            continue

                        seen.add(href)
                        slug = href.replace("/bbs/", "").replace(".html", "").replace("/", "_")
                        mentions.append(RawMention(
                            source_id=f"ptt_{slug}",
                            content=combined,
                            metadata={
                                "title": art["title"],
                                "board": board,
                                "author": art["author"],
                                "url": BASE_URL + href,
                                "source": "ptt",
                                "type": "post",
                            },
                            content_hash=_hash(combined),
                        ))

    print(f"PTT total: {len(mentions)}")
    return mentions
