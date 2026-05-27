import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const sb = createClient(url, key)

  const [toolsRes, insightsRes, insightsSampleRes] = await Promise.all([
    sb.from('tools')
      .select('slug, name, ranking_score, description')
      .in('slug', ['claude-code', 'cursor', 'trae', 'windsurf', 'codex']),
    sb.from('extracted_insights')
      .select('tool_name, raw_quote, sentiment')
      .limit(5),
    sb.from('extracted_insights')
      .select('tool_name', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    tools_error: toolsRes.error?.message ?? null,
    top3_tools: toolsRes.data?.map(t => ({ slug: t.slug, name: t.name, score: t.ranking_score, description: t.description })),
    insights_total: insightsSampleRes.count,
    insights_error: insightsRes.error?.message ?? null,
    insights_sample: insightsRes.data?.map(r => ({
      tool_name: r.tool_name,
      sentiment: r.sentiment,
      has_quote: !!r.raw_quote,
      quote_len: r.raw_quote?.length ?? 0,
    })),
  })
}
