// 設計文件守門（T7-C）：docs/GAME_DESIGN.md 索引是拆檔後唯一的「章號 → 檔案」解析器，
// 而 src 註解有 77 處直接引用 §N——索引一旦失真，可導航性承諾即失效且不會有人發現。
// 本腳本把「索引與章節標題一致」「主句紀律」「零錨點引用」機械化，供 vitest 與 CLI 共用。
//
// CLI：node apps/starpuff/scripts/verify-design-docs.mjs
// 測試：scripts/verify-design-docs.test.mjs（掛進 pnpm test）

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(SCRIPT_DIR, '..', 'docs');
const DESIGN_DIR = join(DOCS_DIR, 'design');
const INDEX_FILE = join(DOCS_DIR, 'GAME_DESIGN.md');
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');

// 主題檔命名契約：0*.md 為現行規格檔，99-superseded.md 為歷史檔（不含 `## N.` 章節）。
const SECTION_FILE_PATTERN = /^0\d-[a-z-]+\.md$/;
const HISTORY_FILE = '99-superseded.md';

// 取代附註的唯一合法形狀（99-superseded.md「主句紀律」章定義）。
const DEPRECATION_LINE = /^> \*\*已廢止\*\*（[^）]+）：.+/;
// 主句紀律違規樣態：把過期規則留在主句、修正塞進行內括號。
const INLINE_SUPERSESSION = /（v\d+(\.\d+)? 已(由|於) §/;

function listSectionFiles() {
  return readdirSync(DESIGN_DIR)
    .filter((name) => SECTION_FILE_PATTERN.test(name))
    .sort();
}

// 解析 `## N. 標題`；回傳 [{ num, title, file, line }]。
function parseHeadings(file) {
  const text = readFileSync(join(DESIGN_DIR, file), 'utf8');
  const out = [];
  text.split('\n').forEach((line, i) => {
    const m = /^## (\d+)\. (.*)$/.exec(line);
    if (m) out.push({ num: Number(m[1]), title: m[2].trim(), file, line: i + 1 });
  });
  return out;
}

// 解析索引表列 `| §N | 標題 | [`檔名`](design/檔名) |`（prettier 會補對齊空白）。
function parseIndexRows() {
  const text = readFileSync(INDEX_FILE, 'utf8');
  const rows = [];
  text.split('\n').forEach((line, i) => {
    const m = /^\|\s*§(\d+)\s*\|(.*?)\|\s*\[`([^`]+)`\]\(design\/([^)]+)\)\s*\|/.exec(line);
    if (m) {
      rows.push({
        num: Number(m[1]),
        title: m[2].trim(),
        label: m[3],
        file: m[4],
        line: i + 1,
      });
    }
  });
  return rows;
}

// 錨點引用掃描：拆檔後 GAME_DESIGN.md 不再有章節錨點，任何 `GAME_DESIGN.md#` 連結必然死鏈。
// 本檔自身帶有偵測字面值，必須自我排除，否則掃描器會檢舉自己。路徑自 import.meta.url
// 推導（非硬編），檔案搬移或改名時排除仍然成立。
const SELF_REL_PATH = relative(REPO_ROOT, fileURLToPath(import.meta.url))
  .split(sep)
  .join('/');

function findAnchorReferences() {
  const tracked = execFileSync('git', ['ls-files', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\0')
    .filter(Boolean);
  const hits = [];
  for (const rel of tracked) {
    if (rel === SELF_REL_PATH) continue;
    if (!/\.(md|ts|tsx|mjs|js|json|ya?ml)$/.test(rel)) continue;
    let text;
    try {
      text = readFileSync(join(REPO_ROOT, rel), 'utf8');
    } catch {
      continue;
    }
    if (!text.includes('GAME_DESIGN.md#')) continue;
    text.split('\n').forEach((line, i) => {
      if (line.includes('GAME_DESIGN.md#')) hits.push(`${rel}:${i + 1}`);
    });
  }
  return hits;
}

export function verifyDesignDocs() {
  const problems = [];
  const files = listSectionFiles();
  if (files.length === 0) problems.push('design/ 下找不到任何 0*.md 主題檔');

  // 1. 章節標題彙整與重複檢查。
  const headings = new Map();
  for (const file of files) {
    for (const h of parseHeadings(file)) {
      const prev = headings.get(h.num);
      if (prev) {
        problems.push(`§${h.num} 重複定義：${prev.file}:${prev.line} 與 ${h.file}:${h.line}`);
        continue;
      }
      headings.set(h.num, h);
    }
  }

  // 2. 章號連續無缺號（新增章節必須接續遞增，不得跳號或回收）。
  const nums = [...headings.keys()].sort((a, b) => a - b);
  if (nums.length > 0) {
    if (nums[0] !== 1) problems.push(`章號未自 §1 起算（實得 §${nums[0]}）`);
    for (let i = 1; i < nums.length; i += 1) {
      if (nums[i] !== nums[i - 1] + 1) {
        problems.push(`章號不連續：§${nums[i - 1]} 之後跳到 §${nums[i]}`);
      }
    }
  }

  // 3. 索引表逐列核對：存在性、檔名正確、零重複、標題同步。
  const rows = parseIndexRows();
  const seenRows = new Set();
  for (const row of rows) {
    if (seenRows.has(row.num)) {
      problems.push(`索引 §${row.num} 重複列（GAME_DESIGN.md:${row.line}）`);
      continue;
    }
    seenRows.add(row.num);
    if (row.label !== row.file) {
      problems.push(`索引 §${row.num} 連結文字與路徑不符：${row.label} vs design/${row.file}`);
    }
    const h = headings.get(row.num);
    if (!h) {
      problems.push(`索引 §${row.num} 指向不存在的章節（GAME_DESIGN.md:${row.line}）`);
      continue;
    }
    if (h.file !== row.file) {
      problems.push(`索引 §${row.num} 指向 ${row.file}，實際位於 ${h.file}`);
    }
    if (h.title !== row.title) {
      problems.push(`索引 §${row.num} 標題與章節不同步：「${row.title}」vs「${h.title}」`);
    }
  }
  for (const num of nums) {
    if (!seenRows.has(num)) problems.push(`§${num}（${headings.get(num).file}）未登記於索引表`);
  }

  // 4. 每檔職責範圍聲明（讀者不需要猜這檔放什麼）。
  for (const file of [...files, HISTORY_FILE]) {
    const text = readFileSync(join(DESIGN_DIR, file), 'utf8');
    if (!text.includes('**職責範圍**')) problems.push(`${file} 缺「職責範圍」聲明`);
    if (!text.includes('**不在本檔**')) problems.push(`${file} 缺「不在本檔」邊界聲明`);
  }

  // 5. 主句紀律：取代註記必須是獨立「已廢止」附註，不得以行內括號夾在主句裡。
  for (const file of [...files, HISTORY_FILE]) {
    const text = readFileSync(join(DESIGN_DIR, file), 'utf8');
    let inFence = false;
    text.split('\n').forEach((line, i) => {
      if (line.startsWith('```')) inFence = !inFence;
      if (inFence) return;
      if (INLINE_SUPERSESSION.test(line)) {
        problems.push(`${file}:${i + 1} 行內取代標註——舊規則須降級為「已廢止」附註`);
      }
      if (line.startsWith('> **已廢止**') && !DEPRECATION_LINE.test(line)) {
        problems.push(
          `${file}:${i + 1} 已廢止附註格式不符（應為 > **已廢止**（<版本> 起，現行見 §<章號>）：<舊敘述>）`,
        );
      }
    });
  }

  // 6. 全 repo 零 GAME_DESIGN.md 錨點引用。
  for (const hit of findAnchorReferences()) {
    problems.push(`${hit} 使用 GAME_DESIGN.md 錨點連結——拆檔後必為死鏈，改引用 §N`);
  }

  return { problems, sectionCount: headings.size, indexRowCount: rows.length, files };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { problems, sectionCount, indexRowCount, files } = verifyDesignDocs();
  console.log(`主題檔 ${files.length} 個、章節 ${sectionCount} 章、索引 ${indexRowCount} 列`);
  if (problems.length > 0) {
    console.error(`\n設計文件守門失敗（${problems.length} 項）：`);
    problems.forEach((p) => console.error(` - ${p}`));
    process.exit(1);
  }
  console.log('設計文件守門通過：索引與章節一致、主句紀律成立、零錨點引用');
}
