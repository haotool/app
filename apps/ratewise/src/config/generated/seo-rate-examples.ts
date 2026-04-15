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
 * 匯率時間：2026/04/15 23:45:06
 * 生成日期：2026-04-15
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
    foreignAtCash: 940,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 950,
    diffForeign: 10,
    diffTWD: 327,
    diffPct: 1.1,
    cashSell: 31.91,
    marketMid: 31.562668,
    bankMid: 31.575,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148002,
    foreignAtMarketMid: 150975,
    foreignAtBankMid: 152827,
    diffForeign: 2973,
    diffTWD: 591,
    diffPct: 2,
    cashSell: 0.2027,
    marketMid: 0.198709,
    bankMid: 0.1963,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 792,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 806,
    diffForeign: 14,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 37.89,
    marketMid: 37.220382,
    bankMid: 37.22,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 684,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 701,
    diffForeign: 17,
    diffTWD: 725,
    diffPct: 2.5,
    cashSell: 43.88,
    marketMid: 42.819217,
    bankMid: 42.82,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6373,
    foreignAtMarketMid: 6468,
    foreignAtBankMid: 6485,
    diffForeign: 95,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 4.707,
    marketMid: 4.638219,
    bankMid: 4.626,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1269036,
    foreignAtMarketMid: 1399604,
    foreignAtBankMid: 1383126,
    diffForeign: 130568,
    diffTWD: 2799,
    diffPct: 10.3,
    cashSell: 0.02364,
    marketMid: 0.021435,
    bankMid: 0.02169,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.8,
        rateBuy: 45,
        rateInverse: 0.022321,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7342,
    foreignAtMarketMid: 7447,
    foreignAtBankMid: 7530,
    diffForeign: 105,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 4.086,
    marketMid: 4.028441,
    bankMid: 3.984,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1301,
    foreignAtMarketMid: 1334,
    foreignAtBankMid: 1323,
    diffForeign: 33,
    diffTWD: 737,
    diffPct: 2.5,
    cashSell: 23.06,
    marketMid: 22.493646,
    bankMid: 22.67,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1304,
    diffForeign: 28,
    diffTWD: 656,
    diffPct: 2.2,
    cashSell: 23.46,
    marketMid: 22.946832,
    bankMid: 23.005,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1208,
    foreignAtBankMid: 1211,
    diffForeign: 18,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 25.22,
    marketMid: 24.824984,
    bankMid: 24.765,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 733,
    foreignAtMarketMid: 742,
    foreignAtBankMid: 744,
    diffForeign: 9,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 40.9,
    marketMid: 40.412204,
    bankMid: 40.3,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1573,
    foreignAtMarketMid: 1611,
    foreignAtBankMid: 1609,
    diffForeign: 38,
    diffTWD: 700,
    diffPct: 2.4,
    cashSell: 19.07,
    marketMid: 18.624749,
    bankMid: 18.645,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28569,
    foreignAtMarketMid: 30432,
    foreignAtBankMid: 31410,
    diffForeign: 1863,
    diffTWD: 1837,
    diffPct: 6.5,
    cashSell: 1.0501,
    marketMid: 0.985799,
    bankMid: 0.9551,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50599,
    foreignAtMarketMid: 56921,
    foreignAtBankMid: 56937,
    diffForeign: 6322,
    diffTWD: 3332,
    diffPct: 12.5,
    cashSell: 0.5929,
    marketMid: 0.527046,
    bankMid: 0.5269,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16298122,
    foreignAtBankMid: 16393443,
    diffForeign: 2536654,
    diffTWD: 4669,
    diffPct: 18.4,
    cashSell: 0.00218,
    marketMid: 0.001841,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3528,
    foreignAtMarketMid: 3756,
    foreignAtBankMid: 3876,
    diffForeign: 228,
    diffTWD: 1822,
    diffPct: 6.5,
    cashSell: 8.503,
    marketMid: 7.98671,
    bankMid: 7.7405,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24592192,
    foreignAtBankMid: 25751073,
    diffForeign: 2694382,
    diffTWD: 3287,
    diffPct: 12.3,
    cashSell: 0.00137,
    marketMid: 0.00122,
    bankMid: 0.001165,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/15 23:45:06';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-15';
