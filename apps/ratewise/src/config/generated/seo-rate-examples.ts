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
 * 匯率時間：2026/06/27 05:44:41
 * 生成日期：2026-06-27
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
    foreignAtMarketMid: 941,
    foreignAtBankMid: 944,
    diffForeign: 7,
    diffTWD: 239,
    diffPct: 0.8,
    cashSell: 32.13,
    marketMid: 31.873526,
    bankMid: 31.795,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149551,
    foreignAtMarketMid: 152271,
    foreignAtBankMid: 154480,
    diffForeign: 2720,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 0.2006,
    marketMid: 0.197017,
    bankMid: 0.1942,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 815,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 830,
    diffForeign: 12,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 36.8,
    marketMid: 36.283154,
    bankMid: 36.13,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 698,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 715,
    diffForeign: 15,
    diffTWD: 651,
    diffPct: 2.2,
    cashSell: 43,
    marketMid: 42.066296,
    bankMid: 41.94,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6318,
    foreignAtMarketMid: 6399,
    foreignAtBankMid: 6428,
    diffForeign: 81,
    diffTWD: 378,
    diffPct: 1.3,
    cashSell: 4.748,
    marketMid: 4.688233,
    bankMid: 4.667,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1308901,
    foreignAtMarketMid: 1444724,
    foreignAtBankMid: 1430615,
    diffForeign: 135823,
    diffTWD: 2820,
    diffPct: 10.4,
    cashSell: 0.02292,
    marketMid: 0.020765,
    bankMid: 0.02097,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.85,
        rateBuy: 47,
        rateInverse: 0.021345,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-27',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7382,
    foreignAtBankMid: 7483,
    diffForeign: 85,
    diffTWD: 345,
    diffPct: 1.2,
    cashSell: 4.111,
    marketMid: 4.063703,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1340,
    foreignAtMarketMid: 1364,
    foreignAtBankMid: 1364,
    diffForeign: 24,
    diffTWD: 525,
    diffPct: 1.8,
    cashSell: 22.38,
    marketMid: 21.988654,
    bankMid: 21.99,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1312,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1338,
    diffForeign: 24,
    diffTWD: 551,
    diffPct: 1.9,
    cashSell: 22.87,
    marketMid: 22.450217,
    bankMid: 22.415,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1202,
    foreignAtMarketMid: 1219,
    foreignAtBankMid: 1224,
    diffForeign: 17,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 24.96,
    marketMid: 24.620233,
    bankMid: 24.505,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 762,
    foreignAtBankMid: 766,
    diffForeign: 7,
    diffTWD: 287,
    diffPct: 1,
    cashSell: 39.74,
    marketMid: 39.359232,
    bankMid: 39.14,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1636,
    foreignAtMarketMid: 1668,
    foreignAtBankMid: 1675,
    diffForeign: 32,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 18.34,
    marketMid: 17.981084,
    bankMid: 17.915,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29510,
    foreignAtMarketMid: 31421,
    foreignAtBankMid: 32552,
    diffForeign: 1911,
    diffTWD: 1825,
    diffPct: 6.5,
    cashSell: 1.0166,
    marketMid: 0.954771,
    bankMid: 0.9216,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51186,
    foreignAtMarketMid: 57681,
    foreignAtBankMid: 57681,
    diffForeign: 6495,
    diffTWD: 3378,
    diffPct: 12.7,
    cashSell: 0.5861,
    marketMid: 0.520105,
    bankMid: 0.5201,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16859750,
    foreignAtBankMid: 17341040,
    diffForeign: 2436673,
    diffTWD: 4336,
    diffPct: 16.9,
    cashSell: 0.00208,
    marketMid: 0.001779,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3617,
    foreignAtMarketMid: 3858,
    foreignAtBankMid: 3983,
    diffForeign: 241,
    diffTWD: 1872,
    diffPct: 6.7,
    cashSell: 8.294,
    marketMid: 7.776473,
    bankMid: 7.5315,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24606746,
    foreignAtBankMid: 25531915,
    diffForeign: 2867616,
    diffTWD: 3496,
    diffPct: 13.2,
    cashSell: 0.00138,
    marketMid: 0.001219,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/27 05:44:41';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-27';
