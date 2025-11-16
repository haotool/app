/**
 * useCalculatorKeyboard.test.ts - 鍵盤快捷鍵測試
 *
 * BDD 測試：測試鍵盤輸入行為
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalculatorKeyboard } from '../useCalculatorKeyboard';

describe('useCalculatorKeyboard', () => {
  const mockCallbacks = {
    onInput: vi.fn(),
    onBackspace: vi.fn(),
    onClear: vi.fn(),
    onCalculate: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('數字輸入', () => {
    it('應處理數字鍵 0-9', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      // 模擬按下數字鍵
      const event = new KeyboardEvent('keydown', { key: '5' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('5');
    });

    it('應處理小數點', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '.' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('.');
    });

    it('應處理所有數字 0-9', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      for (let i = 0; i <= 9; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) });
        window.dispatchEvent(event);
      }

      expect(mockCallbacks.onInput).toHaveBeenCalledTimes(10);
    });
  });

  describe('運算符輸入', () => {
    it('應處理加法運算符', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '+' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('+');
    });

    it('應處理減法運算符', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '-' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('-');
    });

    it('應將 * 轉換為 ×', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '*' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('×');
    });

    it('應將 / 轉換為 ÷', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '/' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalledWith('÷');
    });
  });

  describe('操作鍵', () => {
    it('應處理 Enter 鍵計算結果', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onCalculate).toHaveBeenCalled();
    });

    it('應處理 Backspace 鍵刪除', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onBackspace).toHaveBeenCalled();
    });

    it('應處理 Escape 鍵關閉', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onClose).toHaveBeenCalled();
    });

    it('應處理 Delete 鍵清除', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onClear).toHaveBeenCalled();
    });
  });

  describe('狀態管理', () => {
    it('應在關閉時不處理鍵盤事件', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: false,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '5' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).not.toHaveBeenCalled();
    });

    it('應在開啟時處理鍵盤事件', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const event = new KeyboardEvent('keydown', { key: '5' });
      window.dispatchEvent(event);

      expect(mockCallbacks.onInput).toHaveBeenCalled();
    });
  });

  describe('事件過濾', () => {
    it('應忽略來自 input 元素的事件', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: '5', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      input.dispatchEvent(event);

      expect(mockCallbacks.onInput).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('應忽略來自 textarea 元素的事件', () => {
      renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', { key: '5', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      textarea.dispatchEvent(event);

      expect(mockCallbacks.onInput).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('清理', () => {
    it('應在卸載時移除事件監聽器', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useCalculatorKeyboard({
          isOpen: true,
          ...mockCallbacks,
        }),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
