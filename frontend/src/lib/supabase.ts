import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export interface SupabaseTool {
  id: number
  slug: string
  name: string
  category: string
  description: string
  ranking_score: number
  mention_count: number
  sentiment_score: number
  trend_delta: number
  last_scored_at: string
}

export async function fetchToolRankings(): Promise<SupabaseTool[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('ranking_score', { ascending: false })
    .limit(50)
  if (error) {
    console.error('Supabase fetch error:', error.message)
    return []
  }
  return data ?? []
}
