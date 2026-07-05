#!/usr/bin/env node
/**
 * E5 wave-B 可見文字等價驗證（一次性 QA 腳本）
 *
 * 比對兩份 ratewise dist 預渲染 HTML 的「可見文字節點集合」是否等價，
 * 證明 UIUX 重構為純呈現層改動（內容文字零變動）。
 *
 * 正規化規則（透明宣告）：
 * 1. 移除 <script>／<style> 區塊（JSON-LD 由 seo 測試守門，不屬可見文字）。
 * 2. 移除 <nav>…</nav> 導覽 chrome（返回鍵／麵包屑／底部導覽為 App 殼，
 *    非 SEO 內容文字；wave-B 依閘門要求補上行動版底部導覽，屬預期新增）。
 * 3. 文字節點＝相鄰標籤之間的文字；每節點移除全部空白字元
 *    （JSX 換行/{'\u0020'} 插值產生的空白差異不視為內容變動）。
 * 4. 排除不含字母/數字/CJK 的純符號節點（▼、⚖️、💡 等裝飾字符）。
 * 5. build 時戳節點（Built on YYYY/MM/DD HH:MM）遮罩為常數，
 *    對齊 verify-ssg-invariance.mjs 的 build 時戳正規化慣例。
 * 6. 以 multiset（節點字串×出現次數）比對；區塊順序重排不影響等價。
 *
 * 用法：node scripts/qa/verify-visible-text-parity.mjs <baselineDist> <currentDist> [path ...]
 * 預設抽樣頁：/krw-twd/ /usd-twd/ /jpy-twd/ /twd-krw/ /krw-twd/50000/
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_PAGES = ['/krw-twd/', '/usd-twd/', '/jpy-twd/', '/twd-krw/', '/krw-twd/50000/'];

const [baselineDist, currentDist, ...pageArgs] = process.argv.slice(2);
if (!baselineDist || !currentDist) {
  console.error(
    '用法：node scripts/qa/verify-visible-text-parity.mjs <baselineDist> <currentDist> [path ...]',
  );
  process.exit(2);
}
const pages = pageArgs.length > 0 ? pageArgs : DEFAULT_PAGES;

/** 讀取指定路徑的預渲染 HTML。 */
function readPageHtml(distRoot, pagePath) {
  const rel = pagePath === '/' ? 'index.html' : `${pagePath.replace(/^\/+|\/+$/g, '')}/index.html`;
  return readFileSync(resolve(distRoot, rel), 'utf-8');
}

/** 抽取可見文字節點 multiset（Map<正規化節點, 次數>）。 */
function extractTextNodeMultiset(html) {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const multiset = new Map();
  for (const raw of stripped.split(/<[^>]*>/)) {
    let node = raw.replace(/\s+/g, '');
    if (node.length === 0) continue;
    // 僅比對含字母/數字/CJK 的節點，排除純符號裝飾字符。
    if (!/[\p{L}\p{N}]/u.test(node)) continue;
    // build 時戳每次建置必然不同，遮罩為常數避免假差異。
    node = node.replace(/^Builton[\d/:.-]+$/, 'Builton<BUILD_TIME>');
    multiset.set(node, (multiset.get(node) ?? 0) + 1);
  }
  return multiset;
}

/** 比對兩個 multiset，回傳 { added, removed }。 */
function diffMultisets(baseline, current) {
  const added = [];
  const removed = [];
  const keys = new Set([...baseline.keys(), ...current.keys()]);
  for (const key of keys) {
    const b = baseline.get(key) ?? 0;
    const c = current.get(key) ?? 0;
    if (c > b) added.push({ text: key, count: c - b });
    if (b > c) removed.push({ text: key, count: b - c });
  }
  return { added, removed };
}

let failed = false;
for (const page of pages) {
  const baselineSet = extractTextNodeMultiset(readPageHtml(baselineDist, page));
  const currentSet = extractTextNodeMultiset(readPageHtml(currentDist, page));
  const { added, removed } = diffMultisets(baselineSet, currentSet);

  if (added.length === 0 && removed.length === 0) {
    console.log(`PASS ${page}（${baselineSet.size} 種文字節點等價）`);
    continue;
  }
  failed = true;
  console.error(`FAIL ${page}`);
  for (const { text, count } of removed) {
    console.error(`  - 缺少 ×${count}: ${text.slice(0, 120)}`);
  }
  for (const { text, count } of added) {
    console.error(`  + 新增 ×${count}: ${text.slice(0, 120)}`);
  }
}

process.exit(failed ? 1 : 0);
