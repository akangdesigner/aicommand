'use client'

import { useRef, useEffect, useState } from 'react'

const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

const SOURCES = [
  { id: 'reddit',  icon: favicon('reddit.com'),             name: 'Reddit',       boards: 'r/LocalLLaMA · r/cursor', signals: 1008 },
  { id: 'hn',      icon: favicon('news.ycombinator.com'),   name: 'Hacker News',  boards: 'front page · Show HN',    signals: 339  },
  { id: 'ptt',     icon: favicon('ptt.cc'),                 name: 'PTT',          boards: 'Soft_Job · C_Chat',        signals: 6    },
  { id: 'github',  icon: favicon('github.com'),             name: 'GitHub',       boards: 'Trending · Discussions',   signals: 2633 },
  { id: 'dcard',   icon: favicon('dcard.tw'),               name: 'Dcard',        boards: '工程師 · 男女工程',          signals: 8    },
  { id: 'threads', icon: favicon('threads.net'),            name: 'Threads',      boards: '#AI · #ClaudeCode',        signals: 7    },
]

function SourceChip({ s }: { s: typeof SOURCES[0] }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-4">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
        <img
          src={s.icon}
          alt={`${s.name} logo`}
          width={20}
          height={20}
          loading="lazy"
          className="h-5 w-5 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-stone-900">{s.name}</span>
          <span className="font-mono text-[10.5px] tabular-nums text-stone-400">{s.signals.toLocaleString()}</span>
        </div>
        <span className="font-mono text-[10.5px] text-stone-500">{s.boards}</span>
      </div>
    </div>
  )
}

export function SourcesRail() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf: number
    let x = 0
    let last = performance.now()
    const speed = 28 // px/sec

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
  }, [])

  const total = SOURCES.reduce((n, s) => n + s.signals, 0)

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="font-mono text-[10.5px] tracking-[0.16em] text-stone-500">
          DATA SOURCES · 6 PLATFORMS
        </div>
        <div className="font-mono text-[10.5px] tracking-[0.06em] text-stone-400">
          24H 訊號 {total.toLocaleString()}
        </div>
      </div>

      <div
        className="relative -mx-5 overflow-hidden sm:-mx-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade edges */}
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
          {[...SOURCES, ...SOURCES].map((s, i) => (
            <SourceChip key={s.id + i} s={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
