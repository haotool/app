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
 * 匯率時間：2026/11/18 17:12:05
 * 生成日期：2026-11-18
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
    foreignAtCash: 903,
    foreignAtMarketMid: 910,
    foreignAtBankMid: 912,
    diffForeign: 7,
    diffTWD: 224,
    diffPct: 0.8,
    cashSell: 33.215,
    cashBuy: 32.545,
    marketMid: 32.967395,
    bankMid: 32.88,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142450,
    foreignAtMarketMid: 145173,
    foreignAtBankMid: 146915,
    diffForeign: 2723,
    diffTWD: 563,
    diffPct: 1.9,
    cashSell: 0.2106,
    cashBuy: 0.1978,
    marketMid: 0.206649,
    bankMid: 0.2042,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 828,
    foreignAtBankMid: 834,
    diffForeign: 10,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 36.66,
    cashBuy: 35.32,
    marketMid: 36.222697,
    bankMid: 35.99,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 678,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 694,
    diffForeign: 12,
    diffTWD: 533,
    diffPct: 1.8,
    cashSell: 44.27,
    cashBuy: 42.15,
    marketMid: 43.483933,
    bankMid: 43.21,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5990,
    foreignAtMarketMid: 6063,
    foreignAtBankMid: 6089,
    diffForeign: 73,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 5.008,
    cashBuy: 4.846,
    marketMid: 4.948046,
    bankMid: 4.927,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1114413,
    foreignAtMarketMid: 1214645,
    foreignAtBankMid: 1201442,
    diffForeign: 100232,
    diffTWD: 2476,
    diffPct: 9,
    cashSell: 0.02692,
    cashBuy: 0.02302,
    marketMid: 0.024699,
    bankMid: 0.02497,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.6,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-18',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7064,
    foreignAtMarketMid: 7146,
    foreignAtBankMid: 7238,
    diffForeign: 82,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 4.247,
    cashBuy: 4.043,
    marketMid: 4.198065,
    bankMid: 4.145,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1331,
    foreignAtMarketMid: 1351,
    foreignAtBankMid: 1354,
    diffForeign: 20,
    diffTWD: 440,
    diffPct: 1.5,
    cashSell: 22.54,
    cashBuy: 21.76,
    marketMid: 22.20939,
    bankMid: 22.15,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1281,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1306,
    diffForeign: 21,
    diffTWD: 484,
    diffPct: 1.6,
    cashSell: 23.42,
    cashBuy: 22.51,
    marketMid: 23.042537,
    bankMid: 22.965,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1160,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1180,
    diffForeign: 14,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 25.87,
    cashBuy: 24.96,
    marketMid: 25.560412,
    bankMid: 25.415,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 765,
    foreignAtBankMid: 771,
    diffForeign: 6,
    diffTWD: 254,
    diffPct: 0.9,
    cashSell: 39.53,
    cashBuy: 38.33,
    marketMid: 39.195704,
    bankMid: 38.93,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1626,
    foreignAtMarketMid: 1655,
    foreignAtBankMid: 1664,
    diffForeign: 29,
    diffTWD: 531,
    diffPct: 1.8,
    cashSell: 18.45,
    cashBuy: 17.6,
    marketMid: 18.123165,
    bankMid: 18.025,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29092,
    foreignAtMarketMid: 30813,
    foreignAtBankMid: 32044,
    diffForeign: 1721,
    diffTWD: 1675,
    diffPct: 5.9,
    cashSell: 1.0312,
    cashBuy: 0.8412,
    marketMid: 0.97363,
    bankMid: 0.9362,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51449,
    foreignAtMarketMid: 57894,
    foreignAtBankMid: 58016,
    diffForeign: 6445,
    diffTWD: 3340,
    diffPct: 12.5,
    cashSell: 0.5831,
    cashBuy: 0.4511,
    marketMid: 0.518189,
    bankMid: 0.5171,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16639300,
    foreignAtBankMid: 16393443,
    diffForeign: 2877832,
    diffTWD: 5189,
    diffPct: 20.9,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001803,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3532,
    foreignAtMarketMid: 3730,
    foreignAtBankMid: 3880,
    diffForeign: 198,
    diffTWD: 1590,
    diffPct: 5.6,
    cashSell: 8.494,
    cashBuy: 6.969,
    marketMid: 8.043758,
    bankMid: 7.7315,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23405339,
    foreignAtBankMid: 24096386,
    diffForeign: 2715684,
    diffTWD: 3481,
    diffPct: 13.1,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001282,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/18 17:12:05';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-18';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-18';
