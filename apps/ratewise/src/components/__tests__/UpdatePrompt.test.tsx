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
 * - 更新按鈕：from-purple-400 to-blue-400
 *
 * 創建時間: 2025-12-27
 * 更新時間: 2025-12-28
 */

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('UpdatePrompt - setInterval 洩漏防護', () => {
  // 🔴 RED: onRegistered 中的 setInterval 應被儲存，以便元件卸載時清除
  it('should store interval ID for cleanup (no memory leak)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
    const sourceCode = await fs.readFile(componentPath, 'utf-8');

    // setInterval 的回傳值必須被儲存（不是直接呼叫後丟棄）
    // 正確：const intervalId = setInterval(...)  或 useRef 儲存
    // 錯誤：setInterval(() => { ... }, 60000) 沒有儲存回傳值

    // 檢查 setInterval 是否有賦值給變數或 ref
    const hasStoredInterval =
      /(?:const|let|var)\s+\w+\s*=\s*setInterval/.test(sourceCode) ||
      /\.current\s*=\s*setInterval/.test(sourceCode);

    expect(hasStoredInterval).toBe(true);
  });

  it('should clear interval on cleanup', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
    const sourceCode = await fs.readFile(componentPath, 'utf-8');

    // 必須有 clearInterval 呼叫
    expect(sourceCode).toContain('clearInterval');
  });
});

describe('UpdatePrompt Component - 粉彩雲朵配色 (BDD)', () => {
  describe('🔴 RED: 粉彩雲朵配色源碼驗證', () => {
    it('should use pastel cloud background gradient (purple-50 via-blue-50 to-purple-100)', async () => {
      // Given: 讀取 UpdatePrompt.tsx 源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查背景漸變配色
      // Then: ✅ 應該使用 design token: from-brand-from via-brand-via to-brand-to
      expect(sourceCode).toContain('from-brand-from via-brand-via to-brand-to');
    });

    it('should use pastel cloud border color (purple-200/50)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查邊框顏色
      // Then: ✅ 應該使用 design token: border-brand-border
      expect(sourceCode).toContain('border-brand-border');
    });

    it('should use pastel cloud icon gradient (purple-200 to-blue-200)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查圖標漸變
      // Then: ✅ 應該使用 design token: from-brand-icon-from to-brand-icon-to
      expect(sourceCode).toContain('from-brand-icon-from to-brand-icon-to');
    });

    it('should use pastel cloud title color (purple-800)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查標題文字顏色
      // Then: ✅ 應該使用 design token: text-brand-text-dark
      expect(sourceCode).toContain('text-brand-text-dark');
    });

    it('should use pastel cloud description color (purple-600)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查描述文字顏色
      // Then: ✅ 應該使用 design token: text-brand-text
      expect(sourceCode).toContain('text-brand-text');
    });

    it('should use pastel cloud update button gradient (purple-400 to-blue-400)', async () => {
      // Given: 讀取源碼
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
      const sourceCode = await fs.readFile(componentPath, 'utf-8');

      // When: 檢查更新按鈕配色
      // Then: ✅ 應該使用 design token: from-brand-button-from to-brand-button-to
      expect(sourceCode).toContain('from-brand-button-from to-brand-button-to');
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
