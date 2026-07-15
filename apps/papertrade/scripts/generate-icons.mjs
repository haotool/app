/**
 * PWA icons 生成腳本（快照制：手動執行、產物 commit）。
 * 設計 SSOT 內嵌於本檔：深色底＋紅綠藍三根上升蠟燭，色值對齊 src/index.css tokens。
 * 執行：node apps/papertrade/scripts/generate-icons.mjs（依賴 app 內 @playwright/test）
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const COLORS = {
  bg: '#0B0E14',
  short: '#EA3943',
  long: '#16C784',
  primary: '#4F7CFF',
};

function candle(cx, bodyTop, wickTop, wickBottom, color) {
  const bodyHeight = 120;
  const bodyWidth = 64;
  return [
    `<line x1="${cx}" y1="${wickTop}" x2="${cx}" y2="${wickBottom}" stroke="${color}" stroke-width="16" stroke-linecap="round"/>`,
    `<rect x="${cx - bodyWidth / 2}" y="${bodyTop}" width="${bodyWidth}" height="${bodyHeight}" rx="12" fill="${color}"/>`,
  ].join('\n  ');
}

const CANDLES = [
  candle(136, 272, 240, 408, COLORS.short),
  candle(256, 200, 168, 336, COLORS.long),
  candle(376, 136, 104, 272, COLORS.primary),
].join('\n  ');

function buildSvg(variant) {
  const background =
    variant === 'maskable'
      ? `<rect width="512" height="512" fill="${COLORS.bg}"/>`
      : `<rect width="512" height="512" rx="115" fill="${COLORS.bg}"/>`;
  const content =
    variant === 'maskable'
      ? `<g transform="translate(256 256) scale(0.8) translate(-256 -256)">\n  ${CANDLES}\n  </g>`
      : CANDLES;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  ${background}\n  ${content}\n</svg>\n`;
}

const TARGETS = [
  { file: 'icons/icon-192.png', size: 192, variant: 'any' },
  { file: 'icons/icon-512.png', size: 512, variant: 'any' },
  { file: 'icons/icon-512-maskable.png', size: 512, variant: 'maskable' },
  { file: 'apple-touch-icon.png', size: 180, variant: 'maskable' },
];

async function renderPng(page, svg, size) {
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const dataUrl = await page.evaluate(
    async ({ dataUri, size }) => {
      const img = new Image();
      img.src = dataUri;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      return canvas.toDataURL('image/png');
    },
    { dataUri, size },
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function verifyPng(page, filePath, size) {
  await page.goto(`file://${filePath}`);
  const dims = await page.evaluate(() => {
    const img = document.images[0];
    return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
  });
  if (!dims || dims.width !== size || dims.height !== size) {
    throw new Error(`${filePath} 驗證失敗：預期 ${size}px，實際 ${JSON.stringify(dims)}`);
  }
}

writeFileSync(resolve(PUBLIC_DIR, 'icons/icon-512.svg'), buildSvg('any'));
console.log('✅ icons/icon-512.svg');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const target of TARGETS) {
    const png = await renderPng(page, buildSvg(target.variant), target.size);
    const filePath = resolve(PUBLIC_DIR, target.file);
    writeFileSync(filePath, png);
    await verifyPng(page, filePath, target.size);
    console.log(`✅ ${target.file}（${png.length} bytes，${target.size}px）`);
  }
  await page.close();
  console.log('🎉 icons 生成完畢');
} finally {
  await browser.close();
}
