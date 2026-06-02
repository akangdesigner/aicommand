import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const RATE_LIMIT: Record<string, number> = {}

export async function POST(req: NextRequest) {
  // Simple IP rate limit: 3 reviews per IP per hour
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const now = Date.now()
  const key = `${ip}`
  const last = RATE_LIMIT[key] ?? 0
  if (now - last < 20 * 60 * 1000) {
    return NextResponse.json({ error: '請稍後再試' }, { status: 429 })
  }

  let body: { tool_slug: string; tool_name: string; content: string; sentiment?: string; author_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const { tool_slug, tool_name, content, sentiment, author_name } = body

  if (!tool_slug || !tool_name || !content) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }
  if (content.length < 10 || content.length > 1000) {
    return NextResponse.json({ error: '評論長度需介於 10~1000 字' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key2) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const sb = createClient(url, key2)
  const { error } = await sb.from('user_reviews').insert({
    tool_slug,
    tool_name,
    content: content.trim(),
    sentiment: sentiment ?? null,
    author_name: author_name?.trim() || null,
  })

  if (error) {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }

  RATE_LIMIT[key] = now
  return NextResponse.json({ ok: true })
}
