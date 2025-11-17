export const CURRENCY_DEFINITIONS = {
  TWD: { name: '新台幣', flag: '🇹🇼', symbol: 'NT$', decimals: 2 },
  USD: { name: '美元', flag: '🇺🇸', symbol: '$', decimals: 2 },
  HKD: { name: '港幣', flag: '🇭🇰', symbol: 'HK$', decimals: 2 },
  GBP: { name: '英鎊', flag: '🇬🇧', symbol: '£', decimals: 2 },
  AUD: { name: '澳幣', flag: '🇦🇺', symbol: 'A$', decimals: 2 },
  CAD: { name: '加幣', flag: '🇨🇦', symbol: 'C$', decimals: 2 },
  SGD: { name: '新加坡幣', flag: '🇸🇬', symbol: 'S$', decimals: 2 },
  CHF: { name: '瑞士法郎', flag: '🇨🇭', symbol: 'CHF', decimals: 2 },
  JPY: { name: '日圓', flag: '🇯🇵', symbol: '¥', decimals: 0 },
  EUR: { name: '歐元', flag: '🇪🇺', symbol: '€', decimals: 2 },
  KRW: { name: '韓元', flag: '🇰🇷', symbol: '₩', decimals: 0 },
  CNY: { name: '人民幣', flag: '🇨🇳', symbol: '¥', decimals: 2 },
  // 新增東南亞與大洋洲幣別（與台灣銀行牌告匯率同步）
  NZD: { name: '紐元', flag: '🇳🇿', symbol: 'NZ$', decimals: 2 },
  THB: { name: '泰銖', flag: '🇹🇭', symbol: '฿', decimals: 2 },
  PHP: { name: '菲律賓披索', flag: '🇵🇭', symbol: '₱', decimals: 2 },
  IDR: { name: '印尼盾', flag: '🇮🇩', symbol: 'Rp', decimals: 0 },
  VND: { name: '越南盾', flag: '🇻🇳', symbol: '₫', decimals: 0 },
  MYR: { name: '馬來幣', flag: '🇲🇾', symbol: 'RM', decimals: 2 },
} as const;

export const DEFAULT_FROM_CURRENCY = 'TWD';
export const DEFAULT_TO_CURRENCY = 'USD';
export const DEFAULT_BASE_CURRENCY = 'TWD';

export const DEFAULT_FAVORITES = ['TWD', 'USD', 'JPY', 'KRW'] as const;

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
