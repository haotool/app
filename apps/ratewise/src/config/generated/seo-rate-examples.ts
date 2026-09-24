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
 * 匯率時間：2026/09/24 13:15:49
 * 生成日期：2026-09-24
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
    foreignAtMarketMid: 944,
    foreignAtBankMid: 944,
    diffForeign: 10,
    diffTWD: 299,
    diffPct: 1,
    cashSell: 32.11,
    marketMid: 31.790437,
    bankMid: 31.775,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146199,
    foreignAtMarketMid: 149419,
    foreignAtBankMid: 150905,
    diffForeign: 3220,
    diffTWD: 646,
    diffPct: 2.2,
    cashSell: 0.2052,
    marketMid: 0.200778,
    bankMid: 0.1988,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 816,
    foreignAtMarketMid: 829,
    foreignAtBankMid: 831,
    diffForeign: 13,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 36.77,
    marketMid: 36.182068,
    bankMid: 36.1,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 714,
    diffForeign: 17,
    diffTWD: 695,
    diffPct: 2.4,
    cashSell: 43.09,
    marketMid: 42.091085,
    bankMid: 42.03,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6345,
    foreignAtBankMid: 6349,
    diffForeign: 103,
    diffTWD: 486,
    diffPct: 1.6,
    cashSell: 4.806,
    marketMid: 4.728132,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1179709,
    foreignAtMarketMid: 1289251,
    foreignAtBankMid: 1277683,
    diffForeign: 109542,
    diffTWD: 2549,
    diffPct: 9.3,
    cashSell: 0.02543,
    marketMid: 0.023269,
    bankMid: 0.02348,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.1,
        rateBuy: 42.3,
        rateInverse: 0.023753,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-24',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7303,
    foreignAtMarketMid: 7411,
    foreignAtBankMid: 7489,
    diffForeign: 108,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 4.108,
    marketMid: 4.048091,
    bankMid: 4.006,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1340,
    foreignAtBankMid: 1339,
    diffForeign: 24,
    diffTWD: 519,
    diffPct: 1.8,
    cashSell: 22.79,
    marketMid: 22.395413,
    bankMid: 22.4,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1332,
    foreignAtBankMid: 1331,
    diffForeign: 27,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 22.99,
    marketMid: 22.529119,
    bankMid: 22.535,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1211,
    diffForeign: 19,
    diffTWD: 486,
    diffPct: 1.6,
    cashSell: 25.22,
    marketMid: 24.811433,
    bankMid: 24.765,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 769,
    foreignAtMarketMid: 779,
    foreignAtBankMid: 781,
    diffForeign: 10,
    diffTWD: 372,
    diffPct: 1.3,
    cashSell: 39.01,
    marketMid: 38.526738,
    bankMid: 38.41,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1627,
    foreignAtMarketMid: 1662,
    foreignAtBankMid: 1665,
    diffForeign: 35,
    diffTWD: 631,
    diffPct: 2.1,
    cashSell: 18.44,
    marketMid: 18.052171,
    bankMid: 18.015,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29545,
    foreignAtMarketMid: 31533,
    foreignAtBankMid: 32595,
    diffForeign: 1988,
    diffTWD: 1891,
    diffPct: 6.7,
    cashSell: 1.0154,
    marketMid: 0.951391,
    bankMid: 0.9204,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52310,
    foreignAtMarketMid: 59204,
    foreignAtBankMid: 59113,
    diffForeign: 6894,
    diffTWD: 3493,
    diffPct: 13.2,
    cashSell: 0.5735,
    marketMid: 0.50672,
    bankMid: 0.5075,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16832410,
    foreignAtBankMid: 16853933,
    diffForeign: 2747903,
    diffTWD: 4898,
    diffPct: 19.5,
    cashSell: 0.00213,
    marketMid: 0.001782,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3611,
    foreignAtMarketMid: 3855,
    foreignAtBankMid: 3975,
    diffForeign: 244,
    diffTWD: 1905,
    diffPct: 6.8,
    cashSell: 8.309,
    marketMid: 7.781375,
    bankMid: 7.5465,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24546674,
    foreignAtBankMid: 24896266,
    diffForeign: 3270078,
    diffTWD: 3997,
    diffPct: 15.4,
    cashSell: 0.00141,
    marketMid: 0.001222,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/24 13:15:49';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-24';
