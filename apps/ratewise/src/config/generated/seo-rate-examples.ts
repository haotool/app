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
 * 匯率時間：2026/10/30 08:03:59
 * 生成日期：2026-10-30
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
    foreignAtCash: 916,
    foreignAtMarketMid: 922,
    foreignAtBankMid: 925,
    diffForeign: 6,
    diffTWD: 190,
    diffPct: 0.6,
    cashSell: 32.76,
    cashBuy: 32.09,
    marketMid: 32.552083,
    bankMid: 32.425,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143198,
    foreignAtMarketMid: 145432,
    foreignAtBankMid: 147710,
    diffForeign: 2234,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 0.2095,
    cashBuy: 0.1967,
    marketMid: 0.206282,
    bankMid: 0.2031,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 814,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 829,
    diffForeign: 13,
    diffTWD: 494,
    diffPct: 1.7,
    cashSell: 36.87,
    cashBuy: 35.53,
    marketMid: 36.263417,
    bankMid: 36.2,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 692,
    diffForeign: 15,
    diffTWD: 633,
    diffPct: 2.2,
    cashSell: 44.42,
    cashBuy: 42.3,
    marketMid: 43.482042,
    bankMid: 43.36,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6064,
    foreignAtMarketMid: 6171,
    foreignAtBankMid: 6165,
    diffForeign: 107,
    diffTWD: 519,
    diffPct: 1.8,
    cashSell: 4.947,
    cashBuy: 4.785,
    marketMid: 4.861449,
    bankMid: 4.866,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1134644,
    foreignAtMarketMid: 1233554,
    foreignAtBankMid: 1224990,
    diffForeign: 98910,
    diffTWD: 2405,
    diffPct: 8.7,
    cashSell: 0.02644,
    cashBuy: 0.02254,
    marketMid: 0.02432,
    bankMid: 0.02449,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.6,
        rateBuy: 41,
        rateInverse: 0.024631,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-30',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7160,
    foreignAtMarketMid: 7230,
    foreignAtBankMid: 7339,
    diffForeign: 70,
    diffTWD: 289,
    diffPct: 1,
    cashSell: 4.19,
    cashBuy: 3.986,
    marketMid: 4.149636,
    bankMid: 4.088,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1292,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1314,
    diffForeign: 20,
    diffTWD: 449,
    diffPct: 1.5,
    cashSell: 23.22,
    cashBuy: 22.44,
    marketMid: 22.872827,
    bankMid: 22.83,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1268,
    foreignAtMarketMid: 1289,
    foreignAtBankMid: 1293,
    diffForeign: 21,
    diffTWD: 486,
    diffPct: 1.6,
    cashSell: 23.66,
    cashBuy: 22.75,
    marketMid: 23.276384,
    bankMid: 23.205,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1166,
    foreignAtMarketMid: 1180,
    foreignAtBankMid: 1187,
    diffForeign: 14,
    diffTWD: 339,
    diffPct: 1.1,
    cashSell: 25.72,
    cashBuy: 24.81,
    marketMid: 25.429116,
    bankMid: 25.265,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 753,
    foreignAtMarketMid: 761,
    foreignAtBankMid: 764,
    diffForeign: 8,
    diffTWD: 335,
    diffPct: 1.1,
    cashSell: 39.86,
    cashBuy: 38.66,
    marketMid: 39.41508,
    bankMid: 39.26,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1607,
    foreignAtMarketMid: 1639,
    foreignAtBankMid: 1644,
    diffForeign: 32,
    diffTWD: 590,
    diffPct: 2,
    cashSell: 18.67,
    cashBuy: 17.82,
    marketMid: 18.30295,
    bankMid: 18.245,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29257,
    foreignAtMarketMid: 31072,
    foreignAtBankMid: 32244,
    diffForeign: 1815,
    diffTWD: 1753,
    diffPct: 6.2,
    cashSell: 1.0254,
    cashBuy: 0.8354,
    marketMid: 0.965492,
    bankMid: 0.9304,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52074,
    foreignAtMarketMid: 58719,
    foreignAtBankMid: 58812,
    diffForeign: 6645,
    diffTWD: 3395,
    diffPct: 12.8,
    cashSell: 0.5761,
    cashBuy: 0.4441,
    marketMid: 0.510904,
    bankMid: 0.5101,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16720781,
    foreignAtBankMid: 17341040,
    diffForeign: 2297704,
    diffTWD: 4122,
    diffPct: 15.9,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001794,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3528,
    foreignAtMarketMid: 3742,
    foreignAtBankMid: 3876,
    diffForeign: 214,
    diffTWD: 1717,
    diffPct: 6.1,
    cashSell: 8.503,
    cashBuy: 6.978,
    marketMid: 8.016225,
    bankMid: 7.7405,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 23769518,
    foreignAtBankMid: 24691358,
    diffForeign: 2642757,
    diffTWD: 3335,
    diffPct: 12.5,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001262,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/30 08:03:59';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-30';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-30';
