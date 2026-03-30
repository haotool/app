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
 * 匯率時間：2026/03/30 07:19:24
 * 生成日期：2026-03-30
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
    foreignAtCash: 933,
    foreignAtMarketMid: 936,
    foreignAtBankMid: 943,
    diffForeign: 3,
    diffTWD: 101,
    diffPct: 0.3,
    cashSell: 32.15,
    marketMid: 32.042039,
    bankMid: 31.815,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148295,
    foreignAtMarketMid: 149992,
    foreignAtBankMid: 153139,
    diffForeign: 1697,
    diffTWD: 339,
    diffPct: 1.1,
    cashSell: 0.2023,
    marketMid: 0.200011,
    bankMid: 0.1959,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 807,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 822,
    diffForeign: 7,
    diffTWD: 249,
    diffPct: 0.8,
    cashSell: 37.17,
    marketMid: 36.860924,
    bankMid: 36.5,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 695,
    foreignAtMarketMid: 706,
    foreignAtBankMid: 713,
    diffForeign: 11,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 43.14,
    marketMid: 42.506163,
    bankMid: 42.08,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6417,
    foreignAtMarketMid: 6477,
    foreignAtBankMid: 6530,
    diffForeign: 60,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 4.675,
    marketMid: 4.631774,
    bankMid: 4.594,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1287554,
    foreignAtMarketMid: 1413467,
    foreignAtBankMid: 1405152,
    diffForeign: 125913,
    diffTWD: 2672,
    diffPct: 9.8,
    cashSell: 0.0233,
    marketMid: 0.021224,
    bankMid: 0.02135,
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7285,
    foreignAtMarketMid: 7345,
    foreignAtBankMid: 7470,
    diffForeign: 60,
    diffTWD: 246,
    diffPct: 0.8,
    cashSell: 4.118,
    marketMid: 4.084267,
    bankMid: 4.016,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1350,
    foreignAtMarketMid: 1363,
    foreignAtBankMid: 1374,
    diffForeign: 13,
    diffTWD: 296,
    diffPct: 1,
    cashSell: 22.23,
    marketMid: 22.010917,
    bankMid: 21.84,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1310,
    diffForeign: 17,
    diffTWD: 378,
    diffPct: 1.3,
    cashSell: 23.36,
    marketMid: 23.06539,
    bankMid: 22.905,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1220,
    diffForeign: 9,
    diffTWD: 239,
    diffPct: 0.8,
    cashSell: 25.05,
    marketMid: 24.850277,
    bankMid: 24.595,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 745,
    foreignAtMarketMid: 747,
    foreignAtBankMid: 756,
    diffForeign: 2,
    diffTWD: 86,
    diffPct: 0.3,
    cashSell: 40.26,
    marketMid: 40.14452,
    bankMid: 39.66,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1609,
    foreignAtMarketMid: 1631,
    foreignAtBankMid: 1646,
    diffForeign: 22,
    diffTWD: 406,
    diffPct: 1.4,
    cashSell: 18.65,
    marketMid: 18.397572,
    bankMid: 18.225,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29135,
    foreignAtMarketMid: 30898,
    foreignAtBankMid: 32096,
    diffForeign: 1763,
    diffTWD: 1712,
    diffPct: 6.1,
    cashSell: 1.0297,
    marketMid: 0.970951,
    bankMid: 0.9347,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50607,
    foreignAtMarketMid: 56713,
    foreignAtBankMid: 56948,
    diffForeign: 6106,
    diffTWD: 3230,
    diffPct: 12.1,
    cashSell: 0.5928,
    marketMid: 0.528978,
    bankMid: 0.5268,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 15896327,
    foreignAtBankMid: 16393443,
    diffForeign: 2134859,
    diffTWD: 4029,
    diffPct: 15.5,
    cashSell: 0.00218,
    marketMid: 0.001887,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3553,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3905,
    diffForeign: 209,
    diffTWD: 1671,
    diffPct: 5.9,
    cashSell: 8.444,
    marketMid: 7.973782,
    bankMid: 7.6815,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24595222,
    foreignAtBankMid: 25531915,
    diffForeign: 2856092,
    diffTWD: 3484,
    diffPct: 13.1,
    cashSell: 0.00138,
    marketMid: 0.00122,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/03/30 07:19:24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-03-30';
