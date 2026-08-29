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
 * 匯率時間：2026/08/29 10:03:54
 * 生成日期：2026-08-29
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
    foreignAtCash: 941,
    foreignAtMarketMid: 948,
    foreignAtBankMid: 951,
    diffForeign: 7,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 31.88,
    marketMid: 31.656589,
    bankMid: 31.545,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149180,
    foreignAtMarketMid: 151600,
    foreignAtBankMid: 154083,
    diffForeign: 2420,
    diffTWD: 479,
    diffPct: 1.6,
    cashSell: 0.2011,
    marketMid: 0.19789,
    bankMid: 0.1947,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 808,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 822,
    diffForeign: 9,
    diffTWD: 344,
    diffPct: 1.2,
    cashSell: 37.15,
    marketMid: 36.724201,
    bankMid: 36.48,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 703,
    diffForeign: 14,
    diffTWD: 566,
    diffPct: 1.9,
    cashSell: 43.71,
    marketMid: 42.885325,
    bankMid: 42.65,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6299,
    foreignAtMarketMid: 6372,
    foreignAtBankMid: 6408,
    diffForeign: 73,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 4.763,
    marketMid: 4.708098,
    bankMid: 4.682,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1194268,
    foreignAtMarketMid: 1306121,
    foreignAtBankMid: 1294778,
    diffForeign: 111853,
    diffTWD: 2569,
    diffPct: 9.4,
    cashSell: 0.02512,
    marketMid: 0.022969,
    bankMid: 0.02317,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.2,
        rateBuy: 42.5,
        rateInverse: 0.023697,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7351,
    foreignAtMarketMid: 7433,
    foreignAtBankMid: 7540,
    diffForeign: 82,
    diffTWD: 329,
    diffPct: 1.1,
    cashSell: 4.081,
    marketMid: 4.036278,
    bankMid: 3.979,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1322,
    foreignAtBankMid: 1325,
    diffForeign: 19,
    diffTWD: 440,
    diffPct: 1.5,
    cashSell: 23.03,
    marketMid: 22.692203,
    bankMid: 22.64,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1295,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1321,
    diffForeign: 22,
    diffTWD: 483,
    diffPct: 1.6,
    cashSell: 23.16,
    marketMid: 22.786829,
    bankMid: 22.705,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1194,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1216,
    diffForeign: 13,
    diffTWD: 340,
    diffPct: 1.1,
    cashSell: 25.13,
    marketMid: 24.845338,
    bankMid: 24.675,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 766,
    foreignAtBankMid: 772,
    diffForeign: 6,
    diffTWD: 202,
    diffPct: 0.7,
    cashSell: 39.45,
    marketMid: 39.184953,
    bankMid: 38.85,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1574,
    foreignAtMarketMid: 1601,
    foreignAtBankMid: 1610,
    diffForeign: 27,
    diffTWD: 509,
    diffPct: 1.7,
    cashSell: 19.06,
    marketMid: 18.736767,
    bankMid: 18.635,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29557,
    foreignAtMarketMid: 31299,
    foreignAtBankMid: 32609,
    diffForeign: 1742,
    diffTWD: 1670,
    diffPct: 5.9,
    cashSell: 1.015,
    marketMid: 0.958512,
    bankMid: 0.92,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52292,
    foreignAtMarketMid: 59084,
    foreignAtBankMid: 59090,
    diffForeign: 6792,
    diffTWD: 3449,
    diffPct: 13,
    cashSell: 0.5737,
    marketMid: 0.507752,
    bankMid: 0.5077,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16757800,
    foreignAtBankMid: 17341040,
    diffForeign: 2334723,
    diffTWD: 4180,
    diffPct: 16.2,
    cashSell: 0.00208,
    marketMid: 0.00179,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3592,
    foreignAtMarketMid: 3818,
    foreignAtBankMid: 3953,
    diffForeign: 226,
    diffTWD: 1776,
    diffPct: 6.3,
    cashSell: 8.351,
    marketMid: 7.856756,
    bankMid: 7.5885,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24665743,
    foreignAtBankMid: 25531915,
    diffForeign: 2926613,
    diffTWD: 3560,
    diffPct: 13.5,
    cashSell: 0.00138,
    marketMid: 0.001216,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/29 10:03:54';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-29';
