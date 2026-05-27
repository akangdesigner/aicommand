// Shared UI primitives for AICommand
const { useState, useMemo, useEffect } = React;

function cx(...args) {
  return args.filter(Boolean).join(' ');
}

function ToolLogo({ tool, size = 'md' }) {
  const dims = {
    sm: 'h-9 w-9 text-[13px]',
    md: 'h-11 w-11 text-[15px]',
    lg: 'h-16 w-16 text-[22px]',
    xl: 'h-20 w-20 text-[26px]',
  }[size];
  return (
    <div
      className={cx(
        dims,
        'flex shrink-0 items-center justify-center rounded-[10px] font-semibold text-white tracking-tight'
      )}
      style={{
        background: tool.accent,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(15,15,15,0.08)',
      }}
    >
      {tool.initials}
    </div>
  );
}

function CategoryBadge({ category, subtle }) {
  const palette = {
    '程式開發': { bg: 'oklch(0.96 0.02 265)', fg: 'oklch(0.4 0.16 265)' },
    '寫作': { bg: 'oklch(0.96 0.03 165)', fg: 'oklch(0.38 0.14 165)' },
    '圖像生成': { bg: 'oklch(0.96 0.03 310)', fg: 'oklch(0.42 0.16 310)' },
    '自動化': { bg: 'oklch(0.96 0.04 35)', fg: 'oklch(0.45 0.16 35)' },
    '語音': { bg: 'oklch(0.96 0.03 50)', fg: 'oklch(0.42 0.14 50)' },
  };
  const c = palette[category] || palette['程式開發'];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[-0.01em]"
      style={{ background: subtle ? 'transparent' : c.bg, color: c.fg, border: subtle ? `1px solid ${c.bg}` : 'none' }}
    >
      {category}
    </span>
  );
}

function TrendArrow({ delta, size = 'md' }) {
  const up = delta > 0.5;
  const flat = Math.abs(delta) <= 0.5;
  const down = delta < -0.5;
  const color = up
    ? 'oklch(0.55 0.16 145)'
    : down
    ? 'oklch(0.55 0.19 25)'
    : 'oklch(0.55 0.02 250)';
  const bg = up
    ? 'oklch(0.96 0.04 145)'
    : down
    ? 'oklch(0.96 0.04 25)'
    : 'oklch(0.96 0.005 250)';
  const text = flat ? `→ ${delta.toFixed(1)}` : (up ? '↑ +' : '↓ ') + Math.abs(delta).toFixed(1);
  const cls = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-[12px] px-2 py-0.5';
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full font-mono font-medium tabular-nums', cls)}
      style={{ background: bg, color }}
    >
      {text}
    </span>
  );
}

function Sparkline({ data, width = 96, height = 28, stroke = 'oklch(0.55 0.18 265)' }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - ((d - min) / range) * (height - 4) - 2]);
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const fill =
    `M 0 ${height} ` +
    pts.map((p) => `L ${p[0]} ${p[1]}`).join(' ') +
    ` L ${width} ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  );
}

function ScoreNumber({ value, size = 'md' }) {
  const cls = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-[44px] leading-none',
    xl: 'text-[72px] leading-[0.95]',
  }[size];
  const [whole, dec] = value.toFixed(1).split('.');
  return (
    <span className={cx('font-mono font-medium tabular-nums tracking-[-0.02em]', cls)}>
      {whole}
      <span className="text-[0.55em] opacity-50 align-baseline">.{dec}</span>
    </span>
  );
}

function RankPill({ rank, large }) {
  const cls = large
    ? 'h-9 min-w-[44px] text-[15px]'
    : 'h-7 min-w-[32px] text-[12px]';
  return (
    <div
      className={cx(
        cls,
        'inline-flex items-center justify-center rounded-full font-mono font-medium tabular-nums px-2',
        rank <= 3 ? 'text-stone-900' : 'text-stone-500'
      )}
      style={{
        background: rank <= 3 ? 'oklch(0.96 0.02 80)' : 'oklch(0.97 0.003 80)',
        border: rank <= 3 ? '1px solid oklch(0.88 0.05 80)' : '1px solid oklch(0.92 0.005 80)',
      }}
    >
      #{rank}
    </div>
  );
}

function SourceBar({ sources }) {
  const total = sources.reddit + sources.hn + sources.github;
  const segs = [
    { key: 'reddit', label: 'Reddit', color: 'oklch(0.6 0.18 30)', val: sources.reddit },
    { key: 'hn', label: 'HN', color: 'oklch(0.62 0.16 35)', val: sources.hn },
    { key: 'github', label: 'GitHub', color: 'oklch(0.3 0.01 250)', val: sources.github },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-stone-100">
        {segs.map((s) => (
          <div key={s.key} style={{ width: `${(s.val / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-stone-500 font-mono tabular-nums">
        {segs.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            {s.label} {s.val.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { cx, ToolLogo, CategoryBadge, TrendArrow, Sparkline, ScoreNumber, RankPill, SourceBar });
