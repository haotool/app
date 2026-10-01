import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('OS 套件重試等待安裝返回，所有呼叫都有十五分鐘上限', () => {
  const action = readFileSync('.github/actions/setup-playwright/action.yml', 'utf8');
  const deps = action.slice(action.indexOf('    - name: Install Playwright system deps'));
  expect(deps).toContain('if pnpm --filter');
  expect(deps).not.toContain('timeout ');
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflow.match(/- '\.github\/actions\/setup-playwright\/\*\*'/g)).toHaveLength(2);
  expect(workflow.match(/- '\.github\/workflows\/ci\.yml'/g)).toHaveLength(6);
  const callers =
    workflow.match(/ {8}uses: \.\/\.github\/actions\/setup-playwright\n(?: {8}[^\n]*\n)*/g) ?? [];
  expect(callers.length).toBeGreaterThan(0);
  expect(action).not.toMatch(/if timeout \d+ pnpm/);
  expect(action).toContain("PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: '120000'");
  callers.forEach((step) => expect(step).toContain('        timeout-minutes: 15\n'));
});

it('app smoke 與完整 E2E 使用符合鎖定版本的官方預裝 image', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const { version } = JSON.parse(
    readFileSync('node_modules/@playwright/test/package.json', 'utf8'),
  ) as { version: string };
  const appJobs = workflow.match(/ {2}e2e-app(?:-smoke|s):\n[\s\S]*?(?=\n {2}[\w-]+:|$)/g) ?? [];
  expect(appJobs).toHaveLength(2);
  appJobs.forEach((job) => {
    expect(job).toContain(`image: mcr.microsoft.com/playwright:v${version}-noble`);
    expect(job).toContain('options: --init --ipc=host');
    expect(job).not.toContain('./.github/actions/setup-playwright');
    expect(job).not.toContain('playwright install');
  });
});
