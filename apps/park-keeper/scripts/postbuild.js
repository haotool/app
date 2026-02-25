/**
 * Post-build script for Park-Keeper
 * Generates non-trailing-slash HTML for SSG routes
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

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

generateNonTrailingSlashPages();
console.log('\n✅ Postbuild complete');
