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
 * 匯率時間：2026/11/06 10:43:32
 * 生成日期：2026-11-06
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
    foreignAtMarketMid: 908,
    foreignAtBankMid: 912,
    diffForeign: 5,
    diffTWD: 161,
    diffPct: 0.5,
    cashSell: 33.23,
    cashBuy: 32.56,
    marketMid: 33.051296,
    bankMid: 32.895,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 141309,
    foreignAtMarketMid: 143886,
    foreignAtBankMid: 145702,
    diffForeign: 2577,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 0.2123,
    cashBuy: 0.1995,
    marketMid: 0.208498,
    bankMid: 0.2059,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 815,
    diffForeign: 9,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 37.47,
    cashBuy: 36.13,
    marketMid: 37.021954,
    bankMid: 36.8,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 663,
    foreignAtMarketMid: 676,
    foreignAtBankMid: 679,
    diffForeign: 13,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 45.24,
    cashBuy: 43.12,
    marketMid: 44.404973,
    bankMid: 44.18,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5989,
    foreignAtMarketMid: 6078,
    foreignAtBankMid: 6088,
    diffForeign: 89,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 5.009,
    cashBuy: 4.847,
    marketMid: 4.935834,
    bankMid: 4.928,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1134216,
    foreignAtMarketMid: 1227352,
    foreignAtBankMid: 1224490,
    diffForeign: 93136,
    diffTWD: 2277,
    diffPct: 8.2,
    cashSell: 0.02645,
    cashBuy: 0.02255,
    marketMid: 0.024443,
    bankMid: 0.0245,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.7,
        rateBuy: 41.5,
        rateInverse: 0.02457,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-06',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7056,
    foreignAtMarketMid: 7137,
    foreignAtBankMid: 7229,
    diffForeign: 81,
    diffTWD: 341,
    diffPct: 1.2,
    cashSell: 4.252,
    cashBuy: 4.048,
    marketMid: 4.203624,
    bankMid: 4.15,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1305,
    foreignAtBankMid: 1315,
    diffForeign: 12,
    diffTWD: 281,
    diffPct: 0.9,
    cashSell: 23.21,
    cashBuy: 22.43,
    marketMid: 22.992734,
    bankMid: 22.82,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1254,
    foreignAtMarketMid: 1271,
    foreignAtBankMid: 1278,
    diffForeign: 17,
    diffTWD: 405,
    diffPct: 1.4,
    cashSell: 23.92,
    cashBuy: 23.01,
    marketMid: 23.597149,
    bankMid: 23.465,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1149,
    foreignAtMarketMid: 1162,
    foreignAtBankMid: 1170,
    diffForeign: 13,
    diffTWD: 336,
    diffPct: 1.1,
    cashSell: 26.1,
    cashBuy: 25.19,
    marketMid: 25.807784,
    bankMid: 25.645,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 743,
    foreignAtBankMid: 748,
    diffForeign: 6,
    diffTWD: 251,
    diffPct: 0.8,
    cashSell: 40.72,
    cashBuy: 39.52,
    marketMid: 40.379568,
    bankMid: 40.12,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1597,
    foreignAtMarketMid: 1619,
    foreignAtBankMid: 1634,
    diffForeign: 22,
    diffTWD: 397,
    diffPct: 1.3,
    cashSell: 18.78,
    cashBuy: 17.93,
    marketMid: 18.531216,
    bankMid: 18.355,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28656,
    foreignAtMarketMid: 30385,
    foreignAtBankMid: 31516,
    diffForeign: 1729,
    diffTWD: 1707,
    diffPct: 6,
    cashSell: 1.0469,
    cashBuy: 0.8569,
    marketMid: 0.987326,
    bankMid: 0.9519,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50934,
    foreignAtMarketMid: 57092,
    foreignAtBankMid: 57361,
    diffForeign: 6158,
    diffTWD: 3236,
    diffPct: 12.1,
    cashSell: 0.589,
    cashBuy: 0.457,
    marketMid: 0.525471,
    bankMid: 0.523,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16427313,
    foreignAtBankMid: 16393443,
    diffForeign: 2665845,
    diffTWD: 4868,
    diffPct: 19.4,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001826,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3481,
    foreignAtMarketMid: 3686,
    foreignAtBankMid: 3818,
    diffForeign: 205,
    diffTWD: 1671,
    diffPct: 5.9,
    cashSell: 8.619,
    cashBuy: 7.094,
    marketMid: 8.138882,
    bankMid: 7.8565,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20408163,
    foreignAtMarketMid: 23334144,
    foreignAtBankMid: 23715415,
    diffForeign: 2925981,
    diffTWD: 3762,
    diffPct: 14.3,
    cashSell: 0.00147,
    cashBuy: 0.00106,
    marketMid: 0.001286,
    bankMid: 0.001265,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/06 10:43:32';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-06';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-06';
