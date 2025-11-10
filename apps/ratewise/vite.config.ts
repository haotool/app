/**
 * Vite 配置主檔案（Linus-style 簡潔版）
 *
 * @description
 * 遵循 Linus Torvalds 開發哲學：
 * - 好品味 (Good Taste): 消除特殊情況，消除重複邏輯
 * - 簡潔執念: 主檔案只有 30 行實際代碼
 * - 單一職責: 每個模組專注一件事
 *
 * @refactoring
 * - Before: 559 行單一檔案（版本+PWA+Build+Plugins 混雜）
 * - After: 5 個模組化檔案 + 30 行主配置
 * - Gain: ✅ 可測試性 ✅ 可維護性 ✅ Git 衝突風險↓
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:vitejs/vite:2025-10-21]
 */

import { defineConfig } from 'vite';
import { createViteConfig } from './vite-config/index.js';

/**
 * Vite 配置（函數形式，確保環境變數正確讀取）
 */
export default defineConfig(() => createViteConfig());
