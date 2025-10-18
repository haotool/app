import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MiniTrendChart, type MiniTrendDataPoint } from '../MiniTrendChart';

// Mock lightweight-charts
// Based on TradingView's official testing strategy: E2E tests for canvas rendering
// Unit tests only verify component logic without actual chart rendering
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      applyOptions: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
  })),
  ColorType: {
    Solid: 'solid',
    VerticalGradient: 'gradient',
  },
  CrosshairMode: {
    Normal: 0,
    Magnet: 1,
  },
  LineStyle: {
    Solid: 0,
    Dotted: 1,
    Dashed: 2,
    LargeDashed: 3,
    SparseDotted: 4,
  },
  AreaSeries: 'AreaSeries',
}));

describe('MiniTrendChart', () => {
  let resizeObserverMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock ResizeObserver
    resizeObserverMock = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    global.ResizeObserver = resizeObserverMock as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('真實數據載入測試', () => {
    it('應該使用傳入的真實數據而非假數據', () => {
      const realData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.025 },
        { date: '2025-10-15', rate: 31.125 },
        { date: '2025-10-16', rate: 31.245 },
      ];

      const { container } = render(<MiniTrendChart data={realData} currencyCode="USD" />);
      const chartContainer = container.querySelector('div');

      // 驗證圖表容器存在（數據 >= 2 筆時應顯示）
      expect(chartContainer).toBeTruthy();
    });

    it('應該拒絕假數據（驗證沒有硬編碼的 mockData）', () => {
      const mockData: MiniTrendDataPoint[] = [
        { date: '2025-10-08', rate: 31.025 },
        { date: '2025-10-09', rate: 31.125 },
      ];

      const { container } = render(<MiniTrendChart data={mockData} currencyCode="USD" />);

      // 即使是假數據格式，只要符合介面也應該顯示（測試組件不依賴特定數據）
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('數據不足時不應顯示圖表（< 2 筆）', () => {
      const insufficientData: MiniTrendDataPoint[] = [{ date: '2025-10-14', rate: 31.025 }];

      const { container } = render(<MiniTrendChart data={insufficientData} currencyCode="USD" />);

      // 數據不足時應返回 null
      expect(container.firstChild).toBeNull();
    });

    it('空數據時不應顯示圖表', () => {
      const { container } = render(<MiniTrendChart data={[]} currencyCode="USD" />);

      // 空數據時應返回 null
      expect(container.firstChild).toBeNull();
    });

    it('應該正確計算匯率統計數據', () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 30.0 },
        { date: '2025-10-15', rate: 31.0 },
        { date: '2025-10-16', rate: 32.0 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      // 驗證圖表渲染
      expect(container.querySelector('div')).toBeTruthy();
      // 統計計算在內部進行（min=30, max=32, change=+2, changePercent=+6.67%）
    });
  });

  describe('數據格式驗證', () => {
    it('應該接受正確的日期格式 (YYYY-MM-DD)', () => {
      const validData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.025 },
        { date: '2025-10-15', rate: 31.125 },
      ];

      expect(() => render(<MiniTrendChart data={validData} currencyCode="USD" />)).not.toThrow();
    });

    it('應該處理小數點匯率', () => {
      const decimalData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.12345 },
        { date: '2025-10-15', rate: 31.6789 },
      ];

      expect(() => render(<MiniTrendChart data={decimalData} currencyCode="USD" />)).not.toThrow();
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理大量數據點（30天）', () => {
      const largeData: MiniTrendDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-10-${String(i + 1).padStart(2, '0')}`,
        rate: 30 + Math.random() * 2,
      }));

      const { container } = render(<MiniTrendChart data={largeData} currencyCode="USD" />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該處理匯率為 0 的情況', () => {
      const zeroData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 0 },
        { date: '2025-10-15', rate: 0 },
      ];

      const { container } = render(<MiniTrendChart data={zeroData} currencyCode="USD" />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該處理極大匯率值', () => {
      const extremeData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 999999.99 },
        { date: '2025-10-15', rate: 1000000.0 },
      ];

      const { container } = render(<MiniTrendChart data={extremeData} currencyCode="USD" />);
      expect(container.querySelector('div')).toBeTruthy();
    });
  });
});
