/**
 * Post-build script for Park-Keeper
 * Generates non-trailing-slash HTML for SSG routes
 * [fix:2026-03-14] 將 __staticRouterHydrationData script 從 #root 移到 </body> 前，
 *                  vite-react-ssg 將此 script 注入 #root 內部，導致 React hydrateRoot
 *                  看到額外的 script 子節點 → hydration 失敗 → createRoot fallback
 *                  → 雙重 Layout 渲染，SSG 佔用全螢幕高度，React app 被推到下方。
 * [perf:issue #738] 將 render-blocking 的 app CSS 內聯進 SSG HTML：LCP 為 SSG 文字，
 *                  消除 HTML→CSS 串行請求後首屏渲染不再等第二個 round trip。
 * [perf:issue #738] app entry module 的「下載與執行」皆延後至 window load（3 秒兜底）：
 *                  head 內高優先權 JS 下載鏈會被 Lighthouse Lantern 計入 FCP/LCP 關鍵
 *                  路徑。A/B 實測（LH mobile ×5）保留 head modulepreload 並行下載中位
 *                  P=97 / FCP 1954ms，全延後 P=100 / FCP 629ms，故採全延後；代價為
 *                  hydration 起點後移，量測見 epic updates/738/stream-perf.md。
 */
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { SEO_PATHS } from '../app.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

// 修復所有 HTML 文件
function fixHtmlOutput(htmlPath) {
  if (!existsSync(htmlPath)) return;
  let html = readFileSync(htmlPath, 'utf-8');
  const original = html;

  html = moveRouterHydrationScript(html);
  html = inlineAppStylesheet(html);
  html = deferAppModuleUntilFirstPaint(html);

  if (html !== original) {
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ fixed HTML (hydration script + inline CSS + deferred module): ${htmlPath}`);
  }
}

// app entry module 的「下載與執行」皆延後：移除 head 靜態 modulepreload 與 module
// script，改於 window load 後（3 秒 timeout 兜底）動態注入 preload＋entry。
// module script 雖不阻塞 parser，但 head 內高優先權 JS 下載鏈會被計入 FCP/LCP 關鍵
// 路徑；A/B 實測「保留 preload 並行下載＋只延後執行」中位 P=97，全延後 P=100。
// 代價：hydration 起點由「下載完成即執行」後移至 load/3s，經 CTA 橋接消除拍照落失風險。
// 產線 CF worker 以 HTMLRewriter 對所有 script 元素注入 nonce，此 inline bootstrap 亦涵蓋；
// 動態注入的 entry script 為同源外部檔，由 CSP script-src 'self' 放行。
function deferAppModuleUntilFirstPaint(html) {
  const scriptPattern = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/;
  const scriptMatch = html.match(scriptPattern);
  if (!scriptMatch) return html;

  const entrySrc = scriptMatch[1];
  const preloadPattern = /<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>/g;
  const preloadHrefs = [...html.matchAll(preloadPattern)].map((m) => m[1]);

  // CTA 拍照橋接：JS 延後注入擴大了 hydration 前的拍照窗口，於初始 HTML 以 document 層
  // 事件委派承接 change；檔案暫存 window.__pkCtaPhoto，由 pendingCtaPhoto 模組載入時領養。
  // 去重前提（若變更需同步改此橋接）：React 19 於 #root 委派事件，bubble 順序為
  // input→#root（React onChange 處理並清空 value/files）→document（本監聽）——
  // hydration 後 files 已被 QuickCaptureCta onChange 清空，本監聽自然跳過不重複處理。
  // 僅注入含 CTA input 的頁面（首頁 SSG 殼）；此時 bootstrap 尚未注入，檢查的是頁面本體標記。
  const hasCtaInput = html.includes('data-testid="quick-record-cta-input"');
  const ctaBridge = hasCtaInput
    ? `document.addEventListener('change',function(e){var t=e.target;` +
      `if(t&&t.getAttribute&&t.getAttribute('data-testid')==='quick-record-cta-input'&&t.files&&t.files[0]){` +
      `window.__pkCtaPhoto=t.files[0];window.dispatchEvent(new Event('pk:cta-photo'));}});`
    : '';

  const bootstrap =
    `<script>(function(){var booted=false;` +
    ctaBridge +
    `function boot(){if(booted)return;booted=true;` +
    `${JSON.stringify(preloadHrefs)}.forEach(function(href){` +
    `var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=href;document.head.appendChild(l);});` +
    `var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entrySrc)};` +
    `document.body.appendChild(s);}` +
    `if(document.readyState==='complete'){boot();}` +
    `else{window.addEventListener('load',boot,{once:true});}` +
    `setTimeout(boot,3000);})();</script>`;

  return html
    .replace(scriptMatch[0], '')
    .replace(preloadPattern, '')
    .replace('</body>', `${bootstrap}</body>`);
}

// 將 app entry CSS 內聯為 <style>，消除 render-blocking stylesheet 請求（LCP 關鍵路徑）。
// CSS 檔保留於 dist：SW precache manifest 於 build 期已寫入該 URL，移除會使 SW 安裝失敗。
// MiniMap 等 lazy chunk 的 CSS 由 runtime 動態注入，不在此範圍。
function inlineAppStylesheet(html) {
  const linkPattern = /<link rel="stylesheet"[^>]*href="[^"]*\/assets\/(app-[^"/]+\.css)"[^>]*>/;
  const match = html.match(linkPattern);
  if (!match) return html;

  const cssPath = resolve(distDir, 'assets', basename(match[1]));
  if (!existsSync(cssPath)) return html;

  const css = readFileSync(cssPath, 'utf-8').trim();
  // CSS 含 </style> 會提前終結 style 標籤並破壞文件結構，該情況下放棄內聯保持原樣。
  if (css.includes('</style')) return html;

  return html.replace(match[0], `<style>${css}</style>`);
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
  // 由 SSOT 派生（排除首頁），避免第二份路由清單漂移。
  const ssgDirs = SEO_PATHS.filter((path) => path !== '/').map((path) => path.replaceAll('/', ''));
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
