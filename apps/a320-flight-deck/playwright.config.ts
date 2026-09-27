import { defineConfig, devices } from '@playwright/test';

// WebGL 於 CI 無 GPU：以 SwiftShader 軟體算繪，並以 ?quality=LOW 降低負載
const GL_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

export default defineConfig({
  testDir: './e2e',
  timeout: 150_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:4180',
    trace: 'retain-on-failure',
    launchOptions: { args: GL_ARGS },
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-landscape',
      use: { ...devices['Pixel 7 landscape'] },
    },
  ],

  webServer: {
    command: 'pnpm build && pnpm preview --port 4180 --strictPort',
    url: 'http://localhost:4180/a320-flight-deck/',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
