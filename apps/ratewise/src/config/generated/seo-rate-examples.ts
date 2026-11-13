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
 * 匯率時間：2026/11/13 11:37:13
 * 生成日期：2026-11-13
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
    foreignAtMarketMid: 910,
    foreignAtBankMid: 915,
    diffForeign: 4,
    diffTWD: 133,
    diffPct: 0.4,
    cashSell: 33.13,
    cashBuy: 32.46,
    marketMid: 32.982618,
    bankMid: 32.795,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143541,
    foreignAtMarketMid: 145424,
    foreignAtBankMid: 148075,
    diffForeign: 1883,
    diffTWD: 389,
    diffPct: 1.3,
    cashSell: 0.209,
    cashBuy: 0.1962,
    marketMid: 0.206293,
    bankMid: 0.2026,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 814,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 829,
    diffForeign: 7,
    diffTWD: 285,
    diffPct: 1,
    cashSell: 36.87,
    cashBuy: 35.53,
    marketMid: 36.520342,
    bankMid: 36.2,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 686,
    foreignAtBankMid: 692,
    diffForeign: 10,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 44.41,
    cashBuy: 42.29,
    marketMid: 43.702474,
    bankMid: 43.35,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6013,
    foreignAtMarketMid: 6090,
    foreignAtBankMid: 6112,
    diffForeign: 77,
    diffTWD: 378,
    diffPct: 1.3,
    cashSell: 4.989,
    cashBuy: 4.827,
    marketMid: 4.926108,
    bankMid: 4.908,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1118151,
    foreignAtMarketMid: 1213753,
    foreignAtBankMid: 1205788,
    diffForeign: 95602,
    diffTWD: 2363,
    diffPct: 8.5,
    cashSell: 0.02683,
    cashBuy: 0.02293,
    marketMid: 0.024717,
    bankMid: 0.02488,
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
        rateDate: '2026-11-13',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7082,
    foreignAtMarketMid: 7139,
    foreignAtBankMid: 7257,
    diffForeign: 57,
    diffTWD: 239,
    diffPct: 0.8,
    cashSell: 4.236,
    cashBuy: 4.032,
    marketMid: 4.202316,
    bankMid: 4.134,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1318,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1341,
    diffForeign: 18,
    diffTWD: 392,
    diffPct: 1.3,
    cashSell: 22.76,
    cashBuy: 21.98,
    marketMid: 22.462319,
    bankMid: 22.37,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1296,
    foreignAtBankMid: 1304,
    diffForeign: 17,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 23.46,
    cashBuy: 22.55,
    marketMid: 23.14172,
    bankMid: 23.005,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1159,
    foreignAtMarketMid: 1170,
    foreignAtBankMid: 1180,
    diffForeign: 11,
    diffTWD: 279,
    diffPct: 0.9,
    cashSell: 25.88,
    cashBuy: 24.97,
    marketMid: 25.639711,
    bankMid: 25.425,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 758,
    foreignAtBankMid: 767,
    diffForeign: 3,
    diffTWD: 123,
    diffPct: 0.4,
    cashSell: 39.72,
    cashBuy: 38.52,
    marketMid: 39.556962,
    bankMid: 39.12,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1613,
    foreignAtMarketMid: 1638,
    foreignAtBankMid: 1651,
    diffForeign: 25,
    diffTWD: 465,
    diffPct: 1.6,
    cashSell: 18.6,
    cashBuy: 17.75,
    marketMid: 18.311665,
    bankMid: 18.175,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29064,
    foreignAtMarketMid: 30791,
    foreignAtBankMid: 32010,
    diffForeign: 1727,
    diffTWD: 1682,
    diffPct: 5.9,
    cashSell: 1.0322,
    cashBuy: 0.8422,
    marketMid: 0.974325,
    bankMid: 0.9372,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51538,
    foreignAtMarketMid: 58062,
    foreignAtBankMid: 58128,
    diffForeign: 6524,
    diffTWD: 3371,
    diffPct: 12.7,
    cashSell: 0.5821,
    cashBuy: 0.4501,
    marketMid: 0.516686,
    bankMid: 0.5161,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16594924,
    foreignAtBankMid: 16853933,
    diffForeign: 2510417,
    diffTWD: 4538,
    diffPct: 17.8,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001808,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3511,
    foreignAtMarketMid: 3712,
    foreignAtBankMid: 3855,
    diffForeign: 201,
    diffTWD: 1623,
    diffPct: 5.7,
    cashSell: 8.544,
    cashBuy: 7.019,
    marketMid: 8.081657,
    bankMid: 7.7815,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20408163,
    foreignAtMarketMid: 23393686,
    foreignAtBankMid: 23715415,
    diffForeign: 2985523,
    diffTWD: 3829,
    diffPct: 14.6,
    cashSell: 0.00147,
    cashBuy: 0.00106,
    marketMid: 0.001282,
    bankMid: 0.001265,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/13 11:37:13';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-13';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-13';
