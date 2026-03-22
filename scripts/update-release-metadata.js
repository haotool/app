/**
 * 更新發版相關靜態資源（sitemap + 版本嵌入 prebuild 產出物）。
 * 在 Changeset version 階段執行（changeset:version），確保 release PR 包含最新 metadata，
 * 且所有版本 SSOT 驗證（seo-best-practices、llms-txt.spec）在 pre-push 時一次通過。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
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

/**
 * 執行 ratewise prebuild 腳本，將最新版本號嵌入公開靜態產出物。
 * 對象：generate-api-json、generate-llms-txt、generate-manifest、generate-openapi、generate-robots-txt。
 */
function runVersionEmbedScripts() {
  const scripts = [
    'generate-api-json.mjs',
    'generate-llms-txt.mjs',
    'generate-manifest.mjs',
    'generate-openapi.mjs',
    'generate-robots-txt.mjs',
  ];

  const node = process.execPath;
  const scriptsDir = join(__dirname, '../apps/ratewise/scripts');

  for (const script of scripts) {
    const scriptPath = join(scriptsDir, script);
    const result = spawnSync(node, [scriptPath], {
      cwd: join(__dirname, '..'),
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.error(`❌ ${script} exited with code ${result.status}`);
      process.exit(result.status ?? 1);
    }
    console.log(`✅ Ran ${script}`);
  }
}

function main() {
  console.log('🛠  Updating release metadata');
  syncRootVersion();
  updateSitemap();
  runVersionEmbedScripts();
  console.log('🎉 Release metadata update completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateSitemap };
