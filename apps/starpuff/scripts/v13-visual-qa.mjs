// v13 視覺 QA（§86）：星核制霸金裝（Title）、圖鑑金徽記＋五王紫星（Codex）、
// EX 徽鈕（Map 分頁）雙寬截圖。用法：node scripts/v13-visual-qa.mjs [port]
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const port = process.argv[2] ?? '3113';
const OUT_DIR = new URL('../../../screenshots/starpuff-v13/', import.meta.url).pathname;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CONQUEST_SAVE = {
  schemaVersion: 1,
  highestClearedLevel: 20,
  levels: Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      String(i + 1),
      {
        cleared: true,
        bestTimeMs: 45000,
        eggsFound: [],
        ...([4, 7, 12, 16, 20].includes(i + 1) ? { exCleared: true } : {}),
      },
    ]),
  ),
  lastPlayedAt: Date.now(),
};

async function shoot(browser, viewport, suffix) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.addInitScript((save) => {
    localStorage.setItem('sp-save', JSON.stringify(save));
  }, CONQUEST_SAVE);
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
  await sleep(2200);
  await page.screenshot({ path: `${OUT_DIR}conquest-title-${suffix}.png` });
  // 圖鑑：金徽記＋五王紫星。
  await page
    .locator('[data-menu="codex"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Codex', null, { timeout: 10000 });
  await sleep(900);
  await page.screenshot({ path: `${OUT_DIR}conquest-codex-${suffix}.png` });
  // 地圖三區頁：L12 EX 徽鈕（紫星態）。
  await page
    .locator('[data-menu="back"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Title', null, { timeout: 10000 });
  await page
    .locator('[data-menu="map"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Map', null, { timeout: 10000 });
  await page
    .locator('[data-menu="zone-3"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await sleep(700);
  await page.screenshot({ path: `${OUT_DIR}conquest-map-zone3-${suffix}.png` });
  await ctx.close();
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  // 854 邏輯寬（iPhone 13 橫持 844×390 → 854 帶）與 1200 寬雙截。
  await shoot(browser, { width: 844, height: 390 }, '854w');
  await shoot(browser, { width: 1250, height: 500 }, '1200w');
  console.log('視覺 QA 截圖完成');
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
