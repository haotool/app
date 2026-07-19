/**
 * OG 分享圖生成腳本（快照制：手動執行、產物 commit，模式同 generate-icons.mjs）。
 * Logo mark 源＝public/favicon.svg（單點 SSOT）；版面：左置 logo、主副標、右側淡蠟燭裝飾。
 * 執行：node apps/papertrade/scripts/generate-og-image.mjs（依賴 app 內 @playwright/test）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  bg: '#0B0E14',
  short: '#EA3943',
  long: '#16C784',
  text: '#FFFFFF',
  text2: '#9AA4B2',
};

const FONT_STACK = "system-ui, -apple-system, 'PingFang TC', 'Noto Sans TC', sans-serif";

// 將 favicon.svg 以巢狀 <svg> 內嵌為左置 logo mark（保留其 viewBox 幾何）。
function logoMark(x, y, size) {
  const source = readFileSync(resolve(PUBLIC_DIR, 'favicon.svg'), 'utf8');
  const openTag = /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 512 512">/;
  if (!openTag.test(source)) {
    throw new Error('favicon.svg 根標籤結構異動，請同步更新 generate-og-image.mjs');
  }
  return source
    .replace(
      openTag,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" x="${x}" y="${y}" width="${size}" height="${size}">`,
    )
    .trim();
}

// 右側大尺度淡蠟燭裝飾（約 20% 透明、裁邊）。
function bgCandle(cx, bodyTop, bodyHeight, wickTop, wickBottom, color) {
  const bodyWidth = 132;
  return [
    `<g opacity="0.18">`,
    `<line x1="${cx}" y1="${wickTop}" x2="${cx}" y2="${wickBottom}" stroke="${color}" stroke-width="26" stroke-linecap="round"/>`,
    `<rect x="${cx - bodyWidth / 2}" y="${bodyTop}" width="${bodyWidth}" height="${bodyHeight}" rx="26" fill="${color}"/>`,
    `</g>`,
  ].join('\n  ');
}

// 尾跡：沿紙飛機飛行軸（約 19° 上升）自 logo 右緣延伸，貫穿至 long 陽燭上影線。
const TRAIL = `<path d="M430 222 L985 31" fill="none" stroke="${COLORS.long}" stroke-width="6" stroke-linecap="round" stroke-dasharray="26 20" opacity="0.5"/>`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>
  ${bgCandle(985, 90, 330, -60, 640, COLORS.long)}
  ${bgCandle(1150, 280, 320, 120, 720, COLORS.short)}
  ${TRAIL}
  ${logoMark(84, 150, 330)}
  <text x="500" y="322" font-family="${FONT_STACK}" font-size="104" font-weight="700" fill="${COLORS.text}">PaperTrade</text>
  <text x="506" y="412" font-family="${FONT_STACK}" font-size="46" font-weight="500" fill="${COLORS.text2}">零風險模擬合約交易所</text>
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
