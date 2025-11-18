/**
 * Haptics Utility Tests
 * @file haptics.test.ts
 * @description 觸覺回饋功能測試（Mock vibrate API）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lightHaptic, mediumHaptic, isHapticSupported } from '../haptics';

// Type definition for Navigator with vibrate (avoiding conflict with DOM Navigator)
interface MockNavigator {
  vibrate?: (pattern: number | number[]) => boolean;
}

describe('haptics', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('isHapticSupported', () => {
    it('應返回 true 當 navigator.vibrate 存在', () => {
      (global.navigator as unknown as MockNavigator).vibrate = vi.fn();
      expect(isHapticSupported()).toBe(true);
    });

    it('應返回 false 當 navigator.vibrate 不存在', () => {
      delete (global.navigator as unknown as MockNavigator).vibrate;
      expect(isHapticSupported()).toBe(false);
    });
  });

  describe('lightHaptic', () => {
    it('應呼叫 navigator.vibrate(10) 當支援時', () => {
      const vibrateMock = vi.fn();
      (global.navigator as unknown as MockNavigator).vibrate = vibrateMock;

      lightHaptic();

      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('應不拋出錯誤當不支援時', () => {
      delete (global.navigator as unknown as MockNavigator).vibrate;

      expect(() => lightHaptic()).not.toThrow();
    });
  });

  describe('mediumHaptic', () => {
    it('應呼叫 navigator.vibrate(20) 當支援時', () => {
      const vibrateMock = vi.fn();
      (global.navigator as unknown as MockNavigator).vibrate = vibrateMock;

      mediumHaptic();

      expect(vibrateMock).toHaveBeenCalledWith(20);
    });

    it('應不拋出錯誤當不支援時', () => {
      delete (global.navigator as unknown as MockNavigator).vibrate;

      expect(() => mediumHaptic()).not.toThrow();
    });
  });
});
