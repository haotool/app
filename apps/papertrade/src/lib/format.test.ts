import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatClockTime,
  formatCompact,
  formatCountdown,
  formatFundingRate,
  formatPrice,
  formatSignedPercent,
  formatSignedPnl,
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

describe('formatSignedPnl', () => {
  it('treats magnitudes below the display half-step as unsigned zero', () => {
    // QA 重現：微幅虧損平倉 toast 顯示「−0 USDT」，半格以下一律顯示 0.00 不帶負號。
    expect(formatSignedPnl(-0.0049)).toBe('0.00');
    expect(formatSignedPnl(0.0049)).toBe('0.00');
    expect(formatSignedPnl(0)).toBe('0.00');
  });

  it('keeps the sign at and above the display half-step', () => {
    expect(formatSignedPnl(-0.005)).toBe('−0.01');
    expect(formatSignedPnl(-12.34)).toBe('−12.34');
    expect(formatSignedPnl(100)).toBe('+100');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatSignedPnl(Number.NaN)).toBe('--');
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

describe('formatFundingRate', () => {
  it('formats positive rates with plus sign and four decimals', () => {
    expect(formatFundingRate(0.0001)).toBe('+0.0100%');
  });

  it('keeps minus sign for negative rates', () => {
    expect(formatFundingRate(-0.005)).toBe('-0.5000%');
  });

  it('formats zero without sign', () => {
    expect(formatFundingRate(0)).toBe('0.0000%');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatFundingRate(Number.NaN)).toBe('--');
  });
});

describe('formatCountdown', () => {
  it('formats under an hour as mm:ss', () => {
    expect(formatCountdown(65_000)).toBe('01:05');
  });

  it('formats an hour and above as h:mm:ss', () => {
    expect(formatCountdown(3_600_000)).toBe('1:00:00');
    expect(formatCountdown(7 * 3_600_000 + 59 * 60_000 + 59_000)).toBe('7:59:59');
  });

  it('rolls from h:mm:ss down to mm:ss at the hour boundary', () => {
    expect(formatCountdown(3_599_000)).toBe('59:59');
  });

  it('clamps to 00:00 after crossing the settlement moment', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-15_000)).toBe('00:00');
  });

  it('returns placeholder for non-finite values', () => {
    expect(formatCountdown(Number.NaN)).toBe('--:--');
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
