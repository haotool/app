import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - NihonName E2E 測試
 *
 * 測試矩陣：Chromium × Desktop + Mobile = 2 組合
 * 預估執行時間：2-3 分鐘
 *
 * Firefox 測試已移除：SEO E2E 測試主要驗證靜態 HTML 內容（meta tags, JSON-LD, canonical）
 * Chromium 覆蓋率已足夠，移除 Firefox 可減少 CI 執行時間與資源消耗
 *
 * 建立時間：2025-12-04T00:00:00+08:00
 * 更新時間：2025-12-12T00:00:00+08:00
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see [context7:/microsoft/playwright:2025-12-04]
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
    // 基礎 URL - 開發環境使用根路徑，生產環境使用 /nihonname/
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:3002/',

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

  // 測試專案：精簡矩陣（2 組合）
  // Firefox 測試已移除（SEO 測試主要驗證靜態 HTML 內容，Chromium 覆蓋已足夠）
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
  ],

  // 本地開發伺服器配置
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3002/',
        reuseExistingServer: !process.env['CI'],
        timeout: 120000,
      },
});
