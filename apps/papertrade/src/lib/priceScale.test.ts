import { afterEach, describe, expect, it } from 'vitest';
import {
  priceFormatFor,
  pricePrecisionFor,
  resetLiveTickSizes,
  setLiveTickSize,
  tickSizeFor,
} from './priceScale';
import { PPR_TICK_SIZE } from '../features/ppr/config';

afterEach(() => {
  resetLiveTickSizes();
});

describe('tickSizeFor', () => {
  it('falls back to the static table before any live value arrives', () => {
    expect(tickSizeFor('BTCUSDT')).toBe(0.1);
    expect(tickSizeFor('DOGEUSDT')).toBe(0.00001);
  });

  it('prefers the live tick size over the static fallback', () => {
    setLiveTickSize('BTCUSDT', 0.5);
    expect(tickSizeFor('BTCUSDT')).toBe(0.5);
  });

  it('ignores non-finite or non-positive live values', () => {
    setLiveTickSize('BTCUSDT', 0);
    setLiveTickSize('BTCUSDT', -1);
    setLiveTickSize('BTCUSDT', Number.NaN);
    expect(tickSizeFor('BTCUSDT')).toBe(0.1);
  });

  it('always serves the local declaration for the ppr symbol', () => {
    expect(tickSizeFor('PPRUSDT')).toBe(PPR_TICK_SIZE);
    setLiveTickSize('PPRUSDT', 0.01);
    expect(tickSizeFor('PPRUSDT')).toBe(PPR_TICK_SIZE);
  });
});

describe('pricePrecisionFor', () => {
  it('derives decimals from power-of-ten tick sizes', () => {
    const cases: [number, number][] = [
      [0.1, 1],
      [0.01, 2],
      [0.001, 3],
      [0.0001, 4],
      [0.00001, 5],
    ];
    for (const [tick, decimals] of cases) {
      setLiveTickSize('BTCUSDT', tick);
      expect(pricePrecisionFor('BTCUSDT')).toBe(decimals);
    }
  });

  it('rounds up for non-power-of-ten tick sizes', () => {
    setLiveTickSize('BTCUSDT', 0.5);
    expect(pricePrecisionFor('BTCUSDT')).toBe(1);
    setLiveTickSize('BTCUSDT', 0.05);
    expect(pricePrecisionFor('BTCUSDT')).toBe(2);
  });

  it('clamps integer tick sizes to zero decimals', () => {
    setLiveTickSize('BTCUSDT', 1);
    expect(pricePrecisionFor('BTCUSDT')).toBe(0);
    setLiveTickSize('BTCUSDT', 10);
    expect(pricePrecisionFor('BTCUSDT')).toBe(0);
  });

  it('serves 5 decimals for the ppr symbol', () => {
    expect(pricePrecisionFor('PPRUSDT')).toBe(5);
  });
});

describe('priceFormatFor', () => {
  it('builds the lightweight-charts price format from the tick size', () => {
    expect(priceFormatFor('BTCUSDT')).toEqual({ type: 'price', precision: 1, minMove: 0.1 });
    expect(priceFormatFor('PPRUSDT')).toEqual({
      type: 'price',
      precision: 5,
      minMove: PPR_TICK_SIZE,
    });
  });
});
