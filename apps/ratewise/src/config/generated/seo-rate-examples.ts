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
 * 匯率時間：2026/04/24 07:55:51
 * 生成日期：2026-04-24
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
    foreignAtCash: 942,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 952,
    diffForeign: 8,
    diffTWD: 253,
    diffPct: 0.8,
    cashSell: 31.845,
    marketMid: 31.576621,
    bankMid: 31.51,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149031,
    foreignAtMarketMid: 151763,
    foreignAtBankMid: 153925,
    diffForeign: 2732,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 0.2013,
    marketMid: 0.197676,
    bankMid: 0.1949,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 37.43,
    marketMid: 36.904454,
    bankMid: 36.76,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 708,
    diffForeign: 15,
    diffTWD: 632,
    diffPct: 2.2,
    cashSell: 43.45,
    marketMid: 42.535091,
    bankMid: 42.39,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6402,
    foreignAtMarketMid: 6504,
    foreignAtBankMid: 6515,
    diffForeign: 102,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 4.686,
    marketMid: 4.612546,
    bankMid: 4.605,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1277139,
    foreignAtMarketMid: 1408273,
    foreignAtBankMid: 1392758,
    diffForeign: 131134,
    diffTWD: 2793,
    diffPct: 10.3,
    cashSell: 0.02349,
    marketMid: 0.021303,
    bankMid: 0.02154,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.3,
        rateBuy: 45.4,
        rateInverse: 0.022075,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-24',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7353,
    foreignAtMarketMid: 7445,
    foreignAtBankMid: 7541,
    diffForeign: 92,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 4.08,
    marketMid: 4.029317,
    bankMid: 3.978,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1330,
    foreignAtBankMid: 1332,
    diffForeign: 21,
    diffTWD: 465,
    diffPct: 1.6,
    cashSell: 22.91,
    marketMid: 22.554526,
    bankMid: 22.52,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1303,
    diffForeign: 24,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 23.47,
    marketMid: 23.049441,
    bankMid: 23.015,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1214,
    foreignAtBankMid: 1220,
    diffForeign: 16,
    diffTWD: 398,
    diffPct: 1.3,
    cashSell: 25.04,
    marketMid: 24.70783,
    bankMid: 24.585,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 747,
    foreignAtBankMid: 751,
    diffForeign: 7,
    diffTWD: 292,
    diffPct: 1,
    cashSell: 40.56,
    marketMid: 40.165482,
    bankMid: 39.96,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1591,
    foreignAtMarketMid: 1620,
    foreignAtBankMid: 1627,
    diffForeign: 29,
    diffTWD: 544,
    diffPct: 1.8,
    cashSell: 18.86,
    marketMid: 18.518176,
    bankMid: 18.435,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29022,
    foreignAtMarketMid: 30818,
    foreignAtBankMid: 31959,
    diffForeign: 1796,
    diffTWD: 1749,
    diffPct: 6.2,
    cashSell: 1.0337,
    marketMid: 0.973446,
    bankMid: 0.9387,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50986,
    foreignAtMarketMid: 57490,
    foreignAtBankMid: 57427,
    diffForeign: 6504,
    diffTWD: 3394,
    diffPct: 12.8,
    cashSell: 0.5884,
    marketMid: 0.521831,
    bankMid: 0.5224,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16437331,
    foreignAtBankMid: 16393443,
    diffForeign: 2675863,
    diffTWD: 4884,
    diffPct: 19.4,
    cashSell: 0.00218,
    marketMid: 0.001825,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3544,
    foreignAtMarketMid: 3768,
    foreignAtBankMid: 3894,
    diffForeign: 224,
    diffTWD: 1783,
    diffPct: 6.3,
    cashSell: 8.466,
    marketMid: 7.962734,
    bankMid: 7.7035,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24956094,
    foreignAtBankMid: 25974026,
    diffForeign: 2897270,
    diffTWD: 3483,
    diffPct: 13.1,
    cashSell: 0.00136,
    marketMid: 0.001202,
    bankMid: 0.001155,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/24 07:55:51';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-24';
