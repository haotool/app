/**
 * Post-build script for haotool
 * 1. 修復 HTML 重複 crossorigin 屬性
 * 2. 產生非尾斜線 HTML 副本與根層 404.html
 * 3. 驗證建置產出完整性
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const SSG_DIRS = ['tools', 'about', 'contact'];

function fixHtmlFile(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ Fixed HTML: ${htmlPath.replace(distDir, 'dist')}`);
  }
}

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
 * {dir}/index.html → {dir}.html，讓 /about 與 /about/ 提供相同內容。
 */
function generateNonTrailingSlashPages() {
  console.log('\n🔗 Generating non-trailing-slash HTML files...');

  for (const dir of SSG_DIRS) {
    const indexPath = resolve(distDir, dir, 'index.html');
    const flatPath = resolve(distDir, `${dir}.html`);

    if (existsSync(indexPath) && !existsSync(flatPath)) {
      copyFileSync(indexPath, flatPath);
      console.log(`  ✅ ${dir}/index.html → ${dir}.html`);
    }
  }
}

/**
 * 404/index.html → 404.html（供 nginx error_page 使用）。
 */
function generate404Html() {
  const indexPath = resolve(distDir, '404', 'index.html');
  const flatPath = resolve(distDir, '404.html');

  if (existsSync(indexPath)) {
    copyFileSync(indexPath, flatPath);
    console.log('  ✅ 404/index.html → 404.html');
  }
}

function validateBuild() {
  const requiredFiles = ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'llms.txt'];

  console.log('\n📋 Validating build output...\n');

  let allValid = true;

  for (const file of requiredFiles) {
    if (existsSync(resolve(distDir, file))) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allValid = false;
    }
  }

  for (const dir of SSG_DIRS) {
    if (existsSync(resolve(distDir, dir, 'index.html'))) {
      console.log(`  ✅ ${dir}/index.html`);
    } else {
      console.log(`  ❌ ${dir}/index.html - MISSING`);
      allValid = false;
    }
  }

  if (!allValid) {
    console.error('\n❌ Build validation failed. Check missing files.\n');
    process.exit(1);
  }

  console.log('\n✅ Build validation passed!\n');
}

console.log('🔧 Running post-build tasks for haotool...');
console.log('\n📝 Fixing HTML files...');
fixAllHtmlFiles(distDir);
generateNonTrailingSlashPages();
generate404Html();
validateBuild();
console.log('✅ Post-build complete!\n');
