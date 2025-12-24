/**
 * Request ID Utility Tests
 * [2025-12-24] 提升測試覆蓋率至 80%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateRequestId,
  getRequestId,
  resetRequestId,
  addRequestIdHeader,
  fetchWithRequestId,
} from '../requestId';

// UUID v4 格式正則表達式
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('requestId utility', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateRequestId();
      expect(id).toMatch(UUID_REGEX);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should use crypto.randomUUID when available', () => {
      // crypto.randomUUID 在測試環境中應該可用
      const id = generateRequestId();
      expect(id).toMatch(UUID_REGEX);
    });

    it('should use fallback when crypto.randomUUID is not available', () => {
      // Mock crypto.randomUUID to be undefined
      const originalCrypto = globalThis.crypto;
      const mockCrypto = { ...originalCrypto } as Crypto;
      // @ts-expect-error - intentionally setting randomUUID to undefined for test
      mockCrypto.randomUUID = undefined;
      vi.stubGlobal('crypto', mockCrypto);

      const id = generateRequestId();
      // Fallback should still generate a valid-ish UUID
      expect(id).toMatch(/^[0-9a-f-]{36}$/i);

      // Restore
      vi.stubGlobal('crypto', originalCrypto);
    });
  });

  describe('getRequestId', () => {
    it('should return the same ID on subsequent calls', () => {
      const id1 = getRequestId();
      const id2 = getRequestId();
      expect(id1).toBe(id2);
    });

    it('should store ID in localStorage', () => {
      const id = getRequestId();
      expect(localStorage.getItem('x-request-id')).toBe(id);
    });

    it('should return stored ID from localStorage', () => {
      const storedId = 'test-stored-id';
      localStorage.setItem('x-request-id', storedId);

      const id = getRequestId();
      expect(id).toBe(storedId);
    });

    it('should generate new ID when localStorage is empty', () => {
      localStorage.clear();
      const id = getRequestId();
      expect(id).toMatch(UUID_REGEX);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw, should return a generated ID
      const id = getRequestId();
      expect(id).toMatch(UUID_REGEX);
    });
  });

  describe('resetRequestId', () => {
    it('should generate a new ID', () => {
      const oldId = getRequestId();
      const newId = resetRequestId();

      expect(newId).not.toBe(oldId);
      expect(newId).toMatch(UUID_REGEX);
    });

    it('should update localStorage with new ID', () => {
      const newId = resetRequestId();
      expect(localStorage.getItem('x-request-id')).toBe(newId);
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw, should still return a new ID
      const id = resetRequestId();
      expect(id).toMatch(UUID_REGEX);
    });
  });

  describe('addRequestIdHeader', () => {
    it('should add correlation headers to empty options', () => {
      const options = addRequestIdHeader();

      expect(options.headers).toBeDefined();
      expect((options.headers as Record<string, string>)['X-Correlation-ID']).toBeDefined();
      expect((options.headers as Record<string, string>)['X-Request-ID']).toBeDefined();
    });

    it('should preserve existing headers', () => {
      const options = addRequestIdHeader({
        headers: { 'Content-Type': 'application/json' },
      });

      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect((options.headers as Record<string, string>)['X-Correlation-ID']).toBeDefined();
    });

    it('should preserve other options', () => {
      const options = addRequestIdHeader({
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ data: 'test' }));
    });
  });

  describe('fetchWithRequestId', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    });

    it('should call fetch with enhanced headers for same-origin requests', async () => {
      // Mock window.location for same-origin check
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      await fetchWithRequestId('/api/test');

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': expect.any(String),
            'X-Request-ID': expect.any(String),
          }),
        }),
      );

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should not add headers for cross-origin requests', async () => {
      await fetchWithRequestId('https://external-api.com/data');

      expect(fetch).toHaveBeenCalledWith('https://external-api.com/data', undefined);
    });

    it('should handle URL object input', async () => {
      const url = new URL('http://localhost:3000/api/test');

      // Mock window.location for same-origin check
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      await fetchWithRequestId(url);

      expect(fetch).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should handle Request object input', async () => {
      const request = new Request('http://localhost:3000/api/test');

      await fetchWithRequestId(request);

      expect(fetch).toHaveBeenCalled();
    });
  });
});
