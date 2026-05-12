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
 * 匯率時間：2026/05/12 12:08:24
 * 生成日期：2026-05-12
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
    foreignAtCash: 947,
    foreignAtMarketMid: 956,
    foreignAtBankMid: 957,
    diffForeign: 9,
    diffTWD: 304,
    diffPct: 1,
    cashSell: 31.695,
    marketMid: 31.373533,
    bankMid: 31.36,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147856,
    foreignAtMarketMid: 150256,
    foreignAtBankMid: 152672,
    diffForeign: 2400,
    diffTWD: 479,
    diffPct: 1.6,
    cashSell: 0.2029,
    marketMid: 0.19966,
    bankMid: 0.1965,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 815,
    diffForeign: 11,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 37.47,
    marketMid: 36.941263,
    bankMid: 36.8,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 705,
    diffForeign: 15,
    diffTWD: 646,
    diffPct: 2.2,
    cashSell: 43.61,
    marketMid: 42.671218,
    bankMid: 42.55,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6395,
    foreignAtMarketMid: 6498,
    foreignAtBankMid: 6508,
    diffForeign: 103,
    diffTWD: 474,
    diffPct: 1.6,
    cashSell: 4.691,
    marketMid: 4.616805,
    bankMid: 4.61,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1287001,
    foreignAtMarketMid: 1408670,
    foreignAtBankMid: 1404494,
    diffForeign: 121669,
    diffTWD: 2591,
    diffPct: 9.5,
    cashSell: 0.02331,
    marketMid: 0.021297,
    bankMid: 0.02136,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.25,
        rateBuy: 45.5,
        rateInverse: 0.022099,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-12',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7386,
    foreignAtMarketMid: 7487,
    foreignAtBankMid: 7576,
    diffForeign: 101,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 4.062,
    marketMid: 4.006779,
    bankMid: 3.96,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1320,
    diffForeign: 22,
    diffTWD: 489,
    diffPct: 1.7,
    cashSell: 23.11,
    marketMid: 22.733473,
    bankMid: 22.72,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1308,
    foreignAtBankMid: 1310,
    diffForeign: 24,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 23.36,
    marketMid: 22.942094,
    bankMid: 22.905,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1197,
    foreignAtMarketMid: 1213,
    foreignAtBankMid: 1219,
    diffForeign: 16,
    diffTWD: 403,
    diffPct: 1.4,
    cashSell: 25.06,
    marketMid: 24.723713,
    bankMid: 24.605,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 749,
    diffForeign: 7,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 40.68,
    marketMid: 40.316078,
    bankMid: 40.08,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1572,
    foreignAtMarketMid: 1604,
    foreignAtBankMid: 1607,
    diffForeign: 32,
    diffTWD: 610,
    diffPct: 2.1,
    cashSell: 19.09,
    marketMid: 18.701726,
    bankMid: 18.665,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29030,
    foreignAtMarketMid: 30887,
    foreignAtBankMid: 31969,
    diffForeign: 1857,
    diffTWD: 1803,
    diffPct: 6.4,
    cashSell: 1.0334,
    marketMid: 0.971282,
    bankMid: 0.9384,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51930,
    foreignAtMarketMid: 58409,
    foreignAtBankMid: 58628,
    diffForeign: 6479,
    diffTWD: 3328,
    diffPct: 12.5,
    cashSell: 0.5777,
    marketMid: 0.513615,
    bankMid: 0.5117,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16684308,
    foreignAtBankMid: 16853933,
    diffForeign: 2599801,
    diffTWD: 4675,
    diffPct: 18.5,
    cashSell: 0.00213,
    marketMid: 0.001798,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3535,
    foreignAtMarketMid: 3754,
    foreignAtBankMid: 3884,
    diffForeign: 219,
    diffTWD: 1747,
    diffPct: 6.2,
    cashSell: 8.486,
    marketMid: 7.991944,
    bankMid: 7.7235,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 25032494,
    foreignAtBankMid: 25531915,
    diffForeign: 3293364,
    diffTWD: 3947,
    diffPct: 15.1,
    cashSell: 0.00138,
    marketMid: 0.001198,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/12 12:08:24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-12';
