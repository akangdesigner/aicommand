'use client'

import { useState } from 'react'

interface Props {
  toolSlug: string
  toolName: string
}

const SENTIMENTS = [
  { value: 'positive', label: '👍 推薦' },
  { value: 'mixed',    label: '🤔 普通' },
  { value: 'negative', label: '👎 不推' },
]

export function ReviewForm({ toolSlug, toolName }: Props) {
  const [content, setContent] = useState('')
  const [sentiment, setSentiment] = useState('mixed')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [expanded, setExpanded] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (content.trim().length < 10) return
    setStatus('loading')
    try {
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: toolSlug, tool_name: toolName, content, sentiment, author_name: authorName }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? '失敗')
      }
      setStatus('done')
      setContent('')
      setAuthorName('')
    } catch (err: unknown) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-700">
        感謝你的評論！已收錄到社群討論中。
      </div>
    )
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-[13px] text-stone-500 hover:text-stone-800 transition-colors"
      >
        <span className="text-base">✏️</span> 分享你的使用心得
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[13px] font-medium text-stone-700">分享你對 {toolName} 的使用心得</p>

      {/* 情感選擇 */}
      <div className="flex gap-2">
        {SENTIMENTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSentiment(s.value)}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              sentiment === s.value
                ? 'border-stone-800 bg-stone-800 text-white'
                : 'border-stone-200 text-stone-600 hover:border-stone-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 評論內容 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="說說你的實際使用體驗、優缺點、適合誰用…（至少 10 字）"
        rows={3}
        maxLength={1000}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between gap-3">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="暱稱（選填）"
          maxLength={30}
          className="w-32 rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] text-stone-700 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400">{content.length}/1000</span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[12px] text-stone-400 hover:text-stone-600"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={content.trim().length < 10 || status === 'loading'}
            className="rounded-lg bg-stone-800 px-4 py-1.5 text-[12px] font-medium text-white disabled:opacity-40 hover:bg-stone-700 transition-colors"
          >
            {status === 'loading' ? '送出中…' : '送出評論'}
          </button>
        </div>
      </div>
      {status === 'error' && (
        <p className="text-[12px] text-red-500">送出失敗，請稍後再試</p>
      )}
    </form>
  )
}
