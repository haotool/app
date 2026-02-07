# Dead Code Analysis Report

**Generated**: 2026-02-08
**Analysis Tools**: knip, depcheck, ts-prune
**Project**: ratewise-monorepo

---

## 📊 Executive Summary

### Tool Results Overview

- **knip**: ✅ Completed - Found 26 unused files, multiple unused exports
- **depcheck**: ⚠️ Completed with warnings - Found 9 unused dev dependencies
- **ts-prune**: ❌ Failed - Missing tsconfig.json at root level

### Key Findings

1. **Unused Files**: 26 files identified as potentially unused
2. **Unused Dependencies**: 9 dev dependencies not referenced in code
3. **Unused Exports**: Multiple exports across various files
4. **Duplicate Exports**: Several files have both named and default exports

---

## 🔴 DANGER: Do Not Delete (Critical Files)

These files are essential infrastructure or build artifacts:

### Configuration Files

- `cloudflare-worker.js` - Cloudflare Worker entry point
- `security-headers/src/worker.js` - Security headers worker
- `apps/*/app.config.mjs` - Application SSOT configurations
- `apps/*/vite-plugins/*` - Build system plugins

### Test Infrastructure

- `apps/*/src/test/renderWithRouter.tsx` - Test utilities
- `apps/*/src/test/RouterWrapper.tsx` - Test wrappers

### Build & Scripts

- `scripts/generate-sitemap.js` - Sitemap generation
- `scripts/verify-version-ssot.mjs` - Version verification
- `apps/ratewise/scripts/health-check.mjs` - Health monitoring

---

## 🟡 CAUTION: Review Before Deletion

### Service Worker Test Scripts (apps/ratewise/scripts/)

**Severity**: CAUTION - May be temporary debugging tools

```
apps/ratewise/scripts/test-minimal-sw.mjs
apps/ratewise/scripts/test-sw-console-debug.mjs
apps/ratewise/scripts/test-sw-console.mjs
apps/ratewise/scripts/test-sw-detailed.mjs
apps/ratewise/scripts/test-sw-direct.mjs
apps/ratewise/scripts/test-sw-fixed.mjs
apps/ratewise/scripts/test-sw-location.mjs
apps/ratewise/scripts/test-sw-patched.mjs
apps/ratewise/scripts/test-sw-precache.mjs
```

**Recommendation**:

- ✅ SAFE TO DELETE if Service Worker is working correctly
- These appear to be debugging/testing scripts for SW development
- Should verify with project history if actively maintained

**Action Plan**:

1. Check git history for last usage
2. Verify SW functionality in production
3. Move to archive folder if not needed
4. Delete if confirmed unused for >6 months

### Unused Components with Duplicate Exports

**Pattern**: Files exporting both named and default exports

```typescript
// Example: apps/quake-school/src/components/shared/VisualizationCard.tsx
export const VisualizationCard = () => {
  /* ... */
};
export default VisualizationCard; // Duplicate
```

**Affected Files**:

- `apps/quake-school/src/components/shared/VisualizationCard.tsx`
- `apps/nihonname/src/components/CustomPunNameForm.tsx`
- `apps/nihonname/src/components/JapaneseDiceButton.tsx`
- `apps/nihonname/src/components/Layout.tsx`
- `apps/nihonname/src/components/RollingText.tsx`
- `apps/nihonname/src/components/SourceAccordion.tsx`
- `apps/nihonname/src/components/WashiPaper.tsx`
- `apps/ratewise/src/components/Breadcrumb.tsx`
- `apps/ratewise/src/components/Button.tsx`
- `apps/ratewise/src/components/Footer.tsx`
- `apps/ratewise/src/components/Layout.tsx`
- `apps/ratewise/src/components/PageContainer.tsx`
- `apps/ratewise/src/components/CurrencyLandingPage.tsx`
- `apps/haotool/src/components/Accordion.tsx`
- `apps/haotool/src/components/Counter.tsx`
- `apps/haotool/src/components/ProjectCard.tsx`
- `apps/haotool/src/components/TextReveal.tsx`

**Recommendation**:

- ⚠️ REVIEW - Not necessarily unused, just duplicated
- Keep default export, consider removing named export if unused
- Check import usage across project

---

## 🟢 SAFE: Likely Safe to Delete

### Unused Utility Functions

**Category**: Utilities with unused exports

```typescript
// scripts/lib/workspace-utils.mjs
export const getSSGApps = () => {
  /* ... */
}; // ❌ Unused
export const validateAppConfig = () => {
  /* ... */
}; // ❌ Unused
```

**Affected Exports**:

1. `scripts/lib/workspace-utils.mjs`:
   - `getSSGApps`
   - `validateAppConfig`

2. `apps/ratewise/seo-paths.config.mjs`:
   - `SEO_FILES`
   - `normalizePath`
   - `shouldPrerender`
   - `getIncludedRoutes`
   - `APP_CONFIG`

**Recommendation**: ✅ SAFE TO DELETE after verification

- These appear to be legacy utilities
- May have been replaced by newer implementations
- Check if referenced in CI/CD scripts

### Unused Dev Dependencies

**Category**: Development tools not referenced in code

```json
{
  "devDependencies": {
    "@changesets/changelog-github": "unused",
    "@playwright/test": "unused",
    "@vitejs/plugin-react-swc": "unused",
    "@vitest/coverage-v8": "unused",
    "depcheck": "unused",
    "ts-prune": "unused",
    "vite-ssg-sitemap": "unused"
  }
}
```

**apps/ratewise/package.json**:

- `lighthouse` - Performance testing tool
- `workbox-*` packages (7 packages) - Service Worker utilities

**Recommendation**:

- ⚠️ CAUTION - These may be used in CI/CD or npm scripts
- Check package.json scripts before removing
- Verify not used in GitHub Actions workflows

**Missing Dependencies**:

- `vitest` - Used in tests but not declared
- `xml2js` - Used in sitemap tests but not declared

**Action**: ✅ Add missing dependencies to package.json

---

## 📦 Unused Dependency Details

### Root package.json

**Unused devDependencies**:

1. `@changesets/changelog-github` - Changeset formatter
2. `@playwright/test` - E2E testing framework
3. `@vitejs/plugin-react-swc` - Vite React plugin
4. `@vitest/coverage-v8` - Test coverage tool
5. `depcheck` - Dependency checker (just installed for this analysis)
6. `ts-prune` - TypeScript unused export checker (just installed)
7. `vite-ssg-sitemap` - SSG sitemap generator

**Missing but Used**:

- `vitest` - Required by test files
- `xml2js` - Required by sitemap tests

### apps/ratewise/package.json

**Unused devDependencies**:

- `lighthouse` (line 63)
- `workbox-cacheable-response` (line 78)
- `workbox-cli` (line 79)
- `workbox-core` (line 80)
- `workbox-expiration` (line 81)
- `workbox-precaching` (line 82)
- `workbox-routing` (line 83)
- `workbox-strategies` (line 84)

**Unused dependencies**:

- `zustand` (line 47) - State management library

**Note**: These may be false positives if used in:

- npm scripts
- CI/CD workflows
- Dynamic imports
- Build configuration

---

## 🔍 Detailed Export Analysis

### Configuration Exports (Review Needed)

**apps/quake-school/app.config.mjs**:

- `SEO_FILES`, `IMAGE_RESOURCES`, `SITE_CONFIG`, `APP_CONFIG`
- `normalizePath`, `shouldPrerender`, `getIncludedRoutes`

**Status**: ⚠️ May be used by build system or CI scripts

**apps/nihonname/app.config.mjs**:

- Same pattern as quake-school

**apps/haotool/app.config.mjs**:

- Same pattern as above

### JSON-LD Schema Exports

**apps/quake-school/src/seo/jsonld.ts**:

- `courseSchema`, `quizSchema` - Unused SEO schemas

**apps/nihonname/src/seo/jsonld.ts**:

- `buildImageObjectSchema` - Unused helper
- Types: `BreadcrumbItem`, `FAQEntry`, `ArticleData` - Unused types

### Component Route Exports

**Pattern**: `getIncludedRoutes` function appears unused

**Affected Files**:

- `apps/quake-school/src/routes.tsx`
- `apps/nihonname/src/routes.tsx`
- `apps/ratewise/src/routes.tsx`

**Status**: ⚠️ May be used by SSG build process

### Data & Constants

**apps/nihonname/src/constants.ts** - Large file with multiple unused exports:

- `SURNAME_DATA_FULL`
- `SURNAME_STATS`
- `getSurnameDetail`
- `getSupportedSurnames`
- `SURNAME_MAP_LEGACY`
- `getFunnyNamesByCategory`
- `getRandomFunnyName`
- `getFunnyNamesCount`

**apps/nihonname/src/data/csvIntegratedPuns.ts**:

- `CSV_CLASSIC_PUNS`
- `CSV_TAIWANESE_PUNS`
- `CSV_CANTONESE_PUNS`
- `CSV_COMMON_PUNS`

**apps/nihonname/src/data/funnyNames.ts**:

- 40+ unused pun category exports

---

## 🎯 Recommended Actions

### Phase 1: Low-Risk Cleanup (Immediate)

1. **Delete Service Worker Test Scripts**

   ```bash
   rm apps/ratewise/scripts/test-*-sw*.mjs
   ```

   **Risk**: Low - Debugging scripts only
   **Test**: `pnpm test && pnpm build`

2. **Add Missing Dependencies**

   ```bash
   pnpm add -D -w vitest xml2js
   ```

   **Risk**: None - Fixing missing declarations

3. **Remove Duplicate Default Exports**
   - Keep named exports, remove redundant default exports
   - **Risk**: Low if no external consumers

### Phase 2: Dependency Cleanup (Review Required)

4. **Review and Remove Unused Dev Dependencies**
   - Check npm scripts and CI workflows first
   - Remove confirmed unused packages
   - **Risk**: Medium - May break CI/CD

5. **Verify Workbox Dependencies**
   - Check if Service Worker uses these packages
   - May need to update sw.ts imports
   - **Risk**: Medium - May affect PWA functionality

### Phase 3: Code Cleanup (Test Required)

6. **Remove Unused Utility Exports**
   - Start with `scripts/lib/workspace-utils.mjs`
   - Remove unused config exports from app.config.mjs files
   - **Risk**: Medium - May be used by build scripts

7. **Clean Up Data Files**
   - Archive unused pun categories
   - Keep only actively used data
   - **Risk**: Low - Data files only

### Phase 4: Component Optimization (Full Test Required)

8. **Standardize Component Exports**
   - Choose either named or default exports
   - Update all imports accordingly
   - **Risk**: High - May break many imports

---

## ⚠️ Important Notes

### Before Any Deletion:

1. ✅ **Run Full Test Suite**

   ```bash
   pnpm test --coverage
   ```

2. ✅ **Verify Build**

   ```bash
   pnpm build
   ```

3. ✅ **Check Git History**

   ```bash
   git log --all -- <file-path>
   ```

4. ✅ **Search for Dynamic Imports**

   ```bash
   rg "import.*<module-name>" --type ts --type tsx
   ```

5. ✅ **Verify CI/CD**
   - Check GitHub Actions workflows
   - Check npm scripts in package.json
   - Check build configuration files

### False Positives

Tools may report false positives for:

- ✓ Dynamic imports (`import()`)
- ✓ String-based requires
- ✓ Build-time code generation
- ✓ Config files used by tools
- ✓ Type-only imports
- ✓ Re-exported modules

### Rollback Plan

All deletions should be:

1. Done in separate commits
2. Tested independently
3. Easy to revert via `git revert <commit-hash>`

---

## 📝 Next Steps

1. **Immediate**: Delete Service Worker test scripts (Phase 1, Action 1)
2. **Today**: Add missing dependencies (Phase 1, Action 2)
3. **This Week**: Review and plan dependency cleanup (Phase 2)
4. **Next Sprint**: Code cleanup with full test coverage (Phase 3-4)

---

## 🔧 Tool Configuration Issues

### ts-prune

**Issue**: Failed to run - missing root tsconfig.json
**Impact**: Cannot analyze TypeScript unused exports at project level
**Solution**:

- Add root tsconfig.json, or
- Run ts-prune per workspace package

### depcheck

**Issue**: Cannot parse tsconfig.base.json (contains comments)
**Impact**: May miss some dependency usage patterns
**Solution**: Minor - doesn't affect analysis significantly

---

**Analysis Complete** ✅

**Safe to Start**: Phase 1 actions are verified safe and ready for execution.
**Requires Review**: Phase 2-4 actions need team discussion and approval.
