/**
 * Monogram icons 生成腳本（快照制：手動執行、產物 commit）。
 *
 * SSOT：public/icons/icon.svg（品牌藍圓角方 20% 半徑＋白色幾何 H）。
 * 產物：
 * - public/icons/icon-192x192.png（圓角、透明角）
 * - public/icons/icon-512x512.png（圓角、透明角）
 * - public/icons/maskable-icon-512x512.png（滿版方形；內容位於 80% safe zone）
 * - public/icons/apple-touch-icon.png（180，滿版方形；iOS 自行套遮罩，透明圓角會變黑角）
 * - public/icons/favicon-32x32.png（圓角、透明角）
 * - public/favicon.ico（零依賴 ICO 容器封裝 32px PNG）
 *
 * 執行：node apps/haotool/scripts/generate-icons.mjs（依賴 monorepo root 既有 @playwright/test）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const ICON_SVG_PATH = resolve(PUBLIC_DIR, 'icons/icon.svg');

// rounded：icon.svg 原樣（20% 圓角、角落透明）。
// fullbleed：滿版方形（rx=0）；maskable 與 apple-touch-icon 由平台自行套遮罩。
const TARGETS = [
  { file: 'icons/icon-192x192.png', size: 192, variant: 'rounded' },
  { file: 'icons/icon-512x512.png', size: 512, variant: 'rounded' },
  { file: 'icons/maskable-icon-512x512.png', size: 512, variant: 'fullbleed' },
  { file: 'icons/apple-touch-icon.png', size: 180, variant: 'fullbleed' },
  { file: 'icons/favicon-32x32.png', size: 32, variant: 'rounded' },
];

const SVG_SIZE_ATTRS = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"';
const RECT_ROUNDED = '<rect width="512" height="512" rx="102.4"';
const RECT_FULLBLEED = '<rect width="512" height="512" rx="0"';

function buildSvg(source, { size, variant }) {
  if (!source.includes(SVG_SIZE_ATTRS) || !source.includes(RECT_ROUNDED)) {
    throw new Error('icon.svg 屬性格式與腳本預期不符，請勿改動 svg/rect 屬性寫法');
  }
  let svg = source.replace(
    SVG_SIZE_ATTRS,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"`,
  );
  if (variant === 'fullbleed') {
    svg = svg.replace(RECT_ROUNDED, RECT_FULLBLEED);
  }
  return svg;
}

// 以單尺寸 PNG 封裝 ICO（PNG-in-ICO，所有現代瀏覽器支援）。
function wrapPngAsIco(png, size) {
  const buffer = Buffer.alloc(22);
  buffer.writeUInt16LE(0, 0); // reserved
  buffer.writeUInt16LE(1, 2); // type: icon
  buffer.writeUInt16LE(1, 4); // image count
  buffer.writeUInt8(size, 6); // width
  buffer.writeUInt8(size, 7); // height
  buffer.writeUInt8(0, 8); // palette count
  buffer.writeUInt8(0, 9); // reserved
  buffer.writeUInt16LE(1, 10); // color planes
  buffer.writeUInt16LE(32, 12); // bits per pixel
  buffer.writeUInt32LE(png.length, 14); // image bytes
  buffer.writeUInt32LE(22, 18); // image offset
  return Buffer.concat([buffer, png]);
}

async function renderTargets(browser, source) {
  for (const target of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: target.size, height: target.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<!doctype html><style>html,body{margin:0}svg{display:block}</style>${buildSvg(source, target)}`,
    );
    const png = await page.screenshot({ omitBackground: true });
    writeFileSync(resolve(PUBLIC_DIR, target.file), png);
    await page.close();
    console.log(`✅ ${target.file}（${png.length} bytes）`);
  }
}

async function verifyPngOutputs(browser) {
  const page = await browser.newPage();
  for (const target of TARGETS) {
    const filePath = resolve(PUBLIC_DIR, target.file);
    await page.goto(pathToFileURL(filePath).href);
    const dims = await page.evaluate(() => {
      const img = document.images[0];
      return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
    });
    if (!dims || dims.width !== target.size || dims.height !== target.size) {
      throw new Error(
        `${target.file} 驗證失敗：預期 ${target.size}px，實際 ${JSON.stringify(dims)}`,
      );
    }
    console.log(`🔍 ${target.file} 可載入，${dims.width}×${dims.height}`);
  }
  await page.close();
}

function generateFavicon() {
  const png32 = readFileSync(resolve(PUBLIC_DIR, 'icons/favicon-32x32.png'));
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  if (!png32.subarray(0, 4).equals(pngSignature)) {
    throw new Error('favicon-32x32.png 非有效 PNG，無法封裝 ICO');
  }
  const ico = wrapPngAsIco(png32, 32);
  const icoPath = resolve(PUBLIC_DIR, 'favicon.ico');
  writeFileSync(icoPath, ico);
  // ICO 頭驗證：reserved=0、type=1、count=1，offset 22 起為 PNG。
  const written = readFileSync(icoPath);
  const headerOk =
    written.readUInt16LE(0) === 0 && written.readUInt16LE(2) === 1 && written.readUInt16LE(4) === 1;
  const payloadOk = written.subarray(22, 26).equals(pngSignature);
  if (!headerOk || !payloadOk) {
    throw new Error('favicon.ico 結構驗證失敗');
  }
  console.log(`✅ favicon.ico（${ico.length} bytes，PNG-in-ICO）`);
}

const source = readFileSync(ICON_SVG_PATH, 'utf8');
const browser = await chromium.launch();
try {
  await renderTargets(browser, source);
  generateFavicon();
  await verifyPngOutputs(browser);
  console.log('🎉 icons 生成完畢（SSOT：public/icons/icon.svg）');
} finally {
  await browser.close();
}
