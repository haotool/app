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
 * 匯率時間：2026/05/04 08:11:37
 * 生成日期：2026-05-04
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
    foreignAtCash: 940,
    foreignAtMarketMid: 948,
    foreignAtBankMid: 950,
    diffForeign: 8,
    diffTWD: 250,
    diffPct: 0.8,
    cashSell: 31.92,
    marketMid: 31.653583,
    bankMid: 31.585,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145985,
    foreignAtMarketMid: 148767,
    foreignAtBankMid: 150678,
    diffForeign: 2782,
    diffTWD: 561,
    diffPct: 1.9,
    cashSell: 0.2055,
    marketMid: 0.201658,
    bankMid: 0.1991,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 809,
    foreignAtBankMid: 811,
    diffForeign: 12,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 37.66,
    marketMid: 37.102998,
    bankMid: 36.99,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 683,
    foreignAtMarketMid: 698,
    foreignAtBankMid: 700,
    diffForeign: 15,
    diffTWD: 644,
    diffPct: 2.2,
    cashSell: 43.93,
    marketMid: 42.986717,
    bankMid: 42.87,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6380,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6492,
    diffForeign: 115,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 4.702,
    marketMid: 4.618938,
    bankMid: 4.621,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1268499,
    foreignAtMarketMid: 1394697,
    foreignAtBankMid: 1382488,
    diffForeign: 126198,
    diffTWD: 2715,
    diffPct: 9.9,
    cashSell: 0.02365,
    marketMid: 0.02151,
    bankMid: 0.0217,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.5,
        rateBuy: 45.1,
        rateInverse: 0.022472,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-04',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7339,
    foreignAtMarketMid: 7430,
    foreignAtBankMid: 7526,
    diffForeign: 91,
    diffTWD: 370,
    diffPct: 1.2,
    cashSell: 4.088,
    marketMid: 4.037631,
    bankMid: 3.986,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1292,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1314,
    diffForeign: 23,
    diffTWD: 516,
    diffPct: 1.8,
    cashSell: 23.22,
    marketMid: 22.82063,
    bankMid: 22.83,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1265,
    foreignAtMarketMid: 1288,
    foreignAtBankMid: 1290,
    diffForeign: 23,
    diffTWD: 533,
    diffPct: 1.8,
    cashSell: 23.71,
    marketMid: 23.288852,
    bankMid: 23.255,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1213,
    diffForeign: 16,
    diffTWD: 403,
    diffPct: 1.4,
    cashSell: 25.19,
    marketMid: 24.851512,
    bankMid: 24.735,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 733,
    foreignAtMarketMid: 741,
    foreignAtBankMid: 744,
    diffForeign: 8,
    diffTWD: 304,
    diffPct: 1,
    cashSell: 40.92,
    marketMid: 40.505509,
    bankMid: 40.32,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1574,
    foreignAtMarketMid: 1605,
    foreignAtBankMid: 1610,
    diffForeign: 31,
    diffTWD: 586,
    diffPct: 2,
    cashSell: 19.06,
    marketMid: 18.687397,
    bankMid: 18.635,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28946,
    foreignAtMarketMid: 30779,
    foreignAtBankMid: 31867,
    diffForeign: 1833,
    diffTWD: 1786,
    diffPct: 6.3,
    cashSell: 1.0364,
    marketMid: 0.974689,
    bankMid: 0.9414,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51546,
    foreignAtMarketMid: 58180,
    foreignAtBankMid: 58140,
    diffForeign: 6634,
    diffTWD: 3420,
    diffPct: 12.9,
    cashSell: 0.582,
    marketMid: 0.515644,
    bankMid: 0.516,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16410328,
    foreignAtBankMid: 16393443,
    diffForeign: 2648860,
    diffTWD: 4842,
    diffPct: 19.2,
    cashSell: 0.00218,
    marketMid: 0.001828,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3541,
    foreignAtMarketMid: 3767,
    foreignAtBankMid: 3891,
    diffForeign: 226,
    diffTWD: 1796,
    diffPct: 6.4,
    cashSell: 8.472,
    marketMid: 7.9647,
    bankMid: 7.7095,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24886771,
    foreignAtBankMid: 25751073,
    diffForeign: 2988961,
    diffTWD: 3603,
    diffPct: 13.6,
    cashSell: 0.00137,
    marketMid: 0.001205,
    bankMid: 0.001165,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/04 08:11:37';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-04';
