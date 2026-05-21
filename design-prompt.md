# Design Prompt: AI Tool Discovery Engine

## 產品定位
打造一個 **AI 工具排行榜網站**，類似 kafesanpo.com 的咖啡店排行榜體驗，但主題是 AI 工具。
排名資料來自真實社群（Reddit、GitHub、Hacker News）的討論量與情緒分析，不是廠商自填，所以有公信力。

目標用戶：開發者、設計師、創業者，想找到「真實使用者推薦」的 AI 工具。

---

## 需要設計的頁面

### 1. 首頁 `/` — 排行榜

**核心功能：**
- 顯示 AI 工具排名列表，預設按「話題熱度」排序
- 排序切換：話題熱度 / 本週上升 / 最多討論
- Filter tabs：All / Coding / Writing / Image / Automation / Voice
- 每個工具卡片顯示：排名數字、工具名稱、簡短描述、分類 badge、熱度分數、本週趨勢（↑↓）

**卡片設計參考：**
- 前 3 名用較大的 featured card（有截圖或 logo 的視覺）
- 第 4 名之後用 compact list card
- 分數顯示類似 kafesanpo 的數字排名（例如 87.3）
- 趨勢箭頭：綠色 ↑ 代表本週上升，紅色 ↓ 下降，灰色 → 持平

**視覺風格：**
- 乾淨、現代、科技感但不冷冰冰
- 深色/淺色模式皆可，建議淺色為主
- 不要過度設計，資訊要一眼看懂
- 參考：Product Hunt、Linear 的設計語言

---

### 2. 工具詳情頁 `/tools/[slug]` — 例如 `/tools/cursor`

**區塊設計：**

**Header 區：**
- 工具 Logo、名稱、官方網站連結
- 分類 badge（Coding）
- 熱度分數大字顯示（87.3）
- 「本週排名 #3，較上週 ↑2」

**社群洞察卡片（最重要區塊）：**
- 適合族群：solo developer / freelancer / enterprise team（標籤形式）
- 主要用途：清單列表（從社群討論抽取）
- 社群痛點：清單列表（真實用戶抱怨）
- 定價感受：例如「大多數用戶認為 $20/mo 值得，但 enterprise 方案偏貴」

**真實引言區（像 Glassdoor 的 review）：**
- 每筆引言顯示：引用文字、來源（Reddit r/ClaudeAI）、情緒標籤（positive/negative）
- 最多顯示 5-8 則

**競品比較：**
- 「用戶常拿它跟哪些工具比較」→ 橫向比較 chip，點擊跳到那個工具
- 例如：「Cursor vs GitHub Copilot（124次討論）」

**趨勢圖：**
- 近 8 週的討論熱度折線圖（簡單、不花俏）

---

### 3. 比較頁 `/compare`（v2，先 mock 即可）

選兩個工具並排比較，用表格或雙欄形式呈現各項指標。

---

## 資料結構（給設計時用的假資料參考）

```json
{
  "tools": [
    {
      "rank": 1,
      "name": "Cursor",
      "slug": "cursor",
      "category": "coding",
      "description": "AI-first code editor built on VS Code",
      "ranking_score": 91.2,
      "trend_delta": +8.3,
      "mention_count": 1842,
      "sentiment_score": 0.72,
      "use_cases": ["React development", "refactoring", "code review"],
      "pain_points": ["expensive Pro plan", "context window limits on large repos"],
      "target_audience": ["solo developer", "frontend engineer"],
      "pricing_signal": "Most users find $20/mo worth it, some complain about Pro tier",
      "top_quote": "Switched from Copilot 3 months ago, never going back. The chat context is just on another level.",
      "comparisons": [
        {"tool": "GitHub Copilot", "mention_count": 312},
        {"tool": "Windsurf", "mention_count": 187}
      ]
    },
    {
      "rank": 2,
      "name": "Claude Code",
      "slug": "claude-code",
      "category": "coding",
      "ranking_score": 87.5,
      "trend_delta": +12.1,
      "mention_count": 1203
    }
  ]
}
```

---

## 技術限制提示（給工程師看的，設計可忽略）
- 前端：Next.js 14 + Tailwind CSS + shadcn/ui
- 部署：Zeabur
- 資料來自 Supabase REST API

---

## 設計交付物需求
1. 首頁排行榜（桌面版 + 手機版 RWD）
2. 工具詳情頁（桌面版）
3. 使用真實感的假資料填充，不要用 Lorem ipsum
4. 程式碼直接輸出 Next.js + Tailwind，可直接貼到專案使用
