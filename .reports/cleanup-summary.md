# Dead Code Cleanup Summary

**Date**: 2026-02-08
**Status**: Analysis Complete - Ready for Phase 1
**Test Status**: ✅ All 1364 tests passing (76 test files)

---

## 📊 Analysis Results

### Files Analyzed

- **Total Unused Files**: 26
- **Unused Exports**: 100+
- **Unused Dependencies**: 9 dev dependencies
- **Duplicate Exports**: 17 components

### Categorization

- 🔴 **DANGER** (Do Not Delete): 10 files
- 🟡 **CAUTION** (Review Needed): 9 files
- 🟢 **SAFE** (Can Delete): 7 files

---

## ✅ Phase 1: Safe Actions (Ready to Execute)

### Action 1: Add Missing Dependencies ✅ APPROVED

**Issue**: Test files reference undeclared dependencies

```bash
pnpm add -D -w vitest xml2js
```

**Impact**: None (fixes missing declarations)
**Risk Level**: ✅ Zero - Adding missing deps only
**Test Required**: ❌ Not needed (improvement only)

### Action 2: Service Worker Test Scripts ⚠️ HOLD

**Files**: 9 test scripts in `apps/ratewise/scripts/test-*-sw*.mjs`

**Status**: 🔶 **ON HOLD**

- Created: 2026-01-11 (< 1 month ago)
- May still be in active development
- Recommend: Keep for now, review in 3 months

**Decision**: ❌ Skip this cleanup for now

---

## 📋 Phase 2-4: Actions Requiring Review

### Unused Dev Dependencies (Medium Risk)

**Candidates for Removal**:

```json
{
  "root": [
    "@changesets/changelog-github",
    "@playwright/test",
    "@vitejs/plugin-react-swc",
    "@vitest/coverage-v8",
    "vite-ssg-sitemap"
  ],
  "ratewise": [
    "lighthouse",
    "workbox-*" (7 packages),
    "zustand"
  ]
}
```

**Required**: Check CI/CD workflows before removal

### Unused Exports (Low-Medium Risk)

**Categories**:

1. Config utilities (`workspace-utils.mjs`)
2. SEO schema exports (JSON-LD)
3. Data exports (puns, surnames)
4. Component duplicate exports

**Required**: Code search + import analysis

### Component Export Standardization (High Risk)

**Affected**: 17 components with both named + default exports

**Required**: Full regression testing

---

## 🎯 Immediate Action Plan

### Step 1: Execute Safe Actions ✅

Only executing the zero-risk action:

```bash
# Add missing test dependencies
pnpm add -D -w vitest xml2js
```

**Validation**:

```bash
pnpm test  # Should still pass (already passing)
pnpm build # Should still work
```

### Step 2: Generate Follow-up Report 📝

Create detailed analysis for Phase 2-4:

- Dependency usage matrix (npm scripts + CI)
- Export usage analysis (grep all imports)
- Risk assessment per file
- Test impact analysis

### Step 3: Team Review 👥

Schedule review of:

- Phase 2: Dependency cleanup strategy
- Phase 3: Export cleanup approach
- Phase 4: Component refactoring plan

---

## 🚫 Actions NOT Taken (and Why)

### ❌ Service Worker Test Scripts

**Reason**: Too recent (< 1 month old), may be in active use
**Recommendation**: Review again in 2026-05 (3 months)

### ❌ Dependency Removal

**Reason**: May be used in CI/CD or npm scripts (not validated yet)
**Recommendation**: Create dependency usage matrix first

### ❌ Export Cleanup

**Reason**: Need comprehensive import analysis to avoid breaking changes
**Recommendation**: Automate with AST analysis tool

### ❌ Component Refactoring

**Reason**: High risk, requires full test coverage verification
**Recommendation**: Plan separately with dedicated testing phase

---

## 📈 Impact Analysis

### Current Status

- ✅ Test Suite: 100% passing (1364/1364 tests)
- ✅ Build: Working correctly
- ✅ Type Check: No errors
- ✅ Lint: Clean

### Post-Cleanup Expected

- ✅ Test Suite: 100% passing (unchanged)
- ✅ Build: Working correctly (unchanged)
- ✅ Type Check: No errors (unchanged)
- ✅ Lint: Clean (unchanged)
- ✅ Dependencies: 2 missing deps now declared

---

## 🔧 Tools Installed

Added for this analysis (can be kept or removed):

```json
{
  "devDependencies": {
    "knip": "^5.83.1",
    "depcheck": "^1.4.7",
    "ts-prune": "^0.10.3"
  }
}
```

**Recommendation**: Keep for future cleanup cycles

---

## 📚 Documentation Generated

1. `.reports/dead-code-analysis.md` - Full analysis report
2. `.reports/cleanup-summary.md` - This summary
3. `.reports/knip-raw.json` - Raw knip output
4. `.reports/depcheck-raw.json` - Raw depcheck output

**Location**: All reports in `.reports/` directory (gitignored)

---

## ⏭️ Next Steps

### Immediate (Today)

1. ✅ Add missing dependencies (vitest, xml2js)
2. ✅ Commit analysis reports to documentation
3. ✅ Update team on findings

### Short-term (This Week)

1. Create dependency usage matrix
2. Analyze CI/CD workflow dependencies
3. Document which deps are actually used

### Medium-term (Next Sprint)

1. Phase 2: Safe dependency removal
2. Create automated export usage tool
3. Plan component standardization

### Long-term (Next Quarter)

1. Establish regular cleanup schedule
2. Add pre-commit hooks for unused exports
3. Automate dead code detection in CI

---

## 🎓 Lessons Learned

### What Worked Well

✅ Multiple tool approach (knip + depcheck + ts-prune)
✅ Risk categorization (DANGER/CAUTION/SAFE)
✅ Test-first validation approach
✅ Detailed documentation

### What Could Be Improved

⚠️ Need better tooling for dynamic imports
⚠️ Should check CI/CD before dependency analysis
⚠️ Need automated import usage analysis
⚠️ Should validate against build scripts

### Recommendations

1. Add dead code detection to CI pipeline
2. Create automated usage analysis tool
3. Document expected false positives
4. Establish cleanup SOP (Standard Operating Procedure)

---

## 📞 Questions for Team Review

1. **Service Worker Scripts**: Keep or archive the 9 test scripts?
2. **Workbox Dependencies**: Are these used by sw.ts or build process?
3. **zustand**: Is this planned for future state management?
4. **Component Exports**: Prefer named or default exports as standard?
5. **Data Files**: Archive unused pun categories or keep for reference?

---

**Report Complete** ✅

**Safe to Execute**: Phase 1, Action 1 only
**Requires Approval**: All Phase 2-4 actions
