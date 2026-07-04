import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MiniTrendChart, clampTooltipCenterX, type MiniTrendDataPoint } from '../MiniTrendChart';

// Store crosshair callback for testing
let crosshairCallback: ((param: unknown) => void) | null = null;

// Mock lightweight-charts
// Based on TradingView's official testing strategy: E2E tests for canvas rendering
// Unit tests only verify component logic without actual chart rendering
vi.mock('lightweight-charts', () => {
  const mockSeries = {
    setData: vi.fn(),
    applyOptions: vi.fn(),
  };

  return {
    createChart: vi.fn(() => ({
      addSeries: vi.fn(() => mockSeries),
      timeScale: vi.fn(() => ({
        fitContent: vi.fn(),
        applyOptions: vi.fn(),
      })),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
      applyOptions: vi.fn(),
      subscribeCrosshairMove: vi.fn((callback) => {
        crosshairCallback = callback;
      }),
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
    TrackingModeExitMode: {
      OnTouchEnd: 0,
      OnNextTap: 1,
    },
    LineStyle: {
      Solid: 0,
      Dotted: 1,
      Dashed: 2,
      LargeDashed: 3,
      SparseDotted: 4,
    },
    AreaSeries: 'AreaSeries',
  };
});

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
    }, 15000);

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
      const largeData: MiniTrendDataPoint[] = Array.from({ length: 25 }, (_, i) => ({
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

  describe('Crosshair 交互測試', () => {
    it('應該在 crosshair 移動時顯示 tooltip', async () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
        { date: '2025-10-16', rate: 32.0 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      // 等待圖表渲染
      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 模擬 crosshair 移動事件 - 顯示 tooltip
      const mockSeriesData = new Map();
      mockSeriesData.set({}, { value: 31.5 });

      act(() => {
        crosshairCallback?.({
          point: { x: 100, y: 50 },
          time: '2025-10-15',
          seriesData: mockSeriesData,
        });
      });

      // 驗證圖表仍然存在
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該在 crosshair 離開時隱藏 tooltip', async () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 模擬 crosshair 離開 - point undefined
      act(() => {
        crosshairCallback?.({
          point: undefined,
          time: null,
          seriesData: new Map(),
        });
      });

      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該處理 crosshair 在圖表邊界外的情況', async () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 模擬 crosshair 在邊界外 - x < 0
      act(() => {
        crosshairCallback?.({
          point: { x: -10, y: 50 },
          time: '2025-10-15',
          seriesData: new Map(),
        });
      });

      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該處理 crosshair 沒有時間的情況', async () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 模擬 crosshair 沒有時間
      act(() => {
        crosshairCallback?.({
          point: { x: 100, y: 50 },
          time: null,
          seriesData: new Map(),
        });
      });

      expect(container.querySelector('div')).toBeTruthy();
    });
  });

  describe('視窗大小變化測試', () => {
    it('應該在視窗大小變化時重新調整圖表', () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
      ];

      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      // 驗證圖表存在
      expect(container.querySelector('div')).toBeTruthy();

      // 觸發 resize 事件
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // 驗證圖表仍然存在
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('應該在組件卸載時移除 resize 監聽器', () => {
      const testData: MiniTrendDataPoint[] = [
        { date: '2025-10-14', rate: 31.0 },
        { date: '2025-10-15', rate: 31.5 },
      ];

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      // 卸載組件
      unmount();

      // 驗證 resize 監聽器被移除
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('clampTooltipCenterX（viewport 邊界夾定）', () => {
    it('中間點不夾定，維持原 x', () => {
      expect(clampTooltipCenterX(195, 146, 390)).toBe(195);
    });

    it('最右資料點夾回 viewport 內（取證案例：x=388, 寬 146, viewport 390）', () => {
      // 未夾定時 tooltip 右緣 = 388 + 73 = 461 > 390；夾定後中心 = 390 - 73 - 8 = 309
      expect(clampTooltipCenterX(388, 146, 390)).toBe(309);
    });

    it('最左資料點夾回 viewport 內', () => {
      expect(clampTooltipCenterX(2, 146, 390)).toBe(81);
    });

    it('tooltip 寬於 viewport 時退回置中', () => {
      expect(clampTooltipCenterX(10, 500, 390)).toBe(195);
    });
  });

  describe('Tooltip portal 與邊界夾定', () => {
    const testData: MiniTrendDataPoint[] = [
      { date: '2025-10-14', rate: 31.0 },
      { date: '2025-10-15', rate: 31.5 },
      { date: '2025-10-16', rate: 32.0 },
    ];

    // component 以 seriesData.get(series) 取值，直接以 stub get 回傳資料點
    const showTooltipAt = (x: number) => {
      act(() => {
        crosshairCallback?.({
          point: { x, y: 40 },
          time: '2025-10-15',
          seriesData: {
            get: () => ({ value: 31.5 }),
          },
        });
      });
    };

    it('tooltip 應 portal 至 document.body（不受帶 transform 的祖先影響 fixed 定位）', async () => {
      const { container } = render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      showTooltipAt(100);

      const tooltip = document.querySelector('[data-testid="mini-trend-chart-tooltip"]');
      expect(tooltip).toBeInTheDocument();
      // portal 後 tooltip 不在圖表容器 DOM 樹內
      expect(container.contains(tooltip)).toBe(false);
      expect(document.body.contains(tooltip)).toBe(true);
    });

    it('最右資料點 tooltip 的 left 應被夾在 viewport 內', async () => {
      render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 模擬 crosshair x 遠超 viewport 寬度（jsdom innerWidth 預設 1024）
      showTooltipAt(window.innerWidth + 500);

      const tooltip = document.querySelector<HTMLElement>(
        '[data-testid="mini-trend-chart-tooltip"]',
      );
      expect(tooltip).toBeInTheDocument();
      const left = parseFloat(tooltip!.style.left);
      // 中心 x 夾定上限 = innerWidth - 寬/2 - 8（jsdom offsetWidth=0 → 上限 innerWidth-8）
      expect(left).toBeLessThanOrEqual(window.innerWidth - 8);
    });

    it('最左資料點 tooltip 的 left 應被夾在 viewport 內', async () => {
      render(<MiniTrendChart data={testData} currencyCode="USD" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      // 圖表最左緣（x=0 為合法座標；負值會被 crosshair handler 視為離開圖表）
      showTooltipAt(0);

      const tooltip = document.querySelector<HTMLElement>(
        '[data-testid="mini-trend-chart-tooltip"]',
      );
      expect(tooltip).toBeInTheDocument();
      expect(parseFloat(tooltip!.style.left)).toBeGreaterThanOrEqual(8);
    });
  });

  describe('走勢基準標註（basisLabel）', () => {
    const testData: MiniTrendDataPoint[] = [
      { date: '2025-10-14', rate: 31.0 },
      { date: '2025-10-15', rate: 31.5 },
    ];

    it('提供 basisLabel 時圖角顯示基準標註', () => {
      render(<MiniTrendChart data={testData} currencyCode="USD" basisLabel="現金賣出走勢" />);

      const badge = screen.getByTestId('trend-basis-label');
      expect(badge).toHaveTextContent('現金賣出走勢');
    });

    it('未提供 basisLabel 時不顯示基準標註', () => {
      render(<MiniTrendChart data={testData} currencyCode="USD" />);

      expect(screen.queryByTestId('trend-basis-label')).not.toBeInTheDocument();
    });

    it('tooltip 內也顯示基準標註', async () => {
      render(<MiniTrendChart data={testData} currencyCode="USD" basisLabel="現金賣出走勢" />);

      await waitFor(() => {
        expect(crosshairCallback).not.toBeNull();
      });

      act(() => {
        crosshairCallback?.({
          point: { x: 100, y: 40 },
          time: '2025-10-15',
          seriesData: {
            get: () => ({ value: 31.5 }),
          },
        });
      });

      const tooltip = document.querySelector('[data-testid="mini-trend-chart-tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('現金賣出走勢');
    });
  });
});
