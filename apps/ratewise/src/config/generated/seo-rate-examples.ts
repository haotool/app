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
 * 匯率時間：2026/11/15 06:45:48
 * 生成日期：2026-11-15
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
    foreignAtCash: 906,
    foreignAtMarketMid: 911,
    foreignAtBankMid: 915,
    diffForeign: 5,
    diffTWD: 159,
    diffPct: 0.5,
    cashSell: 33.105,
    cashBuy: 32.435,
    marketMid: 32.929399,
    bankMid: 32.77,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143335,
    foreignAtMarketMid: 145612,
    foreignAtBankMid: 147856,
    diffForeign: 2277,
    diffTWD: 469,
    diffPct: 1.6,
    cashSell: 0.2093,
    cashBuy: 0.1965,
    marketMid: 0.206027,
    bankMid: 0.2029,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 817,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 832,
    diffForeign: 7,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 36.73,
    cashBuy: 35.39,
    marketMid: 36.391426,
    bankMid: 36.06,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 693,
    diffForeign: 12,
    diffTWD: 542,
    diffPct: 1.8,
    cashSell: 44.33,
    cashBuy: 42.21,
    marketMid: 43.529361,
    bankMid: 43.27,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6017,
    foreignAtMarketMid: 6084,
    foreignAtBankMid: 6116,
    diffForeign: 67,
    diffTWD: 331,
    diffPct: 1.1,
    cashSell: 4.986,
    cashBuy: 4.824,
    marketMid: 4.930966,
    bankMid: 4.905,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1121495,
    foreignAtMarketMid: 1218261,
    foreignAtBankMid: 1209677,
    diffForeign: 96766,
    diffTWD: 2383,
    diffPct: 8.6,
    cashSell: 0.02675,
    cashBuy: 0.02285,
    marketMid: 0.024625,
    bankMid: 0.0248,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.5,
        rateBuy: 41.6,
        rateInverse: 0.024096,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7085,
    foreignAtMarketMid: 7149,
    foreignAtBankMid: 7260,
    diffForeign: 64,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 4.234,
    cashBuy: 4.03,
    marketMid: 4.196127,
    bankMid: 4.132,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1326,
    foreignAtMarketMid: 1344,
    foreignAtBankMid: 1349,
    diffForeign: 18,
    diffTWD: 398,
    diffPct: 1.3,
    cashSell: 22.63,
    cashBuy: 21.85,
    marketMid: 22.329403,
    bankMid: 22.24,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1280,
    foreignAtMarketMid: 1299,
    foreignAtBankMid: 1306,
    diffForeign: 19,
    diffTWD: 429,
    diffPct: 1.5,
    cashSell: 23.43,
    cashBuy: 22.52,
    marketMid: 23.094688,
    bankMid: 22.975,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1161,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1182,
    diffForeign: 13,
    diffTWD: 314,
    diffPct: 1.1,
    cashSell: 25.83,
    cashBuy: 24.92,
    marketMid: 25.559759,
    bankMid: 25.375,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 764,
    foreignAtBankMid: 771,
    diffForeign: 5,
    diffTWD: 185,
    diffPct: 0.6,
    cashSell: 39.53,
    cashBuy: 38.33,
    marketMid: 39.286556,
    bankMid: 38.93,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1621,
    foreignAtMarketMid: 1648,
    foreignAtBankMid: 1659,
    diffForeign: 27,
    diffTWD: 490,
    diffPct: 1.7,
    cashSell: 18.51,
    cashBuy: 17.66,
    marketMid: 18.20764,
    bankMid: 18.085,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29106,
    foreignAtMarketMid: 30885,
    foreignAtBankMid: 32062,
    diffForeign: 1779,
    diffTWD: 1727,
    diffPct: 6.1,
    cashSell: 1.0307,
    cashBuy: 0.8407,
    marketMid: 0.971354,
    bankMid: 0.9357,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51653,
    foreignAtMarketMid: 58171,
    foreignAtBankMid: 58275,
    diffForeign: 6518,
    diffTWD: 3361,
    diffPct: 12.6,
    cashSell: 0.5808,
    cashBuy: 0.4488,
    marketMid: 0.515725,
    bankMid: 0.5148,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16614790,
    foreignAtBankMid: 16393443,
    diffForeign: 2853322,
    diffTWD: 5152,
    diffPct: 20.7,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001806,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3516,
    foreignAtMarketMid: 3728,
    foreignAtBankMid: 3861,
    diffForeign: 212,
    diffTWD: 1707,
    diffPct: 6,
    cashSell: 8.533,
    cashBuy: 7.008,
    marketMid: 8.047577,
    bankMid: 7.7705,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23451900,
    foreignAtBankMid: 24291498,
    diffForeign: 2618567,
    diffTWD: 3350,
    diffPct: 12.6,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001279,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/15 06:45:48';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-15';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-15';
