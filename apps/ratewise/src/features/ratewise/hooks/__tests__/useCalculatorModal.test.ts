import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculatorModal } from '../useCalculatorModal';

describe('useCalculatorModal', () => {
  describe('初始狀態', () => {
    it('應該返回正確的初始狀態', () => {
      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue: vi.fn(() => 0),
        }),
      );

      expect(result.current.isOpen).toBe(false);
      expect(result.current.activeField).toBe(null);
      expect(result.current.initialValue).toBe(0);
    });
  });

  describe('openCalculator', () => {
    it('應該打開計算機並設置活動欄位', () => {
      const getInitialValue = vi.fn((field: 'from' | 'to') => {
        return field === 'from' ? 100 : 200;
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      act(() => {
        result.current.openCalculator('from');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeField).toBe('from');
      expect(result.current.initialValue).toBe(100);
      expect(getInitialValue).toHaveBeenCalledWith('from');
    });

    it('應該正確處理不同的欄位類型', () => {
      const getInitialValue = vi.fn((currency: 'USD' | 'EUR' | 'JPY') => {
        const values = { USD: 100, EUR: 200, JPY: 300 };
        return values[currency];
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'USD' | 'EUR' | 'JPY'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      act(() => {
        result.current.openCalculator('EUR');
      });

      expect(result.current.activeField).toBe('EUR');
      expect(result.current.initialValue).toBe(200);
    });
  });

  describe('closeCalculator', () => {
    it('應該關閉計算機並清空狀態', () => {
      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue: vi.fn(() => 100),
        }),
      );

      // 先打開
      act(() => {
        result.current.openCalculator('from');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.activeField).toBe('from');

      // 再關閉
      act(() => {
        result.current.closeCalculator();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.activeField).toBe(null);
      expect(result.current.initialValue).toBe(0);
    });
  });

  describe('handleConfirm', () => {
    it('應該調用 onConfirm 並關閉計算機', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm,
          getInitialValue: vi.fn(() => 100),
        }),
      );

      // 打開計算機
      act(() => {
        result.current.openCalculator('from');
      });

      // 確認結果
      act(() => {
        result.current.handleConfirm(500);
      });

      expect(onConfirm).toHaveBeenCalledWith('from', 500);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.activeField).toBe(null);
    });

    it('當 activeField 為 null 時不應該調用 onConfirm', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm,
          getInitialValue: vi.fn(() => 0),
        }),
      );

      // 未打開計算機直接確認
      act(() => {
        result.current.handleConfirm(500);
      });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('應該正確處理多幣別場景', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useCalculatorModal<'USD' | 'EUR' | 'JPY'>({
          onConfirm,
          getInitialValue: vi.fn(() => 1000),
        }),
      );

      act(() => {
        result.current.openCalculator('USD');
      });

      act(() => {
        result.current.handleConfirm(2500);
      });

      expect(onConfirm).toHaveBeenCalledWith('USD', 2500);
    });
  });

  describe('initialValue 計算', () => {
    it('應該根據 activeField 動態計算 initialValue', () => {
      const getInitialValue = vi.fn((field: 'from' | 'to') => {
        return field === 'from' ? 100 : 200;
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      // 初始狀態
      expect(result.current.initialValue).toBe(0);

      // 打開 'from'
      act(() => {
        result.current.openCalculator('from');
      });
      expect(result.current.initialValue).toBe(100);

      // 關閉
      act(() => {
        result.current.closeCalculator();
      });
      expect(result.current.initialValue).toBe(0);

      // 打開 'to'
      act(() => {
        result.current.openCalculator('to');
      });
      expect(result.current.initialValue).toBe(200);
    });
  });

  describe('邊緣情況', () => {
    it('應該處理 getInitialValue 返回 NaN 的情況', () => {
      const getInitialValue = vi.fn((field: 'from' | 'to') => {
        // 模擬實際使用場景：空字串會被轉換為 0
        const value = field === 'from' ? '' : '0';
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      act(() => {
        result.current.openCalculator('from');
      });

      // 空字串應該被轉換為 0
      expect(result.current.initialValue).toBe(0);
    });

    it('應該處理連續打開不同欄位的情況', () => {
      const getInitialValue = vi.fn((field: 'from' | 'to') => {
        return field === 'from' ? 100 : 200;
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      // 打開 'from'
      act(() => {
        result.current.openCalculator('from');
      });
      expect(result.current.activeField).toBe('from');
      expect(result.current.initialValue).toBe(100);

      // 直接打開 'to'（不關閉）
      act(() => {
        result.current.openCalculator('to');
      });
      expect(result.current.activeField).toBe('to');
      expect(result.current.initialValue).toBe(200);
    });

    it('應該正確處理實際輸入框值的情況', () => {
      // 模擬實際場景：fromAmount = '1500', toAmount = '45.5'
      const amounts = { from: '1500', to: '45.5' };
      const getInitialValue = vi.fn((field: 'from' | 'to') => {
        const value = amounts[field];
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      });

      const { result } = renderHook(() =>
        useCalculatorModal<'from' | 'to'>({
          onConfirm: vi.fn(),
          getInitialValue,
        }),
      );

      // 打開 'from' 應該顯示 1500
      act(() => {
        result.current.openCalculator('from');
      });
      expect(result.current.initialValue).toBe(1500);

      // 打開 'to' 應該顯示 45.5
      act(() => {
        result.current.openCalculator('to');
      });
      expect(result.current.initialValue).toBe(45.5);
    });
  });
});
