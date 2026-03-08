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
import type { ConverterMode, CurrencyCode } from '../features/ratewise/types';
import {
  CURRENCY_DEFINITIONS,
  DEFAULT_FAVORITES,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_TO_CURRENCY,
} from '../features/ratewise/constants';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

// ── 有效貨幣代碼集合（模組載入時計算一次）────────────────────────────────────
const VALID_CODES = new Set(Object.keys(CURRENCY_DEFINITIONS));

const isCurrencyCode = (value: string): value is CurrencyCode => VALID_CODES.has(value);

// ── 舊版 key 名稱（僅用於一次性遷移）─────────────────────────────────────────
const LEGACY_KEYS = {
  FROM_CURRENCY: STORAGE_KEYS.FROM_CURRENCY,
  TO_CURRENCY: STORAGE_KEYS.TO_CURRENCY,
  MODE: STORAGE_KEYS.CURRENCY_CONVERTER_MODE,
  FAVORITES: STORAGE_KEYS.FAVORITES,
} as const;

// ── 轉換歷史記錄型別 ─────────────────────────────────────────────────────────
export interface ConversionRecord {
  id: string;
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

// ── Store 狀態介面 ───────────────────────────────────────────────────────────
interface ConverterState {
  // ── 持久化狀態 ──────────────────────────────────────────────────────────
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  mode: ConverterMode;
  favorites: CurrencyCode[];
  history: ConversionRecord[];

  // ── Actions ──────────────────────────────────────────────────────────────
  setFromCurrency: (code: CurrencyCode) => void;
  setToCurrency: (code: CurrencyCode) => void;
  setMode: (mode: ConverterMode) => void;
  swapCurrencies: () => void;

  /** 切換收藏狀態（immutable 更新） */
  toggleFavorite: (code: CurrencyCode) => void;
  /** 替換完整收藏列表（拖曳排序用） */
  reorderFavorites: (codes: CurrencyCode[]) => void;
  /** 檢查 `code` 是否在收藏列表中 */
  isFavorite: (code: CurrencyCode) => boolean;

  addToHistory: (record: ConversionRecord) => void;
  clearHistory: () => void;

  /** 供單元測試呼叫；亦由 onRehydrateStorage 在內部觸發 */
  __migrateFromLegacy: () => void;
  /** hydrate 後驗證並修復不合法的欄位；由 onRehydrateStorage 自動觸發，亦可由單元測試直接呼叫 */
  __validateAndSanitize: () => void;
}

// ── Schema 驗證輔助函式 ───────────────────────────────────────────────────────

type PersistentFields = Pick<ConverterState, 'fromCurrency' | 'toCurrency' | 'mode' | 'favorites'>;

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
  if (!Array.isArray(state.favorites)) {
    patch.favorites = [...DEFAULT_FAVORITES] as CurrencyCode[];
    dirty = true;
  } else if (
    (state.favorites as unknown[]).some((c) => typeof c !== 'string' || !isCurrencyCode(c))
  ) {
    patch.favorites = (state.favorites as unknown[]).filter(
      (c): c is CurrencyCode => typeof c === 'string' && isCurrencyCode(c),
    );
    dirty = true;
  }

  return dirty ? patch : null;
}

// ── 遷移輔助函式 ─────────────────────────────────────────────────────────────

function buildMigrationPatch(): Partial<
  Pick<ConverterState, 'fromCurrency' | 'toCurrency' | 'mode' | 'favorites'>
> | null {
  if (typeof window === 'undefined') return null;

  // 統一 key 已存在，代表已完成遷移，跳過
  if (window.localStorage.getItem('ratewise-converter') !== null) return null;

  const oldFrom = window.localStorage.getItem(LEGACY_KEYS.FROM_CURRENCY);
  const oldTo = window.localStorage.getItem(LEGACY_KEYS.TO_CURRENCY);
  const oldMode = window.localStorage.getItem(LEGACY_KEYS.MODE);
  const oldFavoritesRaw = window.localStorage.getItem(LEGACY_KEYS.FAVORITES);

  if (!oldFrom && !oldTo && !oldMode && !oldFavoritesRaw) return null;

  const patch: Partial<Pick<ConverterState, 'fromCurrency' | 'toCurrency' | 'mode' | 'favorites'>> =
    {};

  if (oldFrom && isCurrencyCode(oldFrom)) patch.fromCurrency = oldFrom;
  if (oldTo && isCurrencyCode(oldTo)) patch.toCurrency = oldTo;
  if (oldMode === 'multi') patch.mode = 'multi';

  if (oldFavoritesRaw) {
    try {
      const parsed: unknown = JSON.parse(oldFavoritesRaw);
      if (Array.isArray(parsed)) {
        const sanitized = (parsed as unknown[]).filter(
          (c): c is CurrencyCode => typeof c === 'string' && isCurrencyCode(c),
        );
        // 空陣列為合法的使用者偏好（刻意清空收藏），必須保留
        patch.favorites = sanitized;
      }
    } catch {
      // 忽略格式錯誤的 JSON，保留預設收藏
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
}

// ── Store 實例 ───────────────────────────────────────────────────────────────
export const useConverterStore = create<ConverterState>()(
  persist(
    (set, get) => ({
      // ── 初始狀態 ────────────────────────────────────────────────────────
      fromCurrency: DEFAULT_FROM_CURRENCY,
      toCurrency: DEFAULT_TO_CURRENCY,
      mode: 'single' as ConverterMode,
      favorites: [...DEFAULT_FAVORITES] as CurrencyCode[],
      history: [],

      // ── Actions ──────────────────────────────────────────────────────────
      setFromCurrency: (code) => set({ fromCurrency: code }),

      setToCurrency: (code) => set({ toCurrency: code }),

      setMode: (mode) => set({ mode }),

      swapCurrencies: () =>
        set((state) => ({
          fromCurrency: state.toCurrency,
          toCurrency: state.fromCurrency,
        })),

      toggleFavorite: (code) =>
        set((state) => ({
          favorites: state.favorites.includes(code)
            ? state.favorites.filter((c) => c !== code)
            : [...state.favorites, code],
        })),

      reorderFavorites: (codes) => set({ favorites: codes }),

      isFavorite: (code) => get().favorites.includes(code),

      addToHistory: (record) =>
        set((state) => ({
          history: [record, ...state.history].slice(0, 50),
        })),

      clearHistory: () => set({ history: [] }),

      __migrateFromLegacy: () => {
        const patch = buildMigrationPatch();
        if (patch) {
          set(patch);
          removeLegacyKeys();
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
        favorites: state.favorites,
        history: state.history,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) return;
        // 修復不合法的持久化欄位（例如舊版 CurrencyPair 格式、損毀代碼）
        useConverterStore.getState().__validateAndSanitize();
        // 舊版個別 key 的一次性遷移
        useConverterStore.getState().__migrateFromLegacy();
      },
    },
  ),
);
