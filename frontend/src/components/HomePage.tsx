'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool, SortKey, SortOption } from '@/lib/data'
import { cx } from '@/lib/utils'
import { ToolLogo, CategoryBadge, TrendArrow, Sparkline, ScoreNumber, RankPill } from '@/components/ui'

function FilterTabs({
  value,
  onChange,
  counts,
  categories,
}: {
  value: string
  onChange: (v: string) => void
  counts: Record<string, number>
  categories: string[]
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1">
      {categories.map((c) => {
        const active = c === value
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cx(
              'group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition whitespace-nowrap',
              active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100',
            )}
          >
            <span>{c}</span>
            <span className={cx('font-mono text-[11px] tabular-nums', active ? 'text-white/60' : 'text-stone-400 group-hover:text-stone-500')}>
              {counts[c] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SortControl({ value, onChange, sorts }: { value: SortKey; onChange: (v: SortKey) => void; sorts: SortOption[] }) {
  return (
    <div className="inline-flex items-center rounded-full border border-stone-200 bg-white p-0.5">
      {sorts.map((s) => {
        const active = s.id === value
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cx('rounded-full px-3 py-1 text-[12.5px] font-medium transition', active ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-800')}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

function FeaturedCard({ tool }: { tool: Tool }) {
  const router = useRouter()
  const rankDelta = tool.prevRank - tool.rank
  const rankLabel =
    tool.rank === 1
      ? '本週冠軍'
      : rankDelta > 0
      ? `較上週 ↑${rankDelta}（原 #${tool.prevRank}）`
      : rankDelta < 0
      ? `較上週 ↓${Math.abs(rankDelta)}（原 #${tool.prevRank}）`
      : `持平 #${tool.prevRank}`

  return (
    <button
      onClick={() => router.push(`/tools/${tool.slug}`)}
      className="group relative flex h-full w-full flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-stone-300 hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.12)]"
    >
      <div className="absolute -top-3 left-5">
        <div
          className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.02em]"
          style={{
            background: tool.rank === 1 ? 'oklch(0.92 0.1 80)' : 'oklch(0.95 0.04 80)',
            color: 'oklch(0.35 0.1 60)',
            border: '1px solid oklch(0.86 0.06 80)',
          }}
        >
          <span className="font-mono">#{tool.rank}</span>
          <span className="opacity-50">·</span>
          <span>{rankLabel}</span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 pt-1">
        <ToolLogo tool={tool} size="lg" />
        <Sparkline data={tool.trend} width={104} height={32} stroke={tool.accent} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-stone-900">{tool.name}</h3>
          <CategoryBadge category={tool.category} />
        </div>
        <p className="text-[13.5px] leading-snug text-stone-600 text-balance">{tool.description}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div>
          <div className="text-[10.5px] tracking-[0.06em] text-stone-400 mb-0.5">熱度分數</div>
          <ScoreNumber value={tool.score} size="lg" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TrendArrow delta={tool.delta} size="lg" />
          <div className="text-[11.5px] text-stone-500 font-mono tabular-nums">
            {tool.discussions.toLocaleString()} 則討論
          </div>
        </div>
      </div>
    </button>
  )
}

function CompactRow({ tool }: { tool: Tool }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/tools/${tool.slug}`)}
      className="group grid w-full grid-cols-[44px_44px_1fr_auto] items-center gap-4 border-b border-stone-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-stone-50 sm:grid-cols-[56px_44px_1.4fr_1fr_auto_auto] sm:gap-5 sm:px-6"
    >
      <RankPill rank={tool.rank} />
      <ToolLogo tool={tool} size="md" />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-stone-900">{tool.name}</span>
          <span className="hidden sm:inline-flex">
            <CategoryBadge category={tool.category} />
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-stone-500">{tool.description}</p>
      </div>

      <div className="hidden sm:block">
        <Sparkline data={tool.trend} width={110} height={26} stroke={tool.accent} />
      </div>

      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <div className="text-[10.5px] tracking-[0.06em] text-stone-400">分數</div>
        <ScoreNumber value={tool.score} size="md" />
      </div>

      <div className="flex flex-col items-end gap-1">
        <TrendArrow delta={tool.delta} />
        <span className="hidden sm:block text-[11px] font-mono text-stone-400 tabular-nums">
          {tool.discussions.toLocaleString()}
        </span>
        <span className="sm:hidden font-mono text-[12px] tabular-nums text-stone-700">{tool.score.toFixed(1)}</span>
      </div>
    </button>
  )
}

function StatLine() {
  const items = [
    { label: '追蹤工具', value: '847' },
    { label: '每日訊號', value: '12.4k' },
    { label: '資料來源', value: 'Reddit · HN · GitHub' },
    { label: '最後更新', value: '14 分鐘前' },
  ]
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12.5px]">
      {items.map((i) => (
        <div key={i.label} className="flex items-baseline gap-2">
          <span className="text-stone-400">{i.label}</span>
          <span className="font-mono font-medium text-stone-800 tabular-nums">{i.value}</span>
        </div>
      ))}
    </div>
  )
}

export function HomePageClient({
  tools,
  categories,
  sorts,
}: {
  tools: Tool[]
  categories: string[]
  sorts: SortOption[]
}) {
  const [cat, setCat] = useState('全部')
  const [sort, setSort] = useState<SortKey>('hot')

  const counts = useMemo(() => {
    const c: Record<string, number> = { '全部': tools.length }
    categories.slice(1).forEach((k) => {
      c[k] = tools.filter((t) => t.category === k).length
    })
    return c
  }, [tools, categories])

  const filtered = useMemo(() => {
    let arr = cat === '全部' ? [...tools] : tools.filter((t) => t.category === cat)
    if (sort === 'hot')       arr.sort((a, b) => b.score - a.score)
    if (sort === 'rising')    arr.sort((a, b) => b.delta - a.delta)
    if (sort === 'discussed') arr.sort((a, b) => b.discussions - a.discussions)
    return arr.map((t, i) => ({ ...t, displayRank: i + 1 }))
  }, [tools, cat, sort])

  const featured = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      {/* Hero */}
      <header className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11.5px] font-medium text-stone-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          即時 · 每 24 小時分析 12,400 則社群訊號
        </div>
        <h1 className="max-w-[820px] text-balance text-[44px] font-semibold leading-[1.08] tracking-[-0.035em] text-stone-900 sm:text-[56px]">
          開發者<span className="text-stone-500">真正在討論</span>的 AI 工具
        </h1>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-stone-600">
          AICommand 從 Reddit、Hacker News、GitHub 上的真實社群討論分析出工具排名——
          不是廠商買位、不是編輯部喜好，而是真實聲量。每小時更新。
        </p>
        <div className="pt-2">
          <StatLine />
        </div>
      </header>

      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-10 -mx-5 mb-5 border-y border-stone-200/80 bg-[#FBFBF9]/85 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs value={cat} onChange={setCat} counts={counts} categories={categories} />
          <SortControl value={sort} onChange={setSort} sorts={sorts} />
        </div>
      </div>

      {/* Top 3 featured */}
      {featured.length === 3 && (
        <section className="mb-6 grid grid-cols-1 gap-4 pt-3 md:grid-cols-3">
          {featured.map((t) => (
            <FeaturedCard key={t.slug} tool={t} />
          ))}
        </section>
      )}

      {/* Compact list */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="hidden grid-cols-[56px_44px_1.4fr_1fr_auto_auto] gap-5 border-b border-stone-100 bg-stone-50/60 px-6 py-2.5 text-[11px] font-medium tracking-[0.04em] text-stone-500 sm:grid">
          <div>排名</div>
          <div />
          <div>工具</div>
          <div>近 8 週趨勢</div>
          <div className="text-right">分數</div>
          <div className="text-right">變化 / 討論</div>
        </div>
        {rest.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-stone-500">此分類目前還沒有更多工具</div>
        ) : (
          rest.map((t) => <CompactRow key={t.slug} tool={t} />)
        )}
      </section>

      <footer className="mt-10 flex flex-col gap-2 text-[12px] text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <div>分數綜合了討論量、情緒、來源權重與週對週成長速度。</div>
        <div className="font-mono tabular-nums">v0.4.2 · 更新於 2026-05-21 09:14 UTC</div>
      </footer>
    </div>
  )
}
