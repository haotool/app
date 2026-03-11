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

describe('chunkLoadRecovery', () => {
  describe('isChunkLoadError', () => {
    it.each([
      'Loading chunk 123 failed',
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
      'Failed to load module script',
      'Unexpected token <',
      'SyntaxError: Unexpected token < in JSON',
    ])('should detect chunk load errors: %s', (message) => {
      expect(isChunkLoadError(new Error(message))).toBe(true);
    });

    it.each([
      'Network request failed',
      'Load failed', // Safari generic fetch TypeError — not chunk-specific
      'AbortError: The operation was aborted',
    ])('should return false for non chunk errors: %s', (message) => {
      expect(isChunkLoadError(new Error(message))).toBe(false);
    });

    it('should return false for non Error input', () => {
      expect(isChunkLoadError('oops')).toBe(false);
    });

    it('should detect Safari TypeError("Load failed")', () => {
      const err = new TypeError('Load failed');
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('should detect Chrome SW Response.error() TypeError', () => {
      const err = new TypeError('response served by service worker is an error');
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('should not detect generic Error("Load failed") as chunk error', () => {
      const err = new Error('Load failed');
      expect(isChunkLoadError(err)).toBe(false);
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
    let reloadMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sessionStorage.clear();
      reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { reload: reloadMock },
      });
    });

    it('should reload page when safe (preserves precache)', () => {
      const result = recoverFromChunkLoadError();

      expect(result).toBe(true);
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('should block reload when cooldown active', () => {
      markChunkRefreshed();

      const result = recoverFromChunkLoadError();

      expect(result).toBe(false);
      expect(reloadMock).not.toHaveBeenCalled();
    });
  });
});
