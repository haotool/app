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
 * 匯率時間：2026/08/28 14:27:38
 * 生成日期：2026-08-28
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
    foreignAtCash: 942,
    foreignAtMarketMid: 947,
    foreignAtBankMid: 952,
    diffForeign: 5,
    diffTWD: 166,
    diffPct: 0.6,
    cashSell: 31.855,
    marketMid: 31.678652,
    bankMid: 31.52,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148810,
    foreignAtMarketMid: 150772,
    foreignAtBankMid: 153689,
    diffForeign: 1962,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 0.2016,
    marketMid: 0.198976,
    bankMid: 0.1952,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 804,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 819,
    diffForeign: 8,
    diffTWD: 299,
    diffPct: 1,
    cashSell: 37.31,
    marketMid: 36.938534,
    bankMid: 36.64,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 684,
    foreignAtMarketMid: 696,
    foreignAtBankMid: 701,
    diffForeign: 12,
    diffTWD: 517,
    diffPct: 1.8,
    cashSell: 43.85,
    marketMid: 43.094161,
    bankMid: 42.79,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6299,
    foreignAtMarketMid: 6345,
    foreignAtBankMid: 6408,
    diffForeign: 46,
    diffTWD: 220,
    diffPct: 0.7,
    cashSell: 4.763,
    marketMid: 4.728132,
    bankMid: 4.682,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1191422,
    foreignAtMarketMid: 1308721,
    foreignAtBankMid: 1291433,
    diffForeign: 117299,
    diffTWD: 2689,
    diffPct: 9.8,
    cashSell: 0.02518,
    marketMid: 0.022923,
    bankMid: 0.02323,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.15,
        rateBuy: 42.5,
        rateInverse: 0.023725,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-28',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7358,
    foreignAtMarketMid: 7420,
    foreignAtBankMid: 7547,
    diffForeign: 62,
    diffTWD: 250,
    diffPct: 0.8,
    cashSell: 4.077,
    marketMid: 4.043067,
    bankMid: 3.975,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1320,
    diffForeign: 19,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 23.12,
    marketMid: 22.786829,
    bankMid: 22.73,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1292,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1318,
    diffForeign: 20,
    diffTWD: 449,
    diffPct: 1.5,
    cashSell: 23.22,
    marketMid: 22.872304,
    bankMid: 22.765,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1213,
    diffForeign: 12,
    diffTWD: 295,
    diffPct: 1,
    cashSell: 25.19,
    marketMid: 24.942632,
    bankMid: 24.735,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 757,
    foreignAtMarketMid: 761,
    foreignAtBankMid: 769,
    diffForeign: 4,
    diffTWD: 150,
    diffPct: 0.5,
    cashSell: 39.62,
    marketMid: 39.421295,
    bankMid: 39.02,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1563,
    foreignAtMarketMid: 1591,
    foreignAtBankMid: 1598,
    diffForeign: 28,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 19.2,
    marketMid: 18.856539,
    bankMid: 18.775,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29429,
    foreignAtMarketMid: 31106,
    foreignAtBankMid: 32453,
    diffForeign: 1677,
    diffTWD: 1617,
    diffPct: 5.7,
    cashSell: 1.0194,
    marketMid: 0.964446,
    bankMid: 0.9244,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52301,
    foreignAtMarketMid: 58684,
    foreignAtBankMid: 59102,
    diffForeign: 6383,
    diffTWD: 3263,
    diffPct: 12.2,
    cashSell: 0.5736,
    marketMid: 0.511212,
    bankMid: 0.5076,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16803782,
    foreignAtBankMid: 16853933,
    diffForeign: 2719275,
    diffTWD: 4855,
    diffPct: 19.3,
    cashSell: 0.00213,
    marketMid: 0.001785,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3598,
    foreignAtMarketMid: 3818,
    foreignAtBankMid: 3960,
    diffForeign: 220,
    diffTWD: 1729,
    diffPct: 6.1,
    cashSell: 8.339,
    marketMid: 7.858361,
    bankMid: 7.5765,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24615073,
    foreignAtBankMid: 25104603,
    diffForeign: 3186502,
    diffTWD: 3884,
    diffPct: 14.9,
    cashSell: 0.0014,
    marketMid: 0.001219,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/28 14:27:38';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-28';
