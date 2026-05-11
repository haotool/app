---
name: ultrareview-pr-audit
description: >-
  Use when performing comprehensive PR review with browser testing, SSOT validation,
  and production readiness certification. Triggers on "ultrareview", "super review",
  "full PR audit", "complete PR verification", "production readiness check", or when
  user requests comprehensive PR validation with automated testing and multi-source
  best practices verification.
version: "2.0.0"
updated: "2026-05-11"
license: MIT
compatibility: >-
  Requires GitHub CLI (gh) authenticated, Node.js 24+, pnpm, browser automation
  MCP (cursor-ide-browser or playwright). Network access required for best practices
  verification.
metadata:
  category: code-review
  complexity: enterprise
  estimated-duration: 10-30min
  output-format: markdown-certification-report
---

# UltraReview PR Audit

## Overview

Enterprise-grade PR audit protocol combining automated verification, browser-based functional testing, SSOT drift detection, and production readiness certification. Produces a structured certification report suitable for audit trails and compliance documentation.

## When to Use This Skill

| Trigger | Example |
|---------|---------|
| Explicit request | "ultrareview PR #378", "super review this branch" |
| Architectural changes | New modules, state management, API contracts |
| Critical path changes | PWA, SEO, rate calculation, persistence, security |
| Release candidate | Pre-production deployment verification |
| Major refactoring | SSOT convergence, schema migrations |

## Required Inputs

| Input | Source | Fallback |
|-------|--------|----------|
| PR Number | User provided or current branch | `gh pr view --json number` |
| Base Branch | PR metadata | `main` |
| Test Scope | PR changed files | Full app test suite |

---

## Phase 1: Context Acquisition

**Objective**: Gather all PR metadata and identify blockers before proceeding.

Execute in parallel:

```bash
# PR metadata with full context
gh pr view <PR_NUMBER> --json number,title,headRefName,baseRefName,state,mergeStateStatus,statusCheckRollup,files,additions,deletions,changedFiles,body

# Full diff for code review
gh pr diff <PR_NUMBER>

# CI/CD status
gh pr checks <PR_NUMBER>

# Branch diff statistics
git diff --stat origin/main...HEAD
```

**Gate Check**: If `matchedCount > 0` in Codex audit, invoke `codex-review-convergence` skill first.

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
```

**Exit Criteria**: All commands succeed. Unresolved threads = 0.

---

## Phase 2: Static Verification

**Objective**: Validate code quality without runtime execution.

Execute sequentially (each must pass before next):

| Step | Command | Pass Criteria |
|------|---------|---------------|
| 1. SSOT Sync | `node scripts/verify-ssot-sync.mjs` | Exit 0 |
| 2. TypeScript | `pnpm --filter @app/ratewise typecheck` | No errors |
| 3. Format | `pnpm format` | No changes needed |
| 4. Whitespace | `git diff --check` | No errors |

**Technical Debt Scan** (informational):

```bash
rg -n "TODO|FIXME|HACK|deprecated|legacy|fallback|hardcoded" \
  apps/ratewise/src --glob "*.ts" --glob "*.tsx" | head -100
```

**Failure Handling**:

| Failure Type | Action |
|--------------|--------|
| SSOT sync | Fix before proceeding |
| TypeScript errors | Fix before proceeding |
| Format errors | Run `pnpm format:fix`, verify, continue |
| Technical debt | Categorize as intentional vs. unintentional |

---

## Phase 3: Test Execution

**Objective**: Verify all automated tests pass.

```bash
pnpm --filter @app/ratewise test
```

**Expected Output**:

```
Test Files  N passed | M skipped (total)
Tests       X passed | Y skipped (total)
```

**Pass Criteria**:

- All tests pass (skipped tests must be documented)
- No unhandled promise rejections
- No `document is not defined` errors (jsdom misconfiguration)

---

## Phase 4: Development Server & Browser Testing

### 4.1 Server Initialization

```bash
# Check if port is available
lsof -nP -iTCP:3001 -sTCP:LISTEN 2>/dev/null

# If occupied, reuse existing server OR:
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start dev server (background)
pnpm dev  # block_until_ms: 0
```

**Wait Pattern**: `Local:.*http` or `ready in`

### 4.2 Browser Functional Tests

Use browser automation MCP (playwright or cursor-ide-browser):

```yaml
test_matrix:
  homepage:
    url: "http://localhost:3001/"
    assertions:
      - page_loads: true
      - title_contains: "HaoRate"
      - currency_selector_visible: true
      - no_console_errors: true

  currency_conversion:
    actions:
      - select_currency: { from: "TWD", to: "USD" }
      - input_amount: "1000"
    assertions:
      - result_displayed: true
      - result_format_valid: true

  rate_source_toggle:
    precondition: "KRW currency selected"
    actions:
      - click: "exchange-shop button"
    assertions:
      - rate_value_changes: true
      - badge_shows_source: true

  multi_currency_mode:
    url: "http://localhost:3001/multi"
    assertions:
      - currency_list_count: ">= 15"
      - all_rates_numeric: true

  conversion_history:
    actions:
      - perform_conversion: true
      - click: "add to history"
      - navigate: "/favorites"
    assertions:
      - history_entry_exists: true
      - provider_info_recorded: true
```

### 4.3 Evidence Collection

Capture screenshots at:

1. Homepage with default conversion
2. After rate source toggle (if applicable)
3. Multi-currency mode
4. Conversion history page

---

## Phase 5: Best Practices Verification

**Objective**: Validate implementation against authoritative sources.

| Technology | Verification Focus | Min Sources |
|------------|-------------------|-------------|
| Zustand | Store design, persistence, actions | 2 |
| React 19 | Hooks usage, concurrent features, memoization | 2 |
| TypeScript | Type safety, interface design | 2 |
| PWA/Workbox | Service worker, caching strategies | 2 |
| Vite | Build optimization, code splitting | 1 |
| Vitest | Testing patterns, async handling | 1 |
| Framer Motion | Animation performance | 1 |
| Tailwind | Responsive design, utility patterns | 1 |
| WCAG 2.2 | Accessibility compliance | 1 |
| OpenAPI | API specification correctness | 1 |

**Verification Method**:

1. Use Context7 MCP to fetch current documentation
2. Compare PR implementation against documented patterns
3. Flag any anti-patterns or deprecated approaches
4. Document compliance level per technology

---

## Phase 6: Production Build Verification

```bash
pnpm build:ratewise
```

**Pass Criteria**:

- Build completes without errors
- `dist/` output generated
- No unexpected warnings
- Bundle size within acceptable range

---

## Phase 7: Certification Report

Generate structured report using this template:

```markdown
## PR #<NUMBER> UltraReview Certification Report

**Generated**: <TIMESTAMP>
**Version**: ultrareview-pr-audit v2.0.0
**Reviewer**: AI Agent (Claude Code)

### Executive Summary

| Metric | Value |
|--------|-------|
| PR Title | <TITLE> |
| Branch | <HEAD> → <BASE> |
| Changes | +<ADDITIONS> / -<DELETIONS> lines |
| Files | <COUNT> files |
| Status | APPROVED / NEEDS_WORK / BLOCKED |

### Checkpoint Matrix

| Phase | Checkpoint | Status | Evidence |
|-------|------------|--------|----------|
| 1 | CI Checks | ✅/❌ | [Link] |
| 1 | Review Threads | ✅/❌ | matchedCount = N |
| 2 | SSOT Sync | ✅/❌ | verify-ssot-sync output |
| 2 | TypeScript | ✅/❌ | typecheck output |
| 2 | Format | ✅/❌ | prettier output |
| 3 | Unit Tests | ✅/❌ | N files / M tests |
| 4 | Browser Tests | ✅/❌ | Screenshot paths |
| 4 | Console Errors | ✅/❌ | 0 errors |
| 5 | Best Practices | ✅/❌ | N/M sources verified |
| 6 | Production Build | ✅/❌ | Build output |

### Functional Verification

| Feature | Test Result | Notes |
|---------|-------------|-------|
| <Feature 1> | ✅/❌ | <Details> |
| <Feature 2> | ✅/❌ | <Details> |

### Technical Debt Assessment

| Category | Count | Evaluation |
|----------|-------|------------|
| TODO/FIXME | N | Intentional / Needs action |
| deprecated | N | Migration planned / Legacy compat |
| Phase gates | N | Documented / Undocumented |

### Residual Risks

- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

### Recommendations

- [Recommendation 1]
- [Recommendation 2]

### Conclusion

**Status**: APPROVED / NEEDS_WORK / BLOCKED

**Blocking Issues**: [List if any]

**Sign-off**: All Phase 1-6 checkpoints passed.
```

---

## Completion Gate

All conditions MUST be met:

- [ ] Phase 1: Context acquired, unresolved threads = 0
- [ ] Phase 2: All static checks pass
- [ ] Phase 3: All tests pass
- [ ] Phase 4: Browser tests pass, console errors = 0
- [ ] Phase 5: Best practices verification complete
- [ ] Phase 6: Production build succeeds
- [ ] Phase 7: Certification report generated

---

## Skill Integration Matrix

| Condition | Invoke Skill | Priority |
|-----------|--------------|----------|
| Unresolved Codex threads | `codex-review-convergence` | Blocking |
| SSOT drift detected | `ssot-drift-clean-code-audit` | Blocking |
| Security concerns | `security-review` | Blocking |
| PWA issues | `pwa-development` | Warning |
| Test failures | `vitest` or `tdd` | Blocking |
| TypeScript errors | `typescript` | Blocking |
| UI/UX concerns | `ui-ux-pro-max` | Advisory |

---

## Automation Contract

This skill establishes the following contracts for CI/CD integration:

```yaml
ultrareview_contract:
  version: "2.0.0"
  
  required_checks:
    blocking:
      - ci_all_green: true
      - tests_pass: true
      - typecheck_pass: true
      - ssot_sync: true
      - codex_threads_resolved: true
      - browser_tests_pass: true
      - console_errors_zero: true
      - production_build_success: true
    
    warning:
      - format_pass: true
      - technical_debt_acceptable: true
    
    informational:
      - best_practices_verified: 10  # minimum sources
  
  evidence_requirements:
    screenshots:
      - homepage
      - feature_under_test
      - multi_mode  # if applicable
    
    command_outputs:
      - test_results
      - typecheck_output
      - ssot_verification
      - build_output
    
    source_citations: 10  # minimum authoritative sources
  
  report_format: "markdown"
  report_sections:
    - executive_summary
    - checkpoint_matrix
    - functional_verification
    - technical_debt
    - residual_risks
    - recommendations
    - conclusion
  
  failure_escalation:
    blocking_failure: "HALT - fix before proceeding"
    warning_failure: "CONTINUE - document in report"
    informational_gap: "CONTINUE - note for improvement"
```

---

## Rate Provider Model Review Checklist (v2.22+)

When reviewing PRs involving Rate Provider changes:

| Concern Type | Validation Method |
|--------------|-------------------|
| Type drift | Check `rateProviderTypes.ts` is SSOT |
| Provider logic duplication | Verify ranking only in `rateProviderRanking.ts` |
| Store schema | Confirm `converterStore.ts` persist schema matches types |
| UI re-implementation | Ensure components only consume resolved state |
| Migration correctness | Test `__migrateFromLegacy()` with legacy fixtures |
| Phase gate | Verify `shouldEnableBankProviderChoice()` behavior |
| History schema | Check `schemaVersion` and provider fields |

---

## Edge Cases

### Large PRs (100+ files)

- Prioritize changed files in critical paths
- Sample test coverage rather than exhaustive review
- Document scope limitations in report

### Port Conflicts

- Reuse existing dev server if available
- Document port reuse in evidence

### Flaky Tests

- Retry up to 3 times
- Document flakiness in report
- Do not block on known flaky tests (if documented)

### Network Failures

- Retry best practices verification
- Document partial verification in report

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-11 | 2.0.0 | Major rewrite: YAML frontmatter compliance, phase gates, automation contract, skill integration matrix, edge cases documentation |
| 2026-05-11 | 1.0.0 | Initial version based on PR #378 ultrareview execution |
