import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('OS 套件重試等待安裝返回，所有呼叫都有十五分鐘上限', () => {
  const action = readFileSync('.github/actions/setup-playwright/action.yml', 'utf8');
  const deps = action.slice(action.indexOf('    - name: Install Playwright system deps'));
  expect(deps).toContain('if pnpm --filter');
  expect(deps).not.toContain('timeout ');
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflow.match(/- '\.github\/actions\/setup-playwright\/\*\*'/g)).toHaveLength(6);
  const callers =
    workflow.match(/ {8}uses: \.\/\.github\/actions\/setup-playwright\n(?: {8}[^\n]*\n)*/g) ?? [];
  expect(callers.length).toBeGreaterThan(0);
  expect(action).not.toMatch(/if timeout \d+ pnpm/);
  expect(action).toContain("PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: '120000'");
  callers.forEach((step) => expect(step).toContain('        timeout-minutes: 15\n'));
});
