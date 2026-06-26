"""
Per-tool pipeline: 每個工具各自隨機抽 30 則 raw_mentions → Groq 分析 → 存回 extracted_insights
Usage: python -m pipeline.run_pipeline
"""
import os
import random
from dotenv import load_dotenv

load_dotenv()

import httpx
from pipeline.extractor import run_batch_extraction
from pipeline.schema import TARGET_TOOLS

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
SAMPLE_PER_TOOL = 30

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates",
}

TOOL_KEYWORDS = {
    # 程式開發
    "Claude Code":   ["Claude Code"],
    "Cursor":        ["Cursor"],
    "Trae":          ["Trae"],
    "Windsurf":      ["Windsurf"],
    "Codex":         ["Codex", "openai codex"],
    "GitHub Copilot":["GitHub Copilot", "copilot"],
    "Replit":        ["Replit"],
    "Aider":         ["Aider", "aider.chat"],
    "Cline":         ["Cline", "cline.bot"],
    "Bolt":          ["Bolt", "bolt.new"],
    "Lovable":       ["Lovable", "lovable.dev"],
    "Devin":         ["Devin", "devin.ai"],
    # 自動化
    "n8n":           ["n8n"],
    "Make":          ["make.com", "Integromat", "Make automation"],
    "Zapier":        ["Zapier"],
    "Dify":          ["Dify"],
    # 圖像生成
    "Midjourney":    ["Midjourney", "mid journey"],
    "ComfyUI":       ["ComfyUI", "comfy ui"],
    "Adobe Firefly": ["Adobe Firefly", "Firefly"],
    "Ideogram":      ["Ideogram"],
    "Leonardo AI":   ["Leonardo AI", "Leonardo"],
    # 影片生成
    "Seedance":      ["Seedance"],
    "Kling":         ["Kling", "可靈", "keling"],
    "Runway":        ["Runway", "runwayml"],
    "Sora":          ["Sora", "openai sora"],
    "Pika":          ["Pika", "pika.art"],
    "Veo":           ["Veo", "google veo"],
    "Hailuo":        ["Hailuo", "海螺", "minimax video"],
    # 語音
    "ElevenLabs":    ["ElevenLabs", "eleven labs"],
    "Suno":          ["Suno", "suno.com"],
    "Udio":          ["Udio", "udio.com"],
    # 寫作
    "ChatGPT":       ["ChatGPT", "gpt-4o", "gpt-4"],
    "Notion AI":     ["Notion AI"],
    "Perplexity":    ["Perplexity"],
    "Grammarly":     ["Grammarly"],
    "Jasper":        ["Jasper", "jasper.ai"],
    "Copy.ai":       ["Copy.ai", "copyai"],
}


def fetch_for_tool(client: httpx.Client, tool: str) -> list[dict]:
    """隨機抽該工具的 30 則 raw_mentions（優先未處理過的）"""
    # 取得已處理的 id
    done_resp = client.get(
        f"{SUPABASE_URL}/rest/v1/extracted_insights",
        params={"select": "raw_mention_id", "tool_name": f"eq.{tool}", "limit": "10000"},
        headers=HEADERS,
    )
    done_ids = {r["raw_mention_id"] for r in (done_resp.json() if done_resp.status_code == 200 else [])}

    keywords = TOOL_KEYWORDS[tool]
    keyword_filter = ",".join(f"content.like.*{kw}*" for kw in keywords)

    resp = client.get(
        f"{SUPABASE_URL}/rest/v1/raw_mentions",
        params={
            "select": "id,content,source,metadata",
            "or": f"({keyword_filter})",
            "order": "crawled_at.desc",
            "limit": "500",
        },
        headers=HEADERS,
    )
    resp.raise_for_status()
    all_rows = resp.json()

    # 未處理的優先，不夠再補已處理的
    unprocessed = [r for r in all_rows if r["id"] not in done_ids]
    processed = [r for r in all_rows if r["id"] in done_ids]

    pool = unprocessed + processed
    return random.sample(pool, min(SAMPLE_PER_TOOL, len(pool)))


def save_insights(rows: list[dict]) -> None:
    with httpx.Client(timeout=30) as client:
        for i in range(0, len(rows), 500):
            batch = rows[i:i + 500]
            resp = client.post(
                f"{SUPABASE_URL}/rest/v1/extracted_insights",
                json=batch,
                headers=HEADERS,
            )
            if resp.status_code not in (200, 201):
                print(f"  Supabase 錯誤 {resp.status_code}: {resp.text[:200]}")
            else:
                print(f"  已存 {len(batch)} 筆")


def rescore() -> None:
    with httpx.Client(timeout=30) as client:
        for tool in TARGET_TOOLS:
            client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/recalculate_tool_score",
                json={"p_tool_name": tool},
                headers=HEADERS,
            )
        client.post(f"{SUPABASE_URL}/rest/v1/rpc/refresh_weekly_trends", json={}, headers=HEADERS)
    print("  分數更新完成")


def main() -> None:
    with httpx.Client(timeout=30) as client:
        for tool in sorted(TARGET_TOOLS):
            print(f"\n── {tool} ──")
            mentions = fetch_for_tool(client, tool)
            if not mentions:
                print(f"  沒有 raw_mentions，跳過")
                continue
            print(f"  抽到 {len(mentions)} 則，送 Groq...")
            results = run_batch_extraction(mentions)
            if not results:
                print(f"  Groq 未產出有效結果")
                continue
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
                    "source_url": r.source_url,
                    "source_author": r.source_author,
                    "source_platform": r.source_platform,
                    "model_used": r.model_used,
                }
                for r in results
            ]
            save_insights(rows)
            print(f"  {tool} 完成：{len(rows)} 筆有效洞察")

    print("\n重新計算分數...")
    rescore()
    print("全部完成！")


if __name__ == "__main__":
    main()
