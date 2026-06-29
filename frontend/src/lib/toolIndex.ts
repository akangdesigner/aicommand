import { createClient } from '@supabase/supabase-js'

// ── E-E-A-T 薄內容防護 ────────────────────────────────────────────────────────
// 工具詳情頁的核心價值＝真實社群評論。沒有（或只有一兩則）評論的頁面屬於
// 「薄內容」，被搜尋引擎索引反而拖累整站品質訊號（E-E-A-T）。
//
// 判斷依據＝頁面實際會渲染的社群評論數，也就是 extracted_insights 裡
// confidence < 0.95 的個別留言分析（與 tools/[slug]/page.tsx 的 quotes 同源）。
// 低於門檻者：generateMetadata 標記 noindex,follow；sitemap 一併排除。
//
// 門檻可調：3 = 至少 3 則獨立社群評論才視為有實質內容。
export const MIN_COMMENTS_FOR_INDEX = 3

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export function isToolIndexable(commentCount: number): boolean {
  return commentCount >= MIN_COMMENTS_FOR_INDEX
}

// 單一工具的社群評論數 — 用於 generateMetadata 決定是否 noindex。
// 查不到 Supabase 時回傳 0（保守視為薄頁）。
export async function getToolCommentCount(toolName: string): Promise<number> {
  const sb = anonClient()
  if (!sb) return 0
  const { count } = await sb
    .from('extracted_insights')
    .select('*', { count: 'exact', head: true })
    .ilike('tool_name', toolName)
    .lt('confidence', 0.95)
  return count ?? 0
}

// 所有「達索引門檻」的工具 slug — 用於 sitemap 過濾薄頁。
// 一次撈 tools(slug,name) + insights tool_name，於記憶體計數，避免 N+1 查詢。
export async function getIndexableToolSlugs(): Promise<string[]> {
  const sb = anonClient()
  if (!sb) return []

  const [{ data: tools }, { data: insights }] = await Promise.all([
    sb.from('tools').select('slug, name').order('heat_score', { ascending: false }),
    sb.from('extracted_insights').select('tool_name').lt('confidence', 0.95),
  ])

  const counts = new Map<string, number>()
  for (const row of insights ?? []) {
    const key = (row.tool_name as string | null)?.trim().toLowerCase()
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return (tools ?? [])
    .filter((t: { slug: string; name: string }) => {
      const c = counts.get((t.name ?? '').trim().toLowerCase()) ?? 0
      return Boolean(t.slug) && isToolIndexable(c)
    })
    .map((t: { slug: string }) => t.slug)
}
