import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - RateWise E2E 測試
 *
 * [Linus 原則優化 2025-12-11]
 * - 精簡測試矩陣：Chromium Desktop + Mobile（足夠發現 95% 問題）
 * - PWA 測試僅在 main 分支執行（減少 PR 檢查時間）
 * - 預估執行時間：2-3 分鐘
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // [2025-12-11] 合理的超時設定
  timeout: process.env['CI'] ? 30_000 : 15_000, // 單測試超時：CI 30s, 本地 15s
  globalTimeout: process.env['CI'] ? 10 * 60 * 1000 : undefined, // 整體超時：CI 10 分鐘

  // 完整並行執行
  fullyParallel: true,

  // CI 環境不允許失敗，本地允許重試一次
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0, // [Linus] 減少重試次數，快速失敗

  // 並行執行的 worker 數量
  workers: process.env['CI'] ? 4 : undefined, // [Linus] 增加 workers 加速執行

  // 報告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env['CI'] ? [['github'] as const] : []),
  ],

  use: {
    // 基礎 URL
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173',

    // [fix:2025-12-11] 阻止 Service Worker 註冊，避免 SW 快取導致測試不穩定
    // 依據: [context7:microsoft/playwright:2025-12-11] Service Workers in E2E tests
    // 根本原因: SW 會攔截請求並返回快取的舊 HTML，導致 "button not visible"
    serviceWorkers: 'block',

    // 僅在首次重試時記錄 trace（控制工件大小）
    trace: 'on-first-retry',

    // 僅在失敗時截圖
    screenshot: 'only-on-failure',

    // 僅在失敗時保留影片
    video: 'retain-on-failure',

    // 合理的超時設定
    actionTimeout: 10000,
    navigationTimeout: process.env['CI'] ? 60_000 : 30_000, // CI 環境增加導航超時
  },

  // [Linus 原則 2025-12-11] 精簡測試矩陣
  // - 只保留 Chromium Desktop + Mobile（足夠發現 95% 問題）
  // - Firefox 測試移至手動觸發（跨瀏覽器問題罕見）
  // - PWA 測試僅在 main 分支執行
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: /pwa\.spec\.ts/, // PWA 測試由專用 project 處理
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
      testIgnore: /pwa\.spec\.ts/,
    },
    // PWA 專用 project - 允許 Service Worker
    {
      name: 'pwa-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        serviceWorkers: 'allow',
      },
      testMatch: /pwa\.spec\.ts/,
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
