import { useMemo } from 'react';
import {
  getProvidersBySourceKind,
  shouldEnableBankProviderChoice,
  type RateProviderConfig,
} from '../../../config/rateProviders';
import type { ProviderSelectionMode, RateProviderRef, RateSourceKind } from '../rateProviderTypes';

export interface RateProviderMenuProps {
  selectedRef?: RateProviderRef;
  selectionMode: ProviderSelectionMode;
  onSelectBest?: () => void;
  onSelectProvider?: (ref: RateProviderRef) => void;
  labels?: {
    bestRecommendation?: string;
    menuAriaLabel?: string;
  };
}

const DEFAULT_LABELS = {
  bestRecommendation: '推薦最佳',
  menuAriaLabel: '匯率來源 provider 選單',
} as const;

function renderProviderItems(args: {
  providers: RateProviderConfig[];
  sourceKind: RateSourceKind;
  selectionMode: ProviderSelectionMode;
  selectedRef?: RateProviderRef;
  onSelectProvider?: (ref: RateProviderRef) => void;
}) {
  const { providers, sourceKind, selectionMode, selectedRef, onSelectProvider } = args;
  return providers.map((provider) => {
    const isChecked =
      selectionMode === 'manual' &&
      selectedRef?.sourceKind === sourceKind &&
      selectedRef.providerId === provider.id;
    return (
      <button
        key={provider.id}
        type="button"
        role="menuitemradio"
        aria-checked={isChecked}
        onClick={() => onSelectProvider?.({ sourceKind, providerId: provider.id })}
        data-testid={`rate-provider-menu-item-${provider.id}`}
      >
        {provider.label}
      </button>
    );
  });
}

export function RateProviderMenu({
  selectedRef,
  selectionMode,
  onSelectBest,
  onSelectProvider,
  labels,
}: RateProviderMenuProps) {
  const isEnabled = shouldEnableBankProviderChoice();

  const banks = useMemo(() => (isEnabled ? getProvidersBySourceKind('bank') : []), [isEnabled]);
  const shops = useMemo(
    () => (isEnabled ? getProvidersBySourceKind('exchange-shop') : []),
    [isEnabled],
  );

  if (!isEnabled) return null;

  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div role="menu" aria-label={resolvedLabels.menuAriaLabel} data-testid="rate-provider-menu">
      <button
        type="button"
        role="menuitemradio"
        aria-checked={selectionMode === 'best'}
        onClick={() => onSelectBest?.()}
        data-testid="rate-provider-menu-item-best"
      >
        {resolvedLabels.bestRecommendation}
      </button>
      {renderProviderItems({
        providers: banks,
        sourceKind: 'bank',
        selectionMode,
        selectedRef,
        onSelectProvider,
      })}
      {renderProviderItems({
        providers: shops,
        sourceKind: 'exchange-shop',
        selectionMode,
        selectedRef,
        onSelectProvider,
      })}
    </div>
  );
}
