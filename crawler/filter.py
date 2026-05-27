"""
Shared review filter for all crawlers.
Rejects GitHub issues, help requests, bug reports, and tutorial content
before storing to raw_mentions.
"""
import re

# Patterns indicating the content is NOT a genuine review
_NOISE = [
    # GitHub issue format (always noise)
    r"^\[[\w/\-]+ Issue #\d+\]",
    # Explicit help-seeking
    r"(?i)\b(help me|please help|need help|seeking help|anyone help)\b",
    r"(?i)(求救|求助|問一下|有人知道嗎|怎麼辦|幫我|幫幫我)",
    # Installation / setup guides
    r"(?i)^(how (do i|can i|to install|to setup|to configure|to use)\b)",
    r"(?i)\b(step.by.step|tutorial|step \d+[:\.]|getting started guide)\b",
    r"(?i)(安裝教學|安裝步驟|使用教學|教程|怎麼安裝|怎麼設定)",
    # Error / bug reports
    r"(?i)\b(not working|doesn'?t work|won'?t (start|open|run|load|connect)|failed to (install|run|open|connect|start))\b",
    r"(?i)\b(getting (an )?error|error message|stack trace|exception|traceback)\b",
    r"(?i)(出現錯誤|報錯|崩潰|當機|無法執行|無法安裝|安裝失敗)",
]

_NOISE_RE = [re.compile(p) for p in _NOISE]


def is_genuine_review(text: str) -> bool:
    """
    Returns False if the text is likely a help request, bug report,
    tutorial, or GitHub issue rather than a genuine user opinion.
    """
    if len(text) < 80:
        return False
    # Only scan the first 400 characters to judge intent
    head = text[:400]
    for pat in _NOISE_RE:
        if pat.search(head):
            return False
    return True
