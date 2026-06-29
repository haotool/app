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
 * 匯率時間：2026/06/29 14:56:34
 * 生成日期：2026-06-29
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
    foreignAtCash: 933,
    foreignAtMarketMid: 941,
    foreignAtBankMid: 943,
    diffForeign: 8,
    diffTWD: 262,
    diffPct: 0.9,
    cashSell: 32.16,
    marketMid: 31.879623,
    bankMid: 31.825,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149477,
    foreignAtMarketMid: 152291,
    foreignAtBankMid: 154400,
    diffForeign: 2814,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 0.2007,
    marketMid: 0.196991,
    bankMid: 0.1943,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 813,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 828,
    diffForeign: 14,
    diffTWD: 504,
    diffPct: 1.7,
    cashSell: 36.91,
    marketMid: 36.289737,
    bankMid: 36.24,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 714,
    diffForeign: 17,
    diffTWD: 714,
    diffPct: 2.4,
    cashSell: 43.09,
    marketMid: 42.064527,
    bankMid: 42.03,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6306,
    foreignAtMarketMid: 6399,
    foreignAtBankMid: 6416,
    diffForeign: 93,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 4.757,
    marketMid: 4.688233,
    bankMid: 4.676,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1313485,
    foreignAtMarketMid: 1445900,
    foreignAtBankMid: 1436094,
    diffForeign: 132415,
    diffTWD: 2747,
    diffPct: 10.1,
    cashSell: 0.02284,
    marketMid: 0.020748,
    bankMid: 0.02089,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.7,
        rateBuy: 47,
        rateInverse: 0.021413,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7294,
    foreignAtMarketMid: 7383,
    foreignAtBankMid: 7479,
    diffForeign: 89,
    diffTWD: 362,
    diffPct: 1.2,
    cashSell: 4.113,
    marketMid: 4.063389,
    bankMid: 4.011,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1339,
    foreignAtMarketMid: 1364,
    foreignAtBankMid: 1363,
    diffForeign: 25,
    diffTWD: 553,
    diffPct: 1.9,
    cashSell: 22.4,
    marketMid: 21.98672,
    bankMid: 22.01,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1336,
    diffForeign: 27,
    diffTWD: 593,
    diffPct: 2,
    cashSell: 22.91,
    marketMid: 22.457275,
    bankMid: 22.455,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1200,
    foreignAtMarketMid: 1219,
    foreignAtBankMid: 1223,
    diffForeign: 19,
    diffTWD: 447,
    diffPct: 1.5,
    cashSell: 24.99,
    marketMid: 24.617809,
    bankMid: 24.535,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 753,
    foreignAtMarketMid: 762,
    foreignAtBankMid: 765,
    diffForeign: 9,
    diffTWD: 351,
    diffPct: 1.2,
    cashSell: 39.82,
    marketMid: 39.354585,
    bankMid: 39.22,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1668,
    foreignAtBankMid: 1668,
    diffForeign: 38,
    diffTWD: 694,
    diffPct: 2.4,
    cashSell: 18.41,
    marketMid: 17.983994,
    bankMid: 17.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29438,
    foreignAtMarketMid: 31425,
    foreignAtBankMid: 32464,
    diffForeign: 1987,
    diffTWD: 1897,
    diffPct: 6.8,
    cashSell: 1.0191,
    marketMid: 0.954648,
    bankMid: 0.9241,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51099,
    foreignAtMarketMid: 57705,
    foreignAtBankMid: 57571,
    diffForeign: 6606,
    diffTWD: 3435,
    diffPct: 12.9,
    cashSell: 0.5871,
    marketMid: 0.519885,
    bankMid: 0.5211,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16815329,
    foreignAtBankMid: 16853933,
    diffForeign: 2730822,
    diffTWD: 4872,
    diffPct: 19.4,
    cashSell: 0.00213,
    marketMid: 0.001784,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3591,
    foreignAtMarketMid: 3850,
    foreignAtBankMid: 3951,
    diffForeign: 259,
    diffTWD: 2022,
    diffPct: 7.2,
    cashSell: 8.355,
    marketMid: 7.791803,
    bankMid: 7.5925,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24603746,
    foreignAtBankMid: 25104603,
    diffForeign: 3175175,
    diffTWD: 3872,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/29 14:56:34';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-29';
