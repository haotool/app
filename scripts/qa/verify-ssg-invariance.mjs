#!/usr/bin/env node
/**
 * SSG 不變性驗證：比對兩份 ratewise dist 的預渲染 HTML，證明變更未影響 SSG 輸出。
 *
 * 比對邏輯：
 * 1. 檔案集合必須完全一致。
 * 2. 每頁取 <div id="root"> 起至第一個 <script> 或 </body> 前的 SSG 渲染 DOM 本體，
 *    正規化與 build 無關的噪音（hashed asset 檔名、build 時間戳、版本序號、?v= 日期）後必須相等。
 *
 * 用法：
 *   node scripts/qa/verify-ssg-invariance.mjs <baselineDistDir> <currentDistDir>
 *
 * 重現範例（以分支起點為基準，驗證 flag off 時 SSG 輸出不變）：
 *   BASE=$(git merge-base origin/experiment/ratewise-product-2026h2 HEAD)
 *   git worktree add /tmp/ssg-base "$BASE"
 *   (cd /tmp/ssg-base && pnpm install --frozen-lockfile && pnpm build:ratewise)
 *   pnpm build:ratewise
 *   node scripts/qa/verify-ssg-invariance.mjs /tmp/ssg-base/apps/ratewise/dist apps/ratewise/dist
 *   git worktree remove /tmp/ssg-base
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

function collectHtmlFiles(rootDir) {
  const results = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.html')) {
        results.push(relative(rootDir, fullPath));
      }
    }
  };
  walk(rootDir);
  return results.sort();
}

// 正規化與本次變更無關的 build 噪音，聚焦 SSG 渲染輸出本體。
function normalize(text) {
  return text
    .replace(/\/assets\/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8,}\.(js|css)/g, '/assets/HASH.$1')
    .replace(/"buildTime":"[^"]+"/g, '"buildTime":"X"')
    .replace(/content="\d{4}-\d{2}-\d{2}T[^"]*"/g, 'content="TIME"')
    .replace(/app-version" content="[^"]+"/g, 'app-version" content="X"')
    .replace(/APP_VERSION = '[^']+'/g, "APP_VERSION = 'X'")
    .replace(/\?v=\d{8}/g, '?v=DATE')
    .replace(/"dateModified":"[^"]+"/g, '"dateModified":"X"')
    .replace(/<time datetime="[^"]+"([^>]*)>[^<]*<\/time>/g, '<time datetime="X"$1>X</time>')
    .replace(/Built on (<!-- -->)?\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/g, 'Built on $1X');
}

// 取 SSG 渲染 DOM 本體（#root 容器起至第一個 script 或 body 結尾前）。
// 注意：root 容器帶 data-server-rendered 屬性，不可寫死為 <div id="root">。
function extractRootDom(text) {
  const match = /<div id="root"[^>]*>[\s\S]*?(?=<script|<\/body>)/.exec(text);
  return match ? match[0] : null;
}

function main() {
  const [baselineDir, currentDir] = process.argv.slice(2);
  if (!baselineDir || !currentDir) {
    console.error(
      '用法：node scripts/qa/verify-ssg-invariance.mjs <baselineDistDir> <currentDistDir>',
    );
    process.exit(2);
  }

  const baselineFiles = collectHtmlFiles(baselineDir);
  const currentFiles = collectHtmlFiles(currentDir);

  const baselineSet = new Set(baselineFiles);
  const currentSet = new Set(currentFiles);
  const missingInCurrent = baselineFiles.filter((file) => !currentSet.has(file));
  const extraInCurrent = currentFiles.filter((file) => !baselineSet.has(file));

  let rootDiffCount = 0;
  let rootMissingCount = 0;
  const diffSamples = [];

  for (const file of baselineFiles) {
    if (!currentSet.has(file)) continue;
    const baselineText = readFileSync(join(baselineDir, file), 'utf8');
    const currentText = readFileSync(join(currentDir, file), 'utf8');
    const baselineRoot = extractRootDom(baselineText);
    const currentRoot = extractRootDom(currentText);

    // 兩邊皆無 #root（如 offline.html 兜底頁）：退回全文正規化比對。
    if (baselineRoot === null && currentRoot === null) {
      if (normalize(baselineText) !== normalize(currentText)) {
        rootDiffCount += 1;
        if (diffSamples.length < 10) diffSamples.push(file);
      }
      continue;
    }
    // 僅單邊缺 #root：結構性差異，直接視為失敗。
    if (baselineRoot === null || currentRoot === null) {
      rootMissingCount += 1;
      continue;
    }
    if (normalize(baselineRoot) !== normalize(currentRoot)) {
      rootDiffCount += 1;
      if (diffSamples.length < 10) diffSamples.push(file);
    }
  }

  console.log(`HTML 頁面數：baseline=${baselineFiles.length} current=${currentFiles.length}`);
  console.log(`檔案集合差異：missing=${missingInCurrent.length} extra=${extraInCurrent.length}`);
  console.log(`#root DOM 差異頁數（正規化後）：${rootDiffCount}`);
  console.log(`#root 單邊缺漏頁數：${rootMissingCount}`);
  if (missingInCurrent.length > 0) console.log('missing:', missingInCurrent.slice(0, 10));
  if (extraInCurrent.length > 0) console.log('extra:', extraInCurrent.slice(0, 10));
  if (diffSamples.length > 0) console.log('diff samples:', diffSamples);

  const failed =
    missingInCurrent.length > 0 ||
    extraInCurrent.length > 0 ||
    rootDiffCount > 0 ||
    rootMissingCount > 0;

  if (failed) {
    console.error('SSG 不變性驗證失敗');
    process.exit(1);
  }
  console.log('SSG 不變性驗證通過');
}

main();
