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
 * 匯率時間：2026/11/28 07:21:21
 * 生成日期：2026-11-28
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
    foreignAtBankMid: 913,
    diffForeign: 7,
    diffTWD: 209,
    diffPct: 0.7,
    cashSell: 33.21,
    cashBuy: 32.54,
    marketMid: 32.978267,
    bankMid: 32.875,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142789,
    foreignAtMarketMid: 145032,
    foreignAtBankMid: 147275,
    diffForeign: 2243,
    diffTWD: 464,
    diffPct: 1.6,
    cashSell: 0.2101,
    cashBuy: 0.1973,
    marketMid: 0.20685,
    bankMid: 0.2037,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 821,
    foreignAtMarketMid: 831,
    foreignAtBankMid: 836,
    diffForeign: 10,
    diffTWD: 364,
    diffPct: 1.2,
    cashSell: 36.55,
    cashBuy: 35.21,
    marketMid: 36.106297,
    bankMid: 35.88,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 681,
    foreignAtMarketMid: 694,
    foreignAtBankMid: 697,
    diffForeign: 13,
    diffTWD: 576,
    diffPct: 2,
    cashSell: 44.08,
    cashBuy: 41.96,
    marketMid: 43.233895,
    bankMid: 43.02,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5981,
    foreignAtMarketMid: 6069,
    foreignAtBankMid: 6079,
    diffForeign: 88,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 5.016,
    cashBuy: 4.854,
    marketMid: 4.943154,
    bankMid: 4.935,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1116902,
    foreignAtMarketMid: 1214393,
    foreignAtBankMid: 1204336,
    diffForeign: 97491,
    diffTWD: 2408,
    diffPct: 8.7,
    cashSell: 0.02686,
    cashBuy: 0.02296,
    marketMid: 0.024704,
    bankMid: 0.02491,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.8,
        rateBuy: 41.1,
        rateInverse: 0.02451,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-28',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7049,
    foreignAtMarketMid: 7123,
    foreignAtBankMid: 7222,
    diffForeign: 74,
    diffTWD: 310,
    diffPct: 1,
    cashSell: 4.256,
    cashBuy: 4.052,
    marketMid: 4.211998,
    bankMid: 4.154,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1346,
    foreignAtMarketMid: 1369,
    foreignAtBankMid: 1370,
    diffForeign: 23,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 22.29,
    cashBuy: 21.51,
    marketMid: 21.919249,
    bankMid: 21.9,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1274,
    foreignAtMarketMid: 1295,
    foreignAtBankMid: 1300,
    diffForeign: 21,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 23.54,
    cashBuy: 22.63,
    marketMid: 23.164771,
    bankMid: 23.085,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1160,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1181,
    diffForeign: 14,
    diffTWD: 349,
    diffPct: 1.2,
    cashSell: 25.86,
    cashBuy: 24.95,
    marketMid: 25.559105,
    bankMid: 25.405,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 760,
    foreignAtBankMid: 766,
    diffForeign: 5,
    diffTWD: 212,
    diffPct: 0.7,
    cashSell: 39.76,
    cashBuy: 38.56,
    marketMid: 39.478879,
    bankMid: 39.16,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1633,
    foreignAtMarketMid: 1664,
    foreignAtBankMid: 1672,
    diffForeign: 31,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 18.37,
    cashBuy: 17.52,
    marketMid: 18.030363,
    bankMid: 17.945,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29050,
    foreignAtMarketMid: 30879,
    foreignAtBankMid: 31993,
    diffForeign: 1829,
    diffTWD: 1777,
    diffPct: 6.3,
    cashSell: 1.0327,
    cashBuy: 0.8427,
    marketMid: 0.971541,
    bankMid: 0.9377,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51440,
    foreignAtMarketMid: 58068,
    foreignAtBankMid: 58005,
    diffForeign: 6628,
    diffTWD: 3424,
    diffPct: 12.9,
    cashSell: 0.5832,
    cashBuy: 0.4512,
    marketMid: 0.516632,
    bankMid: 0.5172,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16662466,
    foreignAtBankMid: 16393443,
    diffForeign: 2900998,
    diffTWD: 5223,
    diffPct: 21.1,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.0018,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3534,
    foreignAtMarketMid: 3747,
    foreignAtBankMid: 3882,
    diffForeign: 213,
    diffTWD: 1709,
    diffPct: 6,
    cashSell: 8.49,
    cashBuy: 6.965,
    marketMid: 8.006341,
    bankMid: 7.7275,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23475165,
    foreignAtBankMid: 24291498,
    diffForeign: 2641832,
    diffTWD: 3376,
    diffPct: 12.7,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001278,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/28 07:21:21';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-28';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-28';
