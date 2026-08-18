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
 * 匯率時間：2026/08/18 10:20:26
 * 生成日期：2026-08-18
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
    foreignAtCash: 935,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 945,
    diffForeign: 7,
    diffTWD: 235,
    diffPct: 0.8,
    cashSell: 32.09,
    marketMid: 31.839022,
    bankMid: 31.755,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147783,
    foreignAtMarketMid: 150057,
    foreignAtBankMid: 152594,
    diffForeign: 2274,
    diffTWD: 455,
    diffPct: 1.5,
    cashSell: 0.203,
    marketMid: 0.199924,
    bankMid: 0.1966,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 803,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 818,
    diffForeign: 10,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 37.36,
    marketMid: 36.905816,
    bankMid: 36.69,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 682,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 698,
    diffForeign: 13,
    diffTWD: 578,
    diffPct: 2,
    cashSell: 44.02,
    marketMid: 43.172301,
    bankMid: 42.96,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6274,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6382,
    diffForeign: 56,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 4.782,
    marketMid: 4.739336,
    bankMid: 4.701,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1214083,
    foreignAtMarketMid: 1333821,
    foreignAtBankMid: 1318102,
    diffForeign: 119738,
    diffTWD: 2693,
    diffPct: 9.9,
    cashSell: 0.02471,
    marketMid: 0.022492,
    bankMid: 0.02276,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.8,
        rateBuy: 43.5,
        rateInverse: 0.023364,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-18',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7310,
    foreignAtMarketMid: 7389,
    foreignAtBankMid: 7496,
    diffForeign: 79,
    diffTWD: 321,
    diffPct: 1.1,
    cashSell: 4.104,
    marketMid: 4.060139,
    bankMid: 4.002,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1304,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1327,
    diffForeign: 22,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 23,
    marketMid: 22.630578,
    bankMid: 22.61,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1285,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1310,
    diffForeign: 21,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 23.35,
    marketMid: 22.972663,
    bankMid: 22.895,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1210,
    diffForeign: 14,
    diffTWD: 354,
    diffPct: 1.2,
    cashSell: 25.24,
    marketMid: 24.94201,
    bankMid: 24.785,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 757,
    foreignAtMarketMid: 763,
    foreignAtBankMid: 769,
    diffForeign: 6,
    diffTWD: 225,
    diffPct: 0.8,
    cashSell: 39.61,
    marketMid: 39.312812,
    bankMid: 39.01,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1568,
    foreignAtMarketMid: 1595,
    foreignAtBankMid: 1604,
    diffForeign: 27,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 19.13,
    marketMid: 18.806183,
    bankMid: 18.705,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29280,
    foreignAtMarketMid: 31106,
    foreignAtBankMid: 32272,
    diffForeign: 1826,
    diffTWD: 1761,
    diffPct: 6.2,
    cashSell: 1.0246,
    marketMid: 0.964449,
    bankMid: 0.9296,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51484,
    foreignAtMarketMid: 58058,
    foreignAtBankMid: 58061,
    diffForeign: 6574,
    diffTWD: 3397,
    diffPct: 12.8,
    cashSell: 0.5827,
    marketMid: 0.516727,
    bankMid: 0.5167,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16800639,
    foreignAtBankMid: 16853933,
    diffForeign: 2716132,
    diffTWD: 4850,
    diffPct: 19.3,
    cashSell: 0.00213,
    marketMid: 0.001786,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3593,
    foreignAtMarketMid: 3830,
    foreignAtBankMid: 3954,
    diffForeign: 237,
    diffTWD: 1855,
    diffPct: 6.6,
    cashSell: 8.35,
    marketMid: 7.833737,
    bankMid: 7.5875,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24543049,
    foreignAtBankMid: 25104603,
    diffForeign: 3114478,
    diffTWD: 3807,
    diffPct: 14.5,
    cashSell: 0.0014,
    marketMid: 0.001222,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/18 10:20:26';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-18';
