// E 驗證：縮放調整、持久化、v1 遷移、取消回滾、44px 守門。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;

const browser = await chromium.launch();
const errors = [];

async function newPage(context) {
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return page;
}

const tap = (page, sel, id = 9) =>
  page.locator(sel).dispatchEvent('pointerdown', { pointerId: id, isPrimary: true });
const sizeOf = (page, n) =>
  page.evaluate(
    (name) => document.querySelector(`[data-btn="${name}"]`).getBoundingClientRect().width,
    n,
  );

// 場景一：v1 舊存檔 migration（initScript 僅此 context）。
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('sp-key-layout')) {
      localStorage.setItem(
        'sp-key-layout',
        JSON.stringify({ version: 1, a: { cx: 0.8, cy: 0.7 }, b: { cx: 0.85, cy: 0.3 } }),
      );
    }
  });
  const page = await newPage(ctx);
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await tap(page, '[data-menu="config"]');
  await page.waitForSelector('.cfg-bar');
  await page.waitForTimeout(200);
  const a0 = await sizeOf(page, 'a');
  console.log('v1 migration: A at 100% =', a0, '(expect 76, 鍵位保留)');
  await page.screenshot({ path: `${OUT}/e-before-scale-100.png` });

  // 放大 ×6 → 130%＋超界守門。
  for (let i = 0; i < 9; i++) await tap(page, '[data-cfg="scale-up"]');
  await page.waitForTimeout(150);
  const a130 = await sizeOf(page, 'a');
  const label = await page.locator('[data-cfg="scale-value"]').textContent();
  console.log(`scale up + overflow: label=${label} A=${a130} (expect 130% / 98.8)`);
  await page.screenshot({ path: `${OUT}/e-after-scale-130.png` });

  await tap(page, '[data-cfg="save"]');
  await page.waitForTimeout(200);
  const stored = await page.evaluate(() => localStorage.getItem('sp-key-layout'));
  console.log('stored v2 after save:', stored);

  // 重載（initScript 有 guard 不覆蓋）→ 進遊戲驗持久化。
  await page.reload();
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await tap(page, '[data-menu="start"]');
  await page.waitForFunction(() => window.__sp.scene() === 'Game');
  await page.waitForTimeout(300);
  const aGame = await sizeOf(page, 'a');
  const bGame = await sizeOf(page, 'b');
  console.log(`in-game after reload: A=${aGame} (expect 98.8) B=${bGame} (expect 93.6)`);
  await page.screenshot({ path: `${OUT}/e-after-scale-130-ingame.png` });

  // 縮放後按鍵可按（元素即熱區）。
  const aBtn = page.locator('[data-btn="a"]');
  await aBtn.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });
  const pressed = await aBtn.evaluate((el) => el.classList.contains('is-pressed'));
  await aBtn.dispatchEvent('pointerup', { pointerId: 7, isPrimary: true });
  console.log('scaled button press works:', pressed);

  // 取消回滾：縮小兩步後取消 → localStorage 仍 1.3、DOM 回 130%。
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await tap(page, '[data-menu="config"]');
  await page.waitForSelector('.cfg-bar');
  for (let i = 0; i < 2; i++) await tap(page, '[data-cfg="scale-down"]');
  await page.waitForTimeout(100);
  const aTemp = await sizeOf(page, 'a');
  await tap(page, '[data-cfg="cancel"]');
  await page.waitForTimeout(200);
  const storedScale = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sp-key-layout')).scale,
  );
  const aAfterCancel = await page.evaluate(
    () => document.querySelector('[data-btn="a"]').getBoundingClientRect().width,
  );
  console.log(
    `cancel rollback: during=${aTemp}(≈89) storedScale=${storedScale}(expect 1.3) domA=${aAfterCancel}(expect 98.8)`,
  );

  // 44px 守門：縮到 80%。
  await tap(page, '[data-menu="config"]');
  await page.waitForSelector('.cfg-bar');
  for (let i = 0; i < 12; i++) await tap(page, '[data-cfg="scale-down"]');
  await page.waitForTimeout(100);
  const bMin = await sizeOf(page, 'b');
  const labelMin = await page.locator('[data-cfg="scale-value"]').textContent();
  console.log(`min guard: label=${labelMin} B=${bMin} (expect 57.6 >= 44)`);
  await page.screenshot({ path: `${OUT}/e-after-scale-80.png` });
  await ctx.close();
}

console.log('console errors:', errors.length, errors.slice(0, 3));
await browser.close();
console.log('e-verify done');
