'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool, SortKey, SortOption } from '@/lib/data'
import { cx } from '@/lib/utils'
import { ToolLogo, CategoryBadge, TrendArrow, Sparkline, ScoreNumber, RankPill } from '@/components/ui'
import { TERM_LINKS } from '@/lib/glossary'
import { SourcesRail } from '@/components/SourcesRail'
import { DiscussionsRail } from '@/components/DiscussionsRail'
import type { RecentDiscussion } from '@/lib/supabase'

interface VibeResult {
  slug: string
  name: string
  reason: string
  highlights: string[]
}

function RobotAvatar() {
  return (
    <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white mt-0.5 shadow-sm">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        {/* antenna */}
        <line x1="11" y1="1.5" x2="11" y2="4.5" stroke="oklch(0.55 0.15 265)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="1.5" r="1.2" fill="oklch(0.55 0.18 280)" />
        {/* head */}
        <rect x="3" y="5" width="16" height="12" rx="3.5" fill="oklch(0.97 0.005 80)" stroke="oklch(0.85 0.01 80)" strokeWidth="1" />
        {/* eyes */}
        <rect x="6" y="8.5" width="4" height="4" rx="2" fill="oklch(0.35 0.01 250)" />
        <rect x="12" y="8.5" width="4" height="4" rx="2" fill="oklch(0.35 0.01 250)" />
        {/* eye shine */}
        <circle cx="7.2" cy="9.7" r="0.8" fill="white" />
        <circle cx="13.2" cy="9.7" r="0.8" fill="white" />
        {/* mouth */}
        <path d="M8 14.5 Q11 16.5 14 14.5" stroke="oklch(0.5 0.01 250)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}

function AnnotatedText({
  text,
  className,
  onTermClick,
}: {
  text: string
  className?: string
  onTermClick: (id: string) => void
}) {
  const sorted = [...TERM_LINKS].sort((a, b) => b.term.length - a.term.length)
  const pattern = new RegExp(
    `(${sorted.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(pattern)
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const entry = sorted.find((t) => t.term.toLowerCase() === part.toLowerCase())
        if (entry) {
          return (
            <span
              key={i}
              onClick={(e) => { e.stopPropagation(); onTermClick(entry.id) }}
              className="cursor-pointer border-b border-dashed border-stone-400 text-stone-800 hover:border-stone-700 transition-colors"
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

const VIBE_EXAMPLES = [
  '不用命令列的 vibe coding 工具',
  '能自動開 PR 的 coding agent',
  '雲端跑、不佔本機資源',
  '最適合獨立開發者的 AI IDE',
]

function VibeSearch({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<VibeResult[] | null>(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuery(trimmed)
    setLoading(true)
    setResults(null)
    setAiUnavailable(false)
    try {
      const res = await fetch('/api/vibe-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      const data = await res.json()
      if (data.error === 'ai_unavailable') {
        setAiUnavailable(true)
        setResults([])
      } else {
        setResults(data.results ?? [])
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    } catch {
      setAiUnavailable(true)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const matchedTools = (results ?? [])
    .map((r) => ({ result: r, tool: tools.find((t) => t.slug === r.slug) }))
    .filter((x): x is { result: VibeResult; tool: Tool } => !!x.tool)

  const goToTerm = useCallback((id: string) => router.push(`/glossary#${id}`), [router])

  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" fill="oklch(0.55 0.18 280)" />
        </svg>
        <span className="text-[11.5px] font-semibold tracking-[0.07em] text-stone-500 uppercase">Vibe Search</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(query) }}
          placeholder="描述你想找的工具，例如：不用命令列的 vibe coding 工具"
          className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="rounded-xl px-5 py-3 text-[13.5px] font-medium text-white transition disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'oklch(0.22 0.01 250)' }}
        >
          {loading ? '搜尋中…' : '搜尋'}
        </button>
      </div>

      {results === null && !loading && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {VIBE_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleSearch(ex)}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[12px] text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3 pt-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {(results !== null || aiUnavailable) && !loading && (
        <div ref={resultsRef} className="pt-1">
          <div className="flex items-start gap-3">
            <RobotAvatar />

            {/* Chat bubble */}
            <div className="flex-1 min-w-0 rounded-2xl rounded-tl-md border border-stone-200 bg-stone-50 p-4">
              {/* Robot speech */}
              <p className="text-[14px] leading-relaxed text-stone-700 mb-4">
                {aiUnavailable ? (
                  <>本 AI 今天休息了，明天再來問我吧。</>
                ) : matchedTools.length > 0 ? (
                  <>根據「<span className="font-semibold text-stone-900">{query}</span>」，我找到 <span className="font-semibold text-stone-900">{matchedTools.length} 款</span>符合的工具：</>
                ) : (
                  <>根據「<span className="font-semibold text-stone-900">{query}</span>」，沒有找到完全符合的工具，試試換個描述方式。</>
                )}
              </p>


              {/* Tool cards inside bubble */}
              {matchedTools.length > 0 && (
                <div className="space-y-2.5">
                  {matchedTools.map(({ result, tool }, index) => (
                    <button
                      key={tool.slug}
                      onClick={() => router.push(`/tools/${tool.slug}`)}
                      className="group relative flex w-full gap-3 overflow-hidden rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-300 hover:shadow-sm"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: tool.accent }} />
                      <div className="pl-1 flex w-full gap-3 items-start">
                        <ToolLogo tool={tool} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[15px] font-semibold text-stone-900">{tool.name}</span>
                              <CategoryBadge category={tool.category} />
                            </div>
                            <span className="shrink-0 font-mono text-[11px] font-semibold" style={{ color: tool.accent }}>
                              #{index + 1}
                            </span>
                          </div>
                          <AnnotatedText
                            text={result.reason}
                            className="mb-2.5 block text-[14px] font-medium leading-snug text-stone-800"
                            onTermClick={goToTerm}
                          />
                          {result.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {result.highlights.map((h, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium"
                                  style={{
                                    background: `color-mix(in oklch, ${tool.accent} 12%, white)`,
                                    color: tool.accent,
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => { setResults(null); setQuery('') }}
            className="mt-2.5 ml-12 text-[12px] text-stone-400 transition hover:text-stone-700"
          >
            ← 清除搜尋
          </button>
        </div>
      )}
    </div>
  )
}

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

function OfficialLink({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cx(
        'inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-[11.5px] font-medium text-stone-500 transition hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50',
        className,
      )}
    >
      官網
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
        <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function FeaturedCard({ tool }: { tool: Tool }) {
  const router = useRouter()
  const rankDelta = tool.prevRank - tool.rank
  const rankLabel =
    tool.rank === 1
      ? '本週冠軍'
      : rankDelta > 0
      ? `較上週 ↑${rankDelta}`
      : rankDelta < 0
      ? `較上週 ↓${Math.abs(rankDelta)}`
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
        {tool.description && (
          <p className="text-[13.5px] leading-snug text-stone-600 text-balance">{tool.description}</p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div className="flex items-end gap-3">
          {tool.score > 0 && (
            <div>
              <div className="text-[10.5px] tracking-[0.06em] text-stone-400 mb-0.5">熱度分數</div>
              <ScoreNumber value={tool.score} size="lg" />
            </div>
          )}
          {tool.website && <OfficialLink url={tool.website} />}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {tool.delta !== 0 && <TrendArrow delta={tool.delta} size="lg" />}
          <div className="text-[11.5px] text-stone-500 font-mono tabular-nums">
            {tool.discussions > 0 ? `${tool.discussions.toLocaleString()} 則討論` : '資料收集中'}
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
      className="group grid w-full grid-cols-[44px_44px_1fr_auto] items-center gap-3 border-b border-stone-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-stone-50 sm:grid-cols-[48px_40px_1fr_96px_72px_72px_80px] sm:gap-4 sm:px-6"
    >
      {/* 排名 */}
      <RankPill rank={tool.rank} />

      {/* Logo */}
      <ToolLogo tool={tool} size="md" />

      {/* 工具名稱 */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-stone-900">{tool.name}</span>
          <span className="hidden sm:inline-flex"><CategoryBadge category={tool.category} /></span>
        </div>
        {tool.description && (
          <p className="mt-0.5 truncate text-[12.5px] text-stone-500">{tool.description}</p>
        )}
      </div>

      {/* 趨勢 */}
      <div className="hidden sm:flex items-center">
        <Sparkline data={tool.trend} width={96} height={26} stroke={tool.accent} />
      </div>

      {/* 熱度分數 */}
      <div className="hidden sm:flex items-center justify-end">
        {tool.score > 0
          ? <ScoreNumber value={tool.score} size="md" />
          : <span className="text-[12px] text-stone-300">—</span>
        }
      </div>

      {/* 總討論數 */}
      <div className="hidden sm:flex items-center justify-end">
        <span className="font-mono text-[13px] tabular-nums text-stone-600">
          {tool.discussions > 0 ? tool.discussions.toLocaleString() : '—'}
        </span>
      </div>

      {/* 官網連結 */}
      <div className="hidden sm:flex items-center justify-end">
        {tool.website
          ? <OfficialLink url={tool.website} />
          : <span className="text-[12px] text-stone-300">—</span>
        }
      </div>

      {/* mobile 僅顯示分數 */}
      {tool.score > 0 && (
        <span className="sm:hidden font-mono text-[12px] tabular-nums text-stone-700">{tool.score.toFixed(1)}</span>
      )}
    </button>
  )
}

export function HomePageClient({
  tools,
  categories,
  sorts,
  discussions = [],
}: {
  tools: Tool[]
  categories: string[]
  sorts: SortOption[]
  discussions?: RecentDiscussion[]
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
      <header className="mb-10">
        <h1 className="max-w-[820px] text-balance text-[44px] font-semibold leading-[1.08] tracking-[-0.035em] text-stone-900 sm:text-[56px]">
          開發者<span className="text-stone-500">真正在討論</span>的 AI 工具
        </h1>
        <p className="mt-4 max-w-[580px] text-[15px] leading-relaxed text-stone-600">
          匯集 Reddit、HN、PTT、Dcard 的真實評論，看懂每款 AI 工具的社群口碑。
        </p>
        <VibeSearch tools={tools} />
      </header>

      {/* Data sources marquee */}
      <SourcesRail />

      {/* Community discussions marquee */}
      <DiscussionsRail discussions={discussions} />

      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-10 -mx-5 mb-5 border-y border-stone-200/80 bg-[#FBFBF9]/85 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs value={cat} onChange={setCat} counts={counts} categories={categories} />
          <SortControl value={sort} onChange={setSort} sorts={sorts} />
        </div>
      </div>

      {/* Top 3 featured */}
      {featured.length > 0 && (
        <section className="mb-6 grid grid-cols-1 gap-4 pt-3 md:grid-cols-3">
          {featured.map((t) => (
            <FeaturedCard key={t.slug} tool={t} />
          ))}
        </section>
      )}

      {/* Compact list */}
      {rest.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="hidden grid-cols-[48px_40px_1fr_96px_72px_72px_80px] gap-4 border-b border-stone-100 bg-stone-50/60 px-6 py-2.5 text-[11px] font-medium tracking-[0.04em] text-stone-500 sm:grid">
            <div>排名</div>
            <div />
            <div>工具</div>
            <div>趨勢</div>
            <div className="text-right">熱度分數</div>
            <div className="text-right">總討論數</div>
            <div className="text-right">官網連結</div>
          </div>
          {rest.map((t) => <CompactRow key={t.slug} tool={t} />)}
        </section>
      )}

      <footer className="mt-10 text-[12px] text-stone-400">
        分數綜合了討論量、情緒、來源權重與週對週成長速度。
      </footer>
    </div>
  )
}
