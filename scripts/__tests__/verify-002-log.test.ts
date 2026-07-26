import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LOG_PATH as LOG_PATH_UNTYPED,
  parseEntries,
  parsePreviousTotal,
  parseStrictHeader,
  validate002,
} from '../verify-002-log.mjs';

// .mjs 無型別宣告，正規化為 string 供路徑參數使用（維持 SSOT、不複製字面值）。
const LOG_PATH = String(LOG_PATH_UNTYPED);

function buildLog({
  header,
  entries,
}: {
  header: string;
  entries: { date?: string; id: string; reason?: string; fix?: string }[];
}) {
  const blocks = entries.map(
    (entry) =>
      `- 日期：${entry.date ?? '2026-07-07'}\n- ID：${entry.id}\n- 原因：${entry.reason ?? '原因'}\n- 解法：${entry.fix ?? '解法'}`,
  );
  return [
    '# 開發獎懲與決策記錄（超短版）',
    '',
    '> 版本：outline-v2-ultra',
    '> 原則：每筆只保留日期、ID、原因、解法。',
    header,
    '',
    '## 新增模板（4 行）',
    '',
    '- 日期：YYYY-MM-DD',
    '- ID：<唯一識別>',
    '- 原因：<一句話 root cause>',
    '- 解法：<一句話修正>',
    '',
    '## 條目（新→舊）',
    '',
    ...blocks.flatMap((block) => [block, '']),
  ].join('\n');
}

const HEAD_CONTENT = buildLog({
  header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
  entries: [{ id: 'reward-existing-entry' }],
});

describe('parseStrictHeader / parsePreviousTotal', () => {
  it('解析標準檔頭記分行', () => {
    expect(
      parseStrictHeader('> 本次分數變化：+2（reward 3、penalty 1、neutral 0）｜累計總分：+172'),
    ).toEqual({
      line: '> 本次分數變化：+2（reward 3、penalty 1、neutral 0）｜累計總分：+172',
      delta: 2,
      reward: 3,
      penalty: 1,
      neutral: 0,
      total: 172,
    });
  });

  it('歷史自由格式檔頭仍可取出累計總分（前版相容）', () => {
    expect(
      parsePreviousTotal(
        '> 本次分數變化：+5（雙線合併：本線 reward 4＋上游 reward 1）｜累計總分：+170',
      ),
    ).toBe(170);
    expect(
      parseStrictHeader(
        '> 本次分數變化：+5（雙線合併：本線 reward 4＋上游 reward 1）｜累計總分：+170',
      ),
    ).toBeNull();
  });
});

describe('parseEntries', () => {
  it('解析四行模板條目與 ID', () => {
    const { entries, globalErrors } = parseEntries(HEAD_CONTENT);
    expect(globalErrors).toEqual([]);
    expect(entries.map((entry) => entry.id)).toEqual(['reward-existing-entry']);
    expect(entries[0]?.errors).toEqual([]);
  });

  it('缺少條目區段時回報全域錯誤', () => {
    const { globalErrors } = parseEntries('# 空文件');
    expect(globalErrors).toEqual(['找不到「## 條目」區段']);
  });

  // 只解析第一個區段，故多個「## 條目」等於替後續區段開一個永久盲區：
  // 前置 decoy 抄齊全部 ID 即可滿足刪除防護，真區段從此不受檢視。
  it('多個「## 條目」區段時回報全域錯誤（decoy 區段盲區）', () => {
    const decoyed = HEAD_CONTENT.replace(
      '## 條目（新→舊）',
      '## 條目（索引）\n\n- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n\n## 條目（新→舊）',
    );
    const { globalErrors } = parseEntries(decoyed);
    expect(globalErrors).toEqual(['「## 條目」區段必須唯一（找到 2 個）']);
  });

  // 歷史檔有數處漏空行使多筆黏成一塊；僅靠空行切分會讓後續條目 ID 隱形。
  it('漏空行黏成一塊時仍以「- 日期：」逐筆切分', () => {
    const glued = HEAD_CONTENT.replace(
      '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法',
      '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n' +
        '- 日期：2026-07-07\n- ID：reward-glued-entry\n- 原因：原因\n- 解法：解法',
    );
    const { entries } = parseEntries(glued);
    expect(entries.map((entry) => entry.id)).toEqual([
      'reward-existing-entry',
      'reward-glued-entry',
    ]);
    expect(entries.every((entry) => entry.errors.length === 0)).toBe(true);
  });
});

describe('validate002', () => {
  it('正確案例：計數、分數變化、總分鏈全部一致', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    expect(validate002({ stagedContent: staged, headContent: HEAD_CONTENT }).errors).toEqual([]);
  });

  it('計數不符：檔頭寫 reward 2 但只新增 1 筆', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('不符'))).toBe(true);
  });

  it('分數變化算式錯誤：reward 1、penalty 1 應為 0', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 1、neutral 0）｜累計總分：+171',
      entries: [
        { id: 'reward-new-entry' },
        { id: 'penalty-new-entry' },
        { id: 'reward-existing-entry' },
      ],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('本次分數變化應為 0'))).toBe(true);
  });

  it('總分斷鏈：前版 +170 加 +1 應為 +171 而非 +175', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+175',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('累計總分斷鏈'))).toBe(true);
  });

  it('ID 重複：新增條目沿用既有 ID', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-existing-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('ID 重複'))).toBe(true);
  });

  it('格式錯行：新增條目缺「解法」行', () => {
    const staged = [
      HEAD_CONTENT.replace(
        '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      ).replace(
        '## 條目（新→舊）\n',
        '## 條目（新→舊）\n\n- 日期：2026-07-07\n- ID：reward-broken-entry\n- 原因：只有三行\n',
      ),
    ].join('');
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('條目行數應為 4 行'))).toBe(true);
  });

  it('日期格式錯誤：非 YYYY-MM-DD', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry', date: '2026/07/07' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('日期格式應為 YYYY-MM-DD'))).toBe(true);
  });

  // 空白 ID 若留成空字串，會被 newEntries 的 truthy 篩選排除，
  // 使該筆同時繞過前綴、唯一性、計數與總分檢查（檔頭不動即全綠）。
  it.each([
    ['空字串', ''],
    ['僅空白', '   '],
  ])('新增條目 ID 為%s時視同缺少 ID 並擋下', (_label, id) => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('條目 ID 不可為空'))).toBe(true);
  });

  // 只檢查行前綴會讓「- 原因：」／「- 解法：」的空值通過，
  // 使缺 root cause 或 resolution 的紀錄同時通過本地與 CI 守門。
  it.each([
    ['原因', { reason: '  ', fix: '解法' }, '- 原因：'],
    ['解法', { reason: '原因', fix: '' }, '- 解法：'],
  ])('新增條目的%s欄位為空時擋下', (_label, fields, prefix) => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry', ...fields }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes(`「${prefix}」不可為空`))).toBe(true);
  });

  it('新增條目 ID 前綴不合法時擋下', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'bonus-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('reward-/penalty-/neutral-'))).toBe(true);
  });

  it('初始 commit（無 HEAD 版本）跳過總分鏈但仍驗計數', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
      entries: [{ id: 'reward-first-entry' }],
    });
    expect(validate002({ stagedContent: staged, headContent: null }).errors).toEqual([]);
  });

  it('歷史條目格式問題不回溯擋 commit', () => {
    const headWithLegacy = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-legacy-entry', date: '2026/1/1' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-legacy-entry', date: '2026/1/1' }],
    });
    expect(validate002({ stagedContent: staged, headContent: headWithLegacy }).errors).toEqual([]);
  });

  it('無新增條目且檔頭未動（如 typo 修正）不驗記分', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry', reason: '修正錯字' }],
    });
    expect(validate002({ stagedContent: staged, headContent: HEAD_CONTENT }).errors).toEqual([]);
  });

  it('靜默刪除歷史條目（檔頭未動）必須被擋下', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'penalty-old-incident' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('penalty-old-incident'),
      ),
    ).toBe(true);
  });

  it('刪除非標準前綴的歷史條目同樣被擋下（⊆ 檢查不限標準前綴）', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'legacy-2026-incident-log' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('legacy-2026-incident-log'),
      ),
    ).toBe(true);
  });

  it('刪除黏在同一塊（漏空行）中的歷史條目同樣被擋下', () => {
    const glue = (content: string) =>
      content.replace(
        '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n\n',
        '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n',
      );
    const head = glue(
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'reward-existing-entry' }, { id: 'penalty-glued-incident' }],
      }),
    );
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('penalty-glued-incident'),
      ),
    ).toBe(true);
  });

  // 掏空既有條目 = 就地刪除，是刪除防護的等效規避路徑（保留檔案與 ID、把內容清空）。
  it.each([
    ['原因', { reason: '' }, '- 原因：'],
    ['解法', { fix: '   ' }, '- 解法：'],
    ['日期', { date: '' }, '- 日期：'],
  ])('掏空既有條目的%s欄位必須被擋下', (_label, emptied, prefix) => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [
        { id: 'penalty-old-incident', reason: '原始原因', fix: '原始解法' },
        { id: 'reward-existing-entry' },
      ],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [
        { id: 'penalty-old-incident', reason: '原始原因', fix: '原始解法', ...emptied },
        { id: 'reward-existing-entry' },
      ],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes(`「${prefix}」原有內容不可清空`) &&
          message.includes('penalty-old-incident'),
      ),
    ).toBe(true);
  });

  // 整行刪除（既有四行條目縮成只剩日期與 ID）與留空值同屬掏空，
  // 不得因「歷史條目格式錯誤不回溯」而被略過。
  it('既有條目被刪成只剩日期與 ID 必須被擋下', () => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({
      header,
      entries: [
        { id: 'penalty-old-incident', reason: '真實事故根因', fix: '真實修法' },
        { id: 'reward-existing-entry' },
      ],
    });
    const staged = head.replace('- 原因：真實事故根因\n- 解法：真實修法\n', '');
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(errors.some((message) => message.includes('「- 原因：」原有內容不可清空'))).toBe(true);
    expect(errors.some((message) => message.includes('「- 解法：」原有內容不可清空'))).toBe(true);
  });

  // 正向對照採本 PR 真實發生的精確性修正（002 破口規模數字由 5 處／6 筆更正為 2 處／3 筆）：
  // 判準是「有沒有從有變成無」，內容改動本身不受限。
  it('精確性修正（非空改為另一個非空）不受掏空防護影響', () => {
    const before = {
      id: 'reward-002-log-gate-glued-block-parsing',
      reason:
        '來源版解析器只用空行切分條目，但歷史 002 有 5 處漏空行使多筆黏成一塊——`block.find` 只取首個 ID，使 6 筆條目對唯一性與刪除防護隱形',
      fix: '解析器補「- 日期：」為次要邊界（空行仍為主要邊界），納管條目由 513 升為 518',
    };
    const after = {
      id: before.id,
      reason:
        '來源版解析器只用空行切分條目，但歷史 002 有 2 處漏空行使多筆黏成一塊（8 行 2 筆、12 行 3 筆）——`block.find` 只取首個 ID，使 3 筆條目對唯一性與刪除防護隱形',
      fix: '解析器補「- 日期：」為次要邊界（空行仍為主要邊界），納管條目由 515 升為 518',
    };
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({ header, entries: [before, { id: 'reward-existing-entry' }] });
    const staged = buildLog({ header, entries: [after, { id: 'reward-existing-entry' }] });
    expect(validate002({ stagedContent: staged, headContent: head }).errors).toEqual([]);
  });

  it('正常 append（歷史條目完整保留，含非標準前綴）不受刪除防護影響', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'legacy-2026-incident-log' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [
        { id: 'reward-new-entry' },
        { id: 'reward-existing-entry' },
        { id: 'legacy-2026-incident-log' },
      ],
    });
    expect(validate002({ stagedContent: staged, headContent: head }).errors).toEqual([]);
  });
});

describe('git 整合（pre-commit staged 語意／--base-ref CI 語意 issue #661）', () => {
  const SCRIPT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'verify-002-log.mjs');
  // 隔離全域/系統 git config（gpgsign、hooksPath 等），身分改由環境變數提供。
  // 先剝除繼承的 GIT_* 變數：hook 環境（pre-push 跑 vitest）會注入 GIT_DIR/GIT_INDEX_FILE，
  // 子行程若繼承會把臨時 repo 的 git 操作導向父 repo。
  const GIT_ENV = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_AUTHOR_NAME: 'vitest',
    GIT_AUTHOR_EMAIL: 'vitest@example.com',
    GIT_COMMITTER_NAME: 'vitest',
    GIT_COMMITTER_EMAIL: 'vitest@example.com',
  };
  const repos: string[] = [];

  afterEach(() => {
    for (const repo of repos.splice(0)) {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  function git(cwd: string, ...args: string[]) {
    // stderr 收進 pipe，避免 checkout 等訊息污染測試輸出。
    return execFileSync('git', args, {
      cwd,
      env: GIT_ENV,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  function commitLog(repo: string, content: string, message: string) {
    writeFileSync(join(repo, LOG_PATH), content);
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', message);
  }

  // 建立 main 上有基準 002 的臨時 repo，並切到 pr 分支模擬 PR HEAD。
  function setupRepo() {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    commitLog(repo, HEAD_CONTENT, 'init');
    git(repo, 'checkout', '-b', 'pr');
    return repo;
  }

  function runScript(repo: string, scriptPath: string, ...args: string[]) {
    try {
      const stdout = execFileSync('node', [scriptPath, ...args], {
        cwd: repo,
        env: GIT_ENV,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, output: stdout };
    } catch (error) {
      const failed = error as { status?: number | null; stdout?: string; stderr?: string };
      return {
        status: failed.status ?? 1,
        output: `${failed.stdout ?? ''}${failed.stderr ?? ''}`,
      };
    }
  }

  function runGuard(repo: string, ...args: string[]) {
    return runScript(repo, SCRIPT_PATH, ...args);
  }

  it('構造計數不符的 PR 最終態必紅', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
      'bad count',
    );
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(1);
    expect(output).toContain('不符');
  });

  it('正確 append 的 PR 綠燈', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
      'good append',
    );
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('002 未變更的 PR 跳過（零額外負擔）', () => {
    const repo = setupRepo();
    writeFileSync(join(repo, 'other.txt'), 'unrelated');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'unrelated');
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
    expect(output).toContain('跳過');
  });

  it('多 commit PR 只驗最終態 vs merge-base（中間態不一致不擋）', () => {
    const repo = setupRepo();
    // 中間 commit：新增條目但檔頭未同步（單看此 commit 會紅）。
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'reward-step-one' }, { id: 'reward-existing-entry' }],
      }),
      'step 1',
    );
    // 最終 commit：整體對帳一致（新增 2 筆、+2、總分 172）。
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
        entries: [
          { id: 'reward-step-two' },
          { id: 'reward-step-one' },
          { id: 'reward-existing-entry' },
        ],
      }),
      'step 2',
    );
    const { status } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
  });

  it('base 分支前進後仍以 merge-base 為基準（非 base tip）', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-from-pr' }, { id: 'reward-existing-entry' }],
      }),
      'pr entry',
    );
    git(repo, 'checkout', 'main');
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-from-main' }, { id: 'reward-existing-entry' }],
      }),
      'main entry',
    );
    git(repo, 'checkout', 'pr');
    const { status } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
  });

  it('刪除 002 檔案的 PR 必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', LOG_PATH);
    git(repo, 'commit', '-m', 'delete log');
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  // pre-commit 語意讀 index：staged 刪除會讓 `git show :<path>` 取不到內容，
  // 不得與「與 002 無關的 commit」同樣靜默跳過。
  it('pre-commit：staged 刪除 002（git rm --cached）必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', '--cached', LOG_PATH);
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  // `git mv` 的 `--name-only` 只列新路徑，舊路徑不出現；腳本層以 index／HEAD 存在性
  // 判定故仍必紅，但 hook 觸發條件不得再依賴 diff 呈現（見「守門觸發面」）。
  it('pre-commit：git mv 改名 002 必紅', () => {
    const repo = setupRepo();
    git(repo, 'mv', LOG_PATH, join(dirname(LOG_PATH), 'renamed.md'));
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  it('pre-commit：002 不存在於 index 與 HEAD 時跳過', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    writeFileSync(join(repo, 'other.txt'), 'unrelated');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'no log file');
    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('跳過');
  });

  // 以 symlink 路徑呼叫時，argv[1] 與 import.meta.url 的字面路徑不等（macOS 的 /tmp
  // 即為 /private/tmp 的 symlink）；未解析 realpath 會讓 main() 不執行卻 exit 0。
  it('經 symlink 路徑呼叫仍執行 main（不得靜默 exit 0）', () => {
    const repo = setupRepo();
    const holder = mkdtempSync(join(tmpdir(), 'verify-002-link-'));
    repos.push(holder);
    mkdirSync(join(holder, 'real'));
    copyFileSync(SCRIPT_PATH, join(holder, 'real', 'guard.mjs'));
    symlinkSync(join(holder, 'real'), join(holder, 'link'), 'dir');

    const { status, output } = runScript(repo, join(holder, 'link', 'guard.mjs'));
    expect(status).toBe(0);
    // 靜默不執行時 stdout 為空；有輸出才證明 main() 真的跑了。
    expect(output).toContain('002 記分守門');
  });

  it('pre-commit：正確 append 綠燈', () => {
    const repo = setupRepo();
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
    );
    git(repo, 'add', '--all');
    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });
});

// 守門的兩個「觸發面」——hook 條件與 CI 條件——是實際的破口所在：
// 腳本層判定正確不代表會被叫起來。這組鎖住觸發條件本身。
describe('守門觸發面（hook 條件與 CI 條件）', () => {
  const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const read = (relative: string) => readFileSync(join(REPO_ROOT, relative), 'utf-8');

  it('pre-commit 第 6 步無條件執行守門，不得以 git diff 判斷觸發', () => {
    const hook = read('.husky/pre-commit');
    const markerIndex = hook.indexOf('# 6. 002 記分守門');
    expect(markerIndex).toBeGreaterThan(-1);

    // 只看可執行行；註解本身會提到 git diff 作為反面說明。
    const step = hook
      .slice(markerIndex)
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
    expect(step).toContain('node scripts/verify-002-log.mjs');
    // `git mv` 的 --name-only 只列新路徑，任何 diff-based 觸發條件都會被它繞過。
    expect(step).not.toContain('git diff');
  });

  it('ci.yml 對 pull_request 與 main push 都掛守門，且置於 install 之前', () => {
    const workflow = read('.github/workflows/ci.yml');
    const prStep = workflow.indexOf('--base-ref "${{ github.event.pull_request.base.sha }}"');
    const pushStep = workflow.indexOf('--base-ref "${{ github.event.before }}"');
    const install = workflow.indexOf('pnpm install --frozen-lockfile');

    expect(prStep).toBeGreaterThan(-1);
    expect(pushStep).toBeGreaterThan(-1);
    // 零 npm 依賴，必須搶在 install 前紅燈。
    expect(prStep).toBeLessThan(install);
    expect(pushStep).toBeLessThan(install);
    expect(workflow).toContain("if: github.event_name == 'pull_request'");
    expect(workflow).toContain("github.event_name == 'push'");
    // 分支初建／force push 後 before 為全零，須跳過而非誤紅。
    expect(workflow).toContain("github.event.before != '0000000000000000000000000000000000000000'");
  });
});
