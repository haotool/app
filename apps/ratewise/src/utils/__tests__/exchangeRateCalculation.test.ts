/**
 * 匯率計算邏輯單元測試
 *
 * 測試範圍：
 * 1. TWD 為基準貨幣的反向計算
 * 2. 外幣為基準貨幣的交叉匯率計算
 * 3. 金額轉換邏輯
 * 4. Fallback 機制
 *
 * @see docs/dev/006_exchange_rate_calculation_api.md
 */

import { describe, it, expect } from 'vitest';
import { formatExchangeRate, formatCurrency } from '../currencyFormatter';
import {
  getExchangeRate,
  calculateCrossRate,
  convertCurrencyAmount,
  hasOnlyOneRateType,
  getCurrencyRateTypeAvailability,
  getPairRateTypeAvailability,
  resolveRateTypeByAvailability,
  getBuyRate,
  getMidRate,
  convertCurrencyAmountWithMode,
} from '../exchangeRateCalculation';
import type { RateDetails } from '../../features/ratewise/hooks/useExchangeRates';
import type { CurrencyCode, RateType } from '../../features/ratewise/types';

// 模擬匯率數據
const mockRateDetails: Record<string, RateDetails> = {
  USD: {
    name: '美元',
    spot: { buy: 30.87, sell: 30.97 },
    cash: { buy: 30.4, sell: 31.4 },
  },
  JPY: {
    name: '日圓',
    spot: { buy: 0.2, sell: 0.204 },
    cash: { buy: null, sell: null },
  },
  KRW: {
    name: '韓元',
    spot: { buy: 0, sell: null },
    cash: { buy: 0.0226, sell: 0.024 },
  },
  EUR: {
    name: '歐元',
    spot: { buy: 33.5, sell: 34.0 },
    cash: { buy: 33.0, sell: 34.5 },
  },
};

/**
 * 計算匯率顯示（使用實際導出的函數）
 */
function calculateRateDisplay(
  baseCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  rateType: RateType,
  details: Record<string, RateDetails>,
): string {
  if (baseCurrency === targetCurrency) {
    return '基準貨幣';
  }

  const crossRate = calculateCrossRate(baseCurrency, targetCurrency, details, rateType);

  if (crossRate === null) return '無資料';

  return `1 ${baseCurrency} = ${formatExchangeRate(crossRate)} ${targetCurrency}`;
}

describe('匯率計算邏輯', () => {
  describe('TWD 為基準貨幣的反向計算', () => {
    it('應正確計算 TWD → USD（即期）', () => {
      const result = calculateRateDisplay('TWD', 'USD', 'spot', mockRateDetails);

      // 1 USD = 30.97 TWD → 1 TWD = 1/30.97 = 0.0323 USD
      expect(result).toBe('1 TWD = 0.0323 USD');
    });

    it('應正確計算 TWD → JPY（即期）', () => {
      const result = calculateRateDisplay('TWD', 'JPY', 'spot', mockRateDetails);

      // 1 JPY = 0.204 TWD → 1 TWD = 1/0.204 = 4.9020 JPY
      expect(result).toBe('1 TWD = 4.9020 JPY');
    });

    it('應正確計算 TWD → USD（現金）', () => {
      const result = calculateRateDisplay('TWD', 'USD', 'cash', mockRateDetails);

      // 1 USD = 31.40 TWD → 1 TWD = 1/31.40 = 0.0318 USD
      expect(result).toBe('1 TWD = 0.0318 USD');
    });
  });

  describe('外幣為基準貨幣的交叉匯率計算', () => {
    it('應正確計算 USD → JPY（即期）', () => {
      const result = calculateRateDisplay('USD', 'JPY', 'spot', mockRateDetails);

      // 1 USD = 30.97 TWD, 1 JPY = 0.204 TWD
      // 1 USD = 30.97 / 0.204 = 151.8137 JPY
      expect(result).toBe('1 USD = 151.8137 JPY');
    });

    it('應正確計算 USD → EUR（即期）', () => {
      const result = calculateRateDisplay('USD', 'EUR', 'spot', mockRateDetails);

      // 1 USD = 30.97 TWD, 1 EUR = 34.00 TWD
      // 1 USD = 30.97 / 34.00 = 0.9109 EUR
      expect(result).toBe('1 USD = 0.9109 EUR');
    });

    it('應正確計算 EUR → JPY（即期）', () => {
      const result = calculateRateDisplay('EUR', 'JPY', 'spot', mockRateDetails);

      // 1 EUR = 34.00 TWD, 1 JPY = 0.204 TWD
      // 1 EUR = 34.00 / 0.204 = 166.6667 JPY
      expect(result).toBe('1 EUR = 166.6667 JPY');
    });

    it('應正確計算 JPY → USD（即期）', () => {
      const result = calculateRateDisplay('JPY', 'USD', 'spot', mockRateDetails);

      // 1 JPY = 0.204 TWD, 1 USD = 30.97 TWD
      // 1 JPY = 0.204 / 30.97 = 0.0066 USD
      expect(result).toBe('1 JPY = 0.0066 USD');
    });
  });

  describe('Fallback 機制', () => {
    it('應在 JPY 沒有現金匯率時 fallback 到即期', () => {
      const result = calculateRateDisplay('TWD', 'JPY', 'cash', mockRateDetails);

      // JPY 只有 spot，應 fallback 到 spot.sell = 0.204
      expect(result).toBe('1 TWD = 4.9020 JPY');
    });

    it('應在 KRW 沒有即期匯率時 fallback 到現金', () => {
      const result = calculateRateDisplay('TWD', 'KRW', 'spot', mockRateDetails);

      // KRW 只有 cash，應 fallback 到 cash.sell = 0.0240
      // 1 TWD = 1 / 0.0240 = 41.6667 KRW
      expect(result).toBe('1 TWD = 41.6667 KRW');
    });

    it('應在交叉匯率中正確 fallback（USD → KRW）', () => {
      const result = calculateRateDisplay('USD', 'KRW', 'spot', mockRateDetails);

      // USD: spot.sell = 30.97, KRW: fallback to cash.sell = 0.0240
      // 1 USD = 30.97 / 0.0240 = 1290.4167 KRW
      expect(result).toBe('1 USD = 1,290.4167 KRW');
    });
  });

  describe('金額轉換', () => {
    it('應正確轉換 1000 USD → TWD（即期）', () => {
      const result = convertCurrencyAmount(1000, 'USD', 'TWD', mockRateDetails, 'spot');

      // 1000 * 30.97 = 30970 TWD
      expect(result).toBe(30970);
    });

    it('應正確轉換 1000 TWD → USD（即期）', () => {
      const result = convertCurrencyAmount(1000, 'TWD', 'USD', mockRateDetails, 'spot');

      // 1000 / 30.97 = 32.2893 USD
      expect(result).toBeCloseTo(32.2893, 4);
    });

    it('應正確轉換 1000 USD → JPY（即期）', () => {
      const result = convertCurrencyAmount(1000, 'USD', 'JPY', mockRateDetails, 'spot');

      // 1000 * (30.97 / 0.204) = 151813.7255 JPY
      expect(result).toBeCloseTo(151813.7255, 4);
    });

    it('應正確轉換 10000 JPY → EUR（即期）', () => {
      const result = convertCurrencyAmount(10000, 'JPY', 'EUR', mockRateDetails, 'spot');

      // 10000 * (0.204 / 34.00) = 60 EUR（允許浮點數精度誤差）
      expect(result).toBeCloseTo(60, 2);
    });

    it('應在相同貨幣時返回原金額', () => {
      const result = convertCurrencyAmount(1000, 'USD', 'USD', mockRateDetails, 'spot');
      expect(result).toBe(1000);
    });
  });

  describe('格式化驗證', () => {
    it('匯率應格式化為 4 位小數', () => {
      expect(formatExchangeRate(0.0323)).toBe('0.0323');
      expect(formatExchangeRate(151.8137)).toBe('151.8137');
      expect(formatExchangeRate(30.97)).toBe('30.9700');
    });

    it('金額應根據貨幣正確格式化', () => {
      expect(formatCurrency(1000, 'USD')).toBe('1,000.00');
      expect(formatCurrency(1000, 'JPY')).toBe('1,000');
      expect(formatCurrency(1000.5, 'TWD')).toBe('1,000.50');
      expect(formatCurrency(30970, 'TWD')).toBe('30,970.00');
    });

    it('大額金額應正確添加千分位', () => {
      expect(formatCurrency(151813.7255, 'JPY')).toBe('151,814');
      expect(formatCurrency(30970, 'TWD')).toBe('30,970.00');
      expect(formatExchangeRate(1290.4167)).toBe('1,290.4167');
    });
  });

  describe('邊界情況處理', () => {
    it('應在基準貨幣等於目標貨幣時返回「基準貨幣」', () => {
      const result = calculateRateDisplay('USD', 'USD', 'spot', mockRateDetails);
      expect(result).toBe('基準貨幣');
    });

    it('應在缺少匯率數據時返回「無資料」', () => {
      const result = calculateRateDisplay('TWD', 'XXX' as CurrencyCode, 'spot', mockRateDetails);
      expect(result).toBe('無資料');
    });

    it('應在兩種匯率類型都無數據時返回「無資料」', () => {
      const incompleteData: Record<string, RateDetails> = {
        XXX: { name: '測試貨幣', spot: { buy: 0, sell: null }, cash: { buy: null, sell: null } },
      };
      const result = calculateRateDisplay('TWD', 'XXX' as CurrencyCode, 'spot', incompleteData);
      expect(result).toBe('無資料');
    });

    it('金額轉換應在缺少匯率時返回 0', () => {
      const result = convertCurrencyAmount(
        1000,
        'TWD',
        'XXX' as CurrencyCode,
        mockRateDetails,
        'spot',
      );
      expect(result).toBe(0);
    });
  });

  describe('精度測試', () => {
    it('反向計算應保持精度', () => {
      // 1 USD = 30.97 TWD → 1 TWD = 0.0323 USD
      // 1 TWD * 0.0323 應接近 0.0323 USD
      const rate = 1 / 30.97;
      expect(rate).toBeCloseTo(0.0323, 4);
    });

    it('交叉匯率應保持精度', () => {
      // 1 USD = 30.97 TWD, 1 JPY = 0.204 TWD
      // 1 USD = 151.8137 JPY
      // 100 USD = 15181.37 JPY
      const result = convertCurrencyAmount(100, 'USD', 'JPY', mockRateDetails, 'spot');
      expect(result).toBeCloseTo(15181.37, 2);
    });

    it('雙向轉換應可逆（考慮精度誤差）', () => {
      // 1000 USD → TWD → USD
      const twd = convertCurrencyAmount(1000, 'USD', 'TWD', mockRateDetails, 'spot');
      const backToUsd = convertCurrencyAmount(twd, 'TWD', 'USD', mockRateDetails, 'spot');

      // 應接近 1000，允許 0.01 的誤差
      expect(backToUsd).toBeCloseTo(1000, 2);
    });
  });

  // 新增：直接測試導出的函數
  describe('getExchangeRate 函數', () => {
    it('應返回 TWD = 1', () => {
      expect(getExchangeRate('TWD', mockRateDetails, 'spot')).toBe(1);
    });

    it('應從 details 獲取 USD spot 匯率', () => {
      expect(getExchangeRate('USD', mockRateDetails, 'spot')).toBe(30.97);
    });

    it('應在 JPY 缺少 cash 時 fallback 到 spot', () => {
      expect(getExchangeRate('JPY', mockRateDetails, 'cash')).toBe(0.204);
    });

    it('應在缺少貨幣時返回 null', () => {
      expect(getExchangeRate('XXX' as CurrencyCode, mockRateDetails, 'spot')).toBe(null);
    });

    it('應使用 exchangeRates fallback', () => {
      const simpleRates: Record<CurrencyCode, number | null> = {
        TWD: 1,
        USD: 31.0,
        EUR: 34.5,
        CHF: null,
        JPY: null,
        KRW: null,
        HKD: null,
        GBP: null,
        AUD: null,
        CAD: null,
        SGD: null,
        CNY: null,
        NZD: null,
        THB: null,
        PHP: null,
        IDR: null,
        VND: null,
        MYR: null,
      };
      expect(getExchangeRate('USD', undefined, 'spot', simpleRates)).toBe(31.0);
    });
  });

  describe('calculateCrossRate 函數', () => {
    it('相同貨幣應返回 1', () => {
      expect(calculateCrossRate('USD', 'USD', mockRateDetails, 'spot')).toBe(1);
    });

    it('TWD → USD 應返回反向匯率', () => {
      const rate = calculateCrossRate('TWD', 'USD', mockRateDetails, 'spot');
      expect(rate).toBeCloseTo(1 / 30.97, 4);
    });

    it('USD → TWD 應返回正向匯率', () => {
      expect(calculateCrossRate('USD', 'TWD', mockRateDetails, 'spot')).toBe(30.97);
    });

    it('USD → JPY 應返回交叉匯率', () => {
      const rate = calculateCrossRate('USD', 'JPY', mockRateDetails, 'spot');
      expect(rate).toBeCloseTo(30.97 / 0.204, 4);
    });

    it('缺少匯率時應返回 null', () => {
      expect(calculateCrossRate('USD', 'XXX' as CurrencyCode, mockRateDetails, 'spot')).toBe(null);
    });
  });

  describe('hasOnlyOneRateType 函數', () => {
    it('應檢測到同時有 spot 和 cash', () => {
      expect(hasOnlyOneRateType(mockRateDetails)).toBe(false);
    });

    it('應檢測到只有 spot', () => {
      const spotOnly: Record<string, RateDetails> = {
        USD: {
          name: '美元',
          spot: { buy: 30.87, sell: 30.97 },
          cash: { buy: null, sell: null },
        },
      };
      expect(hasOnlyOneRateType(spotOnly)).toBe(true);
    });

    it('應在 details 為 undefined 時返回 true', () => {
      expect(hasOnlyOneRateType(undefined)).toBe(true);
    });

    it('應在 details 為空物件時返回 true', () => {
      expect(hasOnlyOneRateType({})).toBe(true);
    });
  });

  describe('匯率類型可用性函數', () => {
    it('應正確判斷單一幣別可用性（KRW 僅現金）', () => {
      expect(getCurrencyRateTypeAvailability('KRW', mockRateDetails)).toEqual({
        spot: false,
        cash: true,
      });
    });

    it('應正確判斷幣別對可用性（TWD→KRW 僅現金）', () => {
      expect(getPairRateTypeAvailability('TWD', 'KRW', mockRateDetails)).toEqual({
        spot: false,
        cash: true,
      });
    });

    it('應在偏好匯率不可用時回退到可用匯率', () => {
      const availability = getPairRateTypeAvailability('TWD', 'KRW', mockRateDetails);
      expect(resolveRateTypeByAvailability('spot', availability)).toBe('cash');
    });
  });
});

// ── RateMode 新功能測試 ───────────────────────────────────────────────────────

describe('getBuyRate 函數', () => {
  it('TWD 應返回 1', () => {
    expect(getBuyRate('TWD', mockRateDetails, 'spot')).toBe(1);
  });

  it('應返回 USD 即期買入價', () => {
    expect(getBuyRate('USD', mockRateDetails, 'spot')).toBe(30.87);
  });

  it('應返回 JPY 即期買入價', () => {
    expect(getBuyRate('JPY', mockRateDetails, 'spot')).toBe(0.2);
  });

  it('KRW spot.buy=0 時應 fallback 到 cash.buy', () => {
    // KRW: spot.buy=0 (invalid) → fallback to cash.buy=0.0226
    expect(getBuyRate('KRW', mockRateDetails, 'spot')).toBe(0.0226);
  });

  it('JPY 無 cash 買入時應 fallback 到 spot 買入', () => {
    // JPY: cash.buy=null → fallback to spot.buy=0.2
    expect(getBuyRate('JPY', mockRateDetails, 'cash')).toBe(0.2);
  });

  it('不存在幣別應返回 null', () => {
    expect(getBuyRate('XXX' as CurrencyCode, mockRateDetails, 'spot')).toBe(null);
  });
});

describe('getMidRate 函數', () => {
  it('TWD 應返回 1', () => {
    expect(getMidRate('TWD', mockRateDetails, 'spot')).toBe(1);
  });

  it('應返回 USD 即期中間價 (30.87+30.97)/2=30.92', () => {
    expect(getMidRate('USD', mockRateDetails, 'spot')).toBeCloseTo(30.92, 4);
  });

  it('應返回 JPY 即期中間價 (0.2+0.204)/2=0.202', () => {
    expect(getMidRate('JPY', mockRateDetails, 'spot')).toBeCloseTo(0.202, 4);
  });

  it('EUR 現金中間價 (33.0+34.5)/2=33.75', () => {
    expect(getMidRate('EUR', mockRateDetails, 'cash')).toBeCloseTo(33.75, 4);
  });
});

describe('convertCurrencyAmountWithMode — sell 模式（與舊行為相同）', () => {
  it('1000 USD→TWD sell 應等於現有行為', () => {
    const legacy = convertCurrencyAmount(1000, 'USD', 'TWD', mockRateDetails, 'spot');
    const mode = convertCurrencyAmountWithMode(1000, 'USD', 'TWD', mockRateDetails, 'spot', 'sell');
    expect(mode).toBe(legacy);
  });

  it('1000 TWD→USD sell 應等於現有行為', () => {
    const legacy = convertCurrencyAmount(1000, 'TWD', 'USD', mockRateDetails, 'spot');
    const mode = convertCurrencyAmountWithMode(1000, 'TWD', 'USD', mockRateDetails, 'spot', 'sell');
    expect(mode).toBe(legacy);
  });

  it('1000 USD→JPY sell 應等於現有行為', () => {
    const legacy = convertCurrencyAmount(1000, 'USD', 'JPY', mockRateDetails, 'spot');
    const mode = convertCurrencyAmountWithMode(1000, 'USD', 'JPY', mockRateDetails, 'spot', 'sell');
    expect(mode).toBe(legacy);
  });
});

describe('convertCurrencyAmountWithMode — auto 模式（FROM用賣出, TO用買入）', () => {
  it('1000 USD→TWD auto：FROM=USD.sell=30.97, TO=TWD=1 → 30970', () => {
    // A→TWD: amount * A.sell
    const result = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'TWD',
      mockRateDetails,
      'spot',
      'auto',
    );
    expect(result).toBeCloseTo(30970, 2);
  });

  it('1000 TWD→USD auto：FROM=TWD=1, TO=USD.buy=30.87 → 1000/30.87≈32.395', () => {
    // TWD→B: amount / B.buy (不同於 sell 模式的 amount / B.sell)
    const result = convertCurrencyAmountWithMode(
      1000,
      'TWD',
      'USD',
      mockRateDetails,
      'spot',
      'auto',
    );
    expect(result).toBeCloseTo(1000 / 30.87, 4);
  });

  it('1000 USD→JPY auto：FROM=USD.sell=30.97, TO=JPY.buy=0.2 → 154850', () => {
    // Cross rate: amount * (USD.sell / JPY.buy) = 1000 * (30.97 / 0.2) = 154850
    const result = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'auto',
    );
    expect(result).toBeCloseTo(154850, 1);
  });

  it('auto 模式 USD→JPY 應比 sell 模式給更多 JPY', () => {
    const autoResult = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'auto',
    );
    const sellResult = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'sell',
    );
    // auto: 30.97/0.2=154.85 vs sell: 30.97/0.204=151.81
    expect(autoResult).toBeGreaterThan(sellResult);
  });

  it('相同貨幣 auto 模式應返回原金額', () => {
    expect(convertCurrencyAmountWithMode(500, 'USD', 'USD', mockRateDetails, 'spot', 'auto')).toBe(
      500,
    );
  });
});

describe('convertCurrencyAmountWithMode — mid 模式（中間價）', () => {
  it('1000 USD→TWD mid：USD.mid=(30.87+30.97)/2=30.92 → 30920', () => {
    const result = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'TWD',
      mockRateDetails,
      'spot',
      'mid',
    );
    expect(result).toBeCloseTo(30920, 1);
  });

  it('1000 TWD→USD mid：TWD.mid=1, USD.mid=30.92 → 1000/30.92≈32.341', () => {
    const result = convertCurrencyAmountWithMode(
      1000,
      'TWD',
      'USD',
      mockRateDetails,
      'spot',
      'mid',
    );
    expect(result).toBeCloseTo(1000 / 30.92, 4);
  });

  it('1000 USD→JPY mid：USD.mid=30.92, JPY.mid=0.202 → 1000*(30.92/0.202)≈153069.3', () => {
    const result = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'mid',
    );
    expect(result).toBeCloseTo((1000 * 30.92) / 0.202, 1);
  });

  it('mid 模式 USD→JPY 應介於 auto 和 sell 之間', () => {
    const autoResult = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'auto',
    );
    const midResult = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'mid',
    );
    const sellResult = convertCurrencyAmountWithMode(
      1000,
      'USD',
      'JPY',
      mockRateDetails,
      'spot',
      'sell',
    );
    expect(midResult).toBeLessThan(autoResult);
    expect(midResult).toBeGreaterThan(sellResult);
  });
});
