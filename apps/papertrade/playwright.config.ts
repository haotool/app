import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: 2,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:4175',
    trace: 'on-first-retry',
    // e2e 以 route mock 隔離外網；封鎖 SW 避免 request interception 被繞過。
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'pnpm build && pnpm preview --port 4175',
    url: 'http://localhost:4175/papertrade/',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
