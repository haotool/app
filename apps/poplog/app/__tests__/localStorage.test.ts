import { describe, it, expect, beforeEach, vi } from 'vitest';

// 模擬 localStorage 工具函數
const readJSON = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 靜默失敗
  }
};

describe('localStorage 工具函數', () => {
  beforeEach(() => {
    // 清空 localStorage mock
    vi.clearAllMocks();
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockClear();
    (global.localStorage.setItem as ReturnType<typeof vi.fn>).mockClear();
  });

  describe('readJSON', () => {
    it('應該在 localStorage 有值時正確讀取 JSON', () => {
      const testData = { id: '1', type: 2, time: '2025-11-01T10:00:00.000Z' };
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([testData]),
      );

      const result = readJSON('test-key', []);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual([testData]);
    });

    it('應該在 localStorage 為空時返回 fallback', () => {
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = readJSON('empty-key', []);

      expect(result).toEqual([]);
    });

    it('應該在 JSON 解析失敗時返回 fallback', () => {
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-json');

      const result = readJSON('invalid-key', { default: true });

      expect(result).toEqual({ default: true });
    });
  });

  describe('writeJSON', () => {
    it('應該正確寫入 JSON 到 localStorage', () => {
      const testData = [{ id: '1', type: 2 }];

      writeJSON('test-key', testData);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
      );
    });

    it('應該在序列化失敗時靜默失敗', () => {
      const circularData = {} as Record<string, unknown>;
      circularData.self = circularData;

      expect(() => writeJSON('circular-key', circularData)).not.toThrow();
    });
  });
});
