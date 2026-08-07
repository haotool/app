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
 * 匯率時間：2026/08/07 08:33:44
 * 生成日期：2026-08-07
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
    foreignAtCash: 923,
    foreignAtMarketMid: 931,
    foreignAtBankMid: 932,
    diffForeign: 8,
    diffTWD: 273,
    diffPct: 0.9,
    cashSell: 32.515,
    marketMid: 32.219609,
    bankMid: 32.18,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144788,
    foreignAtMarketMid: 146898,
    foreignAtBankMid: 149402,
    diffForeign: 2110,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 0.2072,
    marketMid: 0.204223,
    bankMid: 0.2008,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 810,
    diffForeign: 10,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 37.69,
    marketMid: 37.221767,
    bankMid: 37.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 691,
    foreignAtBankMid: 693,
    diffForeign: 14,
    diffTWD: 594,
    diffPct: 2,
    cashSell: 44.32,
    marketMid: 43.442374,
    bankMid: 43.26,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6195,
    foreignAtMarketMid: 6285,
    foreignAtBankMid: 6300,
    diffForeign: 90,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 4.843,
    marketMid: 4.77327,
    bankMid: 4.762,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1208703,
    foreignAtMarketMid: 1325037,
    foreignAtBankMid: 1311762,
    diffForeign: 116334,
    diffTWD: 2634,
    diffPct: 9.6,
    cashSell: 0.02482,
    marketMid: 0.022641,
    bankMid: 0.02287,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.7,
        rateBuy: 43,
        rateInverse: 0.023419,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-07',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7213,
    foreignAtMarketMid: 7294,
    foreignAtBankMid: 7395,
    diffForeign: 81,
    diffTWD: 333,
    diffPct: 1.1,
    cashSell: 4.159,
    marketMid: 4.112772,
    bankMid: 4.057,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1324,
    foreignAtBankMid: 1323,
    diffForeign: 24,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 23.07,
    marketMid: 22.656215,
    bankMid: 22.68,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1280,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1305,
    diffForeign: 24,
    diffTWD: 564,
    diffPct: 1.9,
    cashSell: 23.44,
    marketMid: 22.99908,
    bankMid: 22.985,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1178,
    foreignAtMarketMid: 1193,
    foreignAtBankMid: 1200,
    diffForeign: 15,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 25.46,
    marketMid: 25.155334,
    bankMid: 25.005,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 749,
    foreignAtMarketMid: 753,
    foreignAtBankMid: 760,
    diffForeign: 4,
    diffTWD: 185,
    diffPct: 0.6,
    cashSell: 40.08,
    marketMid: 39.832703,
    bankMid: 39.48,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1555,
    foreignAtMarketMid: 1586,
    foreignAtBankMid: 1590,
    diffForeign: 31,
    diffTWD: 591,
    diffPct: 2,
    cashSell: 19.29,
    marketMid: 18.909669,
    bankMid: 18.865,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28983,
    foreignAtMarketMid: 30767,
    foreignAtBankMid: 31911,
    diffForeign: 1784,
    diffTWD: 1740,
    diffPct: 6.2,
    cashSell: 1.0351,
    marketMid: 0.975072,
    bankMid: 0.9401,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50293,
    foreignAtMarketMid: 56662,
    foreignAtBankMid: 56550,
    diffForeign: 6369,
    diffTWD: 3372,
    diffPct: 12.7,
    cashSell: 0.5965,
    marketMid: 0.529453,
    bankMid: 0.5305,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16718355,
    foreignAtBankMid: 17341040,
    diffForeign: 2295278,
    diffTWD: 4119,
    diffPct: 15.9,
    cashSell: 0.00208,
    marketMid: 0.001794,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3580,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3938,
    diffForeign: 226,
    diffTWD: 1782,
    diffPct: 6.3,
    cashSell: 8.38,
    marketMid: 7.882333,
    bankMid: 7.6175,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24395413,
    foreignAtBankMid: 25316456,
    diffForeign: 2812679,
    diffTWD: 3459,
    diffPct: 13,
    cashSell: 0.00139,
    marketMid: 0.00123,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/07 08:33:44';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-07';
