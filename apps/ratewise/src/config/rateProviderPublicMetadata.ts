import type { CurrencyCode, RateType } from '../features/ratewise/types';
import type { ProviderSelectionMode } from '../features/ratewise/rateProviderTypes';
import {
  getAllRateProviders,
  getDefaultProvider,
  shouldEnableBankProviderChoice,
} from './rateProviders.ts';

export interface PublicRateProviderMetadataOptions {
  dataBaseUrl: string;
  cdnBaseUrl?: string;
  supportedCurrencies: readonly CurrencyCode[] | readonly string[];
  historyDateToken?: string;
}

export interface PublicRateProviderMetadata {
  providerSelection: {
    bankProviderChoiceEnabled: boolean;
    activationRule: string;
    currentBankProviderId: string | null;
    currentExchangeShopProviderId: string | null;
    supportedSelectionModes: ProviderSelectionMode[];
    currentSelectionMode: ProviderSelectionMode;
  };
  providers: PublicRateProvider[];
}

/** 公開 API 僅暴露資料 provider；刷卡估算為虛擬 provider（ADR-002），不進公開 metadata。 */
export type PublicRateSourceKind = 'bank' | 'exchange-shop';

const isPublicSourceKind = (kind: string): kind is PublicRateSourceKind =>
  kind === 'bank' || kind === 'exchange-shop';

export interface PublicRateProvider {
  providerId: string;
  sourceKind: PublicRateSourceKind;
  name: string;
  shortName: string;
  supportedCurrencies: string[];
  supportedRateTypes: RateType[];
  currentEndpoint: string;
  historyEndpoint: string;
  cdnCurrentEndpoint?: string;
  cdnHistoryEndpoint?: string;
}

export function buildPublicRateProviderMetadata(
  options: PublicRateProviderMetadataOptions,
): PublicRateProviderMetadata {
  const historyDateToken = options.historyDateToken ?? '{YYYY-MM-DD}';
  const allSupportedCurrencies = options.supportedCurrencies.map(String);

  return {
    providerSelection: {
      bankProviderChoiceEnabled: shouldEnableBankProviderChoice(),
      activationRule: 'Enable bank provider choice when bank provider count is greater than 1',
      currentBankProviderId: getDefaultProvider('bank')?.id ?? null,
      currentExchangeShopProviderId: getDefaultProvider('exchange-shop')?.id ?? null,
      supportedSelectionModes: ['manual', 'best'],
      currentSelectionMode: 'manual',
    },
    providers: getAllRateProviders().flatMap((provider): PublicRateProvider[] => {
      const sourceKind = provider.sourceKind;
      if (!isPublicSourceKind(sourceKind)) return [];
      const currentPath = provider.apiPaths.latest;
      const historyPath = provider.apiPaths.history.replace('{YYYY-MM-DD}', historyDateToken);
      return [
        {
          providerId: provider.id,
          sourceKind,
          name: provider.label,
          shortName: provider.shortLabel,
          supportedCurrencies:
            provider.supportedCurrencies === 'all'
              ? allSupportedCurrencies
              : provider.supportedCurrencies.map(String),
          supportedRateTypes: [...provider.supportedRateTypes],
          currentEndpoint: joinEndpoint(options.dataBaseUrl, currentPath),
          historyEndpoint: joinEndpoint(options.dataBaseUrl, historyPath),
          ...(options.cdnBaseUrl
            ? {
                cdnCurrentEndpoint: joinEndpoint(options.cdnBaseUrl, currentPath),
                cdnHistoryEndpoint: joinEndpoint(options.cdnBaseUrl, historyPath),
              }
            : {}),
        },
      ];
    }),
  };
}

function joinEndpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
