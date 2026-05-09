/**
 * Rate Provider Registry SSOT
 *
 * 集中管理「具體 provider 的 metadata」（顯示名稱、支援匯率類型、支援幣別、優先順序、預設旗標）。
 * 對應設計：docs/superpowers/specs/2026-05-09-rate-provider-ssot-design.md
 *
 * 分工：
 * - `rateProviders.ts`（本檔）：provider metadata SSOT，所有新邏輯查 provider label / 支援關係先來這裡。
 * - `exchangeShopProviders.ts`：換錢所**資料層**SSOT（CDN URL、欄位解析、fallback 匯率）。
 *
 * 目前 metadata 與資料層在「label / shortLabel / supportedCurrencies」上仍存在輕度重複，但已透過
 * `EXCHANGE_SHOP_PROVIDERS` keys 取得 supportedCurrencies，避免兩處需要手動同步幣別清單；其他欄位
 * 維持一致以利 Phase 1 漸進遷移，未來可在 Task 5/6 完成 UI 接線後再做最終 dedupe。
 */

import type { CurrencyCode, RateType } from '../features/ratewise/types';
import type { RateProviderId, RateSourceKind } from '../features/ratewise/rateProviderTypes';
import { getSupportedExchangeShopCurrencies } from './exchangeShopProviders';

/**
 * Provider 設定。
 *
 * - `supportedCurrencies = 'all'`：通用 provider（例如台銀對所有支援幣別都有牌告）。
 * - `supportedCurrencies = CurrencyCode[]`：限定 provider（例如換錢所目前僅支援 KRW）。
 * - `priority`：用於排序與顯示優先級；數值越大越優先。
 * - `isDefault`：同一 sourceKind 內最多一個 `isDefault=true` 的 provider，用於 fallback。
 */
export interface RateProviderConfig {
  id: RateProviderId;
  sourceKind: RateSourceKind;
  /** UI 完整顯示名稱（例如「台灣銀行」、「明洞換匯所」） */
  label: string;
  /** UI 緊湊顯示名稱（例如「台銀」、「MoneyBox」） */
  shortLabel: string;
  /** 支援的匯率類型 */
  supportedRateTypes: readonly RateType[];
  /** 'all' = 通用；陣列 = 僅支援列出的幣別 */
  supportedCurrencies: 'all' | readonly CurrencyCode[];
  /** 優先順序（越大越優先） */
  priority: number;
  /** 是否為該 sourceKind 的預設 provider（同 sourceKind 內最多一個 true） */
  isDefault: boolean;
}

/**
 * Phase 1 provider registry。
 *
 * 後續若新增 provider（例如其他銀行或換錢所），只需在此追加一筆設定，
 * 並確保資料層（如 exchange-shop 的 CDN URL 解析）也同步補齊。
 */
export const RATE_PROVIDERS: Readonly<Record<'bot' | 'moneybox', RateProviderConfig>> = {
  bot: {
    id: 'bot',
    sourceKind: 'bank',
    label: '台灣銀行',
    shortLabel: '台銀',
    supportedRateTypes: ['spot', 'cash'],
    supportedCurrencies: 'all',
    priority: 100,
    isDefault: true,
  },
  moneybox: {
    id: 'moneybox',
    sourceKind: 'exchange-shop',
    label: '明洞換匯所',
    shortLabel: 'MoneyBox',
    supportedRateTypes: ['cash'],
    // 從換錢所資料層 SSOT 推導，避免兩處手動同步幣別清單
    supportedCurrencies: getSupportedExchangeShopCurrencies(),
    priority: 10,
    isDefault: true,
  },
} as const;

/**
 * 依 providerId 取得 provider config。
 *
 * 未知 providerId 回 `null`（讓上層用顯式分支處理 fallback）。
 */
export function getRateProvider(providerId: RateProviderId): RateProviderConfig | null {
  // RateProviderId 為字串聯集，未在 registry 中的字串需要回 null（不要走 type 強轉）。
  const provider = (RATE_PROVIDERS as Record<string, RateProviderConfig | undefined>)[
    providerId as string
  ];
  return provider ?? null;
}

/**
 * 依 sourceKind 取得所有 provider，回傳結果按 priority 由大到小排序。
 *
 * Phase 1 banks 只有 `bot`、shops 只有 `moneybox`；後續新增 provider 會自動納入。
 */
export function getProvidersBySourceKind(sourceKind: RateSourceKind): RateProviderConfig[] {
  return Object.values(RATE_PROVIDERS)
    .filter((provider) => provider.sourceKind === sourceKind)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * 取得指定 sourceKind 的預設 provider（`isDefault=true`），找不到回 `null`。
 *
 * 設定上同一 sourceKind 最多只應有一個 `isDefault=true` 的 provider；
 * 若意外出現多筆，回傳第一個（已先按 priority 排序，避免行為依輸入順序而漂移）。
 */
export function getDefaultProvider(sourceKind: RateSourceKind): RateProviderConfig | null {
  const providers = getProvidersBySourceKind(sourceKind);
  return providers.find((provider) => provider.isDefault) ?? null;
}

/**
 * 判斷 provider 是否支援某幣別。
 *
 * - `supportedCurrencies = 'all'` → 永遠回 true。
 * - 陣列 → 檢查成員。
 * - 未知 providerId → 回 false（防呆）。
 */
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

/**
 * 是否啟用「銀行 provider 選單」UI。
 *
 * Phase 1 條件：`getProvidersBySourceKind('bank').length > 1`。
 * 目前只有台灣銀行 (`bot`) 一家銀行，因此回 `false`，UI 不顯示銀行選單與推薦入口。
 */
export function shouldEnableBankProviderChoice(): boolean {
  return getProvidersBySourceKind('bank').length > 1;
}
