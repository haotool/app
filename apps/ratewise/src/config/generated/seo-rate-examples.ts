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
 * 匯率時間：2026/10/22 13:25:59
 * 生成日期：2026-10-22
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
    foreignAtCash: 914,
    foreignAtMarketMid: 926,
    foreignAtBankMid: 923,
    diffForeign: 12,
    diffTWD: 383,
    diffPct: 1.3,
    cashSell: 32.83,
    cashBuy: 32.16,
    marketMid: 32.410708,
    bankMid: 32.495,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142857,
    foreignAtMarketMid: 146337,
    foreignAtBankMid: 147348,
    diffForeign: 3480,
    diffTWD: 713,
    diffPct: 2.4,
    cashSell: 0.21,
    cashBuy: 0.1972,
    marketMid: 0.205007,
    bankMid: 0.2036,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 808,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 823,
    diffForeign: 16,
    diffTWD: 597,
    diffPct: 2,
    cashSell: 37.14,
    cashBuy: 35.8,
    marketMid: 36.400699,
    bankMid: 36.47,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 673,
    foreignAtMarketMid: 691,
    foreignAtBankMid: 690,
    diffForeign: 18,
    diffTWD: 771,
    diffPct: 2.6,
    cashSell: 44.55,
    cashBuy: 42.43,
    marketMid: 43.404662,
    bankMid: 43.49,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6069,
    foreignAtMarketMid: 6138,
    foreignAtBankMid: 6170,
    diffForeign: 69,
    diffTWD: 336,
    diffPct: 1.1,
    cashSell: 4.943,
    cashBuy: 4.781,
    marketMid: 4.887586,
    bankMid: 4.862,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1120657,
    foreignAtMarketMid: 1227735,
    foreignAtBankMid: 1208703,
    diffForeign: 107078,
    diffTWD: 2616,
    diffPct: 9.6,
    cashSell: 0.02677,
    cashBuy: 0.02287,
    marketMid: 0.024435,
    bankMid: 0.02482,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.1,
        rateBuy: 40.8,
        rateInverse: 0.024938,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-22',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7148,
    foreignAtMarketMid: 7265,
    foreignAtBankMid: 7326,
    diffForeign: 117,
    diffTWD: 483,
    diffPct: 1.6,
    cashSell: 4.197,
    cashBuy: 3.993,
    marketMid: 4.129416,
    bankMid: 4.095,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1313,
    diffForeign: 26,
    diffTWD: 593,
    diffPct: 2,
    cashSell: 23.23,
    cashBuy: 22.45,
    marketMid: 22.770744,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1270,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1295,
    diffForeign: 31,
    diffTWD: 709,
    diffPct: 2.4,
    cashSell: 23.62,
    cashBuy: 22.71,
    marketMid: 23.061667,
    bankMid: 23.165,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1161,
    foreignAtMarketMid: 1183,
    foreignAtBankMid: 1182,
    diffForeign: 22,
    diffTWD: 535,
    diffPct: 1.8,
    cashSell: 25.83,
    cashBuy: 24.92,
    marketMid: 25.369764,
    bankMid: 25.375,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 751,
    foreignAtMarketMid: 763,
    foreignAtBankMid: 762,
    diffForeign: 12,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 39.95,
    cashBuy: 38.75,
    marketMid: 39.311267,
    bankMid: 39.35,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1587,
    foreignAtMarketMid: 1626,
    foreignAtBankMid: 1624,
    diffForeign: 39,
    diffTWD: 711,
    diffPct: 2.4,
    cashSell: 18.9,
    cashBuy: 18.05,
    marketMid: 18.452227,
    bankMid: 18.475,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29149,
    foreignAtMarketMid: 31094,
    foreignAtBankMid: 32113,
    diffForeign: 1945,
    diffTWD: 1877,
    diffPct: 6.7,
    cashSell: 1.0292,
    cashBuy: 0.8392,
    marketMid: 0.964806,
    bankMid: 0.9342,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51778,
    foreignAtMarketMid: 58703,
    foreignAtBankMid: 58434,
    diffForeign: 6925,
    diffTWD: 3539,
    diffPct: 13.4,
    cashSell: 0.5794,
    cashBuy: 0.4474,
    marketMid: 0.511044,
    bankMid: 0.5134,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16695014,
    foreignAtBankMid: 16853933,
    diffForeign: 2610507,
    diffTWD: 4691,
    diffPct: 18.5,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001797,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3539,
    foreignAtMarketMid: 3778,
    foreignAtBankMid: 3889,
    diffForeign: 239,
    diffTWD: 1891,
    diffPct: 6.7,
    cashSell: 8.476,
    cashBuy: 6.951,
    marketMid: 7.941613,
    bankMid: 7.7135,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23921820,
    foreignAtBankMid: 24096386,
    diffForeign: 3232165,
    diffTWD: 4053,
    diffPct: 15.6,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001254,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/22 13:25:59';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-22';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-22';
