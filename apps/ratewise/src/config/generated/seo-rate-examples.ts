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
 * 匯率時間：2026/09/28 12:21:16
 * 生成日期：2026-09-28
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
    foreignAtCash: 936,
    foreignAtMarketMid: 944,
    foreignAtBankMid: 946,
    diffForeign: 8,
    diffTWD: 267,
    diffPct: 0.9,
    cashSell: 32.05,
    marketMid: 31.765192,
    bankMid: 31.715,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146270,
    foreignAtMarketMid: 148612,
    foreignAtBankMid: 150981,
    diffForeign: 2342,
    diffTWD: 473,
    diffPct: 1.6,
    cashSell: 0.2051,
    marketMid: 0.201868,
    bankMid: 0.1987,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 817,
    foreignAtMarketMid: 829,
    foreignAtBankMid: 832,
    diffForeign: 12,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 36.72,
    marketMid: 36.185996,
    bankMid: 36.05,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 715,
    diffForeign: 16,
    diffTWD: 676,
    diffPct: 2.3,
    cashSell: 43.03,
    marketMid: 42.060988,
    bankMid: 41.97,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6253,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6360,
    diffForeign: 77,
    diffTWD: 367,
    diffPct: 1.2,
    cashSell: 4.798,
    marketMid: 4.739336,
    bankMid: 4.717,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1172333,
    foreignAtMarketMid: 1280635,
    foreignAtBankMid: 1269036,
    diffForeign: 108302,
    diffTWD: 2537,
    diffPct: 9.2,
    cashSell: 0.02559,
    marketMid: 0.023426,
    bankMid: 0.02364,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.8,
        rateBuy: 42.3,
        rateInverse: 0.023923,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-28',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7317,
    foreignAtMarketMid: 7407,
    foreignAtBankMid: 7504,
    diffForeign: 90,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 4.1,
    marketMid: 4.050157,
    bankMid: 3.998,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1320,
    foreignAtMarketMid: 1346,
    foreignAtBankMid: 1343,
    diffForeign: 26,
    diffTWD: 578,
    diffPct: 2,
    cashSell: 22.72,
    marketMid: 22.282136,
    bankMid: 22.33,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1338,
    diffForeign: 25,
    diffTWD: 559,
    diffPct: 1.9,
    cashSell: 22.88,
    marketMid: 22.453745,
    bankMid: 22.425,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1213,
    diffForeign: 16,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 25.19,
    marketMid: 24.860162,
    bankMid: 24.735,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 775,
    foreignAtMarketMid: 783,
    foreignAtBankMid: 787,
    diffForeign: 8,
    diffTWD: 321,
    diffPct: 1.1,
    cashSell: 38.73,
    marketMid: 38.315644,
    bankMid: 38.13,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1670,
    foreignAtBankMid: 1669,
    diffForeign: 40,
    diffTWD: 717,
    diffPct: 2.4,
    cashSell: 18.4,
    marketMid: 17.960093,
    bankMid: 17.975,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29759,
    foreignAtMarketMid: 31563,
    foreignAtBankMid: 32855,
    diffForeign: 1804,
    diffTWD: 1715,
    diffPct: 6.1,
    cashSell: 1.0081,
    marketMid: 0.950466,
    bankMid: 0.9131,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52192,
    foreignAtMarketMid: 58947,
    foreignAtBankMid: 58962,
    diffForeign: 6755,
    diffTWD: 3438,
    diffPct: 12.9,
    cashSell: 0.5748,
    marketMid: 0.508931,
    bankMid: 0.5088,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16906729,
    foreignAtBankMid: 17341040,
    diffForeign: 2483652,
    diffTWD: 4407,
    diffPct: 17.2,
    cashSell: 0.00208,
    marketMid: 0.001774,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3623,
    foreignAtMarketMid: 3850,
    foreignAtBankMid: 3990,
    diffForeign: 227,
    diffTWD: 1774,
    diffPct: 6.3,
    cashSell: 8.281,
    marketMid: 7.791257,
    bankMid: 7.5185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24484943,
    foreignAtBankMid: 25316456,
    diffForeign: 2902209,
    diffTWD: 3556,
    diffPct: 13.4,
    cashSell: 0.00139,
    marketMid: 0.001225,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/28 12:21:16';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-28';
