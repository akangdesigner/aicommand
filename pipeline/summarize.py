"""
Lightweight community summary — 1 Groq call per tool (30 mentions sampled).
Saves result to extracted_insights with confidence=0.95.
Usage: python -m pipeline.summarize
"""
import asyncio
import json
import os
import random

import httpx
from dotenv import load_dotenv
from groq import AsyncGroq

from crawler.filter import is_genuine_review

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

TOOLS = [
    ("Cursor",      "cursor"),
    ("Trae",        "trae"),
    ("Codex",       "codex"),
]

SYSTEM_PROMPT = """You are an AI tool analyst. Given community discussions about an AI coding tool, analyze and summarize the community's real opinion.

Output rules:
- community_summary: 繁體中文，80–120 字自然段落，描述整體評價、主要用途、明顯優缺點。語氣像科技媒體評論，必須具體（引用功能名稱、實際場景），不要廢話。
- use_cases: 繁體中文，每項必須具體說明是哪個功能或場景，例如「用 Cascade agent 自動重構跨 10 個檔案的 API 介面」而非「程式碼生成」。
- pain_points: 繁體中文，每項必須具體，例如「context window 用盡時突然停止，需手動重啟」而非「有時不穩定」。
- target_audience: 繁體中文
- sentiment: English only (positive / negative / mixed)
- pricing_feel: 繁體中文一句話，必須提到實際金額或方案名稱，或空字串。

Return JSON:
{
  "community_summary": "一段具體的自然段落",
  "use_cases": ["最多 5 項，每項具體說明功能或場景"],
  "pain_points": ["最多 5 項，每項具體說明問題"],
  "target_audience": ["最多 3 項"],
  "sentiment": "positive|negative|mixed",
  "pricing_feel": "含金額或方案名稱的一句話，或空字串"
}"""


SOURCE_PRIORITY = {"ptt": 0, "dcard": 1, "threads": 2, "reddit": 3, "hn": 4, "github": 5}

def fetch_mentions(tool_name: str, limit: int = 30) -> list[dict]:
    with httpx.Client(timeout=30) as client:
        resp = client.get(
            f"{SUPABASE_URL}/rest/v1/raw_mentions",
            params={
                "select": "id,content,source",
                "content": f"ilike.*{tool_name}*",
                "limit": str(limit * 10),  # 拿多一點再過濾
            },
            headers=HEADERS,
        )
        rows = resp.json() if resp.status_code == 200 else []

    # 過濾：長度 > 80 且通過評論過濾器
    valid = [
        r for r in rows
        if r.get("content") and len(r["content"]) > 80
        and is_genuine_review(r["content"])
    ]

    # 依來源品質排序（Reddit/HN 優先），同來源隨機打散
    random.shuffle(valid)
    valid.sort(key=lambda r: SOURCE_PRIORITY.get(r.get("source", ""), 9))
    return valid[:limit]


async def summarize_tool(client: AsyncGroq, tool_name: str) -> dict | None:
    mentions = fetch_mentions(tool_name)
    if not mentions:
        print(f"  {tool_name}: 沒有資料")
        return None

    blocks = "\n\n".join(f"[{i+1}]\n{m['content'][:600]}" for i, m in enumerate(mentions))
    user_msg = f"以下是關於 {tool_name} 的 {len(mentions)} 則社群討論：\n\n{blocks}"

    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=512,
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            text = resp.choices[0].message.content or ""
            t = text.strip()
            if "```json" in t:
                t = t.split("```json")[1].split("```")[0].strip()
            data = json.loads(t)
            data["_mention_id"] = mentions[0]["id"]
            print(f"  {tool_name}: sentiment={data.get('sentiment')} pros={len(data.get('use_cases', []))} cons={len(data.get('pain_points', []))}")
            return data
        except Exception as e:
            err = str(e)
            if "429" in err or "rate_limit" in err.lower():
                print(f"  {tool_name}: rate limit，等 70s...")
                await asyncio.sleep(70)
            else:
                print(f"  {tool_name}: 錯誤 {err[:80]}")
                return None
    return None


def save_summary(tool_name: str, slug: str, data: dict) -> None:
    row = {
        "raw_mention_id": data["_mention_id"],
        "tool_name": tool_name,
        "use_cases": data.get("use_cases", []),
        "pain_points": data.get("pain_points", []),
        "target_audience": data.get("target_audience", []),
        "sentiment": data.get("sentiment"),
        "pricing_signal": data.get("pricing_feel") or None,
        "comparisons": [],
        "confidence": 0.95,
        "raw_quote": data.get("community_summary") or None,  # 段落摘要存在 raw_quote
        "model_used": "llama-3.1-8b-instant",
    }
    with httpx.Client(timeout=30) as client:
        resp = client.post(
            f"{SUPABASE_URL}/rest/v1/extracted_insights",
            json=row,
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
        )
        if resp.status_code in (200, 201):
            print(f"  → {tool_name} 已存入 extracted_insights")
        else:
            print(f"  → 存入失敗 {resp.status_code}: {resp.text[:150]}")


async def main() -> None:
    client = AsyncGroq(api_key=GROQ_API_KEY)
    print("開始摘要（每個工具 1 次 Groq call）...\n")

    for tool_name, slug in TOOLS:
        print(f"[{tool_name}]")
        data = await summarize_tool(client, tool_name)
        if data:
            save_summary(tool_name, slug, data)
        await asyncio.sleep(30)

    print("\n全部完成！")


if __name__ == "__main__":
    asyncio.run(main())
