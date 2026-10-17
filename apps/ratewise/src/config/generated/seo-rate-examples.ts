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
 * 匯率時間：2026/10/17 00:59:22
 * 生成日期：2026-10-17
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
    foreignAtCash: 921,
    foreignAtMarketMid: 925,
    foreignAtBankMid: 930,
    diffForeign: 4,
    diffTWD: 134,
    diffPct: 0.4,
    cashSell: 32.59,
    cashBuy: 31.92,
    marketMid: 32.444358,
    bankMid: 32.255,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144370,
    foreignAtMarketMid: 146238,
    foreignAtBankMid: 148957,
    diffForeign: 1868,
    diffTWD: 383,
    diffPct: 1.3,
    cashSell: 0.2078,
    cashBuy: 0.195,
    marketMid: 0.205145,
    bankMid: 0.2014,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 815,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 831,
    diffForeign: 9,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 36.79,
    cashBuy: 35.45,
    marketMid: 36.408651,
    bankMid: 36.12,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 682,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 699,
    diffForeign: 13,
    diffTWD: 552,
    diffPct: 1.9,
    cashSell: 43.97,
    cashBuy: 41.85,
    marketMid: 43.16112,
    bankMid: 42.91,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6122,
    foreignAtMarketMid: 6201,
    foreignAtBankMid: 6225,
    diffForeign: 79,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 4.9,
    cashBuy: 4.738,
    marketMid: 4.837929,
    bankMid: 4.819,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1136794,
    foreignAtMarketMid: 1235180,
    foreignAtBankMid: 1227496,
    diffForeign: 98386,
    diffTWD: 2390,
    diffPct: 8.7,
    cashSell: 0.02639,
    cashBuy: 0.02249,
    marketMid: 0.024288,
    bankMid: 0.02444,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.6,
        rateBuy: 41.2,
        rateInverse: 0.024631,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-17',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7199,
    foreignAtMarketMid: 7263,
    foreignAtBankMid: 7380,
    diffForeign: 64,
    diffTWD: 262,
    diffPct: 0.9,
    cashSell: 4.167,
    cashBuy: 3.963,
    marketMid: 4.130542,
    bankMid: 4.065,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1313,
    foreignAtMarketMid: 1331,
    foreignAtBankMid: 1336,
    diffForeign: 18,
    diffTWD: 413,
    diffPct: 1.4,
    cashSell: 22.85,
    cashBuy: 22.07,
    marketMid: 22.535211,
    bankMid: 22.46,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1310,
    foreignAtBankMid: 1316,
    diffForeign: 20,
    diffTWD: 450,
    diffPct: 1.5,
    cashSell: 23.25,
    cashBuy: 22.34,
    marketMid: 22.901113,
    bankMid: 22.795,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1173,
    foreignAtMarketMid: 1185,
    foreignAtBankMid: 1194,
    diffForeign: 12,
    diffTWD: 302,
    diffPct: 1,
    cashSell: 25.58,
    cashBuy: 24.67,
    marketMid: 25.322867,
    bankMid: 25.125,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 763,
    foreignAtBankMid: 770,
    diffForeign: 4,
    diffTWD: 185,
    diffPct: 0.6,
    cashSell: 39.55,
    cashBuy: 38.35,
    marketMid: 39.306631,
    bankMid: 38.95,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1611,
    foreignAtMarketMid: 1637,
    foreignAtBankMid: 1649,
    diffForeign: 26,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 18.62,
    cashBuy: 17.77,
    marketMid: 18.32811,
    bankMid: 18.195,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29214,
    foreignAtMarketMid: 30946,
    foreignAtBankMid: 32192,
    diffForeign: 1732,
    diffTWD: 1679,
    diffPct: 5.9,
    cashSell: 1.0269,
    cashBuy: 0.8369,
    marketMid: 0.969419,
    bankMid: 0.9319,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51831,
    foreignAtMarketMid: 58325,
    foreignAtBankMid: 58502,
    diffForeign: 6494,
    diffTWD: 3340,
    diffPct: 12.5,
    cashSell: 0.5788,
    cashBuy: 0.4468,
    marketMid: 0.514364,
    bankMid: 0.5128,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16656017,
    foreignAtBankMid: 17341040,
    diffForeign: 2232940,
    diffTWD: 4022,
    diffPct: 15.5,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001801,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3564,
    foreignAtMarketMid: 3778,
    foreignAtBankMid: 3919,
    diffForeign: 214,
    diffTWD: 1701,
    diffPct: 6,
    cashSell: 8.418,
    cashBuy: 6.893,
    marketMid: 7.940667,
    bankMid: 7.6555,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 23958554,
    foreignAtBankMid: 24896266,
    diffForeign: 2681958,
    diffTWD: 3358,
    diffPct: 12.6,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.001252,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/17 00:59:22';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-17';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-17';
