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
    const v3Job = job(text, 'publish-v3');
    expect(v3Job).toContain(`needs: ${v2}`);
    expect(v3Job).toContain("vars.RATEWISE_FX_V3_ENABLED == 'true'");
    expect(v3Job).toContain('publish-fx-release.mjs');
    // v3 失敗必須讓 job 標紅，不得以 continue-on-error 假綠。
    expect(v3Job).not.toContain('continue-on-error');
  });
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
