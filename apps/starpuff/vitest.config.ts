import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // scripts 的 .mjs 測試僅供設計文件守門（T7-C）；src 仍為 .test.ts 唯一來源。
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    exclude: ['node_modules', 'dist'],
    // CI 品質閘門（#918）：root `test:coverage` 走 `pnpm -r`，缺此 script 的 workspace
    // 會被靜默跳過——starpuff 的單元測試因此長期不構成任何閘門。此處不設 thresholds，
    // 目的是先讓測試「確實執行」並回報覆蓋率，不用門檻爭議阻擋閘門接線本身。
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/vite-env.d.ts', 'src/**/types.ts'],
    },
  },
});
