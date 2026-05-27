"""
FastAPI routes — crawl triggers and data API.
Supabase handles most read queries directly; this API handles:
1. Crawl trigger endpoints (called by n8n)
2. Write operations (Reddit PRAW requires Python)
3. Score recalculation
"""
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel

from crawler.sources import reddit as reddit_crawler
from crawler.sources import hackernews as hn_crawler
from crawler.sources import github as github_crawler
from crawler.sources import official as official_crawler
from crawler.sources import ptt as ptt_crawler
from crawler.sources import dcard as dcard_crawler
from crawler.sources import threads as threads_crawler
from pipeline.extractor import run_batch_extraction

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # Service role key for writes

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates",  # Skip on UNIQUE conflict
}


async def supabase_insert(table: str, rows: list[dict]) -> dict:
    """Insert rows into Supabase table."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            json=rows,
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json() if resp.text else {}


async def supabase_rpc(func: str, params: dict = {}) -> dict:
    """Call a Supabase PostgreSQL function."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/{func}",
            json=params,
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json() if resp.text else {}


def mentions_to_rows(mentions: list) -> list[dict]:
    """Convert crawler RawMention objects to Supabase row dicts."""
    return [
        {
            "source": m.source,
            "source_id": m.source_id,
            "content": m.content,
            "metadata": m.metadata,
            "content_hash": m.content_hash,
        }
        for m in mentions
    ]


app = FastAPI(title="AI Tool Discovery API", version="1.0.0")


# ── Crawl Endpoints (called by n8n on schedule) ──────────────────────────────

@app.post("/crawl/official")
async def crawl_official(background_tasks: BackgroundTasks):
    """Fetch official pages for all 5 target tools and save to tools.official_info."""
    background_tasks.add_task(official_crawler.run_official_crawl)
    return {"status": "started"}


@app.post("/crawl/reddit")
async def crawl_reddit(background_tasks: BackgroundTasks):
    """Trigger Reddit crawl + save to Supabase. Called by n8n every 6h."""
    background_tasks.add_task(_crawl_and_save, "reddit")
    return {"status": "started", "source": "reddit"}


@app.post("/crawl/github")
async def crawl_github(background_tasks: BackgroundTasks):
    """Trigger GitHub crawl + save to Supabase. Called by n8n every 12h."""
    background_tasks.add_task(_crawl_and_save, "github")
    return {"status": "started", "source": "github"}


@app.post("/crawl/hn")
async def crawl_hn(background_tasks: BackgroundTasks):
    """Trigger HN crawl + save to Supabase. Called by n8n daily."""
    background_tasks.add_task(_crawl_and_save, "hn")
    return {"status": "started", "source": "hn"}


@app.post("/crawl/ptt")
async def crawl_ptt(background_tasks: BackgroundTasks):
    """Trigger PTT crawl + save to Supabase. Called by n8n daily."""
    background_tasks.add_task(_crawl_and_save, "ptt")
    return {"status": "started", "source": "ptt"}


@app.post("/crawl/dcard")
async def crawl_dcard(background_tasks: BackgroundTasks):
    """Trigger Dcard crawl + save to Supabase. Called by n8n daily."""
    background_tasks.add_task(_crawl_and_save, "dcard")
    return {"status": "started", "source": "dcard"}


@app.post("/crawl/threads")
async def crawl_threads(background_tasks: BackgroundTasks):
    """Trigger Threads crawl + save to Supabase. Called by n8n daily."""
    background_tasks.add_task(_crawl_and_save, "threads")
    return {"status": "started", "source": "threads"}


async def _crawl_and_save(source: str) -> None:
    """Background task: crawl a source and save raw mentions to Supabase."""
    if source == "reddit":
        mentions = reddit_crawler.run_full_crawl()
    elif source == "github":
        mentions = github_crawler.run_full_crawl()
    elif source == "hn":
        mentions = hn_crawler.run_full_crawl()
    elif source == "ptt":
        mentions = ptt_crawler.run_full_crawl()
    elif source == "dcard":
        mentions = dcard_crawler.run_full_crawl()
    elif source == "threads":
        mentions = threads_crawler.run_full_crawl()
    else:
        return

    rows = mentions_to_rows(mentions)
    if not rows:
        print(f"No new mentions from {source}")
        return

    # Insert in batches of 500 (Supabase limit)
    for i in range(0, len(rows), 500):
        await supabase_insert("raw_mentions", rows[i : i + 500])

    print(f"Saved {len(rows)} mentions from {source}")


# ── AI Extraction Endpoint ────────────────────────────────────────────────────

@app.post("/pipeline/extract")
async def trigger_extraction(background_tasks: BackgroundTasks):
    """
    Fetch unprocessed raw_mentions and run Claude Batch extraction.
    Called by n8n after crawl completes.
    """
    background_tasks.add_task(_extract_unprocessed)
    return {"status": "started"}


async def _extract_unprocessed() -> None:
    """Fetch raw mentions not yet extracted, run batch AI, save insights."""
    async with httpx.AsyncClient() as client:
        # Fetch raw mentions without corresponding extracted_insights
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/raw_mentions",
            params={
                "select": "id,content,source,metadata",
                "id": "not.in.(select raw_mention_id from extracted_insights)",
                "order": "crawled_at.desc",
                "limit": "500",
            },
            headers=HEADERS,
        )
        resp.raise_for_status()
        unprocessed = resp.json()

    if not unprocessed:
        print("No unprocessed mentions")
        return

    print(f"Extracting {len(unprocessed)} unprocessed mentions...")
    results = run_batch_extraction(unprocessed)

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

    for i in range(0, len(rows), 500):
        await supabase_insert("extracted_insights", rows[i : i + 500])

    print(f"Saved {len(rows)} extracted insights")


# ── Score Recalculation ───────────────────────────────────────────────────────

@app.post("/pipeline/rescore")
async def rescore_all():
    """
    Recalculate ranking scores for all tools.
    Called by n8n daily at midnight.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/tools",
            params={"select": "name"},
            headers=HEADERS,
        )
        tools = resp.json()

    results = []
    for tool in tools:
        score = await supabase_rpc("recalculate_tool_score", {"p_tool_name": tool["name"]})
        results.append({"tool": tool["name"], "score": score})

    # Refresh materialized view
    await supabase_rpc("refresh_weekly_trends")

    return {"rescored": len(results), "tools": results}


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}
