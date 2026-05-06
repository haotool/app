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
 * 匯率時間：2026/05/06 19:57:47
 * 生成日期：2026-05-06
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
    foreignAtCash: 945,
    foreignAtMarketMid: 949,
    foreignAtBankMid: 955,
    diffForeign: 4,
    diffTWD: 124,
    diffPct: 0.4,
    cashSell: 31.75,
    marketMid: 31.618554,
    bankMid: 31.415,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145985,
    foreignAtMarketMid: 149813,
    foreignAtBankMid: 150678,
    diffForeign: 3828,
    diffTWD: 766,
    diffPct: 2.6,
    cashSell: 0.2055,
    marketMid: 0.20025,
    bankMid: 0.1991,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 811,
    diffForeign: 15,
    diffTWD: 546,
    diffPct: 1.9,
    cashSell: 37.65,
    marketMid: 36.964477,
    bankMid: 36.98,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 684,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 701,
    diffForeign: 17,
    diffTWD: 709,
    diffPct: 2.4,
    cashSell: 43.85,
    marketMid: 42.813718,
    bankMid: 42.79,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6395,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6508,
    diffForeign: 100,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 4.691,
    marketMid: 4.618938,
    bankMid: 4.61,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1251564,
    foreignAtMarketMid: 1393670,
    foreignAtBankMid: 1362398,
    diffForeign: 142106,
    diffTWD: 3059,
    diffPct: 11.4,
    cashSell: 0.02397,
    marketMid: 0.021526,
    bankMid: 0.02202,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.8,
        rateBuy: 45.3,
        rateInverse: 0.022321,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-06',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7378,
    foreignAtMarketMid: 7440,
    foreignAtBankMid: 7568,
    diffForeign: 62,
    diffTWD: 250,
    diffPct: 0.8,
    cashSell: 4.066,
    marketMid: 4.032161,
    bankMid: 3.964,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1289,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1311,
    diffForeign: 30,
    diffTWD: 698,
    diffPct: 2.4,
    cashSell: 23.28,
    marketMid: 22.738125,
    bankMid: 22.89,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1293,
    foreignAtBankMid: 1297,
    diffForeign: 21,
    diffTWD: 492,
    diffPct: 1.7,
    cashSell: 23.59,
    marketMid: 23.203471,
    bankMid: 23.135,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1211,
    foreignAtBankMid: 1213,
    diffForeign: 20,
    diffTWD: 509,
    diffPct: 1.7,
    cashSell: 25.19,
    marketMid: 24.762895,
    bankMid: 24.735,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 734,
    foreignAtMarketMid: 743,
    foreignAtBankMid: 745,
    diffForeign: 9,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 40.88,
    marketMid: 40.356754,
    bankMid: 40.28,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1563,
    foreignAtMarketMid: 1610,
    foreignAtBankMid: 1598,
    diffForeign: 47,
    diffTWD: 883,
    diffPct: 3,
    cashSell: 19.2,
    marketMid: 18.634814,
    bankMid: 18.775,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28794,
    foreignAtMarketMid: 30908,
    foreignAtBankMid: 31682,
    diffForeign: 2114,
    diffTWD: 2052,
    diffPct: 7.3,
    cashSell: 1.0419,
    marketMid: 0.97063,
    bankMid: 0.9469,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51238,
    foreignAtMarketMid: 58390,
    foreignAtBankMid: 57748,
    diffForeign: 7152,
    diffTWD: 3674,
    diffPct: 14,
    cashSell: 0.5855,
    marketMid: 0.513789,
    bankMid: 0.5195,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16528196,
    foreignAtBankMid: 16393443,
    diffForeign: 2766728,
    diffTWD: 5022,
    diffPct: 20.1,
    cashSell: 0.00218,
    marketMid: 0.001815,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3521,
    foreignAtMarketMid: 3766,
    foreignAtBankMid: 3867,
    diffForeign: 245,
    diffTWD: 1953,
    diffPct: 7,
    cashSell: 8.52,
    marketMid: 7.965271,
    bankMid: 7.7575,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24893173,
    foreignAtBankMid: 25974026,
    diffForeign: 2834349,
    diffTWD: 3416,
    diffPct: 12.8,
    cashSell: 0.00136,
    marketMid: 0.001205,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/06 19:57:47';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-06';
