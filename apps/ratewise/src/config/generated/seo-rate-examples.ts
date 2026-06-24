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
 * 匯率時間：2026/06/24 13:47:22
 * 生成日期：2026-06-24
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
    foreignAtMarketMid: 946,
    foreignAtBankMid: 948,
    diffForeign: 8,
    diffTWD: 262,
    diffPct: 0.9,
    cashSell: 31.99,
    marketMid: 31.710798,
    bankMid: 31.655,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 150075,
    foreignAtMarketMid: 152985,
    foreignAtBankMid: 155039,
    diffForeign: 2910,
    diffTWD: 571,
    diffPct: 1.9,
    cashSell: 0.1999,
    marketMid: 0.196098,
    bankMid: 0.1935,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 820,
    foreignAtMarketMid: 832,
    foreignAtBankMid: 835,
    diffForeign: 12,
    diffTWD: 417,
    diffPct: 1.4,
    cashSell: 36.58,
    marketMid: 36.071132,
    bankMid: 35.91,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 701,
    foreignAtMarketMid: 717,
    foreignAtBankMid: 719,
    diffForeign: 16,
    diffTWD: 674,
    diffPct: 2.3,
    cashSell: 42.79,
    marketMid: 41.828753,
    bankMid: 41.73,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6349,
    foreignAtMarketMid: 6426,
    foreignAtBankMid: 6460,
    diffForeign: 77,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 4.725,
    marketMid: 4.668534,
    bankMid: 4.644,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1318681,
    foreignAtMarketMid: 1450428,
    foreignAtBankMid: 1442308,
    diffForeign: 131747,
    diffTWD: 2725,
    diffPct: 10,
    cashSell: 0.02275,
    marketMid: 0.020684,
    bankMid: 0.0208,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.85,
        rateBuy: 47.2,
        rateInverse: 0.021345,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-24',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7330,
    foreignAtMarketMid: 7427,
    foreignAtBankMid: 7517,
    diffForeign: 97,
    diffTWD: 395,
    diffPct: 1.3,
    cashSell: 4.093,
    marketMid: 4.039147,
    bankMid: 3.991,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1344,
    foreignAtMarketMid: 1367,
    foreignAtBankMid: 1368,
    diffForeign: 23,
    diffTWD: 495,
    diffPct: 1.7,
    cashSell: 22.32,
    marketMid: 21.951969,
    bankMid: 21.93,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1320,
    foreignAtMarketMid: 1345,
    foreignAtBankMid: 1347,
    diffForeign: 25,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 22.73,
    marketMid: 22.309477,
    bankMid: 22.275,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1210,
    foreignAtMarketMid: 1227,
    foreignAtBankMid: 1233,
    diffForeign: 17,
    diffTWD: 415,
    diffPct: 1.4,
    cashSell: 24.79,
    marketMid: 24.446889,
    bankMid: 24.335,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 767,
    foreignAtBankMid: 771,
    diffForeign: 8,
    diffTWD: 299,
    diffPct: 1,
    cashSell: 39.51,
    marketMid: 39.115979,
    bankMid: 38.91,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1638,
    foreignAtMarketMid: 1668,
    foreignAtBankMid: 1676,
    diffForeign: 30,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 18.32,
    marketMid: 17.981731,
    bankMid: 17.895,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29644,
    foreignAtMarketMid: 31475,
    foreignAtBankMid: 32715,
    diffForeign: 1831,
    diffTWD: 1745,
    diffPct: 6.2,
    cashSell: 1.012,
    marketMid: 0.953129,
    bankMid: 0.917,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51458,
    foreignAtMarketMid: 57943,
    foreignAtBankMid: 58027,
    diffForeign: 6485,
    diffTWD: 3358,
    diffPct: 12.6,
    cashSell: 0.583,
    marketMid: 0.517748,
    bankMid: 0.517,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16894459,
    foreignAtBankMid: 16853933,
    diffForeign: 2809952,
    diffTWD: 4990,
    diffPct: 20,
    cashSell: 0.00213,
    marketMid: 0.001776,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3676,
    foreignAtMarketMid: 3922,
    foreignAtBankMid: 4055,
    diffForeign: 246,
    diffTWD: 1879,
    diffPct: 6.7,
    cashSell: 8.16,
    marketMid: 7.648944,
    bankMid: 7.3975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24822603,
    foreignAtBankMid: 25316456,
    diffForeign: 3239869,
    diffTWD: 3916,
    diffPct: 15,
    cashSell: 0.00139,
    marketMid: 0.001209,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/24 13:47:22';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-24';
