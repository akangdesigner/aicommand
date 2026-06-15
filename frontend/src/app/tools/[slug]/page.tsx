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

function extractToolSnippet(content: string, toolName: string): string {
  const cleaned = content.replace(/\[.*?\]\n?/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  const lower = cleaned.toLowerCase()
  const idx = lower.indexOf(toolName.toLowerCase())
  if (idx < 0) return cleaned.slice(0, 280)
  const start = Math.max(0, idx - 100)
  const end = Math.min(cleaned.length, idx + 220)
  return (start > 0 ? '…' : '') + cleaned.slice(start, end).trim() + (end < cleaned.length ? '…' : '')
}

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }))
}

const BASE = 'https://aicommand.aiqkangber.com'

// 確保 meta description 夠長（Ahrefs 門檻約 110 字元），避免「Meta description too short」
function buildToolDescription(name: string, extra?: string | null): string {
  const core = `${name} 的真實社群評價與熱度排名：彙整 Reddit、Hacker News、PTT、Dcard 的討論，分析使用心得、優缺點、定價友善度與競品比較，每週依社群聲量自動更新，不是廠商買位。`
  return extra ? `${core}${extra}` : core
}

// 完整 Open Graph + Twitter，避免「Open Graph tags incomplete」
function buildToolMetadata(name: string, slug: string, extra?: string | null): Metadata {
  const url = `${BASE}/tools/${slug}`
  const description = buildToolDescription(name, extra)
  const ogImage = `${BASE}/og?title=${encodeURIComponent(name)}`
  return {
    title: `${name} 評測、評價、社群口碑`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'zh_TW',
      siteName: 'AICommand',
      title: `${name} · AICommand`,
      description: `${name} 社群口碑、熱度分數與使用者評價，資料來自 Reddit、HN、PTT、Dcard。`,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} · AICommand` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} · AICommand`,
      description: `${name} 社群口碑、熱度分數與使用者評價`,
      images: [ogImage],
    },
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const config = TOOLS.find((t) => t.slug === params.slug)

  if (config) return buildToolMetadata(config.name, config.slug, config.description)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const { data } = await createClient(url, key)
      .from('tools').select('name, description, slug').eq('slug', params.slug).single()
    if (data) return buildToolMetadata(data.name, data.slug, data.description)
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

  const sb = createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })

  const { data: toolRow } = await sb
    .from('tools')
    .select('slug, name, category, description, official_url, logo_url, heat_score, ranking_score, mention_count, trend_delta, community_summary')
    .eq('slug', slug)
    .single()

  const toolName = toolRow?.name ?? config.name

  const [rawMentionsRes, trendRes, allToolsRes, summaryRes, individualInsightsRes, mentionCountRes] = await Promise.all([
    sb.from('raw_mentions')
      .select('id, content, source, metadata, crawled_at')
      .like('content', `%${toolName}%`)
      .order('crawled_at', { ascending: false })
      .limit(80),
    sb.from('tool_weekly_trends')
      .select('week, mention_count')
      .ilike('tool_name', toolName)
      .order('week', { ascending: true })
      .limit(12),
    sb.from('tools')
      .select('slug, name, category, description, heat_score, mention_count, trend_delta')
      .order('heat_score', { ascending: false })
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
      .select('raw_mention_id, sentiment, raw_quote, confidence')
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
  const individualInsights = (individualInsightsRes.data ?? []) as Array<{ raw_mention_id: number; sentiment: string | null; raw_quote: string | null; confidence: number | null }>
  const insightById = new Map(
    individualInsights
      .filter((r) => r.raw_mention_id != null && r.sentiment != null)
      .map((r) => [r.raw_mention_id, r])
  )


  function rawPlatformLabel(source: string): string {
    if (source === 'github') return 'GitHub'
    if (source === 'hn') return 'Hacker News'
    if (source === 'ptt') return 'PTT'
    if (source === 'dcard') return 'Dcard'
    if (source === 'threads') return 'Threads'
    if (source === 'v2ex') return 'V2EX'
    if (source === 'juejin') return '掘金'
    return 'Reddit'
  }

  const distinctSources = new Set(
    (rawMentionsRes.data ?? []).map((r: any) => r.source).filter(Boolean)
  ).size

  // 直接用 insight IDs fetch raw_mentions，確保取得有 AI 分析的貼文
  const insightRawIds = (individualInsightsRes.data ?? [])
    .filter(r => r.raw_mention_id != null)
    .map(r => r.raw_mention_id as number)

  const insightMentionRows: any[] = insightRawIds.length > 0
    ? ((await sb.from('raw_mentions')
        .select('id, content, source, metadata, crawled_at')
        .in('id', insightRawIds)).data ?? [])
    : []

  // 來源輪流取（非 github 優先），最多 27 則供 3 頁分頁
  const SOURCE_ORDER = ['reddit', 'hn', 'ptt', 'dcard', 'threads', 'github']
  const bySource: Record<string, any[]> = {}
  for (const r of insightMentionRows) {
    const s = (r.source as string) ?? 'other'
    if (!bySource[s]) bySource[s] = []
    bySource[s]!.push(r)
  }
  const interleaved: any[] = []
  const keys = [...SOURCE_ORDER.filter(s => bySource[s]), ...Object.keys(bySource).filter(s => !SOURCE_ORDER.includes(s))]
  let qi = 0
  while (interleaved.length < 27) {
    let added = false
    for (const key of keys) {
      const arr = bySource[key]!
      if (qi < arr.length) { interleaved.push(arr[qi]!); added = true }
      if (interleaved.length >= 27) break
    }
    if (!added) break
    qi++
  }
  const quotes: Quote[] = interleaved
    .map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      const aiInsight = insightById.get(r.id as number)
      const quote = aiInsight?.raw_quote?.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
      const quoteHasTool = quote && quote.toLowerCase().includes(toolName.toLowerCase())
      const rawText = quoteHasTool
        ? quote!
        : extractToolSnippet(r.content as string, toolName)
      const text = rawText.length > 280 ? rawText.slice(0, 280) + '…' : rawText
      // sentiment 來自 Groq 分析
      const s = aiInsight?.sentiment
      const sentiment: Sentiment = s === 'positive' ? 'positive' : s === 'negative' ? 'negative' : 'mixed'
      // 用原始貼文時間，fallback 爬蟲時間
      const postTime = (meta.created_utc as number)
        ? new Date((meta.created_utc as number) * 1000).toISOString()
        : (meta.created_at as string) || (r.crawled_at as string)
      return {
        text,
        source: rawPlatformLabel(r.source as string),
        sentiment,
        date: relativeDate(postTime),
        url: (meta.url as string) || undefined,
        author: ((meta.author ?? meta.username ?? meta.login) as string) || undefined,
      }
    })

  const competitors: Competitor[] = []

  // 趨勢：與首頁相同邏輯 — tool_weekly_trends mention_count，填補缺失週，normalized 0-100
  function buildTrend(entries: { week: string; mention_count: number }[]): number[] {
    if (entries.length < 2) return [2, 2]
    const sorted = [...entries].sort((a, b) => a.week.localeCompare(b.week))
    const filled: number[] = []
    let cur = new Date(sorted[0].week)
    const last = new Date(sorted[sorted.length - 1].week)
    const byWeek = new Map(sorted.map((e) => [e.week, e.mention_count]))
    while (cur <= last) {
      const key = cur.toISOString().slice(0, 10)
      filled.push(byWeek.get(key) ?? 0)
      cur = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
    if (filled.length < 3) return [2, 2]
    const mx = Math.max(...filled) || 1
    return filled.map((c) => Math.round((c / mx) * 100 * 10) / 10)
  }
  const trend = buildTrend(trendRows as { week: string; mention_count: number }[])

  // sentiment breakdown 從 Groq 個別 insights 計算
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
    const vals = (trendRows as any[]).map((r) => Number(r.mention_count))
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

  // 近期動態：用週趨勢成長動能（recent vs older weeks）代表熱度變化
  const recentActivityScore = trendGrowth

  // 討論深度：Groq 抽取的平均 confidence（代表評論品質與觀點清晰度）
  const avgConfidence = individualInsights.length > 0
    ? individualInsights.reduce((s, r) => s + (r.confidence ?? 0.5), 0) / individualInsights.length
    : 0
  const depthScore = individualInsights.length > 0 ? Math.round(avgConfidence * 100) : 0

  // 討論深度 AI 短評：優先用 Groq 摘要欄位，fallback 到 sentiment 統計
  const depthDescription = (() => {
    if (useCases.length > 0 || painPoints.length > 0) {
      const parts: string[] = []
      if (useCases.length > 0) parts.push(`討論涵蓋${useCases.slice(0, 2).join('、')}等場景`)
      if (painPoints.length > 0) parts.push(`用戶痛點集中在${painPoints[0]}`)
      return parts.join('，')
    }
    if (breakdown.total >= 5) {
      const pct = Math.round(breakdown.positive / breakdown.total * 100)
      if (pct >= 60) return `整體討論偏正面，${pct}% 評論看好此工具`
      if (pct <= 30) return `討論中負面聲音較多，僅 ${pct}% 為正評`
      return `社群看法褒貶不一，討論多元`
    }
    return individualInsights.length > 0 ? `共 ${individualInsights.length} 則評論經 AI 分析` : undefined
  })()

  // AI 工具短評：綜合各面向的總評（非社群短評）
  const aiReview = (() => {
    const parts: string[] = []
    const posRatio = breakdown.total > 0 ? Math.round(breakdown.positive / breakdown.total * 100) : -1
    if (recentActivityScore >= 60) parts.push('近期持續更新')
    if (pricingScore >= 75) parts.push('定價友善')
    else if (pricingScore <= 40) parts.push('定價偏高')
    if (posRatio >= 60) parts.push('社群評價正面')
    else if (posRatio >= 0 && posRatio <= 35) parts.push('社群評價偏負面')
    else if (posRatio > 35) parts.push('評價褒貶不一')
    if (useCases.length > 0) parts.push(`適合用於${useCases.slice(0, 2).join('、')}`)
    if (painPoints.length > 0) parts.push(`常見痛點：${painPoints[0]}`)
    if (audiences.length > 0) parts.push(`主要使用者為${audiences.slice(0, 2).join('、')}`)
    return parts.length > 0 ? parts.join('，') + '。' : undefined
  })()

  const radarScores: number[] = [
    Math.min(100, Math.round(totalMentions / 800 * 100)),  // 社群熱度
    opinionScore,                                           // 社群口碑
    pricingScore,                                           // 定價友善度
    recentActivityScore,                                    // 近期動態
    depthScore,                                             // 討論深度（TBD）
  ]

  // 排名：按 heat_score 排序（與首頁一致），都是 0 改用 mention_count
  const allToolRows = allToolsRes.data ?? []
  const hasHeatScore = allToolRows.some((r: any) => Number(r.heat_score) > 0)
  const sortedRows = [...allToolRows].sort((a: any, b: any) =>
    hasHeatScore
      ? Number(b.heat_score) - Number(a.heat_score)
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
    depthDescription,
    aiReview,
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
