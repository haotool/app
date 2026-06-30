/**
 * exchangeRateService — payload 驗證閘單元測試（TASK-001 / P1）
 *
 * 純函式 isValidRatePayload：守住 CDN 匯率 payload 進入快取與 transformRates(1/rate) 前的
 * 數值有效性。缺口：原 fetchFromCDN 僅檢查 rates 為物件，未驗證每筆值為有限正數，
 * 導致 rate ∈ {0, NaN, 字串, 負} 穿透後在 transformRates 產生靜默 Infinity/NaN。
 */

import { describe, expect, it } from 'vitest';
import { isValidRatePayload } from '../exchangeRateService';

const base = {
  timestamp: '2025-10-31T01:00:00+08:00',
  updateTime: '2025-10-31 01:00',
  source: '台灣銀行',
  sourceUrl: 'https://rate.bot.com.tw/',
  base: 'TWD',
  rates: { USD: 30.5, JPY: 0.21 },
  details: {},
};

describe('isValidRatePayload', () => {
  it('接受合法 payload（所有 rate 為有限正數）', () => {
    expect(isValidRatePayload(base)).toBe(true);
  });

  it('拒絕 null / 非物件', () => {
    expect(isValidRatePayload(null)).toBe(false);
    expect(isValidRatePayload(undefined)).toBe(false);
    expect(isValidRatePayload('x')).toBe(false);
    expect(isValidRatePayload(123)).toBe(false);
  });

  it('拒絕缺少 rates 或 rates 非物件', () => {
    expect(isValidRatePayload({ ...base, rates: undefined })).toBe(false);
    expect(isValidRatePayload({ ...base, rates: null })).toBe(false);
    expect(isValidRatePayload({ ...base, rates: 'x' })).toBe(false);
  });

  it('拒絕空 rates 物件', () => {
    expect(isValidRatePayload({ ...base, rates: {} })).toBe(false);
  });

  it('拒絕含 0 的 rate（transformRates 會產生 Infinity）', () => {
    expect(isValidRatePayload({ ...base, rates: { USD: 30.5, JPY: 0 } })).toBe(false);
  });

  it('拒絕含負數的 rate', () => {
    expect(isValidRatePayload({ ...base, rates: { USD: -30.5 } })).toBe(false);
  });

  it('拒絕含 NaN 的 rate', () => {
    expect(isValidRatePayload({ ...base, rates: { USD: NaN } })).toBe(false);
  });

  it('拒絕含 Infinity 的 rate', () => {
    expect(isValidRatePayload({ ...base, rates: { USD: Infinity } })).toBe(false);
  });

  it('拒絕含非數值（字串）的 rate', () => {
    expect(isValidRatePayload({ ...base, rates: { USD: '30.5' } })).toBe(false);
  });
});
