import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRatingPrompt } from '../useRatingPrompt';

const KEYS = {
  useDays: 'ratewise_use_days',
  rated: 'ratewise_rated',
  dismissed: 'ratewise_rating_dismissed',
  dismissedAt: 'ratewise_dismissed_at',
  snoozedCount: 'ratewise_snooze_count',
};

function setUseDays(days: string[]) {
  localStorage.setItem(KEYS.useDays, JSON.stringify(days));
}

function getUseDays(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.useDays) ?? '[]');
  } catch {
    return [];
  }
}

function advanceTimerAndFlush(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function pastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('useRatingPrompt', () => {
  describe('初始狀態', () => {
    it('預設 isVisible 為 false', () => {
      const { result } = renderHook(() => useRatingPrompt());
      expect(result.current.isVisible).toBe(false);
    });

    it('預設 isFinalChance 為 false', () => {
      const { result } = renderHook(() => useRatingPrompt());
      expect(result.current.isFinalChance).toBe(false);
    });

    it('使用日不足時 3 秒後仍不顯示', () => {
      setUseDays(pastDays(5));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(false);
    });

    it('使用日達 7 天且無紀錄時，3 秒後顯示', () => {
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('已評分', () => {
    it('已評分時不顯示', () => {
      localStorage.setItem(KEYS.rated, '1');
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('已永久關閉', () => {
    it('永久關閉後不顯示', () => {
      localStorage.setItem(KEYS.dismissed, '1');
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('markRated', () => {
    it('呼叫 markRated 後 isVisible 變 false 且寫入 localStorage', () => {
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.markRated();
      });

      expect(result.current.isVisible).toBe(false);
      expect(localStorage.getItem(KEYS.rated)).toBe('1');
    });
  });

  describe('snooze', () => {
    it('呼叫 snooze 後 isVisible 變 false 且寫入 dismissedAt', () => {
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.snooze();
      });

      expect(result.current.isVisible).toBe(false);
      expect(localStorage.getItem(KEYS.dismissedAt)).not.toBeNull();
    });

    it('snooze 後 7 天內不再顯示', () => {
      setUseDays(pastDays(6));
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(KEYS.dismissedAt, sixDaysAgo);

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(false);
    });

    it('snooze 後超過 7 天會再次顯示', () => {
      setUseDays(pastDays(6));
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(KEYS.dismissedAt, eightDaysAgo);

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);
    });

    it('snooze 達上限後永久關閉且不再顯示', () => {
      setUseDays(pastDays(6));
      localStorage.setItem(KEYS.snoozedCount, '1');
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(KEYS.dismissedAt, eightDaysAgo);

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      act(() => {
        result.current.snooze();
      });

      expect(result.current.isVisible).toBe(false);
      expect(localStorage.getItem(KEYS.dismissed)).toBe('1');
    });

    it('snoozedCount 達上限時不再顯示', () => {
      setUseDays(pastDays(6));
      localStorage.setItem(KEYS.snoozedCount, '2');

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('isFinalChance', () => {
    it('snoozedCount 為 0 時 isFinalChance 為 false', () => {
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isFinalChance).toBe(false);
    });

    it('snoozedCount 為 MAX_SNOOZES - 1 時 isFinalChance 為 true', () => {
      setUseDays(pastDays(6));
      localStorage.setItem(KEYS.snoozedCount, '1');
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(KEYS.dismissedAt, eightDaysAgo);

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);
      expect(result.current.isFinalChance).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('呼叫 dismiss 後永久關閉', () => {
      setUseDays(pastDays(6));

      const { result } = renderHook(() => useRatingPrompt());
      advanceTimerAndFlush(3000);

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isVisible).toBe(false);
      expect(localStorage.getItem(KEYS.dismissed)).toBe('1');
    });
  });

  describe('使用日記錄', () => {
    it('每天首次 mount 會記錄今日', () => {
      const today = new Date().toISOString().slice(0, 10);
      setUseDays(['2026-01-01']);

      renderHook(() => useRatingPrompt());

      const days = getUseDays();
      expect(days).toContain(today);
    });

    it('同一天多次 mount 不重複記錄', () => {
      const today = new Date().toISOString().slice(0, 10);
      setUseDays([today]);

      renderHook(() => useRatingPrompt());
      renderHook(() => useRatingPrompt());

      const days = getUseDays();
      expect(days.filter((d) => d === today)).toHaveLength(1);
    });
  });
});
