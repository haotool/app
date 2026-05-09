/**
 * Rate Provider Menu（Phase 2 預留 UI；Phase 1 不會渲染）
 *
 * Phase Gate：`shouldEnableBankProviderChoice() === false` 時整個元件不渲染。
 * 目前只有台灣銀行 (`bot`) 一家銀行，因此 Phase 1 中此元件永遠 return null。
 *
 * 設計原則（對齊 docs/superpowers/specs/2026-05-09-rate-provider-ssot-design.md §UI Contract）：
 * - 主畫面只顯示 resolved provider 的匯率；本選單不負責顯示匯率，只負責切換來源。
 * - 推薦最佳（`best` 模式）放第一順位，後接銀行清單與換錢所清單。
 * - 觸發 callback 時提供完整 `RateProviderRef`，由上層轉成 `setProviderPreference` 呼叫。
 */

import { useMemo } from 'react';
import {
  getProvidersBySourceKind,
  shouldEnableBankProviderChoice,
  type RateProviderConfig,
} from '../../../config/rateProviders';
import type { ProviderSelectionMode, RateProviderRef, RateSourceKind } from '../rateProviderTypes';

export interface RateProviderMenuProps {
  /**
   * 目前實際採用的 provider（用於高亮）；通常傳 `resolvedProvider` 投影出的 ref，
   * 在 `mode='best'` 時可省略，元件會以 `selectionMode==='best'` 高亮推薦項。
   */
  selectedRef?: RateProviderRef;
  /** 目前選擇模式（`'best'` | `'manual'`）。 */
  selectionMode: ProviderSelectionMode;
  /** 切換為 `best` 模式（多銀行推薦），Phase 2 才會啟用 callback。 */
  onSelectBest?: () => void;
  /** 指定某 provider（`manual` 模式），Phase 2 才會啟用 callback。 */
  onSelectProvider?: (ref: RateProviderRef) => void;
  /** 自訂 i18n 標籤，方便上層集中管理文案（Phase 2 接線時再補）。 */
  labels?: {
    bestRecommendation?: string;
    menuAriaLabel?: string;
  };
}

const DEFAULT_LABELS = {
  bestRecommendation: '推薦最佳',
  menuAriaLabel: '匯率來源 provider 選單',
} as const;

/**
 * 將 provider 列表渲染為一組 `menuitemradio`。
 *
 * 抽出純呈現函式以利 Phase 2 加入更複雜的群組標題或圖示，而不污染主元件邏輯。
 */
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

  // Phase Gate：Phase 1 永遠回 null（getProvidersBySourceKind('bank').length === 1）
  // Phase 2 銀行 provider > 1 時才會渲染選單；保持 Phase 1 UX 不變動。
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
