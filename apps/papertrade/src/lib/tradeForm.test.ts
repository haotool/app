import { describe, expect, it } from 'vitest';
import {
  amountToPercent,
  isLimitPriceWithinBand,
  maxOpenNotional,
  parseOrderForm,
  trimNumberInput,
} from './tradeForm';
import { TAKER_FEE_RATE } from '../config/trading';

describe('trimNumberInput', () => {
  it('truncates instead of rounding so filled amounts never exceed the source value', () => {
    // 初始帳戶 10000 USDT、10x、taker：maxN ≈ 99453.0084，四捨五入會進位成 99453.01 導致拒單。
    expect(trimNumberInput(99453.0084, 2)).toBe('99453');
    expect(trimNumberInput(99453.0084, 6)).toBe('99453.0084');
    expect(trimNumberInput(1.239, 2)).toBe('1.23');
    expect(trimNumberInput(1.999999, 2)).toBe('1.99');
  });

  it('keeps exactly representable values intact (no floating floor drift)', () => {
    expect(trimNumberInput(0.29, 2)).toBe('0.29');
    expect(trimNumberInput(1.005, 2)).toBe('1');
    expect(trimNumberInput(60000, 6)).toBe('60000');
    expect(trimNumberInput(0.1, 6)).toBe('0.1');
  });

  it('drops trailing zeros after truncation', () => {
    expect(trimNumberInput(1.2, 2)).toBe('1.2');
    expect(trimNumberInput(5, 2)).toBe('5');
  });
});

describe('maxOpenNotional + trimNumberInput integration', () => {
  it('100% preset amount always passes the engine cost check', () => {
    // 對多組 balance/leverage 驗證截斷後的 notional 成本不超過可用餘額。
    const balances = [10000, 9999.99, 1234.5678, 347.19];
    const leverages = [1, 5, 10, 25, 50, 125];
    for (const balance of balances) {
      for (const leverage of leverages) {
        const notional = Number(
          trimNumberInput(maxOpenNotional(balance, leverage, TAKER_FEE_RATE), 2),
        );
        const margin = Math.round((notional / leverage) * 1e8) / 1e8;
        const fee = Math.round(notional * TAKER_FEE_RATE * 1e8) / 1e8;
        expect(margin + fee).toBeLessThanOrEqual(balance);
      }
    }
  });
});

describe('amountToPercent', () => {
  it('maps a usdt amount to its share of max notional, rounded', () => {
    expect(amountToPercent(5000, 'usdt', 60000, 10000)).toBe(50);
    expect(amountToPercent(3333, 'usdt', null, 10000)).toBe(33);
  });

  it('converts base amounts through the price', () => {
    expect(amountToPercent(0.05, 'base', 60000, 10000)).toBe(30);
  });

  it('clamps to the 0-100 range', () => {
    expect(amountToPercent(25000, 'usdt', 60000, 10000)).toBe(100);
    expect(amountToPercent(0.0001, 'usdt', 60000, 10000)).toBe(0);
  });

  it('returns 0 without amount, price for base unit, or positive max notional', () => {
    expect(amountToPercent(null, 'usdt', 60000, 10000)).toBe(0);
    expect(amountToPercent(1, 'base', null, 10000)).toBe(0);
    expect(amountToPercent(5000, 'usdt', 60000, 0)).toBe(0);
  });

  it('round-trips the 100% fill back to 100', () => {
    const maxNotional = maxOpenNotional(10000, 10, TAKER_FEE_RATE);
    const filled = Number(trimNumberInput(maxNotional, 2));
    expect(amountToPercent(filled, 'usdt', 60000, maxNotional)).toBe(100);
  });
});

describe('isLimitPriceWithinBand', () => {
  it('accepts prices at the ±50% band boundaries inclusively', () => {
    expect(isLimitPriceWithinBand(30000, 60000)).toBe(true);
    expect(isLimitPriceWithinBand(90000, 60000)).toBe(true);
    expect(isLimitPriceWithinBand(60000, 60000)).toBe(true);
  });

  it('rejects prices outside the band on both sides', () => {
    expect(isLimitPriceWithinBand(29999.99, 60000)).toBe(false);
    expect(isLimitPriceWithinBand(90000.01, 60000)).toBe(false);
    // QA 重現：限價 0.0001 可下出數億顆的荒謬委託，必須被帶寬擋下。
    expect(isLimitPriceWithinBand(0.0001, 60000)).toBe(false);
  });
});

describe('parseOrderForm', () => {
  it('parses a usdt amount into qty at the given price', () => {
    const parsed = parseOrderForm({ amount: '6000', unit: 'usdt', price: 60000, leverage: 10 });
    expect(parsed).toEqual({ ok: true, qty: 0.1, price: 60000 });
  });

  it('rejects notional below the minimum', () => {
    const parsed = parseOrderForm({ amount: '1', unit: 'usdt', price: 60000, leverage: 10 });
    expect(parsed.ok).toBe(false);
  });
});
