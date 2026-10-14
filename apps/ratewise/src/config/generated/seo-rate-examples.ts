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
 * 匯率時間：2026/10/14 07:46:40
 * 生成日期：2026-10-14
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
    foreignAtCash: 927,
    foreignAtMarketMid: 933,
    foreignAtBankMid: 937,
    diffForeign: 6,
    diffTWD: 193,
    diffPct: 0.6,
    cashSell: 32.35,
    cashBuy: 31.68,
    marketMid: 32.141939,
    bankMid: 32.015,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145490,
    foreignAtMarketMid: 147759,
    foreignAtBankMid: 150150,
    diffForeign: 2269,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 0.2062,
    cashBuy: 0.1934,
    marketMid: 0.203034,
    bankMid: 0.1998,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 823,
    foreignAtMarketMid: 834,
    foreignAtBankMid: 838,
    diffForeign: 11,
    diffTWD: 394,
    diffPct: 1.3,
    cashSell: 36.46,
    cashBuy: 35.12,
    marketMid: 35.981577,
    bankMid: 35.79,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 708,
    diffForeign: 14,
    diffTWD: 602,
    diffPct: 2,
    cashSell: 43.46,
    cashBuy: 41.34,
    marketMid: 42.587624,
    bankMid: 42.4,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6173,
    foreignAtMarketMid: 6282,
    foreignAtBankMid: 6277,
    diffForeign: 109,
    diffTWD: 521,
    diffPct: 1.8,
    cashSell: 4.86,
    cashBuy: 4.698,
    marketMid: 4.775549,
    bankMid: 4.779,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1149425,
    foreignAtMarketMid: 1251487,
    foreignAtBankMid: 1242236,
    diffForeign: 102062,
    diffTWD: 2447,
    diffPct: 8.9,
    cashSell: 0.0261,
    cashBuy: 0.0222,
    marketMid: 0.023971,
    bankMid: 0.02415,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.5,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7253,
    foreignAtMarketMid: 7325,
    foreignAtBankMid: 7437,
    diffForeign: 72,
    diffTWD: 293,
    diffPct: 1,
    cashSell: 4.136,
    cashBuy: 3.932,
    marketMid: 4.095625,
    bankMid: 4.034,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1337,
    foreignAtBankMid: 1339,
    diffForeign: 21,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 22.79,
    cashBuy: 22.01,
    marketMid: 22.443163,
    bankMid: 22.4,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1328,
    foreignAtBankMid: 1332,
    diffForeign: 23,
    diffTWD: 502,
    diffPct: 1.7,
    cashSell: 22.98,
    cashBuy: 22.07,
    marketMid: 22.595806,
    bankMid: 22.525,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1181,
    foreignAtMarketMid: 1195,
    foreignAtBankMid: 1203,
    diffForeign: 14,
    diffTWD: 337,
    diffPct: 1.1,
    cashSell: 25.4,
    cashBuy: 24.49,
    marketMid: 25.11427,
    bankMid: 24.945,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 771,
    foreignAtMarketMid: 777,
    foreignAtBankMid: 783,
    diffForeign: 6,
    diffTWD: 238,
    diffPct: 0.8,
    cashSell: 38.91,
    cashBuy: 37.71,
    marketMid: 38.601096,
    bankMid: 38.31,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1633,
    foreignAtMarketMid: 1663,
    foreignAtBankMid: 1672,
    diffForeign: 30,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 18.37,
    cashBuy: 17.52,
    marketMid: 18.041749,
    bankMid: 17.945,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29481,
    foreignAtMarketMid: 31334,
    foreignAtBankMid: 32517,
    diffForeign: 1853,
    diffTWD: 1774,
    diffPct: 6.3,
    cashSell: 1.0176,
    cashBuy: 0.8276,
    marketMid: 0.957412,
    bankMid: 0.9226,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52002,
    foreignAtMarketMid: 58637,
    foreignAtBankMid: 58720,
    diffForeign: 6635,
    diffTWD: 3394,
    diffPct: 12.8,
    cashSell: 0.5769,
    cashBuy: 0.4449,
    marketMid: 0.511626,
    bankMid: 0.5109,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16714835,
    foreignAtBankMid: 17341040,
    diffForeign: 2291758,
    diffTWD: 4113,
    diffPct: 15.9,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001795,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3592,
    foreignAtMarketMid: 3815,
    foreignAtBankMid: 3953,
    diffForeign: 223,
    diffTWD: 1754,
    diffPct: 6.2,
    cashSell: 8.351,
    cashBuy: 6.826,
    marketMid: 7.86281,
    bankMid: 7.5885,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24111543,
    foreignAtBankMid: 25104603,
    diffForeign: 2682972,
    diffTWD: 3338,
    diffPct: 12.5,
    cashSell: 0.0014,
    cashBuy: 0.00099,
    marketMid: 0.001244,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/14 07:46:40';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-14';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-14';
