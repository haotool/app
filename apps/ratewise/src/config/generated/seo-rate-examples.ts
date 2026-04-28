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
 * 匯率時間：2026/04/28 12:52:35
 * 生成日期：2026-04-28
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
    foreignAtCash: 942,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 952,
    diffForeign: 11,
    diffTWD: 332,
    diffPct: 1.1,
    cashSell: 31.835,
    marketMid: 31.483172,
    bankMid: 31.5,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148441,
    foreignAtMarketMid: 151931,
    foreignAtBankMid: 153296,
    diffForeign: 3490,
    diffTWD: 689,
    diffPct: 2.4,
    cashSell: 0.2021,
    marketMid: 0.197457,
    bankMid: 0.1957,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 800,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 815,
    diffForeign: 13,
    diffTWD: 493,
    diffPct: 1.7,
    cashSell: 37.5,
    marketMid: 36.884037,
    bankMid: 36.83,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 687,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 705,
    diffForeign: 17,
    diffTWD: 712,
    diffPct: 2.4,
    cashSell: 43.64,
    marketMid: 42.603954,
    bankMid: 42.58,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6402,
    foreignAtMarketMid: 6513,
    foreignAtBankMid: 6515,
    diffForeign: 111,
    diffTWD: 511,
    diffPct: 1.7,
    cashSell: 4.686,
    marketMid: 4.606172,
    bankMid: 4.605,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1270648,
    foreignAtMarketMid: 1404504,
    foreignAtBankMid: 1385042,
    diffForeign: 133856,
    diffTWD: 2859,
    diffPct: 10.5,
    cashSell: 0.02361,
    marketMid: 0.02136,
    bankMid: 0.02166,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.15,
        rateBuy: 45.2,
        rateInverse: 0.022148,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-28',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7360,
    foreignAtMarketMid: 7474,
    foreignAtBankMid: 7549,
    diffForeign: 114,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 4.076,
    marketMid: 4.013904,
    bankMid: 3.974,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1301,
    foreignAtMarketMid: 1327,
    foreignAtBankMid: 1323,
    diffForeign: 26,
    diffTWD: 580,
    diffPct: 2,
    cashSell: 23.06,
    marketMid: 22.614202,
    bankMid: 22.67,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1273,
    foreignAtMarketMid: 1300,
    foreignAtBankMid: 1298,
    diffForeign: 27,
    diffTWD: 630,
    diffPct: 2.1,
    cashSell: 23.57,
    marketMid: 23.074971,
    bankMid: 23.115,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1195,
    foreignAtMarketMid: 1215,
    foreignAtBankMid: 1217,
    diffForeign: 20,
    diffTWD: 498,
    diffPct: 1.7,
    cashSell: 25.1,
    marketMid: 24.683435,
    bankMid: 24.645,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 749,
    foreignAtBankMid: 752,
    diffForeign: 9,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 40.52,
    marketMid: 40.064103,
    bankMid: 39.92,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1579,
    foreignAtMarketMid: 1613,
    foreignAtBankMid: 1615,
    diffForeign: 34,
    diffTWD: 632,
    diffPct: 2.2,
    cashSell: 19,
    marketMid: 18.599461,
    bankMid: 18.575,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28980,
    foreignAtMarketMid: 30846,
    foreignAtBankMid: 31908,
    diffForeign: 1866,
    diffTWD: 1815,
    diffPct: 6.4,
    cashSell: 1.0352,
    marketMid: 0.972564,
    bankMid: 0.9402,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51405,
    foreignAtMarketMid: 57899,
    foreignAtBankMid: 57960,
    diffForeign: 6494,
    diffTWD: 3365,
    diffPct: 12.6,
    cashSell: 0.5836,
    marketMid: 0.518141,
    bankMid: 0.5176,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16398667,
    foreignAtBankMid: 15957447,
    diffForeign: 2945752,
    diffTWD: 5389,
    diffPct: 21.9,
    cashSell: 0.00223,
    marketMid: 0.001829,
    bankMid: 0.00188,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3532,
    foreignAtMarketMid: 3771,
    foreignAtBankMid: 3881,
    diffForeign: 239,
    diffTWD: 1896,
    diffPct: 6.7,
    cashSell: 8.493,
    marketMid: 7.956146,
    bankMid: 7.7305,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 25011595,
    foreignAtBankMid: 25531915,
    diffForeign: 3272465,
    diffTWD: 3925,
    diffPct: 15.1,
    cashSell: 0.00138,
    marketMid: 0.001199,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/28 12:52:35';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-28';
