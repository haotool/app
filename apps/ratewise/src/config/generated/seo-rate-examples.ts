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
 * 匯率時間：2026/10/03 07:03:25
 * 生成日期：2026-10-03
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
    foreignAtCash: 935,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 944,
    diffForeign: 7,
    diffTWD: 225,
    diffPct: 0.8,
    cashSell: 32.1,
    cashBuy: 31.43,
    marketMid: 31.859309,
    bankMid: 31.765,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146128,
    foreignAtMarketMid: 148734,
    foreignAtBankMid: 150830,
    diffForeign: 2606,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 0.2053,
    cashBuy: 0.1925,
    marketMid: 0.201703,
    bankMid: 0.1989,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 825,
    foreignAtMarketMid: 837,
    foreignAtBankMid: 841,
    diffForeign: 12,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 36.35,
    cashBuy: 35.01,
    marketMid: 35.855145,
    bankMid: 35.68,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 714,
    diffForeign: 16,
    diffTWD: 656,
    diffPct: 2.2,
    cashSell: 43.09,
    cashBuy: 40.97,
    marketMid: 42.147855,
    bankMid: 42.03,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6233,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6340,
    diffForeign: 82,
    diffTWD: 389,
    diffPct: 1.3,
    cashSell: 4.813,
    cashBuy: 4.651,
    marketMid: 4.750594,
    bankMid: 4.732,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1160093,
    foreignAtMarketMid: 1267988,
    foreignAtBankMid: 1254705,
    diffForeign: 107895,
    diffTWD: 2553,
    diffPct: 9.3,
    cashSell: 0.02586,
    cashBuy: 0.02196,
    marketMid: 0.02366,
    bankMid: 0.02391,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.3,
        rateBuy: 41.5,
        rateInverse: 0.024213,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-03',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7308,
    foreignAtMarketMid: 7389,
    foreignAtBankMid: 7494,
    diffForeign: 81,
    diffTWD: 329,
    diffPct: 1.1,
    cashSell: 4.105,
    cashBuy: 3.901,
    marketMid: 4.060023,
    bankMid: 4.003,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1332,
    foreignAtMarketMid: 1354,
    foreignAtBankMid: 1355,
    diffForeign: 22,
    diffTWD: 490,
    diffPct: 1.7,
    cashSell: 22.53,
    cashBuy: 21.75,
    marketMid: 22.161647,
    bankMid: 22.14,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1318,
    foreignAtMarketMid: 1342,
    foreignAtBankMid: 1345,
    diffForeign: 24,
    diffTWD: 539,
    diffPct: 1.8,
    cashSell: 22.76,
    cashBuy: 21.85,
    marketMid: 22.351363,
    bankMid: 22.305,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1212,
    diffForeign: 15,
    diffTWD: 379,
    diffPct: 1.3,
    cashSell: 25.21,
    cashBuy: 24.3,
    marketMid: 24.891721,
    bankMid: 24.755,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 773,
    foreignAtMarketMid: 780,
    foreignAtBankMid: 785,
    diffForeign: 7,
    diffTWD: 279,
    diffPct: 0.9,
    cashSell: 38.8,
    cashBuy: 37.6,
    marketMid: 38.439362,
    bankMid: 38.2,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1642,
    foreignAtMarketMid: 1677,
    foreignAtBankMid: 1681,
    diffForeign: 35,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 18.27,
    cashBuy: 17.42,
    marketMid: 17.890368,
    bankMid: 17.845,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29700,
    foreignAtMarketMid: 31611,
    foreignAtBankMid: 32783,
    diffForeign: 1911,
    diffTWD: 1813,
    diffPct: 6.4,
    cashSell: 1.0101,
    cashBuy: 0.8201,
    marketMid: 0.949046,
    bankMid: 0.9151,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52156,
    foreignAtMarketMid: 58962,
    foreignAtBankMid: 58916,
    diffForeign: 6806,
    diffTWD: 3463,
    diffPct: 13,
    cashSell: 0.5752,
    cashBuy: 0.4432,
    marketMid: 0.508806,
    bankMid: 0.5092,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16825448,
    foreignAtBankMid: 17341040,
    diffForeign: 2402371,
    diffTWD: 4283,
    diffPct: 16.7,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001783,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3618,
    foreignAtMarketMid: 3849,
    foreignAtBankMid: 3984,
    diffForeign: 231,
    diffTWD: 1801,
    diffPct: 6.4,
    cashSell: 8.292,
    cashBuy: 6.767,
    marketMid: 7.794232,
    bankMid: 7.5295,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24091421,
    foreignAtBankMid: 25316456,
    diffForeign: 2508687,
    diffTWD: 3124,
    diffPct: 11.6,
    cashSell: 0.00139,
    cashBuy: 0.00098,
    marketMid: 0.001245,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/03 07:03:25';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-03';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-03';
