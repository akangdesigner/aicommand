'use client'

import { useRef, useEffect, useState } from 'react'
import type { RecentDiscussion } from '@/lib/supabase'

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  hn: 'Hacker News',
  github: 'GitHub',
  ptt: 'PTT',
  dcard: 'Dcard',
  threads: 'Threads',
}

// favicon 用的實際網域（PTT 是 .cc、Dcard 是 .tw、Threads 是 .net，不能一律補 .com）
const SOURCE_DOMAINS: Record<string, string> = {
  reddit: 'reddit.com',
  hn: 'news.ycombinator.com',
  github: 'github.com',
  ptt: 'ptt.cc',
  dcard: 'dcard.tw',
  threads: 'threads.net',
}

const SENTIMENT_STYLE = {
  positive: { bg: 'oklch(0.95 0.05 145)', fg: 'oklch(0.38 0.14 145)', label: '正面' },
  negative: { bg: 'oklch(0.95 0.05 25)',  fg: 'oklch(0.42 0.17 25)',  label: '負面' },
  mixed:    { bg: 'oklch(0.95 0.04 80)',  fg: 'oklch(0.4 0.1 60)',    label: '褒貶不一' },
} as const

const FALLBACK: RecentDiscussion[] = [
  { toolName: 'Claude Code', text: 'I\'ve been using Claude Code for the past week and honestly it\'s changed how I work. The agent mode is surprisingly capable — it can refactor across 10+ files without losing context.', source: 'reddit', author: 'devtools_nerd', sentiment: 'positive', date: '5月25日' },
  { toolName: 'Cursor', text: 'Cursor\'s tab completion has gotten so good. It\'s not just autocomplete anymore — it actually understands what I\'m trying to build and suggests entire logical blocks.', source: 'hn', sentiment: 'positive', date: '5月24日' },
  { toolName: 'Windsurf', text: 'Windsurf feels lighter than Cursor for my use case. The cascade feature is nice but I keep running into context limit issues on larger repos.', source: 'reddit', author: 'indie_hacker_tw', sentiment: 'mixed', date: '5月23日' },
  { toolName: 'GitHub Copilot', text: 'Copilot Workspace is finally usable. The PR generation flow is still rough but it saves me probably 30 mins per feature branch.', source: 'github', sentiment: 'positive', date: '5月22日' },
  { toolName: 'Devin', text: 'We tried Devin for our onboarding task automation. It worked great for simple CRUD features but completely fell apart on anything with complex business logic.', source: 'hn', author: 'cto_startup', sentiment: 'mixed', date: '5月21日' },
  { toolName: 'Claude Code', text: '我們的 PM 用 Claude Code 做了一個完整的 side project，完全沒有工程師介入。這在三個月前根本不可能發生。', source: 'ptt', author: 'softjob_user', sentiment: 'positive', date: '5月20日' },
]

function DiscussionCard({ d }: { d: RecentDiscussion }) {
  const s = SENTIMENT_STYLE[d.sentiment] ?? SENTIMENT_STYLE.mixed
  const label = SOURCE_LABELS[d.source] ?? d.source
  const faviconDomain = SOURCE_DOMAINS[d.source] ?? `${d.source}.com`

  const inner = (
    <div className="flex h-full w-[300px] shrink-0 flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.source === '本站' ? (
            <span className="rounded-full bg-stone-800 px-1.5 py-0.5 text-[9px] font-medium text-white">本站</span>
          ) : (
            <img
              src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=32`}
              width={12} height={12} alt={`${label} logo`}
              className="h-3 w-3 object-contain opacity-60"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <span className="font-mono text-[10.5px] text-stone-400">{label}</span>
        </div>
        <span className="max-w-[120px] truncate text-[11.5px] font-semibold tracking-[-0.01em] text-stone-700">
          {d.toolName}
        </span>
      </div>

      <p className="flex-1 text-[13px] leading-[1.55] text-stone-700 line-clamp-4">
        {d.text}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {d.author && (
            <span className="truncate font-mono text-[10.5px] text-stone-400">
              {d.source === 'reddit' ? 'u/' : ''}{d.author}
            </span>
          )}
          {d.date && (
            <span className="shrink-0 text-[10.5px] text-stone-300">{d.date}</span>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
          style={{ background: s.bg, color: s.fg }}
        >
          {s.label}
        </span>
      </div>
    </div>
  )

  return d.url ? (
    <a href={d.url} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  )
}

export function DiscussionsRail({ discussions }: { discussions: RecentDiscussion[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => { pausedRef.current = paused }, [paused])

  const items = discussions.length >= 4 ? discussions : FALLBACK

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf: number
    let x = 0
    let last = performance.now()
    const speed = 22

    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!pausedRef.current) {
        x -= speed * dt
        const half = track.scrollWidth / 2
        if (-x >= half) x += half
        track.style.transform = `translate3d(${x}px,0,0)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [items])

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="font-mono text-[10.5px] tracking-[0.16em] text-stone-500">
          社群精選討論
        </div>
        <div className="font-mono text-[10.5px] tracking-[0.06em] text-stone-400">
          LIVE · {items.length} 則
        </div>
      </div>

      <div
        className="relative -mx-5 overflow-hidden sm:-mx-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-12"
          style={{ background: 'linear-gradient(to right, #FBFBF9, rgba(251,251,249,0))' }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-[1] h-full w-12"
          style={{ background: 'linear-gradient(to left, #FBFBF9, rgba(251,251,249,0))' }}
        />

        <div
          ref={trackRef}
          className="flex gap-3 px-5 py-1 sm:px-8 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {[...items, ...items].map((d, i) => (
            <DiscussionCard key={i} d={d} />
          ))}
        </div>
      </div>
    </section>
  )
}
