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
 * 匯率時間：2026/04/08 11:29:55
 * 生成日期：2026-04-08
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
    foreignAtCash: 936,
    foreignAtMarketMid: 939,
    foreignAtBankMid: 945,
    diffForeign: 3,
    diffTWD: 98,
    diffPct: 0.3,
    cashSell: 32.065,
    marketMid: 31.960114,
    bankMid: 31.73,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146843,
    foreignAtMarketMid: 150015,
    foreignAtBankMid: 151592,
    diffForeign: 3172,
    diffTWD: 634,
    diffPct: 2.2,
    cashSell: 0.2043,
    marketMid: 0.199979,
    bankMid: 0.1979,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 812,
    diffForeign: 15,
    diffTWD: 546,
    diffPct: 1.9,
    cashSell: 37.63,
    marketMid: 36.945358,
    bankMid: 36.96,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 709,
    foreignAtBankMid: 707,
    diffForeign: 20,
    diffTWD: 814,
    diffPct: 2.8,
    cashSell: 43.51,
    marketMid: 42.329834,
    bankMid: 42.45,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6359,
    foreignAtMarketMid: 6462,
    foreignAtBankMid: 6470,
    diffForeign: 103,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 4.718,
    marketMid: 4.642526,
    bankMid: 4.637,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1266357,
    foreignAtMarketMid: 1407066,
    foreignAtBankMid: 1379945,
    diffForeign: 140709,
    diffTWD: 3000,
    diffPct: 11.1,
    cashSell: 0.02369,
    marketMid: 0.021321,
    bankMid: 0.02174,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45,
        rateBuy: 46,
        rateInverse: 0.022222,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7305,
    foreignAtMarketMid: 7359,
    foreignAtBankMid: 7491,
    diffForeign: 54,
    diffTWD: 222,
    diffPct: 0.7,
    cashSell: 4.107,
    marketMid: 4.076641,
    bankMid: 4.005,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1343,
    foreignAtBankMid: 1339,
    diffForeign: 27,
    diffTWD: 598,
    diffPct: 2,
    cashSell: 22.79,
    marketMid: 22.335887,
    bankMid: 22.4,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1308,
    diffForeign: 23,
    diffTWD: 541,
    diffPct: 1.8,
    cashSell: 23.39,
    marketMid: 22.967914,
    bankMid: 22.935,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1209,
    diffForeign: 18,
    diffTWD: 455,
    diffPct: 1.5,
    cashSell: 25.26,
    marketMid: 24.87686,
    bankMid: 24.805,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 751,
    foreignAtBankMid: 750,
    diffForeign: 12,
    diffTWD: 471,
    diffPct: 1.6,
    cashSell: 40.6,
    marketMid: 39.963234,
    bankMid: 40,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1593,
    foreignAtMarketMid: 1632,
    foreignAtBankMid: 1630,
    diffForeign: 39,
    diffTWD: 708,
    diffPct: 2.4,
    cashSell: 18.83,
    marketMid: 18.385395,
    bankMid: 18.405,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28506,
    foreignAtMarketMid: 30607,
    foreignAtBankMid: 31335,
    diffForeign: 2101,
    diffTWD: 2059,
    diffPct: 7.4,
    cashSell: 1.0524,
    marketMid: 0.980164,
    bankMid: 0.9574,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50008,
    foreignAtMarketMid: 56552,
    foreignAtBankMid: 56190,
    diffForeign: 6544,
    diffTWD: 3472,
    diffPct: 13.1,
    cashSell: 0.5999,
    marketMid: 0.530481,
    bankMid: 0.5339,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16025625,
    foreignAtBankMid: 15957447,
    diffForeign: 2572710,
    diffTWD: 4816,
    diffPct: 19.1,
    cashSell: 0.00223,
    marketMid: 0.001872,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3545,
    foreignAtMarketMid: 3791,
    foreignAtBankMid: 3896,
    diffForeign: 246,
    diffTWD: 1945,
    diffPct: 6.9,
    cashSell: 8.462,
    marketMid: 7.913396,
    bankMid: 7.6995,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24647912,
    foreignAtBankMid: 25316456,
    diffForeign: 3065178,
    diffTWD: 3731,
    diffPct: 14.2,
    cashSell: 0.00139,
    marketMid: 0.001217,
    bankMid: 0.001185,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/08 11:29:55';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-08';
