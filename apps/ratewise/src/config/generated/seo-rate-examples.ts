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
 * 匯率時間：2026/10/26 12:38:48
 * 生成日期：2026-10-26
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
    foreignAtCash: 915,
    foreignAtMarketMid: 920,
    foreignAtBankMid: 925,
    diffForeign: 5,
    diffTWD: 163,
    diffPct: 0.5,
    cashSell: 32.775,
    cashBuy: 32.105,
    marketMid: 32.596649,
    bankMid: 32.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142315,
    foreignAtMarketMid: 144371,
    foreignAtBankMid: 146771,
    diffForeign: 2056,
    diffTWD: 427,
    diffPct: 1.4,
    cashSell: 0.2108,
    cashBuy: 0.198,
    marketMid: 0.207798,
    bankMid: 0.2044,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 825,
    diffForeign: 11,
    diffTWD: 396,
    diffPct: 1.3,
    cashSell: 37.02,
    cashBuy: 35.68,
    marketMid: 36.531015,
    bankMid: 36.35,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 688,
    foreignAtBankMid: 692,
    diffForeign: 13,
    diffTWD: 574,
    diffPct: 1.9,
    cashSell: 44.44,
    cashBuy: 42.32,
    marketMid: 43.590079,
    bankMid: 43.38,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6073,
    foreignAtMarketMid: 6150,
    foreignAtBankMid: 6174,
    diffForeign: 77,
    diffTWD: 376,
    diffPct: 1.3,
    cashSell: 4.94,
    cashBuy: 4.778,
    marketMid: 4.878049,
    bankMid: 4.859,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1121076,
    foreignAtMarketMid: 1218685,
    foreignAtBankMid: 1209190,
    diffForeign: 97609,
    diffTWD: 2403,
    diffPct: 8.7,
    cashSell: 0.02676,
    cashBuy: 0.02286,
    marketMid: 0.024617,
    bankMid: 0.02481,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.3,
        rateBuy: 41,
        rateInverse: 0.024814,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-26',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7155,
    foreignAtMarketMid: 7219,
    foreignAtBankMid: 7333,
    diffForeign: 64,
    diffTWD: 267,
    diffPct: 0.9,
    cashSell: 4.193,
    cashBuy: 3.989,
    marketMid: 4.15562,
    bankMid: 4.091,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1310,
    foreignAtBankMid: 1313,
    diffForeign: 19,
    diffTWD: 428,
    diffPct: 1.4,
    cashSell: 23.24,
    cashBuy: 22.46,
    marketMid: 22.908458,
    bankMid: 22.85,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1269,
    foreignAtMarketMid: 1289,
    foreignAtBankMid: 1294,
    diffForeign: 20,
    diffTWD: 474,
    diffPct: 1.6,
    cashSell: 23.64,
    cashBuy: 22.73,
    marketMid: 23.266636,
    bankMid: 23.185,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1164,
    foreignAtMarketMid: 1177,
    foreignAtBankMid: 1185,
    diffForeign: 13,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 25.77,
    cashBuy: 24.86,
    marketMid: 25.498496,
    bankMid: 25.315,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 764,
    diffForeign: 7,
    diffTWD: 246,
    diffPct: 0.8,
    cashSell: 39.87,
    cashBuy: 38.67,
    marketMid: 39.542884,
    bankMid: 39.27,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1586,
    foreignAtMarketMid: 1615,
    foreignAtBankMid: 1623,
    diffForeign: 29,
    diffTWD: 534,
    diffPct: 1.8,
    cashSell: 18.91,
    cashBuy: 18.06,
    marketMid: 18.573551,
    bankMid: 18.485,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29303,
    foreignAtMarketMid: 31086,
    foreignAtBankMid: 32300,
    diffForeign: 1783,
    diffTWD: 1721,
    diffPct: 6.1,
    cashSell: 1.0238,
    cashBuy: 0.8338,
    marketMid: 0.965053,
    bankMid: 0.9288,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52192,
    foreignAtMarketMid: 58572,
    foreignAtBankMid: 58962,
    diffForeign: 6380,
    diffTWD: 3268,
    diffPct: 12.2,
    cashSell: 0.5748,
    cashBuy: 0.4428,
    marketMid: 0.51219,
    bankMid: 0.5088,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16644756,
    foreignAtBankMid: 17341040,
    diffForeign: 2221679,
    diffTWD: 4004,
    diffPct: 15.4,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001802,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3547,
    foreignAtMarketMid: 3763,
    foreignAtBankMid: 3898,
    diffForeign: 216,
    diffTWD: 1721,
    diffPct: 6.1,
    cashSell: 8.458,
    cashBuy: 6.933,
    marketMid: 7.972829,
    bankMid: 7.6955,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 23776899,
    foreignAtBankMid: 24691358,
    diffForeign: 2650138,
    diffTWD: 3344,
    diffPct: 12.5,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001262,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/26 12:38:48';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-26';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-26';
