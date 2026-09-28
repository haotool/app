import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateHistory } from '../migrate-fx-history.mjs';
import { publishRelease, retainedHistory } from '../publish-fx-release.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const workflow = (name: string) => readFileSync(join(ROOT, '.github/workflows', name), 'utf8');
const job = (text: string, name: string) => {
  const start = text.indexOf(`\n  ${name}:\n`);
  const next = text.slice(start + 1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? text.slice(start) : text.slice(start, start + 1 + next);
};

const dirs: string[] = [];
const tempDir = () => {
  const root = join(ROOT, '.tmp');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, 'fx-pipeline-'));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  try {
    rmdirSync(join(ROOT, '.tmp'));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'ENOTEMPTY') throw error;
  }
});

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
const configureGit = (cwd: string) => {
  git(cwd, 'config', 'user.name', 'FX pipeline test');
  git(cwd, 'config', 'user.email', 'fx-pipeline-test@example.invalid');
};

describe('data workflow contract', () => {
  it('tracks the runs dispatched by the activation runbook and requires provider-level coverage', () => {
    const runbook = readFileSync(
      join(ROOT, 'docs/dev/049_exchange_rate_api_v3_implementation.md'),
      'utf8',
    );
    expect(runbook).toContain('gh run list --workflow "$workflow" --event workflow_dispatch');
    expect(runbook).toContain('wait_for_dispatched_run update-latest-rates.yml');
    expect(runbook).toContain('wait_for_dispatched_run update-moneybox-rates.yml');
    expect(runbook).toContain('createdAt >=');
    expect(runbook).toContain('gh run watch "$LATEST_RUN_ID" --exit-status');
    expect(runbook).toContain('gh run watch "$MONEYBOX_RUN_ID" --exit-status');
    expect(runbook).toContain('for attempt in {1..12}; do');
    expect(runbook).toContain('sleep 5');
    expect(runbook).toContain('Unable to find dispatched workflow run');
    expect(runbook).not.toContain('--limit 1');
    expect(runbook).toContain('"providers":{"bot":{"history":30},"moneybox":{"history":30}}');
  });

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
    const commitStep = text.slice(
      text.indexOf('      - name: Commit and push changes'),
      text.indexOf('      - name: Purge jsDelivr CDN cache'),
    );
    expect(commitStep).not.toMatch(/--amend|--force/);
    expect(commitStep).toContain('git pull --rebase origin data');
    expect(commitStep).toContain('git rebase --abort');
    expect(commitStep).toContain('Rebase failed after 3 attempts');
    expect(commitStep).toMatch(/if ! git pull --rebase origin data; then\n\s+git rebase --abort/);
    expect(commitStep).toContain('for i in 1 2 3; do');
    if (file === 'update-latest-rates.yml') {
      expect(commitStep.indexOf('for i in 1 2 3; do')).toBeLessThan(
        commitStep.indexOf('git pull --rebase origin data'),
      );
    }
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
    const commit = text.indexOf('- name: Commit, push and purge v3 pointer');
    const verify = text.indexOf('- name: Verify published v3 release');
    expect(verify).toBeGreaterThan(text.indexOf('- name: Publish verified v3 release'));
    expect(commit).toBeGreaterThan(verify);
    expect(text.slice(commit, text.indexOf('\n      - name:', commit)).trim()).toContain(
      'if: success()',
    );
    expect(text.slice(verify, commit)).toContain('--require-providers "$FX_REQUIRED_PROVIDERS"');
    expect(text.slice(verify)).toContain('verify-fx-v3-release.mjs');
    expect(text).toContain('Capture previously published providers');
    expect(text).toContain('manifest?.providers ?? []');
    expect(text).toContain('process.env.FX_PROVIDER');
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

  it('rebases a new same-kind rates commit over concurrent data-branch history without losing either commit', () => {
    const root = tempDir();
    const remote = join(root, 'remote.git');
    const update = join(root, 'update');
    const concurrent = join(root, 'concurrent');
    git(root, 'init', '--bare', '--initial-branch=data', remote);
    git(root, 'clone', remote, update);
    configureGit(update);
    git(update, 'switch', '-c', 'data');

    const ratesPath = join(update, 'public/rates/latest.json');
    mkdirSync(join(update, 'public/rates'), { recursive: true });
    writeFileSync(ratesPath, '{"updateTime":"previous"}\n');
    git(update, 'add', 'public/rates/latest.json');
    git(update, 'commit', '-m', 'chore(rates): update latest rates - previous');
    git(update, 'push', '-u', 'origin', 'data');

    writeFileSync(ratesPath, '{"updateTime":"new"}\n');
    git(update, 'add', 'public/rates/latest.json');
    git(update, 'commit', '-m', 'chore(rates): update latest rates - new');

    git(root, 'clone', '--branch', 'data', remote, concurrent);
    configureGit(concurrent);
    mkdirSync(join(concurrent, 'public/rates/v3'), { recursive: true });
    writeFileSync(join(concurrent, 'public/rates/v3/current.json'), '{"releaseId":"v3"}\n');
    git(concurrent, 'add', 'public/rates/v3/current.json');
    git(concurrent, 'commit', '-m', 'chore(rates): publish concurrent v3 release');
    git(concurrent, 'push', 'origin', 'data');

    git(update, 'pull', '--rebase', 'origin', 'data');
    git(update, 'push', 'origin', 'data');
    const commits = git(update, 'log', '--format=%s', 'origin/data');
    expect(commits).toContain('chore(rates): update latest rates - previous');
    expect(commits).toContain('chore(rates): update latest rates - new');
    expect(commits).toContain('chore(rates): publish concurrent v3 release');
    expect(readFileSync(join(update, 'public/rates/v3/current.json'), 'utf8')).toContain('v3');
  });

  it('keeps two unchanged migration and publish runs clean in a git checkout', async () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const v3 = join(dataRoot, 'v3');
    const historyDate = '2026-09-20';
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    writeFileSync(
      join(dataRoot, `history/${historyDate}.json`),
      JSON.stringify({
        timestamp: `${historyDate}T10:00:00.000Z`,
        base: 'TWD',
        source: 'Taiwan Bank',
        details: { USD: { cash: { buy: '31', sell: '32' } } },
        rates: { USD: '32' },
      }),
    );
    git(root, 'init', '--initial-branch=data');
    configureGit(root);
    git(root, 'add', 'public/rates/history');
    git(root, 'commit', '-m', 'chore(rates): add history input');
    const input = {
      timestamp: '2026-09-21T01:00:00Z',
      sourcePublishedAt: '2026-09-21T01:00:00Z',
      details: { USD: { cash: { buy: '31', sell: '32' } } },
    };
    const runPublish = async (time: string) => {
      migrateHistory(git(root, 'rev-parse', 'HEAD'), v3, dataRoot);
      return publishRelease(
        v3,
        { bot: input },
        time,
        retainedHistory(dataRoot, new Date('2026-09-21T02:00:00Z')),
      );
    };
    const first = await runPublish('2026-09-21T01:00:00Z');
    expect(first.manifest.history).toHaveLength(1);
    git(root, 'add', 'public/rates/v3');
    git(root, 'commit', '-m', 'chore(rates): publish first v3 release');
    git(root, 'commit', '--allow-empty', '-m', 'chore(rates): unchanged source run');

    const second = await runPublish('2026-09-21T01:05:00Z');
    expect(second.unchanged).toBe(true);
    expect(git(root, 'status', '--porcelain', '--', 'public/rates/v3')).toBe('');
  });
});

it('keeps MoneyBox publishedAt monotonic across runs and leaves unchanged state clean', async () => {
  const root = tempDir();
  const v3 = join(root, 'public/rates/v3');
  const fetchedAt = '2026-09-21T10:15:00Z';
  const input = (publishedAt: string) => ({
    timestamp: fetchedAt,
    fetchedAt,
    sourcePublishedAt: publishedAt,
    rates: { TWD: { buy: '46', sell: '45' } },
  });
  const publishedAt = (release: Awaited<ReturnType<typeof publishRelease>>) => {
    const snapshot = release.snapshots.get('moneybox') as
      | { quotes: { sourceQuote: { sourcePublishedAt: string | null } }[] }
      | undefined;
    return snapshot?.quotes[0]?.sourceQuote.sourcePublishedAt;
  };
  try {
    git(root, 'init');
    configureGit(root);
    expect(
      publishedAt(await publishRelease(v3, { moneybox: input('2026-09-21T10:00:00Z') }, fetchedAt)),
    ).toBe('2026-09-21T10:00:00.000Z');
    for (const run of [1, 2]) {
      expect(
        publishedAt(
          await publishRelease(
            v3,
            { moneybox: input('2026-09-21T09:00:00Z') },
            `2026-09-21T10:${20 + run * 5}:00Z`,
          ),
        ),
      ).toBeNull();
    }
    expect(
      publishedAt(await publishRelease(v3, { moneybox: input('2026-09-21T10:05:00Z') }, fetchedAt)),
    ).toBe('2026-09-21T10:05:00.000Z');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'initial');
    await publishRelease(v3, { moneybox: input('2026-09-21T10:05:00Z') }, '2026-09-21T10:30:00Z');
    expect(git(root, 'status', '--short')).toBe('');
    expect(readFileSync(join(v3, 'state/moneybox-watermark.json'), 'utf8')).toBe(
      '{"publishedAt":"2026-09-21T10:05:00.000Z"}\n',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('history directory reads', () => {
  const botHistory = (date: string) => ({
    timestamp: `${date}T10:00:00.000Z`,
    base: 'TWD',
    source: 'Taiwan Bank',
    details: { USD: { cash: { buy: '31', sell: '32' } } },
    rates: { USD: '32' },
  });
  const dateAt = (offset: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  it('aborts when a previously published history directory is emptied', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    mkdirSync(output, { recursive: true });
    writeFileSync(
      join(output, 'history-index.json'),
      JSON.stringify([{ providerId: 'bot', date: dateAt(-2) }]),
    );
    expect(() => migrateHistory('revision', output, dataRoot)).toThrow(
      /Missing previously published bot history/,
    );
  });

  it('aborts when one previously published in-window date is deleted', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    mkdirSync(output, { recursive: true });
    const missing = dateAt(-3);
    const present = dateAt(-2);
    writeFileSync(join(dataRoot, `history/${missing}.json`), JSON.stringify(botHistory(missing)));
    writeFileSync(join(dataRoot, `history/${present}.json`), JSON.stringify(botHistory(present)));
    migrateHistory('revision', output, dataRoot);
    const previous = JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8'));
    expect(previous).toHaveLength(2);
    expect(previous.find((entry: { date: string }) => entry.date === missing)).toMatchObject({
      providerId: 'bot',
      snapshot: {
        path: expect.stringMatching(/\.json$/),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });
    rmSync(join(dataRoot, `history/${missing}.json`));
    expect(() => migrateHistory('revision', output, dataRoot)).toThrow(
      new RegExp(`Missing previously published bot history source file for ${missing}`),
    );
    expect(JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8'))).toEqual(previous);
  });

  it.each(['bot', 'moneybox'])(
    'aborts a shared-history migration when a published in-window %s source is missing',
    (providerId) => {
      const root = tempDir();
      const dataRoot = join(root, 'public/rates');
      const output = join(dataRoot, 'v3');
      mkdirSync(join(dataRoot, 'history'), { recursive: true });
      mkdirSync(join(dataRoot, 'providers/moneybox/history'), { recursive: true });
      mkdirSync(output, { recursive: true });
      const missing = dateAt(-3);
      if (providerId === 'bot')
        writeFileSync(
          join(dataRoot, `providers/moneybox/history/${missing}.json`),
          JSON.stringify({}),
        );
      else writeFileSync(join(dataRoot, `history/${missing}.json`), JSON.stringify({}));
      writeFileSync(
        join(output, 'history-index.json'),
        JSON.stringify([
          { providerId: 'bot', date: missing },
          { providerId: 'moneybox', date: missing },
        ]),
      );
      expect(() => migrateHistory('revision', output, dataRoot)).toThrow(
        new RegExp(`Missing previously published ${providerId} history source file for ${missing}`),
      );
    },
  );

  it('allows a normal daily roll when only the oldest bank date leaves retention', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    mkdirSync(output, { recursive: true });
    const previous = Array.from({ length: 30 }, (_, index) => dateAt(index - 31));
    const current = Array.from({ length: 30 }, (_, index) => dateAt(index - 30));
    for (const date of current)
      writeFileSync(join(dataRoot, `history/${date}.json`), JSON.stringify(botHistory(date)));
    writeFileSync(
      join(output, 'history-index.json'),
      JSON.stringify(previous.map((date) => ({ providerId: 'bot', date }))),
    );
    expect(() => migrateHistory('revision', output, dataRoot)).not.toThrow();
  });

  it('allows an absent MoneyBox history directory when no prior MoneyBox history exists', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    writeFileSync(
      join(dataRoot, 'history/2026-09-20.json'),
      JSON.stringify(botHistory('2026-09-20')),
    );
    expect(() => migrateHistory('revision', join(dataRoot, 'v3'), dataRoot)).not.toThrow();
  });

  it('fails closed when prior MoneyBox history exists but its directory is missing', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    mkdirSync(output, { recursive: true });
    writeFileSync(
      join(dataRoot, 'history/2026-09-20.json'),
      JSON.stringify(botHistory('2026-09-20')),
    );
    writeFileSync(
      join(output, 'history-index.json'),
      JSON.stringify([{ providerId: 'moneybox', date: '2026-09-20' }]),
    );
    expect(() => migrateHistory('revision', output, dataRoot)).toThrow(
      /Missing moneybox history directory/,
    );
  });

  it('retains an in-window published snapshot when its source becomes corrupt', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    const date = '2026-09-15';
    const now = new Date('2026-09-29T12:00:00Z');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    writeFileSync(join(dataRoot, `history/${date}.json`), JSON.stringify(botHistory(date)));
    migrateHistory('revision', output, dataRoot, now);
    const previous = JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8'))[0];
    expect(previous.snapshot).toMatchObject({
      path: expect.stringMatching(/\.json$/),
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    writeFileSync(join(dataRoot, `history/${date}.json`), '{"broken":true}');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = migrateHistory('revision', output, dataRoot, now);
      expect(result).toMatchObject({ total: 1, converted: 0, quarantined: 1 });
      expect(JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8'))).toContainEqual(
        previous,
      );
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining('Retaining previously published bot history'),
      );
      expect(result.entries[0]).toMatchObject({
        status: 'quarantined',
        reason: expect.any(String),
      });
    } finally {
      warning.mockRestore();
    }
  });

  it('quarantines a corrupt source date that was never published without adding history', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    writeFileSync(join(dataRoot, 'history/2026-09-15.json'), '{"broken":true}');
    const result = migrateHistory('revision', output, dataRoot, new Date('2026-09-29T12:00:00Z'));
    expect(result).toMatchObject({ total: 1, converted: 0, quarantined: 1 });
    expect(JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8'))).toEqual([]);
  });

  it('aborts when the prior snapshot needed for retention fails hash verification', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    const output = join(dataRoot, 'v3');
    const date = '2026-09-15';
    const now = new Date('2026-09-29T12:00:00Z');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    writeFileSync(join(dataRoot, `history/${date}.json`), JSON.stringify(botHistory(date)));
    migrateHistory('revision', output, dataRoot, now);
    const previous = JSON.parse(readFileSync(join(output, 'history-index.json'), 'utf8')) as {
      snapshot: { path: string };
    }[];
    expect(previous).toHaveLength(1);
    const snapshotPath = previous[0]?.snapshot.path;
    if (!snapshotPath) throw new Error('Missing migrated snapshot path');
    writeFileSync(join(output, snapshotPath), '{}');
    writeFileSync(join(dataRoot, `history/${date}.json`), '{"broken":true}');
    expect(() => migrateHistory('revision', output, dataRoot, now)).toThrow(
      `Invalid previously published bot history object for ${date}`,
    );
  });

  it('fails closed on non-ENOENT history directory read errors', () => {
    const root = tempDir();
    const dataRoot = join(root, 'public/rates');
    mkdirSync(join(dataRoot, 'history'), { recursive: true });
    mkdirSync(join(dataRoot, 'providers'), { recursive: true });
    writeFileSync(
      join(dataRoot, 'history/2026-09-20.json'),
      JSON.stringify(botHistory('2026-09-20')),
    );
    writeFileSync(join(dataRoot, 'providers/moneybox'), 'not a directory');
    expect(() => migrateHistory('revision', join(dataRoot, 'v3'), dataRoot)).toThrow(/ENOTDIR/);
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
