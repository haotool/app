/**
 * UpdatePrompt.tsx BDD Tests - 粉彩雲朵配色
 *
 * BDD 測試：驗證 UpdatePrompt 組件使用粉彩雲朵配色
 *
 * 測試策略：
 * - 🔴 RED: 驗證源碼使用粉彩雲朵配色（purple-50, purple-200, purple-800 等）
 * - 🟢 GREEN: 更新配色後測試通過
 * - 🔵 REFACTOR: 確保代碼品質
 *
 * 參考配色：
 * - 背景：from-purple-50 via-blue-50 to-purple-100
 * - 邊框：border-purple-200/50
 * - 圖標：from-purple-200 to-blue-200
 * - 標題：text-purple-800
 * - 描述：text-purple-600
 * - 按鈕：from-purple-400 to-blue-400
 *
 * 創建時間: 2025-12-27
 */

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('UpdatePrompt Component - 粉彩雲朵配色 (BDD)', () => {
  describe('🔴 RED: 粉彩雲朵配色源碼驗證', () => {
    it('should use pastel cloud background gradient (purple-50 via-blue-50 to-purple-100)', async () => {
      // Given: 讀取 UpdatePrompt.tsx 源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查背景漸變配色
      // Then: 🔴 應該包含粉彩雲朵的背景漸變
      expect(sourceCode).toContain('from-purple-50 via-blue-50 to-purple-100');
    });

    it('should use pastel cloud border color (purple-200/50)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查邊框顏色
      // Then: 🔴 應該使用半透明紫色邊框
      expect(sourceCode).toContain('border-purple-200');
    });

    it('should use pastel cloud icon gradient (purple-200 to-blue-200)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查圖標漸變
      // Then: 🔴 應該使用粉彩雲朵的圖標漸變
      expect(sourceCode).toContain('from-purple-200 to-blue-200');
    });

    it('should use pastel cloud title color (purple-800)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查標題文字顏色
      // Then: 🔴 應該使用深紫色標題
      expect(sourceCode).toContain('text-purple-800');
    });

    it('should use pastel cloud description color (purple-600)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查描述文字顏色
      // Then: 🔴 應該使用中等紫色描述
      expect(sourceCode).toContain('text-purple-600');
    });

    it('should use pastel cloud button gradient (purple-400 to-blue-400)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查按鈕漸變
      // Then: 🔴 應該使用粉彩雲朵的按鈕漸變
      expect(sourceCode).toContain('from-purple-400 to-blue-400');
    });

    it('should NOT use brand blue colors (blue-500, blue-600, indigo-600)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查是否移除了藍色品牌配色
      // Then: 🔴 不應該包含舊的藍色系配色
      expect(sourceCode).not.toContain('from-blue-500 to-indigo-600');
      expect(sourceCode).not.toContain('text-blue-900');
      expect(sourceCode).not.toContain('text-indigo-700');
    });
  });
});
