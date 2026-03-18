/**
 * SEO 匯差範例數據（自動生成）
 *
 * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。
 * 每週一由 GitHub Actions 自動更新並提交。
 *
 * 資料來源：
 *   - 台灣銀行牌告匯率（現金買入/賣出）
 *   - open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 基準一致）
 * 雙重驗證：open.er-api.com 中間價 vs 台銀自身 (買入+賣出)/2 中間價，差距須在 2% 以內。
 * 匯率時間：2026/03/17 14:45:42
 * 生成日期：2026-03-17
 */

export interface RateExample {
  /** 換匯情境用的台幣金額（固定 30000） */
  exampleTWD: number;
  /** 以台銀現金賣出匯率可兌換的外幣數量（實際到手） */
  foreignAtCash: number;
  /** 以市場中間價換算的外幣數量（Google/XE/Wise/Apple 等工具顯示） */
  foreignAtMarketMid: number;
  /** 以台銀自身中間價換算的外幣數量（雙重驗證用，null 代表無現金買入資料） */
  foreignAtBankMid: number | null;
  /** 中間價高估的外幣數量（foreignAtMarketMid - foreignAtCash，使用者預期多換到但實際拿不到） */
  diffForeign: number;
  /** 現金賣出 vs 市場中間價，等值多付約 N 元新台幣 */
  diffTWD: number;
  /** 差距百分比（四捨五入到小數一位） */
  diffPct: number;
  /** 台灣銀行現金賣出匯率（每 1 單位外幣 = N 台幣） */
  cashSell: number;
  /** 市場中間匯率（open.er-api.com，每 1 單位外幣 = N 台幣） */
  marketMid: number;
  /** 台銀自身現金中間價（(買入+賣出)/2，雙重驗證用，null 代表無現金買入資料） */
  bankMid: number | null;
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 931,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 941,
    diffForeign: 7,
    diffTWD: 202,
    diffPct: 0.7,
    cashSell: 32.215,
    marketMid: 31.997952,
    bankMid: 31.88,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147059,
    foreignAtMarketMid: 149301,
    foreignAtBankMid: 151822,
    diffForeign: 2242,
    diffTWD: 451,
    diffPct: 1.5,
    cashSell: 0.204,
    marketMid: 0.200936,
    bankMid: 0.1976,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 807,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 821,
    diffForeign: 9,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 37.19,
    marketMid: 36.752545,
    bankMid: 36.52,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 692,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 709,
    diffForeign: 13,
    diffTWD: 591,
    diffPct: 2,
    cashSell: 43.38,
    marketMid: 42.526047,
    bankMid: 42.32,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6382,
    foreignAtMarketMid: 6459,
    foreignAtBankMid: 6494,
    diffForeign: 77,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 4.701,
    marketMid: 4.644682,
    bankMid: 4.62,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1272265,
    foreignAtMarketMid: 1398137,
    foreignAtBankMid: 1386963,
    diffForeign: 125872,
    diffTWD: 2701,
    diffPct: 9.9,
    cashSell: 0.02358,
    marketMid: 0.021457,
    bankMid: 0.02163,
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7273,
    foreignAtMarketMid: 7346,
    foreignAtBankMid: 7457,
    diffForeign: 73,
    diffTWD: 299,
    diffPct: 1,
    cashSell: 4.125,
    marketMid: 4.083866,
    bankMid: 4.023,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1306,
    foreignAtMarketMid: 1328,
    foreignAtBankMid: 1329,
    diffForeign: 22,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 22.97,
    marketMid: 22.594275,
    bankMid: 22.58,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1264,
    foreignAtMarketMid: 1283,
    foreignAtBankMid: 1288,
    diffForeign: 19,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 23.74,
    marketMid: 23.386889,
    bankMid: 23.285,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1199,
    foreignAtBankMid: 1207,
    diffForeign: 14,
    diffTWD: 348,
    diffPct: 1.2,
    cashSell: 25.31,
    marketMid: 25.016261,
    bankMid: 24.855,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 734,
    foreignAtMarketMid: 739,
    foreignAtBankMid: 745,
    diffForeign: 5,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 40.87,
    marketMid: 40.584416,
    bankMid: 40.27,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1581,
    foreignAtMarketMid: 1603,
    foreignAtBankMid: 1618,
    diffForeign: 22,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 18.97,
    marketMid: 18.712925,
    bankMid: 18.545,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28711,
    foreignAtMarketMid: 30352,
    foreignAtBankMid: 31582,
    diffForeign: 1641,
    diffTWD: 1622,
    diffPct: 5.7,
    cashSell: 1.0449,
    marketMid: 0.988406,
    bankMid: 0.9499,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50017,
    foreignAtMarketMid: 56068,
    foreignAtBankMid: 56201,
    diffForeign: 6051,
    diffTWD: 3238,
    diffPct: 12.1,
    cashSell: 0.5998,
    marketMid: 0.535068,
    bankMid: 0.5338,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 15949190,
    foreignAtBankMid: 15957447,
    diffForeign: 2496275,
    diffTWD: 4695,
    diffPct: 18.6,
    cashSell: 0.00223,
    marketMid: 0.001881,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3471,
    foreignAtMarketMid: 3686,
    foreignAtBankMid: 3807,
    diffForeign: 215,
    diffTWD: 1752,
    diffPct: 6.2,
    cashSell: 8.643,
    marketMid: 8.138352,
    bankMid: 7.8805,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24601920,
    foreignAtBankMid: 25104603,
    diffForeign: 3173349,
    diffTWD: 3870,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/03/17 14:45:42';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-03-17';
