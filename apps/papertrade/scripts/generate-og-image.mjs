/**
 * OG 分享圖生成腳本（快照制：手動執行、產物 commit，模式同 generate-icons.mjs）。
 * 設計 SSOT 內嵌於本檔：深色底＋三根上升蠟燭＋品牌標題，色值對齊 src/index.css tokens。
 * 執行：node apps/papertrade/scripts/generate-og-image.mjs（依賴 app 內 @playwright/test）
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  bg: '#0B0E14',
  surface: '#141A26',
  short: '#EA3943',
  long: '#16C784',
  primary: '#4F7CFF',
  text: '#EDF0F7',
  text3: '#8A93A6',
};

function candle(cx, bodyTop, wickTop, wickBottom, color) {
  const bodyHeight = 150;
  const bodyWidth = 80;
  return [
    `<line x1="${cx}" y1="${wickTop}" x2="${cx}" y2="${wickBottom}" stroke="${color}" stroke-width="20" stroke-linecap="round"/>`,
    `<rect x="${cx - bodyWidth / 2}" y="${bodyTop}" width="${bodyWidth}" height="${bodyHeight}" rx="15" fill="${color}"/>`,
  ].join('\n  ');
}

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>
  <rect x="70" y="115" width="400" height="400" rx="90" fill="${COLORS.surface}"/>
  ${candle(176, 300, 260, 470, COLORS.short)}
  ${candle(270, 240, 200, 410, COLORS.long)}
  ${candle(364, 175, 135, 345, COLORS.primary)}
  <text x="540" y="290" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-size="92" font-weight="700" fill="${COLORS.text}">PaperTrade</text>
  <text x="543" y="380" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-size="46" font-weight="500" fill="${COLORS.text3}">零風險模擬合約交易所</text>
  <text x="543" y="452" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-size="30" fill="${COLORS.text3}">真實行情 × 模擬資金 × 永續合約練習</text>
</svg>
`;

async function renderPng(page, svg, width, height) {
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const dataUrl = await page.evaluate(
    async ({ dataUri, width, height }) => {
      const img = new Image();
      img.src = dataUri;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    },
    { dataUri, width, height },
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function verifyPng(page, filePath, width, height) {
  await page.goto(`file://${filePath}`);
  const dims = await page.evaluate(() => {
    const img = document.images[0];
    return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
  });
  if (!dims || dims.width !== width || dims.height !== height) {
    throw new Error(`${filePath} 驗證失敗：預期 ${width}x${height}，實際 ${JSON.stringify(dims)}`);
  }
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const png = await renderPng(page, SVG, WIDTH, HEIGHT);
  const filePath = resolve(PUBLIC_DIR, 'og-image.png');
  writeFileSync(filePath, png);
  await verifyPng(page, filePath, WIDTH, HEIGHT);
  console.log(`✅ og-image.png（${png.length} bytes，${WIDTH}x${HEIGHT}）`);
} finally {
  await browser.close();
}
