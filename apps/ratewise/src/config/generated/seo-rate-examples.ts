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
 * 匯率時間：2026/08/12 10:24:53
 * 生成日期：2026-08-12
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
    foreignAtCash: 924,
    foreignAtMarketMid: 931,
    foreignAtBankMid: 933,
    diffForeign: 7,
    diffTWD: 255,
    diffPct: 0.9,
    cashSell: 32.485,
    marketMid: 32.209231,
    bankMid: 32.15,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145914,
    foreignAtMarketMid: 148227,
    foreignAtBankMid: 150602,
    diffForeign: 2313,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 0.2056,
    marketMid: 0.202392,
    bankMid: 0.1992,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 810,
    diffForeign: 10,
    diffTWD: 383,
    diffPct: 1.3,
    cashSell: 37.69,
    marketMid: 37.209302,
    bankMid: 37.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 692,
    diffForeign: 14,
    diffTWD: 595,
    diffPct: 2,
    cashSell: 44.42,
    marketMid: 43.538837,
    bankMid: 43.36,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6200,
    foreignAtMarketMid: 6282,
    foreignAtBankMid: 6305,
    diffForeign: 82,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 4.839,
    marketMid: 4.775549,
    bankMid: 4.758,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1203852,
    foreignAtMarketMid: 1315740,
    foreignAtBankMid: 1306051,
    diffForeign: 111888,
    diffTWD: 2551,
    diffPct: 9.3,
    cashSell: 0.02492,
    marketMid: 0.022801,
    bankMid: 0.02297,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.2,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-12',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7224,
    foreignAtMarketMid: 7302,
    foreignAtBankMid: 7406,
    diffForeign: 78,
    diffTWD: 322,
    diffPct: 1.1,
    cashSell: 4.153,
    marketMid: 4.10843,
    bankMid: 4.051,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1320,
    diffForeign: 21,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 23.11,
    marketMid: 22.7464,
    bankMid: 22.72,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1274,
    foreignAtMarketMid: 1296,
    foreignAtBankMid: 1300,
    diffForeign: 22,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 23.54,
    marketMid: 23.148148,
    bankMid: 23.085,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1177,
    foreignAtMarketMid: 1191,
    foreignAtBankMid: 1198,
    diffForeign: 14,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 25.49,
    marketMid: 25.186379,
    bankMid: 25.035,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 749,
    foreignAtMarketMid: 755,
    foreignAtBankMid: 760,
    diffForeign: 6,
    diffTWD: 233,
    diffPct: 0.8,
    cashSell: 40.07,
    marketMid: 39.75827,
    bankMid: 39.47,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1556,
    foreignAtMarketMid: 1584,
    foreignAtBankMid: 1591,
    diffForeign: 28,
    diffTWD: 528,
    diffPct: 1.8,
    cashSell: 19.28,
    marketMid: 18.940829,
    bankMid: 18.855,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29036,
    foreignAtMarketMid: 30825,
    foreignAtBankMid: 31976,
    diffForeign: 1789,
    diffTWD: 1742,
    diffPct: 6.2,
    cashSell: 1.0332,
    marketMid: 0.973222,
    bankMid: 0.9382,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50753,
    foreignAtMarketMid: 57075,
    foreignAtBankMid: 57132,
    diffForeign: 6322,
    diffTWD: 3323,
    diffPct: 12.5,
    cashSell: 0.5911,
    marketMid: 0.525626,
    bankMid: 0.5251,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16622362,
    foreignAtBankMid: 16853933,
    diffForeign: 2537855,
    diffTWD: 4580,
    diffPct: 18,
    cashSell: 0.00213,
    marketMid: 0.001805,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3584,
    foreignAtMarketMid: 3808,
    foreignAtBankMid: 3943,
    diffForeign: 224,
    diffTWD: 1765,
    diffPct: 6.3,
    cashSell: 8.371,
    marketMid: 7.878482,
    bankMid: 7.6085,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24283318,
    foreignAtBankMid: 24691358,
    diffForeign: 3156557,
    diffTWD: 3900,
    diffPct: 14.9,
    cashSell: 0.00142,
    marketMid: 0.001235,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/12 10:24:53';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-12';
