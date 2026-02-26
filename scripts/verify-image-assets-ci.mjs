#!/usr/bin/env node
/* eslint-env node */
/**
 * CI 圖片資源驗證 - SSOT 動態發現所有 apps
 *
 * 從 app.config.mjs 的 resources.images 讀取每個 app 的必要圖片清單，
 * 驗證對應 public/ 目錄下檔案是否存在。
 *
 * 用法:
 *   node scripts/verify-image-assets-ci.mjs           # 驗證所有 apps
 *   node scripts/verify-image-assets-ci.mjs ratewise  # 僅驗證指定 app
 *
 * 依據: [workspace-utils.mjs discoverApps][SSOT app.config.mjs]
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  const appArg = process.argv[2];
  const apps = appArg ? [await loadAppConfig(appArg)].filter(Boolean) : await discoverApps();

  if (apps.length === 0) {
    console.error(`❌ No apps found${appArg ? ` for: ${appArg}` : ''}`);
    process.exit(1);
  }

  console.log('🖼️  Verifying image assets...\n');

  let hasErrors = false;
  let totalChecked = 0;

  for (const app of apps) {
    const images = app.config.resources?.images ?? [];
    if (images.length === 0) {
      console.log(
        `${colors.yellow}⚠${colors.reset} ${app.config.displayName}: no resources.images defined, skipping`,
      );
      continue;
    }

    const publicDir = join(app.path, 'public');
    console.log(`📂 ${app.config.displayName} (${images.length} images):`);

    for (const imagePath of images) {
      const fullPath = join(publicDir, imagePath.replace(/^\//, ''));
      totalChecked++;

      if (!existsSync(fullPath)) {
        console.error(`  ${colors.red}✗${colors.reset} ${imagePath} - NOT FOUND`);
        hasErrors = true;
        continue;
      }

      const stats = statSync(fullPath);
      if (!stats.isFile()) {
        console.error(`  ${colors.red}✗${colors.reset} ${imagePath} - not a file`);
        hasErrors = true;
        continue;
      }

      if (stats.size === 0) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${imagePath} - empty (0 bytes)`);
        continue;
      }

      console.log(`  ${colors.green}✓${colors.reset} ${imagePath} (${formatSize(stats.size)})`);
    }
  }

  console.log(`\n📊 Checked ${totalChecked} images across ${apps.length} apps`);

  if (hasErrors) {
    console.error('\n❌ Image asset verification failed!');
    process.exit(1);
  }

  console.log(`${colors.green}✅ All required images exist${colors.reset}`);
}

main().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
