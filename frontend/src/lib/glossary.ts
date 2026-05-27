export interface GlossaryTerm {
  id: string
  term: string
  plain: string
  detail: string
}

export interface GlossaryEntry {
  id: string
  term: string
  tagline: string
  aka?: string[]
  body: string
}

export interface GlossaryCategory {
  id: string
  label: string
  labelEn: string
  color: string
  entries: GlossaryEntry[]
}

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  {
    id: 'workflow',
    label: '工作方式',
    labelEn: 'WORKFLOW',
    color: 'oklch(0.55 0.18 265)',
    entries: [
      {
        id: 'vibe-coding',
        term: 'Vibe Coding',
        tagline: '用說的讓 AI 幫你寫程式',
        body: '你只要描述「我想做什麼」，AI 就自動把程式碼寫出來。不需要自己懂語法，想法說清楚就好。這個詞由 Andrej Karpathy 在 2025 年初提出，迅速成為描述 AI 輔助開發新典範的主流詞彙。',
      },
      {
        id: 'ai-agent',
        term: 'Agent',
        tagline: '能自己把任務從頭做到尾的 AI',
        aka: ['AI Agent', 'Agentic AI'],
        body: '不只是回答問題——Agent 會自己想辦法、一步步把事情做完。例如：你說「幫我新增登入功能」，它自己寫程式、測試、存好，你只需要最後確認。Claude Code、Devin、OpenHands 都屬於 Agent 類工具。',
      },
      {
        id: 'pr',
        term: 'PR',
        tagline: '把寫好的程式送交團隊審查',
        aka: ['Pull Request', 'Merge Request'],
        body: 'Pull Request 的縮寫。就像交作業——程式寫好後，送出 PR 讓其他人檢查，沒問題才正式合併進主版本。AI 工具現在可以自動幫你開 PR 並附上說明，大幅壓縮 code review 等待時間。',
      },
      {
        id: 'commit',
        term: 'Commit',
        tagline: '把程式碼變更存進版本記錄',
        body: '每次 commit 就像存檔，並留下一筆記錄說明你改了什麼。以後出問題可以回頭查、甚至復原。AI 工具可以自動幫你 commit 並寫出有意義的說明，取代人工填寫「fix bug」的壞習慣。',
      },
      {
        id: 'sandbox',
        term: '沙盒',
        tagline: '隔離的安全執行環境',
        aka: ['Sandbox'],
        body: 'AI 在一個「假」的隔離空間裡工作，就算出錯也不會影響你的真實電腦或網站。你可以放心讓它嘗試、失敗、重試。高風險的 Agent 操作（刪檔、改設定）通常都需要在沙盒中完成。',
      },
    ],
  },
  {
    id: 'tools',
    label: '工具類型',
    labelEn: 'TOOL TYPES',
    color: 'oklch(0.6 0.13 165)',
    entries: [
      {
        id: 'ide',
        term: 'IDE',
        tagline: '整合 AI 助手的程式碼編輯器',
        aka: ['整合開發環境'],
        body: 'Integrated Development Environment。就是你寫程式的地方，像 Word 是寫文章用的。Cursor、Trae、Windsurf 都是帶 AI 的 IDE——它們能讀懂你整個專案，不只是單一檔案，給出更精準的建議。',
      },
      {
        id: 'cli',
        term: 'CLI',
        tagline: '純指令操作，沒有視覺介面',
        aka: ['命令列', 'Terminal'],
        body: 'Command Line Interface。就是那個純文字的黑色視窗，要打指令才能操作。Claude Code、Aider 都是 CLI 工具。對不習慣終端機的人門檻較高，但對開發者來說往往更靈活、更好自動化。',
      },
      {
        id: 'mcp',
        term: 'MCP',
        tagline: '讓 AI 連接外部工具的橋樑',
        aka: ['Model Context Protocol'],
        body: 'Anthropic 提出的開放協定。讓 AI 不只會聊天，還能去 Google Drive 讀文件、在 Slack 發訊息、查 Jira 任務——像給 AI 安裝外掛一樣。目前 Claude、Cursor 等主流工具都已支援 MCP。',
      },
    ],
  },
  {
    id: 'concept',
    label: 'AI 概念',
    labelEn: 'AI CONCEPTS',
    color: 'oklch(0.6 0.14 35)',
    entries: [
      {
        id: 'codebase',
        term: 'Codebase',
        tagline: '專案裡所有程式碼的總稱',
        body: '就是你整個專案資料夾裡所有的程式碼。AI 工具能「讀懂」整個 codebase，才能幫你做跨檔案的修改，而不只是改單一檔案。這是 AI IDE 和單純聊天機器人最大的差異所在。',
      },
      {
        id: 'context-window',
        term: 'Context Window',
        tagline: 'AI 一次能記住多少資訊',
        aka: ['上下文視窗'],
        body: '就像 AI 的「短期記憶」，每次對話它只能看到 context window 範圍內的內容。視窗越大，AI 能同時讀的程式碼越多、犯錯越少。GPT-4 是 128k tokens，Claude 是 200k，Gemini 達 1M。',
      },
      {
        id: 'token',
        term: 'Token',
        tagline: 'AI 計算費用的最小單位',
        body: '大致上，1 個英文單字≈1 個 token，1 個中文字≈1–2 個 token。你每次送出的問題和 AI 的回答都會消耗 token。用量計費的 API 方案就是按 token 數算錢，所以 prompt 越精簡越省錢。',
      },
      {
        id: 'prompt',
        term: 'Prompt',
        tagline: '你給 AI 的指令或問題',
        aka: ['提示詞', '指令'],
        body: '就是你輸入給 AI 的文字——可以是問題、指令、或任何你希望 AI 處理的內容。寫好 prompt 的能力（Prompt Engineering）已成為現代開發者的重要技能，直接影響 AI 輸出的品質。',
      },
    ],
  },
  {
    id: 'pricing',
    label: '定價模式',
    labelEn: 'PRICING',
    color: 'oklch(0.55 0.14 310)',
    entries: [
      {
        id: 'free-tier',
        term: 'Free Tier',
        tagline: '試用方案，不刷卡也能用',
        aka: ['免費版', '免費方案'],
        body: '廠商提供的永久免費層級，讓你在付費前先體驗核心功能。通常有用量限制（每月多少次請求）或功能限制（不含最新模型）。評估工具時，先用 Free Tier 試再決定要不要付費是標準做法。',
      },
      {
        id: 'pro-plan',
        term: 'Pro 方案',
        tagline: '訂閱制，按月付費解鎖完整功能',
        aka: ['Pro Plan', '付費方案'],
        body: '通常是月費制（$10–$50/月），解鎖更多 token 用量、更新模型、進階功能（如無限 Agent 執行）。多數 AI 工具的 Pro 方案在深度使用下 CP 值遠高於同等的 API 用量費用。',
      },
      {
        id: 'api-billing',
        term: '用量計費',
        tagline: '用多少付多少，適合開發者整合',
        aka: ['Pay-as-you-go', 'API Billing'],
        body: '不訂閱，直接呼叫 API 按 token 計費。靈活度高，但費用難以預測——跑一個複雜 Agent 任務可能比整個月的 Pro 訂閱還貴。適合企業整合或低頻使用者，不適合每天大量使用的個人。',
      },
    ],
  },
]

// Flat list for backward compat (HomePage term highlighting)
export const GLOSSARY: GlossaryTerm[] = GLOSSARY_CATEGORIES.flatMap((c) =>
  c.entries.map((e) => ({
    id: e.id,
    term: e.term,
    plain: e.tagline,
    detail: e.body,
  }))
)

export const TERM_LINKS: { term: string; id: string }[] = GLOSSARY_CATEGORIES.flatMap((c) =>
  c.entries.flatMap((e) => [
    { term: e.term, id: e.id },
    ...(e.aka ?? []).map((alias) => ({ term: alias, id: e.id })),
  ])
)
