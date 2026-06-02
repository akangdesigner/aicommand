import { NextRequest, NextResponse } from 'next/server'

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

/** Follow all redirects including meta-refresh and Google AMP canonical */
async function resolveUrl(url: string): Promise<{ finalUrl: string; html: string }> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 10000)
  const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: BROWSER_HEADERS })
  clearTimeout(timer)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const html = await res.text()
  let finalUrl = res.url

  // If still on google.com after HTTP redirect, check for meta-refresh
  if (finalUrl.includes('google.com')) {
    const metaRefresh = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url=([^"']+)/i)?.[1]
    if (metaRefresh) {
      const refreshed = await fetchFinal(metaRefresh.trim())
      return refreshed
    }
  }

  // AMP canonical: extract <link rel="canonical"> and fetch that instead
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
  if (canonical && canonical !== finalUrl && !canonical.includes('google.com')) {
    try {
      const refreshed = await fetchFinal(canonical)
      return refreshed
    } catch { /* fall through to original */ }
  }

  return { finalUrl, html }
}

async function fetchFinal(url: string): Promise<{ finalUrl: string; html: string }> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 8000)
  const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: BROWSER_HEADERS })
  clearTimeout(timer)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { finalUrl: res.url, html: await res.text() }
}

function getMeta(html: string, ...props: string[]): string {
  for (const prop of props) {
    const v =
      html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${prop}"`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+name="${prop}"[^>]+content="([^"]*)"`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${prop}"`, 'i'))?.[1]
    if (v) return v
  }
  return ''
}

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function extractContent(html: string, pageUrl: string) {
  const title = decodeEntities(
    getMeta(html, 'og:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[|\-–—]\s*.{0,50}$/, '') || ''
  )
  const image  = getMeta(html, 'og:image')
  const ogDesc = getMeta(html, 'og:description', 'description')

  // Clean noise
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Strategy 1: <article>
  // Strategy 2: <main>
  // Strategy 3: div/section with content-like class names
  const contentBlock =
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    cleaned.match(/<div[^>]+(?:class|id)="[^"]*(?:article[-_]?(?:body|content|text)|post[-_]?(?:body|content)|entry[-_]?content|story[-_]?body|news[-_]?content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    cleaned

  const paragraphs = Array.from(contentBlock.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map(m => decodeEntities(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()))
    .filter(p => p.length > 25)
    .slice(0, 35)

  // Resolve relative image URL
  let resolvedImage = image
  if (image && image.startsWith('/')) {
    try {
      const origin = new URL(pageUrl).origin
      resolvedImage = origin + image
    } catch { resolvedImage = image }
  }

  return { title, image: resolvedImage || undefined, description: decodeEntities(ogDesc), paragraphs }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  try {
    const { finalUrl, html } = await resolveUrl(url)
    const content = extractContent(html, finalUrl)
    return NextResponse.json({ ...content, finalUrl })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 502 })
  }
}
