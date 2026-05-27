"""
Fetch unprocessed raw_mentions and run Groq extraction pipeline.
Usage: python -m pipeline.run_pipeline
"""
import os
from dotenv import load_dotenv

load_dotenv()

import httpx
from pipeline.extractor import run_batch_extraction

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates",
}


TOOL_KEYWORDS = ["Claude Code", "Cursor", "Trae", "Windsurf", "Codex"]

def fetch_unprocessed(limit: int = 200) -> list[dict]:
    with httpx.Client(timeout=30) as client:
        # 取得已處理的 raw_mention_id
        done_resp = client.get(
            f"{SUPABASE_URL}/rest/v1/extracted_insights",
            params={"select": "raw_mention_id", "limit": "10000"},
            headers=HEADERS,
        )
        done_ids = {r["raw_mention_id"] for r in (done_resp.json() if done_resp.status_code == 200 else [])}

        # 只抓有提到目標工具的內容（Supabase OR filter）
        keyword_filter = ",".join(f"content.ilike.*{kw}*" for kw in TOOL_KEYWORDS)
        resp = client.get(
            f"{SUPABASE_URL}/rest/v1/raw_mentions",
            params={
                "select": "id,content,source,metadata",
                "or": f"({keyword_filter})",
                "order": "crawled_at.desc",
                "limit": str(limit + len(done_ids)),
            },
            headers=HEADERS,
        )
        resp.raise_for_status()
        all_rows = resp.json()

        # 過濾掉已處理的
        return [r for r in all_rows if r["id"] not in done_ids][:limit]


def save_insights(rows: list[dict]) -> None:
    with httpx.Client(timeout=30) as client:
        for i in range(0, len(rows), 500):
            batch = rows[i : i + 500]
            resp = client.post(
                f"{SUPABASE_URL}/rest/v1/extracted_insights",
                json=batch,
                headers=HEADERS,
            )
            if resp.status_code not in (200, 201):
                print(f"  Supabase 錯誤 {resp.status_code}: {resp.text[:200]}")
            else:
                print(f"  已存 {len(batch)} 筆洞察")


def rescore() -> None:
    with httpx.Client(timeout=30) as client:
        resp = client.get(
            f"{SUPABASE_URL}/rest/v1/tools",
            params={"select": "name"},
            headers=HEADERS,
        )
        tools = resp.json()
        print(f"\n重新計算 {len(tools)} 款工具分數...")
        for t in tools:
            client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/recalculate_tool_score",
                json={"p_tool_name": t["name"]},
                headers=HEADERS,
            )
        client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/refresh_weekly_trends",
            json={},
            headers=HEADERS,
        )
        print("  分數更新完成")


def main() -> None:
    print("抓取未處理的原始資料...")
    unprocessed = fetch_unprocessed(limit=500)

    if not unprocessed:
        print("沒有待處理資料")
        return

    print(f"找到 {len(unprocessed)} 筆待處理，開始 Groq 抽取...")
    results = run_batch_extraction(unprocessed)

    if not results:
        print("抽取結果為空（可能都不符合目標工具）")
        rescore()
        return

    rows = [
        {
            "raw_mention_id": r.raw_mention_id,
            "tool_name": r.tool_name,
            "sentiment": r.sentiment,
            "use_cases": r.use_cases,
            "pain_points": r.pain_points,
            "target_audience": r.target_audience,
            "pricing_signal": r.pricing_signal,
            "comparisons": r.comparisons,
            "confidence": r.confidence,
            "raw_quote": r.raw_quote,
            # content_type: add column first via db/migrations/005_add_content_type.sql
            "source_url": r.source_url,
            "source_author": r.source_author,
            "source_platform": r.source_platform,
            "model_used": r.model_used,
        }
        for r in results
    ]

    save_insights(rows)
    rescore()
    print("\n全部完成！")


if __name__ == "__main__":
    main()
