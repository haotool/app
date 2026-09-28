import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const workflow = (name: string) => readFileSync(join(ROOT, '.github/workflows', name), 'utf8');
const job = (text: string, name: string) => {
  const start = text.indexOf(`\n  ${name}:\n`);
  const next = text.slice(start + 1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? text.slice(start) : text.slice(start, start + 1 + next);
};

const dirs: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-pipeline-'));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('data workflow contract', () => {
  it('passes an absolute MoneyBox fetch snapshot path shared by fetch and history steps', () => {
    const text = workflow('update-moneybox-rates.yml');
    expect(text).toMatch(
      /MONEYBOX_FETCH_OUTPUT_FILE: \$\{\{ github\.workspace \}\}\/\.moneybox-current-fetch\.json/,
    );
    // history step 在 data checkout 執行：腳本必須取自 _fx-code，不可取 data 分支的舊副本。
    expect(text).not.toMatch(/import\('\.\/scripts\//);
    expect(text).toContain("import('./_fx-code/scripts/fetch-moneybox-rates.js')");
  });

  it.each([
    ['update-latest-rates.yml', 'update-latest'],
    ['update-moneybox-rates.yml', 'update-moneybox'],
  ])('%s keeps v2 fetch/commit/purge independent of installs and v3 publish', (file, v2) => {
    const text = workflow(file);
    const v2Job = job(text, v2);
    expect(v2Job).not.toMatch(/pnpm install|generate:fx|publish-fx-release|RATEWISE_FX_V3_ENABLED/);
    expect(v2Job).not.toContain('public/rates/v3');
    // v2 鎖維持 job 層級，避免 v3 發布耗時改變既有更新節奏。
    expect(v2Job).toMatch(/concurrency:\n\s+group: data-branch-push/);
    const v3Job = job(text, 'publish-v3');
    expect(v3Job).toContain(`needs: ${v2}`);
    expect(v3Job).toContain("vars.RATEWISE_FX_V3_ENABLED == 'true'");
    expect(v3Job).toContain('uses: ./.github/workflows/publish-fx-v3.yml');
    expect(v3Job).toContain('!cancelled()');
    expect(v3Job).not.toContain('always()');
    // v3 失敗必須讓 job 標紅，不得以 continue-on-error 假綠。
    expect(v3Job).not.toContain('continue-on-error');
  });

  it.each(['update-latest-rates.yml', 'update-moneybox-rates.yml', 'update-historical-rates.yml'])(
    '%s serializes the whole data workflow and cannot force-overwrite data',
    (file) => {
      const text = workflow(file);
      const lock =
        file === 'update-historical-rates.yml'
          ? text
          : job(text, file === 'update-latest-rates.yml' ? 'update-latest' : 'update-moneybox');
      expect(lock).toMatch(
        /concurrency:\n\s+group: data-branch-push\n\s+cancel-in-progress: false/,
      );
      expect(text).toMatch(/timeout-minutes: \d+/);
      expect(text).not.toMatch(/git pull --rebase[^\n]*\|\| true|git push --force-with-lease/);
      expect(text).toContain('persist-credentials: false');
    },
  );

  it('liveness gate reads the update-latest v2 job conclusion through the jobs API', () => {
    const text = workflow('update-historical-rates.yml');
    const gate = text.slice(
      text.indexOf('- name: Upstream pipeline liveness gate'),
      text.indexOf('- name: Save historical snapshot'),
    );
    expect(gate).toContain('actions/runs/${RUN_ID}/jobs');
    expect(gate).toContain('select(.name == "update-latest" and .conclusion == "success")');
    expect(gate).not.toContain('--json conclusion');
  });

  it('runs the shared v3 publisher isolated from the v2 lock and without persisted credentials', () => {
    const text = workflow('publish-fx-v3.yml');
    expect(text).toContain('workflow_call:');
    expect(text).toMatch(/timeout-minutes: \d+/);
    expect(text).toMatch(/concurrency:\n\s+group: fx-v3-publish/);
    expect(text).not.toMatch(/group: data-branch-push/);
    expect(text).not.toMatch(/continue-on-error:/);
    expect(text).toContain('publish-fx-release.mjs');
    const checkouts = text.split('uses: actions/checkout@').slice(1);
    expect(checkouts).toHaveLength(2);
    for (const step of checkouts) expect(step).toMatch(/persist-credentials: false/);
    // token 只注入 push 步驟。
    expect(text.match(/github\.token/g)).toHaveLength(1);
    expect(job(text, 'publish').split('GIT_PUSH_TOKEN')[0]).toContain('Commit, push and purge');
  });

  it.each(['update-latest-rates.yml', 'update-moneybox-rates.yml', 'update-historical-rates.yml'])(
    '%s is not triggered by shared FX code or lockfile pushes',
    (file) => {
      const paths = workflow(file).split('\njobs:')[0];
      expect(paths).not.toMatch(/pnpm-lock\.yaml|apps\/shared\/fx|scripts\/lib|publish-fx-release/);
    },
  );

  it.each([
    ['update-historical-rates.yml', 'generate-aggregate', 'Commit and push snapshot'],
    ['update-moneybox-rates.yml', 'moneybox-aggregate', 'Commit and push changes'],
  ])(
    '%s commits snapshots even when the aggregate fails, then fails visibly',
    (file, id, commit) => {
      const text = workflow(file);
      const step = (name: string) => {
        const start = text.indexOf(`- name: ${name}`);
        const next = text.indexOf('\n      - name:', start + 1);
        return text.slice(start, next === -1 ? undefined : next);
      };
      const aggregate = text.slice(text.lastIndexOf('\n      - name:', text.indexOf(`id: ${id}`)));
      expect(aggregate.split('\n      - name:')[1]).toContain('continue-on-error: true');
      expect(step(commit)).not.toContain(id);
      const failStep = step('Fail run when aggregate failed');
      expect(failStep).toContain(`steps.${id}.outcome == 'failure'`);
      expect(failStep).toContain('exit 1');
    },
  );
});

describe('fetch scripts', () => {
  const moneyboxPreload = (sell: string) =>
    `data:text/javascript,globalThis.fetch=async()=>new Response(${encodeURIComponent(
      JSON.stringify(
        JSON.stringify({
          success: true,
          data: {
            publishedAt: '2026-09-21T10:00:00Z',
            rates: ['TWD', 'USD', 'JPY', 'EUR', 'HKD', 'CNY'].map((currencyCode, index) => ({
              currencyCode,
              buyRate: currencyCode === 'TWD' ? sell : String(1000 + index),
              sellRate: currencyCode === 'TWD' ? '42.3' : String(1010 + index),
            })),
          },
        }),
      ),
    )});`;
  const runMoneybox = (dataRoot: string, output: string, cwd: string) =>
    execFileSync(
      process.execPath,
      [
        '--no-warnings',
        '--import',
        moneyboxPreload('41.5'),
        join(ROOT, 'scripts/fetch-moneybox-rates.js'),
      ],
      { cwd, env: { ...process.env, FX_DATA_ROOT: dataRoot, MONEYBOX_FETCH_OUTPUT_FILE: output } },
    );

  it('writes the MoneyBox fetch snapshot to the absolute path under the data root', () => {
    const workspace = tempDir();
    const output = join(workspace, '.moneybox-current-fetch.json');
    runMoneybox(join(workspace, 'public/rates'), output, tempDir());
    expect(existsSync(output)).toBe(true);
    expect(existsSync(join(ROOT, '.moneybox-current-fetch.json'))).toBe(false);
  });

  it('does not rewrite MoneyBox latest.json when rates are unchanged', () => {
    const workspace = tempDir();
    const dataRoot = join(workspace, 'public/rates');
    const latest = join(dataRoot, 'providers/moneybox/latest.json');
    runMoneybox(dataRoot, join(workspace, 'fetch.json'), workspace);
    const before = readFileSync(latest, 'utf8');
    runMoneybox(dataRoot, join(workspace, 'fetch.json'), workspace);
    expect(readFileSync(latest, 'utf8')).toBe(before);
  });

  it('does not rewrite Taiwan Bank latest.json when rates are unchanged', () => {
    const workspace = tempDir();
    const codes = ['USD', 'HKD', 'GBP', 'AUD', 'CAD', 'SGD', 'CHF', 'JPY', 'ZAR', 'SEK'];
    const rows = [...codes, 'NZD', 'THB', 'PHP', 'IDR', 'EUR', 'KRW', 'VND', 'MYR', 'CNY'].map(
      (code, index) => {
        const columns = Array<string>(14).fill('-');
        columns[0] = code;
        columns[2] = String(10 + index);
        columns[3] = String(10.5 + index);
        columns[12] = String(11 + index);
        columns[13] = String(11.2 + index);
        return columns.join(',');
      },
    );
    const csv = join(workspace, 'bank.csv');
    writeFileSync(csv, `header\n${rows.join('\n')}`);
    const run = () =>
      execFileSync(
        process.execPath,
        ['--no-warnings', join(ROOT, 'scripts/fetch-taiwan-bank-rates.js')],
        {
          cwd: workspace,
          env: { ...process.env, FX_DATA_ROOT: workspace, CSV_INPUT_FILE: csv },
        },
      );
    run();
    const before = readFileSync(join(workspace, 'latest.json'), 'utf8');
    run();
    expect(readFileSync(join(workspace, 'latest.json'), 'utf8')).toBe(before);
  });
});
