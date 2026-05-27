import { NextRequest, NextResponse } from 'next/server'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

async function fetchHtml(url: string, timeout = 7000): Promise<{ html: string; finalUrl: string } | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: HEADERS })
    clearTimeout(timer)
    if (!res.ok) return null
    return { html: await res.text(), finalUrl: res.url }
  } catch {
    clearTimeout(timer)
    return null
  }
}

function extractOgImage(html: string, pageUrl: string): string | null {
  const raw =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1] ??
    null
  if (!raw) return null
  if (raw.startsWith('http')) return raw
  if (raw.startsWith('//')) return 'https:' + raw
  if (raw.startsWith('/')) {
    try { return new URL(pageUrl).origin + raw } catch { return null }
  }
  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ image: null })

  try {
    const first = await fetchHtml(url)
    if (!first) return NextResponse.json({ image: null })

    let { html, finalUrl } = first

    // Google News redirect: check meta-refresh
    if (finalUrl.includes('google.com')) {
      const metaRefresh = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url=([^"']+)/i)?.[1]
      if (metaRefresh) {
        const second = await fetchHtml(metaRefresh.trim(), 6000)
        if (second) { html = second.html; finalUrl = second.finalUrl }
      }
    }

    // AMP canonical
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    if (canonical && canonical !== finalUrl && !canonical.includes('google.com')) {
      const amp = await fetchHtml(canonical, 6000)
      if (amp) { html = amp.html; finalUrl = amp.finalUrl }
    }

    return NextResponse.json({ image: extractOgImage(html, finalUrl) })
  } catch {
    return NextResponse.json({ image: null })
  }
}
