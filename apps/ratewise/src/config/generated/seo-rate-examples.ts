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
 * 匯率時間：2026/04/25 10:08:07
 * 生成日期：2026-04-26
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
    foreignAtMarketMid: 952,
    foreignAtBankMid: 954,
    diffForeign: 8,
    diffTWD: 231,
    diffPct: 0.8,
    cashSell: 31.77,
    marketMid: 31.525851,
    bankMid: 31.435,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149031,
    foreignAtMarketMid: 151909,
    foreignAtBankMid: 153925,
    diffForeign: 2878,
    diffTWD: 568,
    diffPct: 1.9,
    cashSell: 0.2013,
    marketMid: 0.197486,
    bankMid: 0.1949,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 449,
    diffPct: 1.5,
    cashSell: 37.45,
    marketMid: 36.889479,
    bankMid: 36.78,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 706,
    diffForeign: 16,
    diffTWD: 686,
    diffPct: 2.3,
    cashSell: 43.56,
    marketMid: 42.564059,
    bankMid: 42.5,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6416,
    foreignAtMarketMid: 6498,
    foreignAtBankMid: 6529,
    diffForeign: 82,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 4.676,
    marketMid: 4.616805,
    bankMid: 4.595,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1276596,
    foreignAtMarketMid: 1406073,
    foreignAtBankMid: 1392111,
    diffForeign: 129477,
    diffTWD: 2763,
    diffPct: 10.1,
    cashSell: 0.0235,
    marketMid: 0.021336,
    bankMid: 0.02155,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.2,
        rateBuy: 45.4,
        rateInverse: 0.022124,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-26',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7373,
    foreignAtMarketMid: 7464,
    foreignAtBankMid: 7562,
    diffForeign: 91,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 4.069,
    marketMid: 4.019454,
    bankMid: 3.967,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1332,
    foreignAtBankMid: 1331,
    diffForeign: 24,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 22.93,
    marketMid: 22.519986,
    bankMid: 22.54,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1303,
    diffForeign: 24,
    diffTWD: 558,
    diffPct: 1.9,
    cashSell: 23.47,
    marketMid: 23.033514,
    bankMid: 23.015,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1199,
    foreignAtMarketMid: 1216,
    foreignAtBankMid: 1221,
    diffForeign: 17,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 25.02,
    marketMid: 24.668821,
    bankMid: 24.565,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 741,
    foreignAtMarketMid: 749,
    foreignAtBankMid: 752,
    diffForeign: 8,
    diffTWD: 324,
    diffPct: 1.1,
    cashSell: 40.51,
    marketMid: 40.07213,
    bankMid: 39.91,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1588,
    foreignAtMarketMid: 1620,
    foreignAtBankMid: 1625,
    diffForeign: 32,
    diffTWD: 597,
    diffPct: 2,
    cashSell: 18.89,
    marketMid: 18.514061,
    bankMid: 18.465,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28986,
    foreignAtMarketMid: 30813,
    foreignAtBankMid: 31915,
    diffForeign: 1827,
    diffTWD: 1780,
    diffPct: 6.3,
    cashSell: 1.035,
    marketMid: 0.973604,
    bankMid: 0.94,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51273,
    foreignAtMarketMid: 57727,
    foreignAtBankMid: 57792,
    diffForeign: 6454,
    diffTWD: 3354,
    diffPct: 12.6,
    cashSell: 0.5851,
    marketMid: 0.519687,
    bankMid: 0.5191,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16359077,
    foreignAtBankMid: 16393443,
    diffForeign: 2597609,
    diffTWD: 4764,
    diffPct: 18.9,
    cashSell: 0.00218,
    marketMid: 0.001834,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3553,
    foreignAtMarketMid: 3775,
    foreignAtBankMid: 3905,
    diffForeign: 222,
    diffTWD: 1766,
    diffPct: 6.3,
    cashSell: 8.444,
    marketMid: 7.946851,
    bankMid: 7.6815,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 25040135,
    foreignAtBankMid: 25974026,
    diffForeign: 2981311,
    diffTWD: 3572,
    diffPct: 13.5,
    cashSell: 0.00136,
    marketMid: 0.001198,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/25 10:08:07';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-26';
