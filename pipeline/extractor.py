"""
AI extraction pipeline using Groq API.
Uses async concurrent requests with rate limiting (30 req/min free tier).
Model: llama-3.3-70b-versatile for quality extraction.
"""
import asyncio
import json
import os
from dataclasses import dataclass

from groq import AsyncGroq

from pipeline.schema import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_TEMPLATE,
    normalize_tool_name,
)

MODEL = "llama-3.1-8b-instant"
MIN_CONTENT_LENGTH = 50
CONCURRENCY = 2        # 2 parallel requests → ~24 RPM safely under 30 RPM limit
RATE_LIMIT_DELAY = 5.0  # seconds per worker → 2 workers × 12 req/min = 24 RPM
MAX_RETRIES = 3


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
    model_used: str = MODEL
    error: str | None = None


def _parse_response(raw_mention_id: int, text: str) -> ExtractionResult:
    try:
        # Strip markdown code blocks if present
        t = text.strip()
        if "```json" in t:
            t = t.split("```json")[1].split("```")[0].strip()
        elif "```" in t:
            t = t.split("```")[1].split("```")[0].strip()

        data = json.loads(t)
        return ExtractionResult(
            raw_mention_id=raw_mention_id,
            tool_name=normalize_tool_name(data.get("tool_name")),
            sentiment=data.get("sentiment"),
            use_cases=data.get("use_cases") or [],
            pain_points=data.get("pain_points") or [],
            target_audience=data.get("target_audience") or [],
            pricing_signal=data.get("pricing_signal"),
            comparisons=data.get("comparisons") or [],
            confidence=float(data.get("confidence") or 0.5),
            raw_quote=data.get("raw_quote"),
        )
    except Exception as e:
        return ExtractionResult(
            raw_mention_id=raw_mention_id,
            tool_name=None, sentiment=None,
            use_cases=[], pain_points=[], target_audience=[],
            pricing_signal=None, comparisons=[],
            confidence=0.0, raw_quote=None,
            error=str(e),
        )


async def _extract_one(client: AsyncGroq, mention_id: int, content: str, semaphore: asyncio.Semaphore) -> ExtractionResult:
    async with semaphore:
        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                        {"role": "user", "content": EXTRACTION_USER_TEMPLATE.format(content=content[:2000])},
                    ],
                    max_tokens=512,
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                text = resp.choices[0].message.content or ""
                await asyncio.sleep(RATE_LIMIT_DELAY)
                return _parse_response(mention_id, text)
            except Exception as e:
                err = str(e)
                if "429" in err or "rate_limit" in err.lower():
                    wait = 30 * (attempt + 1)  # 30s, 60s, 90s
                    print(f"  Rate limit hit, waiting {wait}s (attempt {attempt+1}/{MAX_RETRIES})...")
                    await asyncio.sleep(wait)
                    continue
                await asyncio.sleep(RATE_LIMIT_DELAY)
                return ExtractionResult(
                    raw_mention_id=mention_id,
                    tool_name=None, sentiment=None,
                    use_cases=[], pain_points=[], target_audience=[],
                    pricing_signal=None, comparisons=[],
                    confidence=0.0, raw_quote=None,
                    error=err,
                )
        return ExtractionResult(
            raw_mention_id=mention_id,
            tool_name=None, sentiment=None,
            use_cases=[], pain_points=[], target_audience=[],
            pricing_signal=None, comparisons=[],
            confidence=0.0, raw_quote=None,
            error="max retries exceeded",
        )


async def _run_async(mentions: list[dict]) -> list[ExtractionResult]:
    client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    semaphore = asyncio.Semaphore(CONCURRENCY)

    tasks = [
        _extract_one(client, m["id"], m["content"], semaphore)
        for m in mentions
    ]

    results = []
    total = len(tasks)
    for i, coro in enumerate(asyncio.as_completed(tasks), 1):
        result = await coro
        results.append(result)
        if i % 50 == 0:
            valid = sum(1 for r in results if r.tool_name and not r.error)
            print(f"  Progress: {i}/{total} | valid: {valid}")

    return results


def run_batch_extraction(mentions: list[dict]) -> list[ExtractionResult]:
    """
    Extract structured insights from raw mentions using Groq.
    mentions: list of {id: int, content: str}
    """
    valid = [m for m in mentions if len(m.get("content", "")) >= MIN_CONTENT_LENGTH]
    print(f"Extracting {len(valid)} mentions (filtered {len(mentions) - len(valid)} too short)...")

    results = asyncio.run(_run_async(valid))

    good = [r for r in results if r.tool_name and r.confidence >= 0.4 and not r.error]
    errors = [r for r in results if r.error]
    print(f"Done: {len(good)} valid | {len(errors)} errors | {len(results) - len(good) - len(errors)} no-tool")
    return good
