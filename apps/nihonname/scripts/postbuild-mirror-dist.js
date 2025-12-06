/**
 * Post-build script to mirror dist for nested path deployment
 * Ensures /nihonname/ base path works correctly
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, '../dist');
const mirrorPath = resolve(distPath, 'nihonname');

if (existsSync(distPath)) {
  // Create nested directory if needed
  if (!existsSync(mirrorPath)) {
    mkdirSync(mirrorPath, { recursive: true });
  }

  // Copy essential files to nested path
  const filesToMirror = ['index.html', 'favicon.ico', 'favicon.svg', 'manifest.webmanifest'];

  for (const file of filesToMirror) {
    const srcPath = resolve(distPath, file);
    const destPath = resolve(mirrorPath, file);
    if (existsSync(srcPath)) {
      cpSync(srcPath, destPath);
      console.log(`✅ Mirrored: ${file}`);
    }
  }

  // [fix:2025-12-06] 複製 history.html 到 history/index.html
  // 修復 Cloudflare Pages 目錄自動尾斜線導致的 403 問題
  const historyDir = resolve(distPath, 'history');
  const historySrc = resolve(distPath, 'history.html');
  const historyIndex = resolve(historyDir, 'index.html');

  if (existsSync(historySrc) && existsSync(historyDir)) {
    cpSync(historySrc, historyIndex);
    console.log('✅ Copied: history.html → history/index.html');
  }

  console.log('✅ Post-build mirror complete');
} else {
  console.log('⚠️ No dist directory found');
}
