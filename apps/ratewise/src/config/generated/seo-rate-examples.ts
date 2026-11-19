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
 * 匯率時間：2026/11/19 08:21:00
 * 生成日期：2026-11-19
 */

/** 替代換匯管道資訊（如明洞換匯所） */
export interface AlternativeProvider {
  /** 換匯所名稱（繁體中文） */
  name: string;
  /** 換匯所英文名稱 */
  nameEn: string;
  /** 匯率：1 TWD 可換得多少外幣（以 KRW 為例：46.0 表示 1 TWD = 46 KRW） */
  rate: number;
  /** 反向匯率：1 單位外幣 = N TWD（= 1/rate，計算值，非換匯所實際買入報價） */
  rateInverse: number;
  /** 換匯所實際買入報價：持外幣換 TWD 的到手匯率（KRW→TWD 方向使用此欄位） */
  rateBuy?: number;
  /** 資料來源名稱 */
  source: string;
  /** 資料來源 URL */
  sourceUrl: string;
  /** 匯率更新日期（YYYY-MM-DD） */
  rateDate: string;
  /** 適用說明備注 */
  note: string;
}

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
  /** 台灣銀行現金買入匯率（未提供時省略） */
  cashBuy?: number;
  /** 市場中間匯率（open.er-api.com，每 1 單位外幣 = N 台幣） */
  marketMid: number;
  /** 台銀自身現金中間價（(買入+賣出)/2，雙重驗證用，null 代表無現金買入資料） */
  bankMid: number | null;
  /** 台灣銀行是否提供即期賣出匯率（true = 有即期報價；false = 現金專屬幣別） */
  spotAvailable: boolean;
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 903,
    foreignAtMarketMid: 910,
    foreignAtBankMid: 912,
    diffForeign: 7,
    diffTWD: 219,
    diffPct: 0.7,
    cashSell: 33.215,
    cashBuy: 32.545,
    marketMid: 32.97283,
    bankMid: 32.88,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142586,
    foreignAtMarketMid: 145150,
    foreignAtBankMid: 147059,
    diffForeign: 2564,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 0.2104,
    cashBuy: 0.1976,
    marketMid: 0.206682,
    bankMid: 0.204,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 833,
    diffForeign: 12,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 36.69,
    cashBuy: 35.35,
    marketMid: 36.150676,
    bankMid: 36.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 678,
    foreignAtMarketMid: 692,
    foreignAtBankMid: 695,
    diffForeign: 14,
    diffTWD: 609,
    diffPct: 2.1,
    cashSell: 44.25,
    cashBuy: 42.13,
    marketMid: 43.351975,
    bankMid: 43.19,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5993,
    foreignAtMarketMid: 6081,
    foreignAtBankMid: 6091,
    diffForeign: 88,
    diffTWD: 435,
    diffPct: 1.5,
    cashSell: 5.006,
    cashBuy: 4.844,
    marketMid: 4.933399,
    bankMid: 4.925,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1115656,
    foreignAtMarketMid: 1211923,
    foreignAtBankMid: 1202887,
    diffForeign: 96267,
    diffTWD: 2383,
    diffPct: 8.6,
    cashSell: 0.02689,
    cashBuy: 0.02299,
    marketMid: 0.024754,
    bankMid: 0.02494,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41,
        rateBuy: 41.1,
        rateInverse: 0.02439,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-19',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7062,
    foreignAtMarketMid: 7146,
    foreignAtBankMid: 7236,
    diffForeign: 84,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 4.248,
    cashBuy: 4.044,
    marketMid: 4.198082,
    bankMid: 4.146,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1333,
    foreignAtMarketMid: 1354,
    foreignAtBankMid: 1356,
    diffForeign: 21,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 22.51,
    cashBuy: 21.73,
    marketMid: 22.164103,
    bankMid: 22.12,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1281,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1306,
    diffForeign: 23,
    diffTWD: 532,
    diffPct: 1.8,
    cashSell: 23.42,
    cashBuy: 22.51,
    marketMid: 23.004371,
    bankMid: 22.965,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1159,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1180,
    diffForeign: 15,
    diffTWD: 379,
    diffPct: 1.3,
    cashSell: 25.88,
    cashBuy: 24.97,
    marketMid: 25.553227,
    bankMid: 25.425,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 772,
    diffForeign: 8,
    diffTWD: 276,
    diffPct: 0.9,
    cashSell: 39.45,
    cashBuy: 38.25,
    marketMid: 39.086929,
    bankMid: 38.85,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1625,
    foreignAtMarketMid: 1656,
    foreignAtBankMid: 1663,
    diffForeign: 31,
    diffTWD: 560,
    diffPct: 1.9,
    cashSell: 18.46,
    cashBuy: 17.61,
    marketMid: 18.115286,
    bankMid: 18.035,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29084,
    foreignAtMarketMid: 30927,
    foreignAtBankMid: 32034,
    diffForeign: 1843,
    diffTWD: 1788,
    diffPct: 6.3,
    cashSell: 1.0315,
    cashBuy: 0.8415,
    marketMid: 0.970018,
    bankMid: 0.9365,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51405,
    foreignAtMarketMid: 57911,
    foreignAtBankMid: 57960,
    diffForeign: 6506,
    diffTWD: 3370,
    diffPct: 12.7,
    cashSell: 0.5836,
    cashBuy: 0.4516,
    marketMid: 0.518033,
    bankMid: 0.5176,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16592853,
    foreignAtBankMid: 16393443,
    diffForeign: 2831385,
    diffTWD: 5119,
    diffPct: 20.6,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001808,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3528,
    foreignAtMarketMid: 3748,
    foreignAtBankMid: 3875,
    diffForeign: 220,
    diffTWD: 1763,
    diffPct: 6.2,
    cashSell: 8.504,
    cashBuy: 6.979,
    marketMid: 8.004354,
    bankMid: 7.7415,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23412284,
    foreignAtBankMid: 24096386,
    diffForeign: 2722629,
    diffTWD: 3489,
    diffPct: 13.2,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001281,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/19 08:21:00';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-19';
