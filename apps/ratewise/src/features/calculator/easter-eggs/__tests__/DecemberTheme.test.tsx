/**
 * December Theme - Unit Tests
 * @file DecemberTheme.test.tsx
 * @description 12 月聖誕主題組件的單元測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DecemberTheme } from '../DecemberTheme';
import { DecemberSnowScene } from '../DecemberSnowScene';
import { SnowAccumulation } from '../SnowAccumulation';
import { MiniChristmasTree } from '../MiniChristmasTree';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('DecemberTheme Components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('DecemberTheme', () => {
    it('should not render when not December', () => {
      // 設定為 1 月
      vi.setSystemTime(new Date(2025, 0, 15)); // January 15, 2025

      act(() => {
        render(<DecemberTheme />);
      });

      // 不應該渲染任何內容
      expect(screen.queryByLabelText('點擊查看聖誕祝福')).not.toBeInTheDocument();
      expect(screen.queryByText(/啟用聖誕|關閉動畫/)).not.toBeInTheDocument();
    });

    it('should render snow scene and mini tree in December', () => {
      // 設定為 12 月
      vi.setSystemTime(new Date(2025, 11, 25)); // December 25, 2025

      act(() => {
        render(<DecemberTheme />);
      });

      // 等待 useEffect 執行
      expect(screen.getByLabelText('點擊查看聖誕祝福')).toBeInTheDocument();
    });

    it('should show toggle button in December', () => {
      vi.setSystemTime(new Date(2025, 11, 25));

      act(() => {
        render(<DecemberTheme showToggle={true} />);
      });

      expect(screen.getByText(/關閉動畫/)).toBeInTheDocument();
    });

    it('should hide toggle button when showToggle is false', () => {
      vi.setSystemTime(new Date(2025, 11, 25));

      act(() => {
        render(<DecemberTheme showToggle={false} />);
      });

      // 不應該顯示開關按鈕
      expect(screen.queryByText(/啟用聖誕|關閉動畫/)).not.toBeInTheDocument();
    });
  });

  describe('DecemberSnowScene', () => {
    it('should render snowflakes', () => {
      render(<DecemberSnowScene />);

      // 應該有雪花容器
      const container = document.querySelector('.december-snow-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render multiple snowflakes', () => {
      render(<DecemberSnowScene />);

      const snowflakes = document.querySelectorAll('.december-snowflake');
      expect(snowflakes.length).toBeGreaterThan(0);
    });
  });

  describe('SnowAccumulation', () => {
    it('should render with default props', () => {
      render(<SnowAccumulation />);

      const accumulation = document.querySelector('.snow-accumulation');
      expect(accumulation).toBeInTheDocument();
      expect(accumulation).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply variant class', () => {
      render(<SnowAccumulation variant="thick" />);

      const accumulation = document.querySelector('.snow-accumulation--thick');
      expect(accumulation).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SnowAccumulation className="custom-class" />);

      const accumulation = document.querySelector('.custom-class');
      expect(accumulation).toBeInTheDocument();
    });

    it('should render sparkles', () => {
      render(<SnowAccumulation />);

      const sparkles = document.querySelectorAll('.snow-sparkle');
      expect(sparkles.length).toBe(6);
    });
  });

  describe('MiniChristmasTree', () => {
    it('should render with year prop', () => {
      act(() => {
        render(<MiniChristmasTree year={2025} />);
      });

      expect(screen.getByLabelText('點擊查看聖誕祝福')).toBeInTheDocument();
    });

    it('should show greeting on click', () => {
      act(() => {
        render(<MiniChristmasTree year={2025} />);
      });

      const tree = screen.getByLabelText('點擊查看聖誕祝福');

      act(() => {
        fireEvent.click(tree);
      });

      expect(screen.getByText(/2025 Merry Christmas!/)).toBeInTheDocument();
    });

    it('should trigger auto-hide timeout when greeting is shown', () => {
      // 測試 setTimeout 是否被調用（不測試實際的消失行為）
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      act(() => {
        render(<MiniChristmasTree year={2025} />);
      });

      const tree = screen.getByLabelText('點擊查看聖誕祝福');

      act(() => {
        fireEvent.click(tree);
      });

      // 賀詞應該出現
      expect(screen.getByText(/2025 Merry Christmas!/)).toBeInTheDocument();

      // 確認 setTimeout 被調用（用於 3 秒後自動隱藏）
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

      setTimeoutSpy.mockRestore();
    });

    it('should apply custom className', () => {
      act(() => {
        render(<MiniChristmasTree year={2025} className="custom-tree" />);
      });

      const container = document.querySelector('.custom-tree');
      expect(container).toBeInTheDocument();
    });
  });
});

describe('Dynamic Year in ChristmasEasterEgg', () => {
  it('should use current year instead of hardcoded 2025', async () => {
    vi.setSystemTime(new Date(2026, 11, 25)); // December 25, 2026

    // 動態導入以獲取最新的組件
    const { ChristmasEasterEgg } = await import('../ChristmasEasterEgg');

    act(() => {
      render(<ChristmasEasterEgg isVisible={true} onClose={() => {}} />);
    });

    // 應該顯示當前年份而非硬編碼的 2025
    expect(screen.getByText(/2026 聖誕快樂/)).toBeInTheDocument();
  });
});
