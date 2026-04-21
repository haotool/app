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
 * 匯率時間：2026/04/21 11:44:23
 * 生成日期：2026-04-21
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
    foreignAtCash: 945,
    foreignAtMarketMid: 954,
    foreignAtBankMid: 955,
    diffForeign: 9,
    diffTWD: 285,
    diffPct: 1,
    cashSell: 31.755,
    marketMid: 31.453465,
    bankMid: 31.42,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148810,
    foreignAtMarketMid: 151527,
    foreignAtBankMid: 153689,
    diffForeign: 2717,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 0.2016,
    marketMid: 0.197985,
    bankMid: 0.1952,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 798,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 812,
    diffForeign: 12,
    diffTWD: 451,
    diffPct: 1.5,
    cashSell: 37.6,
    marketMid: 37.034294,
    bankMid: 36.93,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 707,
    diffForeign: 15,
    diffTWD: 649,
    diffPct: 2.2,
    cashSell: 43.48,
    marketMid: 42.53871,
    bankMid: 42.42,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6403,
    foreignAtMarketMid: 6486,
    foreignAtBankMid: 6516,
    diffForeign: 83,
    diffTWD: 382,
    diffPct: 1.3,
    cashSell: 4.685,
    marketMid: 4.625347,
    bankMid: 4.604,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1273345,
    foreignAtMarketMid: 1401506,
    foreignAtBankMid: 1388246,
    diffForeign: 128161,
    diffTWD: 2743,
    diffPct: 10.1,
    cashSell: 0.02356,
    marketMid: 0.021406,
    bankMid: 0.02161,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.1,
        rateBuy: 45.3,
        rateInverse: 0.022173,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-21',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7375,
    foreignAtMarketMid: 7474,
    foreignAtBankMid: 7564,
    diffForeign: 99,
    diffTWD: 399,
    diffPct: 1.3,
    cashSell: 4.068,
    marketMid: 4.013872,
    bankMid: 3.966,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1307,
    foreignAtMarketMid: 1330,
    foreignAtBankMid: 1330,
    diffForeign: 23,
    diffTWD: 512,
    diffPct: 1.7,
    cashSell: 22.95,
    marketMid: 22.558087,
    bankMid: 22.56,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1303,
    foreignAtBankMid: 1303,
    diffForeign: 25,
    diffTWD: 589,
    diffPct: 2,
    cashSell: 23.48,
    marketMid: 23.019198,
    bankMid: 23.025,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1195,
    foreignAtMarketMid: 1212,
    foreignAtBankMid: 1217,
    diffForeign: 17,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 25.1,
    marketMid: 24.748187,
    bankMid: 24.645,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 735,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 746,
    diffForeign: 9,
    diffTWD: 326,
    diffPct: 1.1,
    cashSell: 40.79,
    marketMid: 40.346984,
    bankMid: 40.19,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1581,
    foreignAtMarketMid: 1617,
    foreignAtBankMid: 1618,
    diffForeign: 36,
    diffTWD: 656,
    diffPct: 2.2,
    cashSell: 18.97,
    marketMid: 18.554941,
    bankMid: 18.545,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28780,
    foreignAtMarketMid: 30530,
    foreignAtBankMid: 31666,
    diffForeign: 1750,
    diffTWD: 1720,
    diffPct: 6.1,
    cashSell: 1.0424,
    marketMid: 0.982643,
    bankMid: 0.9474,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50736,
    foreignAtMarketMid: 57110,
    foreignAtBankMid: 57110,
    diffForeign: 6374,
    diffTWD: 3348,
    diffPct: 12.6,
    cashSell: 0.5913,
    marketMid: 0.525302,
    bankMid: 0.5253,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16334048,
    foreignAtBankMid: 15957447,
    diffForeign: 2881133,
    diffTWD: 5292,
    diffPct: 21.4,
    cashSell: 0.00223,
    marketMid: 0.001837,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3547,
    foreignAtMarketMid: 3773,
    foreignAtBankMid: 3899,
    diffForeign: 226,
    diffTWD: 1791,
    diffPct: 6.3,
    cashSell: 8.457,
    marketMid: 7.952223,
    bankMid: 7.6945,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24985367,
    foreignAtBankMid: 25531915,
    diffForeign: 3246237,
    diffTWD: 3898,
    diffPct: 14.9,
    cashSell: 0.00138,
    marketMid: 0.001201,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/21 11:44:23';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-21';
