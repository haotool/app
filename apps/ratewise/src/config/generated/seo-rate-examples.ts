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
 * 匯率時間：2026/08/10 07:28:10
 * 生成日期：2026-08-10
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
    foreignAtCash: 921,
    foreignAtMarketMid: 932,
    foreignAtBankMid: 931,
    diffForeign: 11,
    diffTWD: 350,
    diffPct: 1.2,
    cashSell: 32.56,
    marketMid: 32.180209,
    bankMid: 32.225,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144092,
    foreignAtMarketMid: 146842,
    foreignAtBankMid: 148662,
    diffForeign: 2750,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 0.2082,
    marketMid: 0.204301,
    bankMid: 0.2018,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 793,
    foreignAtMarketMid: 805,
    foreignAtBankMid: 807,
    diffForeign: 12,
    diffTWD: 456,
    diffPct: 1.5,
    cashSell: 37.85,
    marketMid: 37.274489,
    bankMid: 37.18,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 674,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 691,
    diffForeign: 15,
    diffTWD: 661,
    diffPct: 2.3,
    cashSell: 44.49,
    marketMid: 43.510421,
    bankMid: 43.43,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6179,
    foreignAtMarketMid: 6288,
    foreignAtBankMid: 6284,
    diffForeign: 109,
    diffTWD: 519,
    diffPct: 1.8,
    cashSell: 4.855,
    marketMid: 4.770992,
    bankMid: 4.774,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1196649,
    foreignAtMarketMid: 1312540,
    foreignAtBankMid: 1297578,
    diffForeign: 115891,
    diffTWD: 2649,
    diffPct: 9.7,
    cashSell: 0.02507,
    marketMid: 0.022856,
    bankMid: 0.02312,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.2,
        rateBuy: 42.8,
        rateInverse: 0.023697,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7205,
    foreignAtMarketMid: 7298,
    foreignAtBankMid: 7386,
    diffForeign: 93,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 4.164,
    marketMid: 4.110676,
    bankMid: 4.062,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1315,
    diffForeign: 27,
    diffTWD: 625,
    diffPct: 2.1,
    cashSell: 23.21,
    marketMid: 22.72624,
    bankMid: 22.82,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1299,
    foreignAtBankMid: 1297,
    diffForeign: 27,
    diffTWD: 612,
    diffPct: 2.1,
    cashSell: 23.58,
    marketMid: 23.098956,
    bankMid: 23.125,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1172,
    foreignAtMarketMid: 1190,
    foreignAtBankMid: 1194,
    diffForeign: 18,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 25.59,
    marketMid: 25.213686,
    bankMid: 25.135,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 744,
    foreignAtMarketMid: 752,
    foreignAtBankMid: 755,
    diffForeign: 8,
    diffTWD: 319,
    diffPct: 1.1,
    cashSell: 40.34,
    marketMid: 39.9106,
    bankMid: 39.74,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1546,
    foreignAtMarketMid: 1583,
    foreignAtBankMid: 1581,
    diffForeign: 37,
    diffTWD: 702,
    diffPct: 2.4,
    cashSell: 19.4,
    marketMid: 18.946212,
    bankMid: 18.975,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28854,
    foreignAtMarketMid: 30728,
    foreignAtBankMid: 31756,
    diffForeign: 1874,
    diffTWD: 1830,
    diffPct: 6.5,
    cashSell: 1.0397,
    marketMid: 0.976294,
    bankMid: 0.9447,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50277,
    foreignAtMarketMid: 56719,
    foreignAtBankMid: 56529,
    diffForeign: 6442,
    diffTWD: 3408,
    diffPct: 12.8,
    cashSell: 0.5967,
    marketMid: 0.528919,
    bankMid: 0.5307,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16638588,
    foreignAtBankMid: 16393443,
    diffForeign: 2877120,
    diffTWD: 5188,
    diffPct: 20.9,
    cashSell: 0.00218,
    marketMid: 0.001803,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3575,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3932,
    diffForeign: 231,
    diffTWD: 1824,
    diffPct: 6.5,
    cashSell: 8.392,
    marketMid: 7.881836,
    bankMid: 7.6295,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24314940,
    foreignAtBankMid: 25104603,
    diffForeign: 2886369,
    diffTWD: 3561,
    diffPct: 13.5,
    cashSell: 0.0014,
    marketMid: 0.001234,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/10 07:28:10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-10';
