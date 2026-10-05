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
 * 匯率時間：2026/10/05 10:21:24
 * 生成日期：2026-10-05
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
    foreignAtCash: 937,
    foreignAtMarketMid: 941,
    foreignAtBankMid: 947,
    diffForeign: 4,
    diffTWD: 144,
    diffPct: 0.5,
    cashSell: 32.025,
    cashBuy: 31.355,
    marketMid: 31.871494,
    bankMid: 31.69,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146484,
    foreignAtMarketMid: 148753,
    foreignAtBankMid: 151210,
    diffForeign: 2269,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 0.2048,
    cashBuy: 0.192,
    marketMid: 0.201677,
    bankMid: 0.1984,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 830,
    foreignAtMarketMid: 836,
    foreignAtBankMid: 846,
    diffForeign: 6,
    diffTWD: 226,
    diffPct: 0.8,
    cashSell: 36.14,
    cashBuy: 34.8,
    marketMid: 35.868006,
    bankMid: 35.47,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 699,
    foreignAtMarketMid: 711,
    foreignAtBankMid: 717,
    diffForeign: 12,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 42.91,
    cashBuy: 40.79,
    marketMid: 42.183413,
    bankMid: 41.85,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6254,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6361,
    diffForeign: 61,
    diffTWD: 290,
    diffPct: 1,
    cashSell: 4.797,
    cashBuy: 4.635,
    marketMid: 4.750594,
    bankMid: 4.716,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1163242,
    foreignAtMarketMid: 1264381,
    foreignAtBankMid: 1258389,
    diffForeign: 101139,
    diffTWD: 2400,
    diffPct: 8.7,
    cashSell: 0.02579,
    cashBuy: 0.02189,
    marketMid: 0.023727,
    bankMid: 0.02384,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.8,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-05',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7328,
    foreignAtMarketMid: 7395,
    foreignAtBankMid: 7515,
    diffForeign: 67,
    diffTWD: 273,
    diffPct: 0.9,
    cashSell: 4.094,
    cashBuy: 3.89,
    marketMid: 4.05668,
    bankMid: 3.992,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1337,
    foreignAtMarketMid: 1353,
    foreignAtBankMid: 1361,
    diffForeign: 16,
    diffTWD: 344,
    diffPct: 1.2,
    cashSell: 22.43,
    cashBuy: 21.65,
    marketMid: 22.172457,
    bankMid: 22.04,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1324,
    foreignAtMarketMid: 1339,
    foreignAtBankMid: 1351,
    diffForeign: 15,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 22.66,
    cashBuy: 21.75,
    marketMid: 22.400932,
    bankMid: 22.205,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1193,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1215,
    diffForeign: 12,
    diffTWD: 298,
    diffPct: 1,
    cashSell: 25.14,
    cashBuy: 24.23,
    marketMid: 24.889862,
    bankMid: 24.685,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 776,
    foreignAtMarketMid: 779,
    foreignAtBankMid: 788,
    diffForeign: 3,
    diffTWD: 121,
    diffPct: 0.4,
    cashSell: 38.65,
    cashBuy: 37.45,
    marketMid: 38.49411,
    bankMid: 38.05,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1652,
    foreignAtMarketMid: 1675,
    foreignAtBankMid: 1692,
    diffForeign: 23,
    diffTWD: 413,
    diffPct: 1.4,
    cashSell: 18.16,
    cashBuy: 17.31,
    marketMid: 17.909913,
    bankMid: 17.735,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29794,
    foreignAtMarketMid: 31566,
    foreignAtBankMid: 32898,
    diffForeign: 1772,
    diffTWD: 1684,
    diffPct: 5.9,
    cashSell: 1.0069,
    cashBuy: 0.8169,
    marketMid: 0.950382,
    bankMid: 0.9119,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52310,
    foreignAtMarketMid: 58927,
    foreignAtBankMid: 59113,
    diffForeign: 6617,
    diffTWD: 3369,
    diffPct: 12.6,
    cashSell: 0.5735,
    cashBuy: 0.4415,
    marketMid: 0.509102,
    bankMid: 0.5075,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16829955,
    foreignAtBankMid: 16853933,
    diffForeign: 2745448,
    diffTWD: 4894,
    diffPct: 19.5,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001783,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3627,
    foreignAtMarketMid: 3852,
    foreignAtBankMid: 3995,
    diffForeign: 225,
    diffTWD: 1754,
    diffPct: 6.2,
    cashSell: 8.271,
    cashBuy: 6.746,
    marketMid: 7.787495,
    bankMid: 7.5085,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24391087,
    foreignAtBankMid: 24896266,
    diffForeign: 3114491,
    diffTWD: 3831,
    diffPct: 14.6,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.00123,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/05 10:21:24';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-05';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-05';
