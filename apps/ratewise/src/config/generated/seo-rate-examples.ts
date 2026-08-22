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
 * 匯率時間：2026/08/22 04:40:26
 * 生成日期：2026-08-22
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
    foreignAtCash: 934,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 944,
    diffForeign: 9,
    diffTWD: 287,
    diffPct: 1,
    cashSell: 32.12,
    marketMid: 31.812687,
    bankMid: 31.785,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147059,
    foreignAtMarketMid: 149711,
    foreignAtBankMid: 151822,
    diffForeign: 2652,
    diffTWD: 531,
    diffPct: 1.8,
    cashSell: 0.204,
    marketMid: 0.200386,
    bankMid: 0.1976,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 795,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 809,
    diffForeign: 12,
    diffTWD: 429,
    diffPct: 1.5,
    cashSell: 37.73,
    marketMid: 37.189929,
    bankMid: 37.06,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 691,
    foreignAtBankMid: 692,
    diffForeign: 16,
    diffTWD: 667,
    diffPct: 2.3,
    cashSell: 44.42,
    marketMid: 43.43294,
    bankMid: 43.36,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6245,
    foreignAtMarketMid: 6333,
    foreignAtBankMid: 6352,
    diffForeign: 88,
    diffTWD: 418,
    diffPct: 1.4,
    cashSell: 4.804,
    marketMid: 4.737091,
    bankMid: 4.723,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1192843,
    foreignAtMarketMid: 1308022,
    foreignAtBankMid: 1293103,
    diffForeign: 115179,
    diffTWD: 2642,
    diffPct: 9.7,
    cashSell: 0.02515,
    marketMid: 0.022935,
    bankMid: 0.0232,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-22',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7387,
    foreignAtBankMid: 7483,
    diffForeign: 90,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 4.111,
    marketMid: 4.060947,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1312,
    diffForeign: 27,
    diffTWD: 600,
    diffPct: 2,
    cashSell: 23.25,
    marketMid: 22.784752,
    bankMid: 22.86,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1273,
    foreignAtMarketMid: 1297,
    foreignAtBankMid: 1298,
    diffForeign: 24,
    diffTWD: 546,
    diffPct: 1.9,
    cashSell: 23.56,
    marketMid: 23.131014,
    bankMid: 23.105,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1180,
    foreignAtMarketMid: 1196,
    foreignAtBankMid: 1202,
    diffForeign: 16,
    diffTWD: 405,
    diffPct: 1.4,
    cashSell: 25.42,
    marketMid: 25.076483,
    bankMid: 24.965,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 754,
    foreignAtBankMid: 758,
    diffForeign: 7,
    diffTWD: 304,
    diffPct: 1,
    cashSell: 40.17,
    marketMid: 39.763012,
    bankMid: 39.57,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1545,
    foreignAtMarketMid: 1578,
    foreignAtBankMid: 1579,
    diffForeign: 33,
    diffTWD: 640,
    diffPct: 2.2,
    cashSell: 19.42,
    marketMid: 19.005987,
    bankMid: 18.995,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28916,
    foreignAtMarketMid: 30815,
    foreignAtBankMid: 31830,
    diffForeign: 1899,
    diffTWD: 1849,
    diffPct: 6.6,
    cashSell: 1.0375,
    marketMid: 0.973555,
    bankMid: 0.9425,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51511,
    foreignAtMarketMid: 58251,
    foreignAtBankMid: 58095,
    diffForeign: 6740,
    diffTWD: 3471,
    diffPct: 13.1,
    cashSell: 0.5824,
    marketMid: 0.515014,
    bankMid: 0.5164,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16674686,
    foreignAtBankMid: 16393443,
    diffForeign: 2913218,
    diffTWD: 5241,
    diffPct: 21.2,
    cashSell: 0.00218,
    marketMid: 0.001799,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3577,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3935,
    diffForeign: 229,
    diffTWD: 1807,
    diffPct: 6.4,
    cashSell: 8.387,
    marketMid: 7.881711,
    bankMid: 7.6245,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24518180,
    foreignAtBankMid: 25531915,
    diffForeign: 2779050,
    diffTWD: 3400,
    diffPct: 12.8,
    cashSell: 0.00138,
    marketMid: 0.001224,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/22 04:40:26';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-22';
