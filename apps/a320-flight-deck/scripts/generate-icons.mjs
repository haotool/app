/**
 * PWA icons 生成腳本（快照制：手動執行、產物 commit）。
 * 設計 SSOT＝public/icons/icon.svg（主圖示）與 public/icons/icon-maskable.svg（滿版安全區版）。
 * 執行：node apps/a320-flight-deck/scripts/generate-icons.mjs（依賴 app 內 @playwright/test）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const OUTPUTS = [
  { src: 'icons/icon.svg', out: 'icons/icon-192.png', size: 192 },
  { src: 'icons/icon.svg', out: 'icons/icon-512.png', size: 512 },
  { src: 'icons/icon-maskable.svg', out: 'icons/icon-512-maskable.png', size: 512 },
  // iOS 自行套圓角：使用滿版版本避免雙重圓角
  { src: 'icons/icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { src, out, size } of OUTPUTS) {
    const svg = readFileSync(resolve(PUBLIC_DIR, src), 'utf8');
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent"><img style="display:block;width:${size}px;height:${size}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`,
    );
    await page.locator('img').evaluate((img) => img.decode());
    const png = await page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    writeFileSync(resolve(PUBLIC_DIR, out), png);
    console.log(`✅ ${out} (${size}×${size}, ${png.length} bytes)`);
  }
} finally {
  await browser.close();
}
