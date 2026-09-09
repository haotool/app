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
 * 匯率時間：2026/09/09 13:21:52
 * 生成日期：2026-09-09
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
    foreignAtMarketMid: 952,
    foreignAtBankMid: 955,
    diffForeign: 8,
    diffTWD: 249,
    diffPct: 0.8,
    cashSell: 31.765,
    marketMid: 31.501024,
    bankMid: 31.43,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143678,
    foreignAtMarketMid: 146404,
    foreignAtBankMid: 148221,
    diffForeign: 2726,
    diffTWD: 559,
    diffPct: 1.9,
    cashSell: 0.2088,
    marketMid: 0.204912,
    bankMid: 0.2024,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 807,
    foreignAtMarketMid: 819,
    foreignAtBankMid: 822,
    diffForeign: 12,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 37.16,
    marketMid: 36.639431,
    bankMid: 36.49,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 705,
    diffForeign: 15,
    diffTWD: 625,
    diffPct: 2.1,
    cashSell: 43.6,
    marketMid: 42.691257,
    bankMid: 42.54,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6300,
    foreignAtMarketMid: 6393,
    foreignAtBankMid: 6409,
    diffForeign: 93,
    diffTWD: 437,
    diffPct: 1.5,
    cashSell: 4.762,
    marketMid: 4.692633,
    bankMid: 4.681,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1166861,
    foreignAtMarketMid: 1276515,
    foreignAtBankMid: 1262626,
    diffForeign: 109654,
    diffTWD: 2577,
    diffPct: 9.4,
    cashSell: 0.02571,
    marketMid: 0.023501,
    bankMid: 0.02376,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 41.8,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-09',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7382,
    foreignAtMarketMid: 7464,
    foreignAtBankMid: 7572,
    diffForeign: 82,
    diffTWD: 330,
    diffPct: 1.1,
    cashSell: 4.064,
    marketMid: 4.019293,
    bankMid: 3.962,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1318,
    diffForeign: 23,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 23.15,
    marketMid: 22.74071,
    bankMid: 22.76,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1289,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1314,
    diffForeign: 23,
    diffTWD: 543,
    diffPct: 1.8,
    cashSell: 23.28,
    marketMid: 22.85871,
    bankMid: 22.825,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1210,
    diffForeign: 16,
    diffTWD: 399,
    diffPct: 1.3,
    cashSell: 25.25,
    marketMid: 24.914047,
    bankMid: 24.795,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 763,
    foreignAtMarketMid: 770,
    foreignAtBankMid: 775,
    diffForeign: 7,
    diffTWD: 295,
    diffPct: 1,
    cashSell: 39.33,
    marketMid: 38.943843,
    bankMid: 38.73,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1594,
    foreignAtMarketMid: 1627,
    foreignAtBankMid: 1631,
    diffForeign: 33,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 18.82,
    marketMid: 18.442699,
    bankMid: 18.395,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29415,
    foreignAtMarketMid: 31314,
    foreignAtBankMid: 32436,
    diffForeign: 1899,
    diffTWD: 1820,
    diffPct: 6.5,
    cashSell: 1.0199,
    marketMid: 0.958028,
    bankMid: 0.9249,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52604,
    foreignAtMarketMid: 59590,
    foreignAtBankMid: 59488,
    diffForeign: 6986,
    diffTWD: 3517,
    diffPct: 13.3,
    cashSell: 0.5703,
    marketMid: 0.503443,
    bankMid: 0.5043,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16785872,
    foreignAtBankMid: 16853933,
    diffForeign: 2701365,
    diffTWD: 4828,
    diffPct: 19.2,
    cashSell: 0.00213,
    marketMid: 0.001787,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3641,
    foreignAtMarketMid: 3867,
    foreignAtBankMid: 4013,
    diffForeign: 226,
    diffTWD: 1752,
    diffPct: 6.2,
    cashSell: 8.239,
    marketMid: 7.757952,
    bankMid: 7.4765,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24604778,
    foreignAtBankMid: 25104603,
    diffForeign: 3176207,
    diffTWD: 3873,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/09 13:21:52';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-09';
