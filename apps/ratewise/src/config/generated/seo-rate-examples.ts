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
 * 匯率時間：2026/09/15 13:53:40
 * 生成日期：2026-09-15
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
    foreignAtCash: 935,
    foreignAtMarketMid: 944,
    foreignAtBankMid: 944,
    diffForeign: 9,
    diffTWD: 303,
    diffPct: 1,
    cashSell: 32.1,
    marketMid: 31.775285,
    bankMid: 31.765,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143541,
    foreignAtMarketMid: 146010,
    foreignAtBankMid: 148075,
    diffForeign: 2469,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 0.209,
    marketMid: 0.205465,
    bankMid: 0.2026,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 820,
    diffForeign: 12,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 37.24,
    marketMid: 36.659579,
    bankMid: 36.57,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 684,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 701,
    diffForeign: 16,
    diffTWD: 685,
    diffPct: 2.3,
    cashSell: 43.84,
    marketMid: 42.839395,
    bankMid: 42.78,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6351,
    foreignAtBankMid: 6349,
    diffForeign: 109,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 4.806,
    marketMid: 4.723666,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1170503,
    foreignAtMarketMid: 1272066,
    foreignAtBankMid: 1266892,
    diffForeign: 101563,
    diffTWD: 2395,
    diffPct: 8.7,
    cashSell: 0.02563,
    marketMid: 0.023584,
    bankMid: 0.02368,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.75,
        rateBuy: 42,
        rateInverse: 0.023952,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7306,
    foreignAtMarketMid: 7411,
    foreignAtBankMid: 7493,
    diffForeign: 105,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 4.106,
    marketMid: 4.04814,
    bankMid: 4.004,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1302,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1324,
    diffForeign: 21,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 23.05,
    marketMid: 22.68088,
    bankMid: 22.66,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1288,
    foreignAtMarketMid: 1314,
    foreignAtBankMid: 1314,
    diffForeign: 26,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 23.29,
    marketMid: 22.834178,
    bankMid: 22.835,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1183,
    foreignAtMarketMid: 1201,
    foreignAtBankMid: 1205,
    diffForeign: 18,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 25.35,
    marketMid: 24.979392,
    bankMid: 24.895,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 764,
    foreignAtMarketMid: 772,
    foreignAtBankMid: 776,
    diffForeign: 8,
    diffTWD: 333,
    diffPct: 1.1,
    cashSell: 39.28,
    marketMid: 38.844002,
    bankMid: 38.68,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1604,
    foreignAtMarketMid: 1634,
    foreignAtBankMid: 1642,
    diffForeign: 30,
    diffTWD: 551,
    diffPct: 1.9,
    cashSell: 18.7,
    marketMid: 18.356708,
    bankMid: 18.275,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29475,
    foreignAtMarketMid: 31405,
    foreignAtBankMid: 32510,
    diffForeign: 1930,
    diffTWD: 1843,
    diffPct: 6.5,
    cashSell: 1.0178,
    marketMid: 0.95527,
    bankMid: 0.9228,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52429,
    foreignAtMarketMid: 59402,
    foreignAtBankMid: 59265,
    diffForeign: 6973,
    diffTWD: 3522,
    diffPct: 13.3,
    cashSell: 0.5722,
    marketMid: 0.505032,
    bankMid: 0.5062,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16653081,
    foreignAtBankMid: 16853933,
    diffForeign: 2568574,
    diffTWD: 4627,
    diffPct: 18.2,
    cashSell: 0.00213,
    marketMid: 0.001801,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3614,
    foreignAtMarketMid: 3853,
    foreignAtBankMid: 3980,
    diffForeign: 239,
    diffTWD: 1859,
    diffPct: 6.6,
    cashSell: 8.301,
    marketMid: 7.786525,
    bankMid: 7.5385,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24515721,
    foreignAtBankMid: 24896266,
    diffForeign: 3239125,
    diffTWD: 3964,
    diffPct: 15.2,
    cashSell: 0.00141,
    marketMid: 0.001224,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/15 13:53:40';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-15';
