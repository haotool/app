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

export function enrichRateTypeBlock(
  block: LegacyRateTypeBlock,
  currency: string,
  rateType: ApiSemanticRateType,
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
  };
}

export function enrichCurrencyDetail(
  currency: string,
  detail: LegacyCurrencyDetail,
): SemanticCurrencyDetail {
  return {
    ...(detail.name !== undefined ? { name: detail.name } : {}),
    spot: enrichRateTypeBlock(detail.spot, currency, 'spot'),
    cash: enrichRateTypeBlock(detail.cash, currency, 'cash'),
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

export function buildSemanticFieldMapping() {
  return {
    schemaVersion: API_SEMANTICS_SCHEMA_VERSION,
    semanticsDoc: API_SEMANTICS_DOC.publicUrl,
    asOfSourceField: 'timestamp | updateTime',
    fields: {
      customerBuyForeignRate: {
        legacyPath: 'details.{CURRENCY}.{rateType}.sell',
        description: '客戶用 TWD 買外幣（銀行賣出）',
      },
      customerSellForeignRate: {
        legacyPath: 'details.{CURRENCY}.{rateType}.buy',
        description: '客戶用外幣賣回 TWD（銀行買入）',
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
  } as const;
}
