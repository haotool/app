/**
 * Rate Provider 領域型別（SSOT）
 *
 * 收斂匯率「來源類型 (sourceKind)」與「具體 provider」的單一事實來源。
 * 對應設計文件：docs/superpowers/specs/2026-05-09-rate-provider-ssot-design.md
 *
 * 命名約定：
 * - sourceKind：抽象來源類型（銀行 vs 換錢所），對應原本的 legacy RateSource。
 * - providerId：具體服務商識別字串（'bot' 為台灣銀行，'moneybox' 為換錢所等）。
 * - 新邏輯一律使用 RateProviderRef = sourceKind + providerId 表達「目前在用哪個 provider」，
 *   不再用 legacy `RateSource` 表達 provider 身分。
 */

import type { RateSource } from './types';

/** 抽象的匯率來源類型；與 legacy `RateSource` 字面值等價，作為新 SSOT 的型別別名。 */
export type RateSourceKind = 'bank' | 'exchange-shop';

/**
 * Provider 識別字串。
 *
 * - 已知值：`'bot'`（台灣銀行）、`'moneybox'`（換錢所）。
 * - 字串聯集允許未來擴充新的 provider 而不必改動型別定義；新值仍應由 provider registry 統一管理。
 */
export type RateProviderId = 'bot' | 'moneybox' | (string & {});

/** 使用者選擇模式：自動取最佳價（best）或手動指定 provider（manual）。 */
export type ProviderSelectionMode = 'best' | 'manual';

/** 對「目前使用哪個 provider」的明確指涉。 */
export interface RateProviderRef {
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
}

/** 使用者層級的 provider 偏好設定，會落地到 storage。 */
export interface RateProviderPreference {
  mode: ProviderSelectionMode;
  /** 僅在 mode === 'manual' 時有意義；mode === 'best' 時應為 undefined。 */
  manualProvider?: RateProviderRef;
}

/**
 * 系統最終解析後實際採用的 provider，附帶決策原因，方便 UI 顯示與 debug。
 *
 * `reason`：
 * - `'manual'`：使用者手動指定。
 * - `'best-rate'`：自動模式下挑到最佳匯率。
 * - `'fallback-default'`：自動模式但暫無候選，退回預設 provider。
 * - `'unsupported-pair'`：所選 provider 不支援目前幣別組合，已退回預設。
 */
export interface ResolvedRateProvider {
  selectionMode: ProviderSelectionMode;
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
  reason: 'manual' | 'best-rate' | 'fallback-default' | 'unsupported-pair';
}

/** 各 sourceKind 對應的預設 providerId（用於 legacy → ref 的補值）。 */
const DEFAULT_PROVIDER_BY_SOURCE: Record<RateSourceKind, RateProviderId> = {
  bank: 'bot',
  'exchange-shop': 'moneybox',
};

/**
 * 將新版 `RateProviderRef` 投影回 legacy `RateSource`。
 *
 * 僅讀取 `sourceKind`，忽略 `providerId`；用於尚未遷移到 provider 概念的 UI 分支。
 */
export function toLegacyRateSource(ref: RateProviderRef): RateSource {
  return ref.sourceKind;
}

/**
 * 將 legacy `RateSource` 補成完整 `RateProviderRef`（使用該 sourceKind 的預設 provider）。
 *
 * 用於從舊 storage 值或舊狀態漸進遷移到新的 provider SSOT。
 */
export function fromLegacyRateSource(rateSource: RateSource): RateProviderRef {
  return {
    sourceKind: rateSource,
    providerId: DEFAULT_PROVIDER_BY_SOURCE[rateSource],
  };
}
