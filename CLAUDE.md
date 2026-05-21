# AICommand — AI 工具排行榜

排名來自真實社群爬蟲（Reddit、GitHub、HN、V2EX、掘金），不是廠商自填。

## 專案結構

```
ai-tool-discovery/
├── crawler/sources/     # 爬蟲：reddit.py / github.py / hackernews.py / v2ex.py / juejin.py
├── pipeline/            # extractor.py（Groq 抽取）、scorer.py（計算排名分數）
├── db/migrations/       # 001_init.sql — Supabase schema + seed
├── api/                 # FastAPI（爬蟲觸發用，非前端必要）
└── frontend/            # Next.js 14 + Tailwind（部署於 Zeabur）
    └── src/
        ├── app/         # App Router pages
        ├── components/  # UI 元件
        └── lib/         # data.ts（mock）、supabase.ts（真實資料）
```

## 語言規則

- 介面、標籤、說明文字 → **繁體中文**
- 工具名稱保留英文（Cursor、Claude Code、GitHub Copilot）
- 社群引言 / 用戶評論 → 保留原文（英文或中文皆有）
- 分類名稱：程式開發 / 寫作 / 圖像生成 / 自動化 / 語音

## 技術選型

| 層級 | 技術 |
|------|------|
| 爬蟲 | Python + httpx（無 OAuth，公開 JSON API） |
| AI 抽取 | Groq `llama-3.1-8b-instant`，CONCURRENCY=2，RATE_LIMIT_DELAY=5s |
| 資料庫 | Supabase（PostgreSQL）|
| 前端 | Next.js 14 App Router + Tailwind CSS v3 + Geist + Noto Sans TC |
| 部署 | Zeabur（frontend/），Root Directory = `frontend` |
| 排程 | 手動或 GitHub Actions（尚未設定） |

## 環境變數

`.env`（Python 爬蟲 / pipeline 用）：
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=   # 寫入用，不可洩漏
GROQ_API_KEY=
GITHUB_TOKEN=
```

`frontend/.env.local`（Next.js 本機用）：
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # 公開讀取用
```

Zeabur Variables（線上）：同 `.env.local` 的兩個 key。

## 常用指令

```bash
# 本機前端
cd frontend && npm run dev

# 跑所有爬蟲（需 .env）
python -m crawler.run_all

# 重新計算排名分數
python -m pipeline.scorer

# 抽取 pipeline
python -m pipeline.extractor
```

## 資料庫重要資訊

- `raw_mentions`：爬蟲原始資料（只增不改）
- `extracted_insights`：Groq 抽取結構化資料
- `tools`：排行榜主表，`ranking_score` 由 `recalculate_tool_score()` SQL 函數計算
- `tool_weekly_trends`：Materialized View，需手動 REFRESH

排名公式（HN 啟發）：
```
score = mention_count^0.8 × sentiment_weight × recency_factor
```

## 前端資料流

```
Supabase tools 表
  → getToolsForHomePage()（lib/supabase.ts）
  → 與 mock 資料合併（enriched fields）
  → HomePageClient（force-dynamic SSR）
```

沒有對應 mock 資料的工具會用 `makeBasicTool()` 產生基本 UI。
