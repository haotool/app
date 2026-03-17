/**
 * SEO 匯差範例數據（自動生成）
 *
 * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。
 * 每週一由 GitHub Actions 自動更新並提交。
 *
 * 資料來源：臺灣銀行牌告匯率
 * 匯率時間：2026/03/17 14:45:42
 * 生成日期：2026-03-17
 */

export interface RateExample {
  /** 代表性換匯金額 */
  exampleAmount: number;
  /** 現金賣出 vs 參考匯率，多付約 N 元台幣 */
  diffTWD: number;
  /** 差距百分比（四捨五入到小數一位） */
  diffPct: number;
  /** 參考匯率類型：'spot' = 即期賣出；'mid' = 現金中間價（純現金幣別） */
  refType: 'spot' | 'mid';
  /** 現金賣出匯率 */
  cashSell: number;
  /** 參考匯率 */
  refRate: number;
}

/** 各幣別匯差範例，以常見換匯金額計算 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleAmount: 100,
    diffTWD: 22,
    diffPct: 0.7,
    refType: 'spot',
    cashSell: 32.215,
    refRate: 31.995,
  },
  JPY: {
    exampleAmount: 10000,
    diffTWD: 15,
    diffPct: 0.7,
    refType: 'spot',
    cashSell: 0.204,
    refRate: 0.2025,
  },
  EUR: {
    exampleAmount: 100,
    diffTWD: 32,
    diffPct: 0.9,
    refType: 'spot',
    cashSell: 37.19,
    refRate: 36.87,
  },
  GBP: {
    exampleAmount: 100,
    diffTWD: 71,
    diffPct: 1.7,
    refType: 'spot',
    cashSell: 43.38,
    refRate: 42.67,
  },
  CNY: {
    exampleAmount: 100,
    diffTWD: 4,
    diffPct: 0.9,
    refType: 'spot',
    cashSell: 4.701,
    refRate: 4.661,
  },
  KRW: {
    exampleAmount: 100000,
    diffTWD: 195,
    diffPct: 9,
    refType: 'mid',
    cashSell: 0.02358,
    refRate: 0.02163,
  },
  HKD: {
    exampleAmount: 1000,
    diffTWD: 18,
    diffPct: 0.4,
    refType: 'spot',
    cashSell: 4.125,
    refRate: 4.107,
  },
  AUD: {
    exampleAmount: 100,
    diffTWD: 29,
    diffPct: 1.3,
    refType: 'spot',
    cashSell: 22.97,
    refRate: 22.68,
  },
  CAD: {
    exampleAmount: 100,
    diffTWD: 31,
    diffPct: 1.3,
    refType: 'spot',
    cashSell: 23.74,
    refRate: 23.43,
  },
  SGD: {
    exampleAmount: 100,
    diffTWD: 24,
    diffPct: 1,
    refType: 'spot',
    cashSell: 25.31,
    refRate: 25.07,
  },
  CHF: {
    exampleAmount: 100,
    diffTWD: 27,
    diffPct: 0.7,
    refType: 'spot',
    cashSell: 40.87,
    refRate: 40.6,
  },
  NZD: {
    exampleAmount: 100,
    diffTWD: 27,
    diffPct: 1.4,
    refType: 'spot',
    cashSell: 18.97,
    refRate: 18.7,
  },
  THB: {
    exampleAmount: 1000,
    diffTWD: 37,
    diffPct: 3.7,
    refType: 'spot',
    cashSell: 1.0449,
    refRate: 1.0083,
  },
  PHP: {
    exampleAmount: 1000,
    diffTWD: 66,
    diffPct: 12.4,
    refType: 'mid',
    cashSell: 0.5998,
    refRate: 0.5338,
  },
  IDR: {
    exampleAmount: 1000000,
    diffTWD: 350,
    diffPct: 18.6,
    refType: 'mid',
    cashSell: 0.00223,
    refRate: 0.00188,
  },
  MYR: {
    exampleAmount: 100,
    diffTWD: 76,
    diffPct: 9.6,
    refType: 'mid',
    cashSell: 8.643,
    refRate: 7.8805,
  },
  VND: {
    exampleAmount: 1000000,
    diffTWD: 205,
    diffPct: 17.2,
    refType: 'mid',
    cashSell: 0.0014,
    refRate: 0.00119,
  },
} as const;

/** 資料更新時間（臺灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/03/17 14:45:42';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-03-17';
