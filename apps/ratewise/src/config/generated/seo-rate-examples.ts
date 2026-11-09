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
 * 匯率時間：2026/11/09 07:48:36
 * 生成日期：2026-11-09
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
    foreignAtCash: 908,
    foreignAtMarketMid: 913,
    foreignAtBankMid: 917,
    diffForeign: 5,
    diffTWD: 167,
    diffPct: 0.6,
    cashSell: 33.035,
    cashBuy: 32.365,
    marketMid: 32.851511,
    bankMid: 32.7,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142586,
    foreignAtMarketMid: 144861,
    foreignAtBankMid: 147059,
    diffForeign: 2275,
    diffTWD: 471,
    diffPct: 1.6,
    cashSell: 0.2104,
    cashBuy: 0.1976,
    marketMid: 0.207095,
    bankMid: 0.204,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 825,
    diffForeign: 11,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 37.04,
    cashBuy: 35.7,
    marketMid: 36.557725,
    bankMid: 36.37,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 671,
    foreignAtMarketMid: 685,
    foreignAtBankMid: 688,
    diffForeign: 14,
    diffTWD: 580,
    diffPct: 2,
    cashSell: 44.68,
    cashBuy: 42.56,
    marketMid: 43.815449,
    bankMid: 43.62,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6027,
    foreignAtMarketMid: 6051,
    foreignAtBankMid: 6126,
    diffForeign: 24,
    diffTWD: 121,
    diffPct: 0.4,
    cashSell: 4.978,
    cashBuy: 4.816,
    marketMid: 4.957858,
    bankMid: 4.897,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1145038,
    foreignAtMarketMid: 1244173,
    foreignAtBankMid: 1237113,
    diffForeign: 99135,
    diffTWD: 2390,
    diffPct: 8.7,
    cashSell: 0.0262,
    cashBuy: 0.0223,
    marketMid: 0.024112,
    bankMid: 0.02425,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.3,
        rateBuy: 42,
        rateInverse: 0.024213,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-09',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7096,
    foreignAtMarketMid: 7174,
    foreignAtBankMid: 7271,
    diffForeign: 78,
    diffTWD: 328,
    diffPct: 1.1,
    cashSell: 4.228,
    cashBuy: 4.024,
    marketMid: 4.181843,
    bankMid: 4.126,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1329,
    foreignAtBankMid: 1332,
    diffForeign: 20,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 22.91,
    cashBuy: 22.13,
    marketMid: 22.56776,
    bankMid: 22.52,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1270,
    foreignAtMarketMid: 1291,
    foreignAtBankMid: 1294,
    diffForeign: 21,
    diffTWD: 500,
    diffPct: 1.7,
    cashSell: 23.63,
    cashBuy: 22.72,
    marketMid: 23.23582,
    bankMid: 23.175,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1159,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1180,
    diffForeign: 15,
    diffTWD: 367,
    diffPct: 1.2,
    cashSell: 25.88,
    cashBuy: 24.97,
    marketMid: 25.563026,
    bankMid: 25.425,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 744,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 755,
    diffForeign: 6,
    diffTWD: 248,
    diffPct: 0.8,
    cashSell: 40.34,
    cashBuy: 39.14,
    marketMid: 40.006401,
    bankMid: 39.74,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1613,
    foreignAtMarketMid: 1643,
    foreignAtBankMid: 1651,
    diffForeign: 30,
    diffTWD: 557,
    diffPct: 1.9,
    cashSell: 18.6,
    cashBuy: 17.75,
    marketMid: 18.254838,
    bankMid: 18.175,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28913,
    foreignAtMarketMid: 30710,
    foreignAtBankMid: 31827,
    diffForeign: 1797,
    diffTWD: 1755,
    diffPct: 6.2,
    cashSell: 1.0376,
    cashBuy: 0.8476,
    marketMid: 0.976884,
    bankMid: 0.9426,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51273,
    foreignAtMarketMid: 57634,
    foreignAtBankMid: 57792,
    diffForeign: 6361,
    diffTWD: 3311,
    diffPct: 12.4,
    cashSell: 0.5851,
    cashBuy: 0.4531,
    marketMid: 0.520523,
    bankMid: 0.5191,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16528947,
    foreignAtBankMid: 16393443,
    diffForeign: 2767479,
    diffTWD: 5023,
    diffPct: 20.1,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001815,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3500,
    foreignAtMarketMid: 3716,
    foreignAtBankMid: 3841,
    diffForeign: 216,
    diffTWD: 1744,
    diffPct: 6.2,
    cashSell: 8.572,
    cashBuy: 7.047,
    marketMid: 8.073632,
    bankMid: 7.8095,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23437158,
    foreignAtBankMid: 24096386,
    diffForeign: 2747503,
    diffTWD: 3517,
    diffPct: 13.3,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.00128,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/09 07:48:36';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-09';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-09';
