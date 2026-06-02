"""
Rescore all tools based on extracted_insights.
Upserts newly discovered tools, then calls recalculate_tool_score() for each.
Run: python -m pipeline.scorer
"""
import os
import time
from datetime import datetime, timezone, timedelta
import httpx
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv('SUPABASE_URL', '').rstrip('/')
KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

# Tool names that the extractor produces → category for upsert
KNOWN_CATEGORIES: dict[str, str] = {
    'Cursor': 'coding', 'Claude Code': 'coding', 'Claude': 'coding',
    'GitHub Copilot': 'coding', 'Windsurf': 'coding', 'Codeium': 'coding',
    'Aider': 'coding', 'Continue.dev': 'coding', 'Zed': 'coding',
    'v0': 'coding', 'Bolt': 'coding', 'Replit': 'coding', 'Lovable': 'coding',
    'Trae': 'coding', 'Codex': 'coding',
    'ChatGPT': 'writing', 'Perplexity': 'writing', 'Gemini': 'writing',
    'Notion AI': 'writing', 'Grammarly': 'writing', 'Jasper': 'writing', 'Copy.ai': 'writing',
    'Midjourney': 'image', 'DALL-E': 'image', 'Stable Diffusion': 'image',
    'Flux': 'image', 'Runway': 'image', 'Ideogram': 'image',
    'ComfyUI': 'image', 'Adobe Firefly': 'image', 'Leonardo AI': 'image',
    'Seedance': 'video', 'Kling': 'video',
    'n8n': 'automation', 'Zapier': 'automation', 'Make': 'automation', 'Dify': 'automation',
    'ElevenLabs': 'voice', 'Whisper': 'voice',
}


def get_distinct_tool_names() -> list[str]:
    """Fetch all distinct tool_name values from extracted_insights."""
    page, seen, names = 0, set(), []
    while True:
        resp = httpx.get(
            f'{URL}/rest/v1/extracted_insights',
            params={'select': 'tool_name', 'offset': page * 1000, 'limit': 1000},
            headers=HEADERS, timeout=30,
        )
        rows = resp.json()
        if not rows:
            break
        for r in rows:
            n = r.get('tool_name', '').strip()
            if n and n not in seen:
                seen.add(n)
                names.append(n)
        if len(rows) < 1000:
            break
        page += 1
    return sorted(names)


def upsert_tool(name: str) -> None:
    slug = TARGET_TOOL_SLUGS.get(name, name.lower().replace(' ', '-').replace('/', '-').replace('.', '-'))
    cat  = KNOWN_CATEGORIES.get(name, 'other')
    httpx.post(
        f'{URL}/rest/v1/tools',
        json={'slug': slug, 'name': name, 'category': cat},
        headers={**HEADERS, 'Prefer': 'resolution=ignore-duplicates,return=minimal'},
        timeout=10,
    )


def rescore(name: str) -> float:
    resp = httpx.post(
        f'{URL}/rest/v1/rpc/recalculate_tool_score',
        json={'p_tool_name': name},
        headers=HEADERS, timeout=15,
    )
    try:
        return float(resp.json() or 0)
    except Exception:
        return 0.0


TARGET_TOOL_SLUGS: dict[str, str] = {
    'Claude Code':   'claude-code',
    'Cursor':        'cursor',
    'Windsurf':      'windsurf',
    'Trae':          'trae',
    'Codex':         'codex',
    'n8n':           'n8n',
    'Make':          'make',
    'Zapier':        'zapier',
    'Dify':          'dify',
    'Midjourney':    'midjourney',
    'ComfyUI':       'comfyui',
    'Adobe Firefly': 'adobe-firefly',
    'Ideogram':      'ideogram',
    'Leonardo AI':   'leonardo-ai',
    'Seedance':      'seedance',
    'Kling':         'kling',
    'ChatGPT':       'chatgpt',
    'Notion AI':     'notion-ai',
    'Perplexity':    'perplexity',
    'Grammarly':     'grammarly',
    'Jasper':        'jasper',
    'Copy.ai':       'copy-ai',
}


# 用更精確的關鍵字搜尋，避免通用詞誤判（如 "Make" 會匹配所有含 make 的句子）
MENTION_SEARCH_KEYWORDS: dict[str, str] = {
    'Make': 'make.com',  # 用 make.com 避免匹配 "make" 這個通用詞
}


def _week_start() -> str:
    today = datetime.now(timezone.utc).date()
    return str(today - timedelta(days=today.weekday()))


def update_heat_score(name: str, heat: float) -> None:
    """Write normalized 0-100 heat_score back to tools table."""
    slug = name.lower().replace(' ', '-').replace('/', '-')
    httpx.patch(
        f'{URL}/rest/v1/tools',
        params={'slug': f'eq.{slug}'},
        json={'heat_score': round(heat, 1)},
        headers=HEADERS,
        timeout=10,
    )


def record_score_history(name: str, heat: float) -> None:
    """Upsert weekly heat_score snapshot (0-100) — used for trend chart."""
    httpx.post(
        f'{URL}/rest/v1/tool_score_history',
        json={'tool_name': name, 'week': _week_start(), 'score': round(heat, 1)},
        headers={**HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal'},
        timeout=10,
    )


def patch_raw_mention_counts() -> None:
    """Update tools.mention_count to show real raw_mentions count (not extracted_insights count)."""
    print('\nPatching mention_count with real raw_mentions counts...')
    with httpx.Client(timeout=30) as client:
        for name, slug in TARGET_TOOL_SLUGS.items():
            keyword = MENTION_SEARCH_KEYWORDS.get(name, name)
            resp = client.get(
                f'{URL}/rest/v1/raw_mentions',
                params={'select': 'id', 'limit': 1, 'content': f'ilike.*{keyword}*'},
                headers={**HEADERS, 'Prefer': 'count=exact'},
            )
            cr = resp.headers.get('content-range', '0/0')
            try:
                count = int(cr.split('/')[-1])
            except (ValueError, IndexError):
                count = 0
            client.patch(
                f'{URL}/rest/v1/tools',
                params={'slug': f'eq.{slug}'},
                json={'mention_count': count},
                headers=HEADERS,
            )
            print(f'  {name}: {count:,} 則')


def run() -> None:
    if not URL or not KEY:
        print('SUPABASE_URL / SUPABASE_SERVICE_KEY not set in .env')
        return

    # 確保所有追蹤工具都在 tools 表，即使還沒有 insights
    for name, slug in TARGET_TOOL_SLUGS.items():
        upsert_tool(name)

    print('Fetching distinct tool names from extracted_insights...')
    names = get_distinct_tool_names()
    print(f'Found {len(names)} tools\n')

    results = []
    for name in names:
        upsert_tool(name)
        score = rescore(name)
        results.append((score, name))
        print(f'  {name}: {score:.2f}')
        time.sleep(0.1)

    # Normalize ranking_score → heat_score (0-100) and store in DB + history
    max_raw = max((s for s, _ in results), default=1) or 1
    print('\n=== Normalizing heat scores ===')
    for raw, name in results:
        heat = round((raw / max_raw) * 100, 1)
        update_heat_score(name, heat)
        record_score_history(name, heat)
        print(f'  {name}: {heat:.1f}')

    print('\n=== Top 15 by heat score ===')
    for raw, name in sorted(results, reverse=True)[:15]:
        heat = round((raw / max_raw) * 100, 1)
        print(f'  {heat:5.1f}  {name}')

    patch_raw_mention_counts()
    print('\nDone.')


if __name__ == '__main__':
    run()
