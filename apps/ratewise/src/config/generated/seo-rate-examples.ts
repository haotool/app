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
 * 匯率時間：2026/09/04 09:06:56
 * 生成日期：2026-09-04
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
    foreignAtCash: 938,
    foreignAtMarketMid: 947,
    foreignAtBankMid: 948,
    diffForeign: 9,
    diffTWD: 289,
    diffPct: 1,
    cashSell: 31.995,
    marketMid: 31.686682,
    bankMid: 31.66,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144718,
    foreignAtMarketMid: 147469,
    foreignAtBankMid: 149328,
    diffForeign: 2751,
    diffTWD: 560,
    diffPct: 1.9,
    cashSell: 0.2073,
    marketMid: 0.203432,
    bankMid: 0.2009,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 459,
    diffPct: 1.6,
    cashSell: 37.42,
    marketMid: 36.847341,
    bankMid: 36.75,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 684,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 701,
    diffForeign: 16,
    diffTWD: 666,
    diffPct: 2.3,
    cashSell: 43.85,
    marketMid: 42.876131,
    bankMid: 42.79,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6267,
    foreignAtMarketMid: 6354,
    foreignAtBankMid: 6375,
    diffForeign: 87,
    diffTWD: 411,
    diffPct: 1.4,
    cashSell: 4.787,
    marketMid: 4.721435,
    bankMid: 4.706,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1175549,
    foreignAtMarketMid: 1284766,
    foreignAtBankMid: 1272804,
    diffForeign: 109217,
    diffTWD: 2550,
    diffPct: 9.3,
    cashSell: 0.02552,
    marketMid: 0.023351,
    bankMid: 0.02357,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.8,
        rateBuy: 42,
        rateInverse: 0.023923,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-04',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7328,
    foreignAtMarketMid: 7420,
    foreignAtBankMid: 7515,
    diffForeign: 92,
    diffTWD: 372,
    diffPct: 1.3,
    cashSell: 4.094,
    marketMid: 4.043279,
    bankMid: 3.992,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1313,
    diffForeign: 25,
    diffTWD: 574,
    diffPct: 1.9,
    cashSell: 23.24,
    marketMid: 22.79566,
    bankMid: 22.85,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1281,
    foreignAtMarketMid: 1305,
    foreignAtBankMid: 1306,
    diffForeign: 24,
    diffTWD: 560,
    diffPct: 1.9,
    cashSell: 23.42,
    marketMid: 22.982694,
    bankMid: 22.965,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1182,
    foreignAtMarketMid: 1200,
    foreignAtBankMid: 1204,
    diffForeign: 18,
    diffTWD: 440,
    diffPct: 1.5,
    cashSell: 25.38,
    marketMid: 25.008128,
    bankMid: 24.925,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 756,
    foreignAtMarketMid: 764,
    foreignAtBankMid: 768,
    diffForeign: 8,
    diffTWD: 315,
    diffPct: 1.1,
    cashSell: 39.66,
    marketMid: 39.243387,
    bankMid: 39.06,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1574,
    foreignAtMarketMid: 1610,
    foreignAtBankMid: 1610,
    diffForeign: 36,
    diffTWD: 674,
    diffPct: 2.3,
    cashSell: 19.06,
    marketMid: 18.632036,
    bankMid: 18.635,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29277,
    foreignAtMarketMid: 31166,
    foreignAtBankMid: 32268,
    diffForeign: 1889,
    diffTWD: 1818,
    diffPct: 6.5,
    cashSell: 1.0247,
    marketMid: 0.962586,
    bankMid: 0.9297,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52274,
    foreignAtMarketMid: 59217,
    foreignAtBankMid: 59067,
    diffForeign: 6943,
    diffTWD: 3517,
    diffPct: 13.3,
    cashSell: 0.5739,
    marketMid: 0.506612,
    bankMid: 0.5079,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16712867,
    foreignAtBankMid: 16853933,
    diffForeign: 2628360,
    diffTWD: 4718,
    diffPct: 18.7,
    cashSell: 0.00213,
    marketMid: 0.001795,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3594,
    foreignAtMarketMid: 3825,
    foreignAtBankMid: 3955,
    diffForeign: 231,
    diffTWD: 1808,
    diffPct: 6.4,
    cashSell: 8.347,
    marketMid: 7.843999,
    bankMid: 7.5845,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24516704,
    foreignAtBankMid: 25104603,
    diffForeign: 3088133,
    diffTWD: 3779,
    diffPct: 14.4,
    cashSell: 0.0014,
    marketMid: 0.001224,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/04 09:06:56';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-04';
