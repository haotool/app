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
 * 匯率時間：2026/09/08 12:57:13
 * 生成日期：2026-09-08
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
    foreignAtCash: 944,
    foreignAtMarketMid: 951,
    foreignAtBankMid: 954,
    diffForeign: 7,
    diffTWD: 224,
    diffPct: 0.8,
    cashSell: 31.775,
    marketMid: 31.537782,
    bankMid: 31.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143678,
    foreignAtMarketMid: 147408,
    foreignAtBankMid: 148221,
    diffForeign: 3730,
    diffTWD: 759,
    diffPct: 2.6,
    cashSell: 0.2088,
    marketMid: 0.203516,
    bankMid: 0.2024,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 808,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 823,
    diffForeign: 10,
    diffTWD: 388,
    diffPct: 1.3,
    cashSell: 37.14,
    marketMid: 36.659579,
    bankMid: 36.47,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 14,
    diffTWD: 603,
    diffPct: 2,
    cashSell: 43.57,
    marketMid: 42.694902,
    bankMid: 42.51,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6303,
    foreignAtMarketMid: 6369,
    foreignAtBankMid: 6412,
    diffForeign: 66,
    diffTWD: 313,
    diffPct: 1.1,
    cashSell: 4.76,
    marketMid: 4.710316,
    bankMid: 4.679,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1170047,
    foreignAtMarketMid: 1279523,
    foreignAtBankMid: 1266357,
    diffForeign: 109476,
    diffTWD: 2567,
    diffPct: 9.4,
    cashSell: 0.02564,
    marketMid: 0.023446,
    bankMid: 0.02369,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.65,
        rateBuy: 41.7,
        rateInverse: 0.02401,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7378,
    foreignAtMarketMid: 7451,
    foreignAtBankMid: 7568,
    diffForeign: 73,
    diffTWD: 291,
    diffPct: 1,
    cashSell: 4.066,
    marketMid: 4.026543,
    bankMid: 3.964,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1318,
    foreignAtBankMid: 1320,
    diffForeign: 20,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 23.11,
    marketMid: 22.766597,
    bankMid: 22.72,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1314,
    foreignAtBankMid: 1317,
    diffForeign: 23,
    diffTWD: 522,
    diffPct: 1.8,
    cashSell: 23.24,
    marketMid: 22.835743,
    bankMid: 22.785,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1210,
    diffForeign: 15,
    diffTWD: 389,
    diffPct: 1.3,
    cashSell: 25.24,
    marketMid: 24.912805,
    bankMid: 24.785,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 763,
    foreignAtMarketMid: 770,
    foreignAtBankMid: 775,
    diffForeign: 7,
    diffTWD: 256,
    diffPct: 0.9,
    cashSell: 39.31,
    marketMid: 38.974199,
    bankMid: 38.71,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1594,
    foreignAtMarketMid: 1618,
    foreignAtBankMid: 1631,
    diffForeign: 24,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 18.82,
    marketMid: 18.540149,
    bankMid: 18.395,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29412,
    foreignAtMarketMid: 31256,
    foreignAtBankMid: 32432,
    diffForeign: 1844,
    diffTWD: 1770,
    diffPct: 6.3,
    cashSell: 1.02,
    marketMid: 0.95981,
    bankMid: 0.925,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52622,
    foreignAtMarketMid: 59687,
    foreignAtBankMid: 59512,
    diffForeign: 7065,
    diffTWD: 3551,
    diffPct: 13.4,
    cashSell: 0.5701,
    marketMid: 0.502622,
    bankMid: 0.5041,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16794641,
    foreignAtBankMid: 16853933,
    diffForeign: 2710134,
    diffTWD: 4841,
    diffPct: 19.2,
    cashSell: 0.00213,
    marketMid: 0.001786,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3628,
    foreignAtMarketMid: 3850,
    foreignAtBankMid: 3997,
    diffForeign: 222,
    diffTWD: 1731,
    diffPct: 6.1,
    cashSell: 8.269,
    marketMid: 7.791803,
    bankMid: 7.5065,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24610602,
    foreignAtBankMid: 25104603,
    diffForeign: 3182031,
    diffTWD: 3879,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/08 12:57:13';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-08';
