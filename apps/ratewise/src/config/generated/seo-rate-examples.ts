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
 * 匯率時間：2026/08/27 10:17:59
 * 生成日期：2026-08-27
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
    foreignAtCash: 937,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 947,
    diffForeign: 6,
    diffTWD: 177,
    diffPct: 0.6,
    cashSell: 32.015,
    marketMid: 31.825849,
    bankMid: 31.68,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147929,
    foreignAtMarketMid: 150080,
    foreignAtBankMid: 152749,
    diffForeign: 2151,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 0.2028,
    marketMid: 0.199893,
    bankMid: 0.1964,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 799,
    foreignAtMarketMid: 808,
    foreignAtBankMid: 814,
    diffForeign: 9,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 37.53,
    marketMid: 37.107128,
    bankMid: 36.86,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 681,
    foreignAtMarketMid: 693,
    foreignAtBankMid: 697,
    diffForeign: 12,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 44.08,
    marketMid: 43.306916,
    bankMid: 43.02,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6266,
    foreignAtMarketMid: 6324,
    foreignAtBankMid: 6373,
    diffForeign: 58,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 4.788,
    marketMid: 4.743833,
    bankMid: 4.707,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1190949,
    foreignAtMarketMid: 1305554,
    foreignAtBankMid: 1290878,
    diffForeign: 114605,
    diffTWD: 2633,
    diffPct: 9.6,
    cashSell: 0.02519,
    marketMid: 0.022979,
    bankMid: 0.02324,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.15,
        rateBuy: 42.4,
        rateInverse: 0.023725,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-27',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7322,
    foreignAtMarketMid: 7385,
    foreignAtBankMid: 7509,
    diffForeign: 63,
    diffTWD: 255,
    diffPct: 0.9,
    cashSell: 4.097,
    marketMid: 4.062151,
    bankMid: 3.995,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1313,
    foreignAtBankMid: 1316,
    diffForeign: 19,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 23.19,
    marketMid: 22.852964,
    bankMid: 22.8,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1288,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1314,
    diffForeign: 19,
    diffTWD: 442,
    diffPct: 1.5,
    cashSell: 23.29,
    marketMid: 22.946832,
    bankMid: 22.835,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1198,
    foreignAtBankMid: 1207,
    diffForeign: 13,
    diffTWD: 320,
    diffPct: 1.1,
    cashSell: 25.31,
    marketMid: 25.040064,
    bankMid: 24.855,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 754,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 765,
    diffForeign: 5,
    diffTWD: 190,
    diffPct: 0.6,
    cashSell: 39.8,
    marketMid: 39.547576,
    bankMid: 39.2,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1557,
    foreignAtMarketMid: 1585,
    foreignAtBankMid: 1592,
    diffForeign: 28,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 19.27,
    marketMid: 18.932223,
    bankMid: 18.845,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29152,
    foreignAtMarketMid: 30910,
    foreignAtBankMid: 32116,
    diffForeign: 1758,
    diffTWD: 1706,
    diffPct: 6,
    cashSell: 1.0291,
    marketMid: 0.970568,
    bankMid: 0.9341,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51662,
    foreignAtMarketMid: 58163,
    foreignAtBankMid: 58286,
    diffForeign: 6501,
    diffTWD: 3353,
    diffPct: 12.6,
    cashSell: 0.5807,
    marketMid: 0.515788,
    bankMid: 0.5147,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16728489,
    foreignAtBankMid: 16853933,
    diffForeign: 2643982,
    diffTWD: 4742,
    diffPct: 18.8,
    cashSell: 0.00213,
    marketMid: 0.001793,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3579,
    foreignAtMarketMid: 3799,
    foreignAtBankMid: 3937,
    diffForeign: 220,
    diffTWD: 1740,
    diffPct: 6.2,
    cashSell: 8.383,
    marketMid: 7.896649,
    bankMid: 7.6205,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24570037,
    foreignAtBankMid: 25104603,
    diffForeign: 3141466,
    diffTWD: 3836,
    diffPct: 14.7,
    cashSell: 0.0014,
    marketMid: 0.001221,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/27 10:17:59';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-27';
