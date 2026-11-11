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
 * 匯率時間：2026/11/11 08:04:55
 * 生成日期：2026-11-11
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
    foreignAtCash: 905,
    foreignAtMarketMid: 911,
    foreignAtBankMid: 915,
    diffForeign: 6,
    diffTWD: 172,
    diffPct: 0.6,
    cashSell: 33.135,
    cashBuy: 32.465,
    marketMid: 32.944587,
    bankMid: 32.8,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142383,
    foreignAtMarketMid: 144287,
    foreignAtBankMid: 146843,
    diffForeign: 1904,
    diffTWD: 396,
    diffPct: 1.3,
    cashSell: 0.2107,
    cashBuy: 0.1979,
    marketMid: 0.207918,
    bankMid: 0.2043,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 821,
    diffForeign: 8,
    diffTWD: 303,
    diffPct: 1,
    cashSell: 37.23,
    cashBuy: 35.89,
    marketMid: 36.854131,
    bankMid: 36.56,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 669,
    foreignAtMarketMid: 681,
    foreignAtBankMid: 686,
    diffForeign: 12,
    diffTWD: 490,
    diffPct: 1.7,
    cashSell: 44.81,
    cashBuy: 42.69,
    marketMid: 44.078106,
    bankMid: 43.75,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6013,
    foreignAtMarketMid: 6111,
    foreignAtBankMid: 6112,
    diffForeign: 98,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 4.989,
    cashBuy: 4.827,
    marketMid: 4.90918,
    bankMid: 4.908,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1126126,
    foreignAtMarketMid: 1222912,
    foreignAtBankMid: 1215067,
    diffForeign: 96786,
    diffTWD: 2374,
    diffPct: 8.6,
    cashSell: 0.02664,
    cashBuy: 0.02274,
    marketMid: 0.024532,
    bankMid: 0.02469,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41,
        rateBuy: 41.5,
        rateInverse: 0.02439,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-11',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7080,
    foreignAtMarketMid: 7139,
    foreignAtBankMid: 7255,
    diffForeign: 59,
    diffTWD: 245,
    diffPct: 0.8,
    cashSell: 4.237,
    cashBuy: 4.033,
    marketMid: 4.202458,
    bankMid: 4.135,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1307,
    foreignAtMarketMid: 1325,
    foreignAtBankMid: 1329,
    diffForeign: 18,
    diffTWD: 417,
    diffPct: 1.4,
    cashSell: 22.96,
    cashBuy: 22.18,
    marketMid: 22.640826,
    bankMid: 22.57,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1290,
    foreignAtBankMid: 1297,
    diffForeign: 18,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 23.58,
    cashBuy: 22.67,
    marketMid: 23.249866,
    bankMid: 23.125,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1155,
    foreignAtMarketMid: 1166,
    foreignAtBankMid: 1176,
    diffForeign: 11,
    diffTWD: 272,
    diffPct: 0.9,
    cashSell: 25.97,
    cashBuy: 25.06,
    marketMid: 25.734726,
    bankMid: 25.515,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 746,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 757,
    diffForeign: 4,
    diffTWD: 169,
    diffPct: 0.6,
    cashSell: 40.21,
    cashBuy: 39.01,
    marketMid: 39.984006,
    bankMid: 39.61,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1596,
    foreignAtMarketMid: 1624,
    foreignAtBankMid: 1633,
    diffForeign: 28,
    diffTWD: 516,
    diffPct: 1.8,
    cashSell: 18.8,
    cashBuy: 17.95,
    marketMid: 18.476433,
    bankMid: 18.375,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28854,
    foreignAtMarketMid: 30563,
    foreignAtBankMid: 31756,
    diffForeign: 1709,
    diffTWD: 1677,
    diffPct: 5.9,
    cashSell: 1.0397,
    cashBuy: 0.8497,
    marketMid: 0.981572,
    bankMid: 0.9447,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51046,
    foreignAtMarketMid: 57430,
    foreignAtBankMid: 57504,
    diffForeign: 6384,
    diffTWD: 3335,
    diffPct: 12.5,
    cashSell: 0.5877,
    cashBuy: 0.4557,
    marketMid: 0.522376,
    bankMid: 0.5217,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16487545,
    foreignAtBankMid: 16393443,
    diffForeign: 2726077,
    diffTWD: 4960,
    diffPct: 19.8,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.00182,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3488,
    foreignAtMarketMid: 3693,
    foreignAtBankMid: 3827,
    diffForeign: 205,
    diffTWD: 1667,
    diffPct: 5.9,
    cashSell: 8.602,
    cashBuy: 7.077,
    marketMid: 8.123939,
    bankMid: 7.8395,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23320471,
    foreignAtBankMid: 24096386,
    diffForeign: 2630816,
    diffTWD: 3384,
    diffPct: 12.7,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001286,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/11 08:04:55';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-11';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-11';
