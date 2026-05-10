import { describe, it, expect } from 'vitest';
import {
  RATE_PROVIDERS,
  getAllRateProviders,
  getDefaultProvider,
  getProvidersBySourceKind,
  getRateProvider,
  isProviderSupportedForCurrency,
  shouldEnableBankProviderChoice,
} from '../rateProviders';
import { getSupportedExchangeShopCurrencies } from '../exchangeShopProviders';

describe('RATE_PROVIDERS registry', () => {
  it('包含 bot 與 moneybox 兩筆 provider', () => {
    expect(Object.keys(RATE_PROVIDERS).sort()).toEqual(['bot', 'moneybox']);
  });

  it('bot 為銀行 provider，supportedRateTypes 同時包含 spot 與 cash', () => {
    const bot = RATE_PROVIDERS.bot;
    expect(bot.id).toBe('bot');
    expect(bot.sourceKind).toBe('bank');
    expect(bot.supportedRateTypes).toEqual(expect.arrayContaining(['spot', 'cash']));
    expect(bot.supportedCurrencies).toBe('all');
    expect(bot.isDefault).toBe(true);
    expect(bot.priority).toBe(100);
    expect(bot.label).toBe('台灣銀行');
    expect(bot.shortLabel).toBe('台銀');
  });

  it('moneybox 為換錢所 provider，僅支援 cash，並對應 EXCHANGE_SHOP_PROVIDERS keys', () => {
    const moneybox = RATE_PROVIDERS.moneybox;
    expect(moneybox.id).toBe('moneybox');
    expect(moneybox.sourceKind).toBe('exchange-shop');
    expect(moneybox.supportedRateTypes).toEqual(['cash']);
    expect(moneybox.isDefault).toBe(true);
    expect(moneybox.priority).toBe(10);
    expect(moneybox.label).toBe('明洞換匯所');
    expect(moneybox.shortLabel).toBe('MoneyBox');

    expect(Array.isArray(moneybox.supportedCurrencies)).toBe(true);
    expect(moneybox.supportedCurrencies).toEqual(getSupportedExchangeShopCurrencies());
  });

  it('moneybox 使用 canonical provider path，不保留未上線的舊版 alias', () => {
    const moneybox = RATE_PROVIDERS.moneybox;

    expect(moneybox.apiPaths.latest).toBe('providers/moneybox/latest.json');
    expect(moneybox.apiPaths.history).toBe('providers/moneybox/history/{YYYY-MM-DD}.json');
    expect(moneybox.apiPaths.latest).not.toBe('moneybox.json');
    expect(moneybox.apiPaths.history).not.toBe('moneybox-history/{YYYY-MM-DD}.json');
  });
});

describe('getRateProvider', () => {
  it('回傳已註冊 providerId 的 config', () => {
    expect(getRateProvider('bot')?.id).toBe('bot');
    expect(getRateProvider('moneybox')?.id).toBe('moneybox');
  });

  it('未知 providerId 回 null', () => {
    expect(getRateProvider('unknown-provider')).toBeNull();
  });
});

describe('getProvidersBySourceKind', () => {
  it('getAllRateProviders 回傳所有 provider，作為 registry 枚舉唯一入口', () => {
    const allProviders = getAllRateProviders();
    expect(allProviders.map((provider) => provider.id).sort()).toEqual(['bot', 'moneybox']);
    expect(allProviders).toHaveLength(Object.keys(RATE_PROVIDERS).length);
  });

  it('bank 來源僅含 bot', () => {
    const banks = getProvidersBySourceKind('bank');
    expect(banks.map((p) => p.id)).toEqual(['bot']);
  });

  it('exchange-shop 來源僅含 moneybox', () => {
    const shops = getProvidersBySourceKind('exchange-shop');
    expect(shops.map((p) => p.id)).toEqual(['moneybox']);
  });

  it('回傳結果依 priority 由大到小排序', () => {
    const all = [...getProvidersBySourceKind('bank'), ...getProvidersBySourceKind('exchange-shop')];
    for (const list of [
      getProvidersBySourceKind('bank'),
      getProvidersBySourceKind('exchange-shop'),
    ]) {
      const priorities = list.map((p) => p.priority);
      const sorted = [...priorities].sort((a, b) => b - a);
      expect(priorities).toEqual(sorted);
    }
    expect(all.length).toBe(Object.keys(RATE_PROVIDERS).length);
  });
});

describe('getDefaultProvider', () => {
  it('bank 預設 provider 為 bot', () => {
    expect(getDefaultProvider('bank')?.id).toBe('bot');
  });

  it('exchange-shop 預設 provider 為 moneybox', () => {
    expect(getDefaultProvider('exchange-shop')?.id).toBe('moneybox');
  });

  it('每個 sourceKind 至多只有一個 isDefault=true 的 provider', () => {
    for (const kind of ['bank', 'exchange-shop'] as const) {
      const defaults = getProvidersBySourceKind(kind).filter((p) => p.isDefault);
      expect(defaults).toHaveLength(1);
    }
  });
});

describe('isProviderSupportedForCurrency', () => {
  it('supportedCurrencies="all" 時對任何幣別皆回 true', () => {
    expect(isProviderSupportedForCurrency('bot', 'USD')).toBe(true);
    expect(isProviderSupportedForCurrency('bot', 'KRW')).toBe(true);
    expect(isProviderSupportedForCurrency('bot', 'TWD')).toBe(true);
  });

  it('supportedCurrencies 為清單時，僅清單內的幣別回 true', () => {
    expect(isProviderSupportedForCurrency('moneybox', 'KRW')).toBe(true);
    expect(isProviderSupportedForCurrency('moneybox', 'USD')).toBe(false);
    expect(isProviderSupportedForCurrency('moneybox', 'JPY')).toBe(false);
  });

  it('未知 providerId 回 false（防呆）', () => {
    expect(isProviderSupportedForCurrency('unknown-provider', 'KRW')).toBe(false);
  });
});

describe('shouldEnableBankProviderChoice', () => {
  it('銀行 provider 只有 bot 時應回 false', () => {
    expect(shouldEnableBankProviderChoice()).toBe(false);
  });

  it('語意應等價於 getProvidersBySourceKind("bank").length > 1', () => {
    const expected = getProvidersBySourceKind('bank').length > 1;
    expect(shouldEnableBankProviderChoice()).toBe(expected);
  });
});
