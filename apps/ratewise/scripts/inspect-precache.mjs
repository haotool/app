/**
 * 驗證 build 輸出 vs. precache 清單（sw.js）。
 * 用途：確認 dist/assets/ 中哪些 JS/CSS chunk 已注入 sw.js precache 清單，
 *       找出冷啟動黑屏根因（主要 chunk 是否被 precache 涵蓋）。
 *
 * 執行方式：先執行 pnpm build:ratewise，再執行此腳本。
 *   node apps/ratewise/scripts/inspect-precache.mjs
 *   # 或從 app 目錄：
 *   cd apps/ratewise && node scripts/inspect-precache.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');
const distDir = resolve(appDir, 'dist');
const assetsDir = resolve(distDir, 'assets');
const swJsPath = resolve(distDir, 'sw.js');

// 確認 dist/ 已存在
if (!existsSync(distDir)) {
  console.error('❌ dist/ 目錄不存在，請先執行 pnpm build:ratewise');
  process.exit(1);
}

if (!existsSync(swJsPath)) {
  console.error('❌ dist/sw.js 不存在，請先執行 pnpm build:ratewise');
  process.exit(1);
}

// 讀取 sw.js 並提取 precache 清單中的 URL
const swContent = readFileSync(swJsPath, 'utf-8');
const swSizeMB = (Buffer.byteLength(swContent, 'utf-8') / 1024).toFixed(1);

// 提取 precache manifest 中的 URL（workbox injectManifest 後格式為 [{url: "...", revision: "..."}, ...]）
const precacheUrlMatches = swContent.matchAll(/"url"\s*:\s*"([^"]+)"/g);
const precacheUrls = new Set([...precacheUrlMatches].map((m) => m[1]));

// 列出 dist/assets/ 中的所有 JS/CSS 檔案
const getFilesInDir = (dir, exts) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => exts.includes(extname(f)))
    .map((f) => ({ name: f, size: statSync(resolve(dir, f)).size }))
    .filter((f) => !f.name.endsWith('.map') && !f.name.endsWith('.br') && !f.name.endsWith('.gz'));
};

const jsFiles = getFilesInDir(assetsDir, ['.js']);
const cssFiles = getFilesInDir(assetsDir, ['.css']);

// 交叉比對：哪些 chunk 在 precache 清單中
const inPrecache = (filename) =>
  [...precacheUrls].some((url) => url.includes(filename.replace(/\.[^.]+$/, '')));

console.log('\n========================================');
console.log('  dist/sw.js precache 清單分析');
console.log('========================================');
console.log(`sw.js 大小     : ${swSizeMB} KB`);
console.log(`precache URL 數: ${precacheUrls.size}`);
console.log(`dist/assets JS : ${jsFiles.length} 個`);
console.log(`dist/assets CSS: ${cssFiles.length} 個\n`);

// JS chunks 對比
console.log('── JS Chunks vs. Precache ──');
let jsMissed = 0;
for (const f of jsFiles) {
  const cached = inPrecache(f.name);
  const size = (f.size / 1024).toFixed(1);
  const status = cached ? '✅' : '❌ 未快取';
  if (!cached) jsMissed++;
  console.log(`  ${status}  ${f.name}  (${size} KB)`);
}
if (jsFiles.length === 0) {
  console.log('  （dist/assets/ 無 JS 檔案）');
}

console.log('\n── CSS Files vs. Precache ──');
let cssMissed = 0;
for (const f of cssFiles) {
  const cached = inPrecache(f.name);
  const size = (f.size / 1024).toFixed(1);
  const status = cached ? '✅' : '❌ 未快取';
  if (!cached) cssMissed++;
  console.log(`  ${status}  ${f.name}  (${size} KB)`);
}
if (cssFiles.length === 0) {
  console.log('  （dist/assets/ 無 CSS 檔案）');
}

// precache 清單中所有條目
if (precacheUrls.size > 0 && precacheUrls.size < 200) {
  console.log('\n── sw.js 中所有 precache URL ──');
  [...precacheUrls]
    .filter((u) => u.endsWith('.js') || u.endsWith('.css') || u.endsWith('.html'))
    .sort()
    .forEach((u) => console.log(`  ${u}`));
}

// 根因診斷
console.log('\n========================================');
if (precacheUrls.size === 0) {
  console.log('🚨 根因確認：sw.js 中無任何 precache URL！');
  console.log('   __WB_MANIFEST 注入失敗，或 injectManifest 設定有誤。');
  console.log('   → 確認 vite.config.ts 的 globPatterns 與 sw.ts 的 __WB_MANIFEST 使用');
} else if (jsMissed > 0) {
  console.log(`🚨 根因確認：${jsMissed} 個 JS chunk 不在 precache 清單中！`);
  console.log('   SW 離線時無法提供這些 chunk → 黑屏 / Load failed。');
  console.log('');
  console.log('   ⚠️  已知問題：workbox-build v7.4.0 花括號 glob pattern bug');
  console.log('   vite.config.ts 使用 **/*.{js,css,...} 格式，workbox-build 返回 0 結果。');
  console.log('');
  console.log('   修正方案：將 globPatterns 改為分開列舉：');
  console.log('   globPatterns: [');
  console.log("     'assets/**/*.js',");
  console.log("     'assets/**/*.css',");
  console.log("     '**/*.html',");
  console.log("     '**/*.ico',");
  console.log("     '**/*.png',");
  console.log("     '**/*.svg',");
  console.log("     '**/*.json',");
  console.log('   ],');
} else if (jsFiles.length > 0 && jsMissed === 0) {
  console.log('✅ 所有 JS chunks 均在 precache 清單中。');
  console.log('   若離線仍黑屏，根因可能在：');
  console.log('   1. autoUpdate + cleanupOutdatedCaches 競態（清除舊快取後立即離線）');
  console.log('   2. pwa-recovery-bootstrap.js 清快取後 reload 時已離線');
  console.log('   3. 全新 context 冷啟動時 SW 尚未安裝，index.html 不在快取中');
} else {
  console.log('⚠️  無法確認根因，請手動檢查 dist/assets/ 目錄。');
}
console.log('========================================\n');
