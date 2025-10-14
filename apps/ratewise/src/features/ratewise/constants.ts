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
} as const;

export const DEFAULT_FROM_CURRENCY = 'TWD';
export const DEFAULT_TO_CURRENCY = 'USD';
export const DEFAULT_BASE_CURRENCY = 'TWD';

export const DEFAULT_FAVORITES = ['TWD', 'USD', 'JPY', 'KRW'] as const;
export const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000] as const;
