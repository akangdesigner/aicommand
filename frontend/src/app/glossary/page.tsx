import type { Metadata } from 'next'
import { GLOSSARY_CATEGORIES } from '@/lib/glossary'

export const metadata: Metadata = {
  title: '名詞大補帖 · AI 工具術語指南',
  description: 'AI 開發工具常見術語完整指南：Vibe Coding、MCP、RAG、Fine-tuning……35 個關鍵詞，用白話說清楚，非工程師也看得懂。',
  openGraph: {
    title: '名詞大補帖 · AICommand AI 工具術語指南',
    description: 'AI 工具常見術語，從工作方式到定價模式，一次看懂。共 35 個詞條。',
  },
  alternates: { canonical: 'https://aicommand.aiqkangber.com/glossary' },
}

export default function GlossaryPage() {
  const allEntries = GLOSSARY_CATEGORIES.flatMap((c) => c.entries)
  const runningNums = new Map(allEntries.map((e, i) => [e.id, i + 1]))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'AICommand AI 工具名詞大補帖',
    description: 'AI 開發工具常見術語指南，涵蓋工作方式、工具類型、AI 概念、主流模型、定價模式與工具選型六大分類。',
    url: 'https://aicommand.aiqkangber.com/glossary',
    definedTerm: allEntries.map((e) => ({
      '@type': 'DefinedTerm',
      name: e.term,
      description: e.body,
      termCode: e.id,
      inDefinedTermSet: 'https://aicommand.aiqkangber.com/glossary',
      url: `https://aicommand.aiqkangber.com/glossary#${e.id}`,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <div className="bg-[#FBFBF9] text-stone-900">
      {/* Field guide header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-[960px] px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-stone-400">
                AICOMMAND · FIELD GUIDE · VOL.01
              </div>
              <h1 className="mt-4 text-[42px] font-semibold leading-none tracking-[-0.035em] sm:text-[52px]">
                名詞解釋
              </h1>
              <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-stone-500">
                給開發者、設計師、PM 的 AI 工具術語指南——不需要有程式背景也看得懂。
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[11px] tracking-[0.08em] text-stone-400">2026 EDITION</div>
              <div className="mt-0.5 font-mono text-[11px] tracking-[0.08em] text-stone-400">
                {allEntries.length} ENTRIES
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chapters */}
      <div className="mx-auto max-w-[960px] px-5 py-14 sm:px-8">
        {GLOSSARY_CATEGORIES.map((cat, catIdx) => (
          <section key={cat.id} className="mb-20">
            {/* Chapter label */}
            <div className="mb-10 flex items-center gap-4">
              <span
                className="font-mono text-[11px] font-semibold tracking-[0.14em]"
                style={{ color: cat.color }}
              >
                CH {String(catIdx + 1).padStart(2, '0')}
              </span>
              <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-stone-900">
                {cat.label}
              </h2>
              <span className="font-mono text-[10px] tracking-[0.1em] text-stone-400">
                {cat.labelEn}
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            {/* Entries */}
            <div className="divide-y divide-stone-100">
              {cat.entries.map((entry) => {
                const num = runningNums.get(entry.id)!
                return (
                  <div
                    key={entry.id}
                    id={entry.id}
                    className="grid scroll-mt-24 grid-cols-[48px_1fr] gap-x-6 py-8 sm:grid-cols-[64px_1fr] sm:gap-x-10"
                  >
                    {/* Running number */}
                    <div className="pt-1 font-mono text-[11px] tabular-nums text-stone-300">
                      {String(num).padStart(3, '0')}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-[22px] font-semibold tracking-[-0.025em] text-stone-900">
                          {entry.term}
                        </h3>
                        {entry.aka && (
                          <span className="font-mono text-[10.5px] text-stone-400">
                            aka {entry.aka.join(' · ')}
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-1.5 text-[13px] font-medium leading-snug"
                        style={{ color: cat.color }}
                      >
                        {entry.tagline}
                      </p>
                      <p
                        className="mt-3 text-[15.5px] leading-[1.72] text-stone-700"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                      >
                        {entry.body}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Footer */}
        <div className="mt-4 border-t border-stone-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[12.5px] text-stone-400">
              看到其他不懂的詞？歡迎回饋給我們補充。
            </p>
            <a
              href="mailto:asdtodd42@gmail.com"
              className="rounded-full border border-stone-200 px-4 py-1.5 text-[12.5px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
            >
              寫信給我們
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
