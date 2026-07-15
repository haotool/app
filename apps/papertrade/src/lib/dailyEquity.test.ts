import { beforeEach, describe, expect, it } from 'vitest';
import { DAILY_EQUITY_STORAGE_KEY, localDateKey, resolveDailyEquityBaseline } from './dailyEquity';

const NOW = new Date(2026, 6, 15, 10, 30);

describe('localDateKey', () => {
  it('formats the local calendar date', () => {
    expect(localDateKey(NOW)).toBe('2026-07-15');
    expect(localDateKey(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('resolveDailyEquityBaseline', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DAILY_EQUITY_STORAGE_KEY);
  });

  it('creates a baseline from the current equity when none exists', () => {
    expect(resolveDailyEquityBaseline(window.localStorage, NOW, 10000)).toBe(10000);
    expect(JSON.parse(window.localStorage.getItem(DAILY_EQUITY_STORAGE_KEY) ?? '')).toEqual({
      date: '2026-07-15',
      equity: 10000,
    });
  });

  it('returns the stored baseline for the same local day without overwriting', () => {
    window.localStorage.setItem(
      DAILY_EQUITY_STORAGE_KEY,
      JSON.stringify({ date: '2026-07-15', equity: 9800 }),
    );
    expect(resolveDailyEquityBaseline(window.localStorage, NOW, 10100)).toBe(9800);
    expect(JSON.parse(window.localStorage.getItem(DAILY_EQUITY_STORAGE_KEY) ?? '')).toEqual({
      date: '2026-07-15',
      equity: 9800,
    });
  });

  it('rolls the baseline over on a new local day', () => {
    window.localStorage.setItem(
      DAILY_EQUITY_STORAGE_KEY,
      JSON.stringify({ date: '2026-07-14', equity: 9800 }),
    );
    expect(resolveDailyEquityBaseline(window.localStorage, NOW, 10100)).toBe(10100);
    expect(JSON.parse(window.localStorage.getItem(DAILY_EQUITY_STORAGE_KEY) ?? '')).toEqual({
      date: '2026-07-15',
      equity: 10100,
    });
  });

  it('rebuilds the baseline when the stored payload is corrupted', () => {
    window.localStorage.setItem(DAILY_EQUITY_STORAGE_KEY, '{not json');
    expect(resolveDailyEquityBaseline(window.localStorage, NOW, 10050)).toBe(10050);

    window.localStorage.setItem(DAILY_EQUITY_STORAGE_KEY, JSON.stringify({ date: 42 }));
    expect(resolveDailyEquityBaseline(window.localStorage, NOW, 10060)).toBe(10060);
  });
});
