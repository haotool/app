/**
 * 貨幣定義 (SSOT)
 *
 * @description 所有支援的貨幣定義，順序基於台灣人旅遊熱門目的地。
 *
 * 資料來源：2024-2025 台灣出境旅遊統計
 * 1. 日本（第一名）
 * 2. 南韓
 * 3. 中國大陸
 * 4. 越南
 * 5. 泰國
 * 6. 香港
 * 7. 菲律賓
 * 8. 馬來西亞
 * 9. 新加坡
 * 10. 澳門（使用港幣）
 *
 * @see https://www.businessweekly.com.tw/business/blog/3019355
 * @updated 2026-01-26 - 依據台灣人旅遊熱門目的地重新排序
 */
export const CURRENCY_DEFINITIONS = {
  // 基準貨幣
  TWD: { name: '新台幣', flag: '🇹🇼', symbol: 'NT$', decimals: 2 },
  // 台灣人旅遊熱門目的地 (依據 2024-2025 出境統計排序)
  JPY: { name: '日圓', flag: '🇯🇵', symbol: '¥', decimals: 0 },
  KRW: { name: '韓元', flag: '🇰🇷', symbol: '₩', decimals: 0 },
  CNY: { name: '人民幣', flag: '🇨🇳', symbol: '¥', decimals: 2 },
  VND: { name: '越南盾', flag: '🇻🇳', symbol: '₫', decimals: 0 },
  THB: { name: '泰銖', flag: '🇹🇭', symbol: '฿', decimals: 2 },
  HKD: { name: '港幣', flag: '🇭🇰', symbol: 'HK$', decimals: 2 },
  PHP: { name: '菲律賓披索', flag: '🇵🇭', symbol: '₱', decimals: 2 },
  MYR: { name: '馬來幣', flag: '🇲🇾', symbol: 'RM', decimals: 2 },
  SGD: { name: '新加坡幣', flag: '🇸🇬', symbol: 'S$', decimals: 2 },
  // 其他主要貨幣 (依據全球外匯交易量排序)
  USD: { name: '美元', flag: '🇺🇸', symbol: '$', decimals: 2 },
  EUR: { name: '歐元', flag: '🇪🇺', symbol: '€', decimals: 2 },
  GBP: { name: '英鎊', flag: '🇬🇧', symbol: '£', decimals: 2 },
  CHF: { name: '瑞士法郎', flag: '🇨🇭', symbol: 'CHF', decimals: 2 },
  AUD: { name: '澳幣', flag: '🇦🇺', symbol: 'A$', decimals: 2 },
  CAD: { name: '加幣', flag: '🇨🇦', symbol: 'C$', decimals: 2 },
  NZD: { name: '紐元', flag: '🇳🇿', symbol: 'NZ$', decimals: 2 },
  IDR: { name: '印尼盾', flag: '🇮🇩', symbol: 'Rp', decimals: 0 },
} as const;

/** 支援幣別總數（含 TWD） */
export const SUPPORTED_CURRENCY_COUNT = Object.keys(CURRENCY_DEFINITIONS).length;

export const DEFAULT_FROM_CURRENCY = 'TWD';
export const DEFAULT_TO_CURRENCY = 'JPY'; // 日本為台灣人最熱門旅遊目的地
export const DEFAULT_BASE_CURRENCY = 'TWD';

/**
 * 預設收藏貨幣 (SSOT)
 *
 * @description 基於台灣人旅遊熱門目的地排序
 *              日本、韓國、越南、泰國為前 5 名目的地
 */
export const DEFAULT_FAVORITES = ['JPY', 'KRW', 'VND', 'THB', 'HKD', 'USD'] as const;

// 各貨幣常見兌換金額（基於旅遊者和商務人士實際使用習慣）
export const CURRENCY_QUICK_AMOUNTS = {
  TWD: [100, 500, 1000, 3000, 5000], // 新台幣：小額消費到中額消費
  USD: [10, 20, 50, 100, 500], // 美元：常見紙鈔面額
  EUR: [10, 20, 50, 100, 500], // 歐元：常見紙鈔面額
  GBP: [10, 20, 50, 100, 500], // 英鎊：常見紙鈔面額
  JPY: [1000, 3000, 5000, 10000, 30000], // 日圓：常見ATM提款金額
  KRW: [10000, 30000, 50000, 100000, 300000], // 韓元：常見ATM提款金額
  HKD: [100, 200, 500, 1000, 5000], // 港幣：常見消費金額
  CNY: [100, 200, 500, 1000, 5000], // 人民幣：常見消費金額
  AUD: [20, 50, 100, 200, 500], // 澳幣：常見消費金額
  CAD: [20, 50, 100, 200, 500], // 加幣：常見消費金額
  SGD: [10, 20, 50, 100, 500], // 新加坡幣：常見消費金額
  CHF: [10, 20, 50, 100, 500], // 瑞士法郎：常見消費金額
  // 新增東南亞與大洋洲幣別快速金額
  NZD: [20, 50, 100, 200, 500], // 紐元：與澳幣類似的消費習慣
  THB: [100, 300, 500, 1000, 3000], // 泰銖：街邊小吃到餐廳消費
  PHP: [500, 1000, 2000, 5000, 10000], // 菲律賓披索：計程車到餐廳消費
  IDR: [50000, 100000, 300000, 500000, 1000000], // 印尼盾：面額較大，日常消費
  VND: [100000, 200000, 500000, 1000000, 2000000], // 越南盾：面額較大，日常消費
  MYR: [10, 20, 50, 100, 500], // 馬來幣：與新加坡幣類似
} as const;

/** @deprecated 首頁 FAQ SSOT 已移至 config/seo-metadata.ts HOMEPAGE_FAQ_CONTENT，此處僅保留向後相容 */
export const HOMEPAGE_FAQ = [
  {
    question: 'RateWise 和其他匯率工具有什麼不同？',
    answer:
      'Google Finance、XE、Yahoo Finance 等工具顯示的是「中間價」（mid-rate）——買入與賣出匯率的平均值，不是你去銀行實際換匯會用的價格。RateWise 顯示臺灣銀行牌告的實際買入賣出價（現金與即期共四種報價），讓您換匯前就能知道真正要付多少台幣。以日圓為例，中間價與實際賣出價差距約 1～3%，換 10 萬日圓大約差 1,500～3,000 元台幣。',
  },
  {
    question: '支援哪些貨幣？',
    answer:
      '支援 18 種貨幣（TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等），可收藏常用貨幣。',
  },
  {
    question: '可以離線使用嗎？',
    answer: '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
  },
  {
    question: '匯率多久更新一次？',
    answer:
      '匯率數據每 5 分鐘自動同步臺灣銀行最新牌告匯率，畫面會顯示最近更新時間。您也可以在首頁下拉重新整理以手動同步。',
  },
];
