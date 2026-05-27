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
    ("anthropics",  "claude-code",  "Claude Code"),
    ("Exafunction", "codeium",      "Windsurf"),
    ("bytedance",   "trae-agent",   "Trae"),
    ("openai",      "codex",        "Codex"),
]

# Fetch repository Discussions — community conversation, not bug tracking
DISCUSSIONS_QUERY = """
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    discussions(
      first: 30
      after: $cursor
      orderBy: {field: COMMENTS, direction: DESC}
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
                        "url": f"https://github.com/{owner}/{repo}/discussions/{disc['number']}",
                    },
                    content_hash=_hash(comment_content),
                )

        page_info = disc_data.get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        pages += 1


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    for owner, repo, _tool_name in TARGET_REPOS:
        print(f"GitHub Discussions crawling {owner}/{repo}...")
        try:
            for mention in crawl_repo_discussions(owner, repo):
                if mention.content_hash not in seen_hashes:
                    seen_hashes.add(mention.content_hash)
                    mentions.append(mention)
        except Exception as e:
            print(f"Error crawling {owner}/{repo}: {e}")

    print(f"GitHub total unique mentions: {len(mentions)}")
    return mentions
