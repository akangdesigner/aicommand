'use client'

import { useId } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool, Quote } from '@/lib/data'
import { cx } from '@/lib/utils'
import { ToolLogo, CategoryBadge, TrendArrow, ScoreNumber, SourceBar } from '@/components/ui'

function TrendChart({ data, accent }: { data: number[]; accent: string }) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `chart-fill-${uid}`
  const w = 720, h = 220
  const padL = 36, padR = 16, padT = 20, padB = 28
  const min = Math.min(...data) - 4
  const max = Math.max(...data) + 4
  const range = max - min
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const step = innerW / (data.length - 1)
  const pts = data.map((d, i) => [padL + i * step, padT + innerH - ((d - min) / range) * innerH])
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const area =
    `M${pts[0][0]},${padT + innerH} ` +
    pts.map((p) => `L${p[0]},${p[1]}`).join(' ') +
    ` L${pts[pts.length - 1][0]},${padT + innerH} Z`
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => ({
    v: min + (range * i) / ticks,
    y: padT + innerH - (i / ticks) * innerH,
  }))
  const weeks = ['−7週', '−6週', '−5週', '−4週', '−3週', '−2週', '−1週', '本週']

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={t.y} y2={t.y} stroke="oklch(0.93 0.005 80)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'} />
          <text x={padL - 8} y={t.y + 3} textAnchor="end" fill="oklch(0.65 0.005 80)" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10 }}>
            {t.v.toFixed(0)}
          </text>
        </g>
      ))}

      {weeks.map((wk, i) => (
        <text key={i} x={padL + i * step} y={h - 10} textAnchor="middle" fill="oklch(0.65 0.005 80)" style={{ fontSize: 10 }}>
          {wk}
        </text>
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={accent} />
          {i === pts.length - 1 && (
            <>
              <circle cx={p[0]} cy={p[1]} r="9" fill={accent} fillOpacity="0.18" />
              <g transform={`translate(${p[0] + 10}, ${p[1] - 14})`}>
                <rect width="56" height="22" rx="6" fill="#0a0a0a" />
                <text x="28" y="15" textAnchor="middle" fill="white" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11, fontWeight: 500 }}>
                  {data[i].toFixed(1)}
                </text>
              </g>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

function InsightCard({ title, hint, children, accent }: { title: string; hint?: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent || 'oklch(0.55 0.18 265)' }} />
          <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-stone-900">{title}</h3>
        </div>
        {hint && <span className="text-[10.5px] tracking-[0.04em] text-stone-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[12.5px] text-stone-700">
          {t}
        </span>
      ))}
    </div>
  )
}

function BulletList({ items, marker = 'oklch(0.55 0.18 265)' }: { items: string[]; marker?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug text-stone-700">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: marker }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

const SENTIMENT_STYLE = {
  positive: { bg: 'oklch(0.96 0.04 145)', fg: 'oklch(0.4 0.14 145)', label: '正面' },
  negative: { bg: 'oklch(0.96 0.04 25)',  fg: 'oklch(0.45 0.17 25)', label: '負面' },
  mixed:    { bg: 'oklch(0.96 0.04 80)',  fg: 'oklch(0.42 0.12 60)', label: '褒貶不一' },
} as const

function QuoteCard({ q }: { q: Quote }) {
  const s = SENTIMENT_STYLE[q.sentiment]
  return (
    <figure className="relative rounded-xl border border-stone-200 bg-white p-5">
      <div className="absolute left-5 top-3 text-[40px] leading-none text-stone-200 font-serif select-none">"</div>
      <blockquote className="pl-7 text-[14.5px] leading-relaxed text-stone-800 text-balance" lang="en">
        {q.text}
      </blockquote>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-7 text-[12px] text-stone-500">
        <span className="font-medium text-stone-600">{q.source}</span>
        <span className="text-stone-300">·</span>
        <span>{q.date}</span>
        <span
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: s.bg, color: s.fg }}
        >
          {s.label}
        </span>
      </figcaption>
    </figure>
  )
}

export function DetailPageClient({ tool, allTools }: { tool: Tool; allTools: Tool[] }) {
  const router = useRouter()
  const rankDelta = tool.prevRank - tool.rank

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-6 sm:px-8">
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-stone-500 transition hover:text-stone-900"
      >
        <span>←</span>
        <span>返回排行榜</span>
      </button>

      {/* Header */}
      <header className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        <div>
          <div className="flex items-start gap-5">
            <ToolLogo tool={tool} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CategoryBadge category={tool.category} />
                <span className="font-mono text-[11.5px] text-stone-400">/tools/{tool.slug}</span>
              </div>
              <h1 className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-stone-900 sm:text-[52px]">
                {tool.name}
              </h1>
              <p className="mt-3 max-w-[520px] text-[15px] leading-snug text-stone-600">{tool.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10.5px] tracking-[0.06em] text-stone-400">熱度分數</div>
              <ScoreNumber value={tool.score} size="xl" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <TrendArrow delta={tool.delta} size="lg" />
              <div className="text-[11px] font-mono text-stone-400 tabular-nums">較上週</div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <div>
              <div className="text-[10.5px] tracking-[0.06em] text-stone-400">本週排名</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-medium tabular-nums tracking-[-0.02em] text-stone-900">
                  #{tool.rank}
                </span>
                {rankDelta !== 0 && (
                  <span
                    className="text-[12px] font-mono tabular-nums"
                    style={{ color: rankDelta > 0 ? 'oklch(0.5 0.16 145)' : 'oklch(0.55 0.18 25)' }}
                  >
                    {rankDelta > 0 ? `↑${rankDelta} 自 #${tool.prevRank}` : `↓${Math.abs(rankDelta)} 自 #${tool.prevRank}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 max-w-[200px]">
              <div className="text-[10.5px] tracking-[0.06em] text-stone-400">本週討論</div>
              <div className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-[-0.02em] text-stone-900">
                {tool.discussions.toLocaleString()}
                <span className="ml-2 text-[12px] font-normal text-stone-500 font-sans">{tool.growth}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Community insights */}
      <section className="mb-8">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-900">社群洞察</h2>
          <span className="text-[11px] tracking-[0.04em] text-stone-400">整合自 {tool.discussions.toLocaleString()} 則討論</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InsightCard title="適合族群" hint="主要用戶" accent={tool.accent}>
            <ChipList items={tool.audiences} />
          </InsightCard>
          <InsightCard title="主要用途" hint="熱門使用情境" accent={tool.accent}>
            <BulletList items={tool.useCases} marker={tool.accent} />
          </InsightCard>
          <InsightCard title="社群痛點" hint="來自批評聲量" accent="oklch(0.55 0.18 25)">
            <BulletList items={tool.painPoints} marker="oklch(0.6 0.16 25)" />
          </InsightCard>
          <InsightCard title="定價感受" hint="付費意願" accent="oklch(0.6 0.13 80)">
            <p className="text-[13.5px] leading-relaxed text-stone-700 text-balance">{tool.pricingFeel}</p>
          </InsightCard>
        </div>
      </section>

      {/* Quotes */}
      <section className="mb-8">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-900">真實社群引言</h2>
          <span className="text-[11px] tracking-[0.04em] text-stone-400">47 則中精選 {tool.quotes.length} 則</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tool.quotes.map((q, i) => (
            <QuoteCard key={i} q={q} />
          ))}
        </div>
      </section>

      {/* Trend chart + comparisons */}
      <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-stone-900">熱度趨勢 · 近 8 週</h3>
              <p className="mt-0.5 text-[11.5px] text-stone-500">每日熱度，以週為單位平滑。數字越高代表社群正面聲量越多。</p>
            </div>
            <span className="text-[11px] font-mono text-stone-400 tabular-nums shrink-0">
              {Math.min(...tool.trend).toFixed(1)} – {Math.max(...tool.trend).toFixed(1)}
            </span>
          </div>
          <TrendChart data={tool.trend} accent={tool.accent} />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-stone-900">常被拿來比較</h3>
            <div className="space-y-2.5">
              {tool.competitors.map((c) => {
                const matched = allTools.find((x) => x.name === c.name)
                return (
                  <button
                    key={c.name}
                    onClick={() => matched && router.push(`/tools/${matched.slug}`)}
                    disabled={!matched}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-lg border border-stone-100 px-3 py-2 text-left transition',
                      matched ? 'hover:border-stone-200 hover:bg-stone-50' : 'opacity-70',
                    )}
                  >
                    {matched ? (
                      <ToolLogo tool={matched} size="sm" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-stone-100 text-[12px] font-medium text-stone-500">
                        {c.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-stone-900">{c.name}</div>
                      <div className="text-[11.5px] text-stone-500">共同被提及</div>
                    </div>
                    <span className="font-mono text-[12.5px] tabular-nums text-stone-600">{c.count} 次</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-stone-900">訊號來源分布</h3>
            <SourceBar sources={tool.sources} />
          </div>
        </div>
      </section>

      <footer className="text-[12px] text-stone-400">
        <span className="text-stone-600 font-medium">{tool.name}</span> 上次更新於 14 分鐘前 · 下次更新還有 46 分鐘。
      </footer>
    </div>
  )
}
