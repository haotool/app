---
name: ssot-drift-clean-code-audit
description: Use when reviewing or refactoring a branch for SSOT convergence, clean code, drift, overengineering, technical debt, dead code, unused code, stale comments, or production-grade maintainability.
---

# SSOT Drift Clean Code Audit

## Overview

Audit from behavior and ownership first: identify the single source of truth, detect duplicate decision paths, remove stale comments/dead code, and verify with scripts/tests before claiming production readiness.

## Audit Workflow

1. Establish branch scope:
   ```bash
   git status --short --branch
   git diff --stat origin/main...HEAD
   git diff --name-only origin/main...HEAD
   ```
2. Identify SSOT candidates:
   - Config: `package.json`, app config, provider metadata, generated fixtures.
   - State: store actions/selectors, persisted schema, migrations.
   - Public data/API: generators, OpenAPI, JSON endpoints, workflows.
   - UI behavior: components should consume resolved state, not re-decide provider/rate rules.
3. Search for drift patterns:
   ```bash
   rg -n "TODO|FIXME|HACK|deprecated|legacy|fallback|hardcoded|mock|temporary|Task [0-9]|Phase [0-9]" .
   rg -n "rateMode|rateType|rateSource|providerPreference|providerId|sourceKind" apps/ratewise/src
   ```
4. Run deterministic repo checks where relevant:
   ```bash
   node scripts/verify-ssot-sync.mjs
   pnpm --filter @app/ratewise verify:ssot
   pnpm --filter @app/ratewise typecheck
   pnpm format
   git diff --check
   ```
5. For dead code and unused dependency suspicion, prefer repo tools before manual deletion:
   ```bash
   pnpm exec knip
   pnpm exec ts-prune
   pnpm depcheck
   ```
   Treat these as evidence, not automatic delete commands. Confirm generated files, dynamic imports, tests, and framework entry points before removing code.

## SSOT Convergence Rules

- One decision owner per rule. If provider/rate selection exists in store, hooks, UI, and API generator, choose one canonical layer and make others consume it.
- Public output must derive from the same metadata used by runtime behavior. Avoid duplicating provider IDs, URLs, currency support, or endpoint paths.
- Persisted history must store all user-visible parameters required to replay the same result later.
- Workflow snapshots must use the current fetch result, not a stale latest file, when writing date-keyed history.
- Tests should protect invariants, not implementation details, unless the target is a build/workflow guardrail.

## Clean Code Rules

- Remove stale explanatory comments that only narrate old phases, task numbers, or implementation history.
- Keep comments only when they explain a non-obvious invariant or external constraint.
- Prefer small pure helpers for cross-component rules; avoid speculative abstractions for future providers until there is a phase gate or metadata model.
- Do not add parallel state to “fix” drift. Route changes through existing store actions or metadata APIs.
- Do not keep compatibility wrappers unless a migration or external caller still needs them.

## Review Findings Format

When reviewing, report findings first:

```text
P1 path:line - Issue title
Impact: user-visible or maintenance consequence.
Evidence: command/code path proving the drift.
Fix: smallest safe convergence path.
```

Use severity:
- `P0`: crash, data corruption, security, broken deploy.
- `P1`: wrong exchange result, stale public API/history, CI false pass/fail.
- `P2`: maintainability drift, missing guardrail, overengineering.
- `P3`: cleanup only.

## Fix Workflow

For each accepted finding:
1. Add or update a focused test/guardrail when feasible.
2. Confirm it fails for the current drift.
3. Apply the smallest code change.
4. Run targeted tests plus relevant SSOT/type/format checks.
5. Commit separately if the user requested commits or the repo workflow requires review traceability.

Do not batch unrelated cleanup with behavior fixes.

## Completion Gate

Before claiming convergence:

```bash
git status --short --branch
node scripts/verify-ssot-sync.mjs
pnpm --filter @app/ratewise typecheck
pnpm format
git diff --check
```

If PR review is active, also run:

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
gh pr checks <PR_NUMBER>
```

State any residual risk explicitly, especially dynamic entry points that unused-code tools cannot prove safe.

