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
 * 匯率時間：2026/09/12 03:57:08
 * 生成日期：2026-09-12
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
    foreignAtMarketMid: 950,
    foreignAtBankMid: 950,
    diffForeign: 10,
    diffTWD: 307,
    diffPct: 1,
    cashSell: 31.91,
    marketMid: 31.583602,
    bankMid: 31.575,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143198,
    foreignAtMarketMid: 145773,
    foreignAtBankMid: 147710,
    diffForeign: 2575,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 0.2095,
    marketMid: 0.205799,
    bankMid: 0.2031,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 821,
    diffForeign: 12,
    diffTWD: 435,
    diffPct: 1.5,
    cashSell: 37.22,
    marketMid: 36.679749,
    bankMid: 36.55,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 703,
    diffForeign: 16,
    diffTWD: 670,
    diffPct: 2.3,
    cashSell: 43.73,
    marketMid: 42.753313,
    bankMid: 42.67,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6270,
    foreignAtMarketMid: 6369,
    foreignAtBankMid: 6378,
    diffForeign: 99,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 4.785,
    marketMid: 4.710316,
    bankMid: 4.704,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1163693,
    foreignAtMarketMid: 1274753,
    foreignAtBankMid: 1258917,
    diffForeign: 111060,
    diffTWD: 2614,
    diffPct: 9.5,
    cashSell: 0.02578,
    marketMid: 0.023534,
    bankMid: 0.02383,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 42,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-12',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7348,
    foreignAtMarketMid: 7443,
    foreignAtBankMid: 7536,
    diffForeign: 95,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 4.083,
    marketMid: 4.03073,
    bankMid: 3.981,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1299,
    foreignAtMarketMid: 1324,
    foreignAtBankMid: 1322,
    diffForeign: 25,
    diffTWD: 560,
    diffPct: 1.9,
    cashSell: 23.09,
    marketMid: 22.658781,
    bankMid: 22.7,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1316,
    diffForeign: 26,
    diffTWD: 574,
    diffPct: 2,
    cashSell: 23.25,
    marketMid: 22.805017,
    bankMid: 22.795,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1202,
    foreignAtBankMid: 1207,
    diffForeign: 17,
    diffTWD: 414,
    diffPct: 1.4,
    cashSell: 25.31,
    marketMid: 24.960687,
    bankMid: 24.855,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 765,
    foreignAtMarketMid: 772,
    foreignAtBankMid: 777,
    diffForeign: 7,
    diffTWD: 257,
    diffPct: 0.9,
    cashSell: 39.2,
    marketMid: 38.863628,
    bankMid: 38.6,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1597,
    foreignAtMarketMid: 1633,
    foreignAtBankMid: 1634,
    diffForeign: 36,
    diffTWD: 670,
    diffPct: 2.3,
    cashSell: 18.79,
    marketMid: 18.370534,
    bankMid: 18.365,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29435,
    foreignAtMarketMid: 31323,
    foreignAtBankMid: 32461,
    diffForeign: 1888,
    diffTWD: 1809,
    diffPct: 6.4,
    cashSell: 1.0192,
    marketMid: 0.957758,
    bankMid: 0.9242,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52466,
    foreignAtMarketMid: 59592,
    foreignAtBankMid: 59312,
    diffForeign: 7126,
    diffTWD: 3588,
    diffPct: 13.6,
    cashSell: 0.5718,
    marketMid: 0.50342,
    bankMid: 0.5058,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16702277,
    foreignAtBankMid: 17341040,
    diffForeign: 2279200,
    diffTWD: 4094,
    diffPct: 15.8,
    cashSell: 0.00208,
    marketMid: 0.001796,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3625,
    foreignAtMarketMid: 3862,
    foreignAtBankMid: 3993,
    diffForeign: 237,
    diffTWD: 1838,
    diffPct: 6.5,
    cashSell: 8.275,
    marketMid: 7.768137,
    bankMid: 7.5125,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24565587,
    foreignAtBankMid: 25316456,
    diffForeign: 2982853,
    diffTWD: 3643,
    diffPct: 13.8,
    cashSell: 0.00139,
    marketMid: 0.001221,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/12 03:57:08';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-12';
