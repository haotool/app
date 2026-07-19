// A 驗證：安裝指引出現邏輯（iOS UA 顯示、關閉記憶、standalone 不顯示、桌面不顯示）。
import { chromium, devices } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch();
const errors = [];

async function scenario(name, contextOptions, initScript, expectVisible) {
  const ctx = await browser.newContext(contextOptions);
  if (initScript) await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page.waitForTimeout(3200);
  const visible = await page.locator('.install-overlay').count();
  const pass = expectVisible ? visible === 1 : visible === 0;
  console.log(
    `[${name}] overlay=${visible} expect=${expectVisible ? 1 : 0} ${pass ? 'PASS' : 'FAIL'}`,
  );
  if (expectVisible && visible) {
    await page.screenshot({ path: `${OUT}/a-after-install-guide-${name}.png` });
  }
  const result = { pass, page, ctx };
  return result;
}

// 1) iOS Safari 直持：顯示 iOS 指引。
{
  const { pass, page, ctx } = await scenario(
    'ios-portrait',
    { viewport: { width: 390, height: 844 }, hasTouch: true, userAgent: IOS_UA },
    null,
    true,
  );
  if (pass) {
    const title = await page.locator('.install-title').textContent();
    console.log('  ios title:', title);
    // 關閉 → localStorage 記憶。
    await page
      .locator('.install-btn')
      .last()
      .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    await page.waitForTimeout(200);
    const gone = await page.locator('.install-overlay').count();
    const remembered = await page.evaluate(() => localStorage.getItem('sp-install-dismissed'));
    console.log(`  dismiss: overlay=${gone}(expect 0) remembered=${remembered}(expect 1)`);
    // 重載不再出現。
    await page.reload();
    await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
    await page.waitForTimeout(3200);
    const again = await page.locator('.install-overlay').count();
    console.log(`  after reload: overlay=${again} (expect 0) ${again === 0 ? 'PASS' : 'FAIL'}`);
  }
  await ctx.close();
}

// 2) iOS standalone（已安裝）：不顯示。
{
  const { ctx } = await scenario(
    'ios-standalone',
    { viewport: { width: 390, height: 844 }, hasTouch: true, userAgent: IOS_UA },
    () => {
      Object.defineProperty(navigator, 'standalone', { get: () => true });
    },
    false,
  );
  await ctx.close();
}

// 3) 桌面：不顯示。
{
  const { ctx } = await scenario(
    'desktop',
    { viewport: { width: 1280, height: 720 } },
    null,
    false,
  );
  await ctx.close();
}

// 4) Threads in-app（Barcelona UA）：顯示外開指引。
{
  const { pass, page, ctx } = await scenario(
    'threads-inapp',
    {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22H352 Barcelona 431.0.0.25.69 (iPhone13,3; iOS 18_7_8; zh_TW)',
    },
    null,
    true,
  );
  if (pass) console.log('  threads title:', await page.locator('.install-title').textContent());
  await ctx.close();
}

// 5) Android（模擬 beforeinstallprompt 不可靠，僅驗 UA 分支文案出現）。
{
  const { pass, page, ctx } = await scenario(
    'android',
    { ...devices['Pixel 7'], browserName: undefined },
    null,
    true,
  );
  if (pass) console.log('  android title:', await page.locator('.install-title').textContent());
  await ctx.close();
}

console.log('console errors:', errors.length, errors.slice(0, 3));
await browser.close();
console.log('a-verify done');
