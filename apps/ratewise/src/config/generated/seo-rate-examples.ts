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
 * 匯率時間：2026/10/17 06:32:00
 * 生成日期：2026-10-18
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
    foreignAtCash: 921,
    foreignAtMarketMid: 925,
    foreignAtBankMid: 930,
    diffForeign: 4,
    diffTWD: 142,
    diffPct: 0.5,
    cashSell: 32.59,
    cashBuy: 31.92,
    marketMid: 32.435939,
    bankMid: 32.255,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144092,
    foreignAtMarketMid: 146267,
    foreignAtBankMid: 148662,
    diffForeign: 2175,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 0.2082,
    cashBuy: 0.1954,
    marketMid: 0.205104,
    bankMid: 0.2018,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 814,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 829,
    diffForeign: 10,
    diffTWD: 386,
    diffPct: 1.3,
    cashSell: 36.86,
    cashBuy: 35.52,
    marketMid: 36.38613,
    bankMid: 36.19,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 682,
    foreignAtMarketMid: 696,
    foreignAtBankMid: 698,
    diffForeign: 14,
    diffTWD: 610,
    diffPct: 2.1,
    cashSell: 44.01,
    cashBuy: 41.89,
    marketMid: 43.114599,
    bankMid: 42.95,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6122,
    foreignAtMarketMid: 6201,
    foreignAtBankMid: 6225,
    diffForeign: 79,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 4.9,
    cashBuy: 4.738,
    marketMid: 4.837929,
    bankMid: 4.819,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1137225,
    foreignAtMarketMid: 1235727,
    foreignAtBankMid: 1227998,
    diffForeign: 98502,
    diffTWD: 2391,
    diffPct: 8.7,
    cashSell: 0.02638,
    cashBuy: 0.02248,
    marketMid: 0.024277,
    bankMid: 0.02443,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.85,
        rateBuy: 41.5,
        rateInverse: 0.02448,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-18',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7199,
    foreignAtMarketMid: 7264,
    foreignAtBankMid: 7380,
    diffForeign: 65,
    diffTWD: 265,
    diffPct: 0.9,
    cashSell: 4.167,
    cashBuy: 3.963,
    marketMid: 4.130166,
    bankMid: 4.065,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1313,
    foreignAtMarketMid: 1332,
    foreignAtBankMid: 1336,
    diffForeign: 19,
    diffTWD: 425,
    diffPct: 1.4,
    cashSell: 22.85,
    cashBuy: 22.07,
    marketMid: 22.526074,
    bankMid: 22.46,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1289,
    foreignAtMarketMid: 1311,
    foreignAtBankMid: 1314,
    diffForeign: 22,
    diffTWD: 503,
    diffPct: 1.7,
    cashSell: 23.28,
    cashBuy: 22.37,
    marketMid: 22.889581,
    bankMid: 22.825,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1172,
    foreignAtMarketMid: 1185,
    foreignAtBankMid: 1194,
    diffForeign: 13,
    diffTWD: 323,
    diffPct: 1.1,
    cashSell: 25.59,
    cashBuy: 24.68,
    marketMid: 25.314533,
    bankMid: 25.135,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 757,
    foreignAtMarketMid: 764,
    foreignAtBankMid: 769,
    diffForeign: 7,
    diffTWD: 259,
    diffPct: 0.9,
    cashSell: 39.62,
    cashBuy: 38.42,
    marketMid: 39.277298,
    bankMid: 39.02,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1609,
    foreignAtMarketMid: 1638,
    foreignAtBankMid: 1646,
    diffForeign: 29,
    diffTWD: 547,
    diffPct: 1.9,
    cashSell: 18.65,
    cashBuy: 17.8,
    marketMid: 18.309988,
    bankMid: 18.225,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29197,
    foreignAtMarketMid: 30959,
    foreignAtBankMid: 32172,
    diffForeign: 1762,
    diffTWD: 1707,
    diffPct: 6,
    cashSell: 1.0275,
    cashBuy: 0.8375,
    marketMid: 0.969021,
    bankMid: 0.9325,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51787,
    foreignAtMarketMid: 58336,
    foreignAtBankMid: 58445,
    diffForeign: 6549,
    diffTWD: 3368,
    diffPct: 12.6,
    cashSell: 0.5793,
    cashBuy: 0.4473,
    marketMid: 0.514261,
    bankMid: 0.5133,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16659644,
    foreignAtBankMid: 17341040,
    diffForeign: 2236567,
    diffTWD: 4028,
    diffPct: 15.5,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001801,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3564,
    foreignAtMarketMid: 3779,
    foreignAtBankMid: 3919,
    diffForeign: 215,
    diffTWD: 1707,
    diffPct: 6,
    cashSell: 8.418,
    cashBuy: 6.893,
    marketMid: 7.939154,
    bankMid: 7.6555,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 23957139,
    foreignAtBankMid: 24896266,
    diffForeign: 2680543,
    diffTWD: 3357,
    diffPct: 12.6,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.001252,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/17 06:32:00';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-17';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-18';
