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
 * 匯率時間：2026/05/08 12:36:58
 * 生成日期：2026-05-08
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
    foreignAtCash: 948,
    foreignAtMarketMid: 955,
    foreignAtBankMid: 958,
    diffForeign: 7,
    diffTWD: 225,
    diffPct: 0.8,
    cashSell: 31.65,
    marketMid: 31.412955,
    bankMid: 31.315,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147348,
    foreignAtMarketMid: 149574,
    foreignAtBankMid: 152130,
    diffForeign: 2226,
    diffTWD: 447,
    diffPct: 1.5,
    cashSell: 0.2036,
    marketMid: 0.200569,
    bankMid: 0.1972,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 804,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 818,
    diffForeign: 9,
    diffTWD: 339,
    diffPct: 1.1,
    cashSell: 37.33,
    marketMid: 36.908541,
    bankMid: 36.66,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 707,
    diffForeign: 13,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 43.47,
    marketMid: 42.702195,
    bankMid: 42.41,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6414,
    foreignAtMarketMid: 6513,
    foreignAtBankMid: 6527,
    diffForeign: 99,
    diffTWD: 454,
    diffPct: 1.5,
    cashSell: 4.677,
    marketMid: 4.606172,
    bankMid: 4.596,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1273345,
    foreignAtMarketMid: 1390569,
    foreignAtBankMid: 1388246,
    diffForeign: 117224,
    diffTWD: 2529,
    diffPct: 9.2,
    cashSell: 0.02356,
    marketMid: 0.021574,
    bankMid: 0.02161,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.1,
        rateBuy: 45.3,
        rateInverse: 0.022173,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7396,
    foreignAtMarketMid: 7486,
    foreignAtBankMid: 7587,
    diffForeign: 90,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 4.056,
    marketMid: 4.007598,
    bankMid: 3.954,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1321,
    foreignAtBankMid: 1326,
    diffForeign: 18,
    diffTWD: 412,
    diffPct: 1.4,
    cashSell: 23.02,
    marketMid: 22.704053,
    bankMid: 22.63,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1308,
    diffForeign: 21,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 23.39,
    marketMid: 23.007546,
    bankMid: 22.935,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1197,
    foreignAtMarketMid: 1212,
    foreignAtBankMid: 1219,
    diffForeign: 15,
    diffTWD: 361,
    diffPct: 1.2,
    cashSell: 25.06,
    marketMid: 24.758604,
    bankMid: 24.605,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 745,
    foreignAtBankMid: 750,
    diffForeign: 6,
    diffTWD: 212,
    diffPct: 0.7,
    cashSell: 40.58,
    marketMid: 40.293335,
    bankMid: 39.98,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1577,
    foreignAtMarketMid: 1605,
    foreignAtBankMid: 1613,
    diffForeign: 28,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 19.02,
    marketMid: 18.686699,
    bankMid: 18.595,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28994,
    foreignAtMarketMid: 30782,
    foreignAtBankMid: 31925,
    diffForeign: 1788,
    diffTWD: 1743,
    diffPct: 6.2,
    cashSell: 1.0347,
    marketMid: 0.9746,
    bankMid: 0.9397,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51265,
    foreignAtMarketMid: 57766,
    foreignAtBankMid: 57781,
    diffForeign: 6501,
    diffTWD: 3377,
    diffPct: 12.7,
    cashSell: 0.5852,
    marketMid: 0.519335,
    bankMid: 0.5192,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16530396,
    foreignAtBankMid: 16853933,
    diffForeign: 2445889,
    diffTWD: 4439,
    diffPct: 17.4,
    cashSell: 0.00213,
    marketMid: 0.001815,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3529,
    foreignAtMarketMid: 3737,
    foreignAtBankMid: 3877,
    diffForeign: 208,
    diffTWD: 1672,
    diffPct: 5.9,
    cashSell: 8.501,
    marketMid: 8.027099,
    bankMid: 7.7385,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 25008931,
    foreignAtBankMid: 25531915,
    diffForeign: 3269801,
    diffTWD: 3922,
    diffPct: 15,
    cashSell: 0.00138,
    marketMid: 0.0012,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/08 12:36:58';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-08';
