/**
 * Post-build script for haotool
 * Ensures trailing slashes and validates build output
 * [context7:/google/seo-starter-guide:2025-12-13]
 * [fix:2026-01-04] 新增 HTML 修復功能
 */
import {
  existsSync,
  readdirSync,
  statSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

/**
 * [fix:2026-01-04] 修復 HTML 中的問題
 * - 重複的 crossorigin 屬性（vite-plugin-csp-guard SRI 造成）
 */
function fixHtmlFile(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  // 修復重複的 crossorigin 屬性
  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ Fixed HTML (dedup crossorigin): ${htmlPath.replace(distDir, 'dist')}`);
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

/**
 * Validate that all expected files exist
 */
function validateBuild() {
  const requiredFiles = ['index.html', 'sitemap.xml', 'robots.txt'];

  const requiredDirs = ['projects', 'about', 'contact'];

  console.log('\n📋 Validating build output...\n');

  let allValid = true;

  // Check required files
  for (const file of requiredFiles) {
    const filePath = resolve(distDir, file);
    if (existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allValid = false;
    }
  }

  // Check required directories (with index.html for trailing slash support)
  for (const dir of requiredDirs) {
    const dirPath = resolve(distDir, dir);
    const indexPath = resolve(dirPath, 'index.html');

    if (existsSync(indexPath)) {
      console.log(`  ✅ ${dir}/index.html`);
    } else {
      console.log(`  ❌ ${dir}/index.html - MISSING`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log('\n✅ Build validation passed!\n');
  } else {
    console.log('\n⚠️ Build validation has warnings. Check missing files.\n');
  }

  return allValid;
}

/**
 * List build output summary
 */
function summarizeBuild() {
  console.log('\n📦 Build output summary:\n');

  function countFiles(dir, depth = 0) {
    let count = 0;
    const items = readdirSync(dir);

    for (const item of items) {
      const itemPath = join(dir, item);
      const stats = statSync(itemPath);

      if (stats.isDirectory()) {
        if (depth < 2) {
          const subCount = countFiles(itemPath, depth + 1);
          console.log(`  ${'  '.repeat(depth)}📁 ${item}/ (${subCount} files)`);
          count += subCount;
        }
      } else {
        if (depth < 1) {
          const size = (stats.size / 1024).toFixed(1);
          console.log(`  ${'  '.repeat(depth)}📄 ${item} (${size} KB)`);
        }
        count++;
      }
    }

    return count;
  }

  if (existsSync(distDir)) {
    const totalFiles = countFiles(distDir);
    console.log(`\n  Total files: ${totalFiles}`);
  } else {
    console.log('  ❌ dist directory not found');
  }
}

// Main execution
console.log('🔧 Running post-build tasks for haotool...');

// 1. 修復 HTML 文件
console.log('\n📝 Fixing HTML files...');
fixAllHtmlFiles(distDir);

// 2. 驗證 build
validateBuild();
summarizeBuild();
console.log('\n✅ Post-build complete!\n');
