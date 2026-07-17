/**
 * Post-build script for Park-Keeper
 * Generates non-trailing-slash HTML for SSG routes
 * [fix:2026-03-14] 將 __staticRouterHydrationData script 從 #root 移到 </body> 前，
 *                  vite-react-ssg 將此 script 注入 #root 內部，導致 React hydrateRoot
 *                  看到額外的 script 子節點 → hydration 失敗 → createRoot fallback
 *                  → 雙重 Layout 渲染，SSG 佔用全螢幕高度，React app 被推到下方。
 * [perf:issue #738] 將 render-blocking 的 app CSS 內聯進 SSG HTML：LCP 為 SSG 文字，
 *                  消除 HTML→CSS 串行請求後首屏渲染不再等第二個 round trip。
 * [perf:issue #738] 首屏 paint 後才注入 app entry module：快速網路下 module script
 *                  會在首次 paint 前執行完畢，令 FCP/LCP 被 JS 下載＋執行鏈綁死；
 *                  改為 modulepreload（下載照常並行）＋ paint 後動態注入（執行解耦）。
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

// 首屏 paint 後才注入 app entry module：module script 雖不阻塞 parser，
// 但其下載與執行鏈（含 head 內靜態 modulepreload）會被計入 FCP/LCP 關鍵路徑。
// 改為 window load 後動態注入 modulepreload 與 entry script——load 必然晚於首次
// paint（SSG 殼已渲染），確保首屏渲染與 JS 啟動完全解耦。
// 背景分頁或極慢網路下 load 可能遲到，保留 3 秒 timeout 兜底確保 app 必定啟動。
// 產線 CF worker 以 HTMLRewriter 對所有 script 元素注入 nonce，此 inline bootstrap 亦涵蓋；
// 動態注入的 entry script 為同源外部檔，由 CSP script-src 'self' 放行。
function deferAppModuleUntilFirstPaint(html) {
  const scriptPattern = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/;
  const scriptMatch = html.match(scriptPattern);
  if (!scriptMatch) return html;

  const entrySrc = scriptMatch[1];
  const preloadPattern = /<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>/g;
  const preloadHrefs = [...html.matchAll(preloadPattern)].map((m) => m[1]);

  // CTA 拍照橋接：JS 延後注入擴大了 hydration 前的拍照窗口，於初始 HTML 以事件
  // 委派承接 change——hydration 後 React onChange 會先清空 files，此監聽自然跳過，
  // 不會重複處理；檔案暫存 window.__pkCtaPhoto，由 pendingCtaPhoto 模組載入時領養。
  const bootstrap =
    `<script>(function(){var booted=false;` +
    `document.addEventListener('change',function(e){var t=e.target;` +
    `if(t&&t.getAttribute&&t.getAttribute('data-testid')==='quick-record-cta-input'&&t.files&&t.files[0]){` +
    `window.__pkCtaPhoto=t.files[0];window.dispatchEvent(new Event('pk:cta-photo'));}});` +
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
