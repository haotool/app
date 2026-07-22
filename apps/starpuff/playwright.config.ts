import { defineConfig, devices } from '@playwright/test';

// SP_DEV_PORT：並行 worktree 各自隔離 dev server 埠——固定埠＋reuseExistingServer
// 會誤連鄰居 worktree 的 server（測到別人的程式碼），本地驗證必須可覆寫。
const port = process.env['SP_DEV_PORT'] || '3007';

export default defineConfig({
  testDir: './e2e',
  // 星星門走查全程約 12s，全套連跑＋retry tracing 下實測可逼近 30s 預設上限，放寬至 60s。
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: process.env['CI'] ? 'list' : 'html',
  use: {
    baseURL: `http://localhost:${port}/`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      // iPhone 13 橫持視窗（844×390）跑 chromium：CI 免額外下載 webkit。
      use: { ...devices['iPhone 13 landscape'], browserName: 'chromium' },
      testMatch: /(smoke|v5|v6|v7|v8|v9|v10|v11|v12|v13|v15|v16|hotfix|t2|t3)\.spec\.ts/,
    },
    {
      name: 'Mobile Chrome Portrait',
      // iPhone 13 直持全螢幕視窗（390×844）：驗證 v4 免轉向旋轉殼（US-028）。
      // 裝置描述檔 viewport 扣除瀏覽器 UI（390×664），驗收基準機型需顯式覆寫。
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
      testMatch: /(portrait|t2)\.spec\.ts/,
    },
    {
      name: 'Desktop Chrome',
      // 桌機情境（#817）：細指標、零觸點、寬視口——驗證方向恆正與鍵盤操作面。
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testMatch: /(t2|t3)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
});
