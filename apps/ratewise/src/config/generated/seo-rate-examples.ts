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
 * 匯率時間：2026/11/10 11:46:48
 * 生成日期：2026-11-10
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
    foreignAtCash: 903,
    foreignAtMarketMid: 915,
    foreignAtBankMid: 912,
    diffForeign: 12,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 33.215,
    cashBuy: 32.545,
    marketMid: 32.780437,
    bankMid: 32.88,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 141443,
    foreignAtMarketMid: 144471,
    foreignAtBankMid: 145843,
    diffForeign: 3028,
    diffTWD: 629,
    diffPct: 2.1,
    cashSell: 0.2121,
    cashBuy: 0.1993,
    marketMid: 0.207654,
    bankMid: 0.2057,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 800,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 815,
    diffForeign: 16,
    diffTWD: 580,
    diffPct: 2,
    cashSell: 37.49,
    cashBuy: 36.15,
    marketMid: 36.764706,
    bankMid: 36.82,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 663,
    foreignAtMarketMid: 681,
    foreignAtBankMid: 679,
    diffForeign: 18,
    diffTWD: 781,
    diffPct: 2.7,
    cashSell: 45.22,
    cashBuy: 43.1,
    marketMid: 44.043162,
    bankMid: 44.16,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5994,
    foreignAtMarketMid: 6105,
    foreignAtBankMid: 6093,
    diffForeign: 111,
    diffTWD: 545,
    diffPct: 1.9,
    cashSell: 5.005,
    cashBuy: 4.843,
    marketMid: 4.914005,
    bankMid: 4.924,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1125281,
    foreignAtMarketMid: 1229681,
    foreignAtBankMid: 1214083,
    diffForeign: 104400,
    diffTWD: 2547,
    diffPct: 9.3,
    cashSell: 0.02666,
    cashBuy: 0.02276,
    marketMid: 0.024397,
    bankMid: 0.02471,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.1,
        rateBuy: 41.5,
        rateInverse: 0.024331,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7062,
    foreignAtMarketMid: 7171,
    foreignAtBankMid: 7236,
    diffForeign: 109,
    diffTWD: 455,
    diffPct: 1.5,
    cashSell: 4.248,
    cashBuy: 4.044,
    marketMid: 4.183558,
    bankMid: 4.146,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1324,
    foreignAtBankMid: 1316,
    diffForeign: 30,
    diffTWD: 666,
    diffPct: 2.3,
    cashSell: 23.18,
    cashBuy: 22.4,
    marketMid: 22.665458,
    bankMid: 22.79,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1263,
    foreignAtMarketMid: 1291,
    foreignAtBankMid: 1288,
    diffForeign: 28,
    diffTWD: 647,
    diffPct: 2.2,
    cashSell: 23.75,
    cashBuy: 22.84,
    marketMid: 23.23744,
    bankMid: 23.295,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1149,
    foreignAtMarketMid: 1170,
    foreignAtBankMid: 1169,
    diffForeign: 21,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 26.11,
    cashBuy: 25.2,
    marketMid: 25.639711,
    bankMid: 25.655,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 750,
    diffForeign: 11,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 40.6,
    cashBuy: 39.4,
    marketMid: 40.006401,
    bankMid: 40,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1585,
    foreignAtMarketMid: 1627,
    foreignAtBankMid: 1621,
    diffForeign: 42,
    diffTWD: 776,
    diffPct: 2.7,
    cashSell: 18.93,
    cashBuy: 18.08,
    marketMid: 18.440658,
    bankMid: 18.505,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28662,
    foreignAtMarketMid: 30589,
    foreignAtBankMid: 31523,
    diffForeign: 1927,
    diffTWD: 1891,
    diffPct: 6.7,
    cashSell: 1.0467,
    cashBuy: 0.8567,
    marketMid: 0.98074,
    bankMid: 0.9517,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51003,
    foreignAtMarketMid: 57802,
    foreignAtBankMid: 57449,
    diffForeign: 6799,
    diffTWD: 3529,
    diffPct: 13.3,
    cashSell: 0.5882,
    cashBuy: 0.4562,
    marketMid: 0.519013,
    bankMid: 0.5222,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16554522,
    foreignAtBankMid: 16393443,
    diffForeign: 2793054,
    diffTWD: 5062,
    diffPct: 20.3,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001812,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3478,
    foreignAtMarketMid: 3712,
    foreignAtBankMid: 3816,
    diffForeign: 234,
    diffTWD: 1889,
    diffPct: 6.7,
    cashSell: 8.625,
    cashBuy: 7.1,
    marketMid: 8.082049,
    bankMid: 7.8625,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20408163,
    foreignAtMarketMid: 23344041,
    foreignAtBankMid: 23715415,
    diffForeign: 2935878,
    diffTWD: 3773,
    diffPct: 14.4,
    cashSell: 0.00147,
    cashBuy: 0.00106,
    marketMid: 0.001285,
    bankMid: 0.001265,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/10 11:46:48';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-10';
