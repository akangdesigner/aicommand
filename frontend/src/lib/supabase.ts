import { createClient } from '@supabase/supabase-js'
import type { Tool } from '@/lib/data'
import { TOOLS } from '@/lib/data'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = url && anonKey ? createClient(url, anonKey) : null

interface SupabaseTool {
  slug: string
  name: string
  category: string
  description: string
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

const ACCENT_HUES = [265, 35, 165, 310, 200, 30, 240, 140, 50, 0]

function makeBasicTool(row: SupabaseTool, rank: number): Tool {
  const hue = ACCENT_HUES[row.slug.charCodeAt(0) % ACCENT_HUES.length]
  const base = Number(row.ranking_score)
  return {
    rank, prevRank: rank,
    slug: row.slug,
    name: row.name,
    initials: row.name.slice(0, 2).toUpperCase(),
    accent: `oklch(0.55 0.15 ${hue})`,
    description: row.description || 'AI 工具',
    category: CATEGORY_MAP[row.category] || '程式開發',
    score: base,
    delta: Number(row.trend_delta),
    discussions: row.mention_count,
    growth: growthText(Number(row.trend_delta)),
    sources: { reddit: 0, hn: 0, github: row.mention_count },
    audiences: [],
    useCases: [],
    painPoints: [],
    pricingFeel: '社群洞察資料收集中，敬請期待。',
    quotes: [],
    competitors: [],
    trend: [0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1].map((f) => Number((base * f).toFixed(1))),
  }
}

export async function getToolsForHomePage(): Promise<Tool[]> {
  if (!supabase) return TOOLS

  const { data, error } = await supabase
    .from('tools')
    .select('slug, name, category, description, ranking_score, mention_count, trend_delta')
    .order('ranking_score', { ascending: false })
    .order('mention_count', { ascending: false })
    .limit(50)

  if (error || !data || data.length === 0) return TOOLS

  const liveSlugs = new Set(data.map((r: SupabaseTool) => r.slug))

  const merged: Tool[] = data.map((row: SupabaseTool, index: number) => {
    const mock = TOOLS.find((t) => t.slug === row.slug)
    const base = mock ?? makeBasicTool(row, index + 1)
    return {
      ...base,
      slug: row.slug,
      name: row.name,
      category: CATEGORY_MAP[row.category] || base.category,
      description: row.description || base.description,
      rank: index + 1,
      prevRank: index + 1,
      score: Number(row.ranking_score),
      discussions: row.mention_count,
      delta: Number(row.trend_delta),
      growth: growthText(Number(row.trend_delta)),
    }
  })

  // 還沒進 Supabase 的工具排在最後（顯示 mock 資料）
  const extras = TOOLS
    .filter((t) => !liveSlugs.has(t.slug))
    .map((t, i) => ({ ...t, rank: merged.length + i + 1, prevRank: merged.length + i + 1 }))

  return [...merged, ...extras]
}
