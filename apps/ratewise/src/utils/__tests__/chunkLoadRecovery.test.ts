/**
 * chunkLoadRecovery 測試
 *
 * 重點：
 * - 判斷 chunk 載入錯誤訊息
 * - 刷新冷卻時間控制
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHUNK_REFRESH_COOLDOWN_MS,
  CHUNK_REFRESH_KEY,
  canSafelyRefresh,
  isChunkLoadError,
  markChunkRefreshed,
  recoverFromChunkLoadError,
} from '../chunkLoadRecovery';

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const performFullRefresh = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('../swUtils', () => ({
  performFullRefresh,
}));

describe('chunkLoadRecovery', () => {
  describe('isChunkLoadError', () => {
    it.each([
      'Loading chunk 123 failed',
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
      'Failed to load module script',
      'Load failed',
      'Unexpected token <',
      'SyntaxError: Unexpected token < in JSON',
    ])('should detect chunk load errors: %s', (message) => {
      expect(isChunkLoadError(new Error(message))).toBe(true);
    });

    it('should return false for non chunk errors', () => {
      expect(isChunkLoadError(new Error('Network request failed'))).toBe(false);
    });

    it('should return false for non Error input', () => {
      expect(isChunkLoadError('oops')).toBe(false);
    });
  });

  describe('refresh guard', () => {
    beforeEach(() => {
      sessionStorage.clear();
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow refresh when no record exists', () => {
      expect(canSafelyRefresh()).toBe(true);
    });

    it('should block refresh within cooldown window', () => {
      markChunkRefreshed();
      expect(canSafelyRefresh()).toBe(false);
    });

    it('should allow refresh after cooldown window', () => {
      const oldTimestamp = Date.now() - CHUNK_REFRESH_COOLDOWN_MS - 1;
      sessionStorage.setItem(CHUNK_REFRESH_KEY, oldTimestamp.toString());
      expect(canSafelyRefresh()).toBe(true);
    });
  });

  describe('recoverFromChunkLoadError', () => {
    beforeEach(() => {
      performFullRefresh.mockClear();
    });

    it('should trigger full refresh when safe', async () => {
      const result = await recoverFromChunkLoadError();

      expect(result).toBe(true);
      expect(performFullRefresh).toHaveBeenCalledTimes(1);
    });

    it('should block refresh when cooldown active', async () => {
      markChunkRefreshed();

      const result = await recoverFromChunkLoadError();

      expect(result).toBe(false);
      expect(performFullRefresh).not.toHaveBeenCalled();
    });
  });
});
