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
 * 1. Sitemap 2026 標準 (verify-sitemap-2026.mjs)
 * 2. Breadcrumb Schema (verify-breadcrumb-schema.mjs)
 * 3. JSON-LD 結構化數據 (verify-structured-data.mjs)
 * 4. 歷史資料與日期新鮮度 (verify-history-data.mjs)
 * 5. 預快取資產與離線關鍵檔 (verify-precache-assets.mjs)
 * 6. Sitemap 與 SSG route 對齊 (verify-sitemap-ssg.mjs)
 *
 * 使用時機：
 * - CI/CD pipeline (GitHub Actions)
 * - Pre-commit hooks (husky)
 * - 手動審計 (pnpm seo:audit)
 * - 生產環境部署前驗證
 *
 * 建立時間: 2026-05-02
 * BDD 階段: Stage 7 GREEN
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';
import { SEO_STANDARD_LABEL } from './lib/seo-year-metadata.mjs';

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

  // 安全性：白名單驗證腳本名稱
  const allowedScripts = [
    'verify-sitemap-2026.mjs',
    'verify-breadcrumb-schema.mjs',
    'verify-structured-data.mjs',
    'verify-history-data.mjs',
    'verify-precache-assets.mjs',
    'verify-sitemap-ssg.mjs',
  ];

  const scriptName = basename(scriptPath);
  if (!allowedScripts.includes(scriptName)) {
    log(colors.red, '❌', `不允許的腳本: ${scriptName}`);
    return false;
  }

  // 使用 resolve 確保路徑安全
  const safeScriptPath = resolve(__dirname, scriptName);

  if (!existsSync(safeScriptPath)) {
    log(colors.yellow, '⚠', `腳本不存在: ${safeScriptPath}`);
    return false;
  }

  try {
    const result = spawnSync('node', [safeScriptPath], {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
      env: { ...process.env },
    });

    if (result.error || result.status !== 0) {
      log(colors.red, '❌', `${name} 驗證失敗`);
      return false;
    }

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
  header(`RateWise SEO 完整審計 - ${SEO_STANDARD_LABEL}`);

  console.log('📋 審計範圍:');
  console.log(`  1. ${SEO_STANDARD_LABEL} 合規性`);
  console.log('  2. Breadcrumb Schema 正確性');
  console.log('  3. JSON-LD 結構化數據完整性');
  console.log('  4. 歷史資料與日期新鮮度');
  console.log('  5. 預快取資產與離線關鍵檔');
  console.log('  6. Sitemap 與 SSG route 對齊');

  // 檢查 dist 目錄
  if (!checkDistExists()) {
    process.exit(1);
  }

  const results = {
    sitemap: false,
    breadcrumb: false,
    structuredData: false,
    historyData: false,
    precache: false,
    sitemapSsg: false,
    total: 0,
    passed: 0,
    failed: 0,
  };

  // 1. Sitemap 標準驗證
  header(`1. ${SEO_STANDARD_LABEL} 驗證`);
  results.sitemap = runVerification(
    resolve(__dirname, 'verify-sitemap-2026.mjs'),
    SEO_STANDARD_LABEL,
  );
  results.total++;
  if (results.sitemap) results.passed++;
  else results.failed++;

  // 2. Breadcrumb Schema 驗證
  header('2. Breadcrumb Schema 驗證');
  results.breadcrumb = runVerification(
    resolve(__dirname, 'verify-breadcrumb-schema.mjs'),
    'Breadcrumb Schema',
  );
  results.total++;
  if (results.breadcrumb) results.passed++;
  else results.failed++;

  // 3. JSON-LD 結構化數據驗證
  header('3. JSON-LD 結構化數據驗證');
  results.structuredData = runVerification(
    resolve(__dirname, 'verify-structured-data.mjs'),
    'JSON-LD 結構化數據',
  );
  results.total++;
  if (results.structuredData) results.passed++;
  else results.failed++;

  // 4. 歷史資料與日期新鮮度
  header('4. 歷史資料與日期新鮮度');
  results.historyData = runVerification(
    resolve(__dirname, 'verify-history-data.mjs'),
    '歷史資料與日期新鮮度',
  );
  results.total++;
  if (results.historyData) results.passed++;
  else results.failed++;

  // 5. 預快取資產與離線關鍵檔
  header('5. 預快取資產與離線關鍵檔');
  results.precache = runVerification(
    resolve(__dirname, 'verify-precache-assets.mjs'),
    '預快取資產與離線關鍵檔',
  );
  results.total++;
  if (results.precache) results.passed++;
  else results.failed++;

  // 6. Sitemap 與 SSG route 對齊
  header('6. Sitemap 與 SSG route 對齊');
  results.sitemapSsg = runVerification(
    resolve(__dirname, 'verify-sitemap-ssg.mjs'),
    'Sitemap 與 SSG route 對齊',
  );
  results.total++;
  if (results.sitemapSsg) results.passed++;
  else results.failed++;

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
  console.log('  [ ] 使用 Google Rich Results Test 線上驗證');
  console.log('  [ ] 使用 Google Search Console 提交 sitemap');
  console.log('  [ ] 檢查 Lighthouse SEO 評分 (目標 >= 98/100)');

  // 建議下一步
  console.log('\n🚀 建議下一步:');
  if (results.failed > 0) {
    console.log('  1. 修復失敗的驗證項目');
    console.log('  2. 重新執行審計腳本');
  } else {
    console.log('  1. 建置並部署到生產環境');
    console.log('  2. 提交 sitemap 到 Google Search Console');
    console.log('  3. 監控 Search Console 索引狀態');
    console.log('  4. 以正式站做一次 Rich Results / Lighthouse 抽驗');
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
