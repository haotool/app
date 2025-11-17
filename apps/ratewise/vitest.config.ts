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
      // [context7:vitest-dev/vitest:2025-11-18]
      // 過濾測試中預期產生的錯誤日誌（錯誤處理測試案例）
      onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
        // 過濾來自錯誤處理測試的預期錯誤日誌
        if (type === 'stderr') {
          // 過濾 logger 的 ERROR 級別日誌（測試錯誤處理時產生）
          if (log.includes('[ERROR]') && log.includes('Failed to fetch')) return false;
          // 過濾 React Router Future Flag 警告
          if (log.includes('React Router Future Flag Warning')) return false;
          // 過濾 React act(...) 警告
          if (log.includes('not wrapped in act(...)')) return false;
          // 過濾 MultiCalc 調試日誌（測試多幣別轉換時產生）
          if (log.includes('[MultiCalc]') && log.includes('No rate available')) return false;
        }
      },
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
          'src/**/types.ts', // 類型定義文件，無可執行代碼
          // Exclude utility modules that are integration-dependent
          'src/utils/pushNotifications.ts', // PWA-specific, requires service worker context
          'src/utils/sentry.ts', // External service integration
          'src/utils/webVitals.ts', // Browser performance API, requires real DOM
          'src/utils/versionChecker.ts', // PWA-specific, requires service worker context
          'src/utils/swUtils.ts', // PWA-specific, requires service worker context
          'src/trusted-types-bootstrap.ts', // Browser-only security module, requires CSP context
          'src/App.tsx', // Entry component, covered by E2E tests
          'src/pages/**/*.tsx', // Static pages, covered by E2E tests
          'src/components/UpdatePrompt.tsx', // PWA-specific, requires service worker context
          'src/components/AutoUpdateToast.tsx', // PWA-specific, requires service worker context
          'src/components/SwipeTooltip.tsx', // UI tutorial component, covered by E2E tests
        ],
        thresholds: {
          // 基於 Linus Torvalds 哲學設置實用且可維護的門檻
          // 當前覆蓋率：86.18% statements, 80.3% branches, 80.89% functions (2025-11-18)
          // 設置略低於當前值以避免過度工程化，同時防止退化
          // PWA 相關模組已排除（AutoUpdateToast, versionChecker, swUtils）
          // 2025-11-18: 新增計算機功能（calculator），覆蓋率暫時降低，待後續補充測試
          statements: 86, // 當前: 86.18%
          branches: 80, // 當前: 80.3%
          functions: 80, // 當前: 80.89%
          lines: 86, // 當前: 86.18%
        },
      },
    },
  };
});
