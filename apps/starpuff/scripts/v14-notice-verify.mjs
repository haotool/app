// 審查修復驗證：rotationNotice 回訪玩家告知、遊戲中不彈卡、開玩自動收卡、
// 非模態卡不擋 Title 開始鈕。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch();
const errors = [];

// 1) 回訪玩家（有存檔）：顯示方向告知卡，優先於安裝卡；切回舊方向生效。
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    userAgent: IOS_UA,
  });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('sp-save')) {
      localStorage.setItem(
        'sp-save',
        JSON.stringify({
          schemaVersion: 1,
          highestClearedLevel: 3,
          levels: { 1: { cleared: true, bestTimeMs: 60000, eggsFound: [] } },
          lastPlayedAt: 1700000000000,
        }),
      );
    }
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page.waitForTimeout(3000);
  const title = await page.locator('.install-title').first().textContent();
  console.log(`returning player card: "${title}" (expect 直持方向更新了)`);
  await page.screenshot({ path: `${OUT}/m1-after-rotation-notice.png` });
  // 切回舊方向 → transform 變 cw、storage 落地。
  await page
    .locator('.install-btn')
    .last()
    .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    transform: getComputedStyle(document.getElementById('game-shell')).transform,
    pref: localStorage.getItem('sp-rotation'),
    notice: localStorage.getItem('sp-rotation-notice'),
  }));
  console.log(
    `switch back: pref=${state.pref}(expect cw) notice=${state.notice}(expect 1) cwMatrix=${state.transform.startsWith('matrix(0, 1')}`,
  );
  // 重載不再出現告知卡（安裝卡可出——它是另一張）。
  await page.reload();
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page.waitForTimeout(3200);
  const cardTitle = await page
    .locator('.install-title')
    .first()
    .textContent()
    .catch(() => null);
  console.log(`after reload card: "${cardTitle}" (expect 安裝卡而非方向卡)`);
  await ctx.close();
}

// 2) 遊戲中不彈卡＋回 Title 才顯示＋開玩自動收卡＋非模態不擋開始鈕。
{
  const ctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    userAgent: IOS_UA,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  // 立刻開玩（卡片 2.5s 後才會嘗試）。
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game');
  await page.waitForTimeout(4500);
  const inGame = await page.locator('.install-overlay').count();
  console.log(`in-game overlay: ${inGame} (expect 0，遊戲中不彈卡)`);
  // 敗北回 Title 流程：lose → Result → 不彈；此處直接驗 Title 重載路徑。
  await page.reload();
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page.waitForTimeout(3600);
  const atTitle = await page.locator('.install-overlay').count();
  console.log(`back-to-title overlay: ${atTitle} (expect 1)`);
  await page.screenshot({ path: `${OUT}/b1-after-nonmodal-title-card.png` });
  // 卡片開著仍可直接點開始（真座標點擊 canvas 中央開始鈕）。
  const box = await page.locator('#app canvas').boundingBox();
  const startBtn = await page.locator('[data-menu="start"]').boundingBox();
  await page.mouse.click(startBtn.x + startBtn.width / 2, startBtn.y + startBtn.height / 2);
  await page.waitForFunction(() => window.__sp.scene() === 'Game', undefined, { timeout: 5000 });
  await page.waitForTimeout(400);
  const afterStart = await page.locator('.install-overlay').count();
  console.log(
    `start with card open: scene=Game reached, overlay=${afterStart} (expect 0，開玩自動收卡) canvasBox=${!!box}`,
  );
  await ctx.close();
}

console.log('console errors:', errors.length, errors.slice(0, 3));
await browser.close();
console.log('notice-verify done');
