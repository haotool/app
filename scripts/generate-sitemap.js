/**
 * 動態生成 Sitemap.xml（2025 標準）
 *
 * 執行: node scripts/generate-sitemap.js
 * 說明: 保留舊入口，實際輸出由 2025 生成器提供
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateSitemap } from './generate-sitemap-2025.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  console.log('🗺️  Generating sitemap.xml (2025)');

  const sitemap = generateSitemap();
  const outputPath = join(__dirname, '../apps/ratewise/public/sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated at ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSitemap };
