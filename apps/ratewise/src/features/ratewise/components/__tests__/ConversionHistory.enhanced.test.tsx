/**
 * ConversionHistory Enhanced Features Test Suite
 *
 * 🔴 RED Phase: 定義新功能的測試案例
 *
 * 測試範圍：
 * - 持久化存儲 (localStorage)
 * - 點擊重新轉換
 * - 清除全部歷史
 * - 複製轉換結果
 * - 時間格式化（相對時間）
 * - 7 天過期自動清理
 *
 * 建立時間: 2025-12-26
 * BDD 階段: 🔴 RED (預期所有測試失敗)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ConversionHistory } from '../ConversionHistory';
import type { ConversionHistoryEntry } from '../../types';

describe('🔴 RED: ConversionHistory 增強功能', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  // Mock navigator.clipboard
  const clipboardMock = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    // 設定 localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // 設定 clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });

    // 清空 localStorage
    localStorageMock.clear();

    // 清除所有 mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  // 測試用的 mock 歷史記錄
  const createMockHistory = (): ConversionHistoryEntry[] => [
    {
      from: 'USD',
      to: 'TWD',
      amount: '1000',
      result: '30900',
      time: '今天 14:30',
      timestamp: Date.now() - 60 * 60 * 1000, // 1 小時前
    },
    {
      from: 'JPY',
      to: 'TWD',
      amount: '10000',
      result: '2087',
      time: '今天 12:15',
      timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 小時前
    },
    {
      from: 'EUR',
      to: 'TWD',
      amount: '500',
      result: '18575',
      time: '昨天 09:20',
      timestamp: Date.now() - 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000, // 昨天
    },
  ];

  describe('基本渲染', () => {
    it('應該在有歷史記錄時顯示組件', () => {
      const mockHistory = createMockHistory();
      const { container } = render(<ConversionHistory history={mockHistory} />);

      // 新 UI 不再顯示標題，直接顯示列表
      expect(container.firstChild).not.toBeNull();
      // 檢查是否有歷史記錄項目
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('應該在無歷史記錄時返回 null（不渲染）', () => {
      const { container } = render(<ConversionHistory history={[]} />);

      expect(container.firstChild).toBeNull();
    });

    // 清除按鈕已移至 Favorites 頁面，組件不再顯示
  });

  // 註: 持久化存儲測試應該在 useCurrencyConverter.test.ts 中
  // ConversionHistory 是純展示組件，不處理 localStorage

  describe('點擊重新轉換', () => {
    it('應該在點擊國旗區域時呼叫 onReconvert', () => {
      const mockHistory = createMockHistory();
      const onReconvert = vi.fn();

      render(<ConversionHistory history={mockHistory} onReconvert={onReconvert} />);

      // 新 UI v4.0：點擊國旗區域（左側按鈕）觸發重新轉換
      const reconvertButtons = screen.getAllByRole('button', { name: /快速換算|Quick convert/i });
      expect(reconvertButtons.length).toBeGreaterThan(0);

      fireEvent.click(reconvertButtons[0]!);

      expect(onReconvert).toHaveBeenCalledWith(mockHistory[0]);
    });

    it('應該傳遞正確的轉換參數', () => {
      const mockHistory = createMockHistory();
      const onReconvert = vi.fn();

      render(<ConversionHistory history={mockHistory} onReconvert={onReconvert} />);

      // 新 UI v4.0：點擊國旗按鈕觸發重新轉換
      const reconvertButtons = screen.getAllByRole('button', { name: /快速換算|Quick convert/i });
      fireEvent.click(reconvertButtons[1]!);

      expect(onReconvert).toHaveBeenCalledWith({
        from: 'JPY',
        to: 'TWD',
        amount: '10000',
        result: '2087',
        time: '今天 12:15',
        timestamp: expect.any(Number),
      });
    });

    it('應該在懸停時顯示視覺反饋', () => {
      const mockHistory = createMockHistory();
      const onReconvert = vi.fn();

      render(<ConversionHistory history={mockHistory} onReconvert={onReconvert} />);

      // 新 UI v4.0：卡片具有 hover:shadow-md 效果
      const firstCard = screen.getByText('1000').closest('div[role="group"]');
      expect(firstCard).toHaveClass('hover:shadow-md');
    });
  });

  // 清除歷史功能已移至 Favorites 頁面
  // ConversionHistory 組件現在是純展示組件

  describe('複製功能', () => {
    it('應該在點擊轉換詳情區域時複製轉換結果', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // 新 UI v4.0：點擊轉換詳情區域（中間按鈕）複製
      const copyButtons = screen.getAllByLabelText('複製轉換結果');
      fireEvent.click(copyButtons[0]!);

      expect(clipboardMock.writeText).toHaveBeenCalledWith('1000 USD = 30900 TWD');
    });

    it('應該顯示複製圖示提示', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // 新 UI v4.0：每個卡片右側有複製圖示
      const copyIcons = document.querySelectorAll('.lucide-copy');
      expect(copyIcons.length).toBe(3); // 3 條歷史記錄
    });

    it('點擊詳情區域應該複製而非重新轉換', () => {
      const mockHistory = createMockHistory();
      const onReconvert = vi.fn();

      render(<ConversionHistory history={mockHistory} onReconvert={onReconvert} />);

      // 點擊複製按鈕（中間區域）
      const copyButtons = screen.getAllByLabelText('複製轉換結果');
      fireEvent.click(copyButtons[0]!);

      // 點擊複製按鈕不應該觸發 onReconvert（只複製）
      expect(onReconvert).not.toHaveBeenCalled();
      expect(clipboardMock.writeText).toHaveBeenCalled();
    });

    it('應該處理剪貼簿 API 錯誤', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      clipboardMock.writeText.mockRejectedValueOnce(new Error('Clipboard API 不可用'));

      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      const copyButtons = screen.getAllByLabelText('複製轉換結果');
      fireEvent.click(copyButtons[0]!);

      // 等待異步操作
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('時間格式化', () => {
    it('應該正確顯示相對時間（今天）', () => {
      const now = Date.now();
      const todayRecord: ConversionHistoryEntry = {
        from: 'USD',
        to: 'TWD',
        amount: '1000',
        result: '30900',
        time: '今天 14:30',
        timestamp: now - 2 * 60 * 60 * 1000, // 2 小時前
      };

      render(<ConversionHistory history={[todayRecord]} />);

      expect(screen.getByText(/今天 \d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('應該正確顯示相對時間（昨天）', () => {
      const now = Date.now();
      const yesterdayRecord: ConversionHistoryEntry = {
        from: 'JPY',
        to: 'TWD',
        amount: '10000',
        result: '2087',
        time: '昨天 09:15',
        timestamp: now - 30 * 60 * 60 * 1000, // 30 小時前
      };

      render(<ConversionHistory history={[yesterdayRecord]} />);

      expect(screen.getByText(/昨天 \d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('應該正確顯示絕對時間（2 天以上）', () => {
      const now = Date.now();
      const oldRecord: ConversionHistoryEntry = {
        from: 'EUR',
        to: 'TWD',
        amount: '500',
        result: '18575',
        time: '12/24 16:20',
        timestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 天前
      };

      render(<ConversionHistory history={[oldRecord]} />);

      expect(screen.getByText(/\d{2}\/\d{2} \d{2}:\d{2}/)).toBeInTheDocument();
    });
  });

  // 註: React Key 唯一性無法通過 DOM 測試驗證
  // React 的 key prop 不會出現在 DOM 中，是 React 內部使用的
  // 我們使用 `${index}-${item.timestamp}` 確保唯一性

  describe('React Key 驗證（通過渲染數量確認）', () => {
    it('✅ 應該正確渲染所有歷史記錄項目', () => {
      const mockHistory = createMockHistory();
      const { container } = render(<ConversionHistory history={mockHistory} />);

      // v4.0: 使用 role="group" 標識每個歷史記錄卡片
      const historyItems = container.querySelectorAll('[role="group"]');

      // 應該有 3 個歷史記錄項目
      expect(historyItems.length).toBe(3);
    });

    it('✅ 應該支援同分鐘內的多次轉換（不會有 key 衝突）', () => {
      const now = Date.now();
      const sameMinuteRecords: ConversionHistoryEntry[] = [
        {
          from: 'USD',
          to: 'TWD',
          amount: '1000',
          result: '30900',
          time: '今天 14:30',
          timestamp: now - 60 * 1000, // 1 分鐘前
        },
        {
          from: 'JPY',
          to: 'TWD',
          amount: '10000',
          result: '2087',
          time: '今天 14:30', // 同分鐘
          timestamp: now - 30 * 1000, // 30 秒前
        },
      ];

      const { container } = render(<ConversionHistory history={sameMinuteRecords} />);

      // v4.0: 使用 role="group" 標識每個歷史記錄卡片
      const historyItems = container.querySelectorAll('[role="group"]');

      // 應該有 2 個歷史記錄項目（沒有因為 key 重複被合併）
      expect(historyItems.length).toBe(2);
    });
  });

  describe('UI/UX 設計一致性', () => {
    it('應該使用 ParkKeeper 風格的卡片樣式', () => {
      const mockHistory = createMockHistory();
      const { container } = render(<ConversionHistory history={mockHistory} />);

      // 新 UI 使用 card 類別和 space-y-2 間距
      const historyList = container.querySelector('.space-y-2');
      expect(historyList).toBeInTheDocument();
    });

    it('應該使用專案標準的間距系統', () => {
      const mockHistory = createMockHistory();
      const { container } = render(<ConversionHistory history={mockHistory} />);

      // 新 UI 使用 p-4 內距
      const card = container.querySelector('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('應該使用專案標準的品牌主色（結果金額）', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // 新 UI：結果金額使用 text-primary
      const resultAmount = screen.getByText('30900');
      expect(resultAmount).toHaveClass('text-primary');
    });

    it('應該使用專案標準的動畫過渡', () => {
      const mockHistory = createMockHistory();
      const { container } = render(<ConversionHistory history={mockHistory} />);

      const historyItem = container.querySelector('.transition-all');
      expect(historyItem).toBeInTheDocument();
    });
  });

  describe('無障礙性', () => {
    it('應該有正確的 aria-label（複製按鈕）', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // v4.0：複製按鈕有 aria-label
      const copyButtons = screen.getAllByLabelText('複製轉換結果');
      expect(copyButtons.length).toBe(3);
    });

    it('應該支援鍵盤操作（Enter 鍵複製）', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // v4.0：在卡片（role="group"）上按 Enter 複製
      const firstCard = screen.getByText('1000').closest('[role="group"]');
      fireEvent.keyDown(firstCard!, { key: 'Enter' });

      expect(clipboardMock.writeText).toHaveBeenCalledWith('1000 USD = 30900 TWD');
    });

    it('應該支援鍵盤操作（Shift+Enter 重新轉換）', () => {
      const mockHistory = createMockHistory();
      const onReconvert = vi.fn();

      render(<ConversionHistory history={mockHistory} onReconvert={onReconvert} />);

      // v4.0：在卡片（role="group"）上按 Shift+Enter 重新轉換
      const firstCard = screen.getByText('1000').closest('[role="group"]');
      fireEvent.keyDown(firstCard!, { key: 'Enter', shiftKey: true });

      expect(onReconvert).toHaveBeenCalledWith(mockHistory[0]);
    });

    it('應該支援鍵盤操作（Space 鍵複製）', () => {
      const mockHistory = createMockHistory();
      render(<ConversionHistory history={mockHistory} />);

      // v4.0：在卡片（role="group"）上按 Space 複製
      const firstCard = screen.getByText('1000').closest('[role="group"]');
      fireEvent.keyDown(firstCard!, { key: ' ' });

      expect(clipboardMock.writeText).toHaveBeenCalledWith('1000 USD = 30900 TWD');
    });
  });
});
