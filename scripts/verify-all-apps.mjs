#!/usr/bin/env node
/* eslint-env node */
/**
 * 批次檢測所有 apps 的生產環境 SEO
 *
 * 功能:
 * 1. 自動發現所有 apps (從 workspace-utils.mjs)
 * 2. 依序執行每個 app 的 SEO 健康檢查
 * 3. 輸出總結報告
 *
 * 用法:
 *   node scripts/verify-all-apps.mjs
 *
 * 建立時間: 2025-12-15
 * 依據: [Linus: 消除特殊情況][自動化優於手動]
 */

import { discoverApps } from './lib/workspace-utils.mjs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bold}${colors.cyan}🔍 批次 SEO 健康檢查 - 所有 Apps${colors.reset}`);
  console.log('='.repeat(70));

  // 自動發現所有 apps
  const apps = await discoverApps();

  if (apps.length === 0) {
    console.error(`\n${colors.red}❌ 未發現任何 apps！${colors.reset}`);
    console.error('請確保每個 app 目錄都包含 app.config.mjs');
    process.exit(1);
  }

  console.log(`\n📦 發現 ${apps.length} 個 apps，開始批次檢測...\n`);

  const results = [];
  const startTime = Date.now();

  // 依序檢測每個 app
  for (const app of apps) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${colors.bold}${colors.cyan}📦 檢測: ${app.config.displayName}${colors.reset}`);
    console.log(`🌐 URL: ${app.config.siteUrl}`);
    console.log(`📊 路由數: ${app.config.seoPaths.length}`);
    console.log('='.repeat(70));

    const appStartTime = Date.now();

    try {
      execSync(`node ${join(__dirname, 'verify-production-seo.mjs')} ${app.name}`, {
        stdio: 'inherit',
      });

      const duration = ((Date.now() - appStartTime) / 1000).toFixed(1);

      results.push({
        app: app.name,
        displayName: app.config.displayName,
        status: 'success',
        duration: `${duration}s`,
        routes: app.config.seoPaths.length,
      });
    } catch (error) {
      const duration = ((Date.now() - appStartTime) / 1000).toFixed(1);

      results.push({
        app: app.name,
        displayName: app.config.displayName,
        status: 'failed',
        duration: `${duration}s`,
        routes: app.config.seoPaths.length,
      });
    }
  }

  // 輸出總結
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.bold}${colors.cyan}📊 檢測結果總結${colors.reset}`);
  console.log('='.repeat(70));

  // 統計數據
  const totalRoutes = results.reduce((sum, r) => sum + r.routes, 0);
  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  console.log(`\n總計: ${apps.length} apps, ${totalRoutes} routes`);
  console.log(`耗時: ${totalDuration}s\n`);

  // 逐一顯示結果
  for (const result of results) {
    const icon = result.status === 'success' ? `${colors.green}✅` : `${colors.red}❌`;
    const status = result.status === 'success' ? `${colors.green}通過` : `${colors.red}失敗`;
    console.log(
      `${icon} ${colors.bold}${result.displayName}${colors.reset}: ${status}${colors.reset} (${result.routes} routes, ${result.duration})`,
    );
  }

  console.log('\n' + '='.repeat(70));

  // 最終判定
  if (failedCount > 0) {
    log(colors.red, '❌', `${failedCount}/${apps.length} apps 檢測失敗！請查看上方詳細錯誤訊息。`);
    console.log('');
    process.exit(1);
  } else {
    log(
      colors.green,
      '✅',
      `所有 ${apps.length} apps 檢測通過！總計 ${totalRoutes} 條路由全數返回 200。`,
    );
    console.log('');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('批次檢測腳本錯誤:', error);
  process.exit(1);
});
