#!/usr/bin/env node
/**
 * 圖片資源存在性驗證腳本
 *
 * 功能：驗證 IMAGE_RESOURCES 中定義的所有圖片文件是否實際存在
 *
 * 用法：
 *   node scripts/verify-image-resources.mjs
 *
 * 建立時間: 2025-12-14
 * 依據: [P0 Priority] 防止構建後圖片 404
 */

import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 SSOT 導入配置
import { IMAGE_RESOURCES } from '../apps/ratewise/seo-paths.config.mjs';

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 檢查圖片文件是否存在
 */
function checkImageExists(imagePath, publicDir) {
  const fullPath = join(publicDir, imagePath);
  const exists = existsSync(fullPath);

  let size = null;
  let isFile = false;

  if (exists) {
    const stats = statSync(fullPath);
    isFile = stats.isFile();
    size = stats.size;
  }

  return {
    path: imagePath,
    fullPath,
    exists,
    isFile,
    size,
  };
}

async function main() {
  console.log('\n🖼️  圖片資源存在性驗證');
  console.log('─'.repeat(50));

  const publicDir = join(__dirname, '../apps/ratewise/public');
  console.log(`📂 Public 目錄: ${publicDir}\n`);

  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  // 檢查所有圖片資源
  console.log('🔍 檢查圖片資源:');
  for (const imagePath of IMAGE_RESOURCES) {
    const result = checkImageExists(imagePath, publicDir);
    results.push(result);

    if (!result.exists) {
      log(colors.red, '✗', `${imagePath} - 文件不存在`);
      hasErrors = true;
    } else if (!result.isFile) {
      log(colors.red, '✗', `${imagePath} - 不是文件（可能是目錄）`);
      hasErrors = true;
    } else if (result.size === 0) {
      log(colors.yellow, '⚠', `${imagePath} - 文件為空 (0 bytes)`);
      hasWarnings = true;
    } else if (result.size < 100) {
      log(colors.yellow, '⚠', `${imagePath} - 文件過小 (${formatFileSize(result.size)})`);
      hasWarnings = true;
    } else {
      log(colors.green, '✓', `${imagePath} - ${formatFileSize(result.size)}`);
    }
  }

  // 統計結果
  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 驗證結果統計:');

  const total = results.length;
  const existing = results.filter((r) => r.exists && r.isFile).length;
  const missing = results.filter((r) => !r.exists).length;
  const invalid = results.filter((r) => r.exists && !r.isFile).length;
  const empty = results.filter((r) => r.exists && r.isFile && r.size === 0).length;

  console.log(`  總計圖片: ${total}`);
  console.log(`  ${colors.green}✓${colors.reset} 存在: ${existing}`);
  if (missing > 0) {
    console.log(`  ${colors.red}✗${colors.reset} 缺失: ${missing}`);
  }
  if (invalid > 0) {
    console.log(`  ${colors.red}✗${colors.reset} 無效: ${invalid}`);
  }
  if (empty > 0) {
    console.log(`  ${colors.yellow}⚠${colors.reset} 空文件: ${empty}`);
  }

  // 總大小
  const totalSize = results.filter((r) => r.exists && r.isFile).reduce((sum, r) => sum + r.size, 0);
  console.log(`  總大小: ${formatFileSize(totalSize)}`);

  console.log('\n' + '─'.repeat(50));

  if (hasErrors) {
    console.log('\n❌ 驗證失敗！');
    console.log('\n💡 修復建議:');
    console.log('  1. 檢查缺失的圖片文件');
    console.log('  2. 確保所有圖片已放置在 apps/ratewise/public/ 目錄');
    console.log('  3. 檢查文件名是否正確（區分大小寫）');
    console.log('  4. 如果圖片已移除，請更新 seo-paths.config.mjs\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('\n⚠️  驗證通過，但有警告');
    console.log('  建議檢查空文件或過小的圖片\n');
    process.exit(0);
  } else {
    log(colors.green, '\n✅', '所有圖片資源驗證通過！\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
