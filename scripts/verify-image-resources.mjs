#!/usr/bin/env node
/**
 * 圖片資源存在性驗證 - 支援所有 apps（SSOT）
 *
 * 從 app.config.mjs 的 resources.images 讀取每個 app 的圖片清單，
 * 驗證 public/ 目錄下檔案是否存在。
 *
 * 用法：
 *   node scripts/verify-image-resources.mjs           # 驗證所有 apps
 *   node scripts/verify-image-resources.mjs ratewise  # 僅驗證指定 app
 *
 * 依據: [SSOT app.config.mjs][workspace-utils.mjs discoverApps]
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function checkImageExists(imagePath, publicDir) {
  const fullPath = join(publicDir, imagePath.replace(/^\//, ''));
  const exists = existsSync(fullPath);
  let size = null;
  let isFile = false;

  if (exists) {
    const stats = statSync(fullPath);
    isFile = stats.isFile();
    size = stats.size;
  }

  return { path: imagePath, fullPath, exists, isFile, size };
}

async function main() {
  const appArg = process.argv[2];
  const apps = appArg ? [await loadAppConfig(appArg)].filter(Boolean) : await discoverApps();

  if (apps.length === 0) {
    console.error(`❌ No apps found${appArg ? ` for: ${appArg}` : ''}`);
    process.exit(1);
  }

  console.log('\n🖼️  圖片資源存在性驗證');
  console.log('─'.repeat(50));

  let hasErrors = false;
  let hasWarnings = false;
  let totalChecked = 0;
  let totalSize = 0;

  for (const app of apps) {
    const images = app.config.resources?.images ?? [];
    if (images.length === 0) {
      console.log(
        `\n${colors.yellow}⚠${colors.reset} ${app.config.displayName}: no resources.images, skipping`,
      );
      continue;
    }

    const publicDir = join(app.path, 'public');
    console.log(`\n📂 ${app.config.displayName} (${publicDir}):`);

    for (const imagePath of images) {
      const result = checkImageExists(imagePath, publicDir);
      totalChecked++;

      if (!result.exists) {
        console.log(`  ${colors.red}✗${colors.reset} ${imagePath} - 文件不存在`);
        hasErrors = true;
      } else if (!result.isFile) {
        console.log(`  ${colors.red}✗${colors.reset} ${imagePath} - 不是文件`);
        hasErrors = true;
      } else if (result.size === 0) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${imagePath} - 文件為空 (0 bytes)`);
        hasWarnings = true;
      } else if (result.size < 100) {
        console.log(
          `  ${colors.yellow}⚠${colors.reset} ${imagePath} - 文件過小 (${formatFileSize(result.size)})`,
        );
        hasWarnings = true;
      } else {
        console.log(
          `  ${colors.green}✓${colors.reset} ${imagePath} - ${formatFileSize(result.size)}`,
        );
        totalSize += result.size;
      }
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(
    `\n📊 驗證結果: ${totalChecked} images across ${apps.length} apps (${formatFileSize(totalSize)})`,
  );

  if (hasErrors) {
    console.error('\n❌ 驗證失敗！\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('\n⚠️  驗證通過，但有警告\n');
  } else {
    console.log(`\n${colors.green}✅ 所有圖片資源驗證通過！${colors.reset}\n`);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
