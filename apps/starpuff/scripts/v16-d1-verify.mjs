// v16 D1 前後對照截圖：直持 390×844 預設鍵位（before＝v14 舊預設注入、after＝新預設）。
// 用法：SP_DEV_PORT=3016 node scripts/v16-d1-verify.mjs（dev server 需先行啟動）。
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const port = process.env.SP_DEV_PORT || '3016';
const outDir = new URL('../../../screenshots/starpuff-v16/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const OLD_DEFAULT = JSON.stringify({
  version: 2,
  a: { cx: 0.92, cy: 0.78 },
  b: { cx: 0.92, cy: 0.34 },
  scale: 1,
});

async function capture(name, { legacyLayout, rotation }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await page.addInitScript(
    ([layout, rot]) => {
      if (layout) localStorage.setItem('sp-key-layout', layout);
      if (rot) localStorage.setItem('sp-rotation', rot);
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-install-dismissed', '1');
    },
    [legacyLayout ? OLD_DEFAULT : null, rotation ?? null],
  );
  await page.goto(`http://localhost:${port}/`);
  await page.waitForSelector('#app canvas');
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Game');
  await page.waitForTimeout(1200);
  for (const btn of ['a', 'b']) {
    const box = await page.locator(`[data-btn="${btn}"]`).boundingBox();
    const cx = (box.x + box.width / 2).toFixed(1);
    const cy = (box.y + box.height / 2).toFixed(1);
    console.log(
      `${name} ${btn.toUpperCase()}: 裝置座標 (${cx}, ${cy}) → fx=${(cx / 390).toFixed(3)} fy=${(cy / 844).toFixed(3)}`,
    );
  }
  await page.screenshot({ path: `${outDir}${name}.png` });
  await browser.close();
}

await capture('d1-before-ccw', { legacyLayout: true });
await capture('d1-after-ccw', { legacyLayout: false });
await capture('d1-before-cw', { legacyLayout: true, rotation: 'cw' });
await capture('d1-after-cw', { legacyLayout: false, rotation: 'cw' });
console.log(`截圖輸出：${outDir}`);
