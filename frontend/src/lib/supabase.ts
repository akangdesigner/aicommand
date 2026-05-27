import { createClient } from '@supabase/supabase-js'
import type { Tool } from '@/lib/data'
import { TOOLS } from '@/lib/data'

export interface RecentDiscussion {
  toolName: string
  text: string
  source: string
  author?: string
  url?: string
  sentiment: 'positive' | 'negative' | 'mixed'
  date: string
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  // Server-side: prefer service key (bypasses RLS). Client-side: falls back to anon key.
  const key = process.env.SUPABASE_SERVICE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? ''
  if (!url || !key) return null
  return createClient(url, key)
}

interface SupabaseTool {
  slug: string
  name: string
  category: string
  description: string
  official_url: string | null
  logo_url: string | null
  ranking_score: number
  mention_count: number
  trend_delta: number
}

const CATEGORY_MAP: Record<string, Tool['category']> = {
  coding:     '程式開發',
  writing:    '寫作',
  image:      '圖像生成',
  automation: '自動化',
  voice:      '語音',
}

function growthText(delta: number): string {
  if (delta > 5)  return `本週 +${delta.toFixed(0)}%`
  if (delta > 0)  return `本週 +${delta.toFixed(1)}`
  if (delta < -5) return `本週 ${delta.toFixed(0)}%`
  if (delta < 0)  return `本週 ${delta.toFixed(1)}`
  return '本週持平'
}

export async function getToolsForHomePage(): Promise<Tool[]> {
  const supabase = getClient()
  if (!supabase) return TOOLS

  const allowedSlugs = TOOLS.map((t) => t.slug)

  let data: SupabaseTool[] | null = null
  try {
    const res = await supabase
      .from('tools')
      .select('slug, name, category, description, official_url, logo_url, ranking_score, mention_count, trend_delta')
      .in('slug', allowedSlugs)
      .order('ranking_score', { ascending: false })
      .order('mention_count', { ascending: false })
    if (res.error) throw res.error
    data = res.data
  } catch (err) {
    console.error('[supabase] getToolsForHomePage error:', err)
    return TOOLS
  }

  if (!data || data.length === 0) return TOOLS

  const liveSlugs = new Set(data.map((r: SupabaseTool) => r.slug))
  const maxRaw = Math.max(...data.map((r) => Number(r.ranking_score)).filter(Boolean), 1)
  const norm = (raw: number) => Math.round((raw / maxRaw) * 100 * 10) / 10

  const merged: Tool[] = data.map((row: SupabaseTool, index: number) => {
    const config = TOOLS.find((t) => t.slug === row.slug)
    const score = norm(Number(row.ranking_score))
    const delta = Number(row.trend_delta)
    return {
      rank: index + 1,
      prevRank: index + 1,
      slug: row.slug,
      name: row.name,
      initials: config?.initials ?? row.name.slice(0, 2).toUpperCase(),
      accent: config?.accent ?? 'oklch(0.55 0.15 240)',
      description: config?.description || row.description || '',
      category: CATEGORY_MAP[row.category] ?? config?.category ?? '程式開發',
      score,
      delta,
      discussions: Number(row.mention_count),
      growth: growthText(delta),
      sources: { reddit: 0, hn: 0, github: 0 },
      audiences: [],
      useCases: [],
      painPoints: [],
      pricingFeel: '',
      quotes: [],
      competitors: [],
      trend: [],
      website: row.official_url ?? config?.website,
      logo_url: row.logo_url ?? config?.logo_url,
    }
  })

  // 還沒進 Supabase 的工具排在最後
  const extras = TOOLS
    .filter((t) => !liveSlugs.has(t.slug))
    .map((t, i) => ({ ...t, rank: merged.length + i + 1, prevRank: merged.length + i + 1 }))

  return [...merged, ...extras]
}

const TOOL_TERMS = ['Claude Code', 'Cursor', 'Windsurf', 'Trae', 'Codex']

function sourcePlatformLabel(source: string): string {
  if (source === 'github') return 'GitHub'
  if (source === 'hn') return 'Hacker News'
  if (source === 'ptt') return 'PTT'
  if (source === 'dcard') return 'Dcard'
  if (source === 'v2ex') return 'V2EX'
  if (source === 'juejin') return '掘金'
  return 'Reddit'
}

export async function getRecentDiscussions(limit = 24): Promise<RecentDiscussion[]> {
  const supabase = getClient()
  if (!supabase) return []

  try {
    const filter = TOOL_TERMS.map((t) => `content.ilike.*${t}*`).join(',')
    const { data, error } = await supabase
      .from('raw_mentions')
      .select('id, content, source, metadata, crawled_at')
      .or(filter)
      .order('crawled_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data
      .filter((r) => (r.content?.length ?? 0) > 60)
      .map((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        const content = r.content as string
        const toolName = TOOL_TERMS.find((t) => content.toLowerCase().includes(t.toLowerCase())) ?? ''
        const text = content.replace(/\[.*?\]\n?/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)
        return {
          toolName,
          text,
          source: sourcePlatformLabel(r.source as string),
          author: ((meta.author ?? meta.username ?? meta.login) as string) || undefined,
          url: (meta.url as string) || undefined,
          sentiment: 'mixed' as const,
          date: r.crawled_at
            ? new Date(r.crawled_at as string).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
            : '',
        }
      })
  } catch (err) {
    console.error('[supabase] getRecentDiscussions error:', err)
    return []
  }
}
