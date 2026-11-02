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
 * 匯率時間：2026/11/02 09:03:34
 * 生成日期：2026-11-02
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
    foreignAtMarketMid: 919,
    foreignAtBankMid: 922,
    diffForeign: 6,
    diffTWD: 217,
    diffPct: 0.7,
    cashSell: 32.875,
    cashBuy: 32.205,
    marketMid: 32.637076,
    bankMid: 32.54,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142721,
    foreignAtMarketMid: 144834,
    foreignAtBankMid: 147203,
    diffForeign: 2113,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 0.2102,
    cashBuy: 0.1974,
    marketMid: 0.207133,
    bankMid: 0.2038,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 812,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 827,
    diffForeign: 12,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 36.93,
    cashBuy: 35.59,
    marketMid: 36.390102,
    bankMid: 36.26,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 673,
    foreignAtMarketMid: 687,
    foreignAtBankMid: 689,
    diffForeign: 14,
    diffTWD: 600,
    diffPct: 2,
    cashSell: 44.58,
    cashBuy: 42.46,
    marketMid: 43.689108,
    bankMid: 43.52,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6042,
    foreignAtMarketMid: 6135,
    foreignAtBankMid: 6143,
    diffForeign: 93,
    diffTWD: 453,
    diffPct: 1.5,
    cashSell: 4.965,
    cashBuy: 4.803,
    marketMid: 4.889976,
    bankMid: 4.884,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1131222,
    foreignAtMarketMid: 1224954,
    foreignAtBankMid: 1221001,
    diffForeign: 93732,
    diffTWD: 2296,
    diffPct: 8.3,
    cashSell: 0.02652,
    cashBuy: 0.02262,
    marketMid: 0.024491,
    bankMid: 0.02457,
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
        rateDate: '2026-11-02',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7136,
    foreignAtMarketMid: 7212,
    foreignAtBankMid: 7314,
    diffForeign: 76,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 4.204,
    cashBuy: 4,
    marketMid: 4.159751,
    bankMid: 4.102,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1287,
    foreignAtMarketMid: 1308,
    foreignAtBankMid: 1309,
    diffForeign: 21,
    diffTWD: 476,
    diffPct: 1.6,
    cashSell: 23.31,
    cashBuy: 22.53,
    marketMid: 22.939989,
    bankMid: 22.92,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1263,
    foreignAtMarketMid: 1284,
    foreignAtBankMid: 1287,
    diffForeign: 21,
    diffTWD: 510,
    diffPct: 1.7,
    cashSell: 23.76,
    cashBuy: 22.85,
    marketMid: 23.355755,
    bankMid: 23.305,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1161,
    foreignAtMarketMid: 1175,
    foreignAtBankMid: 1182,
    diffForeign: 14,
    diffTWD: 349,
    diffPct: 1.2,
    cashSell: 25.83,
    cashBuy: 24.92,
    marketMid: 25.52909,
    bankMid: 25.375,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 758,
    foreignAtBankMid: 763,
    diffForeign: 6,
    diffTWD: 254,
    diffPct: 0.9,
    cashSell: 39.92,
    cashBuy: 38.72,
    marketMid: 39.582014,
    bankMid: 39.32,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1603,
    foreignAtMarketMid: 1634,
    foreignAtBankMid: 1641,
    diffForeign: 31,
    diffTWD: 568,
    diffPct: 1.9,
    cashSell: 18.71,
    cashBuy: 17.86,
    marketMid: 18.356034,
    bankMid: 18.285,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29226,
    foreignAtMarketMid: 31057,
    foreignAtBankMid: 32206,
    diffForeign: 1831,
    diffTWD: 1769,
    diffPct: 6.3,
    cashSell: 1.0265,
    cashBuy: 0.8365,
    marketMid: 0.965976,
    bankMid: 0.9315,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51921,
    foreignAtMarketMid: 58567,
    foreignAtBankMid: 58617,
    diffForeign: 6646,
    diffTWD: 3404,
    diffPct: 12.8,
    cashSell: 0.5778,
    cashBuy: 0.4458,
    marketMid: 0.51223,
    bankMid: 0.5118,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16667739,
    foreignAtBankMid: 16853933,
    diffForeign: 2583232,
    diffTWD: 4650,
    diffPct: 18.3,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.0018,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3518,
    foreignAtMarketMid: 3730,
    foreignAtBankMid: 3863,
    diffForeign: 212,
    diffTWD: 1708,
    diffPct: 6,
    cashSell: 8.528,
    cashBuy: 7.003,
    marketMid: 8.0424,
    bankMid: 7.7655,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23662444,
    foreignAtBankMid: 24096386,
    diffForeign: 2972789,
    diffTWD: 3769,
    diffPct: 14.4,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001268,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/02 09:03:34';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-02';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-02';
