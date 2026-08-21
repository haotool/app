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
 * 匯率時間：2026/08/21 10:59:27
 * 生成日期：2026-08-21
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
    foreignAtMarketMid: 942,
    foreignAtBankMid: 942,
    diffForeign: 9,
    diffTWD: 287,
    diffPct: 1,
    cashSell: 32.17,
    marketMid: 31.862355,
    bankMid: 31.835,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146915,
    foreignAtMarketMid: 149339,
    foreignAtBankMid: 151668,
    diffForeign: 2424,
    diffTWD: 487,
    diffPct: 1.6,
    cashSell: 0.2042,
    marketMid: 0.200886,
    bankMid: 0.1978,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 793,
    foreignAtMarketMid: 805,
    foreignAtBankMid: 807,
    diffForeign: 12,
    diffTWD: 460,
    diffPct: 1.6,
    cashSell: 37.84,
    marketMid: 37.259212,
    bankMid: 37.17,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 691,
    diffForeign: 15,
    diffTWD: 664,
    diffPct: 2.3,
    cashSell: 44.47,
    marketMid: 43.485824,
    bankMid: 43.41,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6237,
    foreignAtMarketMid: 6342,
    foreignAtBankMid: 6344,
    diffForeign: 105,
    diffTWD: 497,
    diffPct: 1.7,
    cashSell: 4.81,
    marketMid: 4.730369,
    bankMid: 4.729,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1187648,
    foreignAtMarketMid: 1312407,
    foreignAtBankMid: 1287001,
    diffForeign: 124759,
    diffTWD: 2852,
    diffPct: 10.5,
    cashSell: 0.02526,
    marketMid: 0.022859,
    bankMid: 0.02331,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-21',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7290,
    foreignAtMarketMid: 7379,
    foreignAtBankMid: 7476,
    diffForeign: 89,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 4.115,
    marketMid: 4.065867,
    bankMid: 4.013,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1295,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1318,
    diffForeign: 28,
    diffTWD: 625,
    diffPct: 2.1,
    cashSell: 23.16,
    marketMid: 22.677794,
    bankMid: 22.77,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1296,
    foreignAtBankMid: 1297,
    diffForeign: 24,
    diffTWD: 569,
    diffPct: 1.9,
    cashSell: 23.59,
    marketMid: 23.142255,
    bankMid: 23.135,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1179,
    foreignAtMarketMid: 1197,
    foreignAtBankMid: 1200,
    diffForeign: 18,
    diffTWD: 445,
    diffPct: 1.5,
    cashSell: 25.45,
    marketMid: 25.072082,
    bankMid: 24.995,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 744,
    foreignAtMarketMid: 752,
    foreignAtBankMid: 755,
    diffForeign: 8,
    diffTWD: 318,
    diffPct: 1.1,
    cashSell: 40.32,
    marketMid: 39.893087,
    bankMid: 39.72,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1545,
    foreignAtMarketMid: 1583,
    foreignAtBankMid: 1579,
    diffForeign: 38,
    diffTWD: 724,
    diffPct: 2.5,
    cashSell: 19.42,
    marketMid: 18.951598,
    bankMid: 18.995,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29002,
    foreignAtMarketMid: 30908,
    foreignAtBankMid: 31935,
    diffForeign: 1906,
    diffTWD: 1849,
    diffPct: 6.6,
    cashSell: 1.0344,
    marketMid: 0.970633,
    bankMid: 0.9394,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51432,
    foreignAtMarketMid: 58149,
    foreignAtBankMid: 57993,
    diffForeign: 6717,
    diffTWD: 3466,
    diffPct: 13.1,
    cashSell: 0.5833,
    marketMid: 0.515914,
    bankMid: 0.5173,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16703476,
    foreignAtBankMid: 16853933,
    diffForeign: 2618969,
    diffTWD: 4704,
    diffPct: 18.6,
    cashSell: 0.00213,
    marketMid: 0.001796,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3577,
    foreignAtMarketMid: 3804,
    foreignAtBankMid: 3935,
    diffForeign: 227,
    diffTWD: 1789,
    diffPct: 6.3,
    cashSell: 8.387,
    marketMid: 7.886871,
    bankMid: 7.6245,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24495910,
    foreignAtBankMid: 24896266,
    diffForeign: 3219314,
    diffTWD: 3943,
    diffPct: 15.1,
    cashSell: 0.00141,
    marketMid: 0.001225,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/21 10:59:27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-21';
