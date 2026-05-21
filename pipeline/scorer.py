"""
Rescore all tools based on extracted_insights.
Upserts newly discovered tools, then calls recalculate_tool_score() for each.
Run: python -m pipeline.scorer
"""
import os
import time
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
    'ChatGPT': 'writing', 'Perplexity': 'writing', 'Gemini': 'writing',
    'Notion AI': 'writing', 'Grammarly': 'writing', 'Jasper': 'writing',
    'Midjourney': 'image', 'DALL-E': 'image', 'Stable Diffusion': 'image',
    'Flux': 'image', 'Runway': 'image', 'Ideogram': 'image',
    'n8n': 'automation', 'Zapier': 'automation', 'Make': 'automation',
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
    slug = name.lower().replace(' ', '-').replace('/', '-')
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


def run() -> None:
    if not URL or not KEY:
        print('SUPABASE_URL / SUPABASE_SERVICE_KEY not set in .env')
        return

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

    print('\n=== Top 15 by score ===')
    for score, name in sorted(results, reverse=True)[:15]:
        print(f'  {score:6.2f}  {name}')

    print('\nDone.')


if __name__ == '__main__':
    run()
