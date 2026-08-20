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
 * 匯率時間：2026/08/20 07:52:19
 * 生成日期：2026-08-20
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
    foreignAtCash: 931,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 941,
    diffForeign: 12,
    diffTWD: 374,
    diffPct: 1.3,
    cashSell: 32.21,
    marketMid: 31.808639,
    bankMid: 31.875,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145985,
    foreignAtMarketMid: 149242,
    foreignAtBankMid: 150678,
    diffForeign: 3257,
    diffTWD: 655,
    diffPct: 2.2,
    cashSell: 0.2055,
    marketMid: 0.201015,
    bankMid: 0.1991,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 793,
    foreignAtMarketMid: 808,
    foreignAtBankMid: 808,
    diffForeign: 15,
    diffTWD: 544,
    diffPct: 1.8,
    cashSell: 37.82,
    marketMid: 37.134688,
    bankMid: 37.15,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 693,
    foreignAtBankMid: 693,
    diffForeign: 17,
    diffTWD: 727,
    diffPct: 2.5,
    cashSell: 44.38,
    marketMid: 43.305041,
    bankMid: 43.32,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6234,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6341,
    diffForeign: 96,
    diffTWD: 453,
    diffPct: 1.5,
    cashSell: 4.812,
    marketMid: 4.739336,
    bankMid: 4.731,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1192843,
    foreignAtMarketMid: 1309529,
    foreignAtBankMid: 1293103,
    diffForeign: 116686,
    diffTWD: 2673,
    diffPct: 9.8,
    cashSell: 0.02515,
    marketMid: 0.022909,
    bankMid: 0.0232,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-20',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7278,
    foreignAtMarketMid: 7376,
    foreignAtBankMid: 7463,
    diffForeign: 98,
    diffTWD: 397,
    diffPct: 1.3,
    cashSell: 4.122,
    marketMid: 4.067405,
    bankMid: 4.02,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1318,
    diffForeign: 30,
    diffTWD: 676,
    diffPct: 2.3,
    cashSell: 23.15,
    marketMid: 22.62853,
    bankMid: 22.76,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1273,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1298,
    diffForeign: 29,
    diffTWD: 656,
    diffPct: 2.2,
    cashSell: 23.56,
    marketMid: 23.044661,
    bankMid: 23.105,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1179,
    foreignAtMarketMid: 1198,
    foreignAtBankMid: 1200,
    diffForeign: 19,
    diffTWD: 484,
    diffPct: 1.6,
    cashSell: 25.45,
    marketMid: 25.039437,
    bankMid: 24.995,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 742,
    foreignAtMarketMid: 755,
    foreignAtBankMid: 753,
    diffForeign: 13,
    diffTWD: 521,
    diffPct: 1.8,
    cashSell: 40.45,
    marketMid: 39.747208,
    bankMid: 39.85,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1550,
    foreignAtMarketMid: 1596,
    foreignAtBankMid: 1585,
    diffForeign: 46,
    diffTWD: 860,
    diffPct: 3,
    cashSell: 19.35,
    marketMid: 18.795226,
    bankMid: 18.925,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29047,
    foreignAtMarketMid: 30997,
    foreignAtBankMid: 31990,
    diffForeign: 1950,
    diffTWD: 1887,
    diffPct: 6.7,
    cashSell: 1.0328,
    marketMid: 0.967827,
    bankMid: 0.9378,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51467,
    foreignAtMarketMid: 58335,
    foreignAtBankMid: 58038,
    diffForeign: 6868,
    diffTWD: 3532,
    diffPct: 13.3,
    cashSell: 0.5829,
    marketMid: 0.514273,
    bankMid: 0.5169,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16808298,
    foreignAtBankMid: 17341040,
    diffForeign: 2385221,
    diffTWD: 4257,
    diffPct: 16.5,
    cashSell: 0.00208,
    marketMid: 0.001785,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3584,
    foreignAtMarketMid: 3818,
    foreignAtBankMid: 3943,
    diffForeign: 234,
    diffTWD: 1840,
    diffPct: 6.5,
    cashSell: 8.371,
    marketMid: 7.857558,
    bankMid: 7.6085,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24577923,
    foreignAtBankMid: 25531915,
    diffForeign: 2838793,
    diffTWD: 3465,
    diffPct: 13.1,
    cashSell: 0.00138,
    marketMid: 0.001221,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/20 07:52:19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-20';
