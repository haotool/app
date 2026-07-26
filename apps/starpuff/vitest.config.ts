import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // scripts 的 .mjs 測試僅供設計文件守門（T7-C）；src 仍為 .test.ts 唯一來源。
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    exclude: ['node_modules', 'dist'],
  },
});
