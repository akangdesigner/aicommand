'use client'

import type { FaqCategory } from '@/lib/faq'

export function FaqPage({ categories }: { categories: FaqCategory[] }) {
  const allQs = categories.flatMap((c) => c.questions)

  return (
    <div className="bg-[#FBFBF9] text-stone-900">

      {/* Article header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-[820px] px-5 py-16 sm:px-8">
          <div className="text-[11.5px] tracking-[0.08em] text-stone-500">
            常見問題 · 給開發者、設計師、PM
          </div>
          <h1 className="mt-3 text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[56px]">
            關於 AICommand
            <br />
            <span
              className="font-semibold text-stone-500"
              style={{ fontFamily: 'var(--font-source-serif), Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}
            >
              常見問題
            </span>
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-stone-600">
            排名怎麼算、資料從哪來、為什麼某個工具突然竄起——這份指南一次說清楚。每個問題都有完整答案，沒有廢話、沒有業配和 SEO 填充。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-stone-500">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-stone-300 to-stone-400" />
              <span>aicommand 編輯部</span>
            </div>
            <span className="text-stone-300">·</span>
            <span>最後更新 2026-05-26</span>
            <span className="text-stone-300">·</span>
            <span>{allQs.length} 個常見問題</span>
            <span className="text-stone-300">·</span>
            <span>閱讀時間約 8 分鐘</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_240px]">
        {/* Article body */}
        <article className="mx-auto max-w-[640px] lg:mx-0">
          <p
            className="mb-12 text-[18px] leading-[1.7] text-stone-700"
            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif', fontStyle: 'italic' }}
          >
            自從 AICommand 上線以來，我們收到最多的問題不是「哪個工具最好」，而是
            「你的排名數字可以信任嗎？」——這份指南正面回答每一個問題。
          </p>

          {categories.map((cat) => (
            <section key={cat.id} className="mb-14">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'oklch(0.88 0.005 80)' }} />
                <h2 className="text-[12px] font-medium tracking-[0.12em] text-stone-500">
                  {cat.label.toUpperCase()}
                </h2>
                <div className="h-px flex-1" style={{ background: 'oklch(0.88 0.005 80)' }} />
              </div>

              {cat.questions.map((qa, i) => (
                <div
                  key={i}
                  id={`q-${cat.id}-${i}`}
                  className="group mb-10 scroll-mt-24"
                >
                  <div className="mb-3 flex items-baseline gap-3">
                    <span className="font-mono text-[12px] tabular-nums text-stone-400">
                      Q{String(i + 1).padStart(2, '0')}
                    </span>
                    <a
                      href={`#q-${cat.id}-${i}`}
                      className="text-[12px] text-stone-400 opacity-0 transition group-hover:opacity-100 hover:text-stone-700"
                    >
                      #
                    </a>
                  </div>
                  <h3 className="mb-3 text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-stone-900">
                    {qa.q}
                  </h3>
                  <p
                    className="text-[16px] leading-[1.75] text-stone-700"
                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                  >
                    {qa.a}
                  </p>
                </div>
              ))}
            </section>
          ))}

          {/* End note */}
          <div className="mt-16 rounded-2xl border border-stone-200 bg-white p-6">
            <div className="text-[13px] font-semibold tracking-[-0.01em]">看到新問題？</div>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-600">
              每週我們會根據用戶回饋新增問題進這份指南。你的問題很可能就是下一個。
            </p>
            <a
              href="mailto:asdtodd42@gmail.com"
              className="mt-4 inline-block rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 transition"
            >
              寫信給 asdtodd42@gmail.com
            </a>
          </div>
        </article>

        {/* Right sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="mb-3 text-[10.5px] font-medium tracking-[0.08em] text-stone-400">
                目錄導覽
              </div>
              <nav className="space-y-4 border-l border-stone-200 pl-4">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div className="mb-1.5 text-[12px] font-semibold tracking-[-0.01em] text-stone-900">
                      {cat.label}
                    </div>
                    <ul className="space-y-1">
                      {cat.questions.map((qa, i) => (
                        <li key={i}>
                          <a
                            href={`#q-${cat.id}-${i}`}
                            className="block text-[11.5px] leading-snug text-stone-500 hover:text-stone-900 transition line-clamp-1"
                          >
                            {qa.q}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
