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
 * 匯率時間：2026/10/08 15:17:25
 * 生成日期：2026-10-08
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
    foreignAtCash: 932,
    foreignAtMarketMid: 941,
    foreignAtBankMid: 942,
    diffForeign: 9,
    diffTWD: 296,
    diffPct: 1,
    cashSell: 32.195,
    cashBuy: 31.525,
    marketMid: 31.87759,
    bankMid: 31.86,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146056,
    foreignAtMarketMid: 148814,
    foreignAtBankMid: 150754,
    diffForeign: 2758,
    diffTWD: 556,
    diffPct: 1.9,
    cashSell: 0.2054,
    cashBuy: 0.1926,
    marketMid: 0.201594,
    bankMid: 0.199,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 827,
    foreignAtMarketMid: 841,
    foreignAtBankMid: 843,
    diffForeign: 14,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 36.26,
    cashBuy: 34.92,
    marketMid: 35.690067,
    bankMid: 35.59,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 714,
    diffForeign: 15,
    diffTWD: 660,
    diffPct: 2.2,
    cashSell: 43.07,
    cashBuy: 40.95,
    marketMid: 42.122999,
    bankMid: 42.01,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6214,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6320,
    diffForeign: 101,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 4.828,
    cashBuy: 4.666,
    marketMid: 4.750594,
    bankMid: 4.747,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1154290,
    foreignAtMarketMid: 1260705,
    foreignAtBankMid: 1247920,
    diffForeign: 106415,
    diffTWD: 2532,
    diffPct: 9.2,
    cashSell: 0.02599,
    cashBuy: 0.02209,
    marketMid: 0.023796,
    bankMid: 0.02404,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41,
        rateBuy: 41.3,
        rateInverse: 0.02439,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7289,
    foreignAtMarketMid: 7389,
    foreignAtBankMid: 7474,
    diffForeign: 100,
    diffTWD: 406,
    diffPct: 1.4,
    cashSell: 4.116,
    cashBuy: 3.912,
    marketMid: 4.060337,
    bankMid: 4.014,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1329,
    foreignAtMarketMid: 1351,
    foreignAtBankMid: 1353,
    diffForeign: 22,
    diffTWD: 494,
    diffPct: 1.7,
    cashSell: 22.57,
    cashBuy: 21.79,
    marketMid: 22.198051,
    bankMid: 22.18,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1315,
    foreignAtMarketMid: 1342,
    foreignAtBankMid: 1342,
    diffForeign: 27,
    diffTWD: 596,
    diffPct: 2,
    cashSell: 22.81,
    cashBuy: 21.9,
    marketMid: 22.35686,
    bankMid: 22.355,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1210,
    diffForeign: 17,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 25.25,
    cashBuy: 24.34,
    marketMid: 24.896059,
    bankMid: 24.795,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 775,
    foreignAtMarketMid: 784,
    foreignAtBankMid: 787,
    diffForeign: 9,
    diffTWD: 342,
    diffPct: 1.2,
    cashSell: 38.7,
    cashBuy: 37.5,
    marketMid: 38.258474,
    bankMid: 38.1,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1646,
    foreignAtMarketMid: 1680,
    foreignAtBankMid: 1685,
    diffForeign: 34,
    diffTWD: 616,
    diffPct: 2.1,
    cashSell: 18.23,
    cashBuy: 17.38,
    marketMid: 17.855867,
    bankMid: 17.805,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29703,
    foreignAtMarketMid: 31686,
    foreignAtBankMid: 32787,
    diffForeign: 1983,
    diffTWD: 1878,
    diffPct: 6.7,
    cashSell: 1.01,
    cashBuy: 0.82,
    marketMid: 0.946785,
    bankMid: 0.915,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52238,
    foreignAtMarketMid: 59053,
    foreignAtBankMid: 59020,
    diffForeign: 6815,
    diffTWD: 3462,
    diffPct: 13,
    cashSell: 0.5743,
    cashBuy: 0.4423,
    marketMid: 0.508021,
    bankMid: 0.5083,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16811118,
    foreignAtBankMid: 16853933,
    diffForeign: 2726611,
    diffTWD: 4866,
    diffPct: 19.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001785,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3612,
    foreignAtMarketMid: 3849,
    foreignAtBankMid: 3977,
    diffForeign: 237,
    diffTWD: 1845,
    diffPct: 6.6,
    cashSell: 8.306,
    cashBuy: 6.781,
    marketMid: 7.795204,
    bankMid: 7.5435,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24433860,
    foreignAtBankMid: 24691358,
    diffForeign: 3307099,
    diffTWD: 4060,
    diffPct: 15.7,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001228,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/08 15:17:25';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-08';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-08';
