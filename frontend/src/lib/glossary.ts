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
      {
        id: 'refactor',
        term: 'Refactor',
        tagline: '整理程式碼，功能不變但更好維護',
        aka: ['重構'],
        body: '就像整理房間——東西還在，但擺得更整齊。Refactor 是在不改變程式行為的前提下，把程式碼結構改得更清晰、更好維護。AI 工具現在可以掃描整個 codebase，主動建議甚至自動完成重構，過去可能要花幾天的工作，現在幾分鐘內就能完成。',
      },
      {
        id: 'debug',
        term: 'Debug',
        tagline: '找出並修好程式裡的錯誤',
        aka: ['除錯'],
        body: '程式跑出來的結果不對，或直接報錯，就需要 debug。傳統上要一行一行追查，AI 工具現在可以讀錯誤訊息、自動推斷原因、直接給你修好的版本。有些工具還會解釋為什麼這樣改，比只給答案更有學習價值。',
      },
      {
        id: 'cicd',
        term: 'CI/CD',
        tagline: '自動測試、自動部署的流水線',
        aka: ['持續整合', '持續部署'],
        body: 'Continuous Integration / Continuous Deployment。每次程式碼有變動，就自動跑測試、自動把新版本送上線。AI 工具正在滲透這個環節——從自動生成測試、到修復 CI 失敗、到協助設定部署流程，減少手工重複勞動。',
      },
      {
        id: 'code-review',
        term: 'Code Review',
        tagline: '上線前讓人（或 AI）檢查程式碼',
        aka: ['程式審查'],
        body: '提交程式前，由同事或工具掃描一遍，看有沒有 bug、安全漏洞、或寫法可以更好的地方。傳統要等隊友有空，現在 AI 工具可以在幾秒內完成初步審查，提前攔截低級錯誤，留下真正需要人判斷的問題給人看。',
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
      {
        id: 'extension',
        term: 'Extension',
        tagline: '裝進編輯器的 AI 外掛',
        aka: ['Plugin', '外掛', '擴充功能'],
        body: '不換掉你現在用的編輯器，只是在裡面裝一個外掛。GitHub Copilot、Codeium 都提供 VS Code、JetBrains 等主流 IDE 的 Extension。優點是不用改習慣，缺點是功能深度通常不如原生 AI IDE，因為只能在外掛的權限範圍內操作。',
      },
      {
        id: 'local-model',
        term: '本地模型',
        tagline: '跑在自己電腦上、資料不出去的 AI',
        aka: ['Local Model', 'On-device AI'],
        body: '模型直接安裝在你的電腦或伺服器上，運算在本地完成，資料完全不送到外部。Ollama、LM Studio 是常見的本地部署工具，搭配 Llama、Mistral 等開源模型使用。對資安要求嚴格的企業、或不願意把程式碼送上雲端的開發者首選。',
      },
      {
        id: 'no-code-builder',
        term: 'No-code Builder',
        tagline: '不寫程式也能做 AI 應用的工具',
        aka: ['無程式碼工具', 'Low-code'],
        body: '用拖拉介面、填表單的方式組出 AI 流程，不需要懂程式。Dify、Flowise、n8n 都屬於這類。它讓非工程師也能快速打造 AI 助理、自動化流程。但碰到複雜邏輯時，仍然需要工程師介入或搭配程式碼節點。',
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
      {
        id: 'hallucination',
        term: '幻覺',
        tagline: 'AI 一本正經地說錯話',
        aka: ['Hallucination'],
        body: 'AI 沒有「不知道」的概念，遇到不確定的事情，它有時會自己編造一個聽起來合理的答案，而且語氣一樣自信。這稱為幻覺。在程式碼場景下，常見的是 AI 引用不存在的函式名稱或 API 參數。使用 AI 生成的程式碼前，務必跑過測試確認。',
      },
      {
        id: 'rag',
        term: 'RAG',
        tagline: '讓 AI 查完資料再回答',
        aka: ['Retrieval-Augmented Generation', '檢索增強生成'],
        body: '在 AI 回答前，先去文件庫、資料庫或你上傳的檔案裡搜尋相關段落，再把找到的內容塞進 prompt 一起送給 AI 參考。結果比純靠模型記憶更準確、更新，也能引用來源。大多數「問你自己的文件」類工具背後都是 RAG 架構。',
      },
      {
        id: 'system-prompt',
        term: 'System Prompt',
        tagline: '在對話開始前給 AI 的背景設定',
        aka: ['系統提示', '系統指令'],
        body: '對話開始前，在幕後給 AI 的一段說明，用來定義它的角色、限制和行為規則。例如：「你是一個只回答 Python 問題的助理」。一般使用者看不到 system prompt，但它決定了 AI 整個對話的基調。Cursor Rules、GitHub Copilot Instructions 都是 system prompt 的應用。',
      },
      {
        id: 'fine-tuning',
        term: 'Fine-tuning',
        tagline: '用自家資料再訓練模型',
        aka: ['微調', '微調訓練'],
        body: '拿一個現成的大模型，再用你自己的資料繼續訓練它，讓它更熟悉你的產業術語、程式碼風格或寫作語氣。成本比從頭訓練低很多，但仍需要一定的資料量和計算資源。適合對特定任務要求極高品質的企業，一般開發者用 RAG 或 system prompt 就夠了。',
      },
    ],
  },
  {
    id: 'models',
    label: '主流模型',
    labelEn: 'MODELS',
    color: 'oklch(0.55 0.16 200)',
    entries: [
      {
        id: 'gpt',
        term: 'GPT',
        tagline: 'OpenAI 出品的語言模型系列',
        aka: ['GPT-4', 'GPT-4o', 'ChatGPT'],
        body: 'OpenAI 的旗艦模型系列。GPT-4o 是目前最常被各工具整合的版本，支援文字、圖片、語音輸入。ChatGPT 是使用 GPT 模型的聊天介面，但 GPT 模型本身也被 Cursor、GitHub Copilot 等第三方工具採用。在程式碼生成能力上與 Claude 互有勝負，端看任務類型。',
      },
      {
        id: 'claude',
        term: 'Claude',
        tagline: 'Anthropic 出品，長文與程式碼表現突出',
        aka: ['Claude 3', 'Claude Sonnet', 'Claude Opus'],
        body: 'Anthropic 的旗艦模型系列，以 200k 超大 context window 和穩定的程式碼推理著稱。Claude Sonnet 是目前最常被開發者用於程式碼任務的版本，Opus 則是能力最強但速度較慢的高階選項。Claude Code CLI 直接以 Claude 模型為核心，深度整合終端機工作流。',
      },
      {
        id: 'gemini',
        term: 'Gemini',
        tagline: 'Google 出品，擅長超長文件分析',
        aka: ['Gemini Pro', 'Gemini Flash', 'Gemini 1.5'],
        body: 'Google DeepMind 的多模態模型系列。Gemini 1.5 Pro 擁有高達 1M tokens 的 context window，是目前市面上最大的，適合分析整個大型 repo 或超長技術文件。Gemini Flash 則以速度和低成本見長，適合需要高頻呼叫的場景。',
      },
      {
        id: 'open-source-model',
        term: '開源模型',
        tagline: '程式碼公開、可自行部署的 AI 模型',
        aka: ['Open Source Model', 'Llama', 'Mistral', 'DeepSeek'],
        body: '模型的權重（也就是 AI 的「大腦資料」）公開釋出，任何人都可以下載、修改、本地部署。Llama（Meta）、Mistral、DeepSeek、Qwen 是目前最熱門的開源模型。對程式碼能力要求不極端、但重視資料隱私或成本控制的團隊，開源模型是主流選擇。',
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
      {
        id: 'enterprise',
        term: 'Enterprise 方案',
        tagline: '給公司用的合規版，資料不混用',
        aka: ['企業方案', 'Business Plan'],
        body: '針對企業需求設計：資料隔離（你的程式碼不會被拿去訓練模型）、SSO 單一登入、用量管理、SLA 保證、合規認證（SOC 2、GDPR）。通常需要年約、價格談判。如果你的公司有資安或法遵要求，這是唯一該考慮的方案。',
      },
      {
        id: 'rate-limit',
        term: 'Rate Limit',
        tagline: '每分鐘最多能送幾次請求',
        aka: ['速率限制', '請求上限'],
        body: '廠商對 API 呼叫頻率的限制，通常以「每分鐘 N 次」或「每天 N 個 token」計算。免費方案的 rate limit 很緊，跑 Agent 任務特別容易撞到，導致任務中斷。Pro 和 Enterprise 方案的上限通常高很多，這是影響 AI 工具實際體驗的隱形關鍵指標。',
      },
    ],
  },
  {
    id: 'evaluation',
    label: '工具選型',
    labelEn: 'EVALUATION',
    color: 'oklch(0.55 0.13 60)',
    entries: [
      {
        id: 'benchmark',
        term: 'Benchmark',
        tagline: '用標準題目比較不同模型的分數',
        aka: ['基準測試'],
        body: '廠商和研究機構設計的標準化題目集，讓不同模型在相同條件下比拼，結果轉成分數排行。HumanEval、SWE-bench 是程式碼領域最常被引用的 benchmark。但注意：廠商可能針對 benchmark 優化，真實日常使用感受不一定和排名一致，要結合社群評論判斷。',
      },
      {
        id: 'latency',
        term: 'Latency',
        tagline: 'AI 回應需要等多久',
        aka: ['延遲', '回應速度'],
        body: '從你送出請求到 AI 開始輸出第一個字的時間。對於需要即時互動的場景（像是 IDE 補全），latency 比模型能力更影響使用體驗——差 0.5 秒就差很多。速度快的模型通常能力稍弱，這是目前業界普遍存在的取捨。',
      },
      {
        id: 'accuracy',
        term: '準確率',
        tagline: 'AI 生成的程式碼能不能跑',
        aka: ['Accuracy', 'Pass Rate'],
        body: '在程式碼任務中，準確率通常指「第一次生成就能成功執行、且結果正確」的比率。不同工具在不同程式語言、不同任務類型（補全 vs 生成整個函式 vs 修 bug）上的準確率差異很大，不要只看總分，要看你實際用途對應的細項。',
      },
      {
        id: 'privacy',
        term: '資料隱私',
        tagline: '你的程式碼會不會被拿去訓練',
        aka: ['Data Privacy', '隱私政策'],
        body: '很多開發者最擔心的問題：把公司程式碼送進 AI 工具，廠商會不會留存、拿去訓練下一代模型？多數工具的 Free / Pro 方案預設會記錄資料，Enterprise 方案才保證不用於訓練。使用前一定要讀清楚隱私政策，尤其是處理客戶資料或敏感業務邏輯時。',
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
