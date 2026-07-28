// 設計文件守門（T7-C）：docs/GAME_DESIGN.md 索引是拆檔後唯一的「章號 → 檔案」解析器，
// 而 src 註解有 77 處直接引用 §N——索引一旦失真，可導航性承諾即失效且不會有人發現。
// 本腳本把「索引與章節標題一致」「主句紀律」「零錨點引用」機械化，供 vitest 與 CLI 共用。
//
// CLI：node apps/starpuff/scripts/verify-design-docs.mjs
// 測試：scripts/verify-design-docs.test.mjs（掛進 pnpm test）

import { readFileSync, readdirSync, statSync } from 'node:fs';
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
const SRC_DIR = join(SCRIPT_DIR, '..', 'src');
const WALKTHROUGH = join(DOCS_DIR, 'WALKTHROUGH.md');

// doc↔code 引述綁定：文件引述程式碼字串時標註來源檔，例如
//   「同系星彈集滿 3 發，站在地面按 SP 鍵星化變身」（`levels.ts` L8 hint）
// 守門逐字比對該字串確實存在於該來源檔，杜絕「文件抄了舊值」這類無標註漂移。
const QUOTE_BINDING = /「([^」]+)」（`([\w.-]+\.ts)`[^）]*）/g;
// 近似網（僅針對 LevelSpec.hint 九條）：抓沒有綁定標記、又與現行 hint 高度相似的引述。
// 門檻依實測校準——導入時全量掃描設計文件＋攻略共 218 筆「」引述，近似網實際受檢 200 筆
//（扣除已廢止附註、已綁定、與 hint 逐字相符者）：真漏網的 L8 舊文案 0.558 高於門檻，
// 受檢集內非漂移的最高者 0.412（§110.2 變身首教浮字，與 hint 是不同字串；該處其後補上
// 綁定標記而退出受檢集，故現行受檢集最高僅 0.182）。0.558／0.412 兩側由單測鎖住。
export const HINT_SIMILARITY_THRESHOLD = 0.5;

// 取代附註的唯一合法形狀（99-superseded.md「主句紀律」章定義）。
const DEPRECATION_LINE = /^> \*\*已廢止\*\*（[^）]+）：.+/;
// 主句紀律違規樣態：把過期規則留在主句、修正塞進行內括號。
// 被動語態三式（已由／已於／已被）皆須涵蓋——初版漏「已被」，複審實測可繞過守門。
const INLINE_SUPERSESSION = /（v\d+(\.\d+)? 已(由|於|被) §/;

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

// 子標題章號一致性：`### N.x` 的 N 必須等於所屬頂層 `## N.` 的 N。
// 頂層改號時子標題漏改（如 §127→§125 只換頂層）會讓章內導航失真且無人發現。
function checkSubheadings(file) {
  const problems = [];
  const text = readFileSync(join(DESIGN_DIR, file), 'utf8');
  let currentNum = null;
  text.split('\n').forEach((line, i) => {
    const top = /^## (\d+)\. /.exec(line);
    if (top) {
      currentNum = Number(top[1]);
      return;
    }
    const sub = /^### (\d+)\.\d+/.exec(line);
    if (!sub) return;
    const subNum = Number(sub[1]);
    if (currentNum === null) {
      problems.push(`子標題出現在任何頂層章節之前（${file}:${i + 1}）：「${line.trim()}」`);
    } else if (subNum !== currentNum) {
      problems.push(
        `子標題章號與所屬章節不符（${file}:${i + 1}）：「### ${sub[1]}.x」應為「### ${currentNum}.x」`,
      );
    }
  });
  return problems;
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

// src 檔案索引（basename → 絕對路徑），供引述綁定解析來源檔。
function indexSourceFiles(dir, acc = new Map()) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) indexSourceFiles(full, acc);
    else if (name.endsWith('.ts')) (acc.get(name) ?? acc.set(name, []).get(name)).push(full);
  }
  return acc;
}

// 字元 bigram Dice 係數：對中文短句的近似度量比編輯距離穩定，且不需分詞。
export function diceSimilarity(a, b) {
  const grams = (s) => {
    const t = s.replace(/\s+/g, '');
    return new Set(Array.from({ length: Math.max(0, t.length - 1) }, (_, i) => t.slice(i, i + 2)));
  };
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const g of A) if (B.has(g)) shared += 1;
  return (2 * shared) / (A.size + B.size);
}

function readLevelHints() {
  const levels = join(SRC_DIR, 'game', 'logic', 'levels.ts');
  const text = readFileSync(levels, 'utf8');
  return [...text.matchAll(/^\s*hint:\s*'([^']+)'/gm)].map((m) => m[1]);
}

// 引述綁定與近似網：文件引述的程式碼字串必須與 src 逐字相符。
function checkQuoteBindings(docFiles) {
  const problems = [];
  const sources = indexSourceFiles(SRC_DIR);
  const hints = readLevelHints();
  const bound = new Set();

  for (const { name, path } of docFiles) {
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(QUOTE_BINDING)) {
        const [, quoted, srcName] = m;
        bound.add(quoted);
        const candidates = sources.get(srcName);
        if (!candidates) {
          problems.push(`${name}:${i + 1} 引述綁定指向不存在的來源檔 ${srcName}`);
          continue;
        }
        const hit = candidates.some((p) => readFileSync(p, 'utf8').includes(quoted));
        if (!hit) {
          problems.push(
            `${name}:${i + 1} 引述與 ${srcName} 不符（逐字比對失敗）：「${quoted}」——` +
              `文件抄了舊值或來源已改，請同步`,
          );
        }
      }
    });
  }

  // 近似網：沒帶綁定標記、又與現行 hint 高度相似的引述＝疑似過期抄寫（L8 漏網的樣態）。
  // 已廢止附註內本就是舊值，不受檢。
  for (const { name, path } of docFiles) {
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.startsWith('> **已廢止**')) return;
      for (const m of line.matchAll(/「([^」]+)」/g)) {
        const quoted = m[1];
        if (bound.has(quoted) || hints.includes(quoted)) continue;
        for (const hint of hints) {
          if (diceSimilarity(quoted, hint) >= HINT_SIMILARITY_THRESHOLD) {
            problems.push(
              `${name}:${i + 1} 疑似過期的關卡 hint 引述：「${quoted}」——` +
                `現行值為「${hint}」；若為刻意不同的文案請改寫，若是引述請加綁定標記`,
            );
            break;
          }
        }
      }
    });
  }

  return problems;
}

export function verifyDesignDocs() {
  const problems = [];
  const files = listSectionFiles();
  if (files.length === 0) problems.push('design/ 下找不到任何 0*.md 主題檔');

  // 1. 章節標題彙整與重複檢查；子標題章號須與所屬章節一致。
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
    problems.push(...checkSubheadings(file));
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

  // 6. doc↔code 引述綁定：文件引述的程式碼字串必須與 src 逐字相符（含 hint 近似網）。
  const docFiles = [...files, HISTORY_FILE].map((name) => ({
    name,
    path: join(DESIGN_DIR, name),
  }));
  docFiles.push({ name: 'WALKTHROUGH.md', path: WALKTHROUGH });
  problems.push(...checkQuoteBindings(docFiles));

  // 7. 全 repo 零 GAME_DESIGN.md 錨點引用。
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
  console.log('設計文件守門通過：索引與章節一致、主句紀律成立、引述與 src 逐字相符、零錨點引用');
}
