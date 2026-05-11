import { describe, it, expect } from 'vitest';
import {
  EXCHANGE_SHOP_PROVIDERS,
  hasExchangeShopProvider,
  getExchangeShopProvider,
} from '../exchangeShopProviders';

describe('EXCHANGE_SHOP_PROVIDERS registry', () => {
  it('KRW has a provider configured', () => {
    expect(EXCHANGE_SHOP_PROVIDERS.KRW).toBeDefined();
  });

  it('KRW provider has required fields', () => {
    const p = EXCHANGE_SHOP_PROVIDERS.KRW!;
    expect(p.providerName).toBe('明洞換匯所');
    expect(p.cdnUrl).toContain('/public/rates/providers/moneybox/latest.json');
    expect(p.cdnUrlFallback).toContain('/public/rates/providers/moneybox/latest.json');
    expect(p.cdnUrl).not.toContain('/public/rates/moneybox.json');
    expect(p.fallbackSell).toBeGreaterThan(0);
    expect(p.fallbackBuy).toBeGreaterThan(0);
    expect(typeof p.getSellRate).toBe('function');
    expect(typeof p.getBuyRate).toBe('function');
  });

  it('getSellRate extracts TWD→KRW sell rate from raw CDN response', () => {
    const raw = { rates: { TWD: { sell: 44.85, buy: 45.1 } } };
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate(raw)).toBe(44.85);
  });

  it('getBuyRate extracts KRW→TWD buy rate from raw CDN response', () => {
    const raw = { rates: { TWD: { sell: 44.85, buy: 45.1 } } };
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getBuyRate(raw)).toBe(45.1);
  });

  it('getSellRate returns null for malformed data', () => {
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate({})).toBeNull();
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate(null)).toBeNull();
  });

  it('getBuyRate returns null for malformed data', () => {
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getBuyRate({})).toBeNull();
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getBuyRate(null)).toBeNull();
  });

  it('hasExchangeShopProvider returns true for KRW', () => {
    expect(hasExchangeShopProvider('KRW')).toBe(true);
  });

  it('hasExchangeShopProvider returns false for USD', () => {
    expect(hasExchangeShopProvider('USD')).toBe(false);
  });

  it('getExchangeShopProvider returns config for KRW', () => {
    expect(getExchangeShopProvider('KRW')).not.toBeNull();
  });

  it('getExchangeShopProvider returns null for unsupported currency', () => {
    expect(getExchangeShopProvider('USD')).toBeNull();
  });
});
