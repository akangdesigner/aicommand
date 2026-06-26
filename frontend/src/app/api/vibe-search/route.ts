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
    `定位：${t.description}`,
    `定價：${t.pricingDescription ?? '未知'}`,
    `核心功能：${(t.features ?? []).slice(0, 6).join('；')}`,
  ].join('\n')).join('\n\n')

  const prompt = `你是 AICommand 推薦引擎，根據社群真實討論資料推薦 AI 工具。以下是 ${TOOLS.length} 款工具：

${ctx}

用戶需求：「${query}」

任務：從上述工具中選出最符合此需求的 1-3 款。

要求：
- reason 必須直接回答「為什麼這款工具符合『${query}』這個需求」，不能只是重複工具描述
- 若需求涉及比較（最好、最便宜、最適合某情境），reason 要說明相對優勢
- highlights 列出 2 個與需求最直接相關的具體功能或特點
- 沒有完全符合的工具就回空陣列，不要硬推

JSON 格式：
{"results":[{"slug":"工具slug","name":"工具名稱","reason":"針對需求的推薦理由（繁體中文，40字內）","highlights":["具體符合點1","具體符合點2"]}]}

只回覆 JSON。`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
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
    // Groq 不可用時，退回 keyword 比對
    const tokens = trimmed.toLowerCase().split(/[\s，、,]+/).filter(Boolean)
    const scored = TOOLS
      .map((t) => ({ tool: t, score: keywordScore(t, tokens) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    if (scored.length > 0) {
      return NextResponse.json({
        results: scored.map(({ tool }) => ({
          slug: tool.slug,
          name: tool.name,
          reason: tool.description,
          highlights: (tool.features ?? []).slice(0, 2),
        })),
      })
    }

    return NextResponse.json({ error: 'ai_unavailable', results: [] })
  }
}
