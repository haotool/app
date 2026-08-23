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
 * 匯率時間：2026/08/22 10:11:44
 * 生成日期：2026-08-23
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
    foreignAtCash: 934,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 944,
    diffForeign: 9,
    diffTWD: 279,
    diffPct: 0.9,
    cashSell: 32.12,
    marketMid: 31.821798,
    bankMid: 31.785,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147059,
    foreignAtMarketMid: 149653,
    foreignAtBankMid: 151822,
    diffForeign: 2594,
    diffTWD: 520,
    diffPct: 1.8,
    cashSell: 0.204,
    marketMid: 0.200463,
    bankMid: 0.1976,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 795,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 809,
    diffForeign: 11,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 37.74,
    marketMid: 37.198229,
    bankMid: 37.07,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 691,
    foreignAtBankMid: 693,
    diffForeign: 15,
    diffTWD: 634,
    diffPct: 2.2,
    cashSell: 44.37,
    marketMid: 43.43294,
    bankMid: 43.31,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6333,
    foreignAtBankMid: 6349,
    diffForeign: 91,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 4.806,
    marketMid: 4.737091,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1193317,
    foreignAtMarketMid: 1308147,
    foreignAtBankMid: 1293661,
    diffForeign: 114830,
    diffTWD: 2633,
    diffPct: 9.6,
    cashSell: 0.02514,
    marketMid: 0.022933,
    bankMid: 0.02319,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-23',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7387,
    foreignAtBankMid: 7483,
    diffForeign: 90,
    diffTWD: 362,
    diffPct: 1.2,
    cashSell: 4.111,
    marketMid: 4.061441,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1312,
    diffForeign: 27,
    diffTWD: 614,
    diffPct: 2.1,
    cashSell: 23.25,
    marketMid: 22.774374,
    bankMid: 22.86,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1273,
    foreignAtMarketMid: 1297,
    foreignAtBankMid: 1298,
    diffForeign: 24,
    diffTWD: 545,
    diffPct: 1.8,
    cashSell: 23.56,
    marketMid: 23.132084,
    bankMid: 23.105,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1180,
    foreignAtMarketMid: 1196,
    foreignAtBankMid: 1202,
    diffForeign: 16,
    diffTWD: 405,
    diffPct: 1.4,
    cashSell: 25.42,
    marketMid: 25.076483,
    bankMid: 24.965,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 754,
    foreignAtBankMid: 758,
    diffForeign: 7,
    diffTWD: 282,
    diffPct: 1,
    cashSell: 40.16,
    marketMid: 39.781995,
    bankMid: 39.56,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1546,
    foreignAtMarketMid: 1579,
    foreignAtBankMid: 1580,
    diffForeign: 33,
    diffTWD: 629,
    diffPct: 2.1,
    cashSell: 19.41,
    marketMid: 19.002736,
    bankMid: 18.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28960,
    foreignAtMarketMid: 30834,
    foreignAtBankMid: 31884,
    diffForeign: 1874,
    diffTWD: 1823,
    diffPct: 6.5,
    cashSell: 1.0359,
    marketMid: 0.972966,
    bankMid: 0.9409,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51493,
    foreignAtMarketMid: 58234,
    foreignAtBankMid: 58072,
    diffForeign: 6741,
    diffTWD: 3472,
    diffPct: 13.1,
    cashSell: 0.5826,
    marketMid: 0.515167,
    bankMid: 0.5166,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16675438,
    foreignAtBankMid: 16393443,
    diffForeign: 2913970,
    diffTWD: 5242,
    diffPct: 21.2,
    cashSell: 0.00218,
    marketMid: 0.001799,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3577,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3935,
    diffForeign: 229,
    diffTWD: 1802,
    diffPct: 6.4,
    cashSell: 8.386,
    marketMid: 7.882333,
    bankMid: 7.6235,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24601054,
    foreignAtBankMid: 25531915,
    diffForeign: 2861924,
    diffTWD: 3490,
    diffPct: 13.2,
    cashSell: 0.00138,
    marketMid: 0.001219,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/22 10:11:44';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-23';
