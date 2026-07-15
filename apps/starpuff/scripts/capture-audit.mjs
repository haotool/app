// 全元素位置稽核截圖（GAME_DESIGN §37 / v5 需求 8）：Title/Game/Boss/Result 於
// 390×844（直握旋轉殼）與 926×428（寬幅橫持）逐景截圖存 screenshots/。
// 用法：BASE_URL=http://localhost:3007/ OUT_DIR=<dir> [V5=1] node scripts/capture-audit.mjs
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3007/';
const OUT_DIR = process.env.OUT_DIR ?? 'screenshots/starpuff-v5-audit/after';
// V5=1 額外截 v5 新頁面（暫停選單/圖鑑/技能/按鈕配置）；before 基準（v4）不支援。
const CAPTURE_V5 = process.env.V5 === '1';

const VIEWPORTS = [
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'landscape-926x428', width: 926, height: 428 },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const vp of VIEWPORTS) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const shot = (name) => page.screenshot({ path: join(OUT_DIR, `${vp.name}-${name}.png`) });
  const waitScene = (scene) =>
    page.waitForFunction((s) => window.__sp?.scene() === s, scene, { timeout: 20000 });
  const press = (selector) =>
    page.locator(selector).dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });

  await page.goto(BASE_URL);
  await page.waitForSelector('#app canvas');
  await waitScene('Title');
  await page.waitForTimeout(1200);
  await shot('title');

  await press('.dom-btn >> nth=0');
  await waitScene('Game');
  await page.waitForTimeout(1800);
  await shot('game');

  if (CAPTURE_V5) {
    await page.keyboard.press('Escape');
    await page.waitForSelector('.pause-overlay');
    await shot('pause');
    await press('[data-pause="resume"]');
    await page.waitForTimeout(300);
  }

  await page.evaluate(() => window.__sp.skipToBoss());
  await page.waitForFunction(() => window.__sp.bossHp() > 0, undefined, { timeout: 20000 });
  // 等入場運鏡（pan+zoom+三段落座+吼叫）結束，取戰鬥穩定幀稽核 HUD 與 boss 條。
  await page.waitForTimeout(4500);
  await shot('boss');

  await page.evaluate(() => window.__sp.win());
  await waitScene('Result');
  await page.waitForTimeout(1000);
  await shot('result');

  if (CAPTURE_V5) {
    await page.goto(BASE_URL);
    await waitScene('Title');
    await press('[data-menu="codex"]');
    await waitScene('Codex');
    await page.waitForTimeout(900);
    await shot('codex-monsters');
    await press('[data-menu="tab-skills"]');
    await page.waitForTimeout(900);
    await shot('codex-skills');
    await press('[data-menu="back"]');
    await waitScene('Title');
    await press('[data-menu="config"]');
    await page.waitForSelector('.cfg-bar');
    await page.waitForTimeout(300);
    await shot('keyconfig');
  }

  await browser.close();
  console.log(`${vp.name} 完成`);
}
console.log(`輸出：${OUT_DIR}`);
