# # AI工具排行榜

我將為你設計完整的 Next.js 14 + Tailwind CSS 應

_Started 2026-05-21 06:36 UTC_

---

## User

我要打造一個 AI 工具排行榜網站，類似 kafesanpo.com 咖啡店排行榜的體驗，但主題是 AI
  工具。排名來自真實社群（Reddit、GitHub、HN）的爬蟲資料分析，不是廠商自填。目標用戶是開發者、設計師、創業者。

  請幫我設計並直接輸出 Next.js 14 + Tailwind CSS 程式碼，包含兩個頁面：

  ---
  頁面 1：首頁排行榜 /

  - 工具卡片列表，前 3 名用 featured card（較大、有視覺重量），之後用 compact list card
  - 每張卡片顯示：排名數字、工具 Logo/icon、工具名稱、一行描述、分類 badge、熱度分數（例如 91.2）、趨勢箭頭（↑綠色 / ↓
  紅色）
  - 頂部 Filter tabs：All / Coding / Writing / Image / Automation
  - 排序切換：話題熱度 / 本週上升 / 最多討論
  - 視覺風格：Product Hunt + Linear 的設計語言，乾淨現代，RWD（桌面 + 手機）

  假資料範例：
  - #1 Cursor｜91.2分｜↑8.3｜Coding｜AI-firstcode editor
  - #2 Claude Code｜87.5分｜↑12.1｜Coding｜Agenticcoding in terminal
  - #3 ChatGPT｜83.0分｜→0.2｜Writing｜Generalpurpose AI assistant
  - #4 GitHub Copilot｜79.4分｜↓3.1｜Coding｜AIpair programmer by GitHub
  - #5 Perplexity｜74.8分｜↑5.6｜Writing｜AIsearch engine

  ---
  頁面 2：工具詳情頁 /tools/[slug]

  - Header：工具名稱、分類 badge、熱度分數大字顯示、「本週排名 #1，較上週 ↑2」
  - 社群洞察卡片（最重要區塊）：
    - 適合族群：標籤形式（solo developer / frontend engineer / freelancer）
    - 主要用途：清單（React development、refactoring、code review）
    - 社群痛點：清單（expensive Pro plan、context limit on large repos）
    - 定價感受：一段話（"大多數用戶認為 $20/mo 值得，enterprise 方案偏貴"）
  - 真實引言區（像 Glassdoor review 風格）：引用文字 + 來源（Reddit r/programming）+ 情緒標籤
  - 競品比較 chips：「常被拿來比較：GitHub Copilot（312次）、Windsurf（187次）」
  - 近 8 週熱度趨勢折線圖

  ---
  使用真實感假資料，不要 Lorem ipsum。可以使用 shadcn/ui 元件。

## Assistant

_[tool: update_todos]_

我會直接做高擬真 HTML 原型，把兩個頁面的設計、互動和資料結構都鋪好——你之後直接把 React 元件搬到 Next.js 14 即可（Tailwind classes 完全相容）。我先聲明設計系統再開工。

**設計系統（Product Hunt × Linear 路線）**
- 字體：Geist Sans（介面）+ Geist Mono（分數/數字）
- 色：暖白底 `#FBFBF9` / 近黑文字 / 靛藍 accent / 綠紅趨勢
- 卡片：細邊框 + 微陰影，無過度圓角
- 排名數字用大字級襯托階層

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

已完成 — 開啟 `aicommand.html` 就能瀏覽兩個頁面（點任一張卡片跳到詳情頁，左上角「← Back」回首頁，hash routing 也支援重新整理）。

**檔案結構**（可直接對應到 Next.js）
- `src/data.jsx` → `lib/tools.ts`（你的 mock data / 之後接 API）
- `src/components.jsx` → `components/` 共用元件（ToolLogo / CategoryBadge / TrendArrow / Sparkline / ScoreNumber 等）
- `src/HomePage.jsx` → `app/page.tsx`（含 FilterTabs / SortControl / FeaturedCard / CompactRow）
- `src/DetailPage.jsx` → `app/tools/[slug]/page.tsx`（含 TrendChart / InsightCard / Quote）
- `src/App.jsx` → Next.js 的 App Router 本身會處理，這層丟掉即可

**設計重點**
- 字體：Geist + Geist Mono（分數/數字用 mono tabular-nums 排對齊）；歡迎標語用 Source Serif italic 做 accent
- 前 3 名 featured card 有「Top spot / Up N」徽章與較大 score；4 名以下進 compact list，sm breakpoint 切換手機/桌面版列表
- 趨勢箭頭：>0.5 綠↑、<-0.5 紅↓、其他 flat→
- 詳情頁的 8 週折線圖是 inline SVG，沒用任何 chart library，方便你之後換成 recharts/visx
- 競品 chips 會自動連結到該工具的詳情頁（如果存在於資料中）

**之後想接的話**
1. 把 `TOOLS` 換成從 `/api/tools` 取的 SWR/RSC 資料
2. Filter / Sort 改成 `searchParams`，URL 可分享
3. 加 `<canonical>` 與 OG image (`/og/[slug]`) — score 大字版很適合直接做成 OG 圖
4. 「Subscribe」可串 weekly digest email — 資料庫只需要每週 snapshot 一次排名差異

## User

語言規則（重要）：
  - 整個網站介面、標籤、說明文字 →繁體中文
  - 工具名稱保留英文原文（例如：Cursor、Claude Code、GitHub Copilot）
  - 社群引言/用戶評論 →保留原文（英文或中文皆有）
  - 分類名稱中文：程式開發 / 寫作 / 圖像生成 / 自動化 / 語音

## Assistant

_[tool: write_file]_

好的，我來把介面整個改成繁體中文，工具名稱保留英文、社群引言保留原文。

_[tool: str_replace_edit]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

已完成中文化。重點：

**語言規則執行**
- 介面/標籤/說明 → 繁體中文（含分類：程式開發 / 寫作 / 圖像生成 / 自動化 / 語音）
- 工具名稱 → 保留英文（Cursor、Claude Code、GitHub Copilot…）
- 社群引言 → 保留原文（英文），引言區塊加上 `lang="en"` 提示瀏覽器用正確字體渲染
- 日期、來源平台名稱：日期翻成中文（「4 天前」）、平台名保留（Reddit · r/webdev、Hacker News）

**字體調整**
- 加上 Noto Sans TC 作為中文字體；英文部分仍走 Geist
- 數字仍用 Geist Mono + tabular-nums，整齊對齊

**小調整**
- Hero 標題改成「開發者**真正在討論**的 AI 工具」（中文不適合斜體，改用淺色強調）
- 詳情頁副標如「較上週 ↑2」、「47 則中精選 3 則」
- 「語音」分類已加入 tab，目前 fake data 沒有對應工具，會顯示「此分類目前還沒有更多工具」的 empty state（之後接真實資料就會自動填入）

## User

Verifier agent check completed

## Assistant

驗證通過 ✅ 中文化沒有問題、字體與排版都正常。可以放心拿這版去做下一步調整或接 API。

