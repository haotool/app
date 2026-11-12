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
 * 匯率時間：2026/11/12 05:26:05
 * 生成日期：2026-11-12
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
    foreignAtMarketMid: 912,
    foreignAtBankMid: 915,
    diffForeign: 6,
    diffTWD: 227,
    diffPct: 0.8,
    cashSell: 33.13,
    cashBuy: 32.46,
    marketMid: 32.879595,
    bankMid: 32.795,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143403,
    foreignAtMarketMid: 145412,
    foreignAtBankMid: 147929,
    diffForeign: 2009,
    diffTWD: 414,
    diffPct: 1.4,
    cashSell: 0.2092,
    cashBuy: 0.1964,
    marketMid: 0.20631,
    bankMid: 0.2028,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 811,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 826,
    diffForeign: 10,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 36.99,
    cashBuy: 35.65,
    marketMid: 36.563071,
    bankMid: 36.32,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 673,
    foreignAtMarketMid: 686,
    foreignAtBankMid: 689,
    diffForeign: 13,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 44.57,
    cashBuy: 42.45,
    marketMid: 43.734966,
    bankMid: 43.51,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6011,
    foreignAtMarketMid: 6084,
    foreignAtBankMid: 6110,
    diffForeign: 73,
    diffTWD: 361,
    diffPct: 1.2,
    cashSell: 4.991,
    cashBuy: 4.829,
    marketMid: 4.930966,
    bankMid: 4.91,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1121915,
    foreignAtMarketMid: 1220624,
    foreignAtBankMid: 1210165,
    diffForeign: 98709,
    diffTWD: 2426,
    diffPct: 8.8,
    cashSell: 0.02674,
    cashBuy: 0.02284,
    marketMid: 0.024578,
    bankMid: 0.02479,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.3,
        rateBuy: 42,
        rateInverse: 0.024213,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-12',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7080,
    foreignAtMarketMid: 7156,
    foreignAtBankMid: 7255,
    diffForeign: 76,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 4.237,
    cashBuy: 4.033,
    marketMid: 4.19231,
    bankMid: 4.135,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1332,
    foreignAtBankMid: 1332,
    diffForeign: 23,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 22.91,
    cashBuy: 22.13,
    marketMid: 22.529119,
    bankMid: 22.52,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1298,
    foreignAtBankMid: 1302,
    diffForeign: 21,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 23.49,
    cashBuy: 22.58,
    marketMid: 23.10536,
    bankMid: 23.035,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1158,
    foreignAtMarketMid: 1171,
    foreignAtBankMid: 1179,
    diffForeign: 13,
    diffTWD: 330,
    diffPct: 1.1,
    cashSell: 25.91,
    cashBuy: 25,
    marketMid: 25.625256,
    bankMid: 25.455,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 753,
    foreignAtMarketMid: 757,
    foreignAtBankMid: 765,
    diffForeign: 4,
    diffTWD: 177,
    diffPct: 0.6,
    cashSell: 39.84,
    cashBuy: 38.64,
    marketMid: 39.605529,
    bankMid: 39.24,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1607,
    foreignAtMarketMid: 1638,
    foreignAtBankMid: 1644,
    diffForeign: 31,
    diffTWD: 570,
    diffPct: 1.9,
    cashSell: 18.67,
    cashBuy: 17.82,
    marketMid: 18.315018,
    bankMid: 18.245,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28997,
    foreignAtMarketMid: 30757,
    foreignAtBankMid: 31928,
    diffForeign: 1760,
    diffTWD: 1717,
    diffPct: 6.1,
    cashSell: 1.0346,
    cashBuy: 0.8446,
    marketMid: 0.975392,
    bankMid: 0.9396,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51265,
    foreignAtMarketMid: 57808,
    foreignAtBankMid: 57781,
    diffForeign: 6543,
    diffTWD: 3396,
    diffPct: 12.8,
    cashSell: 0.5852,
    cashBuy: 0.4532,
    marketMid: 0.518959,
    bankMid: 0.5192,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16576177,
    foreignAtBankMid: 16393443,
    diffForeign: 2814709,
    diffTWD: 5094,
    diffPct: 20.5,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.00181,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3502,
    foreignAtMarketMid: 3715,
    foreignAtBankMid: 3844,
    diffForeign: 213,
    diffTWD: 1723,
    diffPct: 6.1,
    cashSell: 8.567,
    cashBuy: 7.042,
    marketMid: 8.075001,
    bankMid: 7.8045,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23409825,
    foreignAtBankMid: 24096386,
    diffForeign: 2720170,
    diffTWD: 3486,
    diffPct: 13.1,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001282,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/12 05:26:05';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-12';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-12';
