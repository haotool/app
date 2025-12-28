/**
 * Postbuild Script - Mirror dist for deployment
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const distPath = resolve(__dirname, '../dist');
const mirrorPath = resolve(__dirname, '../../../dist/quake-school');

// 確保目標目錄存在
if (!existsSync(resolve(__dirname, '../../../dist'))) {
  mkdirSync(resolve(__dirname, '../../../dist'), { recursive: true });
}

// 複製 dist 到根目錄的 dist/quake-school
if (existsSync(distPath)) {
  cpSync(distPath, mirrorPath, { recursive: true });
  console.log(`✅ Dist mirrored to: ${mirrorPath}`);
} else {
  console.warn(`⚠️ Dist folder not found: ${distPath}`);
}
