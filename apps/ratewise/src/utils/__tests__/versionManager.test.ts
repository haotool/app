/**
 * versionManager Test Suite
 *
 * 測試策略 (Linus Style):
 * 1. Mock browser APIs (localStorage, sessionStorage, caches)
 * 2. 測試邊界情況 (首次運行、SSR、錯誤處理)
 * 3. 驗證副作用 (cache clearance, logging)
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCurrentVersion,
  getPreviousVersion,
  saveCurrentVersion,
  hasVersionChanged,
  clearAppCache,
  recordVersionUpdate,
  handleVersionUpdate,
  getVersionHistory,
} from '../versionManager';
import * as logger from '../logger';

// ===== Mock Setup =====
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    // ✅ Helper to manually clear store in tests
    _resetStore: () => {
      store = {};
    },
  };
})();

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const mockCaches = {
  keys: vi.fn(() => Promise.resolve(['cache-v1', 'cache-v2'])),
  delete: vi.fn(() => Promise.resolve(true)),
};

// ===== Global Mocks =====
vi.stubGlobal('localStorage', mockLocalStorage);
vi.stubGlobal('sessionStorage', mockSessionStorage);
vi.stubGlobal('caches', mockCaches);

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// ===== Test Suite =====
describe('versionManager', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage._resetStore();
    mockSessionStorage.clear();
  });

  describe('getCurrentVersion', () => {
    it('返回環境變數中的版本號', () => {
      // ✅ Mock import.meta.env
      vi.stubEnv('VITE_APP_VERSION', '2.0.0');

      const version = getCurrentVersion();

      expect(version).toBe('2.0.0');
    });

    it('當環境變數不存在時返回預設版本 1.0.0', () => {
      vi.stubEnv('VITE_APP_VERSION', undefined);

      const version = getCurrentVersion();

      expect(version).toBe('1.0.0');
    });
  });

  describe('getPreviousVersion', () => {
    it('從 localStorage 讀取上次版本號', () => {
      mockLocalStorage.setItem('app_version', '1.5.0');

      const version = getPreviousVersion();

      expect(version).toBe('1.5.0');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('app_version');
    });

    it('首次運行時返回 null', () => {
      const version = getPreviousVersion();

      expect(version).toBeNull();
    });

    it('SSR 環境返回 null', () => {
      // ✅ Simulate SSR by stubbing window
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      const version = getPreviousVersion();

      expect(version).toBeNull();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('saveCurrentVersion', () => {
    it('儲存當前版本號到 localStorage', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.1.0');

      saveCurrentVersion();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app_version', '2.1.0');
      expect(logger.logger.info).toHaveBeenCalledWith('Version saved', { version: '2.1.0' });
    });

    it('SSR 環境不執行任何操作', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      saveCurrentVersion();

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('hasVersionChanged', () => {
    it('首次運行返回 false', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.0.0');

      const changed = hasVersionChanged();

      expect(changed).toBe(false);
    });

    it('版本相同返回 false', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.0.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      const changed = hasVersionChanged();

      expect(changed).toBe(false);
    });

    it('版本不同返回 true', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.1.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      const changed = hasVersionChanged();

      expect(changed).toBe(true);
    });
  });

  describe('clearAppCache', () => {
    it('清除 localStorage 中的快取 keys', async () => {
      // ✅ Setup: 預先設置一些快取數據
      mockLocalStorage.setItem('exchangeRates', '{"USD":30.5}');

      await clearAppCache();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('exchangeRates');
      expect(logger.logger.info).toHaveBeenCalledWith('Starting cache clearance', {
        reason: 'version_update',
      });
    });

    it('清除所有 Service Worker caches', async () => {
      await clearAppCache();

      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v2');
      expect(logger.logger.info).toHaveBeenCalledWith('All Service Worker caches cleared');
    });

    it('清除 sessionStorage', async () => {
      await clearAppCache();

      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it('錯誤處理: localStorage 清除失敗', async () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      await clearAppCache();

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Failed to clear localStorage cache',
        expect.any(Error),
      );
    });

    it('錯誤處理: caches API 失敗', async () => {
      mockCaches.keys.mockRejectedValueOnce(new Error('Cache API error'));

      await clearAppCache();

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Failed to clear Service Worker caches',
        expect.any(Error),
      );
    });
  });

  describe('recordVersionUpdate', () => {
    it('記錄版本更新歷史', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.1.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      recordVersionUpdate();

      const historyJson = mockLocalStorage.store['version_history']!;
      const history = JSON.parse(historyJson);

      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('2.1.0');
      expect(history[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('只保留最近 10 筆記錄', () => {
      vi.stubEnv('VITE_APP_VERSION', '3.0.0');
      mockLocalStorage.setItem('app_version', '2.9.0');

      // ✅ Setup: 預先設置 10 筆歷史記錄
      const oldHistory = Array.from({ length: 10 }, (_, i) => ({
        version: `2.${i}.0`,
        timestamp: new Date().toISOString(),
      }));
      mockLocalStorage.setItem('version_history', JSON.stringify(oldHistory));

      recordVersionUpdate();

      const historyJson = mockLocalStorage.store['version_history']!;
      const history = JSON.parse(historyJson);

      expect(history).toHaveLength(10); // 最多 10 筆
      expect(history[9].version).toBe('3.0.0'); // 最新版本在最後
    });

    it('版本未變更時不記錄', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.0.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      recordVersionUpdate();

      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'version_history',
        expect.any(String),
      );
    });

    it('錯誤處理: JSON 解析失敗', () => {
      vi.stubEnv('VITE_APP_VERSION', '2.1.0');
      mockLocalStorage.setItem('app_version', '2.0.0');
      mockLocalStorage.setItem('version_history', 'invalid json');

      recordVersionUpdate();

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Failed to record version update',
        expect.any(Error),
      );
    });
  });

  describe('handleVersionUpdate', () => {
    it('無版本更新時只儲存當前版本', async () => {
      vi.stubEnv('VITE_APP_VERSION', '2.0.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      await handleVersionUpdate();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app_version', '2.0.0');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled(); // 沒有清除快取
    });

    it('有版本更新時執行完整流程', async () => {
      vi.stubEnv('VITE_APP_VERSION', '2.1.0');
      mockLocalStorage.setItem('app_version', '2.0.0');

      await handleVersionUpdate();

      // ✅ 驗證執行順序
      expect(logger.logger.info).toHaveBeenCalledWith('Version update detected', {
        from: '2.0.0',
        to: '2.1.0',
      });

      // ✅ 清除快取被調用
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();

      // ✅ 記錄歷史被調用
      expect(mockLocalStorage.store['version_history']).toBeDefined();

      // ✅ 儲存新版本
      expect(mockLocalStorage.store['app_version']).toBe('2.1.0');

      expect(logger.logger.info).toHaveBeenCalledWith('Version update completed', {
        version: '2.1.0',
      });
    });
  });

  describe('getVersionHistory', () => {
    it('返回版本更新歷史', () => {
      const mockHistory = [
        { version: '1.0.0', timestamp: '2025-01-01T00:00:00.000Z' },
        { version: '2.0.0', timestamp: '2025-02-01T00:00:00.000Z' },
      ];
      mockLocalStorage.setItem('version_history', JSON.stringify(mockHistory));

      const history = getVersionHistory();

      expect(history).toEqual(mockHistory);
    });

    it('無歷史記錄時返回空陣列', () => {
      const history = getVersionHistory();

      expect(history).toEqual([]);
    });

    it('JSON 解析失敗時返回空陣列', () => {
      mockLocalStorage.setItem('version_history', 'invalid json');

      const history = getVersionHistory();

      expect(history).toEqual([]);
    });

    it('SSR 環境返回空陣列', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      const history = getVersionHistory();

      expect(history).toEqual([]);

      global.window = originalWindow;
    });
  });
});
