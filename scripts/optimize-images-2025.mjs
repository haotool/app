#!/usr/bin/env node
/**
 * 圖片優化腳本 - 2025 標準（AVIF/WebP）
 *
 * 功能：
 * 1. 將現有 PNG/JPG 轉換為 AVIF（最小）
 * 2. 生成 WebP fallback（中等）
 * 3. 優化原始 PNG（最終 fallback）
 *
 * 依據：
 * - AVIF: 比 JPEG 小 50%，比 WebP 小 20%
 * - WebP: 96% 瀏覽器支援
 * - PNG: 100% 瀏覽器支援（fallback）
 *
 * 來源：
 * - [AI Bud WP](https://aibudwp.com/image-optimization-in-2025-webp-avif-srcset-and-preload/)
 * - [SearchX SEO](https://searchxpro.com/2025-guide-to-image-resizing-for-seo/)
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const PUBLIC_DIR = join(process.cwd(), 'apps/ratewise/public');

// 需要優化的圖片列表
const IMAGES_TO_OPTIMIZE = [
  'logo.png',
  'og-image.png',
  'twitter-image.png',
  'apple-touch-icon.png',
];

// 優化配置
const OPTIMIZATION_CONFIG = {
  avif: {
    quality: 75,
    effort: 6, // 0-9，越高壓縮越好但越慢
  },
  webp: {
    quality: 85,
    effort: 6,
  },
  png: {
    compressionLevel: 9,
    quality: 85,
  },
};

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function getFileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function optimizeImage(filename) {
  const inputPath = join(PUBLIC_DIR, filename);
  const baseName = basename(filename, extname(filename));
  const ext = extname(filename);

  if (!existsSync(inputPath)) {
    log(colors.yellow, '⚠', `跳過：${filename} 不存在`);
    return;
  }

  const originalSize = await getFileSize(inputPath);

  console.log(`\n處理：${filename} (${formatSize(originalSize)})`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const results = [];

    // 1. 生成 AVIF（最小，優先使用）
    const avifPath = join(PUBLIC_DIR, `${baseName}.avif`);
    await image.clone().avif(OPTIMIZATION_CONFIG.avif).toFile(avifPath);

    const avifSize = await getFileSize(avifPath);
    const avifSavings = (((originalSize - avifSize) / originalSize) * 100).toFixed(1);
    log(colors.green, '  ✓', `AVIF: ${formatSize(avifSize)} (省 ${avifSavings}%)`);
    results.push({ format: 'AVIF', size: avifSize, savings: avifSavings });

    // 2. 生成 WebP（fallback）
    const webpPath = join(PUBLIC_DIR, `${baseName}.webp`);
    await image.clone().webp(OPTIMIZATION_CONFIG.webp).toFile(webpPath);

    const webpSize = await getFileSize(webpPath);
    const webpSavings = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);
    log(colors.green, '  ✓', `WebP: ${formatSize(webpSize)} (省 ${webpSavings}%)`);
    results.push({ format: 'WebP', size: webpSize, savings: webpSavings });

    // 3. 優化原始 PNG（最終 fallback）
    if (ext === '.png') {
      const optimizedPngPath = join(PUBLIC_DIR, `${baseName}.optimized.png`);
      await image.clone().png(OPTIMIZATION_CONFIG.png).toFile(optimizedPngPath);

      const optimizedPngSize = await getFileSize(optimizedPngPath);
      const pngSavings = (((originalSize - optimizedPngSize) / originalSize) * 100).toFixed(1);
      log(colors.green, '  ✓', `PNG (優化): ${formatSize(optimizedPngSize)} (省 ${pngSavings}%)`);
      results.push({ format: 'PNG', size: optimizedPngSize, savings: pngSavings });

      // 替換原始文件
      const fs = await import('fs/promises');
      await fs.rename(optimizedPngPath, inputPath);
      log(colors.cyan, '  ℹ', `已替換原始 PNG`);
    }

    return { filename, originalSize, results };
  } catch (error) {
    log(colors.red, '  ✗', `優化失敗：${error.message}`);
    return { filename, originalSize, error: error.message };
  }
}

async function main() {
  console.log('\n🖼️  圖片優化 2025 標準（AVIF/WebP）');
  console.log('─'.repeat(60));
  console.log(`📂 目錄：${PUBLIC_DIR}\n`);

  // 檢查 sharp 是否已安裝
  try {
    await sharp();
  } catch (error) {
    log(colors.red, '❌', 'Sharp 未安裝！');
    console.log('\n請執行：pnpm add -D sharp');
    process.exit(1);
  }

  const allResults = [];

  // 優化所有圖片
  for (const filename of IMAGES_TO_OPTIMIZE) {
    const result = await optimizeImage(filename);
    if (result) {
      allResults.push(result);
    }
  }

  // 統計報告
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 優化結果統計:\n');

  let totalOriginal = 0;
  let totalOptimized = 0;

  allResults.forEach(({ filename, originalSize, results, error }) => {
    if (error) {
      console.log(`  ❌ ${filename}: ${error}`);
      return;
    }

    totalOriginal += originalSize;

    results.forEach(({ format, size }) => {
      if (format === 'AVIF') {
        totalOptimized += size; // 只計算 AVIF（最小）
      }
    });

    console.log(`  ✅ ${filename}:`);
    console.log(`     原始: ${formatSize(originalSize)}`);
    results.forEach(({ format, size, savings }) => {
      console.log(`     ${format}: ${formatSize(size)} (省 ${savings}%)`);
    });
  });

  const totalSavings = (((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1);

  console.log(`\n  總大小: ${formatSize(totalOriginal)} → ${formatSize(totalOptimized)}`);
  console.log(`  ${colors.green}總節省: ${totalSavings}%${colors.reset}`);

  console.log('\n' + '─'.repeat(60));

  if (totalSavings >= 70) {
    log(colors.green, '\n✅', '圖片優化完成！符合 2025 標準 (節省 ≥ 70%)\n');
    process.exit(0);
  } else {
    log(colors.yellow, '\n⚠️', `圖片優化完成，但節省比例 (${totalSavings}%) < 70%\n`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('優化腳本錯誤:', error);
  process.exit(1);
});
