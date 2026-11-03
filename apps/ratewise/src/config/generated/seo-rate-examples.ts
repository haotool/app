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
 * 匯率時間：2026/11/03 08:00:21
 * 生成日期：2026-11-03
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
    foreignAtCash: 913,
    foreignAtMarketMid: 921,
    foreignAtBankMid: 922,
    diffForeign: 8,
    diffTWD: 247,
    diffPct: 0.8,
    cashSell: 32.86,
    cashBuy: 32.19,
    marketMid: 32.589213,
    bankMid: 32.525,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142857,
    foreignAtMarketMid: 145310,
    foreignAtBankMid: 147348,
    diffForeign: 2453,
    diffTWD: 506,
    diffPct: 1.7,
    cashSell: 0.21,
    cashBuy: 0.1972,
    marketMid: 0.206455,
    bankMid: 0.2036,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 811,
    foreignAtMarketMid: 822,
    foreignAtBankMid: 826,
    diffForeign: 11,
    diffTWD: 406,
    diffPct: 1.4,
    cashSell: 37,
    cashBuy: 35.66,
    marketMid: 36.499015,
    bankMid: 36.33,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 672,
    foreignAtMarketMid: 686,
    foreignAtBankMid: 689,
    diffForeign: 14,
    diffTWD: 621,
    diffPct: 2.1,
    cashSell: 44.63,
    cashBuy: 42.51,
    marketMid: 43.706294,
    bankMid: 43.57,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6037,
    foreignAtMarketMid: 6123,
    foreignAtBankMid: 6137,
    diffForeign: 86,
    diffTWD: 419,
    diffPct: 1.4,
    cashSell: 4.969,
    cashBuy: 4.807,
    marketMid: 4.899559,
    bankMid: 4.888,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1137225,
    foreignAtMarketMid: 1238102,
    foreignAtBankMid: 1227998,
    diffForeign: 100877,
    diffTWD: 2444,
    diffPct: 8.9,
    cashSell: 0.02638,
    cashBuy: 0.02248,
    marketMid: 0.024231,
    bankMid: 0.02443,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.6,
        rateBuy: 41,
        rateInverse: 0.024631,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-03',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7139,
    foreignAtMarketMid: 7222,
    foreignAtBankMid: 7317,
    diffForeign: 83,
    diffTWD: 342,
    diffPct: 1.2,
    cashSell: 4.202,
    cashBuy: 3.998,
    marketMid: 4.154083,
    bankMid: 4.1,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1315,
    diffForeign: 22,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 23.2,
    cashBuy: 22.42,
    marketMid: 22.820109,
    bankMid: 22.81,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1265,
    foreignAtMarketMid: 1287,
    foreignAtBankMid: 1289,
    diffForeign: 22,
    diffTWD: 522,
    diffPct: 1.8,
    cashSell: 23.72,
    cashBuy: 22.81,
    marketMid: 23.307307,
    bankMid: 23.265,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1162,
    foreignAtMarketMid: 1178,
    foreignAtBankMid: 1183,
    diffForeign: 16,
    diffTWD: 387,
    diffPct: 1.3,
    cashSell: 25.81,
    cashBuy: 24.9,
    marketMid: 25.477058,
    bankMid: 25.355,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 746,
    foreignAtMarketMid: 754,
    foreignAtBankMid: 758,
    diffForeign: 8,
    diffTWD: 312,
    diffPct: 1,
    cashSell: 40.19,
    cashBuy: 38.99,
    marketMid: 39.772501,
    bankMid: 39.59,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1606,
    foreignAtMarketMid: 1638,
    foreignAtBankMid: 1643,
    diffForeign: 32,
    diffTWD: 586,
    diffPct: 2,
    cashSell: 18.68,
    cashBuy: 17.83,
    marketMid: 18.315018,
    bankMid: 18.255,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29189,
    foreignAtMarketMid: 31054,
    foreignAtBankMid: 32161,
    diffForeign: 1865,
    diffTWD: 1802,
    diffPct: 6.4,
    cashSell: 1.0278,
    cashBuy: 0.8378,
    marketMid: 0.966068,
    bankMid: 0.9328,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51564,
    foreignAtMarketMid: 58292,
    foreignAtBankMid: 58162,
    diffForeign: 6728,
    diffTWD: 3462,
    diffPct: 13,
    cashSell: 0.5818,
    cashBuy: 0.4498,
    marketMid: 0.514654,
    bankMid: 0.5158,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16703938,
    foreignAtBankMid: 17341040,
    diffForeign: 2280861,
    diffTWD: 4096,
    diffPct: 15.8,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001796,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3527,
    foreignAtMarketMid: 3748,
    foreignAtBankMid: 3874,
    diffForeign: 221,
    diffTWD: 1767,
    diffPct: 6.3,
    cashSell: 8.506,
    cashBuy: 6.981,
    marketMid: 8.005059,
    bankMid: 7.7435,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20979021,
    foreignAtMarketMid: 23693594,
    foreignAtBankMid: 24489796,
    diffForeign: 2714573,
    diffTWD: 3437,
    diffPct: 12.9,
    cashSell: 0.00143,
    cashBuy: 0.00102,
    marketMid: 0.001266,
    bankMid: 0.001225,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/03 08:00:21';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-03';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-03';
