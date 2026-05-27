"""
Official website crawler.
Fetches tool homepages + pricing pages, extracts structured info via Groq,
then PATCHes tools.official_info in Supabase.
"""
import asyncio
import json
import os
import re

import httpx
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

GROQ_MODEL = "llama-3.3-70b-versatile"

OFFICIAL_PAGES: dict[str, list[str]] = {
    "claude-code": [
        "https://docs.anthropic.com/en/docs/claude-code/overview",
        "https://www.anthropic.com/pricing",
    ],
    "cursor": [
        "https://cursor.com",
        "https://cursor.com/pricing",
    ],
    "trae": [
        "https://trae.ai",
    ],
    "windsurf": [
        "https://codeium.com/windsurf",
        "https://codeium.com/pricing",
    ],
    "codex": [
        "https://platform.openai.com/docs/guides/codex",
        "https://openai.com/index/openai-codex",
    ],
}

EXTRACTION_PROMPT = """你是一個客觀的 AI 工具資料整理員。
從以下官方網頁文字中，提取這個工具的基本資訊。
只使用網頁上明確寫出的資訊，不要推測或補充。

請回傳以下 JSON 格式（繁體中文）：
{
  "tagline": "一句話官方標語（英文保留英文）",
  "made_by": "開發公司名稱",
  "official_description": "官方產品說明（2-3句，繁體中文翻譯）",
  "key_features": ["功能1", "功能2", "功能3"],
  "pricing": [
    {"tier": "方案名稱", "price": "價格", "note": "補充說明"}
  ]
}

如果某個欄位在網頁中找不到明確資訊，設為 null 或空陣列。"""


def _extract_text(html: str) -> str:
    """Strip HTML tags and normalize whitespace."""
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _fetch_page(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ai-tool-discovery/1.0; research bot)",
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        with httpx.Client(timeout=20, follow_redirects=True) as client:
            resp = client.get(url, headers=headers)
            resp.raise_for_status()
            return _extract_text(resp.text)[:4000]
    except Exception as e:
        print(f"  Fetch error {url}: {e}")
        return ""


async def _extract_official_info(slug: str, pages: list[str]) -> dict:
    combined_text = ""
    for url in pages:
        print(f"  Fetching {url}...")
        text = _fetch_page(url)
        if text:
            combined_text += f"\n\n=== {url} ===\n{text}"

    if not combined_text.strip():
        print(f"  No content fetched for {slug}")
        return {}

    client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    try:
        resp = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content": f"工具 slug: {slug}\n\n網頁內容：\n{combined_text[:6000]}"},
            ],
            max_tokens=1024,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        return json.loads(text)
    except Exception as e:
        print(f"  Groq error for {slug}: {e}")
        return {}


async def _patch_official_info(slug: str, info: dict) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{SUPABASE_URL}/rest/v1/tools",
            params={"slug": f"eq.{slug}"},
            json={"official_info": info},
            headers=HEADERS_SB,
        )
        if resp.status_code in (200, 204):
            print(f"  OK {slug} official_info saved")
        else:
            print(f"  FAIL {slug} patch failed: {resp.status_code} {resp.text}")


async def run_official_crawl_async() -> None:
    for slug, pages in OFFICIAL_PAGES.items():
        print(f"\n[{slug}] 抓取官方資料...")
        info = await _extract_official_info(slug, pages)
        if info:
            await _patch_official_info(slug, info)
        await asyncio.sleep(2)


def run_official_crawl() -> None:
    asyncio.run(run_official_crawl_async())


if __name__ == "__main__":
    run_official_crawl()
