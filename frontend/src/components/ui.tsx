'use client'

import { useId } from 'react'
import type { Tool, ToolSources } from '@/lib/data'
import { cx } from '@/lib/utils'

export function ToolLogo({ tool, size = 'md' }: { tool: Tool; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dims = {
    sm: 'h-9 w-9 text-[13px]',
    md: 'h-11 w-11 text-[15px]',
    lg: 'h-16 w-16 text-[22px]',
    xl: 'h-20 w-20 text-[26px]',
  }[size]
  const imgSize = { sm: 36, md: 44, lg: 64, xl: 80 }[size]
  return (
    <div
      className={cx(dims, 'flex shrink-0 items-center justify-center rounded-[10px] font-semibold text-white tracking-tight overflow-hidden')}
      style={{
        background: tool.logo_url ? '#fff' : tool.accent,
        border: tool.logo_url ? '1px solid oklch(0.92 0.005 80)' : 'none',
        boxShadow: '0 1px 2px rgba(15,15,15,0.08)',
      }}
    >
      {tool.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tool.logo_url}
          alt={tool.name}
          width={imgSize}
          height={imgSize}
          className="h-[75%] w-[75%] object-contain"
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
            const parent = el.parentElement!
            parent.style.background = tool.accent
            parent.style.border = 'none'
            parent.textContent = tool.initials
          }}
        />
      ) : (
        tool.initials
      )}
    </div>
  )
}

const CATEGORY_PALETTE: Record<string, { bg: string; fg: string }> = {
  '程式開發': { bg: 'oklch(0.96 0.02 265)', fg: 'oklch(0.4 0.16 265)' },
  '寫作':     { bg: 'oklch(0.96 0.03 165)', fg: 'oklch(0.38 0.14 165)' },
  '圖像生成': { bg: 'oklch(0.96 0.03 310)', fg: 'oklch(0.42 0.16 310)' },
  '自動化':   { bg: 'oklch(0.96 0.04 35)',  fg: 'oklch(0.45 0.16 35)'  },
  '語音':     { bg: 'oklch(0.96 0.03 50)',  fg: 'oklch(0.42 0.14 50)'  },
}

export function CategoryBadge({ category, subtle }: { category: string; subtle?: boolean }) {
  const c = CATEGORY_PALETTE[category] ?? CATEGORY_PALETTE['程式開發']
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[-0.01em]"
      style={{
        background: subtle ? 'transparent' : c.bg,
        color: c.fg,
        border: subtle ? `1px solid ${c.bg}` : 'none',
      }}
    >
      {category}
    </span>
  )
}

export function TrendArrow({ delta, size = 'md' }: { delta: number; size?: 'md' | 'lg' }) {
  const up   = delta > 0.5
  const flat = Math.abs(delta) <= 0.5
  const down = delta < -0.5
  const color = up ? 'oklch(0.55 0.16 145)' : down ? 'oklch(0.55 0.19 25)' : 'oklch(0.55 0.02 250)'
  const bg    = up ? 'oklch(0.96 0.04 145)' : down ? 'oklch(0.96 0.04 25)' : 'oklch(0.96 0.005 250)'
  const text  = flat ? `→ ${delta.toFixed(1)}` : (up ? '↑ +' : '↓ ') + Math.abs(delta).toFixed(1)
  const cls   = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-[12px] px-2 py-0.5'
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full font-mono font-medium tabular-nums', cls)}
      style={{ background: bg, color }}
    >
      {text}
    </span>
  )
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  stroke = 'oklch(0.55 0.18 265)',
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
}) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `spark-fill-${uid}`
  if (data.length < 2) {
    const y = height / 2
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={0} y1={y} x2={width} y2={y}
          stroke="oklch(0.88 0.005 80)" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" />
      </svg>
    )
  }
  const min  = Math.min(...data)
  const max  = Math.max(...data)
  const range = max - min || 1
  const step  = width / (data.length - 1)
  const pts   = data.map((d, i) => [i * step, height - ((d - min) / range) * (height - 4) - 2])
  const path  = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ')
  const fill  = `M 0 ${height} ` + pts.map((p) => `L ${p[0]} ${p[1]}`).join(' ') + ` L ${width} ${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  )
}

export function ScoreNumber({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const cls = { sm: 'text-base', md: 'text-2xl', lg: 'text-[44px] leading-none', xl: 'text-[72px] leading-[0.95]' }[size]
  const [whole, dec] = value.toFixed(1).split('.')
  return (
    <span className={cx('font-mono font-medium tabular-nums tracking-[-0.02em]', cls)}>
      {whole}
      <span className="text-[0.55em] opacity-50 align-baseline">.{dec}</span>
    </span>
  )
}

export function RankPill({ rank, large }: { rank: number; large?: boolean }) {
  const cls = large ? 'h-9 min-w-[44px] text-[15px]' : 'h-7 min-w-[32px] text-[12px]'
  return (
    <div
      className={cx(cls, 'inline-flex items-center justify-center rounded-full font-mono font-medium tabular-nums px-2', rank <= 3 ? 'text-stone-900' : 'text-stone-500')}
      style={{
        background: rank <= 3 ? 'oklch(0.96 0.02 80)' : 'oklch(0.97 0.003 80)',
        border:     rank <= 3 ? '1px solid oklch(0.88 0.05 80)' : '1px solid oklch(0.92 0.005 80)',
      }}
    >
      #{rank}
    </div>
  )
}

export function SourceBar({ sources }: { sources: ToolSources }) {
  const segs = [
    { key: 'reddit', label: 'Reddit', color: 'oklch(0.6 0.18 30)',  val: sources.reddit },
    { key: 'hn',     label: 'HN',     color: 'oklch(0.62 0.16 35)', val: sources.hn     },
    { key: 'github', label: 'GitHub', color: 'oklch(0.3 0.01 250)', val: sources.github  },
    ...(sources.v2ex   ? [{ key: 'v2ex',   label: 'V2EX',   color: 'oklch(0.55 0.12 200)', val: sources.v2ex   }] : []),
    ...(sources.juejin ? [{ key: 'juejin', label: '掘金',   color: 'oklch(0.55 0.16 50)',  val: sources.juejin }] : []),
  ]
  const total = segs.reduce((s, x) => s + x.val, 0) || 1
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-stone-100">
        {segs.map((s) => (
          <div key={s.key} style={{ width: `${(s.val / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-stone-500 font-mono tabular-nums">
        {segs.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            {s.label} {s.val.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  )
}
