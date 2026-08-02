// Playwright 會話輔助（#818）：開瀏覽器、進關、入 arena、Result 重試——
// 沿 v18-level-bot / ex-bot-driver 的成熟模式收斂為單一模組。
import { chromium } from '@playwright/test';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openSession(port) {
  // 觀測模式（選配，不影響量測語意）：SP_AUDIT_HEADED=1 開視窗現場看 bot 打；
  // SP_AUDIT_VIDEO=<dir> 錄 webm。兩者皆預設關閉——CI 與批次量測維持 headless。
  const headed = process.env.SP_AUDIT_HEADED === '1';
  const videoDir = process.env.SP_AUDIT_VIDEO ?? null;
  const browser = await chromium.launch({ headless: !headed });
  // 1200 邏輯寬：殼 1250×500 → round(2.5×480)=1200（VIEW.maxWidth 夾限帶內）。
  const ctx = await browser.newContext({
    viewport: { width: 1250, height: 500 },
    ...(videoDir ? { recordVideo: { dir: videoDir, size: { width: 1250, height: 500 } } } : {}),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('sp-rotation-notice', '1');
    localStorage.setItem('sp-install-dismissed', '1');
  });
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
  return { browser, page, errors };
}

// 回到 Game 場景：走動關勝利動線落在 Map（gameScene 已停），reload 重進最穩。
export async function recoverToGame(page) {
  const scene = await page.evaluate(() => window.__sp.scene()).catch(() => null);
  if (scene === 'Game') return;
  await page.reload();
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
}

export async function gotoLevel(page, levelId, ex = false) {
  await recoverToGame(page);
  await page.evaluate(({ id, exMode }) => window.__sp.gotoLevel(id, exMode), {
    id: levelId,
    exMode: ex,
  });
  await page.waitForFunction((id) => window.__sp.stage() === id, levelId, { timeout: 15000 });
  await sleep(500);
}

// 魔王前室直走（純標準星紀律：不拾增益）：等待 Boss 真正 active；bossHp 會在
// 入場演出開始時先建立，不能把「已建立血量」誤當成「已進入可傷狀態」。
export async function enterArena(page) {
  await page.keyboard.down('ArrowRight');
  const entered = await page
    .waitForFunction(() => window.__sp.bossHp() > 0 && window.__sp.bossActive?.() === true, null, {
      timeout: 30000,
    })
    .then(() => true)
    .catch(() => false);
  await page.keyboard.up('ArrowRight');
  return entered;
}

// Result 場景（勝/敗結算）按 Enter 回 Game（敗＝自前室重試）。
export async function retryFromResult(page) {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
  await sleep(400);
}

export async function readScene(page) {
  return page.evaluate(() => window.__sp.scene()).catch(() => null);
}

export async function stopDriver(page) {
  await page
    .evaluate(() => {
      if (window.__audit) {
        window.__audit.stop = true;
        clearInterval(window.__audit.interval);
        window.__audit.releaseAll?.();
      }
    })
    .catch(() => {});
}

export async function readMetrics(page) {
  return page.evaluate(() => window.__audit?.m ?? null).catch(() => null);
}
