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
 * 匯率時間：2026/08/31 05:37:19
 * 生成日期：2026-08-31
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
    foreignAtCash: 941,
    foreignAtMarketMid: 948,
    foreignAtBankMid: 951,
    diffForeign: 7,
    diffTWD: 217,
    diffPct: 0.7,
    cashSell: 31.88,
    marketMid: 31.649576,
    bankMid: 31.545,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149180,
    foreignAtMarketMid: 151748,
    foreignAtBankMid: 154083,
    diffForeign: 2568,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 0.2011,
    marketMid: 0.197696,
    bankMid: 0.1947,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 808,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 823,
    diffForeign: 10,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 37.14,
    marketMid: 36.697248,
    bankMid: 36.47,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 703,
    diffForeign: 14,
    diffTWD: 581,
    diffPct: 2,
    cashSell: 43.71,
    marketMid: 42.863266,
    bankMid: 42.65,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6299,
    foreignAtMarketMid: 6372,
    foreignAtBankMid: 6408,
    diffForeign: 73,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 4.763,
    marketMid: 4.708098,
    bankMid: 4.682,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1194268,
    foreignAtMarketMid: 1305293,
    foreignAtBankMid: 1294778,
    diffForeign: 111025,
    diffTWD: 2552,
    diffPct: 9.3,
    cashSell: 0.02512,
    marketMid: 0.022983,
    bankMid: 0.02317,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.2,
        rateBuy: 42.3,
        rateInverse: 0.023697,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-31',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7353,
    foreignAtMarketMid: 7434,
    foreignAtBankMid: 7541,
    diffForeign: 81,
    diffTWD: 327,
    diffPct: 1.1,
    cashSell: 4.08,
    marketMid: 4.03548,
    bankMid: 3.978,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1304,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1326,
    diffForeign: 19,
    diffTWD: 435,
    diffPct: 1.5,
    cashSell: 23.01,
    marketMid: 22.676251,
    bankMid: 22.62,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1322,
    diffForeign: 21,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 23.15,
    marketMid: 22.77593,
    bankMid: 22.695,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1193,
    foreignAtMarketMid: 1208,
    foreignAtBankMid: 1215,
    diffForeign: 15,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 25.14,
    marketMid: 24.832998,
    bankMid: 24.685,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 766,
    foreignAtBankMid: 772,
    diffForeign: 6,
    diffTWD: 236,
    diffPct: 0.8,
    cashSell: 39.47,
    marketMid: 39.158868,
    bankMid: 38.87,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1573,
    foreignAtMarketMid: 1601,
    foreignAtBankMid: 1609,
    diffForeign: 28,
    diffTWD: 528,
    diffPct: 1.8,
    cashSell: 19.07,
    marketMid: 18.734661,
    bankMid: 18.645,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29557,
    foreignAtMarketMid: 31407,
    foreignAtBankMid: 32609,
    diffForeign: 1850,
    diffTWD: 1768,
    diffPct: 6.3,
    cashSell: 1.015,
    marketMid: 0.955186,
    bankMid: 0.92,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52274,
    foreignAtMarketMid: 59089,
    foreignAtBankMid: 59067,
    diffForeign: 6815,
    diffTWD: 3460,
    diffPct: 13,
    cashSell: 0.5739,
    marketMid: 0.507712,
    bankMid: 0.5079,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16786179,
    foreignAtBankMid: 17341040,
    diffForeign: 2363102,
    diffTWD: 4223,
    diffPct: 16.4,
    cashSell: 0.00208,
    marketMid: 0.001787,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3592,
    foreignAtMarketMid: 3818,
    foreignAtBankMid: 3953,
    diffForeign: 226,
    diffTWD: 1772,
    diffPct: 6.3,
    cashSell: 8.351,
    marketMid: 7.857805,
    bankMid: 7.5885,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24677645,
    foreignAtBankMid: 25531915,
    diffForeign: 2938515,
    diffTWD: 3572,
    diffPct: 13.5,
    cashSell: 0.00138,
    marketMid: 0.001216,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/31 05:37:19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-31';
