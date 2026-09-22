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
 * 匯率時間：2026/09/22 13:58:26
 * 生成日期：2026-09-22
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
    foreignAtCash: 938,
    foreignAtMarketMid: 945,
    foreignAtBankMid: 948,
    diffForeign: 7,
    diffTWD: 224,
    diffPct: 0.8,
    cashSell: 31.99,
    marketMid: 31.751072,
    bankMid: 31.655,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146341,
    foreignAtMarketMid: 148734,
    foreignAtBankMid: 151057,
    diffForeign: 2393,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 0.205,
    marketMid: 0.201703,
    bankMid: 0.1986,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 813,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 828,
    diffForeign: 11,
    diffTWD: 402,
    diffPct: 1.4,
    cashSell: 36.91,
    marketMid: 36.41528,
    bankMid: 36.24,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 692,
    foreignAtMarketMid: 707,
    foreignAtBankMid: 709,
    diffForeign: 15,
    diffTWD: 631,
    diffPct: 2.1,
    cashSell: 43.37,
    marketMid: 42.457436,
    bankMid: 42.31,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6249,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6356,
    diffForeign: 66,
    diffTWD: 315,
    diffPct: 1.1,
    cashSell: 4.801,
    marketMid: 4.750594,
    bankMid: 4.72,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1174168,
    foreignAtMarketMid: 1299642,
    foreignAtBankMid: 1271186,
    diffForeign: 125474,
    diffTWD: 2896,
    diffPct: 10.7,
    cashSell: 0.02555,
    marketMid: 0.023083,
    bankMid: 0.0236,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.8,
        rateBuy: 42.2,
        rateInverse: 0.023923,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-22',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7333,
    foreignAtMarketMid: 7410,
    foreignAtBankMid: 7521,
    diffForeign: 77,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 4.091,
    marketMid: 4.048583,
    bankMid: 3.989,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1327,
    foreignAtBankMid: 1328,
    diffForeign: 22,
    diffTWD: 488,
    diffPct: 1.7,
    cashSell: 22.98,
    marketMid: 22.606022,
    bankMid: 22.59,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1325,
    foreignAtBankMid: 1329,
    diffForeign: 22,
    diffTWD: 506,
    diffPct: 1.7,
    cashSell: 23.03,
    marketMid: 22.641339,
    bankMid: 22.575,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1212,
    diffForeign: 16,
    diffTWD: 395,
    diffPct: 1.3,
    cashSell: 25.21,
    marketMid: 24.878097,
    bankMid: 24.755,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 768,
    foreignAtMarketMid: 777,
    foreignAtBankMid: 780,
    diffForeign: 9,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 39.05,
    marketMid: 38.604077,
    bankMid: 38.45,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1614,
    foreignAtMarketMid: 1653,
    foreignAtBankMid: 1652,
    diffForeign: 39,
    diffTWD: 718,
    diffPct: 2.5,
    cashSell: 18.59,
    marketMid: 18.145198,
    bankMid: 18.165,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29545,
    foreignAtMarketMid: 31454,
    foreignAtBankMid: 32595,
    diffForeign: 1909,
    diffTWD: 1821,
    diffPct: 6.5,
    cashSell: 1.0154,
    marketMid: 0.953768,
    bankMid: 0.9204,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52429,
    foreignAtMarketMid: 59388,
    foreignAtBankMid: 59265,
    diffForeign: 6959,
    diffTWD: 3515,
    diffPct: 13.3,
    cashSell: 0.5722,
    marketMid: 0.505153,
    bankMid: 0.5062,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16871221,
    foreignAtBankMid: 16853933,
    diffForeign: 2786714,
    diffTWD: 4955,
    diffPct: 19.8,
    cashSell: 0.00213,
    marketMid: 0.001778,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3622,
    foreignAtMarketMid: 3854,
    foreignAtBankMid: 3989,
    diffForeign: 232,
    diffTWD: 1809,
    diffPct: 6.4,
    cashSell: 8.283,
    marketMid: 7.783555,
    bankMid: 7.5205,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24528951,
    foreignAtBankMid: 24896266,
    diffForeign: 3252355,
    diffTWD: 3978,
    diffPct: 15.3,
    cashSell: 0.00141,
    marketMid: 0.001223,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/22 13:58:26';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-22';
