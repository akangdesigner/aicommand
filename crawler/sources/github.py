"""
GitHub crawler via GraphQL API.
Fetches Discussions (not Issues) from AI tool repositories — discussions
contain genuine user opinions, whereas Issues are bug reports.
Rate limit: 5,000 points/hour (authenticated).
"""
import hashlib
import os
from dataclasses import dataclass, field
from typing import Generator

import httpx

from crawler.filter import is_genuine_review

GITHUB_GRAPHQL = "https://api.github.com/graphql"

TARGET_REPOS = [
    # 程式開發
    ("anthropics",      "claude-code",  "Claude Code"),
    ("getcursor",       "cursor",       "Cursor"),
    ("Exafunction",     "codeium",      "Windsurf"),
    ("bytedance",       "trae-agent",   "Trae"),
    ("openai",          "codex",        "Codex"),
    ("n8n-io",          "n8n",          "n8n"),
    ("langgenius",      "dify",         "Dify"),
    ("Aider-AI",        "aider",        "Aider"),
    ("cline",           "cline",        "Cline"),
    ("stackblitz",      "bolt.new",     "Bolt"),
    # 圖像生成（有公開 Discussions 的 repo）
    ("comfyanonymous",  "ComfyUI",      "ComfyUI"),
    # 寫作
    ("steven-tey",      "novel",        "Notion AI"),  # 最接近 Notion AI 的開源討論
]

# Discussions: order by UPDATED_AT (COMMENTS is not a valid DiscussionOrderField)
DISCUSSIONS_QUERY = """
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    discussions(
      first: 30
      after: $cursor
      orderBy: {field: UPDATED_AT, direction: DESC}
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        body
        createdAt
        upvoteCount
        category { name }
        comments(first: 5) {
          nodes {
            body
            createdAt
            author { login }
            upvoteCount
          }
        }
        author { login }
      }
    }
  }
}
"""

# Issues: for repos that use Issues instead of Discussions (n8n, cursor, claude-code)
ISSUES_QUERY = """
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    issues(
      first: 30
      after: $cursor
      states: [OPEN, CLOSED]
      orderBy: {field: COMMENTS, direction: DESC}
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        body
        createdAt
        comments(first: 3) {
          nodes {
            body
            createdAt
            author { login }
          }
        }
        author { login }
        url
      }
    }
  }
}
"""

# Skip Q&A category — those are still help-seeking
SKIP_CATEGORIES = {"q&a", "help", "support", "ideas"}


@dataclass
class RawMention:
    source: str = "github"
    source_id: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)
    content_hash: str = ""


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _graphql(query: str, variables: dict) -> dict:
    token = os.environ["GITHUB_TOKEN"]
    with httpx.Client(timeout=30) as client:
        resp = client.post(
            GITHUB_GRAPHQL,
            json={"query": query, "variables": variables},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        return resp.json()


def crawl_repo_discussions(owner: str, repo: str) -> Generator[RawMention, None, None]:
    cursor = None
    pages = 0

    while pages < 2:
        try:
            data = _graphql(DISCUSSIONS_QUERY, {"owner": owner, "repo": repo, "cursor": cursor})
        except Exception as e:
            print(f"  GitHub GraphQL error {owner}/{repo}: {e}")
            break

        repo_data = (data.get("data") or {}).get("repository") or {}
        disc_data = repo_data.get("discussions") or {}
        nodes = disc_data.get("nodes") or []
        if not nodes:
            break

        for disc in nodes:
            if not disc or not isinstance(disc, dict):
                continue

            category = (disc.get("category") or {}).get("name", "").lower()
            if category in SKIP_CATEGORIES:
                continue

            body = disc.get("body") or ""
            content = f"[{disc['title']}]\n\n{body}".strip()

            if not is_genuine_review(content):
                continue

            yield RawMention(
                source_id=f"github_disc_{owner}_{repo}_{disc['number']}",
                content=content,
                metadata={
                    "type": "discussion",
                    "repo": f"{owner}/{repo}",
                    "number": disc["number"],
                    "title": disc["title"],
                    "category": category,
                    "author": (disc.get("author") or {}).get("login", ""),
                    "upvotes": disc.get("upvoteCount", 0),
                    "created_at": disc.get("createdAt", ""),
                    "url": f"https://github.com/{owner}/{repo}/discussions/{disc['number']}",
                },
                content_hash=_hash(content),
            )

            # Top comments as separate mentions
            for comment in (disc.get("comments") or {}).get("nodes", []):
                if not comment:
                    continue
                cbody = comment.get("body") or ""
                comment_content = f"[Re: {disc['title']}]\n\n{cbody}".strip()
                if not is_genuine_review(comment_content):
                    continue
                yield RawMention(
                    source_id=f"github_disc_comment_{owner}_{repo}_{disc['number']}_{_hash(cbody)[:8]}",
                    content=comment_content,
                    metadata={
                        "type": "discussion_comment",
                        "repo": f"{owner}/{repo}",
                        "discussion_number": disc["number"],
                        "discussion_title": disc["title"],
                        "author": (comment.get("author") or {}).get("login", ""),
                        "upvotes": comment.get("upvoteCount", 0),
                        "created_at": comment.get("createdAt", ""),
                        "url": f"https://github.com/{owner}/{repo}/discussions/{disc['number']}",
                    },
                    content_hash=_hash(comment_content),
                )

        page_info = disc_data.get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        pages += 1


def crawl_repo_issues(owner: str, repo: str) -> Generator[RawMention, None, None]:
    """Fetch highly-commented Issues — user feedback & experience reports."""
    cursor = None
    pages = 0

    while pages < 2:
        try:
            data = _graphql(ISSUES_QUERY, {"owner": owner, "repo": repo, "cursor": cursor})
        except Exception as e:
            print(f"  GitHub Issues error {owner}/{repo}: {e}")
            break

        repo_data = (data.get("data") or {}).get("repository") or {}
        issues_data = repo_data.get("issues") or {}
        nodes = issues_data.get("nodes") or []
        if not nodes:
            break

        for issue in nodes:
            if not issue or not isinstance(issue, dict):
                continue

            body = issue.get("body") or ""
            content = f"[{issue['title']}]\n\n{body}".strip()

            if not is_genuine_review(content):
                continue

            yield RawMention(
                source_id=f"github_issue_{owner}_{repo}_{issue['number']}",
                content=content,
                metadata={
                    "type": "issue",
                    "repo": f"{owner}/{repo}",
                    "number": issue["number"],
                    "title": issue["title"],
                    "author": (issue.get("author") or {}).get("login", ""),
                    "created_at": issue.get("createdAt", ""),
                    "url": issue.get("url", f"https://github.com/{owner}/{repo}/issues/{issue['number']}"),
                },
                content_hash=_hash(content),
            )

            for comment in (issue.get("comments") or {}).get("nodes", []):
                if not comment:
                    continue
                cbody = comment.get("body") or ""
                comment_content = f"[Re: {issue['title']}]\n\n{cbody}".strip()
                if not is_genuine_review(comment_content):
                    continue
                yield RawMention(
                    source_id=f"github_issue_comment_{owner}_{repo}_{issue['number']}_{_hash(cbody)[:8]}",
                    content=comment_content,
                    metadata={
                        "type": "issue_comment",
                        "repo": f"{owner}/{repo}",
                        "issue_number": issue["number"],
                        "issue_title": issue["title"],
                        "author": (comment.get("author") or {}).get("login", ""),
                        "created_at": comment.get("createdAt", ""),
                        "url": issue.get("url", ""),
                    },
                    content_hash=_hash(comment_content),
                )

        page_info = issues_data.get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        pages += 1


def _has_discussions(owner: str, repo: str) -> bool:
    """Check if a repo has any Discussions."""
    q = """query($o:String!,$r:String!){repository(owner:$o,name:$r){discussions(first:1){nodes{title}}}}"""
    try:
        data = _graphql(q, {"o": owner, "r": repo})
        nodes = (((data.get("data") or {}).get("repository") or {}).get("discussions") or {}).get("nodes", [])
        return len(nodes) > 0
    except Exception:
        return False


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    for owner, repo, _tool_name in TARGET_REPOS:
        if _has_discussions(owner, repo):
            print(f"GitHub Discussions crawling {owner}/{repo}...")
            crawl_fn = crawl_repo_discussions
        else:
            print(f"GitHub Issues crawling {owner}/{repo} (no Discussions)...")
            crawl_fn = crawl_repo_issues

        try:
            for mention in crawl_fn(owner, repo):
                if mention.content_hash not in seen_hashes:
                    seen_hashes.add(mention.content_hash)
                    mentions.append(mention)
        except Exception as e:
            print(f"Error crawling {owner}/{repo}: {e}")

    print(f"GitHub total unique mentions: {len(mentions)}")
    return mentions
