/**
 * PWA icons 生成腳本（快照制：手動執行、產物 commit）。
 * 設計 SSOT＝public/favicon.svg（手寫向量）；本檔讀源派生 maskable 變體與各尺寸 PNG。
 * 執行：node apps/papertrade/scripts/generate-icons.mjs（依賴 app 內 @playwright/test）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const FAVICON_SVG = readFileSync(resolve(PUBLIC_DIR, 'favicon.svg'), 'utf8');

// 以 id 錨點對源 SVG 做變體改寫；錨點缺失時直接失敗，避免靜默產出破圖。
function mustReplace(svg, pattern, replacement, anchor) {
  if (!pattern.test(svg)) {
    throw new Error(`favicon.svg 缺少 ${anchor} 錨點，請維持 id 結構後重跑`);
  }
  return svg.replace(pattern, replacement);
}

// maskable：背景滿版（遮罩由 OS 套用）、移除描邊、mark 縮至 80% 安全圓內。
function buildMaskableSvg() {
  const bgFill = FAVICON_SVG.match(/<rect id="frame-bg"[^>]*fill="([^"]+)"/)?.[1];
  if (!bgFill) {
    throw new Error('favicon.svg 缺少 frame-bg 錨點，請維持 id 結構後重跑');
  }
  let svg = FAVICON_SVG;
  svg = mustReplace(
    svg,
    /<rect id="frame-bg"[^>]*\/>/,
    `<rect width="512" height="512" fill="${bgFill}"/>`,
    'frame-bg',
  );
  svg = mustReplace(svg, /\s*<rect id="frame-border"[^>]*\/>/, '', 'frame-border');
  svg = mustReplace(
    svg,
    /<g id="mark">/,
    '<g id="mark" transform="translate(256 256) scale(0.9) translate(-256 -256)">',
    'mark',
  );
  return svg;
}

function buildSvg(variant) {
  return variant === 'maskable' ? buildMaskableSvg() : FAVICON_SVG;
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
