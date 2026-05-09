/**
 * Rate Provider Ranking & Resolution（純函式 SSOT）
 *
 * Phase 1：本檔僅提供「排序」與「依偏好解析最終 provider」的純函式，
 * **不接 UI / store / hook**；當 `shouldEnableBankProviderChoice() === false`
 * 時 UI 不顯示 provider 選單與推薦入口，本檔仍可被未來 UI 與測試獨立使用。
 *
 * 對應設計文件：docs/superpowers/specs/2026-05-09-rate-provider-ssot-design.md
 *
 * 設計原則：
 * - 「最佳 (best)」定義為 `from -> to` 換算後的實際 `resultAmount` 最大者；
 *   不在此計算手續費，呼叫端可在 `unitRate` / `resultAmount` 已套用對應調整。
 * - 不可用 (`isAvailable === false`) 的 provider 不參與最佳推薦排序；
 *   呼叫端可獨立顯示為「不可用」狀態，本檔不做 UI 假設。
 * - 沒有任何可用 provider → fallback 到 `getDefaultProvider('bank')`；
 *   若 registry 嚴重異常（理論上不會發生），退回硬編碼 `{ bot, bank }`，
 *   保證返回值永遠是合法的 ResolvedRateProvider。
 */

import { getDefaultProvider, isProviderSupportedForCurrency } from '../../config/rateProviders';
import type { CurrencyCode, RateType } from './types';
import type {
  ProviderSelectionMode,
  RateProviderId,
  RateProviderPreference,
  RateProviderRef,
  RateSourceKind,
  ResolvedRateProvider,
} from './rateProviderTypes';

/**
 * 單一 provider 的報價快照。
 *
 * - `provider`：報價來源（sourceKind + providerId）。
 * - `unitRate`：對應 `rateType` 的單位匯率（例如 1 USD = 31.2 TWD 即 31.2）。
 * - `resultAmount`：呼叫端依 `amount * unitRate` 已換算好的金額；
 *   排序以此值為基準（避免每個排序點重複乘除）。
 * - `isAvailable`：是否有有效報價（缺資料、超時、不支援幣別等皆為 false）。
 */
export interface ProviderQuote {
  provider: RateProviderRef;
  rateType: RateType;
  sourceKind: RateSourceKind;
  unitRate: number;
  resultAmount: number;
  isAvailable: boolean;
}

/**
 * `rankProviderQuotes` 的輸入。
 *
 * `amount` / `from` / `to` / `rateType` 屬於前向相容欄位：Phase 1 排序僅依
 * `resultAmount`，但保留語意欄位讓未來擴充（例如手續費調整、跨幣別矯正）
 * 不需要再變動函式簽章。
 */
export interface RankInput {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  quotes: readonly ProviderQuote[];
}

/**
 * 將 quotes 依「實際 resultAmount」由大到小排序，並過濾 `isAvailable=false`。
 *
 * 行為摘要：
 * 1. 過濾掉不可用 quote。
 * 2. 依 `resultAmount` 由大到小排序（最大 = 最佳）。
 * 3. tie 時維持輸入順序（穩定排序，保留呼叫端先後語意）。
 * 4. 不修改原 quotes 陣列。
 *
 * @returns 僅含可用 quote 的新陣列；無候選時回 `[]`。
 */
export function rankProviderQuotes(input: RankInput): ProviderQuote[] {
  const available = input.quotes.filter((quote) => quote.isAvailable);
  // 用 index 作為 tie-breaker，避免依賴 V8 stable sort 行為（雖然 ES2019 已保證穩定）。
  return available
    .map((quote, index) => ({ quote, index }))
    .sort((a, b) => {
      if (b.quote.resultAmount !== a.quote.resultAmount) {
        return b.quote.resultAmount - a.quote.resultAmount;
      }
      return a.index - b.index;
    })
    .map(({ quote }) => quote);
}

/** `resolveProviderPreference` 的輸入。 */
export interface ResolvePreferenceInput {
  preference: RateProviderPreference;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  quotes: readonly ProviderQuote[];
}

/**
 * 依使用者偏好（`mode='manual' | 'best'`）解析最終 provider，附上決策 `reason`。
 *
 * 行為摘要：
 * - `mode='manual'`
 *   - 沒有 `manualProvider` → 退回預設，`reason='fallback-default'`。
 *   - 有 `manualProvider` 但 provider 不支援目前幣別組合（例如 moneybox + USD）→
 *     退回預設，`reason='unsupported-pair'`。
 *   - 其餘情境（支援的 pair；不論是否有 quote）→ 採用使用者選擇，`reason='manual'`。
 * - `mode='best'`
 *   - 有可用 quote → 取 ranked 第一名，`reason='best-rate'`。
 *   - 無可用 quote → 退回預設，`reason='fallback-default'`。
 *
 * 退化保護：若 `getDefaultProvider('bank')` 嚴重異常回 null，硬退回
 * `{ bot, bank }`，保證返回值永遠合法（避免上層需要再做 null 處理）。
 */
export function resolveProviderPreference(input: ResolvePreferenceInput): ResolvedRateProvider {
  const { preference, from, to } = input;
  const selectionMode: ProviderSelectionMode = preference.mode;

  if (preference.mode === 'manual') {
    const manualProvider = preference.manualProvider;
    if (!manualProvider) {
      return buildFallbackDefault(selectionMode);
    }
    if (!isProviderSupportedForPair(manualProvider.providerId, from, to)) {
      return buildFallbackDefault(selectionMode, 'unsupported-pair');
    }
    return {
      selectionMode,
      sourceKind: manualProvider.sourceKind,
      providerId: manualProvider.providerId,
      reason: 'manual',
    };
  }

  // mode === 'best'
  const ranked = rankProviderQuotes({
    amount: 0,
    from: input.from,
    to: input.to,
    rateType: input.rateType,
    quotes: input.quotes,
  });
  const top = ranked[0];
  if (top) {
    return {
      selectionMode,
      sourceKind: top.provider.sourceKind,
      providerId: top.provider.providerId,
      reason: 'best-rate',
    };
  }
  return buildFallbackDefault(selectionMode);
}

/**
 * 內部用：判斷 provider 是否支援整個幣別 pair。
 *
 * 規則（對齊 Phase 1 換錢所 UX）：
 * - 通用 provider（`bot`，supportedCurrencies='all'）→ 任何 pair 都支援。
 * - 限定 provider（如 `moneybox`，supportedCurrencies=['KRW']）：
 *   - TWD 視為「本地幣」（home currency），不需在清單內。
 *   - pair 中的「非 TWD 那一端」必須在 `supportedCurrencies` 內。
 *   - 因此 KRW↔TWD 支援；USD↔TWD 不支援；KRW↔USD 也不支援
 *     （兩端都不是 TWD，限定 provider 無法服務）。
 * - 未知 providerId → false（防呆）。
 *
 * 不放在 `rateProviders.ts` 是因為「pair」語意只適用於排序/解析路徑，
 * 與 registry 提供的單幣別查詢職責不同。
 */
function isProviderSupportedForPair(
  providerId: RateProviderId,
  from: CurrencyCode,
  to: CurrencyCode,
): boolean {
  const HOME_CURRENCY: CurrencyCode = 'TWD';
  // 'all' provider：透過任一端的查詢即可確認（兩端皆會回 true）。
  if (
    isProviderSupportedForCurrency(providerId, from) &&
    isProviderSupportedForCurrency(providerId, to)
  ) {
    return true;
  }
  // 限定 provider：pair 必須含 TWD，且非 TWD 那一端在 supportedCurrencies 內。
  const fromIsHome = from === HOME_CURRENCY;
  const toIsHome = to === HOME_CURRENCY;
  if (!fromIsHome && !toIsHome) {
    return false;
  }
  const foreign = fromIsHome ? to : from;
  return isProviderSupportedForCurrency(providerId, foreign);
}

/**
 * 內部用：產生退回預設 bank provider 的 ResolvedRateProvider。
 *
 * `reason` 預設為 `'fallback-default'`；當呼叫端為 manual + unsupported pair 時
 * 應傳入 `'unsupported-pair'`。registry 異常（理論上不會發生）時硬退到 `{bot, bank}`。
 */
function buildFallbackDefault(
  selectionMode: ProviderSelectionMode,
  reason: ResolvedRateProvider['reason'] = 'fallback-default',
): ResolvedRateProvider {
  const fallback = getDefaultProvider('bank');
  if (!fallback) {
    return {
      selectionMode,
      sourceKind: 'bank',
      providerId: 'bot',
      reason,
    };
  }
  return {
    selectionMode,
    sourceKind: fallback.sourceKind,
    providerId: fallback.id,
    reason,
  };
}
