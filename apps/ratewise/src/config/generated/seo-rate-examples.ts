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
 * 匯率時間：2026/10/02 09:34:53
 * 生成日期：2026-10-02
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
    foreignAtCash: 933,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 943,
    diffForeign: 5,
    diffTWD: 159,
    diffPct: 0.5,
    cashSell: 32.165,
    cashBuy: 31.495,
    marketMid: 31.994881,
    bankMid: 31.83,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146199,
    foreignAtMarketMid: 148409,
    foreignAtBankMid: 150905,
    diffForeign: 2210,
    diffTWD: 447,
    diffPct: 1.5,
    cashSell: 0.2052,
    cashBuy: 0.1924,
    marketMid: 0.202145,
    bankMid: 0.1988,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 825,
    foreignAtMarketMid: 832,
    foreignAtBankMid: 841,
    diffForeign: 7,
    diffTWD: 264,
    diffPct: 0.9,
    cashSell: 36.36,
    cashBuy: 35.02,
    marketMid: 36.039932,
    bankMid: 35.69,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 698,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 716,
    diffForeign: 12,
    diffTWD: 509,
    diffPct: 1.7,
    cashSell: 42.97,
    cashBuy: 40.85,
    marketMid: 42.240433,
    bankMid: 41.91,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6233,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6340,
    diffForeign: 82,
    diffTWD: 389,
    diffPct: 1.3,
    cashSell: 4.813,
    cashBuy: 4.651,
    marketMid: 4.750594,
    bankMid: 4.732,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1173250,
    foreignAtMarketMid: 1275216,
    foreignAtBankMid: 1270110,
    diffForeign: 101966,
    diffTWD: 2399,
    diffPct: 8.7,
    cashSell: 0.02557,
    cashBuy: 0.02167,
    marketMid: 0.023525,
    bankMid: 0.02362,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.4,
        rateBuy: 41.6,
        rateInverse: 0.024155,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-02',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7294,
    foreignAtMarketMid: 7374,
    foreignAtBankMid: 7479,
    diffForeign: 80,
    diffTWD: 324,
    diffPct: 1.1,
    cashSell: 4.113,
    cashBuy: 3.909,
    marketMid: 4.06858,
    bankMid: 4.011,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1337,
    foreignAtMarketMid: 1351,
    foreignAtBankMid: 1361,
    diffForeign: 14,
    diffTWD: 313,
    diffPct: 1.1,
    cashSell: 22.44,
    cashBuy: 21.66,
    marketMid: 22.205938,
    bankMid: 22.05,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1315,
    foreignAtMarketMid: 1337,
    foreignAtBankMid: 1341,
    diffForeign: 22,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 22.82,
    cashBuy: 21.91,
    marketMid: 22.434603,
    bankMid: 22.365,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1211,
    diffForeign: 13,
    diffTWD: 328,
    diffPct: 1.1,
    cashSell: 25.22,
    cashBuy: 24.31,
    marketMid: 24.943876,
    bankMid: 24.765,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 775,
    foreignAtMarketMid: 782,
    foreignAtBankMid: 787,
    diffForeign: 7,
    diffTWD: 281,
    diffPct: 0.9,
    cashSell: 38.71,
    cashBuy: 37.51,
    marketMid: 38.347969,
    bankMid: 38.11,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1648,
    foreignAtMarketMid: 1671,
    foreignAtBankMid: 1688,
    diffForeign: 23,
    diffTWD: 399,
    diffPct: 1.3,
    cashSell: 18.2,
    cashBuy: 17.35,
    marketMid: 17.958157,
    bankMid: 17.775,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29750,
    foreignAtMarketMid: 31614,
    foreignAtBankMid: 32844,
    diffForeign: 1864,
    diffTWD: 1769,
    diffPct: 6.3,
    cashSell: 1.0084,
    cashBuy: 0.8184,
    marketMid: 0.948939,
    bankMid: 0.9134,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52210,
    foreignAtMarketMid: 58821,
    foreignAtBankMid: 58985,
    diffForeign: 6611,
    diffTWD: 3372,
    diffPct: 12.7,
    cashSell: 0.5746,
    cashBuy: 0.4426,
    marketMid: 0.510019,
    bankMid: 0.5086,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16840092,
    foreignAtBankMid: 16853933,
    diffForeign: 2755585,
    diffTWD: 4909,
    diffPct: 19.6,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001781,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3614,
    foreignAtMarketMid: 3839,
    foreignAtBankMid: 3980,
    diffForeign: 225,
    diffTWD: 1755,
    diffPct: 6.2,
    cashSell: 8.301,
    cashBuy: 6.776,
    marketMid: 7.815309,
    bankMid: 7.5385,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24379763,
    foreignAtBankMid: 24691358,
    diffForeign: 3253002,
    diffTWD: 4003,
    diffPct: 15.4,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001231,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/02 09:34:53';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-02';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-02';
