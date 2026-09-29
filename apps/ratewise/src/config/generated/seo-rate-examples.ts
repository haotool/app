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
 * 匯率時間：2026/09/29 10:19:06
 * 生成日期：2026-09-29
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
    diffTWD: 256,
    diffPct: 0.9,
    cashSell: 32.085,
    cashBuy: 31.415,
    marketMid: 31.811675,
    bankMid: 31.75,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145914,
    foreignAtMarketMid: 148423,
    foreignAtBankMid: 150602,
    diffForeign: 2509,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 0.2056,
    cashBuy: 0.1928,
    marketMid: 0.202125,
    bankMid: 0.1992,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 833,
    diffForeign: 12,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 36.69,
    cashBuy: 35.35,
    marketMid: 36.163749,
    bankMid: 36.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 714,
    diffForeign: 16,
    diffTWD: 653,
    diffPct: 2.2,
    cashSell: 43.08,
    cashBuy: 40.96,
    marketMid: 42.142526,
    bankMid: 42.02,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6342,
    foreignAtBankMid: 6349,
    diffForeign: 100,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 4.806,
    cashBuy: 4.644,
    marketMid: 4.730369,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1172791,
    foreignAtMarketMid: 1282430,
    foreignAtBankMid: 1269573,
    diffForeign: 109639,
    diffTWD: 2565,
    diffPct: 9.3,
    cashSell: 0.02558,
    cashBuy: 0.02168,
    marketMid: 0.023393,
    bankMid: 0.02363,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 41.9,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7312,
    foreignAtMarketMid: 7401,
    foreignAtBankMid: 7498,
    diffForeign: 89,
    diffTWD: 362,
    diffPct: 1.2,
    cashSell: 4.103,
    cashBuy: 3.899,
    marketMid: 4.053506,
    bankMid: 4.001,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1321,
    foreignAtMarketMid: 1344,
    foreignAtBankMid: 1344,
    diffForeign: 23,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 22.71,
    cashBuy: 21.93,
    marketMid: 22.326412,
    bankMid: 22.32,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1312,
    foreignAtMarketMid: 1337,
    foreignAtBankMid: 1339,
    diffForeign: 25,
    diffTWD: 551,
    diffPct: 1.9,
    cashSell: 22.86,
    cashBuy: 21.95,
    marketMid: 22.440141,
    bankMid: 22.405,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1211,
    diffForeign: 16,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 25.23,
    cashBuy: 24.32,
    marketMid: 24.887385,
    bankMid: 24.775,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 777,
    foreignAtMarketMid: 785,
    foreignAtBankMid: 789,
    diffForeign: 8,
    diffTWD: 287,
    diffPct: 1,
    cashSell: 38.61,
    cashBuy: 37.41,
    marketMid: 38.240918,
    bankMid: 38.01,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1665,
    foreignAtBankMid: 1669,
    diffForeign: 35,
    diffTWD: 618,
    diffPct: 2.1,
    cashSell: 18.4,
    cashBuy: 17.55,
    marketMid: 18.02094,
    bankMid: 17.975,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29774,
    foreignAtMarketMid: 31688,
    foreignAtBankMid: 32873,
    diffForeign: 1914,
    diffTWD: 1812,
    diffPct: 6.4,
    cashSell: 1.0076,
    cashBuy: 0.8176,
    marketMid: 0.94674,
    bankMid: 0.9126,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52083,
    foreignAtMarketMid: 58940,
    foreignAtBankMid: 58824,
    diffForeign: 6857,
    diffTWD: 3490,
    diffPct: 13.2,
    cashSell: 0.576,
    cashBuy: 0.444,
    marketMid: 0.50899,
    bankMid: 0.51,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16967180,
    foreignAtBankMid: 16853933,
    diffForeign: 2882673,
    diffTWD: 5097,
    diffPct: 20.5,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001768,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3619,
    foreignAtMarketMid: 3853,
    foreignAtBankMid: 3986,
    diffForeign: 234,
    diffTWD: 1818,
    diffPct: 6.5,
    cashSell: 8.289,
    cashBuy: 6.764,
    marketMid: 7.786707,
    bankMid: 7.5265,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24448558,
    foreignAtBankMid: 24896266,
    diffForeign: 3171962,
    diffTWD: 3892,
    diffPct: 14.9,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.001227,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/29 10:19:06';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-09-29';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-29';
