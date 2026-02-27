import { describe, expect, it } from 'vitest';
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

  it('should not force React ecosystem packages into manual chunks', async () => {
    const viteConfig = await readViteConfig();
    expect(viteConfig).not.toContain(
      "if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';",
    );
    expect(viteConfig).not.toContain("return 'vendor-libs';");
  });

  it('should not globally pin brace-expansion to the legacy 2.x API', async () => {
    const packageJson = await readRootPackageJson();

    expect(packageJson.pnpm?.overrides?.['brace-expansion']).toBeUndefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@<2.0.2']).toBeDefined();
    expect(packageJson.pnpm?.overrides?.['brace-expansion@>=5.0.0 <5.0.2']).toBeDefined();
  });

  it('should keep package.json semver as the version SSOT when git tags are stale', async () => {
    const viteConfig = await readViteConfig();

    expect(viteConfig).toContain('if (tagVersion !== baseVersion) {');
    expect(viteConfig).toContain('return null;');
    expect(viteConfig).toContain('return `${baseVersion}+build.${commitCount}`;');
  });

  it('should not reference a removed optimized PNG logo in structured data', async () => {
    const seoMetadataPath = path.resolve(__dirname, '../seo-metadata.ts');
    const seoMetadata = await readFile(seoMetadataPath, 'utf-8');

    expect(seoMetadata).not.toContain('optimized/logo-512w.png');
    expect(seoMetadata).toContain('icons/ratewise-icon-512x512.png');
  });
});
