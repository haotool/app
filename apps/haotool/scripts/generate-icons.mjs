/**
 * Brand icons 生成腳本（快照制：手動執行、產物 commit）。
 *
 * SSOT：brand-src/logomark.png（L1-b 繩結 monogram，PM E3 素材裁決；
 * 源檔不入 dist——S2 裁決：build-time 素材一律置於 brand-src/）。
 * 版式：#EFF6FF（--color-primary-bg）實底板＋置中 logomark；
 * rounded 變體圓角 20% 半徑（角落透明）、fullbleed 滿版方形由平台自行套遮罩；
 * maskable 內容置於中央 80% 安全圓內（W3C maskable safe zone）。
 * 產物（檔名與 manifest / index.html 引用不變）：
 * - public/icons/icon-192x192.png（rounded）
 * - public/icons/icon-512x512.png（rounded）
 * - public/icons/maskable-icon-512x512.png（fullbleed＋safe zone）
 * - public/icons/apple-touch-icon.png（180，fullbleed；iOS 自行套遮罩）
 * - public/icons/favicon-32x32.png（rounded）
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
const LOGOMARK_PATH = resolve(__dirname, '../brand-src/logomark.png');

// 板底色 = --color-primary-bg（品牌五色板內）；logomark 本體維持原色不重繪。
const PLATE_COLOR = '#EFF6FF';

// variant：rounded＝20% 圓角、角落透明；fullbleed＝滿版方形。
// content：fit＝內容最長邊佔 66%；safe＝內容對角線收於 80% 安全圓（maskable）。
const TARGETS = [
  { file: 'icons/icon-192x192.png', size: 192, variant: 'rounded', content: 'fit' },
  { file: 'icons/icon-512x512.png', size: 512, variant: 'rounded', content: 'fit' },
  { file: 'icons/maskable-icon-512x512.png', size: 512, variant: 'fullbleed', content: 'safe' },
  { file: 'icons/apple-touch-icon.png', size: 180, variant: 'fullbleed', content: 'fit' },
  { file: 'icons/favicon-32x32.png', size: 32, variant: 'rounded', content: 'fit' },
];

const FIT_RATIO = 0.66;

// 於瀏覽器 canvas 內：讀 logomark alpha bbox → 置中縮放 → 疊上板底輸出 PNG。
async function renderIcon(page, markDataUri, target) {
  const dataUrl = await page.evaluate(
    async ({ markDataUri, size, variant, content, plateColor, fitRatio }) => {
      const img = new Image();
      img.src = markDataUri;
      await img.decode();

      // alpha bbox：以內容實際邊界置中，避免原始畫布留白造成視覺偏移。
      const probe = document.createElement('canvas');
      probe.width = img.naturalWidth;
      probe.height = img.naturalHeight;
      const probeCtx = probe.getContext('2d');
      probeCtx.drawImage(img, 0, 0);
      const { data, width, height } = probeCtx.getImageData(0, 0, probe.width, probe.height);
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) throw new Error('logomark 內容為全透明，無法生成 icon');
      const boxW = maxX - minX + 1;
      const boxH = maxY - minY + 1;

      const scale =
        content === 'safe'
          ? (0.8 * size) / Math.hypot(boxW, boxH)
          : (fitRatio * size) / Math.max(boxW, boxH);
      const drawW = boxW * scale;
      const drawH = boxH * scale;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = plateColor;
      if (variant === 'rounded') {
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.2);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, size, size);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        minX,
        minY,
        boxW,
        boxH,
        (size - drawW) / 2,
        (size - drawH) / 2,
        drawW,
        drawH,
      );
      return canvas.toDataURL('image/png');
    },
    { ...target, markDataUri, plateColor: PLATE_COLOR, fitRatio: FIT_RATIO },
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
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

const markDataUri = `data:image/png;base64,${readFileSync(LOGOMARK_PATH).toString('base64')}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const target of TARGETS) {
    const png = await renderIcon(page, markDataUri, target);
    writeFileSync(resolve(PUBLIC_DIR, target.file), png);
    console.log(`✅ ${target.file}（${png.length} bytes）`);
  }
  await page.close();
  generateFavicon();
  await verifyPngOutputs(browser);
  console.log('🎉 icons 生成完畢（SSOT：brand-src/logomark.png）');
} finally {
  await browser.close();
}
