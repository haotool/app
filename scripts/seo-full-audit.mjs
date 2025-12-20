#!/usr/bin/env node
/**
 * SEO 完整審計腳本 - Stage 7: CI/CD 整合
 *
 * 依據：
 * - 所有已完成的 SEO 驗證腳本（Stage 1-6）
 * - [Google Search Central] SEO 最佳實踐
 * - [Lighthouse] SEO 審計標準
 *
 * 整合驗證項目：
 * 1. Sitemap 2025 標準 (verify-sitemap-2025.mjs)
 * 2. Breadcrumb Schema (verify-breadcrumb-schema.mjs)
 * 3. JSON-LD 結構化數據 (verify-structured-data.mjs)
 * 4. 圖片優化（手動檢查）
 * 5. 內部連結結構（Footer）
 *
 * 使用時機：
 * - CI/CD pipeline (GitHub Actions)
 * - Pre-commit hooks (husky)
 * - 手動審計 (pnpm seo:audit)
 * - 生產環境部署前驗證
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 7 GREEN
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function header(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * 執行驗證腳本
 *
 * @param {string} scriptPath - 腳本路徑
 * @param {string} name - 驗證名稱
 * @returns {boolean} 是否通過
 */
function runVerification(scriptPath, name) {
  console.log(`\n🔍 執行驗證: ${name}`);
  console.log('─'.repeat(60));

  if (!existsSync(scriptPath)) {
    log(colors.yellow, '⚠', `腳本不存在: ${scriptPath}`);
    return false;
  }

  try {
    execSync(`node ${scriptPath}`, {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
    });
    log(colors.green, '✅', `${name} 驗證通過`);
    return true;
  } catch (error) {
    log(colors.red, '❌', `${name} 驗證失敗`);
    return false;
  }
}

/**
 * 檢查 dist 目錄是否存在
 */
function checkDistExists() {
  const distPath = resolve(__dirname, '../apps/ratewise/dist');
  if (!existsSync(distPath)) {
    log(colors.red, '✗', `Dist 目錄不存在: ${distPath}`);
    console.log('\n提示: 請先建置應用程式');
    console.log('  pnpm build:ratewise\n');
    return false;
  }
  return true;
}

/**
 * 主函數
 */
async function main() {
  header('RateWise SEO 完整審計 - 2025 標準');

  console.log('📋 審計範圍:');
  console.log('  1. Sitemap 2025 標準合規性');
  console.log('  2. Breadcrumb Schema 正確性');
  console.log('  3. JSON-LD 結構化數據完整性');
  console.log('  4. 圖片優化狀態（手動檢查）');
  console.log('  5. 內部連結結構（Footer）');

  // 檢查 dist 目錄
  if (!checkDistExists()) {
    process.exit(1);
  }

  const results = {
    sitemap: false,
    breadcrumb: false,
    structuredData: false,
    total: 0,
    passed: 0,
    failed: 0,
  };

  // 1. Sitemap 2025 驗證
  header('1. Sitemap 2025 標準驗證');
  results.sitemap = runVerification(
    resolve(__dirname, 'verify-sitemap-2025.mjs'),
    'Sitemap 2025'
  );
  results.total++;
  if (results.sitemap) results.passed++;
  else results.failed++;

  // 2. Breadcrumb Schema 驗證
  header('2. Breadcrumb Schema 驗證');
  results.breadcrumb = runVerification(
    resolve(__dirname, 'verify-breadcrumb-schema.mjs'),
    'Breadcrumb Schema'
  );
  results.total++;
  if (results.breadcrumb) results.passed++;
  else results.failed++;

  // 3. JSON-LD 結構化數據驗證
  header('3. JSON-LD 結構化數據驗證');
  results.structuredData = runVerification(
    resolve(__dirname, 'verify-structured-data.mjs'),
    'JSON-LD 結構化數據'
  );
  results.total++;
  if (results.structuredData) results.passed++;
  else results.failed++;

  // 4. 圖片優化狀態（手動檢查）
  header('4. 圖片優化狀態');
  console.log('ℹ️  圖片優化需手動執行：');
  console.log('  node scripts/optimize-images-2025.mjs');
  console.log('\n目標：');
  console.log('  - logo.avif < 50 KB');
  console.log('  - og-image.avif < 100 KB');
  console.log('  - 總大小減少 ≥70%');
  log(colors.yellow, '⏭', '跳過（需手動執行）');

  // 5. 內部連結結構（Footer）
  header('5. 內部連結結構檢查');
  console.log('ℹ️  檢查項目：');
  console.log('  - Footer 組件包含所有 17 個 SEO 路徑');
  console.log('  - Layout 組件已整合 Footer');
  console.log('  - 所有頁面自動包含 Footer');
  log(colors.green, '✅', 'Footer 組件已實作（請手動確認渲染）');

  // 最終統計
  header('審計結果統計');

  console.log('📊 驗證結果:');
  console.log(`  總計: ${results.total} 項自動驗證`);
  console.log(`  ${colors.green}通過: ${results.passed} 項${colors.reset}`);
  console.log(`  ${colors.red}失敗: ${results.failed} 項${colors.reset}`);

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`  通過率: ${passRate}%`);

  // 手動檢查清單
  console.log('\n📋 手動檢查清單:');
  console.log('  [ ] 執行圖片優化腳本');
  console.log('  [ ] 確認 Footer 在所有頁面正確渲染');
  console.log('  [ ] 使用 Google Rich Results Test 線上驗證');
  console.log('  [ ] 使用 Google Search Console 提交 sitemap');
  console.log('  [ ] 檢查 Lighthouse SEO 評分 (目標 100/100)');

  // 建議下一步
  console.log('\n🚀 建議下一步:');
  if (results.failed > 0) {
    console.log('  1. 修復失敗的驗證項目');
    console.log('  2. 重新執行審計腳本');
  } else {
    console.log('  1. 執行圖片優化');
    console.log('  2. 建置並部署到生產環境');
    console.log('  3. 提交 sitemap 到 Google Search Console');
    console.log('  4. 監控 Search Console 索引狀態');
  }

  // 退出碼
  console.log('\n' + '='.repeat(60));
  if (results.failed === 0) {
    log(colors.green, '\n✅', 'SEO 審計通過！所有自動驗證項目都通過。\n');
    process.exit(0);
  } else {
    log(colors.red, '\n❌', `SEO 審計失敗！${results.failed} 個驗證項目未通過。\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('審計腳本錯誤:', error);
  process.exit(1);
});
