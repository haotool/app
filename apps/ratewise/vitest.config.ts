import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// [context7:vitejs/vite:2025-10-21T03:15:00+08:00]
// 使用函數形式確保 define 在測試環境下也能正確工作
export default defineConfig(() => {
  // 讀取 package.json 版本號（與 vite.config.ts 保持一致）
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  const appVersion = packageJson.version;
  const buildTime = new Date().toISOString();

  return {
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@app/ratewise': resolve(__dirname, './src'),
        '@shared': resolve(__dirname, '../shared'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      // Exclude Playwright E2E tests from Vitest
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/tests/e2e/**', // Playwright E2E tests
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.spec.{ts,tsx}',
          'src/setupTests.ts',
          'src/main.tsx',
          'src/vite-env.d.ts',
          // Exclude utility modules that are integration-dependent
          'src/utils/pushNotifications.ts', // PWA-specific, requires service worker context
          'src/utils/sentry.ts', // External service integration
          'src/utils/webVitals.ts', // Browser performance API, requires real DOM
          'src/App.tsx', // Entry component, covered by E2E tests
          'src/pages/**/*.tsx', // Static pages, covered by E2E tests
          'src/components/UpdatePrompt.tsx', // PWA-specific, requires service worker context
        ],
        thresholds: {
          // 基於 Linus Torvalds 哲學設置實用且可維護的門檻
          // 當前覆蓋率：94.59% statements, 83.6% branches, 91.26% functions
          // 設置略低於當前值以避免過度工程化，同時防止退化
          statements: 90, // 當前: 94.59%
          branches: 80, // 當前: 83.6%
          functions: 88, // 當前: 91.26%
          lines: 90, // 當前: 94.59%
        },
      },
    },
  };
});
