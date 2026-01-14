/**
 * 更新發版相關靜態資源（目前包含 sitemap）
 * 在 Changeset version 階段執行，確保 release PR 包含最新 metadata。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSitemap } from './generate-sitemap-2025.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateSitemap() {
  const sitemap = generateSitemap();
  const outputPath = join(__dirname, '../apps/ratewise/public/sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Updated sitemap lastmod at ${outputPath}`);
}

function syncRootVersion() {
  const rootPackagePath = join(__dirname, '../package.json');
  const appPackagePath = join(__dirname, '../apps/ratewise/package.json');

  const rootPackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
  const appPackageJson = JSON.parse(readFileSync(appPackagePath, 'utf-8'));

  const appVersion = appPackageJson.version;

  if (rootPackageJson.version === appVersion) {
    console.log('ℹ️ Root package version already in sync, skipping update');
    return;
  }

  rootPackageJson.version = appVersion;
  writeFileSync(rootPackagePath, `${JSON.stringify(rootPackageJson, null, 2)}\n`, 'utf-8');
  console.log(`✅ Synced root package version to ${appVersion}`);
}

function main() {
  console.log('🛠  Updating release metadata');
  updateSitemap();
  syncRootVersion();
  console.log('🎉 Release metadata update completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateSitemap };
