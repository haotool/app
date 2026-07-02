#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

import { existsSync, readFileSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';

const VERIFY_SOURCE = process.env.VERIFY_PRECACHE_SOURCE ?? 'local';
const BASE_URL = process.env.VERIFY_BASE_URL ?? getDefaultBaseUrl(VERIFY_SOURCE);
const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist');
const SW_PATH = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist/sw.js');
const INDEX_HTML_PATH = path.resolve(DIST_DIR, 'index.html');
const MIN_PRECACHE_ENTRY_COUNT = 20;
const MAX_PRECACHE_ENTRY_COUNT = 100;
const MAX_PRECACHE_BYTES = 3 * 1024 * 1024;

const REQUIRED_PRECACHE_URLS = [
  'index.html',
  'offline.html',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icons/haorate-icon-192x192.png',
];

// Tier 1 必含但檔名帶 hash 的資產，以子字串比對。
const REQUIRED_PRECACHE_SUBSTRINGS = ['static-loader-data-manifest'];

const FORBIDDEN_PRECACHE_PATTERNS = [
  /screenshots\//,
  /pwa-install\//,
  /-1024x1024\.png/,
  /pwa-512x512\.png/,
  /openapi\.json$/,
  // 匯率 JSON 屬 Tier 2 runtime SWR，不得進 precache（loader manifest 例外，於 REQUIRED 檢查）。
  /(?:^|\/)api\/(?:latest\.json|pairs\/)/,
  // 任何非根目錄 index.html（幣別 landing、about、faq 等 SSG 頁）由 NavigationRoute 回退 shell。
  /.+\/index\.html$/,
  // 點陣圖一律 runtime CacheFirst（REQUIRED 的 shell 圖示於下方掃描時排除）。
  /\.(?:png|jpe?g|webp|avif)$/,
];

function normalizeBase(url) {
  // Remove trailing slashes first, then add a single slash
  const trimmed = url.replace(/\/+$/, '');
  return `${trimmed}/`;
}

function getDefaultBaseUrl(mode) {
  if (mode === 'local') {
    return 'http://127.0.0.1:4173/ratewise/';
  }
  if (mode === 'live') {
    return 'https://app.haotool.org/ratewise/';
  }
  throw new Error(`未知的模式: ${mode}`);
}

function resolvePrecacheAssetUrl(assetPath, baseUrl) {
  const normalized = normalizeBase(baseUrl);
  const cleanAsset = assetPath.replace(/^\//, '');
  return `${normalized}${cleanAsset}`;
}

function parseShellAssetUrls(html) {
  const assets = new Set();
  for (const match of html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.(?:js|css))"/g)) {
    const assetUrl = match[1];
    if (assetUrl) {
      assets.add(assetUrl.replace(/^\/ratewise\//, '').replace(/^\//, ''));
    }
  }
  return Array.from(assets).sort();
}

function shouldProbePrecacheAssetsOverHttp(mode) {
  return mode === 'live';
}

function resolveLocalPrecacheAssetPath(assetPath, distDir) {
  const cleanAsset = assetPath.replace(/^\//, '');
  return path.resolve(distDir, cleanAsset);
}

async function loadPrecacheEntries() {
  let swContent;

  if (VERIFY_SOURCE === 'live') {
    // 從遠端 URL 取得 sw.js（用於驗證已部署的 precache）
    try {
      const swUrl = new URL('sw.js', BASE_URL).toString();
      console.log(`🌐 從遠端取得 Service Worker: ${swUrl}`);
      const response = await fetch(swUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      swContent = await response.text();
    } catch (error) {
      throw new Error(
        `無法從遠端取得 sw.js: ${error instanceof Error ? error.message : String(error)}\n` +
          `請確認應用已正確部署至 ${BASE_URL}`,
      );
    }
  } else {
    // 從本地 dist 目錄讀取 sw.js（本地開發驗證）
    // 檢查 dist 目錄是否存在
    if (!existsSync(DIST_DIR)) {
      throw new Error(
        `dist 目錄不存在: ${DIST_DIR}\n` + `請確認已執行 pnpm build:ratewise 生成 build 產物`,
      );
    }

    // 檢查 sw.js 文件是否存在
    if (!existsSync(SW_PATH)) {
      throw new Error(
        `sw.js 文件不存在: ${SW_PATH}\n` +
          `請確認 Service Worker 已正確生成。如持續失敗，請執行: pnpm build:ratewise --force`,
      );
    }

    swContent = await readFileAsync(SW_PATH, 'utf-8');
  }

  const match = swContent.match(/precacheAndRoute\((\[.*?\])\)/s);
  const manifestSource = match?.[1] ?? extractInjectedManifest(swContent);
  if (!manifestSource) {
    throw new Error('無法在 sw.js 中找到 precache 清單');
  }

  try {
    const manifest = JSON.parse(manifestSource);
    return manifest;
  } catch (error) {
    throw new Error(
      `解析 precache 清單失敗: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function loadShellAssetUrls() {
  // 直播驗證時跳過 shell asset 檢查（因為沒有本地 dist 檔案）
  if (VERIFY_SOURCE === 'live') {
    console.log('ℹ️ 直播驗證模式：略過本地 shell asset 檢查');
    return [];
  }

  // 檢查 index.html 是否存在
  if (!existsSync(INDEX_HTML_PATH)) {
    throw new Error(
      `index.html 文件不存在: ${INDEX_HTML_PATH}\n` + `請確認 build 過程已完成並生成 index.html`,
    );
  }

  const indexHtml = await readFileAsync(INDEX_HTML_PATH, 'utf-8');
  const assets = new Set();

  for (const match of indexHtml.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.(?:js|css))"/g)) {
    const assetUrl = match[1];
    if (assetUrl) {
      assets.add(assetUrl.replace(/^\//, ''));
    }
  }

  return Array.from(assets).sort();
}

function extractInjectedManifest(swContent) {
  const offlineMarker = '"url":"offline.html"';
  const markerIndex = swContent.indexOf(offlineMarker);

  if (markerIndex === -1) {
    return null;
  }

  let start = -1;
  let depth = 0;

  for (let index = markerIndex; index >= 0; index -= 1) {
    const char = swContent[index];
    if (char === ']') {
      depth += 1;
      continue;
    }

    if (char === '[') {
      if (depth === 0) {
        start = index;
        break;
      }
      depth -= 1;
    }
  }

  if (start === -1) {
    return null;
  }

  depth = 0;
  for (let index = start; index < swContent.length; index += 1) {
    const char = swContent[index];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;

    if (depth === 0) {
      return swContent.slice(start, index + 1);
    }
  }

  return null;
}

async function probe(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) return { ok: true, status: response.status };
    const fallback = await fetch(url, { method: 'GET' });
    return { ok: fallback.ok, status: fallback.status };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const base = normalizeBase(BASE_URL);
  console.log(`🔍 VERIFY_BASE_URL = ${base}`);
  console.log(`📋 驗證模式 = ${VERIFY_SOURCE}`);
  const entries = await loadPrecacheEntries();
  const entryUrls = new Set(entries.map((entry) => entry.url).filter(Boolean));
  const assetEntries = entries.filter((entry) => entry.url && entry.url.startsWith('assets/'));
  const shellAssets = await loadShellAssetUrls();

  if (entries.length < MIN_PRECACHE_ENTRY_COUNT) {
    throw new Error(
      `precache 條目異常偏少：目前 ${entries.length} 筆，預期至少 ${MIN_PRECACHE_ENTRY_COUNT} 筆。這通常代表 Workbox glob 注入失敗。`,
    );
  }

  if (entries.length > MAX_PRECACHE_ENTRY_COUNT) {
    throw new Error(
      `precache 條目過多：目前 ${entries.length} 筆，上限 ${MAX_PRECACHE_ENTRY_COUNT} 筆。請確認 globIgnores 已排除非 Tier 1 資源。`,
    );
  }

  const missingRequired = REQUIRED_PRECACHE_URLS.filter((url) => !entryUrls.has(url));
  if (missingRequired.length > 0) {
    throw new Error(`precache 缺少 Tier 1 shell 資產：${missingRequired.join(', ')}。`);
  }

  const missingRequiredSubstrings = REQUIRED_PRECACHE_SUBSTRINGS.filter(
    (needle) => ![...entryUrls].some((url) => url.includes(needle)),
  );
  if (missingRequiredSubstrings.length > 0) {
    throw new Error(
      `precache 缺少 Tier 1 雜湊命名資產：${missingRequiredSubstrings.join(', ')}（離線 SPA 導覽必要）。`,
    );
  }

  const requiredUrlSet = new Set(REQUIRED_PRECACHE_URLS);
  const forbiddenMatches = entries
    .map((entry) => entry.url)
    .filter(
      (url) =>
        url &&
        !requiredUrlSet.has(url) &&
        FORBIDDEN_PRECACHE_PATTERNS.some((pattern) => pattern.test(url)),
    );
  if (forbiddenMatches.length > 0) {
    throw new Error(
      `precache 洩漏非 Tier 1 資源：${forbiddenMatches.slice(0, 5).join(', ')}${
        forbiddenMatches.length > 5 ? '…' : ''
      }`,
    );
  }

  if (VERIFY_SOURCE === 'local') {
    let totalBytes = 0;
    for (const entry of entries) {
      const localPath = resolveLocalPrecacheAssetPath(entry.url, DIST_DIR);
      if (existsSync(localPath)) {
        totalBytes += readFileSync(localPath).byteLength;
      }
    }
    if (totalBytes > MAX_PRECACHE_BYTES) {
      throw new Error(
        `precache 總體積過大：${(totalBytes / 1024 / 1024).toFixed(2)}MB，上限 ${MAX_PRECACHE_BYTES / 1024 / 1024}MB。`,
      );
    }
    console.log(
      `📦 precache 體積：${entries.length} 筆 / ${(totalBytes / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  if (!entryUrls.has('index.html')) {
    throw new Error('precache 缺少 index.html，冷啟動離線導覽將直接失敗。');
  }

  if (assetEntries.length === 0) {
    throw new Error('precache 未包含任何 assets/* JS/CSS，代表應用 shell 無法離線冷啟動。');
  }

  // 只在本地模式驗證 shell asset（直播模式無法訪問本地檔案）
  if (VERIFY_SOURCE === 'local' && shellAssets.length > 0) {
    const missingShellAssets = shellAssets.filter((assetUrl) => !entryUrls.has(assetUrl));
    if (missingShellAssets.length > 0) {
      throw new Error(
        `precache 缺少首頁 shell 資產：${missingShellAssets.join(', ')}。這會造成離線冷啟動缺 JS/CSS。`,
      );
    }
  }

  let hasError = false;

  // 本地模式：驗證本地檔案是否存在
  // 直播模式：通過 HTTP 請求驗證資產是否可訪問
  if (VERIFY_SOURCE === 'local') {
    console.log('📂 本地模式：驗證 dist 目錄中的資產檔案');
    for (const entry of assetEntries) {
      const localPath = resolveLocalPrecacheAssetPath(entry.url, DIST_DIR);
      if (existsSync(localPath)) {
        console.log(`✅ ${entry.url} (本地檔案存在)`);
      } else {
        hasError = true;
        console.error(`❌ ${entry.url} 本地檔案不存在: ${localPath}`);
      }
    }
  } else {
    console.log('🌐 直播模式：通過 HTTP 請求驗證資產');
    for (const entry of assetEntries) {
      const target = new URL(entry.url.replace(/^\//, ''), base).toString();
      const result = await probe(target);
      if (!result.ok) {
        hasError = true;
        console.error(`❌ ${target} 無法擷取 (status: ${result.status})`);
        if (result.message) {
          console.error(`   ↳ ${result.message}`);
        }
      } else {
        console.log(`✅ ${target} (status: ${result.status})`);
      }
    }
  }

  if (hasError) {
    console.error('\n❌ 檢查失敗：至少一個 precache 資產無法從指定來源取得，請確認部署與 CDN 快取');
    process.exit(1);
  }

  console.log('\n🎉 所有 precache 資產皆可成功取得');
}

// Only run main if this script is executed directly, not when imported for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`檢查過程發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

// Export functions for testing
export {
  getDefaultBaseUrl,
  normalizeBase,
  resolvePrecacheAssetUrl,
  parseShellAssetUrls,
  shouldProbePrecacheAssetsOverHttp,
  resolveLocalPrecacheAssetPath,
  REQUIRED_PRECACHE_URLS,
  REQUIRED_PRECACHE_SUBSTRINGS,
  FORBIDDEN_PRECACHE_PATTERNS,
  MAX_PRECACHE_ENTRY_COUNT,
  MAX_PRECACHE_BYTES,
};
