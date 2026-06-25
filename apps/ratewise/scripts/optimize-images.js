#!/usr/bin/env node
/**
 * 圖片優化腳本 - 使用 sharp 自動生成多尺寸和現代格式
 *
 * 參考權威來源：
 * - [sharp] https://sharp.pixelplumbing.com/ - 高效能 Node.js 圖片處理
 * - [web.dev] https://web.dev/articles/optimize-lcp - LCP 優化最佳實踐
 * - [MDN] https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types - 圖片格式指南
 *
 * Linus 原則：
 * 1. 簡單直接 - 一個腳本處理所有圖片優化
 * 2. 無特殊情況 - 統一的處理邏輯
 * 3. 效能優先 - 使用 sharp（比 ImageMagick 快 4-5x）
 */

import sharp from 'sharp';
import { statSync } from 'node:fs';
import { readdir, mkdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { APP_INFO } from '../src/config/app-info.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const CONFIG = {
  inputDir: join(__dirname, '../public'),
  outputDir: join(__dirname, '../public/optimized'),

  // 響應式圖片尺寸（基於常見設備寬度）
  sizes: [
    { width: 112, suffix: '-112w' }, // logo 實際顯示尺寸
    { width: 192, suffix: '-192w' }, // PWA icon
    { width: 384, suffix: '-384w' }, // 2x retina
    { width: 512, suffix: '-512w' }, // PWA icon
    { width: 768, suffix: '-768w' }, // tablet
    { width: 1024, suffix: '-1024w' }, // desktop
  ],

  // 輸出格式（按優先級排序）
  formats: [
    { ext: 'avif', quality: 80 }, // 最佳壓縮率
    { ext: 'webp', quality: 85 }, // 廣泛支援
    { ext: 'png', quality: 90 }, // fallback
  ],

  // 需要優化的圖片
  targets: ['logo.png', 'apple-touch-icon.png', 'og-image.png', 'twitter-image.png'],
};

/**
 * PWA 安裝指引海報配置（直式長圖，顯示於最大寬度約 344px 的提示卡）
 *
 * 與主 CONFIG 共用 sharp 與品質基準（avif q80 / webp q85 / png q90），
 * 但海報為固定尺寸顯示，毋須完整響應式階梯：avif/webp 維持 640w 覆蓋 ~2x retina，
 * PNG 僅作為極舊瀏覽器深度 fallback，下採樣並量化壓縮以避免 ~500KB 體積。
 *
 * 來源 master 置於 scripts/source-images（不部署），輸出至 public/pwa-install。
 */
const POSTER_CONFIG = {
  sourceDir: join(__dirname, 'source-images/pwa-install'),
  outputDir: join(__dirname, '../public/pwa-install'),
  displayWidth: 640,
  fallbackWidth: 512,
  modernFormats: [
    { ext: 'avif', quality: 80 },
    { ext: 'webp', quality: 85 },
  ],
  targets: ['ios-install-guide.png', 'android-install-guide.png'],
};

/**
 * 優化單張 PWA 安裝海報
 */
async function optimizePoster(inputPath, filename) {
  console.log(`\n🖼️  海報: ${filename}`);

  const baseName = basename(filename, extname(filename));
  const results = [];

  for (const format of POSTER_CONFIG.modernFormats) {
    const outputPath = join(POSTER_CONFIG.outputDir, `${baseName}.${format.ext}`);
    await sharp(inputPath)
      .resize(POSTER_CONFIG.displayWidth, null, { fit: 'inside', withoutEnlargement: true })
      .toFormat(format.ext, { quality: format.quality })
      .toFile(outputPath);
    const kb = (statSync(outputPath).size / 1024).toFixed(0);
    results.push({ file: `${baseName}.${format.ext}`, kb });
    console.log(`  ✅ ${baseName}.${format.ext} (${POSTER_CONFIG.displayWidth}w, ${kb}KB)`);
  }

  const pngPath = join(POSTER_CONFIG.outputDir, `${baseName}.png`);
  await sharp(inputPath)
    .resize(POSTER_CONFIG.fallbackWidth, null, { fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toFile(pngPath);
  const pngKb = (statSync(pngPath).size / 1024).toFixed(0);
  results.push({ file: `${baseName}.png`, kb: pngKb });
  console.log(`  ✅ ${baseName}.png (${POSTER_CONFIG.fallbackWidth}w fallback, ${pngKb}KB)`);

  return results;
}

/**
 * 優化單張圖片
 */
async function optimizeImage(inputPath, filename) {
  console.log(`\n🖼️  處理: ${filename}`);

  const baseName = basename(filename, extname(filename));
  const results = [];

  for (const size of CONFIG.sizes) {
    for (const format of CONFIG.formats) {
      const outputFilename = `${baseName}${size.suffix}.${format.ext}`;
      const outputPath = join(CONFIG.outputDir, outputFilename);

      try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // 只在原圖尺寸大於目標尺寸時才縮放
        if (metadata.width > size.width) {
          await image
            .resize(size.width, null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .toFormat(format.ext, { quality: format.quality })
            .toFile(outputPath);

          const stats = await sharp(outputPath).metadata();
          results.push({
            file: outputFilename,
            size: `${size.width}x${stats.height}`,
            format: format.ext,
          });

          console.log(`  ✅ ${outputFilename} (${size.width}x${stats.height})`);
        }
      } catch (error) {
        console.error(`  ❌ 失敗: ${outputFilename}`, error.message);
      }
    }
  }

  return results;
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始圖片優化...\n');
  console.log('📁 輸入目錄:', CONFIG.inputDir);
  console.log('📁 輸出目錄:', CONFIG.outputDir);

  // 建立輸出目錄
  try {
    await mkdir(CONFIG.outputDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }

  // 處理所有目標圖片
  const allResults = [];
  for (const target of CONFIG.targets) {
    const inputPath = join(CONFIG.inputDir, target);
    try {
      const results = await optimizeImage(inputPath, target);
      allResults.push(...results);
    } catch (error) {
      console.error(`❌ 無法處理 ${target}:`, error.message);
    }
  }

  // 處理 PWA 安裝指引海報
  await mkdir(POSTER_CONFIG.outputDir, { recursive: true });
  for (const target of POSTER_CONFIG.targets) {
    const inputPath = join(POSTER_CONFIG.sourceDir, target);
    try {
      const results = await optimizePoster(inputPath, target);
      allResults.push(...results);
    } catch (error) {
      console.error(`❌ 無法處理海報 ${target}:`, error.message);
    }
  }

  // 輸出摘要
  console.log('\n' + '='.repeat(60));
  console.log('✅ 優化完成！');
  console.log(`📊 總共生成 ${allResults.length} 個優化圖片`);
  console.log('='.repeat(60));

  // 輸出使用範例
  console.log('\n📝 使用範例（響應式圖片）：');
  console.log(
    `
<picture>
  <source
    type="image/avif"
    srcset="
      /optimized/logo-112w.avif 112w,
      /optimized/logo-192w.avif 192w,
      /optimized/logo-384w.avif 384w
    "
    sizes="(max-width: 768px) 112px, 192px"
  />
  <source
    type="image/webp"
    srcset="
      /optimized/logo-112w.webp 112w,
      /optimized/logo-192w.webp 192w,
      /optimized/logo-384w.webp 384w
    "
    sizes="(max-width: 768px) 112px, 192px"
  />
  <img
    src="/optimized/logo-192w.png"
    alt="${APP_INFO.shortName} Logo"
    width="112"
    height="112"
    loading="lazy"
    decoding="async"
  />
</picture>
  `.trim(),
  );
}

main().catch(console.error);
