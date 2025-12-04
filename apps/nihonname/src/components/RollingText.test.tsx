/**
 * RollingText 元件單元測試
 *
 * 測試文字滾動動畫組件的行為
 *
 * @see [context7:testing-library/react-testing-library:2025-12-04]
 * @see [context7:vitest-dev/vitest:2025-12-04] timer mocks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RollingText } from './RollingText';

describe('RollingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('渲染', () => {
    it('應該正確渲染初始文字', () => {
      render(<RollingText text="測試文字" />);

      expect(screen.getByText('測試文字')).toBeInTheDocument();
    });

    it('應該應用傳入的 className', () => {
      const { container } = render(<RollingText text="樣式測試" className="custom-class" />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('custom-class');
    });

    it('應該渲染為 inline-block span', () => {
      const { container } = render(<RollingText text="區塊測試" />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('inline-block');
    });
  });

  describe('動畫行為', () => {
    it('應該在 text 變化時觸發動畫', () => {
      const { container, rerender } = render(<RollingText text="原始" />);

      // 初始狀態：等待動畫完成後應該沒有模糊
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span).toHaveClass('blur-0');

      // 變更文字
      rerender(<RollingText text="新文字" />);

      // 動畫開始時應該有模糊效果
      expect(span).toHaveClass('blur-[2px]');
      expect(span).toHaveClass('scale-95');
      expect(span).toHaveClass('opacity-70');
    });

    it('應該在動畫期間顯示隨機日文字元', () => {
      const { container, rerender } = render(<RollingText text="初始" />);

      // 變更文字觸發動畫
      rerender(<RollingText text="新文字" />);

      // 快進一個 interval
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const span = container.querySelector('span');
      // 動畫期間顯示的文字應該是隨機字元，長度與目標相同
      expect(span?.textContent?.length).toBe(3); // "新文字" 長度為 3
    });

    it('應該在動畫結束後顯示最終文字', () => {
      const { container, rerender } = render(<RollingText text="開始" />);

      // 變更文字
      rerender(<RollingText text="結束" />);

      // 預設 6 步驟，每步 50ms，共 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('結束');
      expect(span).toHaveClass('blur-0');
      expect(span).toHaveClass('scale-100');
      expect(span).toHaveClass('opacity-100');
    });

    it('應該支援自訂步數', () => {
      const { container, rerender } = render(<RollingText text="初始" steps={3} interval={100} />);

      rerender(<RollingText text="三步" steps={3} interval={100} />);

      // 3 步 × 100ms = 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('三步');
    });

    it('應該支援自訂間隔', () => {
      const { container, rerender } = render(<RollingText text="初始" interval={20} />);

      rerender(<RollingText text="快速" interval={20} />);

      // 預設 6 步 × 20ms = 120ms
      act(() => {
        vi.advanceTimersByTime(120);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('快速');
    });
  });

  describe('animate prop', () => {
    it('應該在 animate=false 時直接顯示文字不觸發動畫', () => {
      const { container, rerender } = render(<RollingText text="初始" animate={false} />);

      // 變更文字
      rerender(<RollingText text="直接顯示" animate={false} />);

      const span = container.querySelector('span');
      // 應該直接顯示新文字，沒有模糊效果
      expect(span?.textContent).toBe('直接顯示');
      expect(span).toHaveClass('blur-0');
    });

    it('應該在 animate=true（預設）時觸發動畫', () => {
      const { container, rerender } = render(<RollingText text="初始" animate={true} />);

      rerender(<RollingText text="動畫" animate={true} />);

      const span = container.querySelector('span');
      // 應該有模糊效果
      expect(span).toHaveClass('blur-[2px]');
    });
  });

  describe('清理', () => {
    it('應該在組件卸載時清理 interval', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const { rerender, unmount } = render(<RollingText text="初始" />);

      // 觸發動畫
      rerender(<RollingText text="新文字" />);

      // 卸載組件
      unmount();

      // 應該呼叫 clearInterval
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('應該在 text 再次變化時清理前一個 interval', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const { rerender } = render(<RollingText text="初始" />);

      // 第一次變更
      rerender(<RollingText text="第一次" />);

      // 第二次變更（應該清理第一次的 interval）
      rerender(<RollingText text="第二次" />);

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('視覺效果', () => {
    it('應該在動畫期間顯示紅色文字', () => {
      const { container, rerender } = render(<RollingText text="初始" />);

      rerender(<RollingText text="紅色" />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('text-red-800');
    });

    it('應該有平滑的過渡效果', () => {
      const { container } = render(<RollingText text="過渡" />);

      const span = container.querySelector('span');
      expect(span).toHaveClass('transition-all');
      expect(span).toHaveClass('duration-200');
    });
  });

  describe('邊緣情況', () => {
    it('應該正確處理空字串', () => {
      const { container, rerender } = render(<RollingText text="有內容" />);

      rerender(<RollingText text="" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('');
    });

    it('應該正確處理單字元', () => {
      const { container, rerender } = render(<RollingText text="多" />);

      rerender(<RollingText text="一" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe('一');
    });

    it('應該正確處理長文字', () => {
      const longText = '這是一段很長的測試文字';
      const { container, rerender } = render(<RollingText text="短" />);

      rerender(<RollingText text={longText} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const span = container.querySelector('span');
      expect(span?.textContent).toBe(longText);
    });
  });
});
