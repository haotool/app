#!/usr/bin/env node
/**
 * SSOT 同步驗證腳本
 *
 * 功能：驗證 TypeScript SSOT 和 JavaScript SSOT 的路徑配置是否一致
 *
 * 用法：
 *   node scripts/verify-ssot-sync.mjs
 *
 * 建立時間: 2025-12-14
 * 依據: [P0 Priority] 防止 SSOT 不同步
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * 從 TypeScript 文件中提取路徑數組
 */
function extractPathsFromTS(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // 提取 SEO_PATHS 數組
  const pathsMatch = content.match(/export const SEO_PATHS = \[([\s\S]*?)\] as const;/);
  if (!pathsMatch) {
    throw new Error('無法從 TypeScript 文件中提取 SEO_PATHS');
  }

  // 提取所有路徑（移除註釋和空白）
  const paths = pathsMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith("'") || line.startsWith('"'))
    .map((line) => {
      const match = line.match(/['"](.+?)['"]/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  return paths;
}

/**
 * 從 JavaScript (.mjs) 文件中提取路徑數組
 */
function extractPathsFromMJS(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // 提取 SEO_PATHS 數組
  const pathsMatch = content.match(/export const SEO_PATHS = \[([\s\S]*?)\];/);
  if (!pathsMatch) {
    throw new Error('無法從 .mjs 文件中提取 SEO_PATHS');
  }

  // 提取所有路徑（移除註釋和空白）
  const paths = pathsMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith("'") || line.startsWith('"'))
    .map((line) => {
      const match = line.match(/['"](.+?)['"]/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  return paths;
}

/**
 * 比較兩個路徑數組
 */
function comparePaths(tsPaths, mjsPaths) {
  const errors = [];

  // 檢查數量
  if (tsPaths.length !== mjsPaths.length) {
    errors.push(
      `路徑數量不一致: TypeScript (${tsPaths.length}) vs JavaScript (${mjsPaths.length})`,
    );
  }

  // 檢查順序和內容
  const maxLength = Math.max(tsPaths.length, mjsPaths.length);
  for (let i = 0; i < maxLength; i++) {
    const tsPath = tsPaths[i];
    const mjsPath = mjsPaths[i];

    if (tsPath !== mjsPath) {
      errors.push(`位置 ${i}: TypeScript "${tsPath}" ≠ JavaScript "${mjsPath}"`);
    }
  }

  // 檢查是否有缺少或多餘的路徑
  const tsSet = new Set(tsPaths);
  const mjsSet = new Set(mjsPaths);

  const onlyInTS = tsPaths.filter((p) => !mjsSet.has(p));
  const onlyInMJS = mjsPaths.filter((p) => !tsSet.has(p));

  if (onlyInTS.length > 0) {
    errors.push(`只存在於 TypeScript: ${onlyInTS.join(', ')}`);
  }

  if (onlyInMJS.length > 0) {
    errors.push(`只存在於 JavaScript: ${onlyInMJS.join(', ')}`);
  }

  return errors;
}

async function main() {
  console.log('\n🔍 SSOT 同步驗證');
  console.log('─'.repeat(50));

  const tsPath = join(__dirname, '../apps/ratewise/src/config/seo-paths.ts');
  const mjsPath = join(__dirname, '../apps/ratewise/seo-paths.config.mjs');

  let hasErrors = false;

  try {
    // 1. 提取路徑
    console.log('\n📂 讀取配置文件:');
    log(colors.cyan, '→', 'TypeScript: src/config/seo-paths.ts');
    const tsPaths = extractPathsFromTS(tsPath);
    log(colors.green, '✓', `提取 ${tsPaths.length} 個路徑`);

    log(colors.cyan, '→', 'JavaScript: seo-paths.config.mjs');
    const mjsPaths = extractPathsFromMJS(mjsPath);
    log(colors.green, '✓', `提取 ${mjsPaths.length} 個路徑`);

    // 2. 比較路徑
    console.log('\n🔄 比較路徑配置:');
    const errors = comparePaths(tsPaths, mjsPaths);

    if (errors.length === 0) {
      log(colors.green, '✅', 'SSOT 完全同步！');
      console.log(`\n   TypeScript 路徑: ${tsPaths.length}`);
      console.log(`   JavaScript 路徑: ${mjsPaths.length}`);
      console.log(`   一致性檢查: 通過`);
    } else {
      log(colors.red, '❌', 'SSOT 不同步，發現以下問題:');
      errors.forEach((error) => {
        log(colors.red, '  ✗', error);
      });
      hasErrors = true;
    }

    // 3. 顯示路徑列表（僅在錯誤時）
    if (hasErrors) {
      console.log('\n📋 詳細路徑列表:');
      console.log('\nTypeScript SSOT:');
      tsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      console.log('\nJavaScript SSOT:');
      mjsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    }
  } catch (error) {
    log(colors.red, '❌', `驗證失敗: ${error.message}`);
    hasErrors = true;
  }

  console.log('\n' + '─'.repeat(50));

  if (hasErrors) {
    console.log('\n💡 修復建議:');
    console.log('  1. 檢查 src/config/seo-paths.ts 和 seo-paths.config.mjs');
    console.log('  2. 確保兩個文件的 SEO_PATHS 數組完全一致');
    console.log('  3. 路徑必須按照相同順序排列');
    console.log('  4. 路徑格式必須一致（包括尾斜線）\n');
    process.exit(1);
  } else {
    console.log('');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
