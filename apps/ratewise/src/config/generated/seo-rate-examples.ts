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
 * 匯率時間：2026/10/16 10:35:52
 * 生成日期：2026-10-16
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
    foreignAtCash: 915,
    foreignAtMarketMid: 927,
    foreignAtBankMid: 925,
    diffForeign: 12,
    diffTWD: 375,
    diffPct: 1.3,
    cashSell: 32.77,
    cashBuy: 32.1,
    marketMid: 32.360365,
    bankMid: 32.435,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143403,
    foreignAtMarketMid: 146440,
    foreignAtBankMid: 147929,
    diffForeign: 3037,
    diffTWD: 622,
    diffPct: 2.1,
    cashSell: 0.2092,
    cashBuy: 0.1964,
    marketMid: 0.204862,
    bankMid: 0.2028,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 811,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 826,
    diffForeign: 16,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 36.98,
    cashBuy: 35.64,
    marketMid: 36.297641,
    bankMid: 36.31,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 681,
    foreignAtMarketMid: 699,
    foreignAtBankMid: 697,
    diffForeign: 18,
    diffTWD: 779,
    diffPct: 2.7,
    cashSell: 44.08,
    cashBuy: 41.96,
    marketMid: 42.935039,
    bankMid: 43.02,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6095,
    foreignAtMarketMid: 6228,
    foreignAtBankMid: 6197,
    diffForeign: 133,
    diffTWD: 640,
    diffPct: 2.2,
    cashSell: 4.922,
    cashBuy: 4.76,
    marketMid: 4.816956,
    bankMid: 4.841,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1138952,
    foreignAtMarketMid: 1244505,
    foreignAtBankMid: 1230012,
    diffForeign: 105553,
    diffTWD: 2544,
    diffPct: 9.3,
    cashSell: 0.02634,
    cashBuy: 0.02244,
    marketMid: 0.024106,
    bankMid: 0.02439,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.1,
        rateBuy: 41.5,
        rateInverse: 0.024331,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-16',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7162,
    foreignAtMarketMid: 7272,
    foreignAtBankMid: 7340,
    diffForeign: 110,
    diffTWD: 456,
    diffPct: 1.5,
    cashSell: 4.189,
    cashBuy: 3.985,
    marketMid: 4.125396,
    bankMid: 4.087,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1310,
    foreignAtMarketMid: 1340,
    foreignAtBankMid: 1333,
    diffForeign: 30,
    diffTWD: 680,
    diffPct: 2.3,
    cashSell: 22.9,
    cashBuy: 22.12,
    marketMid: 22.380878,
    bankMid: 22.51,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1286,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1312,
    diffForeign: 30,
    diffTWD: 665,
    diffPct: 2.3,
    cashSell: 23.32,
    cashBuy: 22.41,
    marketMid: 22.802937,
    bankMid: 22.865,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1168,
    foreignAtMarketMid: 1188,
    foreignAtBankMid: 1189,
    diffForeign: 20,
    diffTWD: 506,
    diffPct: 1.7,
    cashSell: 25.68,
    cashBuy: 24.77,
    marketMid: 25.246787,
    bankMid: 25.225,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 756,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 768,
    diffForeign: 12,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 39.66,
    cashBuy: 38.46,
    marketMid: 39.079292,
    bankMid: 39.06,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1605,
    foreignAtMarketMid: 1650,
    foreignAtBankMid: 1642,
    diffForeign: 45,
    diffTWD: 824,
    diffPct: 2.8,
    cashSell: 18.69,
    cashBuy: 17.84,
    marketMid: 18.176861,
    bankMid: 18.265,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29098,
    foreignAtMarketMid: 31064,
    foreignAtBankMid: 32051,
    diffForeign: 1966,
    diffTWD: 1899,
    diffPct: 6.8,
    cashSell: 1.031,
    cashBuy: 0.841,
    marketMid: 0.96574,
    bankMid: 0.936,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51591,
    foreignAtMarketMid: 58525,
    foreignAtBankMid: 58196,
    diffForeign: 6934,
    diffTWD: 3554,
    diffPct: 13.4,
    cashSell: 0.5815,
    cashBuy: 0.4495,
    marketMid: 0.512602,
    bankMid: 0.5155,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16633644,
    foreignAtBankMid: 16853933,
    diffForeign: 2549137,
    diffTWD: 4598,
    diffPct: 18.1,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001804,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3547,
    foreignAtMarketMid: 3786,
    foreignAtBankMid: 3898,
    diffForeign: 239,
    diffTWD: 1898,
    diffPct: 6.8,
    cashSell: 8.459,
    cashBuy: 6.934,
    marketMid: 7.923742,
    bankMid: 7.6965,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23919563,
    foreignAtBankMid: 24291498,
    diffForeign: 3086230,
    diffTWD: 3871,
    diffPct: 14.8,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001254,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/16 10:35:52';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-16';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-16';
