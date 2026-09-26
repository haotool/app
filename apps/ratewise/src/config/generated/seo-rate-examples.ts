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
 * 匯率時間：2026/09/26 06:44:18
 * 生成日期：2026-09-26
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
    foreignAtCash: 936,
    foreignAtMarketMid: 944,
    foreignAtBankMid: 946,
    diffForeign: 8,
    diffTWD: 261,
    diffPct: 0.9,
    cashSell: 32.05,
    marketMid: 31.771247,
    bankMid: 31.715,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145843,
    foreignAtMarketMid: 148674,
    foreignAtBankMid: 150527,
    diffForeign: 2831,
    diffTWD: 571,
    diffPct: 1.9,
    cashSell: 0.2057,
    marketMid: 0.201784,
    bankMid: 0.1993,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 817,
    foreignAtMarketMid: 829,
    foreignAtBankMid: 832,
    diffForeign: 12,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 36.74,
    marketMid: 36.191234,
    bankMid: 36.07,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 714,
    diffForeign: 16,
    diffTWD: 681,
    diffPct: 2.3,
    cashSell: 43.05,
    marketMid: 42.073376,
    bankMid: 41.99,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6258,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6365,
    diffForeign: 72,
    diffTWD: 342,
    diffPct: 1.2,
    cashSell: 4.794,
    marketMid: 4.739336,
    bankMid: 4.713,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1170503,
    foreignAtMarketMid: 1282912,
    foreignAtBankMid: 1266892,
    diffForeign: 112409,
    diffTWD: 2629,
    diffPct: 9.6,
    cashSell: 0.02563,
    marketMid: 0.023384,
    bankMid: 0.02368,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 41.8,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-26',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7317,
    foreignAtMarketMid: 7402,
    foreignAtBankMid: 7504,
    diffForeign: 85,
    diffTWD: 344,
    diffPct: 1.2,
    cashSell: 4.1,
    marketMid: 4.052948,
    bankMid: 3.998,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1320,
    foreignAtMarketMid: 1344,
    foreignAtBankMid: 1343,
    diffForeign: 24,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 22.72,
    marketMid: 22.313459,
    bankMid: 22.33,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1335,
    foreignAtBankMid: 1337,
    diffForeign: 24,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 22.89,
    marketMid: 22.466357,
    bankMid: 22.435,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1212,
    diffForeign: 16,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 25.21,
    marketMid: 24.868199,
    bankMid: 24.755,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 774,
    foreignAtMarketMid: 782,
    foreignAtBankMid: 786,
    diffForeign: 8,
    diffTWD: 285,
    diffPct: 1,
    cashSell: 38.75,
    marketMid: 38.381822,
    bankMid: 38.15,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1635,
    foreignAtMarketMid: 1667,
    foreignAtBankMid: 1674,
    diffForeign: 32,
    diffTWD: 583,
    diffPct: 2,
    cashSell: 18.35,
    marketMid: 17.993378,
    bankMid: 17.925,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29618,
    foreignAtMarketMid: 31529,
    foreignAtBankMid: 32683,
    diffForeign: 1911,
    diffTWD: 1818,
    diffPct: 6.5,
    cashSell: 1.0129,
    marketMid: 0.951507,
    bankMid: 0.9179,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52174,
    foreignAtMarketMid: 59066,
    foreignAtBankMid: 58939,
    diffForeign: 6892,
    diffTWD: 3501,
    diffPct: 13.2,
    cashSell: 0.575,
    marketMid: 0.507905,
    bankMid: 0.509,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16914103,
    foreignAtBankMid: 17341040,
    diffForeign: 2491026,
    diffTWD: 4418,
    diffPct: 17.3,
    cashSell: 0.00208,
    marketMid: 0.001774,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3614,
    foreignAtMarketMid: 3851,
    foreignAtBankMid: 3980,
    diffForeign: 237,
    diffTWD: 1846,
    diffPct: 6.6,
    cashSell: 8.3,
    marketMid: 7.789254,
    bankMid: 7.5375,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24520451,
    foreignAtBankMid: 25316456,
    diffForeign: 2937717,
    diffTWD: 3594,
    diffPct: 13.6,
    cashSell: 0.00139,
    marketMid: 0.001223,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/26 06:44:18';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-26';
