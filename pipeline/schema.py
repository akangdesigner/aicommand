"""
Extraction schema for Claude AI pipeline.
Defines the structured output format for community mention analysis.
"""
from typing import Literal

# 追蹤的工具清單
TARGET_TOOLS: set[str] = {
    # Coding
    "Claude Code", "Cursor", "Trae", "Windsurf", "Codex",
    "GitHub Copilot", "Replit", "Aider", "Cline", "Bolt", "Lovable", "Devin",
    # Automation
    "n8n", "Make", "Zapier", "Dify",
    # Image
    "Midjourney", "ComfyUI", "Adobe Firefly", "Ideogram", "Leonardo AI",
    # Video
    "Seedance", "Kling", "Runway", "Sora", "Pika", "Veo", "Hailuo",
    # Voice
    "ElevenLabs", "Suno", "Udio",
    # Writing / General AI
    "ChatGPT", "Notion AI", "Perplexity", "Grammarly", "Jasper", "Copy.ai",
}

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
- tool_name must be one of: Claude Code, Cursor, Trae, Windsurf, Codex, GitHub Copilot, Replit, Aider, Cline, Bolt, Lovable, Devin, n8n, Make, Zapier, Dify, Midjourney, ComfyUI, Adobe Firefly, Ideogram, Leonardo AI, Seedance, Kling, Runway, Sora, Pika, Veo, Hailuo, ElevenLabs, Suno, Udio, ChatGPT, Notion AI, Perplexity, Grammarly, Jasper, Copy.ai — or null if none match
- If multiple target tools are discussed, pick the PRIMARY one being reviewed/compared
- Keep use_cases and pain_points concise (max 10 Chinese characters each item)
- If the text does not discuss one of the target tools, return tool_name as null
- confidence: 0.9+ means the tool and sentiment are very clear"""

EXTRACTION_USER_TEMPLATE = """分析以下社群討論，提取關於 AI 工具的結構化資料：

---
{content}
---

Return JSON matching this exact schema:
{{
  "tool_name": "Claude Code" | "Cursor" | "Trae" | "Windsurf" | "Codex" | "GitHub Copilot" | "Replit" | "Aider" | "Cline" | "Bolt" | "Lovable" | "Devin" | "n8n" | "Make" | "Zapier" | "Dify" | "Midjourney" | "ComfyUI" | "Adobe Firefly" | "Ideogram" | "Leonardo AI" | "Seedance" | "Kling" | "Runway" | "Sora" | "Pika" | "Veo" | "Hailuo" | "ElevenLabs" | "Suno" | "Udio" | "ChatGPT" | "Notion AI" | "Perplexity" | "Grammarly" | "Jasper" | "Copy.ai" | null,
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
    # n8n
    "n8n.io": "n8n",
    "n8n workflow": "n8n",
    "n8n automation": "n8n",
    # Make
    "make.com": "Make",
    "integromat": "Make",
    "make automation": "Make",
    # Zapier
    "zapier automation": "Zapier",
    "zapier workflow": "Zapier",
    # Dify
    "dify.ai": "Dify",
    "dify llm": "Dify",
    # ChatGPT
    "gpt-4o": "ChatGPT",
    "gpt-4": "ChatGPT",
    "gpt4": "ChatGPT",
    "chatgpt-4": "ChatGPT",
    "openai chat": "ChatGPT",
    # Notion AI
    "notionai": "Notion AI",
    "notion ai assistant": "Notion AI",
    # Perplexity
    "perplexity ai": "Perplexity",
    # Midjourney
    "mid journey": "Midjourney",
    "midjourney ai": "Midjourney",
    # ComfyUI
    "comfy ui": "ComfyUI",
    "comfyui workflow": "ComfyUI",
    # Adobe Firefly
    "firefly": "Adobe Firefly",
    "adobe firefly ai": "Adobe Firefly",
    # Ideogram
    "ideogram ai": "Ideogram",
    # Leonardo AI
    "leonardo": "Leonardo AI",
    "leonardoai": "Leonardo AI",
    "leonardo.ai": "Leonardo AI",
    # Kling / 可靈
    "kling ai": "Kling",
    "可靈": "Kling",
    "keling": "Kling",
    "kling video": "Kling",
    # Jasper
    "jasper ai": "Jasper",
    "jasper.ai": "Jasper",
    # Copy.ai
    "copy ai": "Copy.ai",
    "copyai": "Copy.ai",
    # GitHub Copilot
    "github copilot": "GitHub Copilot",
    "gh copilot": "GitHub Copilot",
    "copilot": "GitHub Copilot",
    "copilot chat": "GitHub Copilot",
    # Replit
    "replit agent": "Replit",
    "replit ai": "Replit",
    "replit ghostwriter": "Replit",
    # Aider
    "aider chat": "Aider",
    "aider ai": "Aider",
    # Cline
    "cline bot": "Cline",
    "claude dev": "Cline",
    "roo cline": "Cline",
    # Bolt
    "bolt.new": "Bolt",
    "bolt new": "Bolt",
    # Lovable
    "lovable.dev": "Lovable",
    "lovable ai": "Lovable",
    "gpt engineer": "Lovable",
    # Devin
    "devin ai": "Devin",
    "cognition devin": "Devin",
    # Runway
    "runway ml": "Runway",
    "runwayml": "Runway",
    "runway gen-3": "Runway",
    "runway gen-4": "Runway",
    "gen-3": "Runway",
    # Sora
    "openai sora": "Sora",
    "sora 2": "Sora",
    "sora ai": "Sora",
    # Pika
    "pika labs": "Pika",
    "pika art": "Pika",
    "pika ai": "Pika",
    # Veo
    "google veo": "Veo",
    "veo 3": "Veo",
    "veo3": "Veo",
    # Hailuo
    "hailuo ai": "Hailuo",
    "minimax hailuo": "Hailuo",
    "海螺": "Hailuo",
    # ElevenLabs
    "eleven labs": "ElevenLabs",
    "11labs": "ElevenLabs",
    "elevenlabs ai": "ElevenLabs",
    # Suno
    "suno ai": "Suno",
    "suno.ai": "Suno",
    # Udio
    "udio ai": "Udio",
    "udio.com": "Udio",
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

TOOL DISAMBIGUATION:
- "Make" refers ONLY to the automation platform Make.com (formerly Integromat). Do NOT extract tool_name "Make" just because the English word "make" appears in the text. Only set tool_name "Make" when the text clearly discusses Make.com as an automation tool — e.g. mentions "make.com", "integromat", "Make scenario", "Make workflow", or explicitly names it as a no-code automation tool alongside Zapier/n8n.

Rules:
- tool_name must be one of: Claude Code, Cursor, Trae, Windsurf, Codex, GitHub Copilot, Replit, Aider, Cline, Bolt, Lovable, Devin, n8n, Make, Zapier, Dify, Midjourney, ComfyUI, Adobe Firefly, Ideogram, Leonardo AI, Seedance, Kling, Runway, Sora, Pika, Veo, Hailuo, ElevenLabs, Suno, Udio, ChatGPT, Notion AI, Perplexity, Grammarly, Jasper, Copy.ai — or null
- confidence 0.9+ = very clear signal that this is a genuine review with clear sentiment

Return exactly: {"results": [ <N extraction objects in order> ]}"""


_MAKE_CONTEXT_SIGNALS = {
    'make.com', 'integromat', 'make scenario', 'make workflow',
    'make automation', 'make module', 'make template', 'make.com/',
    'make zapier', 'zapier make', 'n8n make', 'make n8n',
}


def normalize_tool_name(name: str | None) -> str | None:
    if not name:
        return None
    normalized = name.strip()
    resolved = TOOL_NAME_ALIASES.get(normalized.lower(), normalized)
    # 只回傳白名單內的工具名稱
    return resolved if resolved in TARGET_TOOLS else None


def validate_make_context(tool_name: str | None, content: str) -> bool:
    """Return False if tool_name is Make but content lacks Make.com context signals."""
    if tool_name != 'Make':
        return True
    low = content.lower()
    return any(signal in low for signal in _MAKE_CONTEXT_SIGNALS)
