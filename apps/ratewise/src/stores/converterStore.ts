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
import { fromLegacyRateSource } from '../features/ratewise/rateProviderTypes';
import {
  CURRENCY_DEFINITIONS,
  DEFAULT_FAVORITES,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_TO_CURRENCY,
} from '../features/ratewise/constants';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

const DEFAULT_RATE_TYPE: RateType = 'spot';
const DEFAULT_RATE_SOURCE: RateSource = 'bank';

/**
 * Provider preference 預設值（Phase 1 固定為手動模式 + 台銀）。
 *
 * `mode='best'` 僅為未來多銀行推薦預留，不會在 Phase 1 暴露給使用者；
 * 任何 migration / sanitize 路徑都不會自動產出 `mode='best'` 狀態。
 */
const DEFAULT_PROVIDER_PREFERENCE: RateProviderPreference = {
  mode: 'manual',
  manualProvider: { sourceKind: 'bank', providerId: 'bot' },
};

const VALID_SELECTION_MODES: ProviderSelectionMode[] = ['manual', 'best'];
const VALID_SOURCE_KINDS: RateSourceKind[] = ['bank', 'exchange-shop'];

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

// ── 轉換歷史記錄上限（store 層 SSOT，UI 顯示由元件決定）──────────────────
const HISTORY_CAPACITY = 50;
const LEGACY_HISTORY_STORAGE_KEY = STORAGE_KEYS.CONVERSION_HISTORY;

// ── Store 狀態介面 ───────────────────────────────────────────────────────────
interface ConverterState {
  // ── 持久化狀態 ──────────────────────────────────────────────────────────
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  mode: ConverterMode;
  rateMode: RateMode;
  rateType: RateType;
  /**
   * Legacy 來源欄位；保留作為相容層，由 `setProviderPreference` 持續同步。
   * 新邏輯請讀寫 `providerPreference`，不要再用 `rateSource` 表達 provider 身分。
   */
  rateSource: RateSource;
  /**
   * Phase 1 provider SSOT：使用者偏好的匯率來源 + 具體 provider。
   *
   * Phase 1 永遠為 `mode='manual'`；`best` 僅為多銀行推薦保留，不對 UI 暴露。
   * 與 `rateSource` 永遠保持同步：`providerPreference.manualProvider.sourceKind === rateSource`。
   */
  providerPreference: RateProviderPreference;
  favorites: CurrencyCode[];
  /**
   * 轉換歷史紀錄（schemaVersion≥2 寫入 provider/sourceKind 等可篩選欄位）。
   *
   * Phase 1 為唯一寫入路徑：所有 UI 寫入都必須走 `addToHistory(entry)`，
   * 不可再使用 `writeJSON(STORAGE_KEYS.CONVERSION_HISTORY)` 或 hook local state。
   */
  history: ConversionHistoryEntry[];

  // ── Actions ──────────────────────────────────────────────────────────────
  setFromCurrency: (code: CurrencyCode) => void;
  setToCurrency: (code: CurrencyCode) => void;
  setMode: (mode: ConverterMode) => void;
  setRateMode: (rateMode: RateMode) => void;
  setRateType: (rateType: RateType) => void;
  /**
   * 新主入口：設定 provider 偏好。
   *
   * 行為：
   * - 同步把 `rateSource` 衍生為 `manualProvider.sourceKind`（Phase 1 `best` 模式
   *   若沒有 manualProvider 則退回 `'bank'`，保證 legacy 欄位永遠有合法值）。
   * - 若 resolved sourceKind 為 `'exchange-shop'`，強制 `rateType='cash'`（與
   *   現有 SSOT 不變式一致）。
   */
  setProviderPreference: (next: RateProviderPreference) => void;
  /**
   * 切換匯率資料來源（相容層）；行為等同 `setProviderPreference({ mode:'manual',
   * manualProvider: fromLegacyRateSource(rateSource) })`。
   *
   * 切到 `exchange-shop` 時自動同步 `rateType = 'cash'`，與單幣別/多幣別頁
   * 「換錢所僅支援現金」UX 約束一致。
   */
  setRateSource: (rateSource: RateSource) => void;
  swapCurrencies: () => void;

  /** 切換收藏狀態（immutable 更新） */
  toggleFavorite: (code: CurrencyCode) => void;
  /** 替換完整收藏列表（拖曳排序用） */
  reorderFavorites: (codes: CurrencyCode[]) => void;
  /** 檢查 `code` 是否在收藏列表中 */
  isFavorite: (code: CurrencyCode) => boolean;

  /**
   * 新增一筆轉換歷史紀錄到 store SSOT。
   *
   * 寫入策略：上限為 {@link HISTORY_CAPACITY}；超過時保留最新；同時間戳重複呼叫
   * 視為新筆（不去重，由呼叫端決定是否擋連點）。
   */
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
  | 'mode'
  | 'rateMode'
  | 'rateType'
  | 'rateSource'
  | 'providerPreference'
  | 'favorites'
>;

const VALID_RATE_MODES: RateMode[] = ['auto', 'sell', 'mid'];
const VALID_RATE_TYPES: RateType[] = ['spot', 'cash'];
const VALID_RATE_SOURCES: RateSource[] = ['bank', 'exchange-shop'];

/**
 * 推導與 `providerPreference` 一致的 legacy `rateSource`。
 *
 * - `mode='manual'` 且有 `manualProvider`：取 `manualProvider.sourceKind`。
 * - `mode='best'`（Phase 1 不會出現，但定義行為以保證 legacy 欄位永遠合法）：
 *   退回 `'bank'`，避免 legacy 消費者拿到 undefined。
 */
function deriveRateSourceFromPreference(preference: RateProviderPreference): RateSource {
  return preference.manualProvider?.sourceKind ?? 'bank';
}

/**
 * 驗證並修復 providerPreference；回傳 sanitized 結果。
 *
 * 回傳的 preference 一定為合法值（不會出現未知 mode / sourceKind / 空 providerId）。
 * 若 `manualProvider` 缺失但 mode 為 `manual`，補回預設 manualProvider。
 */
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

  // mode='manual' 必須有合法 manualProvider；若缺失則回退預設
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
  if (state.mode !== 'single' && state.mode !== 'multi') {
    patch.mode = 'single';
    dirty = true;
  }
  if (!VALID_RATE_MODES.includes(state.rateMode)) {
    patch.rateMode = 'auto';
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

  // ── providerPreference 驗證 + 與 rateSource 互相同步 ────────────────────
  // 1. sanitize providerPreference 本身（mode / manualProvider 結構）
  // 2. 從 sanitized preference 重新推導 rateSource，確保兩者不漂移
  const sanitizedPreference = sanitizeProviderPreference(state.providerPreference);
  const preferenceChanged =
    JSON.stringify(sanitizedPreference) !== JSON.stringify(state.providerPreference);
  if (preferenceChanged) {
    patch.providerPreference = sanitizedPreference;
    dirty = true;
  }
  // 永遠以 sanitized preference 推導 rateSource，避免兩個欄位互相牴觸
  const derivedRateSource = deriveRateSourceFromPreference(sanitizedPreference);
  const currentRateSource = patch.rateSource ?? state.rateSource;
  if (derivedRateSource !== currentRateSource) {
    patch.rateSource = derivedRateSource;
    dirty = true;
  }

  const resolvedRateSource = patch.rateSource ?? state.rateSource;
  const resolvedRateType = patch.rateType ?? state.rateType;
  if (resolvedRateSource === 'exchange-shop' && resolvedRateType !== 'cash') {
    patch.rateType = 'cash';
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

  // rateType / rateSource：即使 `ratewise-converter` 已存在仍需遷移，
  // 因為它們是 v2.x 期間才加入 store 的新 SSOT 欄位，先前由各 page useState +
  // 個別 localStorage key 管理。
  const oldRateType = window.localStorage.getItem(LEGACY_KEYS.RATE_TYPE);
  if (oldRateType === 'cash' || oldRateType === 'spot') {
    patch.rateType = oldRateType;
  }
  const oldRateSource = window.localStorage.getItem(LEGACY_KEYS.RATE_SOURCE);
  if (oldRateSource === 'bank' || oldRateSource === 'exchange-shop') {
    patch.rateSource = oldRateSource;
  }
  if (patch.rateSource === 'exchange-shop' && patch.rateType !== 'cash') {
    patch.rateType = 'cash';
  }

  // providerPreference 遷移（Phase 1 永遠 mode='manual'）
  // 1. 若 legacy localStorage 提供了 rateSource（patch.rateSource 已寫入），
  //    依該值同步寫入 manualProvider，確保兩個欄位一致。
  // 2. 若 hydrate 後 store 內無合法 providerPreference（升級自 Task 4 之前的版本），
  //    從目前 state.rateSource 推導補回。
  // 3. 兩者皆有時不動，留給 sanitize 階段做最終一致性檢查。
  const hasPersistedPreference =
    typeof state.providerPreference === 'object' && state.providerPreference !== null;
  if (patch.rateSource) {
    // legacy localStorage 的 rateSource 是更新訊號，重新生成 manualProvider 保持兩欄位一致
    patch.providerPreference = {
      mode: 'manual',
      manualProvider: fromLegacyRateSource(patch.rateSource),
    };
  } else if (!hasPersistedPreference) {
    // 升級自舊版 store（沒有 providerPreference 欄位）：以目前 state.rateSource 推導
    patch.providerPreference = {
      mode: 'manual',
      manualProvider: fromLegacyRateSource(state.rateSource),
    };
  }

  // fromCurrency / toCurrency / mode / favorites：統一 key 已存在代表已完成遷移
  if (window.localStorage.getItem('ratewise-converter') === null) {
    const oldFrom = window.localStorage.getItem(LEGACY_KEYS.FROM_CURRENCY);
    const oldTo = window.localStorage.getItem(LEGACY_KEYS.TO_CURRENCY);
    const oldMode = window.localStorage.getItem(LEGACY_KEYS.MODE);
    const oldFavoritesRaw = window.localStorage.getItem(LEGACY_KEYS.FAVORITES);

    if (oldFrom && isCurrencyCode(oldFrom)) patch.fromCurrency = oldFrom;
    if (oldTo && isCurrencyCode(oldTo)) patch.toCurrency = oldTo;
    if (oldMode === 'multi') patch.mode = 'multi';

    if (oldFavoritesRaw) {
      try {
        const parsed: unknown = JSON.parse(oldFavoritesRaw);
        if (Array.isArray(parsed)) {
          // 空陣列為合法的使用者偏好（刻意清空收藏），必須保留
          patch.favorites = (parsed as unknown[]).filter(
            (c): c is CurrencyCode => typeof c === 'string' && isCurrencyCode(c),
          );
        }
      } catch {
        // 忽略格式錯誤的 JSON，保留預設收藏
      }
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
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

/**
 * 將舊版 `STORAGE_KEYS.CONVERSION_HISTORY` 的歷史紀錄遷移到 store。
 *
 * 規則（對齊設計文件 §History Contract）：
 * - 缺欄位（rateType / sourceKind / providerId / providerSelectionMode / schemaVersion）的舊紀錄
 *   只保留基本欄位，**不偽造** sourceKind = 'bank' 或 providerId = 'bot'，避免後續 UI 篩選誤判。
 * - 篩選時舊紀錄會由 `categorizeHistoryEntry` 歸到 `'legacy'` 分類。
 * - 遷移完成後一次性移除 legacy storage key，後續寫入只走 store SSOT。
 *
 * 僅當 hydrate 後 store 內 `history` 為空時才執行（避免覆蓋已寫入的新紀錄）。
 */
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
      // 不偽造 schemaVersion；缺欄位的舊紀錄保留為 legacy（schemaVersion 留 undefined）
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

/**
 * 依紀錄欄位將歷史分類為 `'spot' | 'cash' | 'exchange-shop' | 'legacy'`。
 *
 * - schemaVersion 缺失或 sourceKind/rateType 缺失：歸為 `'legacy'`。
 * - sourceKind = 'exchange-shop'：歸為 `'exchange-shop'`（rateType 必為 cash）。
 * - sourceKind = 'bank'：依 rateType 回 `'spot'` 或 `'cash'`。
 */
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
      mode: 'single' as ConverterMode,
      rateMode: 'auto' as RateMode,
      rateType: DEFAULT_RATE_TYPE,
      rateSource: DEFAULT_RATE_SOURCE,
      providerPreference: DEFAULT_PROVIDER_PREFERENCE,
      favorites: [...DEFAULT_FAVORITES] as CurrencyCode[],
      history: [],

      // ── Actions ──────────────────────────────────────────────────────────
      setFromCurrency: (code) => set({ fromCurrency: code }),

      setToCurrency: (code) => set({ toCurrency: code }),

      setMode: (mode) => set({ mode }),

      setRateMode: (rateMode) => set({ rateMode }),

      setRateType: (rateType) =>
        set((state) => ({
          rateType: state.rateSource === 'exchange-shop' ? 'cash' : rateType,
        })),

      // 新主入口：設定 provider 偏好，並同步 legacy `rateSource` 與 cash 不變式
      setProviderPreference: (next) =>
        set((state) => {
          const sanitized = sanitizeProviderPreference(next);
          const derivedRateSource = deriveRateSourceFromPreference(sanitized);
          return {
            providerPreference: sanitized,
            rateSource: derivedRateSource,
            rateType: derivedRateSource === 'exchange-shop' ? 'cash' : state.rateType,
          };
        }),

      // 相容包裝：legacy `setRateSource` 一律走 setProviderPreference 流程，
      // 確保 providerPreference / rateSource / rateType cash 不變式不會漂移。
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
        // 歷史紀錄遷移獨立進行（即使其他欄位無遷移也要執行）；只在 store.history 為空時觸發
        const migratedHistory = migrateLegacyHistory(get());
        if (migratedHistory && migratedHistory.length > 0) {
          set({ history: migratedHistory });
        }
        // 完成遷移（無論是否真的有資料）後移除 legacy key，避免下次 hydrate 重複處理
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
        mode: state.mode,
        rateMode: state.rateMode,
        rateType: state.rateType,
        rateSource: state.rateSource,
        providerPreference: state.providerPreference,
        favorites: state.favorites,
        history: state.history,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) return;
        // 舊版個別 key 的一次性遷移
        useConverterStore.getState().__migrateFromLegacy();
        // 修復不合法的持久化欄位（例如舊版 CurrencyPair 格式、損毀代碼）
        useConverterStore.getState().__validateAndSanitize();
      },
    },
  ),
);
