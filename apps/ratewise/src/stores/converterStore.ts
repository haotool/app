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
  CURRENCY_DEFINITIONS,
  DEFAULT_BASE_CURRENCY,
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
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

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
} as const;

const HISTORY_CAPACITY = 50;
const LEGACY_HISTORY_STORAGE_KEY = STORAGE_KEYS.CONVERSION_HISTORY;

// ── Store 狀態介面 ───────────────────────────────────────────────────────────
interface ConverterState {
  // ── 持久化狀態 ──────────────────────────────────────────────────────────
  // 註：頁面 `mode`（single/multi）由 route 決定，不持久化於 store。
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

  /** 供單元測試呼叫；亦由 onRehydrateStorage 在內部觸發 */
  __migrateFromLegacy: () => void;
  /** hydrate 後驗證並修復不合法的欄位；由 onRehydrateStorage 自動觸發，亦可由單元測試直接呼叫 */
  __validateAndSanitize: () => void;
}

// ── Schema 驗證輔助函式 ───────────────────────────────────────────────────────

type PersistentFields = Pick<
  ConverterState,
  | 'fromCurrency'
  | 'toCurrency'
  | 'rateMode'
  | 'rateType'
  | 'rateSource'
  | 'providerPreference'
  | 'favorites'
  | 'baseCurrency'
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

  if (!isCurrencyCode(state.fromCurrency as string)) {
    patch.fromCurrency = DEFAULT_FROM_CURRENCY;
    dirty = true;
  }
  if (!isCurrencyCode(state.toCurrency as string)) {
    patch.toCurrency = DEFAULT_TO_CURRENCY;
    dirty = true;
  }
  if (!isCurrencyCode(state.baseCurrency as string)) {
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

  if (window.localStorage.getItem('ratewise-converter') === null) {
    const oldFrom = window.localStorage.getItem(LEGACY_KEYS.FROM_CURRENCY);
    const oldTo = window.localStorage.getItem(LEGACY_KEYS.TO_CURRENCY);
    const oldFavoritesRaw = window.localStorage.getItem(LEGACY_KEYS.FAVORITES);

    if (oldFrom && isCurrencyCode(oldFrom)) patch.fromCurrency = oldFrom;
    if (oldTo && isCurrencyCode(oldTo)) patch.toCurrency = oldTo;
    // 註：legacy `mode` 不再遷移；頁面 `mode` 由 route 決定（route 即 SSOT）。

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
  return entry.rateType;
}

// ── Store 實例 ───────────────────────────────────────────────────────────────
export const useConverterStore = create<ConverterState>()(
  persist(
    (set, get) => ({
      // ── 初始狀態 ────────────────────────────────────────────────────────
      fromCurrency: DEFAULT_FROM_CURRENCY,
      toCurrency: DEFAULT_TO_CURRENCY,
      rateMode: DEFAULT_RATE_MODE as RateMode,
      rateType: DEFAULT_RATE_TYPE,
      rateSource: DEFAULT_RATE_SOURCE,
      providerPreference: DEFAULT_PROVIDER_PREFERENCE,
      favorites: [...DEFAULT_FAVORITES] as CurrencyCode[],
      history: [],
      baseCurrency: DEFAULT_BASE_CURRENCY,

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
      name: 'ratewise-converter',
      partialize: (state) => ({
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        rateMode: state.rateMode,
        rateType: state.rateType,
        rateSource: state.rateSource,
        providerPreference: state.providerPreference,
        favorites: state.favorites,
        history: state.history,
        baseCurrency: state.baseCurrency,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) return;
        // 舊版個別 key 的一次性遷移
        useConverterStore.getState().__migrateFromLegacy();
        useConverterStore.getState().__validateAndSanitize();
      },
    },
  ),
);
