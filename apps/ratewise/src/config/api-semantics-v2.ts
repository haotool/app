/**
 * API Semantics v2 SSOT（spec §二十一）。
 * legacy buy/sell 保留；v2 欄位為 additive customer-centric 語意層。
 */

export const API_SEMANTICS_SCHEMA_VERSION = '2.0' as const;

export const API_SEMANTICS_DOC = {
  specPath: 'docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md',
  section: '二十一',
  publicUrl: 'https://app.haotool.org/ratewise/open-data/',
} as const;

export type ApiSemanticRateType = 'cash' | 'spot';

/** 台銀：sell = TWD/外幣單位；MoneyBox TWD：sell = KRW/TWD。 */
export type QuoteUnit = 'TWD_PER_FOREIGN' | 'KRW_PER_TWD';

export interface LegacyRateTypeBlock {
  buy: number | null;
  sell: number | null;
}

export interface SemanticRateTypeBlock extends LegacyRateTypeBlock {
  customerBuyForeignRate: number | null;
  customerSellForeignRate: number | null;
  midMarketRate: number | null;
  bankSellTwdPerUnit: number | null;
  rateType: ApiSemanticRateType;
  currency: string;
  quoteUnit: QuoteUnit;
}

export interface LegacyCurrencyDetail {
  name?: string;
  spot: LegacyRateTypeBlock;
  cash: LegacyRateTypeBlock;
}

export interface SemanticCurrencyDetail {
  name?: string;
  spot: SemanticRateTypeBlock;
  cash: SemanticRateTypeBlock;
}

export interface LegacyExchangeShopRate {
  currency: string;
  base: number | null;
  buy: number | null;
  sell: number | null;
  spbuy: number | null;
  spsell: number | null;
}

export interface SemanticExchangeShopRate extends LegacyExchangeShopRate {
  customerBuyForeignRate: number | null;
  customerSellForeignRate: number | null;
  midMarketRate: number | null;
  quoteUnit: QuoteUnit;
  quotePerBaseUnit: number | null;
}

export type ProviderSemanticKind = 'bank' | 'exchange-shop';

export function computeMidMarketRate(
  buy: number | null | undefined,
  sell: number | null | undefined,
): number | null {
  if (buy == null || sell == null || !Number.isFinite(buy) || !Number.isFinite(sell)) {
    return null;
  }
  return Number(((buy + sell) / 2).toFixed(6));
}

export function computeBankSellTwdPerUnit(sell: number | null | undefined): number | null {
  if (sell == null || !Number.isFinite(sell) || sell === 0) {
    return null;
  }
  return Number((1 / sell).toFixed(8));
}

export function resolveQuoteUnitForExchangeShopCurrency(
  currency: string,
  baseCurrency: string,
): QuoteUnit {
  if (currency === 'TWD' && baseCurrency === 'KRW') {
    return 'KRW_PER_TWD';
  }
  return 'TWD_PER_FOREIGN';
}

export function computeQuotePerBaseUnit(
  sell: number | null | undefined,
  quoteUnit: QuoteUnit,
): number | null {
  if (sell == null || !Number.isFinite(sell)) {
    return null;
  }
  if (quoteUnit === 'KRW_PER_TWD') {
    return sell;
  }
  return computeBankSellTwdPerUnit(sell);
}

export function enrichRateTypeBlock(
  block: LegacyRateTypeBlock,
  currency: string,
  rateType: ApiSemanticRateType,
  quoteUnit: QuoteUnit = 'TWD_PER_FOREIGN',
): SemanticRateTypeBlock {
  const buy = block.buy ?? null;
  const sell = block.sell ?? null;

  return {
    buy,
    sell,
    customerBuyForeignRate: sell,
    customerSellForeignRate: buy,
    midMarketRate: computeMidMarketRate(buy, sell),
    bankSellTwdPerUnit: computeBankSellTwdPerUnit(sell),
    rateType,
    currency,
    quoteUnit,
  };
}

export function enrichCurrencyDetail(
  currency: string,
  detail: LegacyCurrencyDetail,
): SemanticCurrencyDetail {
  return {
    ...(detail.name !== undefined ? { name: detail.name } : {}),
    spot: enrichRateTypeBlock(detail.spot, currency, 'spot', 'TWD_PER_FOREIGN'),
    cash: enrichRateTypeBlock(detail.cash, currency, 'cash', 'TWD_PER_FOREIGN'),
  };
}

export function enrichExchangeShopRate(
  block: LegacyExchangeShopRate,
  quoteUnit: QuoteUnit,
): SemanticExchangeShopRate {
  const buy = block.buy ?? null;
  const sell = block.sell ?? null;

  return {
    ...block,
    customerBuyForeignRate: sell,
    customerSellForeignRate: buy,
    midMarketRate: computeMidMarketRate(buy, sell),
    quoteUnit,
    quotePerBaseUnit: computeQuotePerBaseUnit(sell, quoteUnit),
  };
}

export function resolveAsOf(payload: { timestamp?: string; updateTime?: string }): string | null {
  if (typeof payload.timestamp === 'string' && payload.timestamp.trim().length > 0) {
    const parsed = Date.parse(payload.timestamp);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  if (typeof payload.updateTime === 'string' && payload.updateTime.trim().length > 0) {
    return payload.updateTime;
  }

  return null;
}

export function enrichRatesPayload<T extends { details?: Record<string, LegacyCurrencyDetail> }>(
  payload: T,
): T & {
  schemaVersion: typeof API_SEMANTICS_SCHEMA_VERSION;
  asOf: string | null;
  details?: Record<string, SemanticCurrencyDetail>;
} {
  const enrichedDetails = payload.details
    ? Object.fromEntries(
        Object.entries(payload.details).map(([currency, detail]) => [
          currency,
          enrichCurrencyDetail(currency, detail),
        ]),
      )
    : undefined;

  return {
    ...payload,
    schemaVersion: API_SEMANTICS_SCHEMA_VERSION,
    asOf: resolveAsOf(payload as { timestamp?: string; updateTime?: string }),
    ...(enrichedDetails ? { details: enrichedDetails } : {}),
  };
}

export interface ExchangeShopRatesPayload {
  timestamp?: string;
  updateTime?: string;
  source?: string;
  sourceUrl?: string;
  apiUrl?: string;
  base?: string;
  rates: Record<string, LegacyExchangeShopRate>;
}

export function enrichExchangeShopRatesPayload<T extends ExchangeShopRatesPayload>(
  payload: T,
): Omit<T, 'rates'> & {
  schemaVersion: typeof API_SEMANTICS_SCHEMA_VERSION;
  asOf: string | null;
  semanticFieldMapping: ReturnType<typeof buildProviderSemanticFieldMapping>;
  quoteUnit: QuoteUnit;
  rates: Record<string, SemanticExchangeShopRate>;
} {
  const baseCurrency = payload.base ?? 'KRW';
  const quoteUnit = resolveQuoteUnitForExchangeShopCurrency('TWD', baseCurrency);

  const enrichedRates = Object.fromEntries(
    Object.entries(payload.rates).map(([code, rate]) => [
      code,
      enrichExchangeShopRate(rate, resolveQuoteUnitForExchangeShopCurrency(code, baseCurrency)),
    ]),
  );

  return {
    ...payload,
    schemaVersion: API_SEMANTICS_SCHEMA_VERSION,
    asOf: resolveAsOf(payload),
    semanticFieldMapping: buildProviderSemanticFieldMapping('exchange-shop', {
      providerId: 'moneybox',
      quoteUnit,
    }),
    quoteUnit,
    rates: enrichedRates,
  };
}

export function buildSemanticFieldMapping() {
  return buildProviderSemanticFieldMapping('bank');
}

export function buildProviderSemanticFieldMapping(
  providerKind: ProviderSemanticKind,
  options?: { providerId?: string; quoteUnit?: QuoteUnit },
) {
  if (providerKind === 'exchange-shop') {
    const quoteUnit = options?.quoteUnit ?? 'KRW_PER_TWD';
    const providerId = options?.providerId ?? 'moneybox';

    return {
      schemaVersion: API_SEMANTICS_SCHEMA_VERSION,
      semanticsDoc: API_SEMANTICS_DOC.publicUrl,
      providerKind,
      providerId,
      quoteUnit,
      asOfSourceField: 'timestamp | updateTime',
      fields: {
        customerBuyForeignRate: {
          legacyPath: `rates.TWD.sell`,
          description: '客戶用 TWD 買外幣（換錢所賣出）；KRW/TWD 直接乘算',
          twdToForeignFormula:
            quoteUnit === 'KRW_PER_TWD' ? 'amount * rates.TWD.sell' : 'amount / rates.{CCY}.sell',
        },
        customerSellForeignRate: {
          legacyPath: `rates.TWD.buy`,
          description: '客戶用外幣賣回 TWD（換錢所買入）',
        },
        midMarketRate: {
          legacyPath: '(buy + sell) / 2',
          description: '參考中間價',
        },
        quotePerBaseUnit: {
          legacyPath: quoteUnit === 'KRW_PER_TWD' ? 'rates.TWD.sell' : '1 / sell',
          description:
            quoteUnit === 'KRW_PER_TWD'
              ? '每 1 TWD 可換的 KRW（直接報價）'
              : '每 1 單位外幣的基準幣報價',
        },
      },
      examples: {
        TWD: {
          customerBuyForeignRate: 'rates.TWD.sell',
          customerSellForeignRate: 'rates.TWD.buy',
          twdToKrw: '1000 * rates.TWD.sell',
        },
      },
      bankComparison: {
        botQuoteUnit: 'TWD_PER_FOREIGN',
        botTwdToForeign: 'amount / details.{CCY}.cash.sell',
        moneyboxQuoteUnit: quoteUnit,
        moneyboxTwdToKrw: 'amount * rates.TWD.sell',
      },
    } as const;
  }

  return {
    schemaVersion: API_SEMANTICS_SCHEMA_VERSION,
    semanticsDoc: API_SEMANTICS_DOC.publicUrl,
    providerKind,
    quoteUnit: 'TWD_PER_FOREIGN' as QuoteUnit,
    asOfSourceField: 'timestamp | updateTime',
    fields: {
      customerBuyForeignRate: {
        legacyPath: 'details.{CURRENCY}.{rateType}.sell',
        description: '客戶用 TWD 買外幣（銀行賣出）',
        twdToForeignFormula: 'amount / details.{TO}.{rateType}.sell',
      },
      customerSellForeignRate: {
        legacyPath: 'details.{CURRENCY}.{rateType}.buy',
        description: '客戶用外幣賣回 TWD（銀行買入）',
        foreignToTwdFormula: 'amount * details.{FROM}.{rateType}.buy',
      },
      midMarketRate: {
        legacyPath: '(buy + sell) / 2',
        description: '參考中間價',
      },
      bankSellTwdPerUnit: {
        legacyPath: '1 / sell',
        description: '每 1 單位外幣的 TWD 賣價（外幣計價時）',
      },
    },
    examples: {
      USD: {
        cash: {
          customerBuyForeignRate: 'details.USD.cash.sell',
          customerSellForeignRate: 'details.USD.cash.buy',
        },
      },
    },
    bankComparison: {
      botQuoteUnit: 'TWD_PER_FOREIGN',
      botTwdToForeign: 'amount / details.{CCY}.cash.sell',
      moneyboxQuoteUnit: 'KRW_PER_TWD',
      moneyboxTwdToKrw: 'amount * rates.TWD.sell',
    },
  } as const;
}
