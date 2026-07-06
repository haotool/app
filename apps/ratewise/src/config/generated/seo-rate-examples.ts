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
 * 匯率時間：2026/07/04 06:16:25
 * 生成日期：2026-07-04
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
  /** 台灣銀行現金買入匯率（null 代表台銀無此報價） */
  cashBuy: number | null;
  /** 台灣銀行即期買入匯率（null 代表台銀無此報價） */
  spotBuy: number | null;
  /** 台灣銀行即期賣出匯率（null 代表台銀無此報價） */
  spotSell: number | null;
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
    foreignAtCash: 931,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 941,
    diffForeign: 7,
    diffTWD: 232,
    diffPct: 0.8,
    cashSell: 32.215,
    cashBuy: 31.545,
    spotBuy: 31.87,
    spotSell: 32.02,
    marketMid: 31.966244,
    bankMid: 31.88,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148810,
    foreignAtMarketMid: 151553,
    foreignAtBankMid: 153689,
    diffForeign: 2743,
    diffTWD: 543,
    diffPct: 1.8,
    cashSell: 0.2016,
    cashBuy: 0.1888,
    spotBuy: 0.1956,
    spotSell: 0.2006,
    marketMid: 0.197951,
    bankMid: 0.1952,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 809,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 824,
    diffForeign: 12,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 37.07,
    cashBuy: 35.73,
    spotBuy: 36.245,
    spotSell: 36.845,
    marketMid: 36.531015,
    bankMid: 36.4,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 705,
    diffForeign: 15,
    diffTWD: 647,
    diffPct: 2.2,
    cashSell: 43.59,
    cashBuy: 41.47,
    spotBuy: 42.365,
    spotSell: 42.995,
    marketMid: 42.649379,
    bankMid: 42.53,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6283,
    foreignAtMarketMid: 6387,
    foreignAtBankMid: 6391,
    diffForeign: 104,
    diffTWD: 490,
    diffPct: 1.7,
    cashSell: 4.775,
    cashBuy: 4.613,
    spotBuy: 4.68,
    spotSell: 4.74,
    marketMid: 4.697041,
    bankMid: 4.694,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1301518,
    foreignAtMarketMid: 1436915,
    foreignAtBankMid: 1421801,
    diffForeign: 135397,
    diffTWD: 2827,
    diffPct: 10.4,
    cashSell: 0.02305,
    cashBuy: 0.01915,
    spotBuy: null,
    spotSell: null,
    marketMid: 0.020878,
    bankMid: 0.0211,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.9,
        rateBuy: 46.5,
        rateInverse: 0.021786,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-07-04',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7278,
    foreignAtMarketMid: 7366,
    foreignAtBankMid: 7463,
    diffForeign: 88,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 4.122,
    cashBuy: 3.918,
    spotBuy: 4.039,
    spotSell: 4.109,
    marketMid: 4.07264,
    bankMid: 4.02,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1329,
    foreignAtMarketMid: 1353,
    foreignAtBankMid: 1353,
    diffForeign: 24,
    diffTWD: 524,
    diffPct: 1.8,
    cashSell: 22.57,
    cashBuy: 21.79,
    spotBuy: 22.005,
    spotSell: 22.35,
    marketMid: 22.175407,
    bankMid: 22.18,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1334,
    foreignAtBankMid: 1335,
    diffForeign: 25,
    diffTWD: 559,
    diffPct: 1.9,
    cashSell: 22.92,
    cashBuy: 22.01,
    spotBuy: 22.34,
    spotSell: 22.67,
    marketMid: 22.49314,
    bankMid: 22.465,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1197,
    foreignAtMarketMid: 1213,
    foreignAtBankMid: 1219,
    diffForeign: 16,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 25.07,
    cashBuy: 24.16,
    spotBuy: 24.63,
    spotSell: 24.85,
    marketMid: 24.729827,
    bankMid: 24.615,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 755,
    foreignAtBankMid: 758,
    diffForeign: 8,
    diffTWD: 302,
    diffPct: 1,
    cashSell: 40.16,
    cashBuy: 38.96,
    spotBuy: 39.57,
    spotSell: 39.96,
    marketMid: 39.755109,
    bankMid: 39.56,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1611,
    foreignAtMarketMid: 1644,
    foreignAtBankMid: 1649,
    diffForeign: 33,
    diffTWD: 596,
    diffPct: 2,
    cashSell: 18.62,
    cashBuy: 17.77,
    spotBuy: 18.1,
    spotSell: 18.4,
    marketMid: 18.24984,
    bankMid: 18.195,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29274,
    foreignAtMarketMid: 31162,
    foreignAtBankMid: 32265,
    diffForeign: 1888,
    diffTWD: 1818,
    diffPct: 6.4,
    cashSell: 1.0248,
    cashBuy: 0.8348,
    spotBuy: 0.9452,
    spotSell: 0.9912,
    marketMid: 0.962714,
    bankMid: 0.9298,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51160,
    foreignAtMarketMid: 57742,
    foreignAtBankMid: 57648,
    diffForeign: 6582,
    diffTWD: 3420,
    diffPct: 12.9,
    cashSell: 0.5864,
    cashBuy: 0.4544,
    spotBuy: null,
    spotSell: null,
    marketMid: 0.519549,
    bankMid: 0.5204,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16882837,
    foreignAtBankMid: 17341040,
    diffForeign: 2459760,
    diffTWD: 4371,
    diffPct: 17.1,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    spotBuy: null,
    spotSell: null,
    marketMid: 0.001777,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3595,
    foreignAtMarketMid: 3829,
    foreignAtBankMid: 3956,
    diffForeign: 234,
    diffTWD: 1839,
    diffPct: 6.5,
    cashSell: 8.346,
    cashBuy: 6.821,
    spotBuy: null,
    spotSell: null,
    marketMid: 7.834412,
    bankMid: 7.5835,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24526844,
    foreignAtBankMid: 25531915,
    diffForeign: 2787714,
    diffTWD: 3410,
    diffPct: 12.8,
    cashSell: 0.00138,
    cashBuy: 0.00097,
    spotBuy: null,
    spotSell: null,
    marketMid: 0.001223,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/07/04 06:16:25';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-07-04';
