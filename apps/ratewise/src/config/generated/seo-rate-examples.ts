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
 * 匯率時間：2026/10/21 12:28:31
 * 生成日期：2026-10-21
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
    foreignAtMarketMid: 920,
    foreignAtBankMid: 925,
    diffForeign: 4,
    diffTWD: 127,
    diffPct: 0.4,
    cashSell: 32.765,
    cashBuy: 32.095,
    marketMid: 32.626427,
    bankMid: 32.43,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143472,
    foreignAtMarketMid: 145454,
    foreignAtBankMid: 148002,
    diffForeign: 1982,
    diffTWD: 409,
    diffPct: 1.4,
    cashSell: 0.2091,
    cashBuy: 0.1963,
    marketMid: 0.206251,
    bankMid: 0.2027,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 819,
    foreignAtBankMid: 825,
    diffForeign: 9,
    diffTWD: 317,
    diffPct: 1.1,
    cashSell: 37.02,
    cashBuy: 35.68,
    marketMid: 36.628695,
    bankMid: 36.35,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 688,
    foreignAtBankMid: 692,
    diffForeign: 12,
    diffTWD: 528,
    diffPct: 1.8,
    cashSell: 44.4,
    cashBuy: 42.28,
    marketMid: 43.618599,
    bankMid: 43.34,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6084,
    foreignAtMarketMid: 6165,
    foreignAtBankMid: 6186,
    diffForeign: 81,
    diffTWD: 394,
    diffPct: 1.3,
    cashSell: 4.931,
    cashBuy: 4.769,
    marketMid: 4.86618,
    bankMid: 4.85,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1123596,
    foreignAtMarketMid: 1218648,
    foreignAtBankMid: 1212121,
    diffForeign: 95052,
    diffTWD: 2340,
    diffPct: 8.5,
    cashSell: 0.0267,
    cashBuy: 0.0228,
    marketMid: 0.024617,
    bankMid: 0.02475,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.1,
        rateBuy: 40.8,
        rateInverse: 0.024938,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-21',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7163,
    foreignAtMarketMid: 7217,
    foreignAtBankMid: 7342,
    diffForeign: 54,
    diffTWD: 224,
    diffPct: 0.8,
    cashSell: 4.188,
    cashBuy: 3.984,
    marketMid: 4.15676,
    bankMid: 4.086,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1313,
    foreignAtBankMid: 1316,
    diffForeign: 19,
    diffTWD: 424,
    diffPct: 1.4,
    cashSell: 23.18,
    cashBuy: 22.4,
    marketMid: 22.852442,
    bankMid: 22.79,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1275,
    foreignAtMarketMid: 1293,
    foreignAtBankMid: 1300,
    diffForeign: 18,
    diffTWD: 418,
    diffPct: 1.4,
    cashSell: 23.53,
    cashBuy: 22.62,
    marketMid: 23.201856,
    bankMid: 23.075,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1164,
    foreignAtMarketMid: 1175,
    foreignAtBankMid: 1185,
    diffForeign: 11,
    diffTWD: 283,
    diffPct: 1,
    cashSell: 25.77,
    cashBuy: 24.86,
    marketMid: 25.527135,
    bankMid: 25.315,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 766,
    diffForeign: 4,
    diffTWD: 161,
    diffPct: 0.5,
    cashSell: 39.76,
    cashBuy: 38.56,
    marketMid: 39.546012,
    bankMid: 39.16,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1594,
    foreignAtMarketMid: 1618,
    foreignAtBankMid: 1631,
    diffForeign: 24,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 18.82,
    cashBuy: 17.97,
    marketMid: 18.539118,
    bankMid: 18.395,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29197,
    foreignAtMarketMid: 30914,
    foreignAtBankMid: 32172,
    diffForeign: 1717,
    diffTWD: 1666,
    diffPct: 5.9,
    cashSell: 1.0275,
    cashBuy: 0.8375,
    marketMid: 0.970446,
    bankMid: 0.9325,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51742,
    foreignAtMarketMid: 58017,
    foreignAtBankMid: 58388,
    diffForeign: 6275,
    diffTWD: 3245,
    diffPct: 12.1,
    cashSell: 0.5798,
    cashBuy: 0.4478,
    marketMid: 0.517094,
    bankMid: 0.5138,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16556539,
    foreignAtBankMid: 16853933,
    diffForeign: 2472032,
    diffTWD: 4479,
    diffPct: 17.6,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001812,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3546,
    foreignAtMarketMid: 3758,
    foreignAtBankMid: 3897,
    diffForeign: 212,
    diffTWD: 1693,
    diffPct: 6,
    cashSell: 8.46,
    cashBuy: 6.935,
    marketMid: 7.982502,
    bankMid: 7.6975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23702100,
    foreignAtBankMid: 24291498,
    diffForeign: 2868767,
    diffTWD: 3631,
    diffPct: 13.8,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001266,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/21 12:28:31';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-21';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-21';
