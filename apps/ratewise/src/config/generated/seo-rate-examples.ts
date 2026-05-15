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
 * 匯率時間：2026/05/15 07:09:19
 * 生成日期：2026-05-15
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
    foreignAtCash: 944,
    foreignAtMarketMid: 951,
    foreignAtBankMid: 954,
    diffForeign: 7,
    diffTWD: 206,
    diffPct: 0.7,
    cashSell: 31.775,
    marketMid: 31.556692,
    bankMid: 31.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148075,
    foreignAtMarketMid: 150324,
    foreignAtBankMid: 152905,
    diffForeign: 2249,
    diffTWD: 449,
    diffPct: 1.5,
    cashSell: 0.2026,
    marketMid: 0.199569,
    bankMid: 0.1962,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 804,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 819,
    diffForeign: 10,
    diffTWD: 351,
    diffPct: 1.2,
    cashSell: 37.31,
    marketMid: 36.873156,
    bankMid: 36.64,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 695,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 712,
    diffForeign: 10,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 43.17,
    marketMid: 42.526047,
    bankMid: 42.11,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6371,
    foreignAtMarketMid: 6465,
    foreignAtBankMid: 6482,
    diffForeign: 94,
    diffTWD: 437,
    diffPct: 1.5,
    cashSell: 4.709,
    marketMid: 4.640371,
    bankMid: 4.628,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1288660,
    foreignAtMarketMid: 1418450,
    foreignAtBankMid: 1406470,
    diffForeign: 129790,
    diffTWD: 2745,
    diffPct: 10.1,
    cashSell: 0.02328,
    marketMid: 0.02115,
    bankMid: 0.02133,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.3,
        rateBuy: 45.5,
        rateInverse: 0.022075,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7369,
    foreignAtMarketMid: 7450,
    foreignAtBankMid: 7559,
    diffForeign: 81,
    diffTWD: 327,
    diffPct: 1.1,
    cashSell: 4.071,
    marketMid: 4.026624,
    bankMid: 3.969,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1318,
    diffForeign: 20,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 23.15,
    marketMid: 22.803977,
    bankMid: 22.76,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1305,
    foreignAtBankMid: 1308,
    diffForeign: 22,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 23.39,
    marketMid: 22.989563,
    bankMid: 22.935,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1213,
    foreignAtBankMid: 1220,
    diffForeign: 15,
    diffTWD: 361,
    diffPct: 1.2,
    cashSell: 25.04,
    marketMid: 24.738392,
    bankMid: 24.585,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 745,
    foreignAtBankMid: 750,
    diffForeign: 6,
    diffTWD: 242,
    diffPct: 0.8,
    cashSell: 40.6,
    marketMid: 40.27224,
    bankMid: 40,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1579,
    foreignAtMarketMid: 1607,
    foreignAtBankMid: 1615,
    diffForeign: 28,
    diffTWD: 523,
    diffPct: 1.8,
    cashSell: 19,
    marketMid: 18.668907,
    bankMid: 18.575,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29016,
    foreignAtMarketMid: 30799,
    foreignAtBankMid: 31952,
    diffForeign: 1783,
    diffTWD: 1737,
    diffPct: 6.1,
    cashSell: 1.0339,
    marketMid: 0.974052,
    bankMid: 0.9389,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51948,
    foreignAtMarketMid: 58557,
    foreignAtBankMid: 58651,
    diffForeign: 6609,
    diffTWD: 3386,
    diffPct: 12.7,
    cashSell: 0.5775,
    marketMid: 0.512326,
    bankMid: 0.5115,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16595261,
    foreignAtBankMid: 16393443,
    diffForeign: 2833793,
    diffTWD: 5123,
    diffPct: 20.6,
    cashSell: 0.00218,
    marketMid: 0.001808,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3524,
    foreignAtMarketMid: 3739,
    foreignAtBankMid: 3871,
    diffForeign: 215,
    diffTWD: 1723,
    diffPct: 6.1,
    cashSell: 8.513,
    marketMid: 8.023943,
    bankMid: 7.7505,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24972690,
    foreignAtBankMid: 25974026,
    diffForeign: 2913866,
    diffTWD: 3500,
    diffPct: 13.2,
    cashSell: 0.00136,
    marketMid: 0.001201,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/15 07:09:19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-15';
