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
 * 匯率時間：2026/05/01 03:49:12
 * 生成日期：2026-04-30
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
    diffTWD: 251,
    diffPct: 0.8,
    cashSell: 31.92,
    marketMid: 31.652581,
    bankMid: 31.585,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145702,
    foreignAtMarketMid: 151893,
    foreignAtBankMid: 150376,
    diffForeign: 6191,
    diffTWD: 1223,
    diffPct: 4.2,
    cashSell: 0.2059,
    marketMid: 0.197508,
    bankMid: 0.1995,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 811,
    foreignAtBankMid: 811,
    diffForeign: 14,
    diffTWD: 549,
    diffPct: 1.9,
    cashSell: 37.66,
    marketMid: 36.97131,
    bankMid: 36.99,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 683,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 700,
    diffForeign: 20,
    diffTWD: 863,
    diffPct: 3,
    cashSell: 43.93,
    marketMid: 42.665756,
    bankMid: 42.87,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6383,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6495,
    diffForeign: 112,
    diffTWD: 517,
    diffPct: 1.8,
    cashSell: 4.7,
    marketMid: 4.618938,
    bankMid: 4.619,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1269573,
    foreignAtMarketMid: 1407649,
    foreignAtBankMid: 1383764,
    diffForeign: 138076,
    diffTWD: 2943,
    diffPct: 10.9,
    cashSell: 0.02363,
    marketMid: 0.021312,
    bankMid: 0.02168,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.3,
        rateBuy: 45.4,
        rateInverse: 0.022075,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-30',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7339,
    foreignAtMarketMid: 7434,
    foreignAtBankMid: 7526,
    diffForeign: 95,
    diffTWD: 385,
    diffPct: 1.3,
    cashSell: 4.088,
    marketMid: 4.035594,
    bankMid: 3.986,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1329,
    foreignAtBankMid: 1318,
    diffForeign: 33,
    diffTWD: 753,
    diffPct: 2.6,
    cashSell: 23.15,
    marketMid: 22.568778,
    bankMid: 22.76,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1266,
    foreignAtMarketMid: 1299,
    foreignAtBankMid: 1291,
    diffForeign: 33,
    diffTWD: 764,
    diffPct: 2.6,
    cashSell: 23.7,
    marketMid: 23.096288,
    bankMid: 23.245,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1214,
    foreignAtBankMid: 1213,
    diffForeign: 23,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 25.18,
    marketMid: 24.713936,
    bankMid: 24.725,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 734,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 745,
    diffForeign: 16,
    diffTWD: 616,
    diffPct: 2.1,
    cashSell: 40.85,
    marketMid: 40.011203,
    bankMid: 40.25,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1577,
    foreignAtMarketMid: 1623,
    foreignAtBankMid: 1613,
    diffForeign: 46,
    diffTWD: 844,
    diffPct: 2.9,
    cashSell: 19.02,
    marketMid: 18.48463,
    bankMid: 18.595,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29005,
    foreignAtMarketMid: 31043,
    foreignAtBankMid: 31939,
    diffForeign: 2038,
    diffTWD: 1970,
    diffPct: 7,
    cashSell: 1.0343,
    marketMid: 0.966392,
    bankMid: 0.9393,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51529,
    foreignAtMarketMid: 58481,
    foreignAtBankMid: 58117,
    diffForeign: 6952,
    diffTWD: 3566,
    diffPct: 13.5,
    cashSell: 0.5822,
    marketMid: 0.512988,
    bankMid: 0.5162,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16427702,
    foreignAtBankMid: 16393443,
    diffForeign: 2666234,
    diffTWD: 4869,
    diffPct: 19.4,
    cashSell: 0.00218,
    marketMid: 0.001826,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3541,
    foreignAtMarketMid: 3751,
    foreignAtBankMid: 3891,
    diffForeign: 210,
    diffTWD: 1682,
    diffPct: 5.9,
    cashSell: 8.472,
    marketMid: 7.997121,
    bankMid: 7.7095,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24953621,
    foreignAtBankMid: 25751073,
    diffForeign: 3055811,
    diffTWD: 3674,
    diffPct: 14,
    cashSell: 0.00137,
    marketMid: 0.001202,
    bankMid: 0.001165,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/01 03:49:12';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-30';
