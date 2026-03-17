/**
 * SEO 匯差範例數據（自動生成）
 *
 * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。
 * 每週一由 GitHub Actions 自動更新並提交。
 *
 * 資料來源：臺灣銀行牌告匯率 + open.er-api.com 市場中間價
 * 匯率時間：2026/03/17 14:45:42
 * 生成日期：2026-03-17
 */

export interface RateExample {
  /** 換匯情境用的台幣金額（固定 30000） */
  exampleTWD: number;
  /** 現金賣出 vs 市場中間價，多付約 N 元台幣 */
  diffTWD: number;
  /** 差距百分比（四捨五入到小數一位） */
  diffPct: number;
  /** 現金賣出匯率（臺灣銀行） */
  cashSell: number;
  /** 市場中間匯率（open.er-api.com，1 TWD = X units 的倒數，即 1 unit = Y TWD） */
  marketMid: number;
}

/** 各幣別匯差範例：換 3 萬元台幣，現金匯率 vs 市場中間價（Google/XE 顯示）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    diffTWD: 202,
    diffPct: 0.7,
    cashSell: 32.215,
    marketMid: 31.997952,
  },
  JPY: {
    exampleTWD: 30000,
    diffTWD: 451,
    diffPct: 1.5,
    cashSell: 0.204,
    marketMid: 0.200936,
  },
  EUR: {
    exampleTWD: 30000,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 37.19,
    marketMid: 36.752545,
  },
  GBP: {
    exampleTWD: 30000,
    diffTWD: 591,
    diffPct: 2,
    cashSell: 43.38,
    marketMid: 42.526047,
  },
  CNY: {
    exampleTWD: 30000,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 4.701,
    marketMid: 4.644682,
  },
  KRW: {
    exampleTWD: 30000,
    diffTWD: 2701,
    diffPct: 9.9,
    cashSell: 0.02358,
    marketMid: 0.021457,
  },
  HKD: {
    exampleTWD: 30000,
    diffTWD: 299,
    diffPct: 1,
    cashSell: 4.125,
    marketMid: 4.083866,
  },
  AUD: {
    exampleTWD: 30000,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 22.97,
    marketMid: 22.594275,
  },
  CAD: {
    exampleTWD: 30000,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 23.74,
    marketMid: 23.386889,
  },
  SGD: {
    exampleTWD: 30000,
    diffTWD: 348,
    diffPct: 1.2,
    cashSell: 25.31,
    marketMid: 25.016261,
  },
  CHF: {
    exampleTWD: 30000,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 40.87,
    marketMid: 40.584416,
  },
  NZD: {
    exampleTWD: 30000,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 18.97,
    marketMid: 18.712925,
  },
  THB: {
    exampleTWD: 30000,
    diffTWD: 1622,
    diffPct: 5.7,
    cashSell: 1.0449,
    marketMid: 0.988406,
  },
  PHP: {
    exampleTWD: 30000,
    diffTWD: 3238,
    diffPct: 12.1,
    cashSell: 0.5998,
    marketMid: 0.535068,
  },
  IDR: {
    exampleTWD: 30000,
    diffTWD: 4695,
    diffPct: 18.6,
    cashSell: 0.00223,
    marketMid: 0.001881,
  },
  MYR: {
    exampleTWD: 30000,
    diffTWD: 1752,
    diffPct: 6.2,
    cashSell: 8.643,
    marketMid: 8.138352,
  },
  VND: {
    exampleTWD: 30000,
    diffTWD: 3870,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.001219,
  },
} as const;

/** 資料更新時間（臺灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/03/17 14:45:42';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-03-17';
