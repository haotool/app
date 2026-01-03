/**
 * Post-build script to mirror dist for nested path deployment
 * Ensures /nihonname/ base path works correctly
 *
 * [fix:2026-01-03] 新增 HTML 修復功能
 * - 修復 vite-plugin-csp-guard SRI 造成的重複 crossorigin 屬性
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, '../dist');
const mirrorPath = resolve(distPath, 'nihonname');

/**
 * [fix:2026-01-03] 修復 HTML 中的重複 crossorigin 屬性
 * W3C Validator 報錯: "Duplicate attribute crossorigin"
 */
const fixHtmlCrossorigin = (htmlPath) => {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  // 修復 vite-plugin-csp-guard SRI 造成的重複 crossorigin 屬性
  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ Fixed HTML (dedup crossorigin): ${htmlPath}`);
  }
};

// 遞迴修復所有 HTML 文件
const fixAllHtmlFiles = (dir) => {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixAllHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      fixHtmlCrossorigin(fullPath);
    }
  }
};

if (existsSync(distPath)) {
  // 首先修復所有 HTML 文件
  console.log('🔧 Fixing HTML files (dedup crossorigin)...');
  fixAllHtmlFiles(distPath);
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
