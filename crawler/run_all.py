"""
Run all crawlers and save raw mentions to Supabase.
Usage: python -m crawler.run_all [--sources ptt,dcard,threads,reddit,hn,github]
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

import httpx

from crawler.sources import ptt as ptt_crawler
from crawler.sources import dcard as dcard_crawler
from crawler.sources import threads as threads_crawler
from crawler.sources import reddit as reddit_crawler
from crawler.sources import hackernews as hn_crawler
from crawler.sources import github as github_crawler

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates",
}

ALL_SOURCES = {
    "ptt":    ("PTT",        ptt_crawler.run_full_crawl),
    "dcard":  ("Dcard",      dcard_crawler.run_full_crawl),
    "threads":("Threads",    threads_crawler.run_full_crawl),
    "reddit": ("Reddit",     reddit_crawler.run_full_crawl),
    "hn":     ("HackerNews", hn_crawler.run_full_crawl),
    "github": ("GitHub",     github_crawler.run_full_crawl),
}


def run_crawler(label: str, fn) -> list:
    print(f"\n{'─'*40}\n  {label}\n{'─'*40}")
    try:
        mentions = fn()
        print(f"  → {len(mentions)} 筆")
        return mentions
    except Exception as e:
        print(f"  → 錯誤: {e}")
        return []


def save_rows(rows: list[dict]) -> None:
    with httpx.Client(timeout=30) as client:
        for i in range(0, len(rows), 500):
            batch = rows[i : i + 500]
            resp = client.post(
                f"{SUPABASE_URL}/rest/v1/raw_mentions?on_conflict=source,source_id",
                json=batch,
                headers={**HEADERS, "Prefer": "return=representation,resolution=ignore-duplicates"},
            )
            if resp.status_code in (200, 201):
                inserted = len(resp.json()) if resp.text and resp.text != "[]" else 0
                print(f"  批次 {i//500+1}: {inserted} 筆新增，{len(batch)-inserted} 筆重複略過")
            else:
                print(f"  Supabase 錯誤 {resp.status_code}: {resp.text[:200]}")


def main(sources: list[str]) -> None:
    all_mentions = []

    for key in sources:
        if key not in ALL_SOURCES:
            print(f"未知來源: {key}，略過")
            continue
        label, fn = ALL_SOURCES[key]
        mentions = run_crawler(label, fn)
        all_mentions.extend(mentions)

    total = len(all_mentions)
    print(f"\n{'='*40}\n  總計 {total} 筆原始資料\n{'='*40}")

    if not total:
        print("  無資料可儲存")
        return

    rows = [
        {
            "source": m.source,
            "source_id": m.source_id,
            "content": m.content,
            "metadata": m.metadata,
            "content_hash": m.content_hash,
        }
        for m in all_mentions
    ]

    print("  存入 Supabase...")
    save_rows(rows)
    print("  完成！")


if __name__ == "__main__":
    sources = list(ALL_SOURCES.keys())
    if "--sources" in sys.argv:
        idx = sys.argv.index("--sources")
        sources = sys.argv[idx + 1].split(",")

    main(sources)
