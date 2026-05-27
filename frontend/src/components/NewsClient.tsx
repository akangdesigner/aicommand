'use client'

export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  pubDate: string
  topics: string[]
  description?: string
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (isNaN(m) || m < 0) return ''
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} 天前`
  if (d < 30) return `${Math.floor(d / 7)} 週前`
  return `${Math.floor(d / 30)} 個月前`
}

export function NewsClient({ news }: { news: NewsItem[] }) {
  return (
    <div className="space-y-2">
      {news.map(item => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm"
        >
          <div className="mb-2 flex flex-wrap gap-1.5">
            {item.topics.map(t => (
              <span key={t} className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">{t}</span>
            ))}
          </div>

          <p className="mb-1.5 text-[15px] font-semibold leading-snug text-stone-900 line-clamp-2">{item.title}</p>

          {item.description && (
            <p className="mb-2.5 text-[13px] leading-relaxed text-stone-500 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center gap-3 text-[12px] text-stone-400">
            {item.source && <span className="font-medium text-stone-600">{item.source}</span>}
            <span>{relTime(item.pubDate)}</span>
            <span className="ml-auto text-[11px] text-stone-300">閱讀原文 →</span>
          </div>
        </a>
      ))}
    </div>
  )
}
