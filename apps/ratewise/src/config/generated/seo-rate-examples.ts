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
 * 匯率時間：2026/05/11 13:39:31
 * 生成日期：2026-05-11
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
    foreignAtMarketMid: 957,
    foreignAtBankMid: 958,
    diffForeign: 9,
    diffTWD: 291,
    diffPct: 1,
    cashSell: 31.64,
    marketMid: 31.333229,
    bankMid: 31.305,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147638,
    foreignAtMarketMid: 150231,
    foreignAtBankMid: 152439,
    diffForeign: 2593,
    diffTWD: 518,
    diffPct: 1.8,
    cashSell: 0.2032,
    marketMid: 0.199693,
    bankMid: 0.1968,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 817,
    diffForeign: 12,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 37.39,
    marketMid: 36.862283,
    bankMid: 36.72,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 14,
    diffTWD: 615,
    diffPct: 2.1,
    cashSell: 43.55,
    marketMid: 42.656657,
    bankMid: 42.49,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6406,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6519,
    diffForeign: 89,
    diffTWD: 410,
    diffPct: 1.4,
    cashSell: 4.683,
    marketMid: 4.618938,
    bankMid: 4.602,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1280956,
    foreignAtMarketMid: 1399601,
    foreignAtBankMid: 1397299,
    diffForeign: 118645,
    diffTWD: 2543,
    diffPct: 9.3,
    cashSell: 0.02342,
    marketMid: 0.021435,
    bankMid: 0.02147,
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
        rateDate: '2026-05-11',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7400,
    foreignAtMarketMid: 7501,
    foreignAtBankMid: 7591,
    diffForeign: 101,
    diffTWD: 402,
    diffPct: 1.4,
    cashSell: 4.054,
    marketMid: 3.999728,
    bankMid: 3.952,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1323,
    diffForeign: 23,
    diffTWD: 519,
    diffPct: 1.8,
    cashSell: 23.07,
    marketMid: 22.67111,
    bankMid: 22.68,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1286,
    foreignAtMarketMid: 1310,
    foreignAtBankMid: 1311,
    diffForeign: 24,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 23.33,
    marketMid: 22.893249,
    bankMid: 22.875,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1215,
    foreignAtBankMid: 1220,
    diffForeign: 17,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 25.05,
    marketMid: 24.696846,
    bankMid: 24.595,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 738,
    foreignAtMarketMid: 745,
    foreignAtBankMid: 749,
    diffForeign: 7,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 40.64,
    marketMid: 40.277106,
    bankMid: 40.04,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1577,
    foreignAtMarketMid: 1609,
    foreignAtBankMid: 1613,
    diffForeign: 32,
    diffTWD: 582,
    diffPct: 2,
    cashSell: 19.02,
    marketMid: 18.650801,
    bankMid: 18.595,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29180,
    foreignAtMarketMid: 30894,
    foreignAtBankMid: 32151,
    diffForeign: 1714,
    diffTWD: 1665,
    diffPct: 5.9,
    cashSell: 1.0281,
    marketMid: 0.971056,
    bankMid: 0.9331,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51600,
    foreignAtMarketMid: 57952,
    foreignAtBankMid: 58207,
    diffForeign: 6352,
    diffTWD: 3288,
    diffPct: 12.3,
    cashSell: 0.5814,
    marketMid: 0.517672,
    bankMid: 0.5154,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16598779,
    foreignAtBankMid: 16853933,
    diffForeign: 2514272,
    diffTWD: 4544,
    diffPct: 17.9,
    cashSell: 0.00213,
    marketMid: 0.001807,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3536,
    foreignAtMarketMid: 3756,
    foreignAtBankMid: 3885,
    diffForeign: 220,
    diffTWD: 1758,
    diffPct: 6.2,
    cashSell: 8.485,
    marketMid: 7.987858,
    bankMid: 7.7225,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 25058174,
    foreignAtBankMid: 25531915,
    diffForeign: 3319044,
    diffTWD: 3974,
    diffPct: 15.3,
    cashSell: 0.00138,
    marketMid: 0.001197,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/11 13:39:31';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-11';
