import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatClockTime,
  formatCompact,
  formatPrice,
  formatSignedPercent,
} from './format';

describe('formatPrice', () => {
  it('uses one decimal for large prices', () => {
    expect(formatPrice(64486.1)).toBe('64,486.1');
  });

  it('uses two decimals for hundreds', () => {
    expect(formatPrice(148.35)).toBe('148.35');
  });

  it('uses three decimals for single digits', () => {
    expect(formatPrice(2.4153)).toBe('2.415');
  });

  it('uses five decimals for sub-dollar prices', () => {
    expect(formatPrice(0.12345)).toBe('0.12345');
  });

  it('uses six decimals for tiny prices', () => {
    expect(formatPrice(0.001234)).toBe('0.001234');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatPrice(Number.NaN)).toBe('--');
  });
});

describe('formatSignedPercent', () => {
  it('adds plus sign for positive ratios', () => {
    expect(formatSignedPercent(0.038264)).toBe('+3.83%');
  });

  it('keeps minus sign for negative ratios', () => {
    expect(formatSignedPercent(-0.0212)).toBe('-2.12%');
  });

  it('formats zero without sign', () => {
    expect(formatSignedPercent(0)).toBe('0.00%');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatSignedPercent(Number.POSITIVE_INFINITY)).toBe('--');
  });
});

describe('formatCompact', () => {
  it('compacts billions', () => {
    expect(formatCompact(5122660654)).toBe('5.12B');
  });

  it('compacts thousands', () => {
    expect(formatCompact(80648.719)).toBe('80.65K');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatCompact(Number.NaN)).toBe('--');
  });
});

describe('formatAmount', () => {
  it('limits decimals to given precision', () => {
    expect(formatAmount(13.8774, 3)).toBe('13.877');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatAmount(Number.NaN)).toBe('--');
  });
});

describe('formatClockTime', () => {
  it('formats epoch milliseconds as HH:mm:ss', () => {
    expect(formatClockTime(Date.UTC(2026, 0, 1, 0, 0, 0))).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatClockTime(Number.NaN)).toBe('--');
  });
});
