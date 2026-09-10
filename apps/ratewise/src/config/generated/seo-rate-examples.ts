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
 * 匯率時間：2026/09/10 13:18:52
 * 生成日期：2026-09-10
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
    foreignAtCash: 944,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 954,
    diffForeign: 9,
    diffTWD: 306,
    diffPct: 1,
    cashSell: 31.795,
    marketMid: 31.470292,
    bankMid: 31.46,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143472,
    foreignAtMarketMid: 146345,
    foreignAtBankMid: 148002,
    diffForeign: 2873,
    diffTWD: 589,
    diffPct: 2,
    cashSell: 0.2091,
    marketMid: 0.204995,
    bankMid: 0.2027,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 819,
    foreignAtBankMid: 821,
    diffForeign: 13,
    diffTWD: 463,
    diffPct: 1.6,
    cashSell: 37.21,
    marketMid: 36.635404,
    bankMid: 36.54,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 687,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 704,
    diffForeign: 16,
    diffTWD: 675,
    diffPct: 2.3,
    cashSell: 43.65,
    marketMid: 42.667577,
    bankMid: 42.59,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6296,
    foreignAtMarketMid: 6393,
    foreignAtBankMid: 6405,
    diffForeign: 97,
    diffTWD: 456,
    diffPct: 1.5,
    cashSell: 4.765,
    marketMid: 4.692633,
    bankMid: 4.684,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1165954,
    foreignAtMarketMid: 1278369,
    foreignAtBankMid: 1261564,
    diffForeign: 112415,
    diffTWD: 2638,
    diffPct: 9.6,
    cashSell: 0.02573,
    marketMid: 0.023467,
    bankMid: 0.02378,
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
        rateDate: '2026-09-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7375,
    foreignAtMarketMid: 7471,
    foreignAtBankMid: 7564,
    diffForeign: 96,
    diffTWD: 387,
    diffPct: 1.3,
    cashSell: 4.068,
    marketMid: 4.0155,
    bankMid: 3.966,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1319,
    diffForeign: 24,
    diffTWD: 543,
    diffPct: 1.8,
    cashSell: 23.14,
    marketMid: 22.721076,
    bankMid: 22.75,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1317,
    diffForeign: 24,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 23.24,
    marketMid: 22.810739,
    bankMid: 22.785,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1187,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1209,
    diffForeign: 18,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 25.27,
    marketMid: 24.904739,
    bankMid: 24.815,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 762,
    foreignAtMarketMid: 771,
    foreignAtBankMid: 774,
    diffForeign: 9,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 39.35,
    marketMid: 38.899911,
    bankMid: 38.75,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1595,
    foreignAtMarketMid: 1631,
    foreignAtBankMid: 1632,
    diffForeign: 36,
    diffTWD: 673,
    diffPct: 2.3,
    cashSell: 18.81,
    marketMid: 18.388099,
    bankMid: 18.385,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29452,
    foreignAtMarketMid: 31367,
    foreignAtBankMid: 32482,
    diffForeign: 1915,
    diffTWD: 1831,
    diffPct: 6.5,
    cashSell: 1.0186,
    marketMid: 0.956428,
    bankMid: 0.9236,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52595,
    foreignAtMarketMid: 59663,
    foreignAtBankMid: 59477,
    diffForeign: 7068,
    diffTWD: 3554,
    diffPct: 13.4,
    cashSell: 0.5704,
    marketMid: 0.502825,
    bankMid: 0.5044,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16684253,
    foreignAtBankMid: 16853933,
    diffForeign: 2599746,
    diffTWD: 4675,
    diffPct: 18.5,
    cashSell: 0.00213,
    marketMid: 0.001798,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3632,
    foreignAtMarketMid: 3880,
    foreignAtBankMid: 4001,
    diffForeign: 248,
    diffTWD: 1918,
    diffPct: 6.8,
    cashSell: 8.26,
    marketMid: 7.731799,
    bankMid: 7.4975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24592843,
    foreignAtBankMid: 25104603,
    diffForeign: 3164272,
    diffTWD: 3860,
    diffPct: 14.8,
    cashSell: 0.0014,
    marketMid: 0.00122,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/10 13:18:52';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-10';
