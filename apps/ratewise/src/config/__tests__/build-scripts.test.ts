import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
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

async function readMainEntry() {
  const mainEntryPath = path.resolve(__dirname, '../../../src/main.tsx');
  return readFile(mainEntryPath, 'utf-8');
}

async function readRobotsGenerator() {
  const robotsGeneratorPath = path.resolve(__dirname, '../../../scripts/generate-robots-txt.mjs');
  return readFile(robotsGeneratorPath, 'utf-8');
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
    expect(viteConfig).toContain('name: APP_INFO.name');
    expect(viteConfig).not.toContain("name: 'RateWise - 即時匯率轉換器'");
    expect(manifestGenerator).toContain("from '../src/config/app-info.ts'");
    expect(manifestGenerator).toContain('name: APP_INFO.name');
    expect(manifestGenerator).toContain('short_name: APP_MANIFEST.shortName');
    expect(manifestGenerator).toContain('APP_MANIFEST.screenshots.map');
    expect(manifestGenerator).not.toContain("short_name: 'RateWise'");
    expect(manifestGenerator).not.toContain("'RateWise 首頁 - 即時匯率換算與趨勢圖'");
    expect(manifestGenerator).not.toContain("name: 'RateWise 匯率好工具'");
  });

  it('should not force React ecosystem packages into manual chunks', async () => {
    const viteConfig = await readViteConfig();
    expect(viteConfig).not.toContain(
      "if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';",
    );
    expect(viteConfig).not.toContain("return 'vendor-libs';");
    expect(viteConfig).toContain("return 'vendor-router-runtime';");
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
      "validators.hasTitle('RateWise 匯率好工具 — 台灣最精準匯率換算器 | 顯示實際買賣價，不用中間價')",
    );
    expect(healthCheckScript).not.toContain(
      "validators.hasTitle('使用指南 — 如何使用 RateWise 匯率好工具換算匯率 | RateWise 匯率好工具')",
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

  it('should detect newly created moneybox.json files in the 5-minute workflow instead of relying on git diff for tracked files only', async () => {
    const workflowSource = await readMoneyBoxWorkflow();

    expect(workflowSource).toContain('public/rates/moneybox.json');
    expect(workflowSource).not.toContain('git diff --quiet public/rates/moneybox.json');
    expect(workflowSource).toContain(
      'git status --short --untracked-files=all -- public/rates/moneybox.json',
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
    expect(moneyBoxWorkflow).toContain('git checkout origin/data -- public/rates/moneybox.json');
  });

  it('CurrencyLandingPage should import AnswerCapsule and accept answerCapsule prop (AEO/GEO readiness)', async () => {
    const source = await readCurrencyLandingPageSource();

    // AnswerCapsule インポート検証：34 幣對ページの AEO/GEO 覆盖率を保証する。
    expect(source).toContain("import { AnswerCapsule } from './AnswerCapsule'");
    // answerCapsule prop 定義
    expect(source).toContain('answerCapsule?: FAQEntry[]');
    // AnswerCapsule コンポーネントレンダリング
    expect(source).toContain('<AnswerCapsule items={answerCapsule}');
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
});
