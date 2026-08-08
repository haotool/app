import { describe, it, expect } from 'vitest';
import {
  computeRoundTripCost,
  computeRoundTripLossTwd,
  classifyRoundTripSeverity,
  deriveCashBuy,
  ROUND_TRIP_SEVERITY_THRESHOLDS,
} from '../roundTripCost';
import { SEO_RATE_EXAMPLES } from '../../config/generated/seo-rate-examples';

describe('computeRoundTripCost', () => {
  it('以 (sell - buy) / sell 計算損失率', () => {
    // 取 USD 量級的合成值：賣出 32.56、買入 31.89，價差 0.67
    const cost = computeRoundTripCost(32.56, 31.89);
    expect(cost).not.toBeNull();
    expect(cost!.lossPct).toBe(2.06);
    expect(cost!.spread).toBeCloseTo(0.67, 6);
  });

  it('損失率與換匯金額無關（僅由價差決定）', () => {
    const a = computeRoundTripCost(100, 90);
    const b = computeRoundTripCost(0.001, 0.0009);
    expect(a!.lossPct).toBe(b!.lossPct);
  });

  it('缺任一報價時回傳 null', () => {
    expect(computeRoundTripCost(32.65, null)).toBeNull();
    expect(computeRoundTripCost(null, 31.98)).toBeNull();
    expect(computeRoundTripCost(undefined, undefined)).toBeNull();
  });

  it('非有限數回傳 null', () => {
    expect(computeRoundTripCost(NaN, 31.98)).toBeNull();
    expect(computeRoundTripCost(32.65, Infinity)).toBeNull();
  });

  it('sell <= 0 或 buy <= 0 回傳 null（避免除以零）', () => {
    expect(computeRoundTripCost(0, 0)).toBeNull();
    expect(computeRoundTripCost(-1, -2)).toBeNull();
  });

  it('買入高於賣出代表傳入反向報價單位，拒絕計算', () => {
    expect(computeRoundTripCost(30, 31)).toBeNull();
  });

  it('換錢所 KRW_PER_TWD 報價（sell 46.0 / buy 46.7）回傳 null 而非錯誤數字', () => {
    // 明洞換錢所報價單位為每 1 台幣換得 N 韓元，方向與台銀 TWD_PER_FOREIGN 相反；
    // 此處刻意驗證單位保護生效，避免對換錢所資料算出反號的損失率。
    expect(computeRoundTripCost(46.0, 46.7)).toBeNull();
  });

  it('買賣同價時損失率為 0', () => {
    const cost = computeRoundTripCost(30, 30);
    expect(cost!.lossPct).toBe(0);
    expect(cost!.severity).toBe('low');
  });
});

describe('classifyRoundTripSeverity', () => {
  it('依門檻分級，邊界值歸入較嚴重的一級', () => {
    expect(classifyRoundTripSeverity(0)).toBe('low');
    expect(classifyRoundTripSeverity(4.99)).toBe('low');
    expect(classifyRoundTripSeverity(ROUND_TRIP_SEVERITY_THRESHOLDS.medium)).toBe('medium');
    expect(classifyRoundTripSeverity(14.99)).toBe('medium');
    expect(classifyRoundTripSeverity(ROUND_TRIP_SEVERITY_THRESHOLDS.high)).toBe('high');
    expect(classifyRoundTripSeverity(32.11)).toBe('high');
  });
});

describe('computeRoundTripLossTwd', () => {
  it('換 30000 台幣的 USD 再換回，損失約 618 元', () => {
    const cost = computeRoundTripCost(32.56, 31.89);
    expect(computeRoundTripLossTwd(30000, cost)).toBe(618);
  });

  it('cost 為 null 時回傳 null', () => {
    expect(computeRoundTripLossTwd(30000, null)).toBeNull();
  });

  it('金額為負或非有限數時回傳 null', () => {
    const cost = computeRoundTripCost(32.56, 31.89);
    expect(computeRoundTripLossTwd(-1, cost)).toBeNull();
    expect(computeRoundTripLossTwd(NaN, cost)).toBeNull();
  });

  it('金額為 0 時損失為 0', () => {
    const cost = computeRoundTripCost(32.56, 31.89);
    expect(computeRoundTripLossTwd(0, cost)).toBe(0);
  });
});

describe('deriveCashBuy', () => {
  it('自 bankMid 代數還原買入價（非估計，無誤差）', () => {
    // bankMid = (cashBuy + cashSell) / 2 → cashBuy = 2 * bankMid - cashSell
    expect(deriveCashBuy(32.225, 32.56)).toBeCloseTo(31.89, 6);
  });

  it('bankMid 為 null 代表無現金買入報價，回傳 null', () => {
    expect(deriveCashBuy(null, 32.56)).toBeNull();
    expect(deriveCashBuy(undefined, 32.56)).toBeNull();
  });

  it('非有限數或推導出非正值時回傳 null', () => {
    expect(deriveCashBuy(NaN, 32.56)).toBeNull();
    expect(deriveCashBuy(10, 30)).toBeNull();
  });
});

describe('真實牌告資料迴歸', () => {
  const entries = Object.entries(SEO_RATE_EXAMPLES);

  it('所有具 bankMid 的幣別皆可還原買入價並算出來回成本', () => {
    const withMid = entries.filter(([, ex]) => ex.bankMid != null);
    expect(withMid.length).toBeGreaterThan(0);
    for (const [code, ex] of withMid) {
      const buy = deriveCashBuy(ex.bankMid, ex.cashSell);
      expect(buy, `${code} 應可還原買入價`).not.toBeNull();
      const cost = computeRoundTripCost(ex.cashSell, buy);
      expect(cost, `${code} 應可算出來回成本`).not.toBeNull();
      expect(cost!.lossPct).toBeGreaterThanOrEqual(0);
    }
  });

  it('還原的買入價恆低於賣出價（價差方向正確）', () => {
    for (const [code, ex] of entries) {
      const buy = deriveCashBuy(ex.bankMid, ex.cashSell);
      if (buy != null) {
        expect(buy, `${code} 買入不應高於賣出`).toBeLessThan(ex.cashSell);
      }
    }
  });

  it('東南亞現鈔幣別的來回損失顯著高於主要貨幣', () => {
    const costOf = (code: 'USD' | 'IDR') => {
      const ex = SEO_RATE_EXAMPLES[code];
      expect(ex, `${code} 應存在於 SEO_RATE_EXAMPLES`).toBeDefined();
      return computeRoundTripCost(ex!.cashSell, deriveCashBuy(ex!.bankMid, ex!.cashSell));
    };
    const usd = costOf('USD');
    const idr = costOf('IDR');
    expect(usd!.severity).toBe('low');
    expect(idr!.severity).toBe('high');
    expect(idr!.lossPct).toBeGreaterThan(usd!.lossPct);
  });
});
