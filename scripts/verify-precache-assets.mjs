#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VERIFY_SOURCE = process.env.VERIFY_PRECACHE_SOURCE ?? 'local';
const LIVE_RATEWISE_BASE_URL = 'https://app.haotool.org/ratewise/';
const LOCAL_RATEWISE_BASE_URL = 'http://127.0.0.1:4173/ratewise/';
const BASE_URL = process.env.VERIFY_BASE_URL ?? getDefaultBaseUrl(VERIFY_SOURCE);
const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist');
const SW_PATH = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist/sw.js');
const INDEX_HTML_PATH = path.resolve(DIST_DIR, 'index.html');
const MIN_PRECACHE_ENTRY_COUNT = 20;

export function getDefaultBaseUrl(verifySource) {
  return verifySource === 'live' ? LIVE_RATEWISE_BASE_URL : LOCAL_RATEWISE_BASE_URL;
}

export function normalizeBase(url) {
  if (!url.endsWith('/')) {
    return `${url}/`;
  }
  return url;
}

async function loadPrecacheEntries() {
  const swContent = await readFile(SW_PATH, 'utf-8');
  return parsePrecacheEntries(swContent);
}

function parsePrecacheEntries(swContent) {
  const match = swContent.match(/precacheAndRoute\((\[.*?\])\)/s);
  const manifestSource = match?.[1] ?? extractInjectedManifest(swContent);
  if (!manifestSource) {
    throw new Error('無法找到 precache 清單。');
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
  const indexHtml = await readFile(INDEX_HTML_PATH, 'utf-8');
  return parseShellAssetUrls(indexHtml);
}

export function parseShellAssetUrls(indexHtml) {
  const assets = new Set();

  for (const match of indexHtml.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.(?:js|css))"/g)) {
    const assetUrl = match[1];
    if (assetUrl) {
      assets.add(assetUrl.replace(/^\//, ''));
    }
  }

  return Array.from(assets).sort();
}

export function resolvePrecacheAssetUrl(assetUrl, base) {
  return new URL(assetUrl.replace(/^\//, ''), normalizeBase(base)).toString();
}

async function loadLivePrecacheEntries(base) {
  const swUrl = new URL('sw.js', base);
  const response = await fetch(swUrl);
  if (!response.ok) {
    throw new Error(`無法取得 live sw.js: ${swUrl} (status: ${response.status})`);
  }

  return parsePrecacheEntries(await response.text());
}

async function loadLiveShellAssetUrls(base) {
  const response = await fetch(base);
  if (!response.ok) {
    throw new Error(`無法取得 live index HTML: ${base} (status: ${response.status})`);
  }

  return parseShellAssetUrls(await response.text());
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

async function probeWithCacheBust(url) {
  const busted = new URL(url);
  busted.searchParams.set('__edge_probe__', Date.now().toString(36));
  return probe(busted.toString());
}

export async function main() {
  const base = normalizeBase(BASE_URL);
  console.log(`🔍 VERIFY_BASE_URL = ${base}`);
  console.log(`🔍 VERIFY_PRECACHE_SOURCE = ${VERIFY_SOURCE}`);

  const entries =
    VERIFY_SOURCE === 'live' ? await loadLivePrecacheEntries(base) : await loadPrecacheEntries();
  const entryUrls = new Set(entries.map((entry) => entry.url).filter(Boolean));
  const assetEntries = entries.filter((entry) => entry.url && entry.url.startsWith('assets/'));
  const shellAssets =
    VERIFY_SOURCE === 'live' ? await loadLiveShellAssetUrls(base) : await loadShellAssetUrls();

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

  const missingShellAssets = shellAssets.filter((assetUrl) => !entryUrls.has(assetUrl));
  if (missingShellAssets.length > 0) {
    throw new Error(
      `precache 缺少首頁 shell 資產：${missingShellAssets.join(', ')}。這會造成離線冷啟動缺 JS/CSS。`,
    );
  }

  let hasError = false;
  for (const entry of assetEntries) {
    const target = resolvePrecacheAssetUrl(entry.url, base);
    const result = await probe(target);
    if (!result.ok) {
      hasError = true;
      const busted = await probeWithCacheBust(target);
      const staleEdge404 = result.status === 404 && busted.ok;
      console.error(`❌ ${target} 無法擷取 (status: ${result.status})`);
      if (result.message) {
        console.error(`   ↳ ${result.message}`);
      }
      if (staleEdge404) {
        console.error('   ↳ 偵測到 stale edge 404：加 querystring 後可取得 200，請立即 purge CDN');
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

const entryScript = process.argv[1];
const isDirectExecution = entryScript
  ? import.meta.url === pathToFileURL(path.resolve(entryScript)).href
  : false;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`檢查過程發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
