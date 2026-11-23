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
 * 匯率時間：2026/11/23 11:09:48
 * 生成日期：2026-11-23
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
    foreignAtCash: 902,
    foreignAtMarketMid: 910,
    foreignAtBankMid: 911,
    diffForeign: 8,
    diffTWD: 247,
    diffPct: 0.8,
    cashSell: 33.255,
    cashBuy: 32.585,
    marketMid: 32.98153,
    bankMid: 32.92,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142113,
    foreignAtMarketMid: 144588,
    foreignAtBankMid: 146556,
    diffForeign: 2475,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 0.2111,
    cashBuy: 0.1983,
    marketMid: 0.207486,
    bankMid: 0.2047,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 816,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 831,
    diffForeign: 14,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 36.75,
    cashBuy: 35.41,
    marketMid: 36.161134,
    bankMid: 36.08,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 679,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 696,
    diffForeign: 16,
    diffTWD: 681,
    diffPct: 2.3,
    cashSell: 44.16,
    cashBuy: 42.04,
    marketMid: 43.157395,
    bankMid: 43.1,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5994,
    foreignAtMarketMid: 6075,
    foreignAtBankMid: 6093,
    diffForeign: 81,
    diffTWD: 400,
    diffPct: 1.4,
    cashSell: 5.005,
    cashBuy: 4.843,
    marketMid: 4.938272,
    bankMid: 4.924,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1126126,
    foreignAtMarketMid: 1223142,
    foreignAtBankMid: 1215067,
    diffForeign: 97016,
    diffTWD: 2380,
    diffPct: 8.6,
    cashSell: 0.02664,
    cashBuy: 0.02274,
    marketMid: 0.024527,
    bankMid: 0.02469,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.9,
        rateBuy: 41.5,
        rateInverse: 0.02445,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-23',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7049,
    foreignAtMarketMid: 7134,
    foreignAtBankMid: 7222,
    diffForeign: 85,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 4.256,
    cashBuy: 4.052,
    marketMid: 4.205321,
    bankMid: 4.154,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1347,
    foreignAtMarketMid: 1372,
    foreignAtBankMid: 1371,
    diffForeign: 25,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 22.27,
    cashBuy: 21.49,
    marketMid: 21.868918,
    bankMid: 21.88,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1280,
    foreignAtMarketMid: 1305,
    foreignAtBankMid: 1306,
    diffForeign: 25,
    diffTWD: 567,
    diffPct: 1.9,
    cashSell: 23.43,
    cashBuy: 22.52,
    marketMid: 22.98692,
    bankMid: 22.975,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1158,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1179,
    diffForeign: 16,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 25.9,
    cashBuy: 24.99,
    marketMid: 25.562372,
    bankMid: 25.445,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 756,
    foreignAtMarketMid: 765,
    foreignAtBankMid: 768,
    diffForeign: 9,
    diffTWD: 334,
    diffPct: 1.1,
    cashSell: 39.66,
    cashBuy: 38.46,
    marketMid: 39.218762,
    bankMid: 39.06,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1662,
    foreignAtBankMid: 1668,
    diffForeign: 32,
    diffTWD: 589,
    diffPct: 2,
    cashSell: 18.41,
    cashBuy: 17.56,
    marketMid: 18.048587,
    bankMid: 17.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29053,
    foreignAtMarketMid: 30915,
    foreignAtBankMid: 31997,
    diffForeign: 1862,
    diffTWD: 1807,
    diffPct: 6.4,
    cashSell: 1.0326,
    cashBuy: 0.8426,
    marketMid: 0.970397,
    bankMid: 0.9376,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51467,
    foreignAtMarketMid: 58229,
    foreignAtBankMid: 58038,
    diffForeign: 6762,
    diffTWD: 3484,
    diffPct: 13.1,
    cashSell: 0.5829,
    cashBuy: 0.4509,
    marketMid: 0.515206,
    bankMid: 0.5169,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16639662,
    foreignAtBankMid: 16853933,
    diffForeign: 2555155,
    diffTWD: 4607,
    diffPct: 18.1,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001803,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3525,
    foreignAtMarketMid: 3746,
    foreignAtBankMid: 3872,
    diffForeign: 221,
    diffTWD: 1765,
    diffPct: 6.3,
    cashSell: 8.51,
    cashBuy: 6.985,
    marketMid: 8.009227,
    bankMid: 7.7475,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20547945,
    foreignAtMarketMid: 23475974,
    foreignAtBankMid: 23904382,
    diffForeign: 2928029,
    diffTWD: 3742,
    diffPct: 14.2,
    cashSell: 0.00146,
    cashBuy: 0.00105,
    marketMid: 0.001278,
    bankMid: 0.001255,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/23 11:09:48';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-23';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-23';
