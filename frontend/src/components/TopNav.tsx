'use client'

import Link from 'next/link'

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#FBFBF9]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-stone-900">
          <div className="relative h-6 w-6">
            <div
              className="absolute inset-0 rounded-md"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 265) 0%, oklch(0.6 0.16 200) 100%)' }}
            />
            <div className="absolute inset-[2px] flex items-center justify-center rounded-[4px] bg-[#FBFBF9]">
              <span className="text-[10px] font-bold tracking-tight text-stone-900">A/</span>
            </div>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">aicommand</span>
          <span className="ml-1 hidden rounded-full border border-stone-200 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 sm:inline">
            beta
          </span>
          <span className="ml-0.5 hidden text-[12px] text-stone-400 sm:inline">·&nbsp;AI 工具排行榜</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-[13px] text-stone-600 lg:flex">
          <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-stone-100">排行榜</Link>
          <a className="rounded-full px-3 py-1.5 hover:bg-stone-100" href="#categories">分類</a>
          <a className="rounded-full px-3 py-1.5 hover:bg-stone-100" href="#changelog">每週精選</a>
          <a className="rounded-full px-3 py-1.5 hover:bg-stone-100" href="#methodology">方法論</a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="搜尋 847 個工具…"
              className="h-8 w-56 rounded-full border border-stone-200 bg-white pl-8 pr-3 text-[12.5px] text-stone-700 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
            />
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="m11 11 3 3" strokeLinecap="round" />
            </svg>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-stone-200 px-1 font-mono text-[10px] text-stone-400">
              ⌘K
            </kbd>
          </div>
          <button className="rounded-full bg-stone-900 px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-stone-800">
            訂閱週報
          </button>
        </div>
      </div>
    </header>
  )
}
