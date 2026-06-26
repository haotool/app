import { describe, it, expect } from 'vitest';
import { getRateBasisKind } from '../rateBasisLabel';

describe('getRateBasisKind - 計價基準描述 SSOT', () => {
  it('auto 模式 TWD→外幣 為銀行賣出價(客戶買外幣)', () => {
    expect(getRateBasisKind('TWD', 'JPY', 'auto', 'bank')).toBe('bank-sell');
  });

  it('auto 模式 外幣→TWD 為銀行買入價(客戶賣外幣)', () => {
    expect(getRateBasisKind('JPY', 'TWD', 'auto', 'bank')).toBe('bank-buy');
  });

  it('auto 模式 外幣→外幣 為交叉換算', () => {
    expect(getRateBasisKind('USD', 'JPY', 'auto', 'bank')).toBe('bank-cross');
  });

  it('sell 模式一律為台銀賣出牌告', () => {
    expect(getRateBasisKind('JPY', 'TWD', 'sell', 'bank')).toBe('bank-sell-only');
  });

  it('mid 模式為參考中間價', () => {
    expect(getRateBasisKind('TWD', 'USD', 'mid', 'bank')).toBe('mid');
  });

  it('換錢所 auto TWD→外幣 為換錢所賣出價', () => {
    expect(getRateBasisKind('TWD', 'KRW', 'auto', 'exchange-shop')).toBe('shop-sell');
  });

  it('換錢所 auto 外幣→TWD 為換錢所買入價', () => {
    expect(getRateBasisKind('KRW', 'TWD', 'auto', 'exchange-shop')).toBe('shop-buy');
  });

  it('換錢所 sell 模式雙向皆為換錢所賣出價', () => {
    expect(getRateBasisKind('TWD', 'KRW', 'sell', 'exchange-shop')).toBe('shop-sell');
    expect(getRateBasisKind('KRW', 'TWD', 'sell', 'exchange-shop')).toBe('shop-sell');
  });

  it('換錢所 mid 模式為換錢所中間價', () => {
    expect(getRateBasisKind('TWD', 'KRW', 'mid', 'exchange-shop')).toBe('shop-mid');
    expect(getRateBasisKind('KRW', 'TWD', 'mid', 'exchange-shop')).toBe('shop-mid');
  });
});
