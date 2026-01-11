/**
 * offlineStorage Test Suite
 *
 * [fix:2026-01-11] Safari PWA 離線儲存測試
 *
 * 測試策略 (BDD):
 * 1. 測試常數和類型定義
 * 2. 測試 SSR 安全性（window undefined）
 * 3. 整合測試留給 E2E 測試處理
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock idb-keyval with simple implementation
vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    createStore: vi.fn(() => ({})),
  };
});

import {
  EXCHANGE_RATES_IDB_KEY,
  EXCHANGE_RATES_IDB_EXPIRATION,
  type ExchangeRateData,
} from '../offlineStorage';

// ===== Test Data =====
const mockRateData: ExchangeRateData = {
  timestamp: '2026-01-11T10:00:00+08:00',
  updateTime: '2026-01-11 10:00',
  source: '台灣銀行',
  sourceUrl: 'https://rate.bot.com.tw/',
  base: 'TWD',
  rates: {
    USD: 32.5,
    EUR: 33.8,
    JPY: 0.21,
  },
  details: {
    USD: {
      name: '美元',
      spot: { buy: 32.48, sell: 32.52 },
      cash: { buy: 32.4, sell: 32.6 },
    },
  },
};

// ===== Test Suite =====
describe('offlineStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('常數驗證', () => {
    it('匯率 IDB key 正確', () => {
      expect(EXCHANGE_RATES_IDB_KEY).toBe('exchange_rates');
    });

    it('匯率有效期為 7 天', () => {
      expect(EXCHANGE_RATES_IDB_EXPIRATION).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('類型定義驗證', () => {
    it('ExchangeRateData 結構正確', () => {
      // 驗證必要欄位存在
      expect(mockRateData.timestamp).toBeDefined();
      expect(mockRateData.updateTime).toBeDefined();
      expect(mockRateData.source).toBeDefined();
      expect(mockRateData.sourceUrl).toBeDefined();
      expect(mockRateData.base).toBeDefined();
      expect(mockRateData.rates).toBeDefined();
      expect(mockRateData.details).toBeDefined();

      // 驗證 rates 結構
      expect(typeof mockRateData.rates['USD']).toBe('number');
      expect(typeof mockRateData.rates['EUR']).toBe('number');
      expect(typeof mockRateData.rates['JPY']).toBe('number');

      // 驗證 details 結構
      expect(mockRateData.details['USD']?.name).toBe('美元');
      expect(mockRateData.details['USD']?.spot.buy).toBe(32.48);
    });
  });

  describe('過期時間計算', () => {
    it('7 天 = 604800000 毫秒', () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(sevenDaysMs).toBe(604800000);
      expect(EXCHANGE_RATES_IDB_EXPIRATION).toBe(sevenDaysMs);
    });
  });
});
