/**
 * 更新發版相關靜態資源（目前包含 sitemap）
 * 在 Changeset version 階段執行，確保 release PR 包含最新 metadata。
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSitemap } from './generate-sitemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateSitemap() {
  const sitemap = generateSitemap();
  const outputPath = join(__dirname, '../apps/ratewise/public/sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Updated sitemap lastmod at ${outputPath}`);
}

function main() {
  console.log('🛠  Updating release metadata');
  updateSitemap();
  console.log('🎉 Release metadata update completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateSitemap };
