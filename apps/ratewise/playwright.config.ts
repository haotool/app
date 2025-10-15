import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - RateWise E2E 測試
 *
 * 測試矩陣：Chromium + Firefox × Desktop + Mobile = 4 組合
 * 預估執行時間：5-10 分鐘
 *
 * 建立時間：2025-10-15T23:44:01+08:00
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // 完整並行執行
  fullyParallel: true,

  // CI 環境不允許失敗，本地允許重試一次
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,

  // 並行執行的 worker 數量
  workers: process.env['CI'] ? 2 : undefined,

  // 報告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env['CI'] ? [['github'] as const] : []),
  ],

  use: {
    // 基礎 URL
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173',

    // 僅在首次重試時記錄 trace（控制工件大小）
    trace: 'on-first-retry',

    // 僅在失敗時截圖
    screenshot: 'only-on-failure',

    // 僅在失敗時保留影片
    video: 'retain-on-failure',

    // 合理的超時設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 測試專案：精簡矩陣（4 組合）
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Pixel 5'],
        browserName: 'firefox',
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  // 本地開發伺服器配置
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'pnpm preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env['CI'],
        timeout: 120000,
      },
});
