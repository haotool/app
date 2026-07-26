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
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const LOG_PATH = 'docs/dev/002_development_reward_penalty_log.md';

// 檔頭記分行的標準格式；新 commit 一律要求此格式。
// 正負號強制存在：文件所定格式為 `+N`／`+T`，省略加號會讓非標準檔頭寫進稽核記錄。
const HEADER_STRICT_RE =
  /^> 本次分數變化：([+-]\d+)（reward (\d+)、penalty (\d+)、neutral (\d+)）｜累計總分：([+-]\d+)$/;
// 前版檔頭僅需能取出累計總分（相容歷史自由格式）。
const HEADER_TOTAL_RE = /^> 本次分數變化：.*｜累計總分：([+-]?\d+)$/;

const ENTRY_LINE_PREFIXES = ['- 日期：', '- ID：', '- 原因：', '- 解法：'];
// 日期與 ID 各有專屬檢查，這兩欄只需確認非空。
const CONTENT_PREFIXES = ['- 原因：', '- 解法：'];
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
// 另以「- 日期：」作次要邊界：歷史檔有 2 處漏空行使多筆黏成一塊（8 行 2 筆、12 行 3 筆），
// 僅靠空行切分會讓後續 3 筆條目的 ID 對唯一性與刪除防護隱形。
// 格式錯誤附掛於各條目（entry.errors），供呼叫端只對新增條目擋 commit。
export function parseEntries(content) {
  const globalErrors = [];
  const entries = [];
  const lines = content.split('\n');
  const sectionStarts = lines.reduce(
    (acc, line, index) => (line.startsWith('## 條目') ? [...acc, index] : acc),
    [],
  );
  if (sectionStarts.length === 0) {
    return { entries, globalErrors: ['找不到「## 條目」區段'] };
  }
  // 只解析第一個區段，故多個「## 條目」等於替後續區段開一個永久盲區：
  // 前置 decoy 區段抄齊全部 ID 即可滿足刪除防護，真區段從此不受守門檢視。
  if (sectionStarts.length > 1) {
    return {
      entries,
      globalErrors: [`「## 條目」區段必須唯一（找到 ${sectionStarts.length} 個）`],
    };
  }
  const sectionStart = sectionStarts[0];

  let block = [];
  const flush = () => {
    if (block.length === 0) return;
    // 各欄位取值（trim 後）；缺該行則不存在此 key。供內容檢查與跨版本非空比對共用。
    const fields = {};
    for (const prefix of ENTRY_LINE_PREFIXES) {
      const line = block.find((candidate) => candidate.startsWith(prefix));
      if (line !== undefined) {
        fields[prefix] = line.slice(prefix.length).trim();
      }
    }
    const entry = { id: null, lines: [...block], fields, errors: [] };
    // 空白 ID 視同缺少 ID：留成空字串會被後續 truthy 篩選排除在新增條目之外，
    // 使該筆同時繞過前綴、唯一性、計數與總分檢查。
    const idValue = fields['- ID：'] ?? '';
    if (idValue) {
      entry.id = idValue;
    }
    // 定位字串優先用 ID：500+ 條目的檔案裡，只引用首行（多為日期）不足以指出是哪一筆。
    const locator = entry.id ?? block[0];
    if (block.length !== 4) {
      entry.errors.push(`條目行數應為 4 行（實際 ${block.length} 行）：「${locator}」`);
    }
    block.forEach((line, index) => {
      const prefix = ENTRY_LINE_PREFIXES[index];
      if (prefix && !line.startsWith(prefix)) {
        entry.errors.push(`條目「${locator}」第 ${index + 1} 行應以「${prefix}」開頭：「${line}」`);
      }
    });
    const date = fields['- 日期：'];
    if (date !== undefined && !DATE_RE.test(date)) {
      entry.errors.push(`條目「${locator}」日期格式應為 YYYY-MM-DD：「${date}」`);
    }
    // 四行模板要求每筆都有一句話 root cause 與 resolution；只檢查前綴會讓空值通過。
    for (const prefix of CONTENT_PREFIXES) {
      if (fields[prefix] === '') {
        entry.errors.push(`條目「${locator}」的「${prefix}」不可為空`);
      }
    }
    if (!entry.id) {
      entry.errors.push(
        fields['- ID：'] === undefined
          ? `條目缺少 ID 行：「${block[0]}」`
          : `條目 ID 不可為空：「${block[0]}」`,
      );
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
    if (line.startsWith('- 日期：') && block.length > 0) {
      flush();
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

  const headEntries = headContent ? parseEntries(headContent).entries : [];
  const headEntryIds = new Set(headEntries.map((entry) => entry.id));

  // 歷史條目不可靜默刪除（防湮滅 penalty 證據）：HEAD 全部條目 ID（不限標準前綴）
  // 必須仍存在於 staged 版本，缺失即擋 commit。
  const stagedIds = new Set(stagedEntries.map((entry) => entry.id).filter(Boolean));
  const deletedIds = [...headEntryIds].filter((id) => id && !stagedIds.has(id));
  if (deletedIds.length > 0) {
    errors.push(`歷史條目不可刪除，缺失 ID：${deletedIds.map((id) => `「${id}」`).join('、')}`);
  }

  // 掏空既有條目 = 就地刪除，是刪除防護的等效規避路徑（保留檔案與 ID、把內容清空）。
  // 判準只看「有沒有從有變成無」而非內容是否改動：精確性修正（改錯字、更正數字）
  // 保留非空故不受影響；語意層的改寫由審查把關，不在守門範圍。
  // 歷史上本來就為空的欄位維持豁免，不回溯擋 commit。
  const headEntriesById = new Map(
    headEntries.filter((entry) => entry.id).map((entry) => [entry.id, entry]),
  );
  for (const entry of stagedEntries) {
    const headEntry = entry.id ? headEntriesById.get(entry.id) : undefined;
    if (!headEntry) continue;
    for (const prefix of ENTRY_LINE_PREFIXES) {
      if (headEntry.fields[prefix] && !entry.fields[prefix]) {
        errors.push(`條目「${entry.id}」的「${prefix}」原有內容不可清空`);
      }
    }
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

// pre-commit 語意：staged 版（index）vs HEAD 版。
function runPreCommit() {
  const stagedContent = gitShow(`:${LOG_PATH}`);
  const headContent = gitShow(`HEAD:${LOG_PATH}`);
  if (stagedContent === null) {
    // index 無此路徑但 HEAD 有 = staged 刪除（`git rm`），必須擋下；
    // 兩邊皆無才是與 002 無關的 commit。
    if (headContent !== null) {
      report([`${LOG_PATH} 不可刪除（HEAD 存在此檔，index 已移除）`]);
      return;
    }
    console.log(`002 記分守門跳過（${LOG_PATH} 不存在於 index 與 HEAD）`);
    return;
  }
  report(validate002({ stagedContent, headContent }).errors);
}

// CI 語意：HEAD 版（最終態）vs 基準版；只驗整體一致性、不逐 commit。
// useMergeBase=true（PR）：基準取 merge-base(ref, HEAD)——base 分支會前進，需退回分岔點。
// useMergeBase=false（main push）：基準直接取 ref（推送前的 tip）。此處**不得**取 merge-base：
// 非快轉／force push 時 before 不是 HEAD 的祖先，merge-base 會退到更早的共同祖先，
// 使 before 與祖先之間新增的 penalty 條目在改寫後消失也驗不出來——而那正是本模式的存在理由。
function runAgainstBaseRef(ref, { useMergeBase }) {
  let base = ref;
  if (useMergeBase) {
    try {
      base = execFileSync('git', ['merge-base', ref, 'HEAD'], { encoding: 'utf-8' }).trim();
    } catch {
      console.error(`002 記分守門失敗：無法解析 merge-base（base ref「${ref}」）`);
      process.exit(1);
    }
  } else {
    try {
      base = execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], {
        encoding: 'utf-8',
      }).trim();
    } catch {
      console.error(`002 記分守門失敗：無法解析基準 commit（「${ref}」）`);
      process.exit(1);
    }
  }

  const label = `${useMergeBase ? 'merge-base' : '基準'} ${base.slice(0, 12)}`;
  const currentContent = gitShow(`HEAD:${LOG_PATH}`);
  const baseContent = gitShow(`${base}:${LOG_PATH}`);

  if (currentContent === null) {
    if (baseContent === null) {
      console.log(`002 記分守門跳過（${LOG_PATH} 不存在）`);
      return;
    }
    report([`${LOG_PATH} 不可刪除（${label} 存在此檔）`]);
    return;
  }
  if (currentContent === baseContent) {
    console.log(`002 記分守門跳過（${LOG_PATH} 相對 ${label} 無變更）`);
    return;
  }
  report(validate002({ stagedContent: currentContent, headContent: baseContent }).errors);
}

function main() {
  const args = process.argv.slice(2);
  for (const [flag, useMergeBase] of [
    ['--base-ref', true],
    ['--base-commit', false],
  ]) {
    const index = args.indexOf(flag);
    if (index === -1) continue;
    const ref = args[index + 1];
    if (!ref) {
      console.error(`002 記分守門失敗：${flag} 需指定基準（例如 origin/main 或 base SHA）`);
      process.exit(1);
    }
    runAgainstBaseRef(ref, { useMergeBase });
    return;
  }
  runPreCommit();
}

// argv[1] 需先解析 symlink 再比對：macOS 的 /tmp 是 /private/tmp 的 symlink，
// 以絕對路徑呼叫時兩側不等會讓 main() 靜默不執行並 exit 0（假成功）。
function isDirectRun() {
  const invoked = process.argv[1];
  if (!invoked) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href;
  } catch {
    return import.meta.url === pathToFileURL(invoked).href;
  }
}

if (isDirectRun()) {
  main();
}
