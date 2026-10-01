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
 * 匯率時間：2026/10/01 13:38:31
 * 生成日期：2026-10-01
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
    foreignAtMarketMid: 940,
    foreignAtBankMid: 942,
    diffForeign: 8,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 32.195,
    cashBuy: 31.525,
    marketMid: 31.907087,
    bankMid: 31.86,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146199,
    foreignAtMarketMid: 147963,
    foreignAtBankMid: 150905,
    diffForeign: 1764,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 0.2052,
    cashBuy: 0.1924,
    marketMid: 0.202753,
    bankMid: 0.1988,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 834,
    diffForeign: 12,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 36.66,
    cashBuy: 35.32,
    marketMid: 36.132389,
    bankMid: 35.99,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 694,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 712,
    diffForeign: 16,
    diffTWD: 650,
    diffPct: 2.2,
    cashSell: 43.22,
    cashBuy: 41.1,
    marketMid: 42.283298,
    bankMid: 42.16,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6225,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6332,
    diffForeign: 90,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 4.819,
    cashBuy: 4.657,
    marketMid: 4.750594,
    bankMid: 4.738,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1169135,
    foreignAtMarketMid: 1275104,
    foreignAtBankMid: 1265289,
    diffForeign: 105969,
    diffTWD: 2493,
    diffPct: 9.1,
    cashSell: 0.02566,
    cashBuy: 0.02176,
    marketMid: 0.023527,
    bankMid: 0.02371,
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
        rateDate: '2026-10-01',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7289,
    foreignAtMarketMid: 7385,
    foreignAtBankMid: 7474,
    diffForeign: 96,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 4.116,
    cashBuy: 3.912,
    marketMid: 4.062316,
    bankMid: 4.014,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1329,
    foreignAtMarketMid: 1352,
    foreignAtBankMid: 1353,
    diffForeign: 23,
    diffTWD: 498,
    diffPct: 1.7,
    cashSell: 22.57,
    cashBuy: 21.79,
    marketMid: 22.195588,
    bankMid: 22.18,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1315,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1341,
    diffForeign: 21,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 22.82,
    cashBuy: 21.91,
    marketMid: 22.455258,
    bankMid: 22.365,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1186,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1208,
    diffForeign: 17,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 25.29,
    cashBuy: 24.38,
    marketMid: 24.946988,
    bankMid: 24.835,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 778,
    foreignAtMarketMid: 786,
    foreignAtBankMid: 791,
    diffForeign: 8,
    diffTWD: 297,
    diffPct: 1,
    cashSell: 38.55,
    cashBuy: 37.35,
    marketMid: 38.167939,
    bankMid: 37.95,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1638,
    foreignAtMarketMid: 1668,
    foreignAtBankMid: 1676,
    diffForeign: 30,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 18.32,
    cashBuy: 17.47,
    marketMid: 17.983994,
    bankMid: 17.895,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29662,
    foreignAtMarketMid: 31608,
    foreignAtBankMid: 32737,
    diffForeign: 1946,
    diffTWD: 1847,
    diffPct: 6.6,
    cashSell: 1.0114,
    cashBuy: 0.8214,
    marketMid: 0.949116,
    bankMid: 0.9164,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52183,
    foreignAtMarketMid: 59010,
    foreignAtBankMid: 58951,
    diffForeign: 6827,
    diffTWD: 3471,
    diffPct: 13.1,
    cashSell: 0.5749,
    cashBuy: 0.4429,
    marketMid: 0.50839,
    bankMid: 0.5089,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16818744,
    foreignAtBankMid: 16853933,
    diffForeign: 2734237,
    diffTWD: 4877,
    diffPct: 19.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001784,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3608,
    foreignAtMarketMid: 3839,
    foreignAtBankMid: 3973,
    diffForeign: 231,
    diffTWD: 1800,
    diffPct: 6.4,
    cashSell: 8.314,
    cashBuy: 6.789,
    marketMid: 7.815186,
    bankMid: 7.5515,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24401159,
    foreignAtBankMid: 24691358,
    diffForeign: 3274398,
    diffTWD: 4026,
    diffPct: 15.5,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001229,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/01 13:38:31';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-01';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-01';
