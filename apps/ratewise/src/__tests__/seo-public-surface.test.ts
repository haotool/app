/**
 * Public SEO surface regression suite
 *
 * 目標：集中驗證公開可見輸出，避免 route 順序、sitemap 與公開揭露頁再次漂移。
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_INFO } from '../config/app-info';
import { SEO_PATHS, PRERENDER_PATHS } from '../config/seo-paths';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';
import { SEO_SCHEMA_REGISTRY } from '../config/seo-schema-registry';
import { ensurePrerenderDist } from './helpers/ensurePrerenderDist';

const appRoot = resolve(__dirname, '../..');
const distRoot = resolve(appRoot, 'dist');
const sitemapPath = resolve(appRoot, 'public/sitemap.xml');

const readDistHtml = (path: string): string => {
  const htmlPath = resolve(
    distRoot,
    path === '/' ? 'index.html' : `${path.replace(/^\/+/, '')}index.html`,
  );

  if (!existsSync(htmlPath)) {
    throw new Error(`prerender route html missing: ${htmlPath}`);
  }

  return readFileSync(htmlPath, 'utf-8');
};

const extractVisibleText = (html: string): string => {
  const document = new DOMParser().parseFromString(html, 'text/html');

  document.querySelectorAll('script, style').forEach((element) => {
    element.remove();
  });

  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const textBefore = (text: string, marker: string): string => {
  const index = text.indexOf(marker);
  return index >= 0 ? text.slice(0, index) : text;
};

beforeAll(async () => {
  await ensurePrerenderDist({
    projectRoot: appRoot,
    distRoot,
    requiredPaths: [sitemapPath],
    sourcePaths: [
      resolve(appRoot, 'src/pages/SeoTech.tsx'),
      resolve(appRoot, 'src/config/seo-build-pipeline.ts'),
      resolve(appRoot, 'src/config/seo-paths.ts'),
      resolve(appRoot, 'src/config/seo-schema-registry.ts'),
    ],
  });
}, 120000);

describe('SEO public surface regression suite', () => {
  it.each([
    { path: '/', h1: `${APP_INFO.name} 即時匯率換算` },
    { path: '/about/', h1: `關於 ${APP_INFO.name}` },
    {
      path: '/usd-twd/',
      h1: `${getCurrencyLandingPageContent('USD').currencyName}對台幣匯率換算器`,
    },
    { path: '/seo-tech/', h1: `${APP_INFO.shortName} SEO 架構` },
  ])('%s route H1 應早於 fallback 與通用殼層文案', ({ path, h1 }) => {
    const text = extractVisibleText(readDistHtml(path));
    const prefix = textBefore(text, h1);

    expect(text).toContain(h1);
    expect(prefix).not.toContain('載入匯率資料中...');
    expect(prefix).not.toContain('主要功能');
    expect(prefix).not.toContain('Exchange Rate Tool');
    expect(prefix).not.toContain('Built with React');
    expect(prefix).not.toContain('©');
  });

  it('/seo-tech/ 應揭露當前 SSOT，而非舊 sitemap / schema 說法', () => {
    const text = extractVisibleText(readDistHtml('/seo-tech/'));

    expect(text).toContain(String(SEO_PATHS.length));
    expect(text).toContain(String(PRERENDER_PATHS.length));
    expect(text).toContain(String(SEO_SCHEMA_REGISTRY.filter((schema) => schema.enabled).length));
    expect(text).toContain('generate-sitemap-2026.mjs');
    expect(text).not.toContain('248 個 SEO URL');
    expect(text).not.toContain('priority 欄位');
    expect(text).not.toContain('FinancialService');
  });

  it('sitemap.xml 不得回歸輸出 priority / changefreq', () => {
    const sitemap = readFileSync(sitemapPath, 'utf-8');

    expect(sitemap).toContain('<lastmod>');
    expect(sitemap).not.toContain('<priority>');
    expect(sitemap).not.toContain('<changefreq>');
  });
});
