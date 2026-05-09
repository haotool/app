---
name: codex-review-convergence
description: Use when a PR has Codex review comments, unresolved review threads, requested changes, PR checks, or the user asks to monitor Codex review feedback and converge the branch to production readiness.
---

# Codex Review Convergence

## Overview

Treat Codex review feedback as a continuous production gate: inspect with scripts, verify each claim against code, fix one behavioral issue per atomic commit, reply with evidence, resolve only after verification, then repeat until no unresolved threads remain and PR checks pass.

## Required Inputs

- Current branch must map to a PR, or the user must provide a PR number.
- GitHub CLI must be authenticated.
- If replying/resolving on GitHub was not explicitly requested, draft the reply locally instead of posting it.

## Primary Loop

1. Resolve PR context:
   ```bash
   gh pr view --json number,url,headRefName,baseRefName
   git status --short --branch
   ```
2. Inspect unresolved Codex threads with the repo script:
   ```bash
   node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
   ```
3. For each actionable thread, verify the claim against the codebase before editing. Use `rg`, targeted file reads, and tests. Do not accept feedback blindly.
4. Fix one coherent issue at a time. Prefer TDD:
   - Add or update a focused failing test.
   - Run the targeted test and confirm RED for the right reason.
   - Implement the smallest production change.
   - Re-run the targeted test and relevant type/format checks.
5. Commit atomically when the fix is verified. In this repo, update `docs/dev/002_development_reward_penalty_log.md` before every commit.
6. Reply to the thread with commit SHA and verification evidence, then resolve it:
   ```bash
   gh api graphql -f query='mutation($threadId:ID!,$body:String!) { addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$threadId,body:$body}) { comment { id url } } }' -f threadId='<THREAD_ID>' -f body='<EVIDENCE>'
   gh api graphql -f query='mutation($threadId:ID!) { resolveReviewThread(input:{threadId:$threadId}) { thread { id isResolved } } }' -f threadId='<THREAD_ID>'
   ```
7. Push and wait for checks:
   ```bash
   git push
   gh pr checks <PR_NUMBER> --watch --interval 15
   ```
8. Re-run the audit script. Repeat until `matchedCount: 0` and all required checks pass.

## Review Evaluation Rules

- Valid feedback: bug, data drift, source mismatch, stale API, missing history field, incorrect CI behavior, or a regression risk backed by code.
- Needs pushback: suggestion contradicts product rules, breaks compatibility, adds unused architecture, or is unsupported by the code path.
- Needs clarification: comment is ambiguous enough that multiple implementations could be correct.
- Never resolve a thread just because the diff changed. Resolve only after the concern is addressed or a reasoned reply is posted.

## Atomic Fix Standard

Each commit should map to one review concern or one tightly related concern cluster.

Commit contents should include:
- The production fix.
- A regression test or guardrail script/test when feasible.
- A changeset if user-visible behavior changes.
- The repo-required 002 log update when committing in this repository.

Avoid:
- Combining unrelated review fixes.
- Refactoring while fixing unless the review concern requires it.
- Large rewrites to satisfy a small correctness issue.
- Replying with claims not backed by freshly run commands.

## Completion Gate

Before reporting completion, run:

```bash
git status --short --branch
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
gh pr checks <PR_NUMBER>
```

Completion requires:
- Working tree clean or only intentional uncommitted files explicitly reported.
- Codex audit `matchedCount` is `0`.
- Required PR checks are pass or explicitly skipped by workflow policy.
- Local verification commands for the last fix are known and reported.

