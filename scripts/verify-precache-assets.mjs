#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

import { readFile, existsSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'https://app.haotool.org/';
const VERIFY_SOURCE = process.env.VERIFY_PRECACHE_SOURCE ?? 'local';
const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist');
const SW_PATH = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist/sw.js');
const INDEX_HTML_PATH = path.resolve(DIST_DIR, 'index.html');
const MIN_PRECACHE_ENTRY_COUNT = 20;

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
};
