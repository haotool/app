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
 * 匯率時間：2026/09/17 10:44:53
 * 生成日期：2026-09-17
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
    foreignAtCash: 933,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 943,
    diffForeign: 9,
    diffTWD: 302,
    diffPct: 1,
    cashSell: 32.165,
    marketMid: 31.841049,
    bankMid: 31.83,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144439,
    foreignAtMarketMid: 146764,
    foreignAtBankMid: 149031,
    diffForeign: 2325,
    diffTWD: 475,
    diffPct: 1.6,
    cashSell: 0.2077,
    marketMid: 0.20441,
    bankMid: 0.2013,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 809,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 824,
    diffForeign: 9,
    diffTWD: 335,
    diffPct: 1.1,
    cashSell: 37.08,
    marketMid: 36.6663,
    bankMid: 36.41,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 15,
    diffTWD: 609,
    diffPct: 2.1,
    cashSell: 43.58,
    marketMid: 42.694902,
    bankMid: 42.52,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6227,
    foreignAtMarketMid: 6321,
    foreignAtBankMid: 6333,
    diffForeign: 94,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 4.818,
    marketMid: 4.746084,
    bankMid: 4.737,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1186709,
    foreignAtMarketMid: 1294114,
    foreignAtBankMid: 1285898,
    diffForeign: 107405,
    diffTWD: 2490,
    diffPct: 9.1,
    cashSell: 0.02528,
    marketMid: 0.023182,
    bankMid: 0.02333,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.2,
        rateBuy: 42.5,
        rateInverse: 0.023697,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-17',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7294,
    foreignAtMarketMid: 7397,
    foreignAtBankMid: 7479,
    diffForeign: 103,
    diffTWD: 416,
    diffPct: 1.4,
    cashSell: 4.113,
    marketMid: 4.055923,
    bankMid: 4.011,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1325,
    diffForeign: 23,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 23.03,
    marketMid: 22.626482,
    bankMid: 22.64,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1318,
    diffForeign: 23,
    diffTWD: 546,
    diffPct: 1.9,
    cashSell: 23.21,
    marketMid: 22.787868,
    bankMid: 22.755,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1207,
    diffForeign: 18,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 25.31,
    marketMid: 24.935169,
    bankMid: 24.855,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 769,
    foreignAtMarketMid: 772,
    foreignAtBankMid: 781,
    diffForeign: 3,
    diffTWD: 135,
    diffPct: 0.5,
    cashSell: 39.01,
    marketMid: 38.834951,
    bankMid: 38.41,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1611,
    foreignAtMarketMid: 1643,
    foreignAtBankMid: 1649,
    diffForeign: 32,
    diffTWD: 574,
    diffPct: 2,
    cashSell: 18.62,
    marketMid: 18.263839,
    bankMid: 18.195,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29522,
    foreignAtMarketMid: 31423,
    foreignAtBankMid: 32566,
    diffForeign: 1901,
    diffTWD: 1815,
    diffPct: 6.4,
    cashSell: 1.0162,
    marketMid: 0.954727,
    bankMid: 0.9212,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52256,
    foreignAtMarketMid: 59166,
    foreignAtBankMid: 59043,
    diffForeign: 6910,
    diffTWD: 3504,
    diffPct: 13.2,
    cashSell: 0.5741,
    marketMid: 0.50705,
    bankMid: 0.5081,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16660184,
    foreignAtBankMid: 16853933,
    diffForeign: 2575677,
    diffTWD: 4638,
    diffPct: 18.3,
    cashSell: 0.00213,
    marketMid: 0.001801,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3622,
    foreignAtMarketMid: 3854,
    foreignAtBankMid: 3989,
    diffForeign: 232,
    diffTWD: 1804,
    diffPct: 6.4,
    cashSell: 8.283,
    marketMid: 7.784888,
    bankMid: 7.5205,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24475673,
    foreignAtBankMid: 24896266,
    diffForeign: 3199077,
    diffTWD: 3921,
    diffPct: 15,
    cashSell: 0.00141,
    marketMid: 0.001226,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/17 10:44:53';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-17';
