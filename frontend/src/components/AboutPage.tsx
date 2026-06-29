'use client'

import Link from 'next/link'

const SOURCES = [
  { name: 'Hacker News', desc: '開發者社群，英文技術討論為主' },
  { name: 'GitHub Discussions', desc: '官方 repo 的用戶回饋與功能討論' },
  { name: 'PTT', desc: '台灣最大 BBS，Soft_Job / C_Chat 等版' },
  { name: 'Dcard', desc: '台灣年輕族群，科技板討論' },
  { name: 'Threads', desc: 'Meta 短文社群，AI 工具開發者圈' },
]

const SCORE_STEPS = [
  { step: '01', title: '爬蟲抓取', desc: '定期從 HN、GitHub、PTT、Dcard、Threads 抓取含工具名稱的社群貼文與留言。' },
  { step: '02', title: 'AI 分析', desc: '每個工具隨機抽 30 則送 Groq LLM 分析，抽取情緒傾向（正面／負面／中立）、使用場景、痛點、族群。' },
  { step: '03', title: '分數計算', desc: '依 HN 演算法精神：提及數 × 情緒權重 × 近期熱度加成，再 normalize 成 0–100 的熱度分數。' },
  { step: '04', title: '每週快照', desc: '每次跑完都存一筆週紀錄，趨勢線顯示工具的社群熱度走向。' },
]

export function AboutPage() {
  return (
    <div className="bg-[#FBFBF9] text-stone-900">

      {/* Hero */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-[820px] px-5 py-16 sm:px-8">
          <div className="mb-3 text-[11.5px] tracking-[0.08em] text-stone-500 uppercase">關於本站</div>
          <h1 className="mb-4 text-[32px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">
            AI 工具排行榜，<br className="sm:hidden" />由真實社群決定
          </h1>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-stone-600">
            AICommand 不靠廠商贊助、不靠人工評測。所有排名來自爬蟲抓取的社群真實討論，
            再由 AI 分析情緒與話題深度，產出定期更新的熱度分數。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 space-y-16">

        {/* 宗旨 */}
        <section>
          <h2 className="mb-6 text-[21px] font-semibold tracking-[-0.02em]">為什麼要做這個？</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-stone-700">
            <p>
              AI 工具市場變化太快，每天都有新工具、新功能、新定價。但多數排行榜不是廠商自填資料，
              就是過時的靜態清單。我們想要一個<strong className="text-stone-900">反映當下開發者社群真實看法</strong>的地方。
            </p>
            <p>
              當 Cursor 出現延遲問題，社群會馬上反應在 HN 留言裡。當 Claude Code 推出新功能，
              PTT 工程師版的討論量會在一週內暴增。這些訊號比任何媒體評測都即時、真實。
            </p>
            <p>
              AICommand 的熱度分數，就是這些社群訊號的量化結果。
            </p>
          </div>
        </section>

        {/* 分數怎麼算 */}
        <section>
          <h2 className="mb-2 text-[21px] font-semibold tracking-[-0.02em]">熱度分數怎麼算？</h2>
          <p className="mb-8 text-[14px] text-stone-500">從爬蟲到數字，共四個步驟</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SCORE_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="mb-3 font-mono text-[11px] tracking-[0.12em] text-stone-400">{step}</div>
                <div className="mb-1.5 font-semibold text-stone-900">{title}</div>
                <p className="text-[13.5px] leading-relaxed text-stone-600">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 px-5 py-4 font-mono text-[12.5px] text-stone-600">
            <span className="text-stone-400 select-none">公式　</span>
            score = mentions<sup>0.8</sup> × sentiment_weight × (1 + 0.5 × recent_ratio)
          </div>
          <p className="mt-3 text-[12.5px] text-stone-500">
            所有工具分數再 normalize 成 0–100，最高分工具為 100。sentiment_weight：正面 ×1.2、負面 ×0.7、中立 ×1.0。
          </p>
        </section>

        {/* 資料來源 */}
        <section>
          <h2 className="mb-6 text-[21px] font-semibold tracking-[-0.02em]">資料來源</h2>
          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white overflow-hidden">
            {SOURCES.map(({ name, desc }) => (
              <div key={name} className="flex items-start justify-between gap-4 px-5 py-4">
                <span className="font-medium text-stone-900 text-[14px] shrink-0">{name}</span>
                <span className="text-[13.5px] text-stone-500 text-right">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-stone-500">
            Reddit 因故暫時停止爬取。所有爬蟲只抓公開資料，不儲存個人身份資訊。
          </p>
        </section>

        {/* 功能介紹 */}
        <section>
          <h2 className="mb-6 text-[21px] font-semibold tracking-[-0.02em]">本站還有什麼？</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/news"
              className="group rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-stone-300 hover:shadow-sm"
            >
              <div className="mb-3 text-[22px]">📰</div>
              <div className="mb-1.5 font-semibold text-stone-900 group-hover:text-stone-700">AI 工具新聞追蹤</div>
              <p className="text-[13.5px] leading-relaxed text-stone-500">
                每 6 小時從 Google News 自動抓取 AI 開發工具相關新聞，涵蓋 IDE、Agent、圖像生成、自動化等各類工具的最新動態。不用追蹤十幾個媒體，開這頁就好。
              </p>
              <div className="mt-4 text-[12.5px] font-medium text-stone-400 group-hover:text-stone-600 transition">
                查看最新動態 →
              </div>
            </Link>

            <Link
              href="/glossary"
              className="group rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-stone-300 hover:shadow-sm"
            >
              <div className="mb-3 text-[22px]">📖</div>
              <div className="mb-1.5 font-semibold text-stone-900 group-hover:text-stone-700">名詞大補帖</div>
              <p className="text-[13.5px] leading-relaxed text-stone-500">
                看排行榜時常冒出看不懂的詞？Vibe Coding、MCP、RAG、Fine-tuning……我們用白話整理了 35 個 AI 開發工具常見名詞，非工程師也能秒懂。
              </p>
              <div className="mt-4 text-[12.5px] font-medium text-stone-400 group-hover:text-stone-600 transition">
                查看名詞解釋 →
              </div>
            </Link>
          </div>
        </section>

        {/* 怎麼看排行榜 */}
        <section>
          <h2 className="mb-6 text-[21px] font-semibold tracking-[-0.02em]">怎麼看排行榜？</h2>
          <div className="space-y-5">
            {[
              {
                label: '熱度分數 (0–100)',
                desc: '滿分 100 代表當期社群聲量最高的工具，不是絕對品質分數。每次跑完 pipeline 重新 normalize，所以分數會隨生態系消長而變動。',
              },
              {
                label: '趨勢線',
                desc: '顯示近幾週的 mention 數走勢，以工具自身最高週為基準 normalize。線往上 = 最近討論變多，不代表品質變好。資料不足 3 週顯示底部實線（資料收集中）。',
              },
              {
                label: '情緒分布',
                desc: '正面 / 負面 / 混合，由 Groq LLM 分析每則討論得出。樣本數少的工具分布可能偏差，供參考。',
              },
              {
                label: '社群評論',
                desc: '從有 AI 分析過的貼文中取出，優先顯示含工具名的第一人稱評論句。來源包含 HN、GitHub、PTT、Dcard 等。',
              },
              {
                label: '更新頻率',
                desc: '目前手動定期跑 pipeline，未來計畫每週自動更新。最後更新時間以首頁右上角為準。',
              },
            ].map(({ label, desc }) => (
              <div key={label} className="flex gap-4">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-stone-400" />
                <div>
                  <div className="mb-1 font-medium text-stone-900 text-[14px]">{label}</div>
                  <p className="text-[13.5px] leading-relaxed text-stone-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 限制 */}
        <section>
          <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.02em]">已知限制</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 space-y-2.5">
            {[
              '英文社群（HN）佔比較高，英文系工具可能相對有利',
              'Make.com 因工具名稱與英文通用詞 "make" 衝突，目前數據偏少',
              'Reddit 暫停爬取，影響部分工具的社群樣本數',
              '每個工具每次只分析 30 則，樣本可能有偏差',
              '新工具上線初期社群討論少，分數會偏低但不代表品質差',
            ].map((item) => (
              <div key={item} className="flex gap-3 text-[13.5px] text-amber-900">
                <span className="shrink-0 text-amber-500">！</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-stone-200 pt-10">
          <div className="mb-6">
            <div className="font-semibold text-stone-900 mb-1">開始探索 AICommand</div>
            <p className="text-[13.5px] text-stone-500">三個入口，各有用途</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full px-5 py-2.5 text-[13.5px] font-medium text-white transition hover:opacity-90"
              style={{ background: 'oklch(0.55 0.18 265)' }}
            >
              排行榜
            </Link>
            <Link
              href="/news"
              className="rounded-full border border-stone-200 px-5 py-2.5 text-[13.5px] font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
            >
              最新消息
            </Link>
            <Link
              href="/glossary"
              className="rounded-full border border-stone-200 px-5 py-2.5 text-[13.5px] font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
            >
              名詞大補帖
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
