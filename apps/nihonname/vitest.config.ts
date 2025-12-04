import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        // SSG entry points and route definitions are difficult to unit test
        'src/main.tsx',
        'src/routes.tsx',
        // Types-only files
        'src/types.ts',
        // Complex page components with heavy UI interactions
        'src/pages/Home.tsx',
        // Simple wrapper component
        'src/components/Layout.tsx',
        // Backup/legacy files
        'src/data/**/*.backup.ts',
        // Data files (primarily static content with minimal logic)
        'src/data/funnyNames.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
