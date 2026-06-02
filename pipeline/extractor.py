"""
AI extraction pipeline using Groq API.
Sequential batch processing — avoids thundering-herd 429 cascades.
BATCH_SIZE=5 means 5x fewer API calls vs per-mention approach.
"""
import asyncio
import json
import os
from dataclasses import dataclass

from groq import AsyncGroq

from pipeline.schema import (
    EXTRACTION_BATCH_SYSTEM_PROMPT,
    TARGET_TOOLS,
    normalize_tool_name,
    validate_make_context,
)

MODEL = "llama-3.1-8b-instant"
MIN_CONTENT_LENGTH = 50
BATCH_SIZE = 5
RATE_LIMIT_DELAY = 5.0
MAX_RETRIES = 2


@dataclass
class ExtractionResult:
    raw_mention_id: int
    tool_name: str | None
    sentiment: str | None
    use_cases: list[str]
    pain_points: list[str]
    target_audience: list[str]
    pricing_signal: str | None
    comparisons: list[dict]
    confidence: float
    raw_quote: str | None
    content_type: str | None = None
    source_url: str | None = None
    source_author: str | None = None
    source_platform: str | None = None
    model_used: str = MODEL
    error: str | None = None


def _empty(mention_id: int, error: str) -> ExtractionResult:
    return ExtractionResult(
        raw_mention_id=mention_id,
        tool_name=None, sentiment=None,
        use_cases=[], pain_points=[], target_audience=[],
        pricing_signal=None, comparisons=[],
        confidence=0.0, raw_quote=None,
        error=error,
    )


def _parse_one_obj(mention_id: int, data: dict) -> ExtractionResult:
    return ExtractionResult(
        raw_mention_id=mention_id,
        tool_name=normalize_tool_name(data.get("tool_name")),
        sentiment=data.get("sentiment"),
        use_cases=data.get("use_cases") or [],
        pain_points=data.get("pain_points") or [],
        target_audience=data.get("target_audience") or [],
        pricing_signal=data.get("pricing_signal"),
        comparisons=data.get("comparisons") or [],
        confidence=float(data.get("confidence") or 0.5),
        raw_quote=data.get("raw_quote"),
        content_type=data.get("content_type"),
    )


def _parse_batch_response(mention_ids: list[int], text: str) -> list[ExtractionResult]:
    try:
        t = text.strip()
        if "```json" in t:
            t = t.split("```json")[1].split("```")[0].strip()
        elif "```" in t:
            t = t.split("```")[1].split("```")[0].strip()
        items = json.loads(t).get("results", [])
        results = []
        for i, mid in enumerate(mention_ids):
            if i < len(items) and isinstance(items[i], dict):
                results.append(_parse_one_obj(mid, items[i]))
            else:
                results.append(_empty(mid, "missing in batch response"))
        return results
    except Exception as e:
        return [_empty(mid, str(e)) for mid in mention_ids]


def _build_batch_user_msg(batch: list[dict]) -> str:
    blocks = "\n\n".join(f"[{i+1}]\n{m['content'][:1500]}" for i, m in enumerate(batch))
    schema = (
        '{"tool_name":"Claude Code"|"Cursor"|"Trae"|"Windsurf"|"Codex"|"n8n"|"Make(=make.com automation)"|"Zapier"|"Dify"|null,'
        '"sentiment":"positive"|"negative"|"neutral"|"mixed"|null,'
        '"use_cases":[],"pain_points":[],"target_audience":[],'
        '"pricing_signal":null,"comparisons":[{"tool":str,"verdict":str}],'
        '"confidence":0.0,"raw_quote":null}'
    )
    return (
        f"以下 {len(batch)} 筆社群討論，請依序提取 AI 工具資訊：\n\n"
        f"{blocks}\n\n"
        f"Each item schema: {schema}\n"
        f'Return: {{"results": [<{len(batch)} objects in order>]}}'
    )


async def _process_batch(client: AsyncGroq, batch: list[dict]) -> list[ExtractionResult]:
    mention_ids = [m["id"] for m in batch]

    for attempt in range(MAX_RETRIES):
        try:
            resp = await client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": EXTRACTION_BATCH_SYSTEM_PROMPT},
                    {"role": "user", "content": _build_batch_user_msg(batch)},
                ],
                max_tokens=2048,
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            text = resp.choices[0].message.content or ""
            await asyncio.sleep(RATE_LIMIT_DELAY)
            return _parse_batch_response(mention_ids, text)
        except Exception as e:
            err = str(e)
            if "429" in err or "rate_limit" in err.lower():
                backoff = 30 * (attempt + 1)
                print(f"  Rate limit, waiting {backoff}s (attempt {attempt+1}/{MAX_RETRIES})")
                await asyncio.sleep(backoff)
            else:
                print(f"  Error: {err[:100]}")
                return [_empty(mid, err) for mid in mention_ids]

    return [_empty(mid, "max retries exceeded") for mid in mention_ids]


async def _run_async(mentions: list[dict]) -> list[ExtractionResult]:
    client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    meta_lookup: dict[int, dict] = {m["id"]: m.get("metadata") or {} for m in mentions}
    batches = [mentions[i:i + BATCH_SIZE] for i in range(0, len(mentions), BATCH_SIZE)]
    total = len(batches)

    all_results: list[ExtractionResult] = []
    for i, batch in enumerate(batches, 1):
        batch_results = await _process_batch(client, batch)
        for result in batch_results:
            meta = meta_lookup.get(result.raw_mention_id, {})
            result.source_url = meta.get("url")
            result.source_author = meta.get("author")
            result.source_platform = meta.get("source") or meta.get("type")
        all_results.extend(batch_results)
        if i % 10 == 0 or i == total:
            valid = sum(1 for r in all_results if r.tool_name and not r.error)
            print(f"  Batches: {i}/{total} | mentions: {len(all_results)} | valid: {valid}")

    return all_results


def run_batch_extraction(mentions: list[dict]) -> list[ExtractionResult]:
    """
    Extract structured insights from raw mentions using Groq.
    mentions: list of {id: int, content: str, metadata: dict}
    """
    valid = [m for m in mentions if len(m.get("content", "")) >= MIN_CONTENT_LENGTH]
    print(f"Extracting {len(valid)} mentions ({total_batches(len(valid))} batches × ~5s = ~{eta(len(valid))}min)...")

    results = asyncio.run(_run_async(valid))

    content_by_id = {m["id"]: m.get("content", "") for m in mentions}
    good = [
        r for r in results
        if r.tool_name in TARGET_TOOLS
        and r.confidence >= 0.6
        and not r.error
        and r.content_type == "review"
        and validate_make_context(r.tool_name, content_by_id.get(r.raw_mention_id, ""))
    ]
    errors = [r for r in results if r.error]
    print(f"Done: {len(good)} valid | {len(errors)} errors | {len(results) - len(good) - len(errors)} no-tool")
    return good


def total_batches(n: int) -> int:
    return (n + BATCH_SIZE - 1) // BATCH_SIZE


def eta(n: int) -> int:
    return round(total_batches(n) * RATE_LIMIT_DELAY / 60)
