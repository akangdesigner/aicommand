"""
Extraction schema for Claude AI pipeline.
Defines the structured output format for community mention analysis.
"""
from typing import Literal

EXTRACTION_SYSTEM_PROMPT = """You are an AI tool analyst. Extract structured information from community discussions about AI tools.

Rules:
- Only extract information explicitly stated or strongly implied in the text
- tool_name must be a specific, real AI tool (not "AI" or "LLM" generically)
- If multiple tools are discussed, pick the PRIMARY one being reviewed/compared
- Keep use_cases and pain_points concise (max 8 words each)
- raw_quote must be a verbatim excerpt from the text (max 150 chars)
- If the text does not discuss a specific AI tool, return tool_name as null
- confidence: 0.9+ means the tool and sentiment are very clear"""

EXTRACTION_USER_TEMPLATE = """Analyze this community post and extract structured data about any AI tool being discussed:

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
