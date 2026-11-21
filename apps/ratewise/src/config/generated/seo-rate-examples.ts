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
 * 匯率時間：2026/11/21 09:50:25
 * 生成日期：2026-11-21
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
    foreignAtMarketMid: 909,
    foreignAtBankMid: 913,
    diffForeign: 6,
    diffTWD: 201,
    diffPct: 0.7,
    cashSell: 33.21,
    cashBuy: 32.54,
    marketMid: 32.98697,
    bankMid: 32.875,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 141911,
    foreignAtMarketMid: 145194,
    foreignAtBankMid: 146341,
    diffForeign: 3283,
    diffTWD: 678,
    diffPct: 2.3,
    cashSell: 0.2114,
    cashBuy: 0.1986,
    marketMid: 0.20662,
    bankMid: 0.205,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 828,
    foreignAtBankMid: 834,
    diffForeign: 10,
    diffTWD: 352,
    diffPct: 1.2,
    cashSell: 36.66,
    cashBuy: 35.32,
    marketMid: 36.229259,
    bankMid: 35.99,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 681,
    foreignAtMarketMid: 693,
    foreignAtBankMid: 698,
    diffForeign: 12,
    diffTWD: 493,
    diffPct: 1.7,
    cashSell: 44.03,
    cashBuy: 41.91,
    marketMid: 43.306916,
    bankMid: 42.97,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5998,
    foreignAtMarketMid: 6069,
    foreignAtBankMid: 6096,
    diffForeign: 71,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 5.002,
    cashBuy: 4.84,
    marketMid: 4.943154,
    bankMid: 4.921,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1126549,
    foreignAtMarketMid: 1211595,
    foreignAtBankMid: 1215559,
    diffForeign: 85046,
    diffTWD: 2106,
    diffPct: 7.5,
    cashSell: 0.02663,
    cashBuy: 0.02273,
    marketMid: 0.024761,
    bankMid: 0.02468,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.35,
        rateBuy: 41.8,
        rateInverse: 0.024184,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-21',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7057,
    foreignAtMarketMid: 7138,
    foreignAtBankMid: 7231,
    diffForeign: 81,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 4.251,
    cashBuy: 4.047,
    marketMid: 4.20304,
    bankMid: 4.149,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1352,
    foreignAtMarketMid: 1363,
    foreignAtBankMid: 1376,
    diffForeign: 11,
    diffTWD: 238,
    diffPct: 0.8,
    cashSell: 22.19,
    cashBuy: 21.41,
    marketMid: 22.013825,
    bankMid: 21.8,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1308,
    diffForeign: 19,
    diffTWD: 451,
    diffPct: 1.5,
    cashSell: 23.39,
    cashBuy: 22.48,
    marketMid: 23.03829,
    bankMid: 22.935,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1160,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1180,
    diffForeign: 14,
    diffTWD: 355,
    diffPct: 1.2,
    cashSell: 25.87,
    cashBuy: 24.96,
    marketMid: 25.563679,
    bankMid: 25.415,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 758,
    foreignAtMarketMid: 767,
    foreignAtBankMid: 769,
    diffForeign: 9,
    diffTWD: 360,
    diffPct: 1.2,
    cashSell: 39.6,
    cashBuy: 38.4,
    marketMid: 39.125161,
    bankMid: 39,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1631,
    foreignAtMarketMid: 1655,
    foreignAtBankMid: 1670,
    diffForeign: 24,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 18.39,
    cashBuy: 17.54,
    marketMid: 18.126122,
    bankMid: 17.965,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29104,
    foreignAtMarketMid: 30864,
    foreignAtBankMid: 32058,
    diffForeign: 1760,
    diffTWD: 1711,
    diffPct: 6,
    cashSell: 1.0308,
    cashBuy: 0.8408,
    marketMid: 0.972009,
    bankMid: 0.9358,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51546,
    foreignAtMarketMid: 58072,
    foreignAtBankMid: 58140,
    diffForeign: 6526,
    diffTWD: 3371,
    diffPct: 12.7,
    cashSell: 0.582,
    cashBuy: 0.45,
    marketMid: 0.516599,
    bankMid: 0.516,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16628194,
    foreignAtBankMid: 16393443,
    diffForeign: 2866726,
    diffTWD: 5172,
    diffPct: 20.8,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001804,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3526,
    foreignAtMarketMid: 3743,
    foreignAtBankMid: 3873,
    diffForeign: 217,
    diffTWD: 1738,
    diffPct: 6.2,
    cashSell: 8.509,
    cashBuy: 6.984,
    marketMid: 8.015904,
    bankMid: 7.7465,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23386393,
    foreignAtBankMid: 24291498,
    diffForeign: 2553060,
    diffTWD: 3275,
    diffPct: 12.3,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001283,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/21 09:50:25';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-21';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-21';
