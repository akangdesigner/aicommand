import type { Metadata } from 'next'
import { NewsClient, type NewsItem } from '@/components/NewsClient'

export const metadata: Metadata = {
  title: 'AI 工具最新動態 · AICommand',
  description: '最新 AI 開發工具相關新聞，來自各大科技媒體。',
}

export const revalidate = 1800

const QUERIES = [
  { q: 'AI 程式開發工具',          label: 'AI 工具'      },
  { q: 'vibe coding',              label: 'Vibe Coding'  },
  { q: 'Claude Code Anthropic',    label: 'Claude Code'  },
  { q: 'Cursor AI 程式助理',        label: 'Cursor'       },
  { q: 'Windsurf AI IDE',          label: 'Windsurf'     },
  { q: 'Codex OpenAI coding',      label: 'Codex'        },
  { q: 'AI coding agent 開發助理',  label: 'Coding Agent' },
]

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

/** Decode the real article URL embedded in a Google News URL (base64url encoded protobuf) */
function decodeGoogleNewsUrl(gnUrl: string): string | null {
  try {
    const match = gnUrl.match(/\/articles\/([A-Za-z0-9_-]+)/)
    if (!match) return null
    const buf = Buffer.from(match[1], 'base64url')
    const httpIdx = buf.indexOf(Buffer.from('http'))
    if (httpIdx === -1) return null
    let end = httpIdx
    while (end < buf.length && buf[end] >= 0x20) end++
    const decoded = buf.slice(httpIdx, end).toString('utf8')
    new URL(decoded) // validate — throws if malformed
    return decoded
  } catch {
    return null
  }
}

async function fetchHtml(url: string, timeout: number): Promise<{ html: string; finalUrl: string } | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: BROWSER_HEADERS })
    clearTimeout(timer)
    if (!res.ok) return null
    return { html: await res.text(), finalUrl: res.url }
  } catch {
    clearTimeout(timer)
    return null
  }
}

async function fetchDescription(articleUrl: string): Promise<string | undefined> {
  try {
    const result = await fetchHtml(articleUrl, 8000)
    if (!result) return undefined
    let { html, finalUrl } = result

    // AMP canonical
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    if (canonical && canonical !== finalUrl && !canonical.includes('google.com')) {
      const r2 = await fetchHtml(canonical, 5000)
      if (r2) html = r2.html
    }

    const raw =
      html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]{20,})"/i)?.[1] ??
      html.match(/<meta[^>]+content="([^"]{20,})"[^>]+property="og:description"/i)?.[1] ??
      html.match(/<meta[^>]+name="description"[^>]+content="([^"]{20,})"/i)?.[1] ??
      html.match(/<meta[^>]+content="([^"]{20,})"[^>]+name="description"/i)?.[1] ??
      undefined

    return raw ? raw.replace(/\s+/g, ' ').trim().slice(0, 200) : undefined
  } catch {
    return undefined
  }
}

function parseRSS(xml: string, topic: string): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([, raw]) => {
    const getCdata = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
      return m ? m[1].trim() : null
    }
    const getTag = (tag: string) => {
      const cdata = getCdata(tag)
      if (cdata !== null) return cdata
      const plain = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return plain ? stripHtml(plain[1]) : ''
    }

    const source = raw.match(/<source\s+url="[^"]*"[^>]*>([^<]*)<\/source>/)?.[1]?.trim() ?? ''
    const rawTitle = getTag('title')
    const title = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(` - ${source}`).length) : rawTitle
    const gnUrl = getTag('link')
    const pubDate = getTag('pubDate')

    if (!title || !gnUrl) return []

    // Decode the real article URL from the Google News base64 URL
    const url = decodeGoogleNewsUrl(gnUrl) ?? gnUrl

    return [{ id: gnUrl, title, url, source, pubDate: new Date(pubDate).toISOString(), topics: [topic] }]
  })
}

async function fetchRSS(q: string, label: string): Promise<NewsItem[]> {
  try {
    const ctl = new AbortController()
    setTimeout(() => ctl.abort(), 8000)
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`,
      { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AICommand/1.0)' }, next: { revalidate: 1800 } },
    )
    if (!res.ok) return []
    return parseRSS(await res.text(), label)
  } catch { return [] }
}

export default async function NewsPage() {
  const results = await Promise.all(QUERIES.map(({ q, label }) => fetchRSS(q, label)))

  const seen = new Map<string, NewsItem>()
  for (const items of results)
    for (const item of items)
      if (seen.has(item.id)) {
        const ex = seen.get(item.id)!
        if (!ex.topics.includes(item.topics[0])) ex.topics.push(item.topics[0])
      } else seen.set(item.id, { ...item })

  const news = [...seen.values()]
    .filter(n => { try { return !isNaN(new Date(n.pubDate).getTime()) } catch { return false } })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 20)

  // Fetch real og:description from actual article pages (ISR — runs once every 30 min)
  const newsWithDesc = await Promise.all(
    news.map(async item => ({
      ...item,
      description: await fetchDescription(item.url),
    }))
  )

  return (
    <div className="mx-auto max-w-[800px] px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-8">
        <h1 className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-stone-900">最新動態</h1>
        <p className="mt-3 text-[14px] text-stone-500">
          AI 開發工具相關新聞，來自各大科技媒體 · 每 30 分鐘自動更新
        </p>
      </header>

      {newsWithDesc.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-12 text-center text-[14px] text-stone-400">
          暫時無法載入最新消息，請稍後重試。
        </div>
      ) : (
        <NewsClient news={newsWithDesc} />
      )}

      <footer className="mt-10 text-[12px] text-stone-400">
        資料來源：Google 新聞 · 每 30 分鐘自動更新
      </footer>
    </div>
  )
}
