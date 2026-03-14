/**
 * Post-build script for Park-Keeper
 * Generates non-trailing-slash HTML for SSG routes
 * [fix:2026-03-14] 注入 data-cfasync="false" 至 __VITE_REACT_SSG_HASH__ script，
 *                  防止 Cloudflare Rocket Loader 修改 type 屬性，
 *                  導致 window.__VITE_REACT_SSG_HASH__ 永遠是 undefined
 *                  → 造成 static-loader-data-manifest-undefined.json 404 → 骨架屏卡死。
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

// 修復所有 HTML 文件：注入 data-cfasync="false" 到 __VITE_REACT_SSG_HASH__ script
function fixHtmlOutput(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  html = html.replace(
    /(<script)(\s*>window\.__VITE_REACT_SSG_HASH__)/g,
    '$1 data-cfasync="false"$2',
  );

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ injected data-cfasync="false": ${htmlPath}`);
  }
}

function fixAllHtmlFiles(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      fixAllHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      fixHtmlOutput(fullPath);
    }
  }
}

function generateNonTrailingSlashPages() {
  const ssgDirs = ['about', 'settings'];
  console.log('\n🔗 Generating non-trailing-slash HTML files...');
  for (const dir of ssgDirs) {
    const indexPath = resolve(distDir, dir, 'index.html');
    const flatPath = resolve(distDir, `${dir}.html`);
    if (existsSync(indexPath) && !existsSync(flatPath)) {
      copyFileSync(indexPath, flatPath);
      console.log(`  ✅ ${dir}/index.html → ${dir}.html`);
    }
  }
}

console.log('📦 Park-Keeper Postbuild');
console.log('========================');

if (!existsSync(distDir)) {
  console.error('❌ dist directory not found');
  process.exit(1);
}

console.log('\n🔧 Fixing HTML files (data-cfasync for Rocket Loader)...');
fixAllHtmlFiles(distDir);

generateNonTrailingSlashPages();
console.log('\n✅ Postbuild complete');
