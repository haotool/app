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
 * 匯率時間：2026/05/06 02:59:10
 * 生成日期：2026-05-06
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
    foreignAtMarketMid: 949,
    foreignAtBankMid: 951,
    diffForeign: 8,
    diffTWD: 241,
    diffPct: 0.8,
    cashSell: 31.875,
    marketMid: 31.618554,
    bankMid: 31.54,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147203,
    foreignAtMarketMid: 149813,
    foreignAtBankMid: 151976,
    diffForeign: 2610,
    diffTWD: 523,
    diffPct: 1.8,
    cashSell: 0.2038,
    marketMid: 0.20025,
    bankMid: 0.1974,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 800,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 814,
    diffForeign: 12,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 37.52,
    marketMid: 36.964477,
    bankMid: 36.85,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 703,
    diffForeign: 15,
    diffTWD: 649,
    diffPct: 2.2,
    cashSell: 43.76,
    marketMid: 42.813718,
    bankMid: 42.7,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6390,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6502,
    diffForeign: 105,
    diffTWD: 486,
    diffPct: 1.6,
    cashSell: 4.695,
    marketMid: 4.618938,
    bankMid: 4.614,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1267427,
    foreignAtMarketMid: 1393670,
    foreignAtBankMid: 1381215,
    diffForeign: 126243,
    diffTWD: 2717,
    diffPct: 10,
    cashSell: 0.02367,
    marketMid: 0.021526,
    bankMid: 0.02172,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.9,
        rateBuy: 45.3,
        rateInverse: 0.022272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-06',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7349,
    foreignAtMarketMid: 7440,
    foreignAtBankMid: 7538,
    diffForeign: 91,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 4.082,
    marketMid: 4.032161,
    bankMid: 3.98,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1320,
    diffForeign: 21,
    diffTWD: 496,
    diffPct: 1.7,
    cashSell: 23.12,
    marketMid: 22.738125,
    bankMid: 22.73,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1270,
    foreignAtMarketMid: 1293,
    foreignAtBankMid: 1294,
    diffForeign: 23,
    diffTWD: 542,
    diffPct: 1.8,
    cashSell: 23.63,
    marketMid: 23.203471,
    bankMid: 23.175,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1195,
    foreignAtMarketMid: 1211,
    foreignAtBankMid: 1217,
    diffForeign: 16,
    diffTWD: 415,
    diffPct: 1.4,
    cashSell: 25.11,
    marketMid: 24.762895,
    bankMid: 24.655,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 736,
    foreignAtMarketMid: 743,
    foreignAtBankMid: 747,
    diffForeign: 7,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 40.78,
    marketMid: 40.356754,
    bankMid: 40.18,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1580,
    foreignAtMarketMid: 1610,
    foreignAtBankMid: 1616,
    diffForeign: 30,
    diffTWD: 561,
    diffPct: 1.9,
    cashSell: 18.99,
    marketMid: 18.634814,
    bankMid: 18.565,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29059,
    foreignAtMarketMid: 30908,
    foreignAtBankMid: 32003,
    diffForeign: 1849,
    diffTWD: 1795,
    diffPct: 6.4,
    cashSell: 1.0324,
    marketMid: 0.97063,
    bankMid: 0.9374,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51697,
    foreignAtMarketMid: 58390,
    foreignAtBankMid: 58332,
    diffForeign: 6693,
    diffTWD: 3438,
    diffPct: 12.9,
    cashSell: 0.5803,
    marketMid: 0.513789,
    bankMid: 0.5143,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16528196,
    foreignAtBankMid: 16393443,
    diffForeign: 2766728,
    diffTWD: 5022,
    diffPct: 20.1,
    cashSell: 0.00218,
    marketMid: 0.001815,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3540,
    foreignAtMarketMid: 3766,
    foreignAtBankMid: 3890,
    diffForeign: 226,
    diffTWD: 1804,
    diffPct: 6.4,
    cashSell: 8.475,
    marketMid: 7.965271,
    bankMid: 7.7125,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24893173,
    foreignAtBankMid: 25751073,
    diffForeign: 2995363,
    diffTWD: 3610,
    diffPct: 13.7,
    cashSell: 0.00137,
    marketMid: 0.001205,
    bankMid: 0.001165,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/06 02:59:10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-06';
