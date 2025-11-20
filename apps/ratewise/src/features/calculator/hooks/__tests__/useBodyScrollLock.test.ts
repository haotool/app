/**
 * Calculator Feature - useBodyScrollLock Hook Tests
 * @file useBodyScrollLock.test.ts
 * @description useBodyScrollLock hook 的 BDD 測試
 * @see docs/dev/012_calculator_modal_sync_enhancement.md Feature 2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock', () => {
  // 保存原始 scrollY 值
  let originalScrollY: number;

  beforeEach(() => {
    // 模擬滾動位置
    originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 200, // 模擬滾動到 200px
    });

    // 模擬 scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    // 恢復原始 scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });

    // 清理 body 樣式
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
  });

  describe('Feature 2.1: iOS Safari 背景鎖定', () => {
    it('Scenario 2.1.1: 當 isLocked=true 時應鎖定背景滾動', () => {
      // Given: 用戶在 iPhone Safari 上使用應用
      // And: 頁面當前滾動位置為 200px（beforeEach 已設定）

      // When: 用戶開啟計算機 Modal
      renderHook(() => useBodyScrollLock(true));

      // Then: body 元素應套用 position: fixed
      expect(document.body.style.position).toBe('fixed');

      // And: body 的 top 應設為 "-200px"
      expect(document.body.style.top).toBe('-200px');

      // And: body 的 width 應設為 "100%"
      expect(document.body.style.width).toBe('100%');

      // And: body 的 overflowY 應設為 "scroll"（保留滾動條空間）
      expect(document.body.style.overflowY).toBe('scroll');
    });

    it('Scenario 2.1.2: 當 isLocked=false 時應移除鎖定樣式', () => {
      // Given: 計算機 Modal 已開啟並鎖定背景
      const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
        initialProps: { locked: true },
      });

      expect(document.body.style.position).toBe('fixed');

      // When: 用戶關閉計算機
      rerender({ locked: false });

      // Then: body 元素樣式應恢復原狀（空字串）
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
      expect(document.body.style.overflowY).toBe('');

      // And: 頁面應滾動回 200px 位置（無跳動）
      expect(window.scrollTo).toHaveBeenCalledWith(0, 200);
    });

    it('Scenario 2.1.3: 清理時應恢復原始滾動位置', () => {
      // Given: 計算機 Modal 已開啟
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      // When: 組件卸載（cleanup 觸發）
      unmount();

      // Then: 頁面應滾動回 200px 位置
      expect(window.scrollTo).toHaveBeenCalledWith(0, 200);

      // And: body 樣式應恢復原狀
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
      expect(document.body.style.overflowY).toBe('');
    });
  });

  describe('Feature 2.2: Android Chrome 背景鎖定', () => {
    it('Scenario 2.2.1: 在 Android Chrome 上應鎖定背景滾動', () => {
      // Given: 用戶在 Android Chrome 上使用應用
      // When: 用戶開啟計算機 Modal
      renderHook(() => useBodyScrollLock(true));

      // Then: 背景滾動應被鎖定
      expect(document.body.style.position).toBe('fixed');

      // And: 滾動條空間應保留（避免佈局跳動）
      expect(document.body.style.overflowY).toBe('scroll');
    });

    it('Scenario 2.2.2: 關閉 Modal 時應恢復背景滾動', () => {
      // Given: 計算機 Modal 已開啟
      const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
        initialProps: { locked: true },
      });

      // When: 用戶關閉計算機
      rerender({ locked: false });

      // Then: 背景滾動應恢復正常
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflowY).toBe('');
    });
  });

  describe('Edge Cases: 邊界情況測試', () => {
    it('應處理 scrollY 為 0 的情況', () => {
      // Given: 頁面在最頂部（scrollY = 0）
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 0,
      });

      // When: 開啟 Modal
      renderHook(() => useBodyScrollLock(true));

      // Then: top 應為 "0px"（JavaScript 會將 -0 轉換為 0）
      expect(document.body.style.top).toBe('0px');
    });

    it('應處理多次鎖定/解鎖的情況', () => {
      // Given: Modal 反覆開啟關閉
      const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
        initialProps: { locked: false },
      });

      // When: 開啟 → 關閉 → 開啟
      rerender({ locked: true });
      rerender({ locked: false });
      rerender({ locked: true });

      // Then: 樣式應正確應用
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.top).toBe('-200px');
    });

    it('應保留原始樣式值（非覆蓋）', () => {
      // Given: body 已有自定義樣式
      document.body.style.position = 'relative';
      document.body.style.width = '90%';

      // When: 開啟 Modal 後關閉
      const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
        initialProps: { locked: true },
      });
      rerender({ locked: false });

      // Then: 原始樣式應恢復
      expect(document.body.style.position).toBe('relative');
      expect(document.body.style.width).toBe('90%');
    });
  });
});
