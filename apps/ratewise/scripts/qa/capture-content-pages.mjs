/**
 * E4 內容頁截圖矩陣：七頁 × {zen, nitro} × 390×844，另抽三頁 375×667。
 * 同時收集 console error（供基底對照法驗證 error 0）。
 * 用法：node scripts/qa/capture-content-pages.mjs <baseURL> <outDir>
 */

import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4174';
const outDir = process.argv[3] ?? 'screenshots';

const PAGES = [
  { slug: 'faq', path: '/faq/' },
  { slug: 'guide', path: '/guide/' },
  { slug: 'about', path: '/about/' },
  { slug: 'privacy', path: '/privacy/' },
  { slug: 'open-data', path: '/open-data/' },
  { slug: 'seo-tech', path: '/seo-tech/' },
  { slug: 'open-source', path: '/open-source/' },
];

const THEMES = ['zen', 'nitro'];
const SMALL_VIEWPORT_SLUGS = new Set(['faq', 'guide', 'open-source']);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];

async function capture(theme, viewport, slug, path, suffix) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(
    ([style]) => {
      window.localStorage.setItem('ratewise-theme', JSON.stringify({ style }));
    },
    [theme],
  );
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push({ theme, slug, text: message.text().slice(0, 300) });
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push({ theme, slug, text: `pageerror: ${String(error).slice(0, 300)}` });
  });
  await page.goto(new URL(path, baseURL).toString(), { waitUntil: 'load', timeout: 30_000 });
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: `${outDir}/e4-${slug}-${theme}-${suffix}.png`, fullPage: false });
  await context.close();
}

for (const theme of THEMES) {
  for (const { slug, path } of PAGES) {
    await capture(theme, { width: 390, height: 844 }, slug, path, '390x844');
  }
}
for (const { slug, path } of PAGES.filter((p) => SMALL_VIEWPORT_SLUGS.has(p.slug))) {
  await capture('zen', { width: 375, height: 667 }, slug, path, '375x667');
}

await browser.close();

console.log(`console errors: ${consoleErrors.length}`);
for (const entry of consoleErrors) {
  console.log(`[${entry.theme}] ${entry.slug}: ${entry.text}`);
}
