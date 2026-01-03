/**
 * 建置後處理腳本
 * - 確保 dist 目錄結構正確
 * - 處理尾斜線重定向
 * - [fix:2026-01-04] 修復 W3C HTML Validator 錯誤
 */
import {
  existsSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

/**
 * [fix:2026-01-04] 修復 HTML 中的問題
 * - 重複的 crossorigin 屬性（vite-plugin-csp-guard SRI 造成）
 * - 重複的 meta description
 */
function fixHtmlFile(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  // 1. 修復重複的 crossorigin 屬性
  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  // 2. 移除重複的 meta description（保留第一個）
  const descriptionMatches = html.match(/<meta\s+name=["']description["'][^>]*>/gi);
  if (descriptionMatches && descriptionMatches.length > 1) {
    // 保留第一個，移除其他
    for (let i = 1; i < descriptionMatches.length; i++) {
      html = html.replace(descriptionMatches[i], '<!-- [removed: duplicate description] -->');
    }
  }

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ Fixed HTML: ${htmlPath}`);
  }
}

// 遞迴修復所有 HTML 文件
function fixAllHtmlFiles(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixAllHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      fixHtmlFile(fullPath);
    }
  }
}

function ensureDistStructure() {
  if (!existsSync(distDir)) {
    console.log('⚠️ dist 目錄不存在，跳過 postbuild');
    return;
  }

  // 1. 修復所有 HTML 文件
  console.log('🔧 Fixing HTML files...');
  fixAllHtmlFiles(distDir);

  // 2. 確保 _redirects 存在（用於 Netlify/Cloudflare Pages）
  const redirectsSource = resolve(__dirname, '../public/_redirects');
  const redirectsDest = resolve(distDir, '_redirects');

  if (existsSync(redirectsSource) && !existsSync(redirectsDest)) {
    copyFileSync(redirectsSource, redirectsDest);
    console.log('✅ 複製 _redirects');
  }

  console.log('✅ postbuild 處理完成');
}

ensureDistStructure();
