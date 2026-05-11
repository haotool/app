---
name: codex-review-convergence
description: >-
  Use when a PR has Codex review comments, unresolved review threads, requested
  changes, or PR checks requiring attention. Triggers on "codex review", "resolve
  threads", "fix review comments", "converge branch", "address feedback", or when
  ultrareview-pr-audit detects unresolved threads (matchedCount > 0).
version: "2.1.0"
updated: "2026-05-11"
license: MIT
compatibility: >-
  Requires GitHub CLI (gh) authenticated with repo scope. Node.js 24+ for audit
  scripts. Git repository with PR workflow.
metadata:
  category: code-review
  complexity: standard
  estimated-duration: 5-30min
  blocking-skill: true
---

# Codex Review Convergence

## Overview

Treat Codex review feedback as a continuous production gate: inspect with scripts, verify each claim against code, fix one behavioral issue per atomic commit, reply with evidence, resolve only after verification, then repeat until no unresolved threads remain and PR checks pass.

## When to Use This Skill

| Trigger | Example |
|---------|---------|
| Unresolved review threads | `matchedCount > 0` from audit script |
| Codex requested changes | PR shows "Changes requested" status |
| Review comments pending | Comments awaiting response |
| CI checks failing | PR checks not passing |
| UltraReview gate | Phase 1 gate check fails |

## Required Inputs

| Input | Source | Required |
|-------|--------|----------|
| PR Number | Current branch or user provided | Yes |
| GitHub CLI auth | `gh auth status` | Yes |
| Audit script | `scripts/audit-codex-review-threads.mjs` | Yes |

**Constraint**: If replying/resolving on GitHub was not explicitly requested, draft the reply locally instead of posting it.

---

## Primary Loop

### Step 1: Resolve PR Context

```bash
gh pr view --json number,url,headRefName,baseRefName
git status --short --branch
```

### Step 2: Audit Unresolved Threads

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
```

**Output Interpretation**:

| Field | Meaning |
|-------|---------|
| `matchedCount: 0` | All threads resolved, proceed |
| `matchedCount: N` | N threads require attention |
| `threads[]` | Array of thread objects with IDs and content |

### Step 3: Verify Before Acting

For each actionable thread:

1. **Read the claim** - Understand what the reviewer is saying
2. **Verify against code** - Use `rg`, targeted file reads, and tests
3. **Do not accept blindly** - Validate technical accuracy
4. **Categorize the feedback**:

| Category | Action |
|----------|--------|
| Valid bug/issue | Fix with TDD approach |
| Needs pushback | Reply with technical reasoning |
| Needs clarification | Ask for specifics |
| Already addressed | Reply with evidence |

### Step 4: Fix One Issue at a Time (TDD)

```
1. Add or update a focused failing test
2. Run targeted test, confirm RED for the right reason
3. Implement smallest production change
4. Re-run targeted test, confirm GREEN
5. Run relevant type/format checks
```

### Step 5: Commit Atomically

**Repo-specific requirement**: Update `docs/dev/002_development_reward_penalty_log.md` before every commit.

Commit contents should include:

- The production fix
- A regression test or guardrail (when feasible)
- A changeset (if user-visible behavior changes)
- The 002 log update

### Step 6: Reply and Resolve

```bash
# Reply with evidence
gh api graphql -f query='
  mutation($threadId:ID!,$body:String!) {
    addPullRequestReviewThreadReply(input:{
      pullRequestReviewThreadId:$threadId,
      body:$body
    }) { comment { id url } }
  }
' -f threadId='<THREAD_ID>' -f body='<EVIDENCE>'

# Resolve thread
gh api graphql -f query='
  mutation($threadId:ID!) {
    resolveReviewThread(input:{threadId:$threadId}) {
      thread { id isResolved }
    }
  }
' -f threadId='<THREAD_ID>'
```

### Step 7: Push and Verify

```bash
git push
gh pr checks <PR_NUMBER> --watch --interval 15
```

### Step 8: Re-audit and Repeat

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
```

**Loop until**: `matchedCount: 0` AND all required checks pass.

---

## Review Evaluation Rules

### Valid Feedback (Fix Required)

- Bug or regression risk backed by code
- Data drift or source mismatch
- Stale API usage
- Missing required field (e.g., history schema)
- Incorrect CI/workflow behavior

### Needs Pushback (Reply with Reasoning)

- Suggestion contradicts product rules
- Breaks backward compatibility without migration
- Adds unused architecture ("YAGNI")
- Not supported by actual code path

### Needs Clarification (Ask Questions)

- Ambiguous comment with multiple valid interpretations
- Missing context about expected behavior
- Unclear acceptance criteria

### Resolution Rules

| Situation | Action |
|-----------|--------|
| Concern addressed with code fix | Reply with commit SHA, resolve |
| Concern addressed by existing code | Reply with evidence, resolve |
| Reasoned disagreement | Reply with technical reasoning, resolve |
| Still investigating | Reply with status, do NOT resolve |
| Diff changed but concern not addressed | Do NOT resolve |

---

## Atomic Fix Standard

**One commit = One concern** (or one tightly related cluster)

### Include in Each Commit

- Production fix
- Regression test or guardrail script
- Changeset (if user-visible change)
- 002 log update (repo requirement)

### Avoid

- Combining unrelated review fixes
- Refactoring while fixing (unless required)
- Large rewrites for small correctness issues
- Replying with claims not backed by fresh commands

---

## Completion Gate

Run before reporting completion:

```bash
git status --short --branch
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
gh pr checks <PR_NUMBER>
```

**All conditions must be met**:

- [ ] Working tree clean (or intentional uncommitted files reported)
- [ ] Codex audit `matchedCount` = 0
- [ ] Required PR checks pass (or explicitly skipped by policy)
- [ ] Local verification commands documented

---

## Integration with UltraReview

When invoked as part of `ultrareview-pr-audit`:

| Phase | Behavior |
|-------|----------|
| Phase 1 Gate | UltraReview runs audit, if `matchedCount > 0` → this skill activates |
| Blocking | UltraReview pauses until this skill completes |
| Handoff | Only when `matchedCount = 0` does UltraReview proceed to Phase 2 |
| Report | Thread resolution status feeds into certification report |

---

## Rate Provider Model Review Checklist (v2.22+)

When reviewing Codex feedback on Rate Provider changes:

| Concern Type | Validation Method |
|--------------|-------------------|
| Type drift | Check `rateProviderTypes.ts` is SSOT |
| Provider logic duplication | Verify ranking only in `rateProviderRanking.ts` |
| Store schema | Confirm `converterStore.ts` persist schema matches types |
| UI re-implementation | Ensure components only consume resolved state |
| Migration correctness | Test `__migrateFromLegacy()` with legacy fixtures |
| Phase gate integrity | Verify `shouldEnableBankProviderChoice()` behavior |
| History schema | Check `schemaVersion` and provider fields in history entries |

---

## Edge Cases

### Large Thread Count (10+)

- Prioritize by severity (bugs > drift > style)
- Batch related concerns into single commits
- Document prioritization in replies

### Conflicting Feedback

- Identify the authoritative source (product rules > reviewer opinion)
- Reply to both threads with resolution rationale
- Escalate if truly conflicting requirements

### Stale Threads

- Check if code has changed since comment
- Reply with current state if concern is now moot
- Resolve with evidence of resolution

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-11 | 2.1.0 | Major rewrite: YAML frontmatter compliance, structured tables, edge cases, UltraReview integration documentation |
| 2026-05-11 | 2.0.0 | Added UltraReview integration, Rate Provider review checklist |
| 2026-03-XX | 1.0.0 | Initial version |
