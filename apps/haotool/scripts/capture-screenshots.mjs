/**
 * 五工具行動截圖腳本（快照制：手動 refresh、產物 commit，build 不抓 live 站）。
 *
 * 產物：public/screenshots/<toolId>-mobile.avif ＋ .webp ×5（hero 舞台／ToolCard 用）。
 * 規格：iPhone 13 viewport（390×844 @2x）對 live 站首屏截圖；輸出寬 520px；
 * AVIF 品質 60–70、單張 ≤60KB；等待 networkidle＋動畫靜置後再截。
 * SSOT：src/config/tools.ts（toolId 與 URL）。
 *
 * 依賴：monorepo root 既有 @playwright/test（WebP 由 Chromium canvas 編碼）；
 * AVIF 由 macOS 內建 sips 轉檔（Chromium canvas 不支援 AVIF 編碼，零 npm 依賴）。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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
const OUTPUT_DIR = resolve(__dirname, '../public/screenshots');
const MAX_BYTES = 60 * 1024;

// iPhone 13 版面（390×844）；任務規格指定 @2x（非裝置原生 @3x，控制檔重）。
// UA 維持 Chromium mobile 預設：iOS Safari UA 會觸發 ratewise 的 iPhone 安裝導引彈窗遮住首屏。
const VIEWPORT = { width: 390, height: 844 };
const DEVICE_SCALE_FACTOR = 2;
const OUTPUT_WIDTH = 520;
// 高度取偶數：sips AVIF 編碼奇數尺寸（4:2:0 chroma）產生 Chromium 解碼為全透明的壞檔。
const OUTPUT_HEIGHT = Math.round((VIEWPORT.height / VIEWPORT.width) * OUTPUT_WIDTH) & ~1;

// AVIF 品質範圍 60–70，由高往低找出 ≤60KB 的檔案。
const AVIF_QUALITIES = [70, 66, 62, 60];
const WEBP_QUALITIES = [0.82, 0.74, 0.66, 0.58];

const { TOOLS, getToolUrl } = await import('../src/config/tools.ts');

function encodeAvif(pngPath, avifPath) {
  for (const quality of AVIF_QUALITIES) {
    execFileSync('sips', [
      '-s',
      'format',
      'avif',
      '-s',
      'formatOptions',
      String(quality),
      pngPath,
      '--out',
      avifPath,
    ]);
    const bytes = statSync(avifPath).size;
    if (bytes <= MAX_BYTES) {
      return { quality, bytes };
    }
  }
  throw new Error(`${avifPath} 於品質下限 60 仍超過 60KB`);
}

async function encodeWebp(page, pngBuffer, webpPath) {
  for (const quality of WEBP_QUALITIES) {
    const dataUrl = await page.evaluate(
      async ({ pngBase64, width, height, q }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${pngBase64}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL('image/webp', q);
      },
      {
        pngBase64: pngBuffer.toString('base64'),
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        q: quality,
      },
    );
    const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
    if (bytes.length <= MAX_BYTES) {
      writeFileSync(webpPath, bytes);
      return { quality, bytes: bytes.length };
    }
  }
  throw new Error(`${webpPath} 於最低 WebP 品質仍超過 60KB`);
}

// 抽樣統計畫面內容比例（非近白像素佔比），偵測 hydration 未完成的白屏。
async function measureInkRatio(workPage, pngBuffer) {
  return workPage.evaluate(async (pngBase64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${pngBase64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let ink = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 64) {
      total += 1;
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) ink += 1;
    }
    return ink / total;
  }, pngBuffer.toString('base64'));
}

// 動畫凍結 CSS：headless 下 Framer Motion 進場（inline opacity: 0）偶發凍結於
// 初始幀（rAF timestamp 虛擬化）→ 白屏。以 !important 蓋過 inline style 呈現終值，
// 並停用其餘 animation/transition，確保畫面可靜置。
const FREEZE_ANIMATIONS_CSS = `
  [style*="opacity"] { opacity: 1 !important; transform: none !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

// 隱藏 PWA「已可離線使用」等暫時性浮動提示（vite-plugin-pwa offline-ready toast），
// 素材呈現產品介面本體：由文案葉節點向上找最近的 fixed/absolute 容器整塊隱藏；
// 面積 ≥50% 視口者視為版面本體，不隱藏。
async function dismissTransientUi(page) {
  await page
    .evaluate(() => {
      const pattern = /已可離線使用|offline ready/i;
      for (const el of document.querySelectorAll('body *')) {
        if (el.children.length > 0 || !pattern.test(el.textContent ?? '')) continue;
        let node = el;
        while (node && node !== document.body) {
          const position = getComputedStyle(node).position;
          if (position === 'fixed' || position === 'absolute') {
            const rect = node.getBoundingClientRect();
            const viewportArea = window.innerWidth * window.innerHeight;
            if (rect.width * rect.height < viewportArea * 0.5) {
              node.style.display = 'none';
            }
            break;
          }
          node = node.parentElement;
        }
      }
    })
    .catch(() => {});
}

// 等待首屏穩定：有實際內容（非白屏）且連續兩幀 bytes 相同（動畫靜置）。
// 逾時回傳最後一張有內容的幀（可能 null），交由上層分層決策。
async function waitForStableFrame(page, workPage, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let previous = null;
  let lastContentFrame = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(1_000);
    // 對目標頁執行 rAF round-trip：headless 背景 renderer 的 BeginFrame 排程
    // 會停擺（rAF 不推進 → Framer 進場凍結在 opacity 0），evaluate 可喚醒。
    await page
      .evaluate(() => new Promise((done) => requestAnimationFrame(() => done(true))))
      .catch(() => {});
    await dismissTransientUi(page);
    const frame = await page.screenshot({ type: 'png' });
    const inkRatio = await measureInkRatio(workPage, frame);
    if (inkRatio >= 0.02) {
      if (previous && frame.equals(previous)) {
        return { frame, stable: true };
      }
      previous = frame;
      lastContentFrame = frame;
    } else {
      previous = null;
    }
  }
  return { frame: lastContentFrame, stable: false };
}

// headless 渲染凍結（DOM 有內容但 compositor 不 paint → 白屏）為隨機事件且
// 綁定 renderer process；重試一律開全新 page（新 process），不用 reload。
async function captureStableFrame(context, workPage, url, toolId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const page = await context.newPage();
    try {
      await page.bringToFront();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      // 靜置 6 秒：待 SW 註冊完成與「已可離線使用」等暫時性 toast 消失。
      await page.waitForTimeout(6_000);
      let result = await waitForStableFrame(page, workPage, 10_000);
      if (result.stable) return result.frame;

      // 凍結動畫後再等一輪；接受有內容的幀（最後一次嘗試的容錯）。
      await page.addStyleTag({ content: FREEZE_ANIMATIONS_CSS });
      result = await waitForStableFrame(page, workPage, 6_000);
      if (result.frame) return result.frame;
      console.warn(`⚠️ ${toolId} 第 ${attempt} 次嘗試白屏，改開新分頁重試`);
    } finally {
      await page.close();
    }
  }
  throw new Error(`${toolId} 首屏多次重試後仍為白屏，無法截圖`);
}

async function captureTool(context, workPage, tool, tmpDir) {
  const url = getToolUrl(tool);
  const pngBuffer = await captureStableFrame(context, workPage, url, tool.id);

  // 縮放至輸出寬 520px 的中介 PNG（AVIF/WebP 共用來源）。
  const resizedPngDataUrl = await workPage.evaluate(
    async ({ pngBase64, width, height }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${pngBase64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    },
    { pngBase64: pngBuffer.toString('base64'), width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT },
  );
  const resizedPng = Buffer.from(resizedPngDataUrl.split(',')[1], 'base64');
  const tmpPngPath = join(tmpDir, `${tool.id}.png`);
  writeFileSync(tmpPngPath, resizedPng);

  const avifPath = resolve(OUTPUT_DIR, `${tool.id}-mobile.avif`);
  const webpPath = resolve(OUTPUT_DIR, `${tool.id}-mobile.webp`);
  const avif = encodeAvif(tmpPngPath, avifPath);
  const webp = await encodeWebp(workPage, resizedPng, webpPath);
  console.log(
    `✅ ${tool.id}-mobile：avif ${avif.bytes} bytes（q${avif.quality}）、webp ${webp.bytes} bytes`,
  );
}

async function verifyOutputs(browser) {
  const page = await browser.newPage();
  for (const tool of TOOLS) {
    for (const ext of ['avif', 'webp']) {
      const filePath = resolve(OUTPUT_DIR, `${tool.id}-mobile.${ext}`);
      await page.goto(pathToFileURL(filePath).href);
      // 除尺寸外亦抽樣中心像素：偵測「可載入但解碼為全透明」的壞檔。
      const result = await page.evaluate(() => {
        const img = document.images[0];
        if (!img) return null;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(
          Math.floor(img.naturalWidth / 2),
          Math.floor(img.naturalHeight / 2),
          1,
          1,
        ).data;
        return { width: img.naturalWidth, height: img.naturalHeight, alpha: px[3] };
      });
      if (
        !result ||
        result.width !== OUTPUT_WIDTH ||
        result.height !== OUTPUT_HEIGHT ||
        result.alpha !== 255
      ) {
        throw new Error(`${tool.id}-mobile.${ext} 驗證失敗：${JSON.stringify(result)}`);
      }
      console.log(
        `🔍 ${tool.id}-mobile.${ext} 可載入，${result.width}×${result.height}，內容不透明`,
      );
    }
  }
  await page.close();
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const tmpDir = join(tmpdir(), `haotool-screenshots-${process.pid}`);
mkdirSync(tmpDir, { recursive: true });

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
  });
  const workPage = await browser.newPage();
  for (const tool of TOOLS) {
    await captureTool(context, workPage, tool, tmpDir);
  }
  await workPage.close();
  await context.close();
  await verifyOutputs(browser);
  console.log(`🎉 五工具行動截圖完成（${OUTPUT_WIDTH}×${OUTPUT_HEIGHT}，AVIF＋WebP）`);
} finally {
  await browser.close();
  rmSync(tmpDir, { recursive: true, force: true });
}
