import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function readPackageJson() {
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  return JSON.parse(await readFile(packageJsonPath, 'utf-8')) as {
    scripts?: Record<string, string>;
  };
}

async function readRootPackageJson() {
  const packageJsonPath = path.resolve(__dirname, '../../../../../package.json');
  return JSON.parse(await readFile(packageJsonPath, 'utf-8')) as {
    engines?: {
      node?: string;
    };
    pnpm?: {
      overrides?: Record<string, string>;
    };
  };
}

async function readNvmrc() {
  const filePath = path.resolve(__dirname, '../../../../../.nvmrc');
  return (await readFile(filePath, 'utf-8')).trim();
}

async function readNodeVersionFile() {
  const filePath = path.resolve(__dirname, '../../../../../.node-version');
  return (await readFile(filePath, 'utf-8')).trim();
}

async function readViteConfig() {
  const viteConfigPath = path.resolve(__dirname, '../../../vite.config.ts');
  return readFile(viteConfigPath, 'utf-8');
}

async function readAppLayoutSource() {
  const appLayoutPath = path.resolve(__dirname, '../../../src/components/AppLayout.tsx');
  return readFile(appLayoutPath, 'utf-8');
}

async function readMainEntry() {
  const mainEntryPath = path.resolve(__dirname, '../../../src/main.tsx');
  return readFile(mainEntryPath, 'utf-8');
}

async function readRobotsGenerator() {
  const robotsGeneratorPath = path.resolve(__dirname, '../../../scripts/generate-robots-txt.mjs');
  return readFile(robotsGeneratorPath, 'utf-8');
}

async function readLlmsGenerator() {
  const llmsGeneratorPath = path.resolve(__dirname, '../../../scripts/generate-llms-txt.mjs');
  return readFile(llmsGeneratorPath, 'utf-8');
}

async function readManifestGenerator() {
  const manifestGeneratorPath = path.resolve(__dirname, '../../../scripts/generate-manifest.mjs');
  return readFile(manifestGeneratorPath, 'utf-8');
}

async function readPairAmountSeoHook() {
  const pairAmountSeoHookPath = path.resolve(__dirname, '../../../src/hooks/usePairAmountSEO.ts');
  return readFile(pairAmountSeoHookPath, 'utf-8');
}

async function readHealthCheckScript() {
  const healthCheckPath = path.resolve(__dirname, '../../../scripts/health-check.mjs');
  return readFile(healthCheckPath, 'utf-8');
}

async function readMoneyBoxWorkflow() {
  const workflowPath = path.resolve(
    __dirname,
    '../../../../../.github/workflows/update-moneybox-rates.yml',
  );
  return readFile(workflowPath, 'utf-8');
}

async function readMoneyBoxFetchScript() {
  const scriptPath = path.resolve(__dirname, '../../../../../scripts/fetch-moneybox-rates.js');
  return readFile(scriptPath, 'utf-8');
}

async function readLatestRatesWorkflow() {
  const workflowPath = path.resolve(
    __dirname,
    '../../../../../.github/workflows/update-latest-rates.yml',
  );
  return readFile(workflowPath, 'utf-8');
}

async function readRatingSnapshotGenerator() {
  const ratingSnapshotGeneratorPath = path.resolve(
    __dirname,
    '../../../scripts/fetch-rating-snapshot.mjs',
  );
  return readFile(ratingSnapshotGeneratorPath, 'utf-8');
}

async function readPrebuildFetchRatesScript() {
  const scriptPath = path.resolve(__dirname, '../../../scripts/prebuild-fetch-rates.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readSeoRateExamplesScript() {
  const scriptPath = path.resolve(__dirname, '../../../scripts/update-seo-rate-examples.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readApiJsonGenerator() {
  const scriptPath = path.resolve(__dirname, '../../../scripts/generate-api-json.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readPairJsonGenerator() {
  const scriptPath = path.resolve(__dirname, '../../../scripts/generate-pair-json.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readOpenApiGenerator() {
  const scriptPath = path.resolve(__dirname, '../../../scripts/generate-openapi.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readRateProviderPublicMetadataSource() {
  const scriptPath = path.resolve(__dirname, '../rateProviderPublicMetadata.ts');
  return readFile(scriptPath, 'utf-8');
}

async function readBuildTimeRatesFixture() {
  const ratesPath = path.resolve(__dirname, '../generated/build-time-rates.json');
  return JSON.parse(await readFile(ratesPath, 'utf-8')) as {
    timestamp: unknown;
    updateTime: unknown;
    details?: Record<string, unknown>;
  };
}

async function readSeoPathsConfig() {
  const configPath = path.resolve(__dirname, '../../../seo-paths.config.mjs');
  return readFile(configPath, 'utf-8');
}

async function readSeoFullAuditScript() {
  const seoAuditPath = path.resolve(__dirname, '../../../../../scripts/seo-full-audit.mjs');
  return readFile(seoAuditPath, 'utf-8');
}

async function readSeoHealthCheckScript() {
  const scriptPath = path.resolve(__dirname, '../../../../../scripts/seo-health-check.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readVerifySsotScript() {
  const scriptPath = path.resolve(__dirname, '../../../../../scripts/verify-ssot-sync.mjs');
  return readFile(scriptPath, 'utf-8');
}

async function readGuidePageSource() {
  const guidePagePath = path.resolve(__dirname, '../../../src/pages/Guide.tsx');
  return readFile(guidePagePath, 'utf-8');
}

async function readOpenDataPageSource() {
  const openDataPagePath = path.resolve(__dirname, '../../../src/pages/OpenData.tsx');
  return readFile(openDataPagePath, 'utf-8');
}

async function readSeoTechPageSource() {
  const seoTechPagePath = path.resolve(__dirname, '../../../src/pages/SeoTech.tsx');
  return readFile(seoTechPagePath, 'utf-8');
}

async function readPostbuildMirrorScript() {
  const postbuildMirrorPath = path.resolve(__dirname, '../../../scripts/postbuild-mirror-dist.js');
  return readFile(postbuildMirrorPath, 'utf-8');
}

async function readSeoMetadataSource() {
  const seoMetadataPath = path.resolve(__dirname, '../seo-metadata.ts');
  return readFile(seoMetadataPath, 'utf-8');
}

async function readCurrencyLandingPageSource() {
  const componentPath = path.resolve(__dirname, '../../../src/components/CurrencyLandingPage.tsx');
  return readFile(componentPath, 'utf-8');
}

async function readHomepageSEOSectionSource() {
  const componentPath = path.resolve(__dirname, '../../../src/components/HomepageSEOSection.tsx');
  return readFile(componentPath, 'utf-8');
}

async function readFaqPageSource() {
  const pagePath = path.resolve(__dirname, '../../../src/pages/FAQ.tsx');
  return readFile(pagePath, 'utf-8');
}

describe('ratewise build scripts', () => {
  it('should not patch the generated service worker with a postbuild polyfill', async () => {
    const packageJson = await readPackageJson();
    expect(packageJson.scripts?.['postbuild']).not.toContain('patch-sw');
  });

  it('should alias react-helmet-async to the local React 19 shim', async () => {
    const viteConfig = await readViteConfig();
    expect(viteConfig).toContain(
      "'react-helmet-async': resolve(__dirname, './src/utils/react-helmet-async-shim.tsx')",
    );
  });

  it('should source PWA manifest branding from app-info SSOT instead of hardcoded fallback names', async () => {
    const viteConfig = await readViteConfig();
    const manifestGenerator = await readManifestGenerator();

    expect(viteConfig).toContain("from './src/config/app-info'");
    expect(viteConfig).toContain('manifest: false');
    expect(viteConfig).not.toContain('short_name: APP_INFO.shortName');
    expect(viteConfig).not.toContain('name: APP_INFO.name');
    expect(viteConfig).not.toContain("name: 'HaoRate - 即時匯率轉換器'");
    expect(manifestGenerator).toContain("from '../src/config/app-info.ts'");
    expect(manifestGenerator).toContain('name: APP_INFO.name');
    expect(manifestGenerator).toContain('short_name: APP_MANIFEST.shortName');
    expect(manifestGenerator).toContain('APP_MANIFEST.screenshots.map');
    expect(manifestGenerator).not.toContain("short_name: 'HaoRate'");
    expect(manifestGenerator).not.toContain("'HaoRate 首頁 - 即時匯率換算與趨勢圖'");
    expect(manifestGenerator).not.toContain("name: 'HaoRate 匯率好工具'");
  });

  it('should not force React ecosystem packages into manual chunks', async () => {
    const viteConfig = await readViteConfig();
    expect(viteConfig).not.toContain(
      "if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';",
    );
    expect(viteConfig).not.toContain("return 'vendor-libs';");
    expect(viteConfig).toContain("return 'vendor-router-runtime';");
  });

  it('should keep motion and dnd vendor chunks out of homepage modulepreload dependencies', async () => {
    const viteConfig = await readViteConfig();
    const jsxRuntimeRuleIndex = viteConfig.indexOf(
      "id.includes('/node_modules/react/jsx-runtime')",
    );
    const reactDomFactoryRuleIndex = viteConfig.indexOf("id.includes('/node_modules/react-dom/')");
    const dndRuleIndex = viteConfig.indexOf("id.includes('@hello-pangea/dnd')");
    const motionRuleIndex = viteConfig.indexOf("id.includes('motion')");

    expect(viteConfig).toContain("dedupe: ['react', 'react-dom', 'react/jsx-runtime']");
    expect(jsxRuntimeRuleIndex).toBeGreaterThan(-1);
    expect(reactDomFactoryRuleIndex).toBeGreaterThan(-1);
    expect(dndRuleIndex).toBeGreaterThan(-1);
    expect(motionRuleIndex).toBeGreaterThan(-1);
    expect(jsxRuntimeRuleIndex).toBeLessThan(motionRuleIndex);
    expect(reactDomFactoryRuleIndex).toBeLessThan(dndRuleIndex);
    expect(viteConfig).toContain("return 'vendor-commons';");
    expect(viteConfig).toContain("return 'vendor-dnd';");
    expect(viteConfig).toContain("return 'vendor-motion';");
  });

  it('should keep AppLayout shell free of direct motion imports and lazy-load non-critical prompts', async () => {
    const appLayout = await readAppLayoutSource();

    expect(appLayout).not.toContain("from 'motion/react'");
    expect(appLayout).not.toContain('from "motion/react"');
    expect(appLayout).toContain('React.lazy(() =>');
    expect(appLayout).toContain("import('./OfflineIndicator')");
    expect(appLayout).toContain("import('./UpdatePrompt')");
    expect(appLayout).toContain("import('./RatingModal')");
    expect(appLayout).toContain('<NonCriticalLazyBoundary resetKey={location.pathname}>');
  });

  it('should not globally pin brace-expansion to the legacy 2.x API', async () => {
    const packageJson = await readRootPackageJson();

    expect(packageJson.pnpm?.overrides?.['brace-expansion']).toBeUndefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@<1.1.13']).toBeDefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@>=2.0.0 <2.0.3']).toBeDefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@>=5.0.0 <5.0.5']).toBeDefined();
  });

  it('should keep Node version hints aligned across engines, .nvmrc and .node-version', async () => {
    const packageJson = await readRootPackageJson();
    const nvmrc = await readNvmrc();
    const nodeVersion = await readNodeVersionFile();

    expect(packageJson.engines?.node).toBe('^24.0.0');
    expect(nvmrc).toBe('24.0.0');
    expect(nodeVersion).toBe('24.0.0');
  });

  it('should keep package.json semver as the version SSOT when git tags are stale', async () => {
    const viteConfig = await readViteConfig();
    const versionUtilPath = path.resolve(__dirname, '../../../src/utils/version-build-utils.ts');
    const versionUtil = await readFile(versionUtilPath, 'utf-8');

    expect(viteConfig).toContain('if (tagVersion !== baseVersion) {');
    expect(viteConfig).toContain('return null;');
    expect(viteConfig).toContain(
      'return formatVersionFromCommitCount(baseVersion, rawCommitCount);',
    );
    expect(versionUtil).toContain('return `${baseVersion}+build.${commitCount}`;');
  });

  it('should not reference a removed optimized PNG logo in structured data', async () => {
    const seoMetadataPath = path.resolve(__dirname, '../seo-metadata.ts');
    const seoMetadata = await readFile(seoMetadataPath, 'utf-8');

    expect(seoMetadata).not.toContain('optimized/logo-512w.png');
    expect(seoMetadata).toContain('icons/ratewise-icon-512x512.png');
  });

  it('should not manage CSP inside the app build pipeline when Cloudflare is the SSOT', async () => {
    const packageJson = await readPackageJson();
    const viteConfig = await readViteConfig();
    const mainEntry = await readMainEntry();

    expect(packageJson.scripts?.['postbuild']).not.toContain('update-csp-meta');
    expect(viteConfig).not.toContain("from 'vite-plugin-csp-guard'");
    expect(viteConfig).not.toContain('csp({');
    expect(mainEntry).not.toContain('initCSPReporter');
  });

  it('should ship a real network probe asset for online checks', () => {
    const probePath = path.resolve(__dirname, '../../../public/__network_probe__');
    expect(existsSync(probePath)).toBe(true);
  });

  it('should source DEV-only robots disallow rules from SEO SSOT instead of hardcoding page names', async () => {
    const robotsGenerator = await readRobotsGenerator();

    expect(robotsGenerator).toContain('DEV_ONLY_PATHS');
    expect(robotsGenerator).not.toContain("'/theme-showcase/'");
    expect(robotsGenerator).not.toContain("'/color-scheme/'");
    expect(robotsGenerator).not.toContain("'/update-prompt-test/'");
    expect(robotsGenerator).not.toContain("'/ui-showcase/'");
  });

  it('should source AI crawler names from a shared scripts SSOT', async () => {
    const robotsGenerator = await readRobotsGenerator();
    const llmsGenerator = await readLlmsGenerator();

    expect(robotsGenerator).toContain("from './lib/ai-crawlers.mjs'");
    expect(llmsGenerator).toContain("from './lib/ai-crawlers.mjs'");
    expect(robotsGenerator).not.toContain('const TRAINING_BOTS =');
    expect(llmsGenerator).not.toContain('Allow: GPTBot, OAI-SearchBot');
  });

  it('should keep placeholder rating snapshots deterministic when RATING_API_URL is missing', async () => {
    const ratingSnapshotGenerator = await readRatingSnapshotGenerator();

    expect(ratingSnapshotGenerator).toContain(
      "const PLACEHOLDER_SNAPSHOT_AT = '1970-01-01T00:00:00.000Z';",
    );
    expect(ratingSnapshotGenerator).toContain('snapshotAt: PLACEHOLDER_SNAPSHOT_AT,');
  });

  it('should tolerate transient SEO rate example API failures during prebuild while keeping scheduled refresh strict', async () => {
    const packageJson = await readPackageJson();
    const seoRateExamplesScript = await readSeoRateExamplesScript();

    expect(packageJson.scripts?.['prebuild']).toContain('SEO_RATE_EXAMPLES_OPTIONAL=1');
    expect(seoRateExamplesScript).toContain(
      "const OPTIONAL_MODE = process.env.SEO_RATE_EXAMPLES_OPTIONAL === '1';",
    );
    expect(seoRateExamplesScript).toContain('prebuild 優雅降級模式');
    expect(seoRateExamplesScript).toContain('process.exit(0);');
  });

  it('should generate SEO rate example dates in Asia/Taipei instead of UTC', async () => {
    const seoRateExamplesScript = await readSeoRateExamplesScript();

    expect(seoRateExamplesScript).toContain("timeZone: 'Asia/Taipei'");
    expect(seoRateExamplesScript).toContain('formatDateInTaipei');
    expect(seoRateExamplesScript).not.toContain('new Date().toISOString().slice(0, 10)');
  });

  it('should keep production SEO SSOT schema validation aligned with /faq/ only FAQPage policy', async () => {
    const verifySeoSsotScript = await readFile(
      path.resolve(__dirname, '../../../scripts/verify-seo-ssot.mjs'),
      'utf-8',
    );

    expect(verifySeoSsotScript).toContain(
      "home: {\n    requiredSchemas: ['SoftwareApplication', 'Organization', 'WebSite', 'ImageObject']",
    );
    expect(verifySeoSsotScript).toContain(
      "'usd-twd': {\n    requiredSchemas: [\n      'SoftwareApplication',\n      'Organization',\n      'WebSite',\n      'ExchangeRateSpecification'",
    );
    expect(verifySeoSsotScript).not.toContain(
      "home: {\n    requiredSchemas: ['SoftwareApplication', 'Organization', 'WebSite', 'HowTo'",
    );
    expect(verifySeoSsotScript).not.toMatch(/'usd-twd':[\s\S]*?'FAQPage'/);
    expect(verifySeoSsotScript).not.toMatch(/'jpy-twd':[\s\S]*?'FAQPage'/);
  });

  it('should validate cached rates freshness before reusing public/rates.json during prebuild fallback', async () => {
    const prebuildFetchRatesScript = await readPrebuildFetchRatesScript();

    expect(prebuildFetchRatesScript).toContain('const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;');
    expect(prebuildFetchRatesScript).toContain('const cacheTimestamp = getCacheTimestamp(cached);');
    expect(prebuildFetchRatesScript).toContain('緩存匯率已過舊');
    expect(prebuildFetchRatesScript).toContain('忽略 public/rates.json');
  });

  it('should keep canonical index paths and supported dynamic amount route patterns as separate SSOT fields', async () => {
    const seoPathsConfig = await readSeoPathsConfig();

    expect(seoPathsConfig).toContain('export const INDEXABLE_CANONICAL_PATHS = [');
    expect(seoPathsConfig).toContain('export const SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS = [');
    expect(seoPathsConfig).toContain('seoPaths: SEO_PATHS');
    expect(seoPathsConfig).toContain(
      'supportedDynamicRoutePatterns: SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS.map',
    );
  });

  it('should verify canonical paths and dynamic route pattern SSOT separately', async () => {
    const verifySsotScript = await readVerifySsotScript();

    expect(verifySsotScript).toContain('INDEXABLE_CANONICAL_PATHS');
    expect(verifySsotScript).toContain('SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS');
    expect(verifySsotScript).toContain('supportedDynamicRoutePatterns');
  });

  it('should keep page-level canonical generation on SEOHelmet pathname SSOT instead of hardcoded page URLs', async () => {
    const guidePageSource = await readGuidePageSource();
    const openDataPageSource = await readOpenDataPageSource();

    expect(guidePageSource).not.toContain('canonical="https://app.haotool.org/ratewise/guide/"');
    expect(openDataPageSource).not.toContain('canonical={`${SITE_CONFIG.url}open-data/`}');
  });

  it('should not fabricate FAQ/About fallback HTML from the homepage template', async () => {
    const postbuildMirrorScript = await readPostbuildMirrorScript();

    expect(postbuildMirrorScript).not.toContain("ensureStaticPage('/faq'");
    expect(postbuildMirrorScript).not.toContain("ensureStaticPage('/about'");
    expect(postbuildMirrorScript).not.toContain('generated fallback static page');
  });

  it('should source health-check SEO titles from a plain-node TypeScript SSOT module instead of Vite runtime metadata or hardcoded strings', async () => {
    const healthCheckScript = await readHealthCheckScript();
    const seoMetadataSource = await readSeoMetadataSource();

    expect(healthCheckScript).toContain("from '../src/config/seo-static.ts'");
    expect(healthCheckScript).not.toContain("from '../src/config/seo-metadata.ts'");
    expect(healthCheckScript).toContain('DEFAULT_TITLE');
    expect(healthCheckScript).toContain('GUIDE_PAGE_TITLE');
    expect(seoMetadataSource).toContain("from './seo-static'");
    expect(seoMetadataSource).toContain('title: GUIDE_PAGE_TITLE');
    expect(healthCheckScript).not.toContain(
      "validators.hasTitle('HaoRate 匯率好工具 — 台灣最精準匯率換算器 | 顯示實際買賣價，不用中間價')",
    );
    expect(healthCheckScript).not.toContain(
      "validators.hasTitle('使用指南 — 如何使用 HaoRate 匯率好工具換算匯率 | HaoRate 匯率好工具')",
    );
  });

  it('should retry transient 502/503/504 responses in production health checks before failing', async () => {
    const healthCheckScript = await readHealthCheckScript();

    expect(healthCheckScript).toContain('RETRYABLE_STATUS_CODES');
    expect(healthCheckScript).toContain('requestWithRetry');
    expect(healthCheckScript).toContain('502');
    expect(healthCheckScript).toContain('503');
    expect(healthCheckScript).toContain('504');
  });

  it('should run all route-level SEO verifiers in the CI full audit instead of only three checks', async () => {
    const seoFullAuditScript = await readSeoFullAuditScript();

    expect(seoFullAuditScript).toContain('verify-history-data.mjs');
    expect(seoFullAuditScript).toContain('verify-precache-assets.mjs');
    expect(seoFullAuditScript).toContain('verify-sitemap-ssg.mjs');
    expect(seoFullAuditScript).not.toContain('總計: 3 項自動驗證');
  });

  it('should keep seo-tech metadata counts synced with SEO route and prerender SSOT instead of stale literals', async () => {
    const seoMetadataSource = await readSeoMetadataSource();

    expect(seoMetadataSource).toContain('SEO_PATHS.length');
    expect(seoMetadataSource).toContain('PRERENDER_PATHS.length');
    expect(seoMetadataSource).not.toContain('42 個索引路徑');
    expect(seoMetadataSource).not.toContain('50 頁 SSG 預渲染');
  });

  it('should source seo health-check route validation from seo-paths SSOT instead of regex-parsing routes.tsx', async () => {
    const seoHealthCheckScript = await readSeoHealthCheckScript();

    expect(seoHealthCheckScript).toContain("from '../apps/ratewise/seo-paths.config.mjs'");
    expect(seoHealthCheckScript).toContain('INDEXABLE_CANONICAL_PATHS');
    expect(seoHealthCheckScript).not.toContain(
      "const routesPath = join(RATEWISE_DIR, 'src/routes.tsx');",
    );
    expect(seoHealthCheckScript).not.toContain('/getIncludedRoutes[^{]*{([^}]+)}/s');
  });

  it('should align seo health-check canonical validation with the SEOHelmet-managed head architecture', async () => {
    const seoHealthCheckScript = await readSeoHealthCheckScript();

    expect(seoHealthCheckScript).toContain('SEOHelmet');
    expect(seoHealthCheckScript).toContain('由 SEOHelmet 動態管理 canonical');
    expect(seoHealthCheckScript).not.toContain('index.html 缺少 canonical link');
  });

  it('should source amount-page title and description templates from seo-metadata SSOT instead of hardcoded hook literals', async () => {
    const pairAmountSeoHook = await readPairAmountSeoHook();

    expect(pairAmountSeoHook).toContain("from '../config/seo-metadata'");
    expect(pairAmountSeoHook).toContain('buildPairAmountSeo');
    expect(pairAmountSeoHook).not.toContain('台幣換 ${formatted}');
    expect(pairAmountSeoHook).not.toContain('今日可換多少');
  });

  it('should detect newly created MoneyBox provider files in the 5-minute workflow instead of relying on git diff for tracked files only', async () => {
    const workflowSource = await readMoneyBoxWorkflow();

    expect(workflowSource).toContain(
      'MONEYBOX_LATEST_FILE: public/rates/providers/moneybox/latest.json',
    );
    expect(workflowSource).toContain('public/rates/providers/moneybox/latest.json');
    expect(workflowSource).not.toContain('public/rates/moneybox.json');
    expect(workflowSource).not.toContain('git diff --quiet public/rates/moneybox.json');
    expect(workflowSource).toContain(
      'git status --short --untracked-files=all -- "$MONEYBOX_LATEST_FILE"',
    );
  });

  it('should stagger the 5-minute rate workflows away from the top of the hour and emit schedule diagnostics for log triage', async () => {
    const latestWorkflow = await readLatestRatesWorkflow();
    const moneyBoxWorkflow = await readMoneyBoxWorkflow();

    expect(latestWorkflow).not.toContain("cron: '*/5 * * * *'");
    expect(moneyBoxWorkflow).not.toContain("cron: '*/5 * * * *'");
    expect(latestWorkflow).toContain("cron: '2,7,12,17,22,27,32,37,42,47,52,57 * * * *'");
    expect(moneyBoxWorkflow).toContain("cron: '4,9,14,19,24,29,34,39,44,49,54,59 * * * *'");
    expect(latestWorkflow).toContain('Workflow event:');
    expect(latestWorkflow).toContain('Workflow schedule:');
    expect(moneyBoxWorkflow).toContain('Workflow event:');
    expect(moneyBoxWorkflow).toContain('Workflow schedule:');
  });

  it('should refresh rate JSON from origin/data before summary generation so rebase-conflicted worktrees cannot leak into workflow logs', async () => {
    const latestWorkflow = await readLatestRatesWorkflow();
    const moneyBoxWorkflow = await readMoneyBoxWorkflow();

    expect(latestWorkflow).toContain('git rebase --abort 2>/dev/null || true');
    expect(latestWorkflow).toContain('git checkout origin/data -- public/rates/latest.json');
    expect(moneyBoxWorkflow).toContain('git rebase --abort 2>/dev/null || true');
    expect(moneyBoxWorkflow).toContain(
      'git checkout origin/data -- "$MONEYBOX_LATEST_FILE" "$MONEYBOX_HISTORY_DIR"',
    );
  });

  it('should persist MoneyBox daily history snapshots alongside latest rates', async () => {
    const workflowSource = await readMoneyBoxWorkflow();

    expect(workflowSource).toContain('SOURCE_REF="${GITHUB_REF_NAME:-main}"');
    expect(workflowSource).toContain('git fetch origin "$SOURCE_REF"');
    expect(workflowSource).toContain('git checkout FETCH_HEAD -- scripts/fetch-moneybox-rates.js');
    expect(workflowSource).not.toContain(
      'git checkout origin/main -- scripts/fetch-moneybox-rates.js',
    );
    expect(workflowSource).toContain('MONEYBOX_FETCH_OUTPUT_FILE: .moneybox-current-fetch.json');
    expect(workflowSource).toContain(
      'MONEYBOX_LATEST_FILE: public/rates/providers/moneybox/latest.json',
    );
    expect(workflowSource).toContain(
      'MONEYBOX_HISTORY_DIR: public/rates/providers/moneybox/history',
    );
    expect(workflowSource).toContain(
      'MONEYBOX_HISTORY_FILE="${MONEYBOX_HISTORY_DIR}/${CURRENT_DATE}.json"',
    );
    expect(workflowSource).toContain('cp "$MONEYBOX_FETCH_OUTPUT_FILE" "$MONEYBOX_HISTORY_FILE"');
    expect(workflowSource).toContain('cp "$MONEYBOX_FETCH_OUTPUT_FILE" "$MONEYBOX_LATEST_FILE"');
    expect(workflowSource).not.toContain('public/rates/moneybox.json');
    expect(workflowSource).not.toContain('public/rates/moneybox-history');
    expect(workflowSource).toContain(
      'git status --short --untracked-files=all -- "$MONEYBOX_HISTORY_DIR/"',
    );
    expect(workflowSource).toContain('git add "$MONEYBOX_LATEST_FILE" "$MONEYBOX_HISTORY_DIR/"');
    expect(workflowSource).toContain(
      'git checkout origin/data -- "$MONEYBOX_LATEST_FILE" "$MONEYBOX_HISTORY_DIR"',
    );
    expect(workflowSource).toContain(
      'HISTORY_PURGE_URL="${MONEYBOX_PURGE_DATA_BASE}/${MONEYBOX_HISTORY_DIR}/${CURRENT_DATE}.json"',
    );
  });

  it('should detect MoneyBox TWD buy/sell spread changes instead of comparing sell only', async () => {
    const scriptSource = await readMoneyBoxFetchScript();

    expect(scriptSource).toContain('const TWD_QUOTE_FIELDS = [');
    expect(scriptSource).toContain("'buy'");
    expect(scriptSource).toContain("'sell'");
    expect(scriptSource).toContain("'base'");
    expect(scriptSource).toContain("'spbuy'");
    expect(scriptSource).toContain("'spsell'");
    expect(scriptSource).not.toContain('oldData.rates?.TWD?.sell');
    expect(scriptSource).not.toContain('newData.rates?.TWD?.sell');
  });

  it('CurrencyLandingPage should import AnswerCapsule and accept answerCapsule prop (AEO/GEO readiness)', async () => {
    const source = await readCurrencyLandingPageSource();

    // 驗證匯入 AnswerCapsule，確保 34 個幣對頁都有 AEO/GEO 快速答案覆蓋。
    expect(source).toContain("import { AnswerCapsule } from './AnswerCapsule'");
    // 驗證 answerCapsule prop 定義存在。
    expect(source).toContain('answerCapsule?: FAQEntry[]');
    // 驗證 AnswerCapsule 元件有被實際渲染。
    expect(source).toContain('<AnswerCapsule items={answerCapsule}');
  });

  it('HomepageSEOSection should import and render AnswerCapsule (AEO/GEO readiness)', async () => {
    const source = await readHomepageSEOSectionSource();

    // 驗證匯入 AnswerCapsule，確保首頁有 AEO/GEO 快速答案覆蓋。
    expect(source).toContain("import { AnswerCapsule } from './AnswerCapsule'");
    // 驗證有讀取 answerCapsule 資料來源。
    expect(source).toContain('answerCapsule');
    // 驗證 AnswerCapsule 元件有被實際渲染。
    expect(source).toContain('<AnswerCapsule items=');
  });

  it('FAQ page should import and render AnswerCapsule (AEO/GEO readiness)', async () => {
    const source = await readFaqPageSource();

    // 驗證匯入 AnswerCapsule，確保 FAQ 頁有 AEO/GEO 快速答案覆蓋。
    expect(source).toContain("import { AnswerCapsule } from '../components/AnswerCapsule'");
    // 驗證引用 FAQ_PAGE_SEO.answerCapsule。
    expect(source).toContain('FAQ_PAGE_SEO.answerCapsule');
    // 驗證 AnswerCapsule 元件有被實際渲染。
    expect(source).toContain('<AnswerCapsule items=');
  });

  it('should pass breadcrumb and jsonLd props to SEOHelmet in SeoTech page for proper structured data', async () => {
    const seoTechSource = await readSeoTechPageSource();

    // /seo-tech/ は CONTENT_SEO_PATHS 内の可索引ページ。
    // BreadcrumbList と Article JSON-LD は SEOHelmet 経由で SSG HTML に出力される必要がある。
    expect(seoTechSource).toContain('breadcrumb={pageSeo.breadcrumb}');
    expect(seoTechSource).toContain('jsonLd={pageSeo.jsonLd}');
    // pathname は CONTENT_SEO_PATHS と一致する尾斜線付き形式を使用すること。
    expect(seoTechSource).not.toContain("pathname='/seo-tech'");
  });

  /**
   * Brand SSOT 哨兵：
   * 防止有人在 components / pages / i18n 直接寫死 'HaoRate' 或 '匯率好工具'。
   * 改名時若新增的程式碼漏接 SSOT，這個測試會立刻紅。
   *
   * Allowlist 解釋：
   * - src/config/app-info.ts — SSOT 本身（必含字面值）
   * - src/config/__tests__/ — 包含 canary 與本測試自身
   * - src/features/ratewise/ — `ratewise` 是 technical codename，permanent identifier
   * - src/routes.tsx — 直接 import RateWise component（symbol，不是品牌字串）
   * - src/services/exchangeRateService.ts — 註解引用 RateWise.tsx 檔名
   * - src/jsonld.test.ts / urlNormalization.test.ts — 引用 RateWise.tsx 檔案路徑
   * - src/llms-txt.spec.ts — 已收斂（白名單只是防守備）
   * - src/utils/versionManager.ts — 註解引用 RateWise.tsx 為呼叫者
   */
  it('should not hardcode HaoRate / 匯率好工具 outside SSOT and technical-identifier files', async () => {
    const srcRoot = path.resolve(__dirname, '../..');
    const allowList = new Set(
      [
        'config/app-info.ts',
        'features/ratewise/RateWise.tsx',
        'features/ratewise/RateWise.test.tsx',
        'features/ratewise/storage-keys.ts',
        'routes.tsx',
        'services/exchangeRateService.ts',
        'jsonld.test.ts',
        'middleware/urlNormalization.test.ts',
        'llms-txt.spec.ts',
        'utils/versionManager.ts',
      ].map((p) => path.normalize(p)),
    );
    const allowedDirs = [
      path.normalize('config/__tests__'),
      // bootstrap tests reference STORAGE_KEYS which lives under features/ratewise
      path.normalize('bootstrap'),
      // versionManager tests reference STORAGE_KEYS
      path.normalize('utils/__tests__'),
    ];
    const skipExt = new Set(['.png', '.jpg', '.svg', '.webp', '.snap']);

    function* walk(dir: string): Generator<string> {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          yield* walk(full);
          continue;
        }
        if (skipExt.has(path.extname(entry))) continue;
        yield full;
      }
    }

    const offenders: { file: string; reason: string }[] = [];
    const brandTokens = ['HaoRate', '匯率好工具'];

    for (const file of walk(srcRoot)) {
      const rel = path.relative(srcRoot, file);
      if (allowList.has(rel)) continue;
      if (allowedDirs.some((d) => rel.startsWith(d + path.sep) || rel === d)) continue;

      const content = await readFile(file, 'utf-8');
      for (const token of brandTokens) {
        if (content.includes(token)) {
          offenders.push({ file: rel, reason: `contains literal "${token}"` });
          break;
        }
      }
    }

    if (offenders.length > 0) {
      const msg = offenders.map((o) => `  - ${o.file}: ${o.reason}`).join('\n');
      throw new Error(
        `發現新增的品牌字面值（請改用 APP_INFO.shortName / APP_INFO.name）：\n${msg}`,
      );
    }
    expect(offenders).toEqual([]);
  });

  it('should keep API rate mode strategies in a single JSON SSOT', async () => {
    const ssotPath = path.resolve(__dirname, '../rate-mode-strategies.json');
    expect(existsSync(ssotPath)).toBe(true);
    const strategies = JSON.parse(await readFile(ssotPath, 'utf-8')) as {
      auto: {
        fromCurrencyField: string;
        toCurrencyField: string;
        twdToForeign: string;
        foreignToTwd: string;
        foreignToForeign: string;
      };
    };

    const sources = [
      await readApiJsonGenerator(),
      await readPairJsonGenerator(),
      await readOpenApiGenerator(),
      await readOpenDataPageSource(),
    ];

    for (const source of sources) {
      expect(source).toContain('rate-mode-strategies.json');
      expect(source).not.toContain('來源幣別使用賣出價，目標幣別使用買入價');
    }

    expect(strategies.auto.fromCurrencyField).toBe('{rateType}.buy');
    expect(strategies.auto.toCurrencyField).toBe('{rateType}.sell');
    expect(strategies.auto.twdToForeign).toBe('amount / details.{TO}.{rateType}.sell');
    expect(strategies.auto.foreignToTwd).toBe('amount * details.{FROM}.{rateType}.buy');
    expect(strategies.auto.foreignToForeign).toBe(
      'amount * details.{FROM}.{rateType}.buy / details.{TO}.{rateType}.sell',
    );
  });

  it('should expose exchange-shop and future bank provider contracts in public API metadata', async () => {
    const apiJsonGenerator = await readApiJsonGenerator();
    const openApiGenerator = await readOpenApiGenerator();
    const openDataPage = await readOpenDataPageSource();
    const publicMetadataSource = await readRateProviderPublicMetadataSource();

    for (const source of [apiJsonGenerator, openApiGenerator, openDataPage]) {
      expect(source).toContain('rateProviderPublicMetadata');
      expect(source).toContain('buildPublicRateProviderMetadata');
    }

    expect(apiJsonGenerator).toContain('providerSelection');
    expect(publicMetadataSource).toContain(
      'bankProviderChoiceEnabled: shouldEnableBankProviderChoice()',
    );
    expect(apiJsonGenerator).not.toContain("providerId: 'bot'");
    expect(apiJsonGenerator).not.toContain("providerId: 'moneybox'");
    expect(publicMetadataSource).toContain('provider.apiPaths.history');

    expect(openApiGenerator).toContain('RateProvider: rateProviderSchema');
    expect(openApiGenerator).toContain(
      'ExchangeShopRatesResponse: exchangeShopRatesResponseSchema',
    );
    expect(openApiGenerator).toContain('[EXCHANGE_SHOP_LATEST_PATH]');
    expect(openApiGenerator).toContain('[EXCHANGE_SHOP_HISTORY_PATH]');
    expect(openApiGenerator).toContain("'x-rate-providers'");
    expect(openApiGenerator).toContain('/public/rates/providers/{providerId}/latest.json');
    expect(openApiGenerator).toContain('/public/rates/providers/{providerId}/history/{date}.json');
    expect(openApiGenerator).not.toContain('/public/rates/moneybox.json');
    expect(openApiGenerator).not.toContain('/public/rates/moneybox-history/{date}.json');

    expect(openDataPage).toContain('MoneyBox (明洞換匯所聯盟)');
    expect(publicMetadataSource).toContain('provider.apiPaths.history');
    expect(openDataPage).toContain('sourceKind + providerId');
    expect(openDataPage).toContain('bank provider 超過一家');
    expect(openDataPage).toContain("PROVIDER_RATES_PATH.latest('{providerId}')");
    expect(openDataPage).toContain("PROVIDER_RATES_PATH.history('{providerId}', '{YYYY-MM-DD}')");
    expect(openDataPage).not.toContain('/public/rates/moneybox.json');
    expect(openDataPage).not.toContain("replace('/haotool/app/data'");
    expect(openDataPage).not.toContain('new URL(EXCHANGE_SHOP_PROVIDER');

    const rankingSource = await readFile(
      path.resolve(__dirname, '../../features/ratewise/rateProviderRanking.ts'),
      'utf-8',
    );
    expect(rankingSource).not.toContain("providerId: 'bot'");
  });

  it('should document rate API timestamp and base-currency fields from the data fixture SSOT', async () => {
    const fixture = await readBuildTimeRatesFixture();
    const openApiGenerator = await readOpenApiGenerator();
    const openDataPage = await readOpenDataPageSource();

    expect(typeof fixture.timestamp).toBe('string');
    expect(typeof fixture.updateTime).toBe('string');
    expect(fixture.details).not.toHaveProperty('TWD');

    expect(openApiGenerator).toContain("const API_VERSION = '1.3.0'");
    expect(openApiGenerator).toContain("timestamp: {\n      type: 'string'");
    expect(openApiGenerator).not.toContain("description: 'Unix 時間戳（毫秒）'");
    expect(openApiGenerator).not.toContain(
      "format: 'date-time',\n      description: '資料最後更新時間（ISO 8601 格式",
    );

    const llmsGenerator = await readLlmsGenerator();
    expect(llmsGenerator).toContain('timestamp（ISO 8601 資料抓取時間）');
    expect(llmsGenerator).toContain('| timestamp | string | ISO 8601 資料抓取時間（UTC） |');
    expect(llmsGenerator).toContain(
      '| updateTime | string | 台灣銀行牌告顯示時間（台灣時間 UTC+8） |',
    );
    expect(llmsGenerator).not.toContain('timestamp（Unix 時間戳）');
    expect(llmsGenerator).not.toContain('| timestamp | number | Unix 時間戳（秒） |');
    expect(llmsGenerator).not.toContain('| updateTime | string | ISO 8601 更新時間（UTC+8） |');

    expect(openDataPage).toContain('17 種外幣的現金與即期四種報價，TWD 為基準幣');
    expect(openDataPage).toContain("type: 'string (ISO 8601)'");
    expect(openDataPage).not.toContain('integer (milliseconds)');
    expect(openDataPage).not.toContain('包含全部 18 種幣別（含 TWD 基準幣）的現金與即期四種報價');
  });
});
