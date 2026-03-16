/**
 * Post-build script for Park-Keeper
 * Generates non-trailing-slash HTML for SSG routes
 * [fix:2026-03-14] 將 __staticRouterHydrationData script 從 #root 移到 </body> 前，
 *                  vite-react-ssg 將此 script 注入 #root 內部，導致 React hydrateRoot
 *                  看到額外的 script 子節點 → hydration 失敗 → createRoot fallback
 *                  → 雙重 Layout 渲染，SSG 佔用全螢幕高度，React app 被推到下方。
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

// 修復所有 HTML 文件
function fixHtmlOutput(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  html = moveRouterHydrationScript(html);

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ fixed HTML (hydration script): ${htmlPath}`);
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

// 將 __staticRouterHydrationData script 從 #root 移到 </body> 前。
// React hydrateRoot(#root) 期望 #root 子節點與 <App /> 渲染結果完全匹配（只有一個 div）；
// script 節點在裡面會造成節點數不符 → hydration 失敗 → createRoot fallback → 雙重渲染。
function moveRouterHydrationScript(html) {
  const scriptPattern = /(<script[^>]*>window\.__staticRouterHydrationData\s*=[^<]*<\/script>)/;
  const match = html.match(scriptPattern);
  if (!match) return html;

  const scriptTag = match[1];
  const rootStart = html.indexOf('id="root"');
  if (rootStart === -1) return html;

  const scriptPos = html.indexOf(scriptTag);
  // 只在 script 確實位於 #root 之後（即在 root 內部）才移動
  if (scriptPos === -1 || scriptPos < rootStart) return html;

  return html.replace(scriptTag, '').replace('</body>', `${scriptTag}</body>`);
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

console.log('\n🔧 Fixing HTML files...');
fixAllHtmlFiles(distDir);

generateNonTrailingSlashPages();
console.log('\n✅ Postbuild complete');
