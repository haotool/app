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
 * 匯率時間：2026/10/09 14:31:54
 * 生成日期：2026-10-09
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
    foreignAtCash: 933,
    foreignAtMarketMid: 939,
    foreignAtBankMid: 943,
    diffForeign: 6,
    diffTWD: 175,
    diffPct: 0.6,
    cashSell: 32.15,
    cashBuy: 31.48,
    marketMid: 31.962157,
    bankMid: 31.815,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146199,
    foreignAtMarketMid: 148584,
    foreignAtBankMid: 150905,
    diffForeign: 2385,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 0.2052,
    cashBuy: 0.1924,
    marketMid: 0.201905,
    bankMid: 0.1988,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 826,
    foreignAtMarketMid: 838,
    foreignAtBankMid: 841,
    diffForeign: 12,
    diffTWD: 453,
    diffPct: 1.5,
    cashSell: 36.33,
    cashBuy: 34.99,
    marketMid: 35.782016,
    bankMid: 35.66,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 713,
    diffForeign: 14,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 43.12,
    cashBuy: 41,
    marketMid: 42.22438,
    bankMid: 42.06,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6215,
    foreignAtMarketMid: 6312,
    foreignAtBankMid: 6321,
    diffForeign: 97,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 4.827,
    cashBuy: 4.665,
    marketMid: 4.752852,
    bankMid: 4.746,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1157854,
    foreignAtMarketMid: 1259517,
    foreignAtBankMid: 1252087,
    diffForeign: 101663,
    diffTWD: 2421,
    diffPct: 8.8,
    cashSell: 0.02591,
    cashBuy: 0.02201,
    marketMid: 0.023819,
    bankMid: 0.02396,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41,
        rateBuy: 41.5,
        rateInverse: 0.02439,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-09',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7372,
    foreignAtBankMid: 7483,
    diffForeign: 75,
    diffTWD: 305,
    diffPct: 1,
    cashSell: 4.111,
    cashBuy: 3.907,
    marketMid: 4.069176,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1325,
    foreignAtMarketMid: 1348,
    foreignAtBankMid: 1348,
    diffForeign: 23,
    diffTWD: 533,
    diffPct: 1.8,
    cashSell: 22.65,
    cashBuy: 21.87,
    marketMid: 22.247436,
    bankMid: 22.26,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1312,
    foreignAtMarketMid: 1338,
    foreignAtBankMid: 1339,
    diffForeign: 26,
    diffTWD: 569,
    diffPct: 1.9,
    cashSell: 22.86,
    cashBuy: 21.95,
    marketMid: 22.42605,
    bankMid: 22.405,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1210,
    diffForeign: 14,
    diffTWD: 363,
    diffPct: 1.2,
    cashSell: 25.24,
    cashBuy: 24.33,
    marketMid: 24.934547,
    bankMid: 24.785,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 774,
    foreignAtMarketMid: 782,
    foreignAtBankMid: 786,
    diffForeign: 8,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 38.77,
    cashBuy: 37.57,
    marketMid: 38.368568,
    bankMid: 38.17,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1641,
    foreignAtMarketMid: 1675,
    foreignAtBankMid: 1680,
    diffForeign: 34,
    diffTWD: 604,
    diffPct: 2.1,
    cashSell: 18.28,
    cashBuy: 17.43,
    marketMid: 17.912159,
    bankMid: 17.855,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29647,
    foreignAtMarketMid: 31624,
    foreignAtBankMid: 32719,
    diffForeign: 1977,
    diffTWD: 1875,
    diffPct: 6.7,
    cashSell: 1.0119,
    cashBuy: 0.8219,
    marketMid: 0.94866,
    bankMid: 0.9169,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52319,
    foreignAtMarketMid: 59101,
    foreignAtBankMid: 59125,
    diffForeign: 6782,
    diffTWD: 3442,
    diffPct: 13,
    cashSell: 0.5734,
    cashBuy: 0.4414,
    marketMid: 0.507609,
    bankMid: 0.5074,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16772213,
    foreignAtBankMid: 17341040,
    diffForeign: 2349136,
    diffTWD: 4202,
    diffPct: 16.3,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001789,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3615,
    foreignAtMarketMid: 3843,
    foreignAtBankMid: 3981,
    diffForeign: 228,
    diffTWD: 1776,
    diffPct: 6.3,
    cashSell: 8.298,
    cashBuy: 6.773,
    marketMid: 7.806889,
    bankMid: 7.5355,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24228823,
    foreignAtBankMid: 25104603,
    diffForeign: 2800252,
    diffTWD: 3467,
    diffPct: 13.1,
    cashSell: 0.0014,
    cashBuy: 0.00099,
    marketMid: 0.001238,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/09 14:31:54';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-09';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-09';
