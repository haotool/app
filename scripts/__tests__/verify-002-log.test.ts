import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

describe('--base-ref 模式（CI 語意，issue #661）', () => {
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

  function runGuard(repo: string, baseRef: string) {
    try {
      const stdout = execFileSync('node', [SCRIPT_PATH, '--base-ref', baseRef], {
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
    const { status, output } = runGuard(repo, 'main');
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
    const { status, output } = runGuard(repo, 'main');
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('002 未變更的 PR 跳過（零額外負擔）', () => {
    const repo = setupRepo();
    writeFileSync(join(repo, 'other.txt'), 'unrelated');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'unrelated');
    const { status, output } = runGuard(repo, 'main');
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
    const { status } = runGuard(repo, 'main');
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
    const { status } = runGuard(repo, 'main');
    expect(status).toBe(0);
  });

  it('刪除 002 檔案的 PR 必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', LOG_PATH);
    git(repo, 'commit', '-m', 'delete log');
    const { status, output } = runGuard(repo, 'main');
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });
});
