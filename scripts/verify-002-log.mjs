/**
 * 002 記分守門（issue #608；CI 端強制 issue #661）
 *
 * 驗證重點:
 * 1. 檔頭「本次分數變化：+N（reward a、penalty b、neutral c）」與本次新增條目計數一致
 * 2. 檔頭「累計總分」= 基準版累計總分 + N；初始 commit 或基準版無法解析時跳過
 * 3. 新增條目符合四行模板（日期/ID/原因/解法）、日期為 YYYY-MM-DD、ID 對全檔唯一
 *
 * 兩種執行語意共用同一 validate002 核心（無雙實作）:
 * - pre-commit（預設）：staged 版 vs HEAD 版
 * - CI（--base-ref <ref>）：HEAD 版 vs merge-base(<ref>, HEAD) 版；檔案未變更時跳過
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const LOG_PATH = 'docs/dev/002_development_reward_penalty_log.md';

// 檔頭記分行的標準格式；新 commit 一律要求此格式。
const HEADER_STRICT_RE =
  /^> 本次分數變化：([+-]?\d+)（reward (\d+)、penalty (\d+)、neutral (\d+)）｜累計總分：([+-]?\d+)$/;
// 前版檔頭僅需能取出累計總分（相容歷史自由格式）。
const HEADER_TOTAL_RE = /^> 本次分數變化：.*｜累計總分：([+-]?\d+)$/;

const ENTRY_LINE_PREFIXES = ['- 日期：', '- ID：', '- 原因：', '- 解法：'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_PREFIXES = ['reward-', 'penalty-', 'neutral-'];

function findHeaderLine(content) {
  return content.split('\n').find((line) => line.startsWith('> 本次分數變化：')) ?? null;
}

export function parseStrictHeader(content) {
  const line = findHeaderLine(content);
  if (!line) return null;
  const match = line.match(HEADER_STRICT_RE);
  if (!match) return null;
  return {
    line,
    delta: Number(match[1]),
    reward: Number(match[2]),
    penalty: Number(match[3]),
    neutral: Number(match[4]),
    total: Number(match[5]),
  };
}

export function parsePreviousTotal(content) {
  const line = findHeaderLine(content);
  if (!line) return null;
  const match = line.match(HEADER_TOTAL_RE);
  return match ? Number(match[1]) : null;
}

// 解析「## 條目（新→舊）」區段；每個條目為連續 4 行、以空行分隔。
// 格式錯誤附掛於各條目（entry.errors），供呼叫端只對新增條目擋 commit。
export function parseEntries(content) {
  const globalErrors = [];
  const entries = [];
  const lines = content.split('\n');
  const sectionStart = lines.findIndex((line) => line.startsWith('## 條目'));
  if (sectionStart === -1) {
    return { entries, globalErrors: ['找不到「## 條目」區段'] };
  }

  let block = [];
  const flush = () => {
    if (block.length === 0) return;
    const entry = { id: null, lines: [...block], errors: [] };
    if (block.length !== 4) {
      entry.errors.push(`條目行數應為 4 行（實際 ${block.length} 行）：「${block[0]}」`);
    }
    block.forEach((line, index) => {
      const prefix = ENTRY_LINE_PREFIXES[index];
      if (prefix && !line.startsWith(prefix)) {
        entry.errors.push(`條目第 ${index + 1} 行應以「${prefix}」開頭：「${line}」`);
      }
    });
    const dateLine = block.find((line) => line.startsWith('- 日期：'));
    if (dateLine) {
      const date = dateLine.slice('- 日期：'.length).trim();
      if (!DATE_RE.test(date)) {
        entry.errors.push(`日期格式應為 YYYY-MM-DD：「${date}」`);
      }
    }
    const idLine = block.find((line) => line.startsWith('- ID：'));
    if (idLine) {
      entry.id = idLine.slice('- ID：'.length).trim();
    } else {
      entry.errors.push(`條目缺少 ID 行：「${block[0]}」`);
    }
    entries.push(entry);
    block = [];
  };

  for (const rawLine of lines.slice(sectionStart + 1)) {
    const line = rawLine.trimEnd();
    if (line === '') {
      flush();
      continue;
    }
    if (line.startsWith('## ')) {
      flush();
      break;
    }
    block.push(line);
  }
  flush();

  return { entries, globalErrors };
}

/**
 * 核心驗證：比對待驗版本（stagedContent）與基準版本（headContent）。
 * pre-commit 語意為 staged vs HEAD；CI 語意為 HEAD vs merge-base。
 * headContent 為 null 表示無基準版本情境（跳過刪除防護與總分鏈驗證）。
 */
export function validate002({ stagedContent, headContent }) {
  const errors = [];

  const { entries: stagedEntries, globalErrors } = parseEntries(stagedContent);
  errors.push(...globalErrors);

  const headEntryIds = new Set(
    headContent ? parseEntries(headContent).entries.map((entry) => entry.id) : [],
  );

  // 歷史條目不可靜默刪除（防湮滅 penalty 證據）：HEAD 全部條目 ID（不限標準前綴）
  // 必須仍存在於 staged 版本，缺失即擋 commit。
  const stagedIds = new Set(stagedEntries.map((entry) => entry.id).filter(Boolean));
  const deletedIds = [...headEntryIds].filter((id) => id && !stagedIds.has(id));
  if (deletedIds.length > 0) {
    errors.push(`歷史條目不可刪除，缺失 ID：${deletedIds.map((id) => `「${id}」`).join('、')}`);
  }

  // ID 全檔唯一性。
  const seen = new Set();
  for (const entry of stagedEntries) {
    if (!entry.id) continue;
    if (seen.has(entry.id)) {
      errors.push(`ID 重複：「${entry.id}」`);
    }
    seen.add(entry.id);
  }

  const newEntries = stagedEntries.filter((entry) => entry.id && !headEntryIds.has(entry.id));

  // 僅對本次新增（或無法辨識 ID 的）條目套用格式錯誤，歷史條目不回溯擋 commit。
  for (const entry of stagedEntries) {
    if (entry.errors.length === 0) continue;
    if (entry.id && headEntryIds.has(entry.id)) continue;
    errors.push(...entry.errors);
  }

  const stagedHeaderLine = findHeaderLine(stagedContent);
  const headHeaderLine = headContent ? findHeaderLine(headContent) : null;

  // 檔頭未動且無新增條目（如 typo 修正、prettier 重排）：不驗記分。
  if (newEntries.length === 0 && stagedHeaderLine === headHeaderLine) {
    return { errors };
  }

  const header = parseStrictHeader(stagedContent);
  if (!header) {
    errors.push(
      '檔頭記分行缺失或格式不符，應為：「> 本次分數變化：+N（reward a、penalty b、neutral c）｜累計總分：+T」',
    );
    return { errors };
  }

  // 新增條目依 ID 前綴分類計數。
  const counts = { reward: 0, penalty: 0, neutral: 0 };
  for (const entry of newEntries) {
    const prefix = ID_PREFIXES.find((candidate) => entry.id.startsWith(candidate));
    if (!prefix) {
      errors.push(`新增條目 ID 必須以 reward-/penalty-/neutral- 開頭：「${entry.id}」`);
      continue;
    }
    counts[prefix.slice(0, -1)] += 1;
  }

  if (
    header.reward !== counts.reward ||
    header.penalty !== counts.penalty ||
    header.neutral !== counts.neutral
  ) {
    errors.push(
      `檔頭計數（reward ${header.reward}、penalty ${header.penalty}、neutral ${header.neutral}）` +
        `與本次新增條目（reward ${counts.reward}、penalty ${counts.penalty}、neutral ${counts.neutral}）不符`,
    );
  }

  const expectedDelta = counts.reward - counts.penalty;
  if (header.delta !== expectedDelta) {
    errors.push(`本次分數變化應為 ${expectedDelta}（reward - penalty），檔頭為 ${header.delta}`);
  }

  // 總分鏈：前版累計 + N = 本版累計。
  const previousTotal = headContent ? parsePreviousTotal(headContent) : null;
  if (previousTotal !== null) {
    const expectedTotal = previousTotal + header.delta;
    if (header.total !== expectedTotal) {
      errors.push(
        `累計總分斷鏈：前版 ${previousTotal} + 本次 ${header.delta} = ${expectedTotal}，檔頭為 ${header.total}`,
      );
    }
  }

  return { errors };
}

// spec 形如「:path」（staged）、「HEAD:path」、「<sha>:path」；物件不存在時回傳 null。
function gitShow(spec) {
  try {
    return execFileSync('git', ['show', spec], { encoding: 'utf-8' });
  } catch {
    return null;
  }
}

function report(errors) {
  if (errors.length > 0) {
    console.error('002 記分守門失敗:');
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }
  console.log('002 記分守門通過');
}

// pre-commit 語意：staged 版 vs HEAD 版。
function runPreCommit() {
  const stagedContent = gitShow(`:${LOG_PATH}`);
  if (stagedContent === null) {
    console.log(`002 記分守門跳過（${LOG_PATH} 不在 staged set）`);
    return;
  }
  report(validate002({ stagedContent, headContent: gitShow(`HEAD:${LOG_PATH}`) }).errors);
}

// CI 語意：HEAD 版（PR 最終態）vs merge-base 版；只驗整體一致性、不逐 commit。
function runAgainstBaseRef(baseRef) {
  let mergeBase;
  try {
    mergeBase = execFileSync('git', ['merge-base', baseRef, 'HEAD'], { encoding: 'utf-8' }).trim();
  } catch {
    console.error(`002 記分守門失敗：無法解析 merge-base（base ref「${baseRef}」）`);
    process.exit(1);
  }

  const currentContent = gitShow(`HEAD:${LOG_PATH}`);
  const baseContent = gitShow(`${mergeBase}:${LOG_PATH}`);

  if (currentContent === null) {
    if (baseContent === null) {
      console.log(`002 記分守門跳過（${LOG_PATH} 不存在）`);
      return;
    }
    report([`${LOG_PATH} 不可刪除（merge-base ${mergeBase.slice(0, 12)} 存在此檔）`]);
    return;
  }
  if (currentContent === baseContent) {
    console.log(`002 記分守門跳過（${LOG_PATH} 相對 merge-base ${mergeBase.slice(0, 12)} 無變更）`);
    return;
  }
  report(validate002({ stagedContent: currentContent, headContent: baseContent }).errors);
}

function main() {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf('--base-ref');
  if (flagIndex === -1) {
    runPreCommit();
    return;
  }
  const baseRef = args[flagIndex + 1];
  if (!baseRef) {
    console.error('002 記分守門失敗：--base-ref 需指定基準 ref（例如 origin/main 或 base SHA）');
    process.exit(1);
  }
  runAgainstBaseRef(baseRef);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main();
}
