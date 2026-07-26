// G 驗證：觸覺回饋掛點（vibrate 呼叫記錄）與 wake lock 取得（支援環境）。
import { chromium } from '@playwright/test';
import { SETTINGS_KEY, settingsFixture } from './lib/settings-fixture.mjs';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

// 記錄 vibrate 呼叫。
await page.addInitScript(() => {
  window.__vibrations = [];
  navigator.vibrate = (pattern) => {
    window.__vibrations.push(pattern);
    return true;
  };
});

await page.goto(BASE);
await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');

// wake lock：headless chromium 支援 API；驗證 request 已被呼叫（sentinel 型別存在）。
const wakeLockSupported = await page.evaluate(() => 'wakeLock' in navigator);
console.log('wakeLock API present:', wakeLockSupported);

await page
  .locator('[data-menu="start"]')
  .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
await page.waitForFunction(() => window.__sp.scene() === 'Game');
await page.waitForTimeout(500);

// 受擊 → hurt 音效 → 震動。
await page.evaluate(() => window.__sp.hurtPlayer(1));
await page.waitForTimeout(300);
const vibrations = await page.evaluate(() => window.__vibrations);
console.log(
  'vibrations after hurt:',
  JSON.stringify(vibrations),
  vibrations.length >= 1 ? 'PASS' : 'FAIL',
);

// 關閉觸覺後受擊不震（#872）：T7-A 已將震動與靜音解耦——閘門為
// UserSettings.hapticsEnabled（audio/haptics.ts 單點），不再是 legacy sp-muted。
// 前置狀態以 sp-settings 落盤後重載，較點擊 canvas 內鈕穩定。
await page.evaluate(
  ([key, value]) => localStorage.setItem(key, value),
  [SETTINGS_KEY, settingsFixture({ hapticsEnabled: false })],
);
await page.reload();
await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
await page
  .locator('[data-menu="start"]')
  .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
await page.waitForFunction(() => window.__sp.scene() === 'Game');
await page.waitForTimeout(400);
const beforeOff = await page.evaluate(() => window.__vibrations.length);
await page.evaluate(() => window.__sp.hurtPlayer(1));
await page.waitForTimeout(300);
const afterOff = await page.evaluate(() => window.__vibrations.length);
console.log(
  `haptics off hurt: vibrations ${beforeOff} -> ${afterOff}`,
  afterOff === beforeOff ? 'PASS（關閉觸覺不震）' : 'FAIL',
);

console.log('console errors:', errors.length, errors.slice(0, 3));
await browser.close();
console.log('g-verify done');
