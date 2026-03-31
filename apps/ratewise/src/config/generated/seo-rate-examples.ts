/**
 * SEO 匯差範例數據（自動生成）
 *
 * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。
 * 每日由 GitHub Actions 自動更新並提交。
 *
 * 資料來源：
 *   - 台灣銀行牌告匯率（現金買入/賣出）
 *   - open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 基準一致）
 * 雙重驗證：open.er-api.com 中間價 vs 台銀自身 (買入+賣出)/2 中間價，差距須在 2% 以內。
 * 匯率時間：2026/03/31 11:24:49
 * 生成日期：2026-03-31
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
    foreignAtCash: 927,
    foreignAtMarketMid: 936,
    foreignAtBankMid: 937,
    diffForeign: 9,
    diffTWD: 271,
    diffPct: 0.9,
    cashSell: 32.355,
    marketMid: 32.062586,
    bankMid: 32.02,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146699,
    foreignAtMarketMid: 149435,
    foreignAtBankMid: 151439,
    diffForeign: 2736,
    diffTWD: 549,
    diffPct: 1.9,
    cashSell: 0.2045,
    marketMid: 0.200756,
    bankMid: 0.1981,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 804,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 818,
    diffForeign: 12,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 37.33,
    marketMid: 36.747143,
    bankMid: 36.66,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 693,
    foreignAtMarketMid: 709,
    foreignAtBankMid: 710,
    diffForeign: 16,
    diffTWD: 703,
    diffPct: 2.4,
    cashSell: 43.3,
    marketMid: 42.285086,
    bankMid: 42.24,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6376,
    foreignAtMarketMid: 6471,
    foreignAtBankMid: 6488,
    diffForeign: 95,
    diffTWD: 440,
    diffPct: 1.5,
    cashSell: 4.705,
    marketMid: 4.636069,
    bankMid: 4.624,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1296456,
    foreignAtMarketMid: 1419632,
    foreignAtBankMid: 1415762,
    diffForeign: 123176,
    diffTWD: 2603,
    diffPct: 9.5,
    cashSell: 0.02314,
    marketMid: 0.021132,
    bankMid: 0.02119,
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7245,
    foreignAtMarketMid: 7335,
    foreignAtBankMid: 7428,
    diffForeign: 90,
    diffTWD: 368,
    diffPct: 1.2,
    cashSell: 4.141,
    marketMid: 4.090164,
    bankMid: 4.039,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1341,
    foreignAtMarketMid: 1366,
    foreignAtBankMid: 1365,
    diffForeign: 25,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 22.37,
    marketMid: 21.960164,
    bankMid: 21.98,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1303,
    foreignAtBankMid: 1305,
    diffForeign: 24,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 23.45,
    marketMid: 23.016019,
    bankMid: 22.995,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1213,
    diffForeign: 18,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 25.19,
    marketMid: 24.823751,
    bankMid: 24.735,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 749,
    foreignAtBankMid: 751,
    diffForeign: 9,
    diffTWD: 368,
    diffPct: 1.2,
    cashSell: 40.56,
    marketMid: 40.062497,
    bankMid: 39.96,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1603,
    foreignAtMarketMid: 1637,
    foreignAtBankMid: 1640,
    diffForeign: 34,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 18.72,
    marketMid: 18.331134,
    bankMid: 18.295,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28902,
    foreignAtMarketMid: 30748,
    foreignAtBankMid: 31813,
    diffForeign: 1846,
    diffTWD: 1801,
    diffPct: 6.4,
    cashSell: 1.038,
    marketMid: 0.975674,
    bankMid: 0.943,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50412,
    foreignAtMarketMid: 56885,
    foreignAtBankMid: 56700,
    diffForeign: 6473,
    diffTWD: 3414,
    diffPct: 12.8,
    cashSell: 0.5951,
    marketMid: 0.52738,
    bankMid: 0.5291,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 15903983,
    foreignAtBankMid: 15957447,
    diffForeign: 2451068,
    diffTWD: 4623,
    diffPct: 18.2,
    cashSell: 0.00223,
    marketMid: 0.001886,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3539,
    foreignAtMarketMid: 3769,
    foreignAtBankMid: 3889,
    diffForeign: 230,
    diffTWD: 1825,
    diffPct: 6.5,
    cashSell: 8.476,
    marketMid: 7.960326,
    bankMid: 7.7135,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24549873,
    foreignAtBankMid: 25104603,
    diffForeign: 3121302,
    diffTWD: 3814,
    diffPct: 14.6,
    cashSell: 0.0014,
    marketMid: 0.001222,
    bankMid: 0.001195,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/03/31 11:24:49';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-03-31';
