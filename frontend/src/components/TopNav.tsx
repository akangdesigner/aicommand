'use client'

import Link from 'next/link'

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#FBFBF9]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5 sm:px-8">
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
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/news"
            className="rounded-full border border-stone-200 px-3.5 py-1.5 text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
          >
            最新消息
          </Link>
          <Link
            href="/glossary"
            className="rounded-full border border-stone-200 px-3.5 py-1.5 text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
          >
            名詞解釋
          </Link>
          <Link
            href="/faq"
            className="rounded-full border border-stone-200 px-3.5 py-1.5 text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
          >
            FAQ
          </Link>
        </div>
      </div>
    </header>
  )
}
