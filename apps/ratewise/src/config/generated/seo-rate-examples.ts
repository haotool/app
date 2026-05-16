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
 * 匯率時間：2026/05/15 18:06:06
 * 生成日期：2026-05-16
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
    foreignAtCash: 943,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 953,
    diffForeign: 7,
    diffTWD: 206,
    diffPct: 0.7,
    cashSell: 31.805,
    marketMid: 31.586595,
    bankMid: 31.47,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148075,
    foreignAtMarketMid: 150822,
    foreignAtBankMid: 152905,
    diffForeign: 2747,
    diffTWD: 546,
    diffPct: 1.9,
    cashSell: 0.2026,
    marketMid: 0.198909,
    bankMid: 0.1962,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 821,
    diffForeign: 12,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 37.2,
    marketMid: 36.694555,
    bankMid: 36.53,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 715,
    diffForeign: 15,
    diffTWD: 635,
    diffPct: 2.2,
    cashSell: 43.03,
    marketMid: 42.119451,
    bankMid: 41.97,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6390,
    foreignAtMarketMid: 6453,
    foreignAtBankMid: 6502,
    diffForeign: 63,
    diffTWD: 294,
    diffPct: 1,
    cashSell: 4.695,
    marketMid: 4.649,
    bankMid: 4.614,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1294219,
    foreignAtMarketMid: 1423085,
    foreignAtBankMid: 1413095,
    diffForeign: 128866,
    diffTWD: 2717,
    diffPct: 10,
    cashSell: 0.02318,
    marketMid: 0.021081,
    bankMid: 0.02123,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.2,
        rateBuy: 45.5,
        rateInverse: 0.022124,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-16',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7358,
    foreignAtMarketMid: 7447,
    foreignAtBankMid: 7547,
    diffForeign: 89,
    diffTWD: 355,
    diffPct: 1.2,
    cashSell: 4.077,
    marketMid: 4.0287,
    bankMid: 3.975,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1327,
    foreignAtBankMid: 1330,
    diffForeign: 19,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 22.94,
    marketMid: 22.604489,
    bankMid: 22.55,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1308,
    foreignAtBankMid: 1310,
    diffForeign: 24,
    diffTWD: 539,
    diffPct: 1.8,
    cashSell: 23.36,
    marketMid: 22.940515,
    bankMid: 22.905,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1201,
    foreignAtMarketMid: 1217,
    foreignAtBankMid: 1224,
    diffForeign: 16,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 24.97,
    marketMid: 24.653617,
    bankMid: 24.515,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 741,
    foreignAtMarketMid: 748,
    foreignAtBankMid: 752,
    diffForeign: 7,
    diffTWD: 286,
    diffPct: 1,
    cashSell: 40.51,
    marketMid: 40.123581,
    bankMid: 39.91,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1595,
    foreignAtMarketMid: 1624,
    foreignAtBankMid: 1632,
    diffForeign: 29,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 18.81,
    marketMid: 18.471655,
    bankMid: 18.385,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29203,
    foreignAtMarketMid: 31011,
    foreignAtBankMid: 32178,
    diffForeign: 1808,
    diffTWD: 1749,
    diffPct: 6.2,
    cashSell: 1.0273,
    marketMid: 0.967414,
    bankMid: 0.9323,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52002,
    foreignAtMarketMid: 58464,
    foreignAtBankMid: 58720,
    diffForeign: 6462,
    diffTWD: 3316,
    diffPct: 12.4,
    cashSell: 0.5769,
    marketMid: 0.513133,
    bankMid: 0.5109,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16619667,
    foreignAtBankMid: 16393443,
    diffForeign: 2858199,
    diffTWD: 5159,
    diffPct: 20.8,
    cashSell: 0.00218,
    marketMid: 0.001805,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3537,
    foreignAtMarketMid: 3756,
    foreignAtBankMid: 3887,
    diffForeign: 219,
    diffTWD: 1748,
    diffPct: 6.2,
    cashSell: 8.481,
    marketMid: 7.98671,
    bankMid: 7.7185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24961507,
    foreignAtBankMid: 25974026,
    diffForeign: 2902683,
    diffTWD: 3489,
    diffPct: 13.2,
    cashSell: 0.00136,
    marketMid: 0.001202,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/15 18:06:06';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-16';
