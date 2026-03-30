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
    pnpm?: {
      overrides?: Record<string, string>;
    };
  };
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
    expect(packageJson.pnpm?.overrides?.['brace-expansion@<1.1.12']).toBeDefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@>=2.0.0 <2.0.2']).toBeDefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@>=5.0.0 <5.0.2']).toBeDefined();
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
});
