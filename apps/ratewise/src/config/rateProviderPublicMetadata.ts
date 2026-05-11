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

export interface PublicRateProvider {
  providerId: string;
  sourceKind: 'bank' | 'exchange-shop';
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
    providers: getAllRateProviders().map((provider) => {
      const currentPath = provider.apiPaths.latest;
      const historyPath = provider.apiPaths.history.replace('{YYYY-MM-DD}', historyDateToken);
      return {
        providerId: provider.id,
        sourceKind: provider.sourceKind,
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
      };
    }),
  };
}

function joinEndpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
