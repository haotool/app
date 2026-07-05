/**
 * OG 分享圖生成腳本（快照制：手動執行、產物 commit）。
 *
 * 產物：public/og-image.png（1200×630）。
 * 版式：白底、左上 wordmark、中央標語大字、下方副標、右下 5 工具名稱列；
 * 零漸層零陰影（設計 brief §1.1 扁平鐵律）；中文用系統字型。
 * SSOT：public/brand/wordmark.svg（字形）＋ src/config/tools.ts（工具名稱）。
 *
 * 執行：node apps/haotool/scripts/generate-og.mjs（依賴 monorepo root 既有 @playwright/test）
 */
import { readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Node 24 原生 type stripping 可直接載入 .ts；補上副檔名解析讓 tools.ts 的
// extensionless 相對匯入（./app-info）可解析，維持工具資料單一來源。
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const OUTPUT_PATH = resolve(PUBLIC_DIR, 'og-image.png');
const MAX_BYTES = 200 * 1024;

const { TOOLS } = await import('../src/config/tools.ts');

// wordmark.svg 高 28 → OG 版面放大至高 44。
const wordmark = readFileSync(resolve(PUBLIC_DIR, 'brand/wordmark.svg'), 'utf8').replace(
  'width="138.04" height="28"',
  'width="216.92" height="44"',
);

const toolNames = TOOLS.map((tool) => tool.name).join('<span class="dot">·</span>');

const html = `<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: #FFFFFF;
    font-family: -apple-system, 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }
  .wordmark { position: absolute; top: 64px; left: 72px; }
  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-bottom: 24px;
  }
  h1 {
    font-size: 88px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: #0F172A;
  }
  h1 .accent { color: #1B64DA; }
  .tagline {
    margin-top: 28px;
    font-size: 30px;
    font-weight: 500;
    color: #64748B;
  }
  .tools {
    position: absolute;
    right: 72px;
    bottom: 56px;
    font-size: 19px;
    font-weight: 500;
    color: #64748B;
    display: flex;
    align-items: center;
  }
  .tools .dot { margin: 0 12px; color: #CBD5E1; }
  .tools .live {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22C55E;
    display: inline-block;
    margin-right: 14px;
  }
</style>
</head>
<body>
  <div class="wordmark">${wordmark}</div>
  <div class="center">
    <h1>把好想法，做成<span class="accent">好工具</span>。</h1>
    <p class="tagline">HaoTool 好工具 · 免費開源的台灣網頁工具集</p>
  </div>
  <div class="tools"><span class="live"></span>${toolNames}</div>
</body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUTPUT_PATH });
  await page.close();

  const bytes = statSync(OUTPUT_PATH).size;
  if (bytes > MAX_BYTES) {
    throw new Error(`og-image.png ${bytes} bytes 超過 ${MAX_BYTES} 上限`);
  }

  // 產物驗證：可載入且尺寸正確。
  const verifyPage = await browser.newPage();
  await verifyPage.goto(pathToFileURL(OUTPUT_PATH).href);
  const dims = await verifyPage.evaluate(() => {
    const img = document.images[0];
    return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
  });
  await verifyPage.close();
  if (!dims || dims.width !== 1200 || dims.height !== 630) {
    throw new Error(`og-image.png 驗證失敗：${JSON.stringify(dims)}`);
  }
  console.log(`✅ og-image.png（1200×630，${bytes} bytes）`);
} finally {
  await browser.close();
}
