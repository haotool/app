/**
 * SEO Surface Order 可見輸出驗證
 *
 * 目標：確保每個公開 SEO 路由的第一個 H1 之前，沒有通用預設文案覆蓋。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_INFO } from '../config/app-info';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const distPath = resolve(__dirname, '../../dist');

const readDistHtml = (path: string): string => {
  const htmlPath = resolve(
    distPath,
    path === '/' ? 'index.html' : path.replace(/^\/+/, '') + 'index.html',
  );
  if (!existsSync(htmlPath)) {
    throw new Error(`prerender route html missing: ${htmlPath}`);
  }
  return readFileSync(htmlPath, 'utf-8');
};

const extractVisibleText = (html: string): string =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const textBefore = (text: string, marker: string): string => {
  const index = text.indexOf(marker);
  return index >= 0 ? text.slice(0, index) : text;
};

beforeAll(() => {
  const indexHtml = resolve(distPath, 'index.html');
  if (existsSync(indexHtml)) return;

  throw new Error(
    'prerender dist is missing. please run pnpm --filter @app/ratewise build before this test.',
  );
});

describe('SEO 首屏文字順序檢查（route order gate）', () => {
  const samples = [
    { path: '/', h1: `${APP_INFO.name} 即時匯率換算` },
    { path: '/about/', h1: `關於 ${APP_INFO.name}` },
    {
      path: '/usd-twd/',
      h1: `${getCurrencyLandingPageContent('USD').currencyName}對台幣匯率換算器`,
    },
    { path: '/seo-tech/', h1: `${APP_INFO.shortName} SEO 架構` },
  ];

  it.each(samples)('%s 首個 H1 不應被 fallback / footer 文案覆蓋', ({ path, h1 }) => {
    const html = readDistHtml(path);
    const text = extractVisibleText(html);
    const h1Index = text.indexOf(h1);

    expect(h1Index).toBeGreaterThanOrEqual(0);

    const prefix = textBefore(text, h1);
    expect(prefix).not.toContain('載入匯率資料中...');
    expect(prefix).not.toContain('主要功能');
    expect(prefix).not.toContain('Exchange Rate Tool');
    expect(prefix).not.toContain('Built with React');
    expect(prefix).not.toContain('©');
  });

  it('index 頁面應該以首頁 H1 作為首個主要標題', () => {
    const text = extractVisibleText(readDistHtml('/'));
    expect(text.indexOf(`${APP_INFO.name} 即時匯率換算`)).toBeGreaterThan(0);
  });
});
