// D 驗證：CodexScene 854/1200 寬＋safe-area 下格線與條目不被裁切/遮蔽。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;

const browser = await chromium.launch();

async function probe(name, viewport, insets, tab) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  if (insets) await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });
  // 全通關存檔＋全 EX：星核制霸徽記與 EX 星章全開（v13 最新版面）。
  await ctx.addInitScript(() => {
    const levels = {};
    for (let i = 1; i <= 20; i++) {
      levels[i] = { cleared: true, bestTimeMs: 60000, eggsFound: [], exCleared: true };
    }
    localStorage.setItem(
      'sp-save',
      JSON.stringify({ schemaVersion: 1, highestClearedLevel: 20, levels, lastPlayedAt: 1 }),
    );
    localStorage.setItem('sp-rotation-notice', '1');
    localStorage.setItem('sp-install-dismissed', '1');
  });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page
    .locator(`[data-menu="${tab === 'skills' ? 'skills' : 'codex'}"]`)
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Codex');
  await page.waitForTimeout(900);
  const geo = await page.evaluate(() => ({ view: window.__sp.view() }));
  console.log(`[${name}] view=${geo.view.width}x${geo.view.height} tab=${tab}`);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  if (errors.length) console.log(`  console errors:`, errors);
  await ctx.close();
}

// 854 精確寬（直持 iPhone SE 級 375×667 → 854）＋瀏海 insets（ccw：top→殼右）。
await probe(
  'd-codex-854-notch',
  { width: 375, height: 667 },
  { top: 47, left: 0, right: 0, bottom: 34 },
  'monsters',
);
// 1200 寬（寬桌面殼）無 inset。
await probe('d-codex-1200', { width: 1280, height: 480 }, null, 'monsters');
// 854 橫持瀏海左右（landscape 直讀）。
await probe(
  'd-codex-854-landscape-notch',
  { width: 667, height: 375 },
  { top: 0, left: 47, right: 47, bottom: 21 },
  'monsters',
);
// 技能分頁 854＋insets。
await probe(
  'd-codex-skills-854-notch',
  { width: 375, height: 667 },
  { top: 47, left: 0, right: 0, bottom: 34 },
  'skills',
);

await browser.close();
console.log('d-verify done');
