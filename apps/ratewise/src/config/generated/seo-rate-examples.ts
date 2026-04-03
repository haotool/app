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
 * 匯率時間：2026/04/03 11:53:16
 * 生成日期：2026-04-03
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
    foreignAtCash: 930,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 940,
    diffForeign: 8,
    diffTWD: 246,
    diffPct: 0.8,
    cashSell: 32.25,
    marketMid: 31.98567,
    bankMid: 31.915,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147059,
    foreignAtMarketMid: 149696,
    foreignAtBankMid: 151822,
    diffForeign: 2637,
    diffTWD: 529,
    diffPct: 1.8,
    cashSell: 0.204,
    marketMid: 0.200406,
    bankMid: 0.1976,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 37.42,
    marketMid: 36.873156,
    bankMid: 36.75,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 694,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 712,
    diffForeign: 16,
    diffTWD: 663,
    diffPct: 2.3,
    cashSell: 43.22,
    marketMid: 42.265427,
    bankMid: 42.16,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6365,
    foreignAtMarketMid: 6456,
    foreignAtBankMid: 6477,
    diffForeign: 91,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 4.713,
    marketMid: 4.64684,
    bankMid: 4.632,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1284797,
    foreignAtMarketMid: 1418202,
    foreignAtBankMid: 1401869,
    diffForeign: 133405,
    diffTWD: 2822,
    diffPct: 10.4,
    cashSell: 0.02335,
    marketMid: 0.021154,
    bankMid: 0.0214,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.6,
        rateBuy: 47,
        rateInverse: 0.021459,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-03',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7266,
    foreignAtMarketMid: 7357,
    foreignAtBankMid: 7450,
    diffForeign: 91,
    diffTWD: 371,
    diffPct: 1.3,
    cashSell: 4.129,
    marketMid: 4.077921,
    bankMid: 4.027,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1335,
    foreignAtMarketMid: 1359,
    foreignAtBankMid: 1358,
    diffForeign: 24,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 22.48,
    marketMid: 22.082855,
    bankMid: 22.09,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1307,
    diffForeign: 24,
    diffTWD: 556,
    diffPct: 1.9,
    cashSell: 23.4,
    marketMid: 22.966331,
    bankMid: 22.945,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1212,
    diffForeign: 17,
    diffTWD: 424,
    diffPct: 1.4,
    cashSell: 25.21,
    marketMid: 24.853365,
    bankMid: 24.755,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 742,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 753,
    diffForeign: 8,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 40.43,
    marketMid: 40.004801,
    bankMid: 39.83,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1610,
    foreignAtMarketMid: 1640,
    foreignAtBankMid: 1648,
    diffForeign: 30,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 18.63,
    marketMid: 18.288557,
    bankMid: 18.205,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28852,
    foreignAtMarketMid: 30647,
    foreignAtBankMid: 31753,
    diffForeign: 1795,
    diffTWD: 1757,
    diffPct: 6.2,
    cashSell: 1.0398,
    marketMid: 0.978894,
    bankMid: 0.9448,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50226,
    foreignAtMarketMid: 56696,
    foreignAtBankMid: 56465,
    diffForeign: 6470,
    diffTWD: 3424,
    diffPct: 12.9,
    cashSell: 0.5973,
    marketMid: 0.529133,
    bankMid: 0.5313,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 15933382,
    foreignAtBankMid: 16393443,
    diffForeign: 2171914,
    diffTWD: 4089,
    diffPct: 15.8,
    cashSell: 0.00218,
    marketMid: 0.001883,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3560,
    foreignAtMarketMid: 3789,
    foreignAtBankMid: 3914,
    diffForeign: 229,
    diffTWD: 1810,
    diffPct: 6.4,
    cashSell: 8.427,
    marketMid: 7.918597,
    bankMid: 7.6645,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24672332,
    foreignAtBankMid: 25531915,
    diffForeign: 2933202,
    diffTWD: 3567,
    diffPct: 13.5,
    cashSell: 0.00138,
    marketMid: 0.001216,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/03 11:53:16';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-03';
