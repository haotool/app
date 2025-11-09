#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'https://app.haotool.org/';
const PROJECT_ROOT = process.cwd();
const SW_PATH = path.resolve(PROJECT_ROOT, 'apps/ratewise/dist/sw.js');

function normalizeBase(url) {
  if (!url.endsWith('/')) {
    return `${url}/`;
  }
  return url;
}

async function loadPrecacheEntries() {
  const swContent = await readFile(SW_PATH, 'utf-8');
  const match = swContent.match(/precacheAndRoute\((\[.*?\])\)/s);
  if (!match) {
    throw new Error('無法在 dist/sw.js 中找到 precacheAndRoute 清單，請先執行 pnpm build:ratewise');
  }

  try {
    const manifest = JSON.parse(match[1]);
    return manifest;
  } catch (error) {
    throw new Error(
      `解析 precache 清單失敗: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
  const entries = await loadPrecacheEntries();
  const assetEntries = entries.filter((entry) => entry.url && entry.url.startsWith('assets/'));

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

main().catch((error) => {
  console.error(`檢查過程發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
