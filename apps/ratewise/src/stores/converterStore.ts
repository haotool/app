/**
 * Zustand 狀態管理 — 貨幣轉換器 Store
 *
 * 跨模組共用狀態（SSOT）：
 * - 貨幣選擇（fromCurrency、toCurrency）
 * - 轉換器模式（single / multi）
 * - 收藏貨幣
 * - 轉換歷史
 *
 * 功能：
 * - 透過 Zustand persist middleware 自動同步 localStorage
 * - TypeScript 型別安全
 * - 跨模組狀態共享，無需 prop drilling
 * - 從舊版個別 localStorage key 的一次性遷移
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConversionHistoryCategory,
  ConversionHistoryEntry,
  ConverterMode,
  ConverterV2Variant,
  CurrencyCode,
  RateMode,
  RateSource,
  RateType,
} from '../features/ratewise/types';
import type {
  ProviderSelectionMode,
  RateProviderPreference,
  RateProviderRef,
  RateSourceKind,
} from '../features/ratewise/rateProviderTypes';
import { fromLegacyRateSource, resolveRateTypeForSource } from '../config/rateProviders';
import {
  CARD_FEE_PERCENT_DEFAULT,
  clampCardFeePercent,
  CONVERTER_MODES,
  CONVERTER_V2_VARIANTS,
  CURRENCY_DEFINITIONS,
  DEFAULT_BASE_CURRENCY,
  DEFAULT_CONVERTER_MODE,
  DEFAULT_CONVERTER_V2_VARIANT,
  DEFAULT_FAVORITES,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_RATE_MODE,
  DEFAULT_RATE_SOURCE,
  DEFAULT_RATE_TYPE,
  DEFAULT_TO_CURRENCY,
  RATE_MODES,
  RATE_SOURCES,
  RATE_TYPES,
} from '../features/ratewise/constants';
import { CONVERTER_STORE_KEY, STORAGE_KEYS } from '../features/ratewise/storage-keys';

const DEFAULT_PROVIDER_PREFERENCE: RateProviderPreference = {
  mode: 'manual',
  manualProvider: fromLegacyRateSource(DEFAULT_RATE_SOURCE),
};

const VALID_SELECTION_MODES: ProviderSelectionMode[] = ['manual', 'best'];
const VALID_SOURCE_KINDS: readonly RateSourceKind[] = RATE_SOURCES;

// ── 有效貨幣代碼集合（模組載入時計算一次）────────────────────────────────────
const VALID_CODES = new Set(Object.keys(CURRENCY_DEFINITIONS));

const isCurrencyCode = (value: string): value is CurrencyCode => VALID_CODES.has(value);

// ── 舊版 key 名稱（僅用於一次性遷移）─────────────────────────────────────────
const LEGACY_KEYS = {
  FROM_CURRENCY: STORAGE_KEYS.FROM_CURRENCY,
  TO_CURRENCY: STORAGE_KEYS.TO_CURRENCY,
  MODE: STORAGE_KEYS.CURRENCY_CONVERTER_MODE,
  FAVORITES: STORAGE_KEYS.FAVORITES,
  RATE_TYPE: STORAGE_KEYS.RATE_TYPE,
  RATE_SOURCE: STORAGE_KEYS.RATE_SOURCE,
  CONVERTER_V2_FLAG: STORAGE_KEYS.CONVERTER_V2_FLAG,
} as const;

const HISTORY_CAPACITY = 50;
const LEGACY_HISTORY_STORAGE_KEY = STORAGE_KEYS.CONVERSION_HISTORY;

// ── Store 狀態介面 ───────────────────────────────────────────────────────────
interface ConverterState {
  // ── 持久化狀態 ──────────────────────────────────────────────────────────
  // 註：當前頁面 mode（single/multi）仍由 route 決定；lastConverterView 僅供冷啟動還原。
  /** 上次停留的換算模式（single / multi），供根路徑冷啟動還原。 */
  lastConverterView: ConverterMode;
  /**
   * 單幣別版面偏好（legacy 經典／v2 等值雙列），設定頁寫入。
   * 讀取端 SSOT 為 config/converter-v2-flag.ts（URL override > 本欄位 > 預設 legacy）。
   */
  singleConverterVariant: ConverterV2Variant;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rateMode: RateMode;
  rateType: RateType;
  rateSource: RateSource;
  providerPreference: RateProviderPreference;
  favorites: CurrencyCode[];
  history: ConversionHistoryEntry[];
  /** 多幣別模式的基準貨幣（使用者偏好，與 fromCurrency 隔離）。 */
  baseCurrency: CurrencyCode;
  /**
   * 刷卡估算功能開關（ADR-002 Phase 1）。
   * 讀取端 SSOT 為 config/card-rate-flag.ts（URL override > 本欄位 > 預設 off）。
   */
  cardRateEnabled: boolean;
  /** 刷卡估算海外手續費（百分比，0–3、步進 0.1、預設 1.5）。 */
  cardFeePercent: number;

  // ── Actions ──────────────────────────────────────────────────────────────
  setFromCurrency: (code: CurrencyCode) => void;
  setToCurrency: (code: CurrencyCode) => void;
  setRateMode: (rateMode: RateMode) => void;
  setRateType: (rateType: RateType) => void;
  setProviderPreference: (next: RateProviderPreference) => void;
  setRateSource: (rateSource: RateSource) => void;
  setBaseCurrency: (code: CurrencyCode) => void;
  swapCurrencies: () => void;

  /** 切換收藏狀態（immutable 更新） */
  toggleFavorite: (code: CurrencyCode) => void;
  /** 替換完整收藏列表（拖曳排序用） */
  reorderFavorites: (codes: CurrencyCode[]) => void;
  /** 檢查 `code` 是否在收藏列表中 */
  isFavorite: (code: CurrencyCode) => boolean;

  addToHistory: (entry: ConversionHistoryEntry) => void;
  clearHistory: () => void;

  /** 記錄使用者最後停留的換算模式（single / multi）。 */
  setLastConverterView: (view: ConverterMode) => void;

  /** 設定單幣別版面偏好（設定頁「單幣別模式」入口）。 */
  setSingleConverterVariant: (variant: ConverterV2Variant) => void;

  /** 設定刷卡估算功能開關。 */
  setCardRateEnabled: (enabled: boolean) => void;

  /** 設定刷卡估算手續費（自動夾限 0–3、對齊 0.1 步進）。 */
  setCardFeePercent: (percent: number) => void;

  /** 供單元測試呼叫；亦由 onRehydrateStorage 在內部觸發 */
  __migrateFromLegacy: () => void;
  /** hydrate 後驗證並修復不合法的欄位；由 onRehydrateStorage 自動觸發，亦可由單元測試直接呼叫 */
  __validateAndSanitize: () => void;
}

// ── Schema 驗證輔助函式 ───────────────────────────────────────────────────────

type PersistentFields = Pick<
  ConverterState,
  | 'lastConverterView'
  | 'singleConverterVariant'
  | 'fromCurrency'
  | 'toCurrency'
  | 'rateMode'
  | 'rateType'
  | 'rateSource'
  | 'providerPreference'
  | 'favorites'
  | 'baseCurrency'
  | 'cardRateEnabled'
  | 'cardFeePercent'
>;

const VALID_RATE_MODES: readonly RateMode[] = RATE_MODES;
const VALID_RATE_TYPES: readonly RateType[] = RATE_TYPES;
const VALID_RATE_SOURCES: readonly RateSource[] = RATE_SOURCES;

function deriveRateSourceFromPreference(preference: RateProviderPreference): RateSource {
  return preference.manualProvider?.sourceKind ?? DEFAULT_RATE_SOURCE;
}

const isSelectionMode = (value: unknown): value is ProviderSelectionMode =>
  typeof value === 'string' && (VALID_SELECTION_MODES as readonly string[]).includes(value);

const isSourceKind = (value: unknown): value is RateSourceKind =>
  typeof value === 'string' && (VALID_SOURCE_KINDS as readonly string[]).includes(value);

function sanitizeProviderPreference(value: unknown): RateProviderPreference {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_PROVIDER_PREFERENCE;
  }
  const candidate = value as { mode?: unknown; manualProvider?: unknown };
  const mode: ProviderSelectionMode = isSelectionMode(candidate.mode) ? candidate.mode : 'manual';

  let manualProvider: RateProviderRef | undefined;
  const manual = candidate.manualProvider;
  if (manual !== null && typeof manual === 'object') {
    const manualCandidate = manual as { sourceKind?: unknown; providerId?: unknown };
    const sourceKind = manualCandidate.sourceKind;
    const providerId = manualCandidate.providerId;
    if (isSourceKind(sourceKind) && typeof providerId === 'string' && providerId.length > 0) {
      manualProvider = { sourceKind, providerId };
    }
  }

  if (mode === 'manual' && !manualProvider) {
    return DEFAULT_PROVIDER_PREFERENCE;
  }

  return manualProvider ? { mode, manualProvider } : { mode };
}

/**
 * 驗證 hydrate 後的狀態欄位是否符合當前 schema 契約。
 * 若有欄位不合法（例如舊版 CurrencyPair 格式、損毀資料），回傳修復用的 patch；
 * 所有欄位均合法時回傳 null。
 */
function buildSanitizePatch(state: ConverterState): Partial<PersistentFields> | null {
  const patch: Partial<PersistentFields> = {};
  let dirty = false;

  if (!(CONVERTER_MODES as readonly string[]).includes(state.lastConverterView)) {
    patch.lastConverterView = DEFAULT_CONVERTER_MODE;
    dirty = true;
  }
  if (!(CONVERTER_V2_VARIANTS as readonly string[]).includes(state.singleConverterVariant)) {
    patch.singleConverterVariant = DEFAULT_CONVERTER_V2_VARIANT;
    dirty = true;
  }
  if (!isCurrencyCode(state.fromCurrency)) {
    patch.fromCurrency = DEFAULT_FROM_CURRENCY;
    dirty = true;
  }
  if (!isCurrencyCode(state.toCurrency)) {
    patch.toCurrency = DEFAULT_TO_CURRENCY;
    dirty = true;
  }
  if (!isCurrencyCode(state.baseCurrency)) {
    patch.baseCurrency = DEFAULT_BASE_CURRENCY;
    dirty = true;
  }
  if (!VALID_RATE_MODES.includes(state.rateMode)) {
    patch.rateMode = DEFAULT_RATE_MODE;
    dirty = true;
  }
  if (!VALID_RATE_TYPES.includes(state.rateType)) {
    patch.rateType = DEFAULT_RATE_TYPE;
    dirty = true;
  }
  if (!VALID_RATE_SOURCES.includes(state.rateSource)) {
    patch.rateSource = DEFAULT_RATE_SOURCE;
    dirty = true;
  }
  if (typeof state.cardRateEnabled !== 'boolean') {
    patch.cardRateEnabled = false;
    dirty = true;
  }
  if (clampCardFeePercent(state.cardFeePercent) !== state.cardFeePercent) {
    patch.cardFeePercent = clampCardFeePercent(state.cardFeePercent);
    dirty = true;
  }

  const sanitizedPreference = sanitizeProviderPreference(state.providerPreference);
  const preferenceChanged =
    JSON.stringify(sanitizedPreference) !== JSON.stringify(state.providerPreference);
  if (preferenceChanged) {
    patch.providerPreference = sanitizedPreference;
    dirty = true;
  }
  const derivedRateSource = deriveRateSourceFromPreference(sanitizedPreference);
  const currentRateSource = patch.rateSource ?? state.rateSource;
  if (derivedRateSource !== currentRateSource) {
    patch.rateSource = derivedRateSource;
    dirty = true;
  }

  const resolvedRateSource = patch.rateSource ?? state.rateSource;
  const resolvedRateType = patch.rateType ?? state.rateType;
  const providerRateType = resolveRateTypeForSource(resolvedRateSource, resolvedRateType);
  if (providerRateType !== resolvedRateType) {
    patch.rateType = providerRateType;
    dirty = true;
  }
  if (!Array.isArray(state.favorites)) {
    patch.favorites = [...DEFAULT_FAVORITES] as CurrencyCode[];
    dirty = true;
  } else {
    const hasInvalid = (state.favorites as unknown[]).some(
      (c) => typeof c !== 'string' || !isCurrencyCode(c),
    );
    const hasTWD = (state.favorites as unknown[]).includes('TWD');
    if (hasInvalid || hasTWD) {
      patch.favorites = (state.favorites as unknown[]).filter(
        (c): c is CurrencyCode => typeof c === 'string' && isCurrencyCode(c) && c !== 'TWD',
      );
      dirty = true;
    }
  }

  return dirty ? patch : null;
}

// ── 遷移輔助函式 ─────────────────────────────────────────────────────────────

function buildMigrationPatch(state: ConverterState): Partial<PersistentFields> | null {
  if (typeof window === 'undefined') return null;

  const patch: Partial<PersistentFields> = {};

  const oldRateType = window.localStorage.getItem(LEGACY_KEYS.RATE_TYPE);
  if (
    typeof oldRateType === 'string' &&
    (VALID_RATE_TYPES as readonly string[]).includes(oldRateType)
  ) {
    patch.rateType = oldRateType as RateType;
  }
  const oldRateSource = window.localStorage.getItem(LEGACY_KEYS.RATE_SOURCE);
  if (oldRateSource === 'bank' || oldRateSource === 'exchange-shop') {
    patch.rateSource = oldRateSource;
  }
  if (patch.rateSource) {
    patch.rateType = resolveRateTypeForSource(patch.rateSource, patch.rateType ?? state.rateType);
  }

  // wave-A converter-v2 flag 獨立 key 一次性併入 store（設定頁 SSOT 遷移安全）。
  const oldConverterV2 = window.localStorage.getItem(LEGACY_KEYS.CONVERTER_V2_FLAG);
  if (
    typeof oldConverterV2 === 'string' &&
    (CONVERTER_V2_VARIANTS as readonly string[]).includes(oldConverterV2)
  ) {
    patch.singleConverterVariant = oldConverterV2 as ConverterV2Variant;
  }

  const hasPersistedPreference =
    typeof state.providerPreference === 'object' && state.providerPreference !== null;
  if (patch.rateSource) {
    patch.providerPreference = {
      mode: 'manual',
      manualProvider: fromLegacyRateSource(patch.rateSource),
    };
  } else if (!hasPersistedPreference) {
    patch.providerPreference = {
      mode: 'manual',
      manualProvider: fromLegacyRateSource(state.rateSource),
    };
  }

  if (window.localStorage.getItem(CONVERTER_STORE_KEY) === null) {
    const oldFrom = window.localStorage.getItem(LEGACY_KEYS.FROM_CURRENCY);
    const oldTo = window.localStorage.getItem(LEGACY_KEYS.TO_CURRENCY);
    const oldFavoritesRaw = window.localStorage.getItem(LEGACY_KEYS.FAVORITES);
    const oldMode = window.localStorage.getItem(LEGACY_KEYS.MODE);

    if (oldFrom && isCurrencyCode(oldFrom)) patch.fromCurrency = oldFrom;
    if (oldTo && isCurrencyCode(oldTo)) patch.toCurrency = oldTo;
    // 當前頁面 mode 仍由 route 決定；但 legacy mode 對應「上次停留模式」，遷移至 lastConverterView 以保留冷啟動還原偏好。
    if ((CONVERTER_MODES as readonly string[]).includes(oldMode ?? '')) {
      patch.lastConverterView = oldMode as ConverterMode;
    }

    if (oldFavoritesRaw) {
      const oldFavorites = parseLegacyFavorites(oldFavoritesRaw);
      if (oldFavorites) patch.favorites = oldFavorites;
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

function parseLegacyFavorites(raw: string): CurrencyCode[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((c): c is CurrencyCode => typeof c === 'string' && isCurrencyCode(c));
  } catch {
    return null;
  }
}

function removeLegacyKeys(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_KEYS.FROM_CURRENCY);
  window.localStorage.removeItem(LEGACY_KEYS.TO_CURRENCY);
  window.localStorage.removeItem(LEGACY_KEYS.MODE);
  window.localStorage.removeItem(LEGACY_KEYS.FAVORITES);
  window.localStorage.removeItem(LEGACY_KEYS.RATE_TYPE);
  window.localStorage.removeItem(LEGACY_KEYS.RATE_SOURCE);
  window.localStorage.removeItem(LEGACY_KEYS.CONVERTER_V2_FLAG);
}

function migrateLegacyHistory(state: ConverterState): ConversionHistoryEntry[] | null {
  if (typeof window === 'undefined') return null;
  if (state.history.length > 0) return null;

  const raw = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const migrated: ConversionHistoryEntry[] = [];
    for (const item of parsed as unknown[]) {
      if (typeof item !== 'object' || item === null) continue;
      const entry = item as Partial<ConversionHistoryEntry>;
      if (
        typeof entry.from !== 'string' ||
        typeof entry.to !== 'string' ||
        !isCurrencyCode(entry.from) ||
        !isCurrencyCode(entry.to) ||
        typeof entry.timestamp !== 'number'
      ) {
        continue;
      }
      migrated.push({
        from: entry.from,
        to: entry.to,
        amount: typeof entry.amount === 'string' ? entry.amount : '',
        result: typeof entry.result === 'string' ? entry.result : '',
        time: typeof entry.time === 'string' ? entry.time : '',
        timestamp: entry.timestamp,
      });
    }
    return migrated.slice(0, HISTORY_CAPACITY);
  } catch {
    return null;
  }
}

export function categorizeHistoryEntry(entry: ConversionHistoryEntry): ConversionHistoryCategory {
  if (entry.schemaVersion !== 2 || !entry.sourceKind || !entry.rateType) {
    return 'legacy';
  }
  if (entry.sourceKind === 'exchange-shop') return 'exchange-shop';
  if (entry.sourceKind === 'card') return 'card';
  return entry.rateType;
}

// ── Store 實例 ───────────────────────────────────────────────────────────────
export const useConverterStore = create<ConverterState>()(
  persist(
    (set, get) => ({
      // ── 初始狀態 ────────────────────────────────────────────────────────
      lastConverterView: DEFAULT_CONVERTER_MODE,
      singleConverterVariant: DEFAULT_CONVERTER_V2_VARIANT,
      fromCurrency: DEFAULT_FROM_CURRENCY,
      toCurrency: DEFAULT_TO_CURRENCY,
      rateMode: DEFAULT_RATE_MODE,
      rateType: DEFAULT_RATE_TYPE,
      rateSource: DEFAULT_RATE_SOURCE,
      providerPreference: DEFAULT_PROVIDER_PREFERENCE,
      favorites: [...DEFAULT_FAVORITES] as CurrencyCode[],
      history: [],
      baseCurrency: DEFAULT_BASE_CURRENCY,
      cardRateEnabled: false,
      cardFeePercent: CARD_FEE_PERCENT_DEFAULT,

      // ── Actions ──────────────────────────────────────────────────────────
      setFromCurrency: (code) => set({ fromCurrency: code }),

      setToCurrency: (code) => set({ toCurrency: code }),

      setBaseCurrency: (code) => set({ baseCurrency: code }),

      setRateMode: (rateMode) => set({ rateMode }),

      setRateType: (rateType) =>
        set((state) => ({
          rateType: resolveRateTypeForSource(state.rateSource, rateType),
        })),

      setProviderPreference: (next) =>
        set((state) => {
          const sanitized = sanitizeProviderPreference(next);
          const derivedRateSource = deriveRateSourceFromPreference(sanitized);
          return {
            providerPreference: sanitized,
            rateSource: derivedRateSource,
            rateType: resolveRateTypeForSource(derivedRateSource, state.rateType),
          };
        }),

      setRateSource: (rateSource) => {
        const ref = fromLegacyRateSource(rateSource);
        useConverterStore.getState().setProviderPreference({
          mode: 'manual',
          manualProvider: ref,
        });
      },

      swapCurrencies: () =>
        set((state) => ({
          fromCurrency: state.toCurrency,
          toCurrency: state.fromCurrency,
        })),

      toggleFavorite: (code) => {
        // TWD 為基準幣，永遠不加入收藏陣列
        if (code === 'TWD') return;
        set((state) => ({
          favorites: state.favorites.includes(code)
            ? state.favorites.filter((c) => c !== code)
            : [...state.favorites, code],
        }));
      },

      reorderFavorites: (codes) =>
        // TWD 不允許進入收藏陣列
        set({ favorites: codes.filter((c) => c !== 'TWD') }),

      isFavorite: (code) => get().favorites.includes(code),

      addToHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, HISTORY_CAPACITY),
        })),

      clearHistory: () => set({ history: [] }),

      setLastConverterView: (view) => set({ lastConverterView: view }),

      setSingleConverterVariant: (variant) => set({ singleConverterVariant: variant }),

      setCardRateEnabled: (enabled) => set({ cardRateEnabled: enabled }),

      setCardFeePercent: (percent) => set({ cardFeePercent: clampCardFeePercent(percent) }),

      __migrateFromLegacy: () => {
        const patch = buildMigrationPatch(get());
        if (patch) {
          set(patch);
          removeLegacyKeys();
        }
        const migratedHistory = migrateLegacyHistory(get());
        if (migratedHistory && migratedHistory.length > 0) {
          set({ history: migratedHistory });
        }
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
        }
      },

      __validateAndSanitize: () => {
        const patch = buildSanitizePatch(get());
        if (patch) set(patch);
      },
    }),
    {
      name: CONVERTER_STORE_KEY,
      partialize: (state) => ({
        lastConverterView: state.lastConverterView,
        singleConverterVariant: state.singleConverterVariant,
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        rateMode: state.rateMode,
        rateType: state.rateType,
        rateSource: state.rateSource,
        providerPreference: state.providerPreference,
        favorites: state.favorites,
        history: state.history,
        baseCurrency: state.baseCurrency,
        cardRateEnabled: state.cardRateEnabled,
        cardFeePercent: state.cardFeePercent,
      }),
      // issue #666：localStorage 為同步 storage，本回呼於 create() 內同步觸發——
      // 此時模組綁定 useConverterStore 仍在 TDZ，經其呼叫會拋 ReferenceError 且被
      // persist middleware 靜默吞掉（遷移／sanitize 全滅、hasHydrated 恆 false）。
      // 必須使用回呼參數 state（閉包 get/set），不可引用模組綁定。
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        // 舊版個別 key 的一次性遷移
        state.__migrateFromLegacy();
        state.__validateAndSanitize();
      },
    },
  ),
);
