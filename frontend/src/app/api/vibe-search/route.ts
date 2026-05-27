import { NextRequest, NextResponse } from 'next/server'
import { TOOLS } from '@/lib/data'

const TOOL_TAGS: Record<string, string[]> = {
  'claude-code': ['terminal', '終端機', 'cli', 'agentic', 'anthropic', 'claude', '命令列', 'pr', 'git', 'mcp', '付費', '訂閱'],
  'cursor':      ['editor', '編輯器', 'ide', 'vscode', 'composer', '補全', '免費', 'free', 'agent'],
  'windsurf':    ['editor', '編輯器', 'ide', 'cascade', 'codeium', 'agent', '免費', 'free', 'preview'],
  'trae':        ['免費', 'free', '完全免費', '不用錢', 'bytedance', 'solo', 'agent', 'ide', 'swe-bench'],
  'codex':       ['openai', '雲端', 'cloud', 'sandbox', 'github', 'pr', 'chatgpt', 'o3', 'api'],
}

function keywordScore(tool: typeof TOOLS[0], tokens: string[]): number {
  const haystack = [
    tool.name, tool.description,
    tool.pricingDescription ?? '',
    ...(tool.features ?? []),
    ...(TOOL_TAGS[tool.slug] ?? []),
  ].join(' ').toLowerCase()
  return tokens.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0)
}

async function groqSearch(query: string): Promise<{ slug: string; name: string; reason: string; highlights: string[] }[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('no key')

  const ctx = TOOLS.map((t) => [
    `【${t.name}】slug=${t.slug}`,
    `描述：${t.description}`,
    `定價：${t.pricingDescription ?? '未知'}`,
    `特性：${(t.features ?? []).slice(0, 4).join('；')}`,
  ].join('\n')).join('\n\n')

  const prompt = `你是 AICommand 推薦引擎。以下是 5 款 AI 程式開發工具：

${ctx}

用戶需求：「${query}」

從這 5 款中找出最符合的 1-3 款（只推真正符合的，沒有就空陣列）。以 JSON 格式回覆：
{"results":[{"slug":"工具slug","name":"工具名稱","reason":"一句話說明符合原因（繁體中文，25字內）","highlights":["具體符合點","具體符合點"]}]}

只回覆 JSON。`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 600,
    }),
  })

  if (!res.ok) throw new Error(`groq ${res.status}`)
  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''
  const match = content.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(match?.[0] ?? content)
  return parsed.results ?? []
}

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  const trimmed = (query ?? '').trim()
  if (!trimmed) return NextResponse.json({ results: [] })

  try {
    const results = await groqSearch(trimmed)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'ai_unavailable', results: [] })
  }
}
