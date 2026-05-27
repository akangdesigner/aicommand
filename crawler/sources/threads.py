"""
Threads crawler using Playwright.
Removes login modal via JS, searches and scrolls to collect posts.
"""
import hashlib
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

from crawler.filter import is_genuine_review

SEARCH_URL = "https://www.threads.net/search?q={keyword}&serp_type=default"
KEYWORDS = ["Claude Code", "Cursor", "Windsurf", "Trae", "Codex"]
SCROLL_ROUNDS = 3
THREE_MONTHS_AGO = datetime.now(timezone.utc) - timedelta(days=90)

REMOVE_MODAL_JS = """
document.querySelectorAll('[role="dialog"],[class*="Modal"],[class*="modal"]').forEach(e => e.remove());
document.body.style.overflow = 'auto';
"""

EXTRACT_JS = """
const items = [];
const seen = new Set();
document.querySelectorAll('[data-pressable-container]').forEach(el => {
  const link = el.querySelector('a[href*="/post/"]');
  const text = el.innerText?.trim();
  if (!link || !text || text.length < 30) return;
  const href = link.href;
  if (seen.has(href)) return;
  seen.add(href);
  const lines = text.split('\\n').filter(l => l.trim());
  items.push({
    href,
    author: lines[0] || '',
    date_str: lines[1] || '',
    content: lines.slice(2).join(' ').slice(0, 500),
  });
});
JSON.stringify(items);
"""


@dataclass
class RawMention:
    source: str = "threads"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _parse_date(date_str: str) -> datetime | None:
    """Parse Threads date: '2026-1-23' or relative '15小時' '3天'."""
    try:
        # Absolute date: 2026-1-23
        m = re.match(r"(\d{4})-(\d{1,2})-(\d{1,2})", date_str)
        if m:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=timezone.utc)
        # Relative: N小時, N分鐘, N天, Nh, Nm, Nd
        if re.search(r"\d+\s*(小時|h)", date_str):
            return datetime.now(timezone.utc)
        if re.search(r"\d+\s*(分鐘|m)", date_str):
            return datetime.now(timezone.utc)
        days = re.search(r"(\d+)\s*(天|d)", date_str)
        if days:
            return datetime.now(timezone.utc) - timedelta(days=int(days.group(1)))
        weeks = re.search(r"(\d+)\s*(週|w)", date_str)
        if weeks:
            return datetime.now(timezone.utc) - timedelta(weeks=int(weeks.group(1)))
    except Exception:
        pass
    return None


def _is_relevant(text: str) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in KEYWORDS)


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
            print(f"Threads [{kw}]...")
            try:
                page.goto(url, timeout=30000, wait_until="networkidle")
                page.wait_for_selector("[data-pressable-container]", timeout=10000)
            except PWTimeout:
                continue
            except Exception as e:
                print(f"  Threads error [{kw}]: {e}")
                continue

            # Remove modal and scroll to load more
            page.evaluate(REMOVE_MODAL_JS)
            for _ in range(SCROLL_ROUNDS):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)
                page.evaluate(REMOVE_MODAL_JS)

            # Extract all visible posts
            raw = page.evaluate(EXTRACT_JS)
            import json
            posts = json.loads(raw)

            for p in posts:
                href = p.get("href", "")
                if not href or href in seen:
                    continue

                dt = _parse_date(p.get("date_str", ""))
                if dt and dt < THREE_MONTHS_AGO:
                    continue

                content = p.get("content", "").strip()
                if len(content) < 20 or not _is_relevant(content) or not is_genuine_review(content):
                    continue

                m = re.search(r"/post/([^/?]+)", href)
                post_id = m.group(1) if m else href.split("/")[-1]

                seen.add(href)
                mentions.append(RawMention(
                    source_id=f"threads_{post_id}",
                    content=content,
                    metadata={
                        "title": content[:60],
                        "author": p.get("author", ""),
                        "url": href,
                        "date_str": p.get("date_str", ""),
                        "source": "threads",
                        "type": "post",
                    },
                    content_hash=_hash(content),
                ))

        browser.close()

    print(f"Threads total: {len(mentions)}")
    return mentions
