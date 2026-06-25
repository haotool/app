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
 * 匯率時間：2026/06/25 12:38:05
 * 生成日期：2026-06-25
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
    foreignAtCash: 149626,
    foreignAtMarketMid: 152730,
    foreignAtBankMid: 154560,
    diffForeign: 3104,
    diffTWD: 610,
    diffPct: 2.1,
    cashSell: 0.2005,
    marketMid: 0.196426,
    bankMid: 0.1941,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 817,
    foreignAtMarketMid: 833,
    foreignAtBankMid: 832,
    diffForeign: 16,
    diffTWD: 586,
    diffPct: 2,
    cashSell: 36.74,
    marketMid: 36.021757,
    bankMid: 36.07,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 699,
    foreignAtMarketMid: 718,
    foreignAtBankMid: 717,
    diffForeign: 19,
    diffTWD: 775,
    diffPct: 2.7,
    cashSell: 42.92,
    marketMid: 41.811264,
    bankMid: 41.86,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6325,
    foreignAtMarketMid: 6432,
    foreignAtBankMid: 6435,
    diffForeign: 107,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 4.743,
    marketMid: 4.664179,
    bankMid: 4.662,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1317523,
    foreignAtMarketMid: 1453561,
    foreignAtBankMid: 1440922,
    diffForeign: 136038,
    diffTWD: 2808,
    diffPct: 10.3,
    cashSell: 0.02277,
    marketMid: 0.020639,
    bankMid: 0.02082,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 47,
        rateBuy: 47.2,
        rateInverse: 0.021277,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-25',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7299,
    foreignAtMarketMid: 7403,
    foreignAtBankMid: 7485,
    diffForeign: 104,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 4.11,
    marketMid: 4.052406,
    bankMid: 4.008,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1342,
    foreignAtMarketMid: 1367,
    foreignAtBankMid: 1365,
    diffForeign: 25,
    diffTWD: 547,
    diffPct: 1.9,
    cashSell: 22.36,
    marketMid: 21.952451,
    bankMid: 21.97,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1345,
    foreignAtBankMid: 1343,
    diffForeign: 29,
    diffTWD: 654,
    diffPct: 2.2,
    cashSell: 22.8,
    marketMid: 22.303009,
    bankMid: 22.345,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1205,
    foreignAtMarketMid: 1227,
    foreignAtBankMid: 1227,
    diffForeign: 22,
    diffTWD: 543,
    diffPct: 1.8,
    cashSell: 24.9,
    marketMid: 24.44928,
    bankMid: 24.445,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 756,
    foreignAtMarketMid: 767,
    foreignAtBankMid: 768,
    diffForeign: 11,
    diffTWD: 429,
    diffPct: 1.5,
    cashSell: 39.67,
    marketMid: 39.102213,
    bankMid: 39.07,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1635,
    foreignAtMarketMid: 1669,
    foreignAtBankMid: 1674,
    diffForeign: 34,
    diffTWD: 616,
    diffPct: 2.1,
    cashSell: 18.35,
    marketMid: 17.973328,
    bankMid: 17.925,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29530,
    foreignAtMarketMid: 31569,
    foreignAtBankMid: 32577,
    diffForeign: 2039,
    diffTWD: 1937,
    diffPct: 6.9,
    cashSell: 1.0159,
    marketMid: 0.950308,
    bankMid: 0.9209,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51160,
    foreignAtMarketMid: 57792,
    foreignAtBankMid: 57648,
    diffForeign: 6632,
    diffTWD: 3443,
    diffPct: 13,
    cashSell: 0.5864,
    marketMid: 0.519104,
    bankMid: 0.5204,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16954430,
    foreignAtBankMid: 16853933,
    diffForeign: 2869923,
    diffTWD: 5078,
    diffPct: 20.4,
    cashSell: 0.00213,
    marketMid: 0.001769,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3639,
    foreignAtMarketMid: 3908,
    foreignAtBankMid: 4010,
    diffForeign: 269,
    diffTWD: 2068,
    diffPct: 7.4,
    cashSell: 8.244,
    marketMid: 7.675716,
    bankMid: 7.4815,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24758236,
    foreignAtBankMid: 25104603,
    diffForeign: 3329665,
    diffTWD: 4035,
    diffPct: 15.5,
    cashSell: 0.0014,
    marketMid: 0.001212,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/25 12:38:05';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-25';
