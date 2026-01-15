/**
 * Zustand State Management - Converter Store
 *
 * 跨模組共享狀態：
 * - 貨幣選擇（fromCurrency, toCurrency）
 * - 收藏的貨幣對（favorites）
 * - 轉換歷史記錄（history）
 *
 * 特性：
 * - localStorage 持久化
 * - TypeScript 類型安全
 * - 跨模組狀態同步
 *
 * [refactor:2026-01-15] 新增 Zustand 狀態管理支援底部導覽列架構
 * 依據：Phase 2 架構升級計畫
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyCode } from '../features/ratewise/types';

/**
 * 貨幣對類型
 */
export interface CurrencyPair {
  from: CurrencyCode;
  to: CurrencyCode;
  timestamp: number;
}

/**
 * 轉換記錄類型
 */
export interface ConversionRecord {
  id: string;
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

/**
 * Converter Store 狀態介面
 */
interface ConverterState {
  // 狀態
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  favorites: CurrencyPair[];
  history: ConversionRecord[];

  // Actions
  setFromCurrency: (code: CurrencyCode) => void;
  setToCurrency: (code: CurrencyCode) => void;
  swapCurrencies: () => void;
  addFavorite: (pair: CurrencyPair) => void;
  removeFavorite: (from: CurrencyCode, to: CurrencyCode) => void;
  isFavorite: (from: CurrencyCode, to: CurrencyCode) => boolean;
  addToHistory: (record: ConversionRecord) => void;
  clearHistory: () => void;
}

/**
 * Converter Store
 *
 * 使用 Zustand + persist middleware 實現跨模組狀態管理
 */
export const useConverterStore = create<ConverterState>()(
  persist(
    (set, get) => ({
      // 初始狀態
      fromCurrency: 'TWD',
      toCurrency: 'USD',
      favorites: [],
      history: [],

      // 設定來源貨幣
      setFromCurrency: (code) => set({ fromCurrency: code }),

      // 設定目標貨幣
      setToCurrency: (code) => set({ toCurrency: code }),

      // 交換貨幣
      swapCurrencies: () =>
        set((state) => ({
          fromCurrency: state.toCurrency,
          toCurrency: state.fromCurrency,
        })),

      // 新增收藏
      addFavorite: (pair) =>
        set((state) => {
          // 避免重複收藏
          const exists = state.favorites.some((f) => f.from === pair.from && f.to === pair.to);
          if (exists) return state;

          return {
            favorites: [...state.favorites, pair],
          };
        }),

      // 移除收藏
      removeFavorite: (from, to) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => !(f.from === from && f.to === to)),
        })),

      // 檢查是否已收藏
      isFavorite: (from, to) => {
        const state = get();
        return state.favorites.some((f) => f.from === from && f.to === to);
      },

      // 新增轉換記錄
      addToHistory: (record) =>
        set((state) => ({
          // 保留最新 50 筆記錄
          history: [record, ...state.history].slice(0, 50),
        })),

      // 清除歷史記錄
      clearHistory: () => set({ history: [] }),
    }),
    {
      // localStorage 持久化配置
      name: 'ratewise-converter',

      // 只持久化必要的狀態（排除 SSR 時不存在的狀態）
      partialize: (state) => ({
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        favorites: state.favorites,
        history: state.history,
      }),
    },
  ),
);
