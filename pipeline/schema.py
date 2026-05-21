"""
Extraction schema for Claude AI pipeline.
Defines the structured output format for community mention analysis.
"""
from typing import Literal

EXTRACTION_SYSTEM_PROMPT = """You are an AI tool analyst. Extract structured information from community discussions about AI tools.

Output language rules (STRICTLY follow):
- tool_name: always in English (original tool name, e.g. "Cursor", "Claude Code")
- sentiment: always English keyword (positive/negative/neutral/mixed)
- use_cases: 繁體中文（例如：「React 開發」、「程式重構」）
- pain_points: 繁體中文（例如：「Pro 方案偏貴」、「大型專案上下文不足」）
- target_audience: 繁體中文（例如：「獨立開發者」、「前端工程師」）
- pricing_signal: 繁體中文（例如：「多數用戶認為 $20/月 物有所值」）
- comparisons.verdict: 繁體中文（例如：「補全速度較快但解釋品質較差」）
- raw_quote: VERBATIM original text, never translate (preserve original language)

Extraction rules:
- Only extract information explicitly stated or strongly implied in the text
- tool_name must be a specific, real AI tool (not "AI" or "LLM" generically)
- If multiple tools are discussed, pick the PRIMARY one being reviewed/compared
- Keep use_cases and pain_points concise (max 10 Chinese characters each item)
- If the text does not discuss a specific AI tool, return tool_name as null
- confidence: 0.9+ means the tool and sentiment are very clear"""

EXTRACTION_USER_TEMPLATE = """分析以下社群討論，提取關於 AI 工具的結構化資料：

---
{content}
---

Return JSON matching this exact schema:
{{
  "tool_name": string | null,
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
    "gpt-4": "ChatGPT",
    "gpt4": "ChatGPT",
    "gpt 4": "ChatGPT",
    "openai": "ChatGPT",
    "claude 3": "Claude",
    "claude 3.5": "Claude",
    "claude 3.7": "Claude",
    "sonnet": "Claude",
    "opus": "Claude",
    "haiku": "Claude",
    "anthropic": "Claude",
    "gh copilot": "GitHub Copilot",
    "codeium": "Windsurf",
    "bolt": "Bolt",
    "bolt.new": "Bolt",
    "v0.dev": "v0 by Vercel",
}


def normalize_tool_name(name: str | None) -> str | None:
    if not name:
        return None
    normalized = name.strip()
    return TOOL_NAME_ALIASES.get(normalized.lower(), normalized)
