import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '@/lib/data'
import { DetailPageClient } from '@/components/DetailPage'
import type { Tool, Quote, Competitor, Sentiment } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

const CATEGORY_MAP: Record<string, Tool['category']> = {
  coding: '程式開發', writing: '寫作', image: '圖像生成',
  automation: '自動化', voice: '語音',
}

function growthText(delta: number): string {
  if (delta > 5)  return `本週 +${delta.toFixed(0)}%`
  if (delta > 0)  return `本週 +${delta.toFixed(1)}`
  if (delta < -5) return `本週 ${delta.toFixed(0)}%`
  if (delta < 0)  return `本週 ${delta.toFixed(1)}`
  return '本週持平'
}

function topUnique(arr: string[], n = 5): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const s of arr) {
    const key = s.toLowerCase().trim()
    if (key && !seen.has(key)) { seen.add(key); result.push(s) }
    if (result.length >= n) break
  }
  return result
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '1 天前'
  if (days < 7)  return `${days} 天前`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} 週前`
  return `${Math.floor(days / 30)} 個月前`
}

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const config = TOOLS.find((t) => t.slug === params.slug)
  if (config) return { title: `${config.name} · AICommand`, description: config.description }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const { data } = await createClient(url, key)
      .from('tools').select('name, description').eq('slug', params.slug).single()
    if (data) return { title: `${data.name} · AICommand`, description: data.description }
  }
  return {}
}

export default async function ToolPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const config = TOOLS.find((t) => t.slug === slug)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 不在我們的工具清單裡 → 404
  if (!config) return notFound()

  if (!url || !key) {
    // 無 Supabase — 顯示空白狀態
    return <DetailPageClient tool={{ ...config, rank: 0, prevRank: 0 }} allTools={TOOLS.map((t, i) => ({ ...t, rank: i + 1, prevRank: i + 1 }))} />
  }

  const sb = createClient(url, key)

  const { data: toolRow } = await sb
    .from('tools')
    .select('slug, name, category, description, official_url, logo_url, ranking_score, mention_count, trend_delta, community_summary')
    .eq('slug', slug)
    .single()

  const toolName = toolRow?.name ?? config.name

  const [rawMentionsRes, trendRes, allToolsRes, summaryRes, individualInsightsRes, mentionCountRes] = await Promise.all([
    sb.from('raw_mentions')
      .select('id, content, source, metadata, crawled_at')
      .ilike('content', `%${toolName}%`)
      .order('crawled_at', { ascending: false })
      .limit(80),
    sb.from('tool_weekly_trends')
      .select('week, mention_count')
      .ilike('tool_name', toolName)
      .order('week', { ascending: true })
      .limit(8),
    sb.from('tools')
      .select('slug, name, category, description, ranking_score, mention_count, trend_delta')
      .order('ranking_score', { ascending: false })
      .limit(10),
    // 30 則整合摘要（summarize.py 產生，confidence=0.95）→ 社群洞察
    sb.from('extracted_insights')
      .select('use_cases, pain_points, target_audience, sentiment, pricing_signal, raw_quote')
      .ilike('tool_name', toolName)
      .gte('confidence', 0.95)
      .order('extracted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 個別評論 insights（extractor.py 產生，confidence < 0.95）→ sentiment join + breakdown + raw_quote
    sb.from('extracted_insights')
      .select('raw_mention_id, sentiment, raw_quote')
      .ilike('tool_name', toolName)
      .lt('confidence', 0.95)
      .order('extracted_at', { ascending: false })
      .limit(200),
    // 全量 raw_mentions 計數 → 社群熱度（不抓內容，只取 count）
    sb.from('raw_mentions')
      .select('*', { count: 'exact', head: true })
      .ilike('content', `%${toolName}%`),
  ])

  const trendRows = trendRes.data ?? []

  // 社群洞察來自 30 則整合摘要
  const insight = (summaryRes.data as Record<string, unknown> | null) ?? null
  const useCases: string[]  = (insight?.use_cases as string[]) ?? []
  const painPoints: string[] = (insight?.pain_points as string[]) ?? []
  const audiences: string[]  = (insight?.target_audience as string[]) ?? []
  const pricingFeel: string  = (insight?.pricing_signal as string) ?? ''

  // 個別 insights → raw_mention_id 對應 sentiment
  const individualInsights = (individualInsightsRes.data ?? []) as Array<{ raw_mention_id: number; sentiment: string | null; raw_quote: string | null }>
  const insightById = new Map(
    individualInsights
      .filter((r) => r.raw_mention_id != null && r.sentiment != null)
      .map((r) => [r.raw_mention_id, r])
  )

  // JS 端輕量過濾：排除求救文/教學文，不需要 AI
  const NOISE_RE = /help\s*me|please\s*help|how\s+do\s+i|how\s+to\s+(install|setup|use|fix)|error|bug|crash|not\s*working|求救|求助|怎麼安裝|怎麼設定|安裝教學|教學|issue\s*#\d/i
  function isLikelyReview(text: string) {
    return text.length > 120 && !NOISE_RE.test(text.slice(0, 400))
  }

  function rawPlatformLabel(source: string): string {
    if (source === 'github') return 'GitHub'
    if (source === 'hn') return 'Hacker News'
    if (source === 'ptt') return 'PTT'
    if (source === 'dcard') return 'Dcard'
    if (source === 'v2ex') return 'V2EX'
    if (source === 'juejin') return '掘金'
    return 'Reddit'
  }

  const distinctSources = new Set(
    (rawMentionsRes.data ?? []).map((r: any) => r.source).filter(Boolean)
  ).size

  const quotes: Quote[] = (rawMentionsRes.data ?? [])
    .filter((r) => isLikelyReview(r.content as string ?? ''))
    .slice(0, 10)
    .map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      const aiInsight = insightById.get(r.id as number)
      const rawText = aiInsight?.raw_quote || (r.content as string)
      const text = rawText
        .replace(/\[.*?\]\n?/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300)
      // AI 分析過就用其 sentiment，否則不標（顯示 mixed）
      const s = aiInsight?.sentiment
      const sentiment: Sentiment = s === 'positive' ? 'positive' : s === 'negative' ? 'negative' : 'mixed'
      return {
        text,
        source: rawPlatformLabel(r.source as string),
        sentiment,
        date: relativeDate(r.crawled_at as string),
        url: (meta.url as string) || undefined,
        author: ((meta.author ?? meta.username ?? meta.login) as string) || undefined,
      }
    })

  const competitors: Competitor[] = []

  // 趨勢
  const trend: number[] =
    trendRows.length >= 3
      ? (() => {
          const vals = trendRows.map((r) => Number(r.mention_count))
          while (vals.length < 8) vals.unshift(Math.round(vals[0] * 0.85))
          return vals
        })()
      : []

  // sentiment breakdown 從個別 insights 計算（neutral 算作 mixed）
  const breakdown = { positive: 0, negative: 0, mixed: 0, total: 0 }
  for (const row of individualInsights) {
    if (row.sentiment === 'positive') breakdown.positive++
    else if (row.sentiment === 'negative') breakdown.negative++
    else breakdown.mixed++
    breakdown.total++
  }
  const sentimentBreakdown = breakdown.total >= 5 ? breakdown : undefined

  // 多維度雷達圖分數（0–100）
  const totalMentions = mentionCountRes.count ?? (rawMentionsRes.data ?? []).length

  // 社群口碑：掃 raw content 正/負關鍵字比例（不需 AI）
  const POS_RE = /\b(love|great|amazing|excellent|perfect|awesome|best|highly recommend|worth|useful|impressive|game.?changer|fantastic)\b|喜歡|好用|推薦|讚|棒|優秀|方便|省時|強大/i
  const NEG_RE = /\b(hate|terrible|awful|horrible|worst|useless|disappointing|waste|broken|slow|buggy|overpriced)\b|不好用|爛|很差|難用|不推|貴|太貴|卡|爛掉|失望/i
  const rawContents = (rawMentionsRes.data ?? []).map((r: any) => (r.content as string) ?? '')
  const posCount = rawContents.filter(t => POS_RE.test(t)).length
  const negCount = rawContents.filter(t => NEG_RE.test(t)).length
  const total = rawContents.length || 1
  const opinionScore = Math.round(Math.max(10, Math.min(95, (posCount - negCount * 1.5) / total * 100 + 55)))

  // 成長趨勢：近 2 週 vs 前幾週平均，映射到 0–100（50 = 持平）
  const trendGrowth = (() => {
    const vals = trendRows.map((r: any) => Number(r.mention_count))
    if (vals.length >= 4) {
      const recent = (vals[vals.length - 1] + vals[vals.length - 2]) / 2
      const older = vals.slice(0, -2).reduce((a: number, b: number) => a + b, 0) / (vals.length - 2)
      const pct = older > 0 ? ((recent - older) / older) * 100 : 0
      return Math.round(Math.max(0, Math.min(100, pct * 1.5 + 50)))
    }
    return 50
  })()

  // 定價友善度（人工設定，100 = 完全免費，0 = 非常昂貴）
  const PRICING_SCORES: Record<string, number> = {
    'trae':        100,  // 完全免費（ByteDance 補貼）
    'windsurf':    75,   // 有免費方案，付費 $15/mo
    'cursor':      65,   // 有免費方案，付費 $20/mo
    'codex':       50,   // OpenAI API pay-per-use，用量難預期
    'claude-code': 35,   // 需要 Claude Pro $20+，agent 模式用量高
  }
  const pricingScore = PRICING_SCORES[slug] ?? 50

  // 近期動態：官方 recentUpdates 條數（每條 20 分，上限 100）
  const recentActivityScore = Math.min(100, (config.recentUpdates?.length ?? 0) * 20)

  // 討論深度：raw mentions 平均字數（500 字 = 滿分）
  const avgLen = rawContents.length > 0
    ? rawContents.reduce((s: number, t: string) => s + t.length, 0) / rawContents.length
    : 0
  const depthScore = Math.min(100, Math.round(avgLen / 500 * 100))

  const radarScores: number[] = [
    Math.min(100, Math.round(totalMentions / 800 * 100)),  // 社群熱度
    opinionScore,                                           // 社群口碑
    pricingScore,                                           // 定價友善度
    recentActivityScore,                                    // 近期動態
    depthScore,                                             // 討論深度（TBD）
  ]

  // 排名：按 ranking_score 排序，都是 0 改用 mention_count
  const allToolRows = allToolsRes.data ?? []
  const hasRankingScore = allToolRows.some((r: any) => Number(r.ranking_score) > 0)
  const sortedRows = [...allToolRows].sort((a: any, b: any) =>
    hasRankingScore
      ? Number(b.ranking_score) - Number(a.ranking_score)
      : Number(b.mention_count) - Number(a.mention_count)
  )
  const toolRank = sortedRows.findIndex((r: any) => r.slug === slug) + 1 || 1

  // 綜合分數 = radarScores 加權平均（熱度 30% + 口碑 40% + 其餘各 10%）
  const score = Math.round(
    (radarScores[0] * 0.3 + radarScores[1] * 0.4 + radarScores[2] * 0.1 + radarScores[3] * 0.1 + radarScores[4] * 0.1) * 10
  ) / 10

  const tool: Tool = {
    rank: toolRank,
    prevRank: toolRank,
    slug: config.slug,
    name: toolRow?.name ?? config.name,
    initials: config.initials,
    accent: config.accent,
    description: config.description || toolRow?.description || '',
    category: toolRow ? (CATEGORY_MAP[toolRow.category] ?? config.category) : config.category,
    score,
    delta: Number(toolRow?.trend_delta ?? 0),
    discussions: totalMentions,
    growth: toolRow ? growthText(Number(toolRow.trend_delta)) : '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences,
    useCases,
    painPoints,
    pricingFeel,
    quotes,
    competitors,
    trend,
    sentimentBreakdown,
    website: (toolRow as any)?.official_url ?? config.website,
    logo_url: (toolRow as any)?.logo_url ?? config.logo_url,
    features: config.features,
    recentUpdates: config.recentUpdates,
    docsUrl: config.docsUrl,
    radarScores,
    communitySummary: (insight?.raw_quote as string) || undefined,
    pricingDescription: config.pricingDescription,
  }

  // allTools for competitor navigation
  const allTools: Tool[] = TOOLS.map((t) => {
    const row = allToolRows.find((r: any) => r.slug === t.slug)
    const rank = sortedRows.findIndex((r: any) => r.slug === t.slug) + 1 || 99
    return {
      ...t,
      rank,
      prevRank: rank,
      score: 0,
      discussions: row ? Number(row.mention_count) : 0,
      description: t.description || row?.description || '',
      logo_url: t.logo_url,
    }
  })

  return <DetailPageClient tool={tool} allTools={allTools} />
}
