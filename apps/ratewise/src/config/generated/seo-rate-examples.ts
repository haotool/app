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
 * 匯率時間：2026/04/10 12:44:04
 * 生成日期：2026-04-10
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
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 937,
    foreignAtMarketMid: 944,
    foreignAtBankMid: 947,
    diffForeign: 7,
    diffTWD: 223,
    diffPct: 0.7,
    cashSell: 32.01,
    marketMid: 31.772256,
    bankMid: 31.675,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147856,
    foreignAtMarketMid: 150124,
    foreignAtBankMid: 152672,
    diffForeign: 2268,
    diffTWD: 453,
    diffPct: 1.5,
    cashSell: 0.2029,
    marketMid: 0.199835,
    bankMid: 0.1965,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 808,
    foreignAtBankMid: 811,
    diffForeign: 11,
    diffTWD: 410,
    diffPct: 1.4,
    cashSell: 37.64,
    marketMid: 37.125037,
    bankMid: 36.97,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 14,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 43.53,
    marketMid: 42.658476,
    bankMid: 42.47,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6368,
    foreignAtMarketMid: 6444,
    foreignAtBankMid: 6479,
    diffForeign: 76,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 4.711,
    marketMid: 4.655493,
    bankMid: 4.63,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1271186,
    foreignAtMarketMid: 1393796,
    foreignAtBankMid: 1385681,
    diffForeign: 122610,
    diffTWD: 2639,
    diffPct: 9.6,
    cashSell: 0.0236,
    marketMid: 0.021524,
    bankMid: 0.02165,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.9,
        rateBuy: 45.5,
        rateInverse: 0.022272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7321,
    foreignAtMarketMid: 7401,
    foreignAtBankMid: 7508,
    diffForeign: 80,
    diffTWD: 324,
    diffPct: 1.1,
    cashSell: 4.098,
    marketMid: 4.053703,
    bankMid: 3.996,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1315,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1338,
    diffForeign: 21,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 22.81,
    marketMid: 22.459293,
    bankMid: 22.42,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1309,
    diffForeign: 22,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 23.37,
    marketMid: 22.974774,
    bankMid: 22.915,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1210,
    diffForeign: 14,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 25.24,
    marketMid: 24.943254,
    bankMid: 24.785,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 746,
    foreignAtBankMid: 751,
    diffForeign: 6,
    diffTWD: 232,
    diffPct: 0.8,
    cashSell: 40.54,
    marketMid: 40.22688,
    bankMid: 39.94,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1585,
    foreignAtMarketMid: 1614,
    foreignAtBankMid: 1621,
    diffForeign: 29,
    diffTWD: 542,
    diffPct: 1.8,
    cashSell: 18.93,
    marketMid: 18.588052,
    bankMid: 18.505,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28626,
    foreignAtMarketMid: 30285,
    foreignAtBankMid: 31480,
    diffForeign: 1659,
    diffTWD: 1643,
    diffPct: 5.8,
    cashSell: 1.048,
    marketMid: 0.990598,
    bankMid: 0.953,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50209,
    foreignAtMarketMid: 56398,
    foreignAtBankMid: 56444,
    diffForeign: 6189,
    diffTWD: 3292,
    diffPct: 12.3,
    cashSell: 0.5975,
    marketMid: 0.531931,
    bankMid: 0.5315,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16125216,
    foreignAtBankMid: 15957447,
    diffForeign: 2672301,
    diffTWD: 4972,
    diffPct: 19.9,
    cashSell: 0.00223,
    marketMid: 0.00186,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3528,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3875,
    diffForeign: 234,
    diffTWD: 1865,
    diffPct: 6.6,
    cashSell: 8.504,
    marketMid: 7.975308,
    bankMid: 7.7415,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24769710,
    foreignAtBankMid: 25316456,
    diffForeign: 3186976,
    diffTWD: 3860,
    diffPct: 14.8,
    cashSell: 0.00139,
    marketMid: 0.001211,
    bankMid: 0.001185,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/10 12:44:04';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-10';
