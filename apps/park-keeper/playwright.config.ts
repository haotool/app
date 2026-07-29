import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - park-keeper E2E 測試
 *
 * 測試矩陣：Chromium × Mobile（iPhone 級 viewport，主要 project）+ Desktop
 * 沿用 apps/ratewise / apps/nihonname 既有模式（僅 chromium，避免額外安裝瀏覽器）。
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see [context7:/microsoft/playwright:2026-07-16]
 */
export default defineConfig({
  testDir: './e2e',

  timeout: process.env['CI'] ? 30_000 : 15_000,
  globalTimeout: process.env['CI'] ? 10 * 60 * 1000 : undefined,

  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env['CI'] ? [['github'] as const] : []),
  ],

  use: {
    // base path 對齊 vite.config.ts 生產路徑 /park-keeper/（vite preview 預設走 production mode）。
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4176/park-keeper/',

    serviceWorkers: 'block',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10000,
    navigationTimeout: process.env['CI'] ? 60_000 : 30_000,
  },

  // iPhone 級行動 viewport 為主 project（park-keeper 為 mobile-first PWA，manifest orientation=portrait）；
  // 沿用 devices['Pixel 5']（chromium 引擎）並覆寫為 iPhone 14 尺寸，與 ratewise mobile project 手法一致。
  projects: [
    {
      name: 'mobile-iphone',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  // CI 亦自帶 webServer（#918）：原 CI 分支為 undefined，設計上假設由 workflow 自行起
  // server，但該 workflow 從未存在——park-keeper 的 10 個 spec 因此從未在 CI 執行過。
  // 改為一律由 playwright 起 server（CI 需先 build，本機沿用既有 preview 產物）。
  webServer: {
    command: process.env['CI'] ? 'pnpm build && pnpm preview' : 'pnpm preview',
    url: 'http://localhost:4176/park-keeper/',
    reuseExistingServer: !process.env['CI'],
    timeout: 180000,
  },
});
