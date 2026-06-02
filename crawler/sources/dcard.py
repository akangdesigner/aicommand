"""
Dcard crawler using Playwright (headless Chromium to bypass Cloudflare).
Requires: pip install playwright && playwright install chromium
"""
import hashlib
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

from crawler.filter import is_genuine_review

SEARCH_URL = "https://www.dcard.tw/search?query={keyword}&tab=post"
KEYWORDS = [
    "Claude Code", "Cursor", "Windsurf", "Trae", "Codex",
    "n8n", "Zapier", "make.com", "Dify",
    "Midjourney", "可靈", "ChatGPT", "Notion AI",
]
THREE_MONTHS_AGO = datetime.now(timezone.utc) - timedelta(days=90)
DATE_RE = re.compile(r"^(\d{2}/\d{1,2}/\d{1,2}|\d{1,2}/\d{1,2})$")


@dataclass
class RawMention:
    source: str = "dcard"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _parse_date(date_str: str) -> datetime | None:
    """Parse Dcard date formats: MM/DD or YY/MM/DD → datetime (UTC)."""
    try:
        parts = date_str.strip().split("/")
        now = datetime.now()
        if len(parts) == 3:
            year = 2000 + int(parts[0])
            dt = datetime(year, int(parts[1]), int(parts[2]), tzinfo=timezone.utc)
        elif len(parts) == 2:
            dt = datetime(now.year, int(parts[0]), int(parts[1]), tzinfo=timezone.utc)
            if dt > datetime.now(timezone.utc):
                dt = datetime(now.year - 1, int(parts[0]), int(parts[1]), tzinfo=timezone.utc)
        else:
            return None
        return dt
    except Exception:
        return None


def _is_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in KEYWORDS)


def _extract_posts(page) -> list[dict]:
    return page.evaluate("""() => {
        const posts = [];
        document.querySelectorAll('article').forEach(a => {
            const link = a.querySelector('a[href*="/p/"]');
            if (!link) return;
            const lines = a.innerText.split('\\n').map(l => l.trim()).filter(Boolean);
            // Find date line index
            let dateIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (/^(\\d{2}\\/\\d{1,2}\\/\\d{1,2}|\\d{1,2}\\/\\d{1,2})$/.test(lines[i])) {
                    dateIdx = i;
                    break;
                }
            }
            const title   = dateIdx >= 0 ? (lines[dateIdx + 1] || '') : '';
            const excerpt = dateIdx >= 0 ? (lines[dateIdx + 2] || '') : '';
            posts.push({
                href:    link.href,
                forum:   lines[dateIdx > 0 ? dateIdx - 2 : 0] || '',
                date:    dateIdx >= 0 ? lines[dateIdx] : '',
                title,
                excerpt,
            });
        });
        return posts;
    }""")


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen: set[str] = set()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="zh-TW",
        )
        page = context.new_page()

        for kw in KEYWORDS:
            url = SEARCH_URL.format(keyword=kw.replace(" ", "+"))
            print(f"Dcard [{kw}]...")
            try:
                page.goto(url, timeout=30000, wait_until="networkidle")
                page.wait_for_selector("article", timeout=10000)
            except PWTimeout:
                continue  # no results for this keyword
            except Exception as e:
                print(f"  Dcard error [{kw}]: {e}")
                continue

            posts = _extract_posts(page)
            for p in posts:
                href = p.get("href", "")
                if not href or href in seen:
                    continue

                # Extract post ID from URL
                m = re.search(r"/p/(\d+)", href)
                post_id = m.group(1) if m else href

                # Date filter
                dt = _parse_date(p.get("date", ""))
                if dt and dt < THREE_MONTHS_AGO:
                    continue

                title = p.get("title", "")
                excerpt = p.get("excerpt", "")
                combined = f"{title}\n\n{excerpt}".strip()

                if len(combined) < 20 or not _is_relevant(combined) or not is_genuine_review(combined):
                    continue

                seen.add(href)
                forum = p.get("forum", "")
                mentions.append(RawMention(
                    source_id=f"dcard_{post_id}",
                    content=combined,
                    metadata={
                        "title": title,
                        "forum": forum,
                        "url": href,
                        "author": "",
                        "source": "dcard",
                        "type": "post",
                    },
                    content_hash=_hash(combined),
                ))

        browser.close()

    print(f"Dcard total: {len(mentions)}")
    return mentions
