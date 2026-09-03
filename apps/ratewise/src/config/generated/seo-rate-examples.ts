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
 * 匯率時間：2026/09/03 13:59:10
 * 生成日期：2026-09-03
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
    foreignAtCash: 937,
    foreignAtMarketMid: 945,
    foreignAtBankMid: 947,
    diffForeign: 8,
    diffTWD: 232,
    diffPct: 0.8,
    cashSell: 32.005,
    marketMid: 31.757122,
    bankMid: 31.67,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146270,
    foreignAtMarketMid: 150314,
    foreignAtBankMid: 150981,
    diffForeign: 4044,
    diffTWD: 807,
    diffPct: 2.8,
    cashSell: 0.2051,
    marketMid: 0.199583,
    bankMid: 0.1987,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 803,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 818,
    diffForeign: 13,
    diffTWD: 445,
    diffPct: 1.5,
    cashSell: 37.34,
    marketMid: 36.786345,
    bankMid: 36.67,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 703,
    diffForeign: 14,
    diffTWD: 605,
    diffPct: 2.1,
    cashSell: 43.74,
    marketMid: 42.857755,
    bankMid: 42.68,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6264,
    foreignAtMarketMid: 6360,
    foreignAtBankMid: 6372,
    diffForeign: 96,
    diffTWD: 451,
    diffPct: 1.5,
    cashSell: 4.789,
    marketMid: 4.716981,
    bankMid: 4.708,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1176932,
    foreignAtMarketMid: 1284127,
    foreignAtBankMid: 1274427,
    diffForeign: 107195,
    diffTWD: 2504,
    diffPct: 9.1,
    cashSell: 0.02549,
    marketMid: 0.023362,
    bankMid: 0.02354,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.6,
        rateBuy: 42,
        rateInverse: 0.024038,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-03',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7328,
    foreignAtMarketMid: 7410,
    foreignAtBankMid: 7515,
    diffForeign: 82,
    diffTWD: 331,
    diffPct: 1.1,
    cashSell: 4.094,
    marketMid: 4.048796,
    bankMid: 3.992,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1320,
    diffForeign: 21,
    diffTWD: 489,
    diffPct: 1.7,
    cashSell: 23.12,
    marketMid: 22.743296,
    bankMid: 22.73,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1285,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1310,
    diffForeign: 27,
    diffTWD: 626,
    diffPct: 2.1,
    cashSell: 23.35,
    marketMid: 22.862891,
    bankMid: 22.895,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1184,
    foreignAtMarketMid: 1202,
    foreignAtBankMid: 1206,
    diffForeign: 18,
    diffTWD: 429,
    diffPct: 1.4,
    cashSell: 25.33,
    marketMid: 24.968166,
    bankMid: 24.875,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 771,
    diffForeign: 8,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 39.49,
    marketMid: 39.038101,
    bankMid: 38.89,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1582,
    foreignAtMarketMid: 1616,
    foreignAtBankMid: 1619,
    diffForeign: 34,
    diffTWD: 629,
    diffPct: 2.1,
    cashSell: 18.96,
    marketMid: 18.562519,
    bankMid: 18.535,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29303,
    foreignAtMarketMid: 31366,
    foreignAtBankMid: 32300,
    diffForeign: 2063,
    diffTWD: 1973,
    diffPct: 7,
    cashSell: 1.0238,
    marketMid: 0.956457,
    bankMid: 0.9288,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52265,
    foreignAtMarketMid: 59137,
    foreignAtBankMid: 59055,
    diffForeign: 6872,
    diffTWD: 3486,
    diffPct: 13.1,
    cashSell: 0.574,
    marketMid: 0.507297,
    bankMid: 0.508,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16762505,
    foreignAtBankMid: 16853933,
    diffForeign: 2677998,
    diffTWD: 4793,
    diffPct: 19,
    cashSell: 0.00213,
    marketMid: 0.00179,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3595,
    foreignAtMarketMid: 3820,
    foreignAtBankMid: 3956,
    diffForeign: 225,
    diffTWD: 1771,
    diffPct: 6.3,
    cashSell: 8.345,
    marketMid: 7.852437,
    bankMid: 7.5825,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24578244,
    foreignAtBankMid: 25104603,
    diffForeign: 3149673,
    diffTWD: 3844,
    diffPct: 14.7,
    cashSell: 0.0014,
    marketMid: 0.001221,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/03 13:59:10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-03';
