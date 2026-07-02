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
 * 匯率時間：2026/06/29 14:56:34
 * 生成日期：2026-07-02
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
    foreignAtCash: 933,
    foreignAtMarketMid: 940,
    foreignAtBankMid: 943,
    diffForeign: 7,
    diffTWD: 224,
    diffPct: 0.8,
    cashSell: 32.16,
    marketMid: 31.920327,
    bankMid: 31.825,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149477,
    foreignAtMarketMid: 153203,
    foreignAtBankMid: 154400,
    diffForeign: 3726,
    diffTWD: 730,
    diffPct: 2.5,
    cashSell: 0.2007,
    marketMid: 0.195818,
    bankMid: 0.1943,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 813,
    foreignAtMarketMid: 826,
    foreignAtBankMid: 828,
    diffForeign: 13,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 36.91,
    marketMid: 36.321371,
    bankMid: 36.24,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 711,
    foreignAtBankMid: 714,
    diffForeign: 15,
    diffTWD: 619,
    diffPct: 2.1,
    cashSell: 43.09,
    marketMid: 42.201215,
    bankMid: 42.03,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6306,
    foreignAtMarketMid: 6396,
    foreignAtBankMid: 6416,
    diffForeign: 90,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 4.757,
    marketMid: 4.690432,
    bankMid: 4.676,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1313485,
    foreignAtMarketMid: 1458116,
    foreignAtBankMid: 1436094,
    diffForeign: 144631,
    diffTWD: 2976,
    diffPct: 11,
    cashSell: 0.02284,
    marketMid: 0.020575,
    bankMid: 0.02089,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.9,
        rateBuy: 47,
        rateInverse: 0.021322,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-07-02',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7294,
    foreignAtMarketMid: 7389,
    foreignAtBankMid: 7479,
    diffForeign: 95,
    diffTWD: 387,
    diffPct: 1.3,
    cashSell: 4.113,
    marketMid: 4.059908,
    bankMid: 4.011,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1339,
    foreignAtMarketMid: 1363,
    foreignAtBankMid: 1363,
    diffForeign: 24,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 22.4,
    marketMid: 22.004137,
    bankMid: 22.01,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1338,
    foreignAtBankMid: 1336,
    diffForeign: 29,
    diffTWD: 631,
    diffPct: 2.1,
    cashSell: 22.91,
    marketMid: 22.428062,
    bankMid: 22.455,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1200,
    foreignAtMarketMid: 1221,
    foreignAtBankMid: 1223,
    diffForeign: 21,
    diffTWD: 493,
    diffPct: 1.7,
    cashSell: 24.99,
    marketMid: 24.579083,
    bankMid: 24.535,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 753,
    foreignAtMarketMid: 761,
    foreignAtBankMid: 765,
    diffForeign: 8,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 39.82,
    marketMid: 39.407314,
    bankMid: 39.22,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1656,
    foreignAtBankMid: 1668,
    diffForeign: 26,
    diffTWD: 479,
    diffPct: 1.6,
    cashSell: 18.41,
    marketMid: 18.11627,
    bankMid: 17.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29438,
    foreignAtMarketMid: 31337,
    foreignAtBankMid: 32464,
    diffForeign: 1899,
    diffTWD: 1818,
    diffPct: 6.5,
    cashSell: 1.0191,
    marketMid: 0.957329,
    bankMid: 0.9241,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51099,
    foreignAtMarketMid: 57952,
    foreignAtBankMid: 57571,
    diffForeign: 6853,
    diffTWD: 3548,
    diffPct: 13.4,
    cashSell: 0.5871,
    marketMid: 0.517674,
    bankMid: 0.5211,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16896695,
    foreignAtBankMid: 16853933,
    diffForeign: 2812188,
    diffTWD: 4993,
    diffPct: 20,
    cashSell: 0.00213,
    marketMid: 0.001775,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3591,
    foreignAtMarketMid: 3851,
    foreignAtBankMid: 3951,
    diffForeign: 260,
    diffTWD: 2027,
    diffPct: 7.2,
    cashSell: 8.355,
    marketMid: 7.790528,
    bankMid: 7.5925,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24664275,
    foreignAtBankMid: 25104603,
    diffForeign: 3235704,
    diffTWD: 3936,
    diffPct: 15.1,
    cashSell: 0.0014,
    marketMid: 0.001216,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/29 14:56:34';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-07-02';
