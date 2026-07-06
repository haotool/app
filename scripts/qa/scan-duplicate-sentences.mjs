#!/usr/bin/env node
/**
 * 一次性 QA 掃描：跨頁逐字重複句清單（供重複內容收斂稽核）。
 * 從 dist 預渲染 HTML 抽出可見文字（沿用 verify-visible-text-parity 的正規化：
 * 去 script／style／nav），以 。？！ 分句，列出出現在多個頁面的相同句子。
 * 用法：node scripts/qa/scan-duplicate-sentences.mjs <distRoot> [minLen=10]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGES = [
  '/',
  '/faq/',
  '/guide/',
  '/about/',
  '/privacy/',
  '/open-data/',
  '/seo-tech/',
  '/open-source/',
  '/sell-rate-vs-mid-rate/',
  '/cash-vs-spot-rate/',
  '/card-rate-guide/',
];

const [distRoot, minLenArg] = process.argv.slice(2);
if (!distRoot) {
  console.error('用法：node scripts/qa/scan-duplicate-sentences.mjs <distRoot> [minLen]');
  process.exit(2);
}
const MIN_LEN = Number(minLenArg ?? 10);

function readPageHtml(pagePath) {
  const rel = pagePath === '/' ? 'index.html' : `${pagePath.replace(/^\/+|\/+$/g, '')}/index.html`;
  return readFileSync(resolve(distRoot, rel), 'utf-8');
}

function extractSentences(html) {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = stripped
    .split(/<[^>]*>/)
    .map((s) => s.replace(/\s+/g, ''))
    .join('|');
  const sentences = new Set();
  for (const raw of text.split(/[。？！|]/)) {
    const cjkCount = (raw.match(/[\u4e00-\u9fff]/g) ?? []).length;
    if (raw.length >= MIN_LEN && cjkCount >= 8) sentences.add(raw);
  }
  return sentences;
}

const byPage = new Map(PAGES.map((page) => [page, extractSentences(readPageHtml(page))]));
const bySentence = new Map();
for (const [page, sentences] of byPage) {
  for (const sentence of sentences) {
    if (!bySentence.has(sentence)) bySentence.set(sentence, []);
    bySentence.get(sentence).push(page);
  }
}

const dups = [...bySentence.entries()]
  .filter(([, pages]) => pages.length > 1)
  .sort((a, b) => b[0].length - a[0].length);

for (const [sentence, pages] of dups) {
  console.log(`【${pages.join(' ＋ ')}】`);
  console.log(`  ${sentence}`);
}
console.log(`\n共 ${dups.length} 個跨頁逐字重複句（≥${MIN_LEN} 字）`);
