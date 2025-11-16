/**
 * useCalculator.test.ts - 計算機 hook 測試
 *
 * BDD 測試：測試行為而非實作細節
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from '../useCalculator';

describe('useCalculator', () => {
  describe('基本輸入', () => {
    it('應初始化為空運算式', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.expression).toBe('');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('應處理數字輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      expect(result.current.expression).toBe('5');

      act(() => result.current.input('3'));
      expect(result.current.expression).toBe('53');
    });

    it('應處理運算子輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));

      expect(result.current.expression).toBe('5 + 3');
    });

    it('應處理小數點輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('3'));
      act(() => result.current.input('.'));
      act(() => result.current.input('14'));

      expect(result.current.expression).toBe('3.14');
    });
  });

  describe('計算功能', () => {
    it('應正確計算運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBe(5);
      expect(result.current.error).toBeNull();
    });

    it('應處理複雜運算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('('));
      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      act(() => result.current.input(')'));
      act(() => result.current.input('×'));
      act(() => result.current.input('4'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBe(20);
    });

    it('應處理小數計算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('0'));
      act(() => result.current.input('.'));
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      act(() => result.current.input('0'));
      act(() => result.current.input('.'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBeCloseTo(0.3);
    });
  });

  describe('清除功能', () => {
    it('應清除運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('123'));
      act(() => result.current.clear());

      expect(result.current.expression).toBe('');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('應清除錯誤訊息', () => {
      const { result } = renderHook(() => useCalculator());

      // 觸發錯誤
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();

      // 清除應移除錯誤
      act(() => result.current.clear());
      expect(result.current.error).toBeNull();
    });
  });

  describe('刪除功能', () => {
    it('應刪除最後一個字元', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('1'));
      act(() => result.current.input('2'));
      act(() => result.current.input('3'));
      act(() => result.current.backspace());

      expect(result.current.expression).toBe('12');
    });

    it('應在空運算式時不做任何事', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.backspace());
      expect(result.current.expression).toBe('');
    });

    it('應在有內容時刪除字元並清除錯誤', () => {
      const { result } = renderHook(() => useCalculator());

      // 輸入內容並觸發錯誤
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());
      expect(result.current.error).not.toBeNull();

      // 刪除應清除錯誤
      act(() => result.current.backspace());
      expect(result.current.error).toBeNull();
    });
  });

  describe('錯誤處理', () => {
    it('應處理無效運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('應處理括號不匹配', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('('));
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });

    it('應處理空運算式計算', () => {
      const { result } = renderHook(() => useCalculator());

      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('連續計算', () => {
    it('應支援連續計算', () => {
      const { result } = renderHook(() => useCalculator());

      // 第一次計算：2+3=5
      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());
      expect(result.current.result).toBe(5);

      // 第二次計算：5×2=10
      act(() => result.current.input('×'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());
      expect(result.current.result).toBe(10);
    });

    it('應在新輸入數字時清除前次結果', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());

      // 輸入新數字應開始新運算式
      act(() => result.current.input('7'));
      expect(result.current.expression).toBe('7');
      expect(result.current.result).toBeNull();
    });
  });

  describe('驗證規則', () => {
    it('應防止重複小數點', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('3'));
      act(() => result.current.input('.'));
      act(() => result.current.input('14'));
      act(() => result.current.input('.')); // 第二個小數點

      expect(result.current.expression).toBe('3.14'); // 忽略第二個小數點
    });

    it('應防止以運算子結尾計算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });
  });
});
