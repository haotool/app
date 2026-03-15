import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@app/park-keeper': resolve(__dirname, 'src'),
      'vite-react-ssg': resolve(__dirname, 'src/__mocks__/vite-react-ssg.ts'),
      'virtual:pwa-register/react': resolve(__dirname, 'src/__mocks__/pwa-register-react.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    exclude: ['node_modules', 'dist', 'e2e', '**/*.e2e.*', 'vite.config.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/setupTests.ts',
        'src/__mocks__/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/vitest-dom.d.ts',
        'src/types.ts',
        'src/routes.tsx', // SSG route declarations are configuration, not meaningful unit targets
        'src/pages/Home.tsx',
        'src/components/MiniMap.tsx',
        'src/components/QuickEntry.tsx',
        'src/sw.ts', // Service worker runtime depends on Workbox + SW globals; validate via build/runtime tests
      ],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 75,
        lines: 80,
      },
    },
  },
});
