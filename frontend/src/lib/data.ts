export type Sentiment = 'positive' | 'negative' | 'mixed'
export type Category = '程式開發' | '寫作' | '圖像生成' | '自動化' | '語音'
export type SortKey = 'hot' | 'rising' | 'discussed'

export interface Quote {
  text: string
  source: string
  sentiment: Sentiment
  date: string
  url?: string
  author?: string
}

export interface Competitor {
  name: string
  count: number
}

export interface ToolSources {
  reddit: number
  hn: number
  github: number
  v2ex?: number
  juejin?: number
}

export interface SentimentBreakdown {
  positive: number
  negative: number
  mixed: number
  total: number
}

export interface Tool {
  rank: number
  prevRank: number
  slug: string
  name: string
  initials: string
  accent: string
  description: string
  category: Category
  score: number
  delta: number
  discussions: number
  growth: string
  sources: ToolSources
  audiences: string[]
  useCases: string[]
  painPoints: string[]
  pricingFeel: string
  quotes: Quote[]
  competitors: Competitor[]
  trend: number[]
  sentimentBreakdown?: SentimentBreakdown
  website?: string
  logo_url?: string
  features?: string[]
  recentUpdates?: string[]
  docsUrl?: string
  radarScores?: number[]
  communitySummary?: string
  pricingDescription?: string
}

export interface SortOption {
  id: SortKey
  label: string
}

export const TOOLS: Tool[] = [
  {
    rank: 0, prevRank: 0,
    slug: 'claude-code', name: 'Claude Code', initials: 'CC',
    accent: 'oklch(0.62 0.14 35)', category: '程式開發',
    website: 'https://claude.ai/code',
    logo_url: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64',
    docsUrl: 'https://code.claude.com/docs/en/overview',
    description: 'Anthropic 推出的 agentic 程式助理，直接在終端機操作檔案、執行指令、提交 PR',
    pricingDescription: '需 Claude Pro（$20/mo）或 Max（$100/mo），API 用戶按 token 計費。Agent 模式單次任務約消耗 $0.5–5，重度使用費用高。',
    features: [
      '自動化繁瑣工作：補寫測試、修 lint 錯誤、解決 merge conflict、更新套件',
      '用自然語言描述需求，Claude Code 規劃方案、跨檔案寫程式並驗證結果',
      '直接與 git 整合：暫存變更、撰寫 commit message、建立 branch 與 PR',
      'MCP 支援：連接 Google Drive、Jira、Slack 或自訂工具',
      'CLAUDE.md 設定專案規範、架構決策與偏好套件，每次 session 自動載入',
      '多 Agent 並行：spawn 多個 Claude Code agent 同時處理不同子任務',
      'Routines：排程重複任務，在 Anthropic 托管基礎設施上執行',
      'CLI 可組合使用：pipe log、在 CI 中執行、與其他工具串接',
    ],
    recentUpdates: [
      '2026/05 — 推出 Routines 排程功能（Anthropic 托管 + 本機兩種模式）',
      '2026/05 — Sub-agents 支援跨 session 的 lead agent 協調架構',
      '2026/04 — 加入 Hooks 機制，可在工具呼叫前後執行自訂腳本',
      '2025/05 — 正式公開發布（GA），結束 Beta',
    ],
    score: 0, delta: 0, discussions: 0, growth: '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences: [], useCases: [], painPoints: [],
    pricingFeel: '', quotes: [], competitors: [], trend: [],
  },
  {
    rank: 0, prevRank: 0,
    slug: 'cursor', name: 'Cursor', initials: 'Cu',
    accent: 'oklch(0.55 0.18 265)', category: '程式開發',
    website: 'https://cursor.com',
    logo_url: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=64',
    docsUrl: 'https://docs.cursor.com',
    description: '以 AI 為核心的程式編輯器，支援跨檔案編輯、Composer 模式與 agent 自動完成任務',
    pricingDescription: '免費版每月 500 次 fast request。Pro $20/mo，含無限 slow request 與 500 次 fast。Business $40/mo 加上團隊管理功能。',
    features: [
      'Agents：自動執行任務、建置、測試並 demo 功能',
      'Tab：專門化的自動補全模型，預測下一步行動',
      'Composer 2.5：AI 協作編寫程式碼，支援完整 codebase 理解與語意搜尋',
      'BugBot（Code Review）：程式碼審查，自動偵測潛在 bug',
      'Cloud Agents：在雲端運行的 agent，支援多 repo 或無 repo 配置',
      'Cursor Automations：自動化重複任務，整合 Jira、Slack、GitHub PR',
    ],
    recentUpdates: [
      '2026/05/20 — Cursor Automations 改進（v3.5），支援多 repo 配置',
      '2026/05/19 — 整合 Jira，可在工作項目中直接指派 Cursor Agent',
      '2026/05/18 — Composer 2.5 推出，智能與行為大幅提升',
      '2026/05/13 — 全螢幕 Tabs 與緊湊聊天模式（v3.4）',
    ],
    score: 0, delta: 0, discussions: 0, growth: '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences: [], useCases: [], painPoints: [],
    pricingFeel: '', quotes: [], competitors: [], trend: [],
  },
  {
    rank: 0, prevRank: 0,
    slug: 'trae', name: 'Trae', initials: 'Tr',
    accent: 'oklch(0.55 0.16 200)', category: '程式開發',
    website: 'https://trae.ai',
    logo_url: 'https://www.google.com/s2/favicons?domain=trae.ai&sz=64',
    docsUrl: 'https://docs.trae.ai',
    description: 'ByteDance 推出的 AI IDE，SOLO agent 自主完成整個開發任務，SWE-bench Verified 排行第一',
    pricingDescription: '目前完全免費，ByteDance 補貼所有模型費用（含 Claude 4）。正式商業化時程未定，現為搶市佔策略。',
    features: [
      'TRAE SOLO：使用者定義任務，AI 自主處理其餘所有步驟',
      'Cue-Pro：程式碼編輯預測的全局視角，預覽 AI 下一步計畫',
      'Agent Skills：可自訂 Rules + Tools 定義你的 Agent 行為',
      'Max Mode：最高效能模式，使用頂級模型處理複雜任務',
      'SOLO Mobile App：在手機上啟動和監控 Agent 任務',
      'SWE-bench Verified #1：以 Claude 4 達到業界最高評分',
    ],
    recentUpdates: [
      '2026/05/06 — 推出 TRAE SOLO Mobile App',
      '2026/03/31 — The New SOLO 重大更新',
      '2025/12/29 — Cue-Pro 技術深度更新',
      '2025/11/04 — TRAE SOLO 正式 GA 發布',
    ],
    score: 0, delta: 0, discussions: 0, growth: '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences: [], useCases: [], painPoints: [],
    pricingFeel: '', quotes: [], competitors: [], trend: [],
  },
  {
    rank: 0, prevRank: 0,
    slug: 'windsurf', name: 'Windsurf', initials: 'Wi',
    accent: 'oklch(0.55 0.15 165)', category: '程式開發',
    website: 'https://windsurf.com',
    logo_url: 'https://www.google.com/s2/favicons?domain=windsurf.com&sz=64',
    docsUrl: 'https://docs.windsurf.com/windsurf/getting-started',
    description: 'Codeium 推出的 AI 編輯器，以 Cascade agent 模式實現深度上下文感知的多步驟編程',
    pricingDescription: '免費版含每月 Windsurf Credits（有限），Pro $15/mo 含更多 Credits，Team $35/人/mo。Credits 耗盡需另購。',
    features: [
      'Cascade：深度感知整個 codebase 的 agentic 工作流，可自主執行多步驟任務',
      'Windsurf Tab：預測下一步編輯行為，支援跨檔案的智能補全',
      'Devin（雲端 Agent）：在雲端沙盒中自主執行開發任務，支援 terminal 操作',
      'Agent Command Center：統一管理多個平行 agent 任務的控制中心',
      'Spaces：儲存 codebase context，讓 AI 記住專案結構與偏好',
      'Windsurf Previews：即時預覽 UI 變更，整合 browser preview',
      'MCP 支援：連接外部工具、資料來源與自訂整合',
      'Supercomplete：多行、跨函式的進階程式碼補全',
    ],
    recentUpdates: [
      '2026/05/17 — v2.3.9 發布，修復多項 Cascade 與補全穩定性問題',
      '2026/05/12 — 支援 Claude Opus 4.7 fast mode，大幅提升回應速度',
      '2026/05/06 — v2.2.17 發布，Devin 整合改進與 MCP 穩定性提升',
      '2026/04/28 — Devin in Terminal 功能推出，可在終端直接呼叫雲端 agent',
    ],
    score: 0, delta: 0, discussions: 0, growth: '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences: [], useCases: [], painPoints: [],
    pricingFeel: '', quotes: [], competitors: [], trend: [],
  },
  {
    rank: 0, prevRank: 0,
    slug: 'codex', name: 'Codex', initials: 'Cx',
    accent: 'oklch(0.52 0.12 240)', category: '程式開發',
    website: 'https://chatgpt.com/codex',
    logo_url: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64',
    docsUrl: 'https://platform.openai.com/docs/codex',
    description: 'OpenAI 推出的雲端 coding agent，在沙盒環境平行處理多個任務並自動建立 PR',
    pricingDescription: 'ChatGPT Pro（$200/mo）用戶可直接使用。API 另計，o3 模型約 $10/1M input tokens。任務複雜度高時費用難以預測。',
    features: [
      '雲端沙盒隔離執行：每個任務在獨立環境中執行，不影響本地或生產環境',
      '平行多工：同時執行多個 coding task，任務互不干擾',
      '自動建立 GitHub PR，附帶變更說明與測試結果',
      '全 codebase 理解：直接整合 GitHub repo，讀取完整程式結構',
      '終端指令 + 測試套件執行：可安裝套件、跑測試、驗證結果',
      '以 o3 模型為核心，具備強推理與 debug 能力',
      '整合 ChatGPT 介面，可在 ChatGPT.com 直接指派任務',
    ],
    recentUpdates: [
      '2025/05 — 向 ChatGPT Pro、Plus、Team 用戶開放 Codex',
      '2025/05 — 加入 GitHub Actions 整合，支援 CI 自動化流程',
      '2025/04 — 正式推出（取代舊版 Codex API），支援 GitHub repo 綁定',
      '2025/04 — Enterprise 方案開放，提供更高任務配額與私有 repo 支援',
    ],
    score: 0, delta: 0, discussions: 0, growth: '',
    sources: { reddit: 0, hn: 0, github: 0 },
    audiences: [], useCases: [], painPoints: [],
    pricingFeel: '', quotes: [], competitors: [], trend: [],
  },
]

export const CATEGORIES: string[] = ['全部', '程式開發', '寫作', '圖像生成', '自動化', '語音']

export const SORTS: SortOption[] = [
  { id: 'hot', label: '話題熱度' },
  { id: 'rising', label: '本週上升' },
  { id: 'discussed', label: '最多討論' },
]
