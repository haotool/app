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
 * 匯率時間：2026/09/01 14:14:25
 * 生成日期：2026-09-01
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
    foreignAtCash: 940,
    foreignAtMarketMid: 946,
    foreignAtBankMid: 950,
    diffForeign: 6,
    diffTWD: 207,
    diffPct: 0.7,
    cashSell: 31.92,
    marketMid: 31.69974,
    bankMid: 31.585,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148883,
    foreignAtMarketMid: 151214,
    foreignAtBankMid: 153767,
    diffForeign: 2331,
    diffTWD: 462,
    diffPct: 1.6,
    cashSell: 0.2015,
    marketMid: 0.198394,
    bankMid: 0.1951,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 805,
    foreignAtMarketMid: 815,
    foreignAtBankMid: 820,
    diffForeign: 10,
    diffTWD: 375,
    diffPct: 1.3,
    cashSell: 37.26,
    marketMid: 36.794466,
    bankMid: 36.59,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 685,
    foreignAtMarketMid: 699,
    foreignAtBankMid: 702,
    diffForeign: 14,
    diffTWD: 586,
    diffPct: 2,
    cashSell: 43.79,
    marketMid: 42.935039,
    bankMid: 42.73,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6285,
    foreignAtMarketMid: 6372,
    foreignAtBankMid: 6394,
    diffForeign: 87,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 4.773,
    marketMid: 4.708098,
    bankMid: 4.692,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1188119,
    foreignAtMarketMid: 1294752,
    foreignAtBankMid: 1287554,
    diffForeign: 106633,
    diffTWD: 2471,
    diffPct: 9,
    cashSell: 0.02525,
    marketMid: 0.02317,
    bankMid: 0.0233,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.1,
        rateBuy: 42.3,
        rateInverse: 0.023753,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-01',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7344,
    foreignAtMarketMid: 7419,
    foreignAtBankMid: 7532,
    diffForeign: 75,
    diffTWD: 304,
    diffPct: 1,
    cashSell: 4.085,
    marketMid: 4.043606,
    bankMid: 3.983,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1322,
    diffForeign: 20,
    diffTWD: 469,
    diffPct: 1.6,
    cashSell: 23.08,
    marketMid: 22.719527,
    bankMid: 22.69,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1317,
    diffForeign: 21,
    diffTWD: 489,
    diffPct: 1.7,
    cashSell: 23.24,
    marketMid: 22.861323,
    bankMid: 22.785,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1211,
    diffForeign: 15,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 25.22,
    marketMid: 24.9066,
    bankMid: 24.765,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 765,
    foreignAtBankMid: 771,
    diffForeign: 5,
    diffTWD: 217,
    diffPct: 0.7,
    cashSell: 39.49,
    marketMid: 39.204924,
    bankMid: 38.89,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1572,
    foreignAtMarketMid: 1599,
    foreignAtBankMid: 1608,
    diffForeign: 27,
    diffTWD: 503,
    diffPct: 1.7,
    cashSell: 19.08,
    marketMid: 18.759966,
    bankMid: 18.655,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29551,
    foreignAtMarketMid: 31391,
    foreignAtBankMid: 32602,
    diffForeign: 1840,
    diffTWD: 1758,
    diffPct: 6.2,
    cashSell: 1.0152,
    marketMid: 0.955694,
    bankMid: 0.9202,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52347,
    foreignAtMarketMid: 59082,
    foreignAtBankMid: 59160,
    diffForeign: 6735,
    diffTWD: 3420,
    diffPct: 12.9,
    cashSell: 0.5731,
    marketMid: 0.507772,
    bankMid: 0.5071,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16786187,
    foreignAtBankMid: 16853933,
    diffForeign: 2701680,
    diffTWD: 4828,
    diffPct: 19.2,
    cashSell: 0.00213,
    marketMid: 0.001787,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3596,
    foreignAtMarketMid: 3812,
    foreignAtBankMid: 3958,
    diffForeign: 216,
    diffTWD: 1699,
    diffPct: 6,
    cashSell: 8.342,
    marketMid: 7.869616,
    bankMid: 7.5795,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24615184,
    foreignAtBankMid: 25104603,
    diffForeign: 3186613,
    diffTWD: 3884,
    diffPct: 14.9,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/01 14:14:25';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-01';
