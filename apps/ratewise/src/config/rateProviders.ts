import type { CurrencyCode, RateSource, RateType } from '../features/ratewise/types';
import type {
  RateProviderId,
  RateProviderRef,
  RateSourceKind,
} from '../features/ratewise/rateProviderTypes';
import { getSupportedExchangeShopCurrencies } from './exchangeShopProviders.ts';
import { PROVIDER_RATES_PATH } from './api-endpoints.ts';
import { DEFAULT_RATE_TYPE } from '../features/ratewise/constants.ts';

export interface RateProviderConfig {
  id: RateProviderId;
  sourceKind: RateSourceKind;
  label: string;
  shortLabel: string;
  supportedRateTypes: readonly RateType[];
  supportedCurrencies: 'all' | readonly CurrencyCode[];
  apiPaths: {
    latest: string;
    history: string;
  };
  priority: number;
  isDefault: boolean;
}

export const RATE_PROVIDERS = {
  bot: {
    id: 'bot',
    sourceKind: 'bank',
    label: '台灣銀行',
    shortLabel: '台銀',
    supportedRateTypes: ['spot', 'cash'],
    supportedCurrencies: 'all',
    apiPaths: {
      latest: 'latest.json',
      history: 'history/{YYYY-MM-DD}.json',
    },
    priority: 100,
    isDefault: true,
  },
  moneybox: {
    id: 'moneybox',
    sourceKind: 'exchange-shop',
    label: '明洞換匯所',
    shortLabel: 'MoneyBox',
    supportedRateTypes: ['cash'],
    supportedCurrencies: getSupportedExchangeShopCurrencies(),
    apiPaths: {
      latest: PROVIDER_RATES_PATH.latest('moneybox').replace('/public/rates/', ''),
      history: PROVIDER_RATES_PATH.history('moneybox', '{YYYY-MM-DD}').replace(
        '/public/rates/',
        '',
      ),
    },
    priority: 10,
    isDefault: true,
  },
} as const satisfies Readonly<Record<string, RateProviderConfig>>;

export function getAllRateProviders(): RateProviderConfig[] {
  return Object.values(RATE_PROVIDERS).sort((a, b) => {
    if (a.sourceKind !== b.sourceKind) {
      return a.sourceKind.localeCompare(b.sourceKind);
    }
    return b.priority - a.priority;
  });
}

export function getRateProvider(providerId: RateProviderId): RateProviderConfig | null {
  const provider = (RATE_PROVIDERS as Record<string, RateProviderConfig | undefined>)[providerId];
  return provider ?? null;
}

export function getProvidersBySourceKind(sourceKind: RateSourceKind): RateProviderConfig[] {
  return getAllRateProviders().filter((provider) => provider.sourceKind === sourceKind);
}

export function getDefaultProvider(sourceKind: RateSourceKind): RateProviderConfig | null {
  const providers = getProvidersBySourceKind(sourceKind);
  return providers.find((provider) => provider.isDefault) ?? null;
}

export function getProviderPrimaryRateType(provider: RateProviderConfig): RateType {
  return provider.supportedRateTypes[0] ?? DEFAULT_RATE_TYPE;
}

/**
 * 刷卡估算虛擬 provider（ADR-002 Phase 1）：非資料 provider（無 API endpoint），
 * 不進 RATE_PROVIDERS registry，避免污染公開 API metadata 與 OpenData 頁（flag off 零暴露）。
 * 估算基準取自台銀牌告，僅涉及 TWD 的貨幣對可用（刷卡帳單以 TWD 清算）。
 */
export const CARD_ESTIMATE_PROVIDER_ID = 'card-estimate' as const;

export const CARD_ESTIMATE_PROVIDER_REF: RateProviderRef = {
  sourceKind: 'card',
  providerId: CARD_ESTIMATE_PROVIDER_ID,
};

export function getDefaultProviderRef(sourceKind: RateSourceKind): RateProviderRef {
  if (sourceKind === 'card') {
    return CARD_ESTIMATE_PROVIDER_REF;
  }
  const provider = getDefaultProvider(sourceKind);
  if (!provider) {
    throw new Error(`Missing default rate provider for ${sourceKind}`);
  }
  return {
    sourceKind: provider.sourceKind,
    providerId: provider.id,
  };
}

export function fromLegacyRateSource(rateSource: RateSource): RateProviderRef {
  return getDefaultProviderRef(rateSource);
}

export function resolveRateTypeForSource(
  sourceKind: RateSourceKind,
  requestedRateType: RateType,
): RateType {
  // 刷卡估算基準固定即期賣出（ADR-002 SSOT）：card 為 registry 外虛擬 provider，
  // getDefaultProvider 查無會隱式放行 persisted rateType（如 cash 高估 1–2%），故特例正規化。
  // 即期缺失回落現金由引擎賣出腿 fallback 處理（KRW 情境不變）。
  if (sourceKind === 'card') {
    return 'spot';
  }
  const provider = getDefaultProvider(sourceKind);
  if (!provider) {
    return requestedRateType;
  }
  return provider.supportedRateTypes.includes(requestedRateType)
    ? requestedRateType
    : getProviderPrimaryRateType(provider);
}

export function isProviderSupportedForCurrency(
  providerId: RateProviderId,
  currency: CurrencyCode,
): boolean {
  const provider = getRateProvider(providerId);
  if (!provider) {
    return false;
  }
  if (provider.supportedCurrencies === 'all') {
    return true;
  }
  return provider.supportedCurrencies.includes(currency);
}

export function shouldEnableBankProviderChoice(): boolean {
  return getProvidersBySourceKind('bank').length > 1;
}
