---
name: ssot-drift-clean-code-audit
description: >-
  Use when reviewing or refactoring a branch for SSOT convergence, clean code, drift
  detection, overengineering, technical debt, dead code, unused code, stale comments,
  or production-grade maintainability. Triggers on "SSOT audit", "drift check", "clean
  code review", "technical debt scan", "dead code removal", or when ultrareview-pr-audit
  Phase 2 static verification is required.
version: "2.1.0"
updated: "2026-05-11"
license: MIT
compatibility: >-
  Requires Node.js 24+, pnpm, Git. Optional: knip, ts-prune, depcheck for dead code
  analysis. GitHub CLI for PR integration.
metadata:
  category: code-quality
  complexity: standard
  estimated-duration: 10-20min
  blocking-skill: true
---

# SSOT Drift Clean Code Audit

## Overview

Audit from behavior and ownership first: identify the single source of truth, detect duplicate decision paths, remove stale comments/dead code, and verify with scripts/tests before claiming production readiness.

## When to Use This Skill

| Trigger | Example |
|---------|---------|
| SSOT convergence PR | Major refactoring involving state/config |
| Technical debt review | Scheduled cleanup sprint |
| UltraReview Phase 2 | Static verification gate |
| Pre-merge audit | Final check before merging to main |
| Drift detection | Multiple implementations of same logic |

---

## SSOT Architecture Reference (RateWise v2.22+)

The Rate Provider model establishes these SSOT layers:

| Layer | SSOT File | Responsibility |
|-------|-----------|----------------|
| Type Definitions | `rateProviderTypes.ts` | `RateSourceKind`, `RateProviderId`, `ProviderSelectionMode`, `RateProviderRef`, `RateProviderPreference`, `ResolvedRateProvider` |
| Provider Config | `rateProviders.ts` | Provider metadata, `getAllRateProviders()`, `getProvidersBySourceKind()`, `getDefaultProviderRef()` |
| Ranking Logic | `rateProviderRanking.ts` | `rankProviderQuotes()`, `resolveProviderPreference()` |
| State Persistence | `converterStore.ts` | Zustand store with `persist` middleware, `__migrateFromLegacy()`, `__validateAndSanitize()` |
| UI Integration | `useCurrencyConverter.ts` | React hook consuming store, resolving effective rate source |
| UI Components | `RateSelector.tsx`, `RateProviderMenu.tsx` | User-facing rate type and provider selection |

**Critical Invariant**: UI components MUST NOT re-implement provider selection logic. They consume resolved state from hooks.

---

## Audit Workflow

### Step 1: Establish Branch Scope

```bash
git status --short --branch
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
```

### Step 2: Identify SSOT Candidates

| Category | Files | Purpose |
|----------|-------|---------|
| Config | `package.json`, `app.config.mjs`, `rateProviders.ts` | Static configuration |
| Types | `rateProviderTypes.ts` | Canonical type definitions |
| State | `converterStore.ts` | Zustand store with persist schema |
| Logic | `rateProviderRanking.ts` | Ranking algorithms |
| Public API | `openapi.json`, `api/latest.json` | External contracts |
| UI | Components | ONLY consume resolved state |

### Step 3: Search for Drift Patterns

```bash
# Technical debt markers
rg -n "TODO|FIXME|HACK|deprecated|legacy|fallback|hardcoded|mock|temporary" \
  apps/ratewise/src --glob "*.ts" --glob "*.tsx"

# Rate provider model terms (detect duplicate implementations)
rg -n "RateSourceKind|RateProviderId|ProviderSelectionMode|providerPreference|sourceKind" \
  apps/ratewise/src --glob "*.ts" --glob "*.tsx"

# Legacy terms that should be migrated
rg -n "rateMode|selectedRateSource" \
  apps/ratewise/src --glob "*.ts" --glob "*.tsx"
```

### Step 4: Run Deterministic Checks

```bash
node scripts/verify-ssot-sync.mjs
pnpm --filter @app/ratewise typecheck
pnpm format
git diff --check
```

### Step 5: Dead Code Analysis

```bash
pnpm exec knip
pnpm exec ts-prune
pnpm depcheck
```

**Caution**: Treat output as evidence, not automatic delete commands. Verify:

- Generated files
- Dynamic imports
- Test utilities
- Framework entry points

---

## SSOT Convergence Rules

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| One decision owner per rule | Provider selection in `rateProviderRanking.ts` only |
| Public output derives from runtime | OpenAPI uses same metadata as runtime |
| History stores replay parameters | All fields needed to reproduce result |
| Workflows use fresh data | Fetch current rates, not stale files |
| Tests protect invariants | Test behavior, not implementation |

### Rate Provider Model Contracts (v2.22+)

```typescript
// Type hierarchy (rateProviderTypes.ts is SSOT)
type RateSourceKind = 'bank' | 'exchange-shop';
type RateProviderId = 'bot' | 'moneybox';
type ProviderSelectionMode = 'auto' | 'manual';

// Preference storage (converterStore.ts)
interface RateProviderPreference {
  sourceKind: RateSourceKind;
  mode: ProviderSelectionMode;
  providerId?: RateProviderId;  // Only when mode === 'manual'
}

// Resolved at runtime (rateProviderRanking.ts)
interface ResolvedRateProvider {
  providerId: RateProviderId;
  sourceKind: RateSourceKind;
  reason: 'auto_best' | 'manual_selected' | 'fallback';
}
```

### Zustand Store Contracts

| Contract | Value |
|----------|-------|
| Persist key | `ratewise-converter-store-v3` |
| Migration | `__migrateFromLegacy()` handles v1/v2 |
| Validation | `__validateAndSanitize()` on hydration |
| Selectors | Atomic (`s => s.amount`), not full store |

### Component Hierarchy Contracts

```
UI Layer (consumes resolved state)
├── RateSelector.tsx → displays current source kind
└── RateProviderMenu.tsx → displays provider options

Hook Layer (resolves state)
└── useCurrencyConverter.ts → resolves effectiveRateSource

Store Layer (persists preferences)
└── converterStore.ts → Zustand with persist

Logic Layer (pure functions)
└── rateProviderRanking.ts → ranking algorithms

Type Layer (definitions only)
└── rateProviderTypes.ts → all type definitions
```

---

## Clean Code Rules

### Remove

- Stale explanatory comments (old phases, task numbers)
- Compatibility wrappers without active callers
- Parallel state that "fixes" drift

### Keep

- Comments explaining non-obvious invariants
- External constraint documentation
- Migration code with active legacy data

### Prefer

- Small pure helpers for cross-component rules
- Store actions over direct state manipulation
- Existing metadata APIs over new abstractions

### Avoid

- Speculative abstractions for future providers
- Adding parallel state to fix drift
- Implementation-specific tests

---

## Review Findings Format

```text
P1 path:line - Issue title
Impact: user-visible or maintenance consequence.
Evidence: command/code path proving the drift.
Fix: smallest safe convergence path.
```

### Severity Levels

| Level | Criteria | Examples |
|-------|----------|----------|
| P0 | Blocking | Crash, data corruption, security, broken deploy |
| P1 | High | Wrong exchange result, stale API, CI false pass |
| P2 | Medium | Maintainability drift, missing guardrail |
| P3 | Low | Cleanup only, cosmetic |

---

## Fix Workflow

For each accepted finding:

1. Add or update focused test/guardrail
2. Confirm it fails for current drift
3. Apply smallest code change
4. Run targeted tests + SSOT/type/format checks
5. Commit separately (if repo requires traceability)

**Rule**: Do not batch unrelated cleanup with behavior fixes.

---

## Completion Gate

Run before claiming convergence:

```bash
git status --short --branch
node scripts/verify-ssot-sync.mjs
pnpm --filter @app/ratewise typecheck
pnpm format
git diff --check
```

If PR review is active:

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
gh pr checks <PR_NUMBER>
```

**Report**: State any residual risk explicitly, especially dynamic entry points that unused-code tools cannot prove safe.

---

## Integration with UltraReview

| Phase | Behavior |
|-------|----------|
| Phase 2 | This skill runs during Static Verification |
| Blocking | SSOT drift = blocking issue |
| Report | Technical debt findings feed into certification |
| Handoff | Must pass before browser testing proceeds |

---

## Edge Cases

### Generated Files

- Verify `api/latest.json`, `openapi.json` are in `.prettierignore`
- Do not flag format drift on generated files

### Dynamic Imports

- `knip` may report false positives on lazy imports
- Verify with runtime before removing

### Migration Code

- Keep `__migrateFromLegacy()` until telemetry shows 0 legacy users
- Document migration status in code comments

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-11 | 2.1.0 | Major rewrite: YAML frontmatter compliance, structured tables, severity levels, edge cases, UltraReview integration |
| 2026-05-11 | 2.0.0 | Added Rate Provider model contracts, Zustand store contracts, component hierarchy |
| 2026-03-XX | 1.0.0 | Initial version |
