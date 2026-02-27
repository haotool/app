#!/usr/bin/env node
/* eslint-env node */
/**
 * 為 GitHub Actions 生成應用環境變數 - SSOT
 *
 * 功能:
 * 1. 從所有 app.config.mjs 動態讀取 siteUrl
 * 2. 生成 GitHub Actions 環境變數格式
 * 3. 消除 workflow 中的硬編碼
 *
 * 用法:
 *   node scripts/generate-app-env-vars.mjs
 *
 * 輸出格式:
 *   RATEWISE_BASE_URL=https://app.haotool.org/ratewise
 *   NIHONNAME_BASE_URL=https://app.haotool.org/nihonname
 *   ...
 *
 * 在 GitHub Actions 中使用:
 *   - name: Set dynamic env vars
 *     run: |
 *       node scripts/generate-app-env-vars.mjs >> $GITHUB_ENV
 *
 * 建立時間: 2026-02-27
 * 依據: [Linus: Single Source of Truth][消除硬編碼]
 */

import { discoverApps } from './lib/workspace-utils.mjs';

async function main() {
  try {
    // 自動發現所有 apps
    const apps = await discoverApps();

    if (apps.length === 0) {
      console.error('❌ No apps discovered!');
      process.exit(1);
    }

    // 為每個 app 生成環境變數
    for (const app of apps) {
      const { name, config } = app;

      if (!config.siteUrl) {
        console.warn(`⚠️  ${name}: Missing siteUrl in app.config.mjs`);
        continue;
      }

      // 生成大寫環境變數名稱
      // 例如: ratewise -> RATEWISE_BASE_URL
      //      nihonname -> NIHONNAME_BASE_URL
      //      park-keeper -> PARK_KEEPER_BASE_URL
      const envVarName = name.toUpperCase().replace(/-/g, '_') + '_BASE_URL';

      // 輸出到 stdout (可直接重定向到 $GITHUB_ENV)
      console.log(`${envVarName}=${config.siteUrl}`);
    }

    // 成功退出
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating env vars:', error.message);
    process.exit(1);
  }
}

main();
