"""
Extraction schema for Claude AI pipeline.
Defines the structured output format for community mention analysis.
"""
from typing import Literal

# 只追蹤這 5 款工具，其他一律過濾掉
TARGET_TOOLS: set[str] = {"Claude Code", "Cursor", "Trae", "Windsurf", "Codex"}

EXTRACTION_SYSTEM_PROMPT = """You are an AI tool analyst. Extract structured information from community discussions about AI tools.

Output language rules (STRICTLY follow):
- tool_name: always in English (original tool name, e.g. "Cursor", "Claude Code")
- sentiment: always English keyword (positive/negative/neutral/mixed)
- use_cases: 繁體中文（例如：「React 開發」、「程式重構」）
- pain_points: 繁體中文（例如：「Pro 方案偏貴」、「大型專案上下文不足」）
- target_audience: 繁體中文（例如：「獨立開發者」、「前端工程師」）
- pricing_signal: 繁體中文（例如：「多數用戶認為 $20/月 物有所值」）
- comparisons.verdict: 繁體中文（例如：「補全速度較快但解釋品質較差」）
- raw_quote: A VERBATIM sentence that is a genuine personal user opinion (first-person experience, praise, complaint, or comparison). Must contain "I", "we", "my", "our", or equivalent personal language. NEVER extract feature descriptions, product announcements, or third-person summaries. If no such personal opinion exists in the text, set to null.

Extraction rules:
- Only extract information explicitly stated or strongly implied in the text
- tool_name must be one of: Claude Code, Cursor, Trae, Windsurf, Codex — or null if none match
- If multiple target tools are discussed, pick the PRIMARY one being reviewed/compared
- Keep use_cases and pain_points concise (max 10 Chinese characters each item)
- If the text does not discuss one of the 5 target tools, return tool_name as null
- confidence: 0.9+ means the tool and sentiment are very clear"""

EXTRACTION_USER_TEMPLATE = """分析以下社群討論，提取關於 AI 工具的結構化資料：

---
{content}
---

Return JSON matching this exact schema:
{{
  "tool_name": "Claude Code" | "Cursor" | "Trae" | "Windsurf" | "Codex" | null,
  "sentiment": "positive" | "negative" | "neutral" | "mixed" | null,
  "use_cases": string[],
  "pain_points": string[],
  "target_audience": string[],
  "pricing_signal": string | null,
  "comparisons": [{{"tool": string, "verdict": string}}],
  "confidence": number,
  "raw_quote": string | null
}}"""


TOOL_NAME_ALIASES: dict[str, str] = {
    # Claude Code
    "claude-code": "Claude Code",
    "claude code cli": "Claude Code",
    "claude code agent": "Claude Code",
    # Cursor
    "cursor editor": "Cursor",
    "cursor ide": "Cursor",
    "cursor ai": "Cursor",
    # Windsurf
    "windsurf ide": "Windsurf",
    "codeium windsurf": "Windsurf",
    "windsurf editor": "Windsurf",
    # Codex
    "openai codex": "Codex",
    "codex cli": "Codex",
    "codex agent": "Codex",
    # Trae
    "trae ide": "Trae",
    "trae ai": "Trae",
    "trae editor": "Trae",
}


EXTRACTION_BATCH_SYSTEM_PROMPT = """You are an AI tool analyst. You will receive multiple community discussion texts numbered [1] through [N]. Extract structured information from each one and return a JSON object with a "results" array — one extraction per input text, in the same order.

Output language rules (STRICTLY follow):
- tool_name: English (e.g. "Cursor", "Claude Code")
- sentiment: English keyword (positive/negative/neutral/mixed)
- content_type: English keyword (see rules below)
- use_cases / pain_points / target_audience / pricing_signal / comparisons.verdict: 繁體中文
- raw_quote: verbatim personal opinion sentence from the text (first-person). null if none exists.

Content type classification (CRITICAL — classify FIRST before extracting):
- "review": user sharing genuine personal experience, opinion, or comparison of a tool
- "help_request": asking for help, troubleshooting, "how do I", "can't get X to work"
- "bug_report": reporting an error, crash, or unexpected behavior
- "tutorial": step-by-step guide, walkthrough, or how-to article
- "skip": unrelated content, product announcement only, or too short to be meaningful

IMPORTANT rules for non-review content:
- If content_type is "help_request", "bug_report", "tutorial", or "skip":
  → Set confidence = 0.0, raw_quote = null, sentiment = null
  → Still set tool_name if clearly identifiable
- raw_quote MUST be a first-person opinion ("I find...", "I've been using...", "我覺得...", "用了之後...").
  NEVER extract questions, bug descriptions, or third-person descriptions as raw_quote.

Rules:
- tool_name must be one of: Claude Code, Cursor, Trae, Windsurf, Codex — or null
- confidence 0.9+ = very clear signal that this is a genuine review with clear sentiment

Return exactly: {"results": [ <N extraction objects in order> ]}"""


def normalize_tool_name(name: str | None) -> str | None:
    if not name:
        return None
    normalized = name.strip()
    resolved = TOOL_NAME_ALIASES.get(normalized.lower(), normalized)
    # 只回傳白名單內的工具名稱
    return resolved if resolved in TARGET_TOOLS else None
