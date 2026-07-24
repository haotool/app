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
 * 匯率時間：2026/07/24 08:11:47
 * 生成日期：2026-07-24
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
    foreignAtCash: 922,
    foreignAtMarketMid: 927,
    foreignAtBankMid: 931,
    diffForeign: 5,
    diffTWD: 174,
    diffPct: 0.6,
    cashSell: 32.545,
    marketMid: 32.356177,
    bankMid: 32.21,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149551,
    foreignAtMarketMid: 151917,
    foreignAtBankMid: 154480,
    diffForeign: 2366,
    diffTWD: 467,
    diffPct: 1.6,
    cashSell: 0.2006,
    marketMid: 0.197476,
    bankMid: 0.1942,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 805,
    foreignAtMarketMid: 815,
    foreignAtBankMid: 820,
    diffForeign: 10,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 37.25,
    marketMid: 36.797174,
    bankMid: 36.58,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 683,
    foreignAtMarketMid: 696,
    foreignAtBankMid: 700,
    diffForeign: 13,
    diffTWD: 569,
    diffPct: 1.9,
    cashSell: 43.92,
    marketMid: 43.086734,
    bankMid: 42.86,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6212,
    foreignAtMarketMid: 6282,
    foreignAtBankMid: 6318,
    diffForeign: 70,
    diffTWD: 332,
    diffPct: 1.1,
    cashSell: 4.829,
    marketMid: 4.775549,
    bankMid: 4.748,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1247401,
    foreignAtMarketMid: 1367341,
    foreignAtBankMid: 1357466,
    diffForeign: 119940,
    diffTWD: 2632,
    diffPct: 9.6,
    cashSell: 0.02405,
    marketMid: 0.02194,
    bankMid: 0.0221,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43.6,
        rateBuy: 44.1,
        rateInverse: 0.022936,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-07-24',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7203,
    foreignAtMarketMid: 7276,
    foreignAtBankMid: 7384,
    diffForeign: 73,
    diffTWD: 302,
    diffPct: 1,
    cashSell: 4.165,
    marketMid: 4.123065,
    bankMid: 4.063,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1330,
    foreignAtBankMid: 1333,
    diffForeign: 19,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 22.89,
    marketMid: 22.560123,
    bankMid: 22.5,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1285,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1311,
    diffForeign: 22,
    diffTWD: 490,
    diffPct: 1.7,
    cashSell: 23.34,
    marketMid: 22.958949,
    bankMid: 22.885,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1199,
    foreignAtBankMid: 1207,
    diffForeign: 14,
    diffTWD: 350,
    diffPct: 1.2,
    cashSell: 25.31,
    marketMid: 25.015009,
    bankMid: 24.855,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 758,
    foreignAtBankMid: 763,
    diffForeign: 6,
    diffTWD: 228,
    diffPct: 0.8,
    cashSell: 39.9,
    marketMid: 39.59612,
    bankMid: 39.3,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1578,
    foreignAtMarketMid: 1606,
    foreignAtBankMid: 1614,
    diffForeign: 28,
    diffTWD: 512,
    diffPct: 1.7,
    cashSell: 19.01,
    marketMid: 18.685302,
    bankMid: 18.585,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29545,
    foreignAtMarketMid: 31397,
    foreignAtBankMid: 32595,
    diffForeign: 1852,
    diffTWD: 1770,
    diffPct: 6.3,
    cashSell: 1.0154,
    marketMid: 0.955506,
    bankMid: 0.9204,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50942,
    foreignAtMarketMid: 57390,
    foreignAtBankMid: 57372,
    diffForeign: 6448,
    diffTWD: 3370,
    diffPct: 12.7,
    cashSell: 0.5889,
    marketMid: 0.522741,
    bankMid: 0.5229,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16647579,
    foreignAtBankMid: 16393443,
    diffForeign: 2886111,
    diffTWD: 5201,
    diffPct: 21,
    cashSell: 0.00218,
    marketMid: 0.001802,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3574,
    foreignAtMarketMid: 3796,
    foreignAtBankMid: 3932,
    diffForeign: 222,
    diffTWD: 1753,
    diffPct: 6.2,
    cashSell: 8.393,
    marketMid: 7.902639,
    bankMid: 7.6305,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24246262,
    foreignAtBankMid: 25316456,
    diffForeign: 2663528,
    diffTWD: 3296,
    diffPct: 12.3,
    cashSell: 0.00139,
    marketMid: 0.001237,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/07/24 08:11:47';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-07-24';
