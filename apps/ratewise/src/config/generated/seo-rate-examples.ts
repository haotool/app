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
 * 匯率時間：2026/04/18 05:58:06
 * 生成日期：2026-04-19
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
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 942,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 952,
    diffForeign: 11,
    diffTWD: 351,
    diffPct: 1.2,
    cashSell: 31.85,
    marketMid: 31.477226,
    bankMid: 31.515,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148002,
    foreignAtMarketMid: 151029,
    foreignAtBankMid: 152827,
    diffForeign: 3027,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 0.2027,
    marketMid: 0.198638,
    bankMid: 0.1963,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 811,
    diffForeign: 11,
    diffTWD: 403,
    diffPct: 1.4,
    cashSell: 37.68,
    marketMid: 37.173339,
    bankMid: 37.01,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 705,
    diffForeign: 15,
    diffTWD: 640,
    diffPct: 2.2,
    cashSell: 43.62,
    marketMid: 42.689434,
    bankMid: 42.56,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6382,
    foreignAtMarketMid: 6483,
    foreignAtBankMid: 6494,
    diffForeign: 101,
    diffTWD: 469,
    diffPct: 1.6,
    cashSell: 4.701,
    marketMid: 4.627487,
    bankMid: 4.62,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1266357,
    foreignAtMarketMid: 1397283,
    foreignAtBankMid: 1379945,
    diffForeign: 130926,
    diffTWD: 2811,
    diffPct: 10.3,
    cashSell: 0.02369,
    marketMid: 0.02147,
    bankMid: 0.02174,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46,
        rateBuy: 46.7,
        rateInverse: 0.021739,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-19',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7351,
    foreignAtMarketMid: 7464,
    foreignAtBankMid: 7540,
    diffForeign: 113,
    diffTWD: 456,
    diffPct: 1.5,
    cashSell: 4.081,
    marketMid: 4.019034,
    bankMid: 3.979,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1325,
    diffForeign: 23,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 23.03,
    marketMid: 22.618294,
    bankMid: 22.64,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1302,
    diffForeign: 27,
    diffTWD: 611,
    diffPct: 2.1,
    cashSell: 23.49,
    marketMid: 23.011253,
    bankMid: 23.035,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1210,
    foreignAtBankMid: 1212,
    diffForeign: 20,
    diffTWD: 477,
    diffPct: 1.6,
    cashSell: 25.2,
    marketMid: 24.799127,
    bankMid: 24.745,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 735,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 746,
    diffForeign: 9,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 40.79,
    marketMid: 40.330712,
    bankMid: 40.19,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1582,
    foreignAtMarketMid: 1616,
    foreignAtBankMid: 1619,
    diffForeign: 34,
    diffTWD: 619,
    diffPct: 2.1,
    cashSell: 18.96,
    marketMid: 18.568723,
    bankMid: 18.535,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28569,
    foreignAtMarketMid: 30373,
    foreignAtBankMid: 31410,
    diffForeign: 1804,
    diffTWD: 1782,
    diffPct: 6.3,
    cashSell: 1.0501,
    marketMid: 0.987732,
    bankMid: 0.9551,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50386,
    foreignAtMarketMid: 56884,
    foreignAtBankMid: 56668,
    diffForeign: 6498,
    diffTWD: 3427,
    diffPct: 12.9,
    cashSell: 0.5954,
    marketMid: 0.527385,
    bankMid: 0.5294,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16331242,
    foreignAtBankMid: 16393443,
    diffForeign: 2569774,
    diffTWD: 4721,
    diffPct: 18.7,
    cashSell: 0.00218,
    marketMid: 0.001837,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3534,
    foreignAtMarketMid: 3759,
    foreignAtBankMid: 3883,
    diffForeign: 225,
    diffTWD: 1794,
    diffPct: 6.4,
    cashSell: 8.489,
    marketMid: 7.981228,
    bankMid: 7.7265,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24980061,
    foreignAtBankMid: 25974026,
    diffForeign: 2921237,
    diffTWD: 3508,
    diffPct: 13.2,
    cashSell: 0.00136,
    marketMid: 0.001201,
    bankMid: 0.001155,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/18 05:58:06';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-19';
