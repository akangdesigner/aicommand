"""
GitHub crawler via GraphQL API.
Fetches issues and discussions from AI tool repositories.
Rate limit: 5,000 points/hour (authenticated).
"""
import hashlib
import os
from dataclasses import dataclass, field
from typing import Generator

import httpx

GITHUB_GRAPHQL = "https://api.github.com/graphql"

# Repos to monitor — issues/discussions contain real user pain points
TARGET_REPOS = [
    ("anthropics", "claude-code"),
    ("getcursor", "cursor"),
    ("n8n-io", "n8n"),
    ("langchain-ai", "langchain"),
    ("lobehub", "lobe-chat"),
    ("open-webui", "open-webui"),
    ("langgenius", "dify"),
    ("oobabooga", "text-generation-webui"),
    ("continuedev", "continue"),
    ("cline", "cline"),
]

ISSUES_QUERY = """
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    issues(
      first: 50
      after: $cursor
      orderBy: {field: COMMENTS, direction: DESC}
      states: [OPEN, CLOSED]
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        body
        createdAt
        reactions { totalCount }
        labels(first: 5) { nodes { name } }
        comments(first: 10) {
          nodes {
            body
            author { login }
          }
        }
      }
    }
  }
}
"""

MIN_REACTIONS = 3


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


def crawl_repo_issues(owner: str, repo: str) -> Generator[RawMention, None, None]:
    cursor = None
    pages = 0

    while pages < 3:  # Max 3 pages per repo to stay within rate limits
        data = _graphql(ISSUES_QUERY, {"owner": owner, "repo": repo, "cursor": cursor})
        repo_data = (data.get("data") or {}).get("repository") or {}
        issues_data = repo_data.get("issues") or {}
        if not issues_data or not issues_data.get("nodes"):
            break

        for issue in (issues_data.get("nodes") or []):
            if not issue or not isinstance(issue, dict):
                continue
            reactions = issue.get("reactions", {}).get("totalCount", 0)
            if reactions < MIN_REACTIONS:
                continue

            body = issue.get("body") or ""
            content = f"[{owner}/{repo} Issue #{issue['number']}]\n{issue['title']}\n\n{body}".strip()

            if len(content) < 50:
                continue

            yield RawMention(
                source_id=f"github_issue_{owner}_{repo}_{issue['number']}",
                content=content,
                metadata={
                    "type": "issue",
                    "repo": f"{owner}/{repo}",
                    "number": issue["number"],
                    "title": issue["title"],
                    "reactions": reactions,
                    "labels": [l["name"] for l in issue.get("labels", {}).get("nodes", [])],
                    "created_at": issue.get("createdAt", ""),
                    "url": f"https://github.com/{owner}/{repo}/issues/{issue['number']}",
                },
                content_hash=_hash(content),
            )

            # Include high-reaction comments as separate mentions
            for comment in issue.get("comments", {}).get("nodes", []):
                if not comment:
                    continue
                cbody = comment.get("body") or ""
                if len(cbody) < 80:
                    continue
                comment_content = f"[Re: {issue['title']}]\n\n{cbody}".strip()
                yield RawMention(
                    source_id=f"github_comment_{owner}_{repo}_{issue['number']}_{_hash(cbody)[:8]}",
                    content=comment_content,
                    metadata={
                        "type": "issue_comment",
                        "repo": f"{owner}/{repo}",
                        "issue_number": issue["number"],
                        "issue_title": issue["title"],
                        "author": comment.get("author", {}).get("login", ""),
                        "url": f"https://github.com/{owner}/{repo}/issues/{issue['number']}",
                    },
                    content_hash=_hash(comment_content),
                )

        page_info = issues_data.get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        pages += 1


def run_full_crawl() -> list[RawMention]:
    mentions: list[RawMention] = []
    seen_hashes: set[str] = set()

    for owner, repo in TARGET_REPOS:
        print(f"GitHub crawling {owner}/{repo}...")
        try:
            for mention in crawl_repo_issues(owner, repo):
                if mention.content_hash not in seen_hashes:
                    seen_hashes.add(mention.content_hash)
                    mentions.append(mention)
        except Exception as e:
            print(f"Error crawling {owner}/{repo}: {e}")

    print(f"GitHub total unique mentions: {len(mentions)}")
    return mentions
