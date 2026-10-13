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
 * 匯率時間：2026/10/13 14:39:26
 * 生成日期：2026-10-13
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
    foreignAtCash: 924,
    foreignAtMarketMid: 939,
    foreignAtBankMid: 933,
    diffForeign: 15,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 32.48,
    cashBuy: 31.81,
    marketMid: 31.959092,
    bankMid: 32.145,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144928,
    foreignAtMarketMid: 148887,
    foreignAtBankMid: 149551,
    diffForeign: 3959,
    diffTWD: 798,
    diffPct: 2.7,
    cashSell: 0.207,
    cashBuy: 0.1942,
    marketMid: 0.201496,
    bankMid: 0.2006,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 821,
    foreignAtMarketMid: 840,
    foreignAtBankMid: 837,
    diffForeign: 19,
    diffTWD: 645,
    diffPct: 2.2,
    cashSell: 36.52,
    cashBuy: 35.18,
    marketMid: 35.734706,
    bankMid: 35.85,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 707,
    diffForeign: 21,
    diffTWD: 858,
    diffPct: 2.9,
    cashSell: 43.51,
    cashBuy: 41.39,
    marketMid: 42.265427,
    bankMid: 42.45,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6155,
    foreignAtMarketMid: 6294,
    foreignAtBankMid: 6259,
    diffForeign: 139,
    diffTWD: 662,
    diffPct: 2.3,
    cashSell: 4.874,
    cashBuy: 4.712,
    marketMid: 4.766444,
    bankMid: 4.793,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1148545,
    foreignAtMarketMid: 1252506,
    foreignAtBankMid: 1241208,
    diffForeign: 103961,
    diffTWD: 2490,
    diffPct: 9.1,
    cashSell: 0.02612,
    cashBuy: 0.02222,
    marketMid: 0.023952,
    bankMid: 0.02417,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.5,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-13',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7225,
    foreignAtMarketMid: 7372,
    foreignAtBankMid: 7407,
    diffForeign: 147,
    diffTWD: 595,
    diffPct: 2,
    cashSell: 4.152,
    cashBuy: 3.948,
    marketMid: 4.069623,
    bankMid: 4.05,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1315,
    foreignAtMarketMid: 1348,
    foreignAtBankMid: 1338,
    diffForeign: 33,
    diffTWD: 739,
    diffPct: 2.5,
    cashSell: 22.81,
    cashBuy: 22.03,
    marketMid: 22.247931,
    bankMid: 22.42,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1340,
    foreignAtBankMid: 1331,
    diffForeign: 35,
    diffTWD: 782,
    diffPct: 2.7,
    cashSell: 22.99,
    cashBuy: 22.08,
    marketMid: 22.3909,
    bankMid: 22.535,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1177,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1198,
    diffForeign: 26,
    diffTWD: 650,
    diffPct: 2.2,
    cashSell: 25.49,
    cashBuy: 24.58,
    marketMid: 24.937656,
    bankMid: 25.035,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 768,
    foreignAtMarketMid: 782,
    foreignAtBankMid: 780,
    diffForeign: 14,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 39.04,
    cashBuy: 37.84,
    marketMid: 38.342088,
    bankMid: 38.44,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1679,
    foreignAtBankMid: 1669,
    diffForeign: 49,
    diffTWD: 862,
    diffPct: 3,
    cashSell: 18.4,
    cashBuy: 17.55,
    marketMid: 17.871504,
    bankMid: 17.975,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29377,
    foreignAtMarketMid: 31573,
    foreignAtBankMid: 32390,
    diffForeign: 2196,
    diffTWD: 2087,
    diffPct: 7.5,
    cashSell: 1.0212,
    cashBuy: 0.8312,
    marketMid: 0.950165,
    bankMid: 0.9262,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51831,
    foreignAtMarketMid: 58957,
    foreignAtBankMid: 58502,
    diffForeign: 7126,
    diffTWD: 3626,
    diffPct: 13.7,
    cashSell: 0.5788,
    cashBuy: 0.4468,
    marketMid: 0.508841,
    bankMid: 0.5128,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16815556,
    foreignAtBankMid: 16853933,
    diffForeign: 2731049,
    diffTWD: 4872,
    diffPct: 19.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001784,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3580,
    foreignAtMarketMid: 3839,
    foreignAtBankMid: 3938,
    diffForeign: 259,
    diffTWD: 2031,
    diffPct: 7.3,
    cashSell: 8.381,
    cashBuy: 6.856,
    marketMid: 7.813538,
    bankMid: 7.6185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20979021,
    foreignAtMarketMid: 24323830,
    foreignAtBankMid: 24489796,
    diffForeign: 3344809,
    diffTWD: 4125,
    diffPct: 15.9,
    cashSell: 0.00143,
    cashBuy: 0.00102,
    marketMid: 0.001233,
    bankMid: 0.001225,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/13 14:39:26';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-13';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-13';
