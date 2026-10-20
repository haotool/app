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
 * 匯率時間：2026/10/20 10:08:58
 * 生成日期：2026-10-20
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
  /** 台灣銀行現金買入匯率（未提供時省略） */
  cashBuy?: number;
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
    foreignAtCash: 913,
    foreignAtMarketMid: 923,
    foreignAtBankMid: 923,
    diffForeign: 10,
    diffTWD: 323,
    diffPct: 1.1,
    cashSell: 32.845,
    cashBuy: 32.175,
    marketMid: 32.491796,
    bankMid: 32.51,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143541,
    foreignAtMarketMid: 146337,
    foreignAtBankMid: 148075,
    diffForeign: 2796,
    diffTWD: 573,
    diffPct: 1.9,
    cashSell: 0.209,
    cashBuy: 0.1962,
    marketMid: 0.205007,
    bankMid: 0.2026,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 809,
    foreignAtMarketMid: 823,
    foreignAtBankMid: 824,
    diffForeign: 14,
    diffTWD: 506,
    diffPct: 1.7,
    cashSell: 37.07,
    cashBuy: 35.73,
    marketMid: 36.444477,
    bankMid: 36.4,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 694,
    foreignAtBankMid: 694,
    diffForeign: 17,
    diffTWD: 706,
    diffPct: 2.4,
    cashSell: 44.3,
    cashBuy: 42.18,
    marketMid: 43.258208,
    bankMid: 43.24,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6070,
    foreignAtMarketMid: 6180,
    foreignAtBankMid: 6172,
    diffForeign: 110,
    diffTWD: 532,
    diffPct: 1.8,
    cashSell: 4.942,
    cashBuy: 4.78,
    marketMid: 4.854369,
    bankMid: 4.861,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1124438,
    foreignAtMarketMid: 1229122,
    foreignAtBankMid: 1213101,
    diffForeign: 104684,
    diffTWD: 2555,
    diffPct: 9.3,
    cashSell: 0.02668,
    cashBuy: 0.02278,
    marketMid: 0.024408,
    bankMid: 0.02473,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.55,
        rateBuy: 40.8,
        rateInverse: 0.024661,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-20',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7146,
    foreignAtMarketMid: 7249,
    foreignAtBankMid: 7324,
    diffForeign: 103,
    diffTWD: 424,
    diffPct: 1.4,
    cashSell: 4.198,
    cashBuy: 3.994,
    marketMid: 4.13873,
    bankMid: 4.096,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1322,
    foreignAtBankMid: 1320,
    diffForeign: 24,
    diffTWD: 559,
    diffPct: 1.9,
    cashSell: 23.12,
    cashBuy: 22.34,
    marketMid: 22.689114,
    bankMid: 22.73,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1275,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1300,
    diffForeign: 27,
    diffTWD: 632,
    diffPct: 2.2,
    cashSell: 23.53,
    cashBuy: 22.62,
    marketMid: 23.034044,
    bankMid: 23.075,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1163,
    foreignAtMarketMid: 1182,
    foreignAtBankMid: 1184,
    diffForeign: 19,
    diffTWD: 487,
    diffPct: 1.6,
    cashSell: 25.8,
    cashBuy: 24.89,
    marketMid: 25.381355,
    bankMid: 25.345,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 753,
    foreignAtMarketMid: 763,
    foreignAtBankMid: 765,
    diffForeign: 10,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 39.82,
    cashBuy: 38.62,
    marketMid: 39.334461,
    bankMid: 39.22,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1593,
    foreignAtMarketMid: 1630,
    foreignAtBankMid: 1630,
    diffForeign: 37,
    diffTWD: 678,
    diffPct: 2.3,
    cashSell: 18.83,
    cashBuy: 17.98,
    marketMid: 18.404682,
    bankMid: 18.405,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29098,
    foreignAtMarketMid: 31012,
    foreignAtBankMid: 32051,
    diffForeign: 1914,
    diffTWD: 1852,
    diffPct: 6.6,
    cashSell: 1.031,
    cashBuy: 0.841,
    marketMid: 0.967353,
    bankMid: 0.936,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51476,
    foreignAtMarketMid: 58181,
    foreignAtBankMid: 58050,
    diffForeign: 6705,
    diffTWD: 3458,
    diffPct: 13,
    cashSell: 0.5828,
    cashBuy: 0.4508,
    marketMid: 0.515628,
    bankMid: 0.5168,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16673389,
    foreignAtBankMid: 16853933,
    diffForeign: 2588882,
    diffTWD: 4658,
    diffPct: 18.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001799,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3537,
    foreignAtMarketMid: 3773,
    foreignAtBankMid: 3887,
    diffForeign: 236,
    diffTWD: 1872,
    diffPct: 6.7,
    cashSell: 8.481,
    cashBuy: 6.956,
    marketMid: 7.951654,
    bankMid: 7.7185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23810804,
    foreignAtBankMid: 24096386,
    diffForeign: 3121149,
    diffTWD: 3932,
    diffPct: 15.1,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.00126,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/20 10:08:58';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-20';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-20';
