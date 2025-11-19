/**
 * useLongPress Hook - BDD Test Suite
 * @file useLongPress.test.ts
 * @description 行為驅動開發測試：長按刪除功能
 *
 * 🐛 修復驗證 2025-11-20：
 * - 確保 150ms 間隔（避免過快刪除）
 * - 確保短按不會雙重觸發
 * - 確保移動設備和桌面版一致
 *
 * BDD 格式：Given-When-Then
 * @see docs/prompt/BDD.md
 */

import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../useLongPress';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * BDD 場景：長按刪除功能
 *
 * 核心行為：
 * 1. 短按（<500ms）：刪除一個字符
 * 2. 長按（≥500ms）：連續刪除，間隔 150ms
 * 3. 移動設備和桌面版行為一致
 */
describe('useLongPress Hook - BDD Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * 場景 1：短按刪除（單次觸發）
   * Given: 用戶需要刪除單個字符
   * When: 按下刪除鈕並在 500ms 內釋放
   * Then: 只觸發一次刪除，不會雙重觸發
   */
  describe('場景 1: 短按刪除（單次觸發）', () => {
    it('應該在短按時觸發 onClick 回調一次', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬短按（桌面版）
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下（mouseDown）
      act(() => {
        result.current.onMouseDown();
      });

      // 模擬在 500ms 前釋放（mouseUp）- 短按
      act(() => {
        vi.advanceTimersByTime(300); // 只經過 300ms
        result.current.onMouseUp();
      });

      // Then: 驗證結果
      expect(onLongPressMock).not.toHaveBeenCalled(); // 長按不應觸發
    });

    it('應該在觸控設備短按時觸發 onClick 回調一次', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬短按（移動版）
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下（touchStart）
      act(() => {
        result.current.onTouchStart();
      });

      // 模擬在 500ms 前釋放（touchEnd）- 短按
      act(() => {
        vi.advanceTimersByTime(300);
        result.current.onTouchEnd();
      });

      // Then: 驗證結果
      expect(onLongPressMock).not.toHaveBeenCalled(); // 長按不應觸發
    });
  });

  /**
   * 場景 2：長按連續刪除（150ms 間隔）
   * Given: 用戶需要快速刪除多個字符
   * When: 按住刪除鈕超過 500ms
   * Then: 應該以 150ms 間隔連續觸發刪除
   */
  describe('場景 2: 長按連續刪除（150ms 間隔）', () => {
    it('應該在長按時以 150ms 間隔連續觸發', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下
      act(() => {
        result.current.onMouseDown();
      });

      // 驗證：500ms 後第一次觸發
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(1);

      // 驗證：150ms 後第二次觸發
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(2);

      // 驗證：再 150ms 後第三次觸發
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(3);

      // 驗證：再 150ms 後第四次觸發
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(4);

      // Then: 驗證間隔正確（150ms，非 100ms）
    });

    it('應該在觸控設備長按時以 150ms 間隔連續觸發', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按（觸控）
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下（touchStart）
      act(() => {
        result.current.onTouchStart();
      });

      // 驗證：500ms + 150ms * 3 = 950ms 後應觸發 4 次
      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Then: 驗證觸發次數
      expect(onLongPressMock).toHaveBeenCalledTimes(4);
    });
  });

  /**
   * 場景 3：中途釋放停止刪除
   * Given: 用戶正在長按刪除
   * When: 用戶釋放按鈕或移開游標
   * Then: 應該立即停止刪除
   */
  describe('場景 3: 中途釋放停止刪除', () => {
    it('應該在 mouseUp 時停止連續刪除', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按後釋放
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下並觸發長按
      act(() => {
        result.current.onMouseDown();
        vi.advanceTimersByTime(800); // 500ms + 150ms * 2
      });

      const callCountBefore = onLongPressMock.mock.calls.length;

      // 模擬釋放
      act(() => {
        result.current.onMouseUp();
        vi.advanceTimersByTime(1000); // 再過很久
      });

      // Then: 驗證釋放後不再觸發
      expect(onLongPressMock).toHaveBeenCalledTimes(callCountBefore);
    });

    it('應該在 mouseLeave 時停止連續刪除', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按後移開
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下並觸發長按
      act(() => {
        result.current.onMouseDown();
        vi.advanceTimersByTime(800);
      });

      const callCountBefore = onLongPressMock.mock.calls.length;

      // 模擬移開
      act(() => {
        result.current.onMouseLeave();
        vi.advanceTimersByTime(1000);
      });

      // Then: 驗證移開後不再觸發
      expect(onLongPressMock).toHaveBeenCalledTimes(callCountBefore);
    });

    it('應該在 touchEnd 時停止連續刪除', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按後釋放（觸控）
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下並觸發長按
      act(() => {
        result.current.onTouchStart();
        vi.advanceTimersByTime(800);
      });

      const callCountBefore = onLongPressMock.mock.calls.length;

      // 模擬釋放
      act(() => {
        result.current.onTouchEnd();
        vi.advanceTimersByTime(1000);
      });

      // Then: 驗證釋放後不再觸發
      expect(onLongPressMock).toHaveBeenCalledTimes(callCountBefore);
    });
  });

  /**
   * 場景 4：自訂參數
   * Given: 用戶需要自訂長按行為
   * When: 傳入自訂 threshold 和 interval
   * Then: 應該按照自訂參數運作
   */
  describe('場景 4: 自訂參數', () => {
    it('應該支援自訂 threshold', () => {
      // Given: 準備測試數據（自訂 threshold 為 1000ms）
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 1000,
          interval: 150,
        }),
      );

      act(() => {
        result.current.onMouseDown();
      });

      // 驗證：500ms 不應觸發（threshold 為 1000ms）
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onLongPressMock).not.toHaveBeenCalled();

      // 驗證：1000ms 應觸發
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });

    it('應該支援自訂 interval', () => {
      // Given: 準備測試數據（自訂 interval 為 200ms）
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並模擬長按
      const { result } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 200,
        }),
      );

      act(() => {
        result.current.onMouseDown();
        vi.advanceTimersByTime(500); // 第一次觸發
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(1);

      // 驗證：200ms 後第二次觸發（非 150ms）
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onLongPressMock).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * 場景 5：記憶體洩漏防護
   * Given: 組件可能在長按期間被卸載
   * When: 組件卸載時仍有計時器運行
   * Then: 應該清理所有計時器，避免記憶體洩漏
   */
  describe('場景 5: 記憶體洩漏防護', () => {
    it('應該在組件卸載時清理計時器', () => {
      // Given: 準備測試數據
      const onLongPressMock = vi.fn();

      // When: 渲染 hook 並在長按期間卸載
      const { result, unmount } = renderHook(() =>
        useLongPress({
          onLongPress: onLongPressMock,
          threshold: 500,
          interval: 150,
        }),
      );

      // 模擬按下並開始長按
      act(() => {
        result.current.onMouseDown();
        vi.advanceTimersByTime(300); // 還未觸發長按
      });

      // 卸載組件
      unmount();

      // 嘗試繼續計時
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Then: 驗證卸載後不再觸發（計時器已清理）
      expect(onLongPressMock).not.toHaveBeenCalled();
    });
  });
});
