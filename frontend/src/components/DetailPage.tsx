'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool, Quote, SentimentBreakdown } from '@/lib/data'
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
  const s = SENTIMENT_STYLE[q.sentiment] ?? SENTIMENT_STYLE.mixed
  return (
    <figure className="relative rounded-xl border border-stone-200 bg-white p-5 flex flex-col h-full">
      <div className="absolute left-5 top-3 text-[40px] leading-none text-stone-200 font-serif select-none">{'“'}</div>
      <blockquote className="pl-7 text-[14.5px] leading-relaxed text-stone-800 flex-1" lang="en">
        {q.text}
      </blockquote>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-7 text-[12px] text-stone-500">
        <div className="flex items-center gap-1.5 min-w-0">
          {q.url ? (
            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-600 hover:text-stone-900 hover:underline transition-colors"
            >
              {q.source}
            </a>
          ) : (
            <span className="font-medium text-stone-600">{q.source}</span>
          )}
          {q.author && q.author !== '[deleted]' && (
            <>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">u/{q.author}</span>
            </>
          )}
        </div>
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

const QUOTES_PER_PAGE = 9

function QuotesSection({ quotes }: { quotes: Quote[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(quotes.length / QUOTES_PER_PAGE)
  const visible = quotes.slice(page * QUOTES_PER_PAGE, (page + 1) * QUOTES_PER_PAGE)

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-900">真實社群評論</h2>
          <p className="mt-0.5 text-[11px] text-stone-400">來自 Reddit、HN、PTT、Dcard 的真實社群討論</p>
        </div>
        {quotes.length > 0 && (
          <span className="text-[11px] tracking-[0.04em] text-stone-400 shrink-0">
            精選真實評論 {quotes.length} 則
          </span>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-10 text-center text-[13.5px] text-stone-400">
          社群引言收集中，下次資料更新後將顯示真實用戶評論。
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((q, i) => (
              <QuoteCard key={page * QUOTES_PER_PAGE + i} q={q} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-[13px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← 上一頁
              </button>
              <span className="font-mono text-[12.5px] tabular-nums text-stone-400">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-[13px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
              >
                下一頁 →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

const RADAR_AXES = ['社群熱度', '社群口碑', '定價', '近期動態', 'AI短評']
const RADAR_N = 5
const RADAR_CX = 210, RADAR_CY = 200, RADAR_MAX_R = 120, RADAR_LABEL_R = 148

function radarCoord(axisIdx: number, r: number): [number, number] {
  const angle = ((270 + axisIdx * 72) * Math.PI) / 180
  return [RADAR_CX + r * Math.cos(angle), RADAR_CY + r * Math.sin(angle)]
}

function radarAnchor(axisIdx: number): 'middle' | 'start' | 'end' {
  if (axisIdx === 0) return 'middle'
  if (axisIdx === 1 || axisIdx === 2) return 'start'
  return 'end'
}

function RadarChart({ scores, accent }: { scores: number[]; accent: string }) {
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const gridPath = (pct: number) =>
    Array.from({ length: RADAR_N }, (_, i) => radarCoord(i, RADAR_MAX_R * pct))
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ') + ' Z'

  const dataPath =
    scores
      .map((s, i) => {
        const [x, y] = radarCoord(i, (s / 100) * RADAR_MAX_R)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ') + ' Z'

  return (
    <svg viewBox="0 0 420 400" className="w-full h-auto max-w-[340px] mx-auto">
      {/* Grid */}
      {levels.map((pct, i) => (
        <path key={i} d={gridPath(pct)} fill="none" stroke="oklch(0.9 0.005 80)" strokeWidth={pct === 1 ? '1.5' : '1'} />
      ))}
      {/* Axis lines */}
      {Array.from({ length: RADAR_N }, (_, i) => {
        const [x, y] = radarCoord(i, RADAR_MAX_R)
        return <line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="oklch(0.88 0.005 80)" strokeWidth="1" />
      })}
      {/* Data polygon */}
      <path d={dataPath} fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
      {/* Data dots */}
      {scores.map((s, i) => {
        const [x, y] = radarCoord(i, (s / 100) * RADAR_MAX_R)
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill={accent} />
      })}
      {/* Labels */}
      {RADAR_AXES.map((label, i) => {
        const [lx, ly] = radarCoord(i, RADAR_LABEL_R)
        const anchor = radarAnchor(i)
        return (
          <g key={i}>
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor={anchor} fill="oklch(0.4 0.01 80)" style={{ fontSize: 12 }}>
              {label}
            </text>
            <text x={lx.toFixed(1)} y={(ly + 15).toFixed(1)} textAnchor={anchor} fill={accent} style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 600 }}>
              {scores[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function SentimentSummary({ breakdown, accent }: { breakdown: SentimentBreakdown; accent: string }) {
  const { positive, negative, mixed, total } = breakdown
  const posP = Math.round((positive / total) * 100)
  const negP = Math.round((negative / total) * 100)
  const mixP = 100 - posP - negP

  const overall =
    posP >= 60 ? '整體評價正面'
    : negP >= 40 ? '整體評價偏負面'
    : posP >= 40 ? '評價兩極，多數偏正面'
    : '評價分歧，褒貶不一'

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em] text-stone-900">{overall}</div>
      <div className="mb-4 text-[11.5px] text-stone-500">來自 {total} 則社群討論的情緒分析</div>

      {/* Bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full gap-0.5">
        {posP > 0 && (
          <div style={{ width: `${posP}%`, background: 'oklch(0.6 0.18 145)' }} className="rounded-l-full" />
        )}
        {mixP > 0 && (
          <div style={{ width: `${mixP}%`, background: 'oklch(0.75 0.1 80)' }} />
        )}
        {negP > 0 && (
          <div style={{ width: `${negP}%`, background: 'oklch(0.62 0.2 25)' }} className="rounded-r-full" />
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.6_0.18_145)]" />
          <span className="text-stone-700">正面 <span className="font-mono font-medium tabular-nums">{posP}%</span></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.75_0.1_80)]" />
          <span className="text-stone-700">褒貶不一 <span className="font-mono font-medium tabular-nums">{mixP}%</span></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.62_0.2_25)]" />
          <span className="text-stone-700">負面 <span className="font-mono font-medium tabular-nums">{negP}%</span></span>
        </span>
      </div>
    </div>
  )
}

function radarExplanation(axis: string, score: number, tool: Tool): string {
  if (axis === '社群熱度') {
    const n = tool.discussions.toLocaleString()
    return score >= 70 ? `討論量龐大，資料庫共收錄 ${n} 筆提及`
         : score >= 40 ? `中等討論量，共 ${n} 筆提及`
         : `討論量尚少，共 ${n} 筆提及`
  }
  if (axis === '社群口碑') {
    return score >= 65 ? '正面評論比例偏高，用戶好評居多'
         : score >= 45 ? '評價褒貶不一，正負評論大致相當'
         : '負面評論比例偏高，常見抱怨較多'
  }
  if (axis === '定價') {
    return tool.pricingDescription ?? (
      score >= 90 ? '完全免費，無需任何訂閱'
      : score >= 70 ? '有免費方案，付費版價格平易近人'
      : score >= 55 ? '付費門檻中等，提供免費試用'
      : score >= 45 ? '按用量計費，實際費用難以預期'
      : '需付費訂閱，重度使用成本偏高'
    )
  }
  if (axis === '近期動態') {
    const latest = tool.recentUpdates?.[0]
    return latest ? `最新：${latest}` : (
      score >= 60 ? '近期持續有更新' : '近期更新動態較少'
    )
  }
  if (axis === 'AI短評') {
    return tool.aiReview ?? tool.depthDescription ?? '尚無足夠資料生成 AI 短評'
  }
  return ''
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
              {tool.description && (
                <p className="mt-3 max-w-[520px] text-[15px] leading-snug text-stone-600">{tool.description}</p>
              )}
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-900 hover:bg-stone-50"
                >
                  官網
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none" className="opacity-50">
                    <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
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
            {tool.discussions > 0 && (
              <div className="flex-1 max-w-[200px]">
                <div className="text-[10.5px] tracking-[0.06em] text-stone-400">社群提及筆數</div>
                <div className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-[-0.02em] text-stone-900">
                  {tool.discussions.toLocaleString()}
                  {tool.growth && <span className="ml-2 text-[12px] font-normal text-stone-500 font-sans">{tool.growth}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Official info */}
      {(tool.features?.length || tool.recentUpdates?.length) && (
        <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {tool.features && tool.features.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-stone-900">核心功能</h2>
                {tool.docsUrl && (
                  <a
                    href={tool.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-stone-400 hover:text-stone-700 transition"
                  >
                    官方文件
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
              <ul className="space-y-2.5">
                {tool.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug text-stone-700">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full" style={{ background: tool.accent }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tool.recentUpdates && tool.recentUpdates.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold tracking-[-0.01em] text-stone-900">近期更新</h2>
              <ul className="space-y-3">
                {tool.recentUpdates.map((u, i) => {
                  const [date, ...rest] = u.split(' — ')
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 font-mono text-[11px] text-stone-400 pt-[2px]">{date}</span>
                      <span className="text-[13.5px] leading-snug text-stone-700">{rest.join(' — ')}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 多維度評分雷達 */}
      {tool.radarScores && tool.radarScores.length === 5 && (
        <section className="mb-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-900">多維度評分</h2>
            <span className="text-[11px] tracking-[0.04em] text-stone-400">依社群資料計算</span>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
              <RadarChart scores={tool.radarScores} accent={tool.accent} />
              <div className="flex flex-col justify-center gap-4">
                {RADAR_AXES.map((label, i) => {
                  const s = tool.radarScores![i]
                  const explanation = radarExplanation(label, s, tool)
                  return (
                    <div key={label} className="flex gap-3">
                      <span
                        className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums w-7 shrink-0 text-right"
                        style={{ color: tool.accent }}
                      >
                        {s}
                      </span>
                      <div>
                        <div className="text-[12.5px] font-semibold text-stone-800">{label}</div>
                        <div className="text-[12px] leading-snug text-stone-500">{explanation}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 總評 */}
      {(tool.communitySummary || tool.audiences.length > 0 || tool.useCases.length > 0 || tool.painPoints.length > 0 || !!tool.pricingFeel) && (
        <section className="mb-8">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-stone-900">總評</h2>

          {/* 社群評論洞察段落 */}
          {tool.communitySummary && (
            <div className="mb-3 rounded-xl border border-stone-200 bg-white p-5">
              <div className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-stone-400">社群評論洞察</div>
              <p className="text-[14.5px] leading-relaxed text-stone-700">{tool.communitySummary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* 定價 */}
            {!!(tool.pricingDescription || tool.pricingFeel) && (
              <InsightCard title="定價" accent="oklch(0.6 0.13 80)">
                <p className="text-[13.5px] leading-relaxed text-stone-700">{tool.pricingDescription ?? tool.pricingFeel}</p>
              </InsightCard>
            )}

            {/* 適合族群 */}
            {tool.audiences.length > 0 && (
              <InsightCard title="適合族群" accent={tool.accent}>
                <ChipList items={tool.audiences} />
              </InsightCard>
            )}

            {/* 主要優點 */}
            {tool.useCases.length > 0 && (
              <InsightCard title="主要優點" accent={tool.accent}>
                <BulletList items={tool.useCases} marker={tool.accent} />
              </InsightCard>
            )}

            {/* 社群痛點 */}
            {tool.painPoints.length > 0 && (
              <InsightCard title="社群痛點" accent="oklch(0.55 0.18 25)">
                <BulletList items={tool.painPoints} marker="oklch(0.6 0.16 25)" />
              </InsightCard>
            )}
          </div>
        </section>
      )}

      {/* 綜合評價 */}
      {tool.sentimentBreakdown && tool.sentimentBreakdown.total >= 5 && (
        <section className="mb-8">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-stone-900">綜合評價</h2>
          <SentimentSummary breakdown={tool.sentimentBreakdown} accent={tool.accent} />
        </section>
      )}

      {/* Quotes */}
      <QuotesSection quotes={tool.quotes} />

      {/* Trend chart + comparisons */}
      {(tool.trend.length >= 2 || tool.competitors.length > 0) && (
        <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
          {tool.trend.length >= 2 && (
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
          )}

          {tool.competitors.length > 0 && (
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

              {(tool.sources.reddit > 0 || tool.sources.hn > 0 || tool.sources.github > 0) && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5">
                  <h3 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-stone-900">訊號來源分布</h3>
                  <SourceBar sources={tool.sources} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="text-[12px] text-stone-400">
        分數綜合了討論量、情緒、來源權重與週對週成長速度。
      </footer>
    </div>
  )
}
