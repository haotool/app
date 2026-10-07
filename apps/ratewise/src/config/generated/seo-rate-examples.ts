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
 * 匯率時間：2026/10/07 10:16:25
 * 生成日期：2026-10-07
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
    foreignAtCash: 935,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 945,
    diffForeign: 8,
    diffTWD: 245,
    diffPct: 0.8,
    cashSell: 32.07,
    cashBuy: 31.4,
    marketMid: 31.807627,
    bankMid: 31.735,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146843,
    foreignAtMarketMid: 149301,
    foreignAtBankMid: 151592,
    diffForeign: 2458,
    diffTWD: 494,
    diffPct: 1.7,
    cashSell: 0.2043,
    cashBuy: 0.1915,
    marketMid: 0.200937,
    bankMid: 0.1979,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 828,
    foreignAtMarketMid: 839,
    foreignAtBankMid: 843,
    diffForeign: 11,
    diffTWD: 413,
    diffPct: 1.4,
    cashSell: 36.25,
    cashBuy: 34.91,
    marketMid: 35.751314,
    bankMid: 35.58,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 714,
    diffForeign: 15,
    diffTWD: 637,
    diffPct: 2.2,
    cashSell: 43.06,
    cashBuy: 40.94,
    marketMid: 42.146078,
    bankMid: 42,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6240,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6347,
    diffForeign: 75,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 4.808,
    cashBuy: 4.646,
    marketMid: 4.750594,
    bankMid: 4.727,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1158301,
    foreignAtMarketMid: 1263022,
    foreignAtBankMid: 1252610,
    diffForeign: 104721,
    diffTWD: 2487,
    diffPct: 9,
    cashSell: 0.0259,
    cashBuy: 0.022,
    marketMid: 0.023753,
    bankMid: 0.02395,
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
        rateDate: '2026-10-07',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7317,
    foreignAtMarketMid: 7405,
    foreignAtBankMid: 7504,
    diffForeign: 88,
    diffTWD: 356,
    diffPct: 1.2,
    cashSell: 4.1,
    cashBuy: 3.896,
    marketMid: 4.051355,
    bankMid: 3.998,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1330,
    foreignAtMarketMid: 1352,
    foreignAtBankMid: 1353,
    diffForeign: 22,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 22.56,
    cashBuy: 21.78,
    marketMid: 22.195588,
    bankMid: 22.17,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1318,
    foreignAtMarketMid: 1343,
    foreignAtBankMid: 1344,
    diffForeign: 25,
    diffTWD: 576,
    diffPct: 2,
    cashSell: 22.77,
    cashBuy: 21.86,
    marketMid: 22.332894,
    bankMid: 22.315,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1212,
    diffForeign: 16,
    diffTWD: 383,
    diffPct: 1.3,
    cashSell: 25.2,
    cashBuy: 24.29,
    marketMid: 24.878097,
    bankMid: 24.745,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 778,
    foreignAtMarketMid: 785,
    foreignAtBankMid: 791,
    diffForeign: 7,
    diffTWD: 263,
    diffPct: 0.9,
    cashSell: 38.55,
    cashBuy: 37.35,
    marketMid: 38.211693,
    bankMid: 37.95,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1647,
    foreignAtMarketMid: 1679,
    foreignAtBankMid: 1687,
    diffForeign: 32,
    diffTWD: 556,
    diffPct: 1.9,
    cashSell: 18.21,
    cashBuy: 17.36,
    marketMid: 17.872782,
    bankMid: 17.785,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29809,
    foreignAtMarketMid: 31740,
    foreignAtBankMid: 32916,
    diffForeign: 1931,
    diffTWD: 1825,
    diffPct: 6.5,
    cashSell: 1.0064,
    cashBuy: 0.8164,
    marketMid: 0.945191,
    bankMid: 0.9114,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52420,
    foreignAtMarketMid: 59257,
    foreignAtBankMid: 59253,
    diffForeign: 6837,
    diffTWD: 3461,
    diffPct: 13,
    cashSell: 0.5723,
    cashBuy: 0.4403,
    marketMid: 0.506267,
    bankMid: 0.5063,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16882354,
    foreignAtBankMid: 16853933,
    diffForeign: 2797847,
    diffTWD: 4972,
    diffPct: 19.9,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001777,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3623,
    foreignAtMarketMid: 3860,
    foreignAtBankMid: 3990,
    diffForeign: 237,
    diffTWD: 1842,
    diffPct: 6.5,
    cashSell: 8.281,
    cashBuy: 6.756,
    marketMid: 7.772665,
    bankMid: 7.5185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24482533,
    foreignAtBankMid: 24896266,
    diffForeign: 3205937,
    diffTWD: 3928,
    diffPct: 15.1,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.001225,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/07 10:16:25';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-07';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-07';
