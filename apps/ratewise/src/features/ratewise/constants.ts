export const CURRENCY_DEFINITIONS = {
  TWD: { name: '新台幣', flag: '🇹🇼', symbol: 'NT$' },
  USD: { name: '美元', flag: '🇺🇸', symbol: '$' },
  HKD: { name: '港幣', flag: '🇭🇰', symbol: 'HK$' },
  GBP: { name: '英鎊', flag: '🇬🇧', symbol: '£' },
  AUD: { name: '澳幣', flag: '🇦🇺', symbol: 'A$' },
  CAD: { name: '加幣', flag: '🇨🇦', symbol: 'C$' },
  SGD: { name: '新加坡幣', flag: '🇸🇬', symbol: 'S$' },
  CHF: { name: '瑞士法郎', flag: '🇨🇭', symbol: 'CHF' },
  JPY: { name: '日圓', flag: '🇯🇵', symbol: '¥' },
  EUR: { name: '歐元', flag: '🇪🇺', symbol: '€' },
  KRW: { name: '韓元', flag: '🇰🇷', symbol: '₩' },
  CNY: { name: '人民幣', flag: '🇨🇳', symbol: '¥' },
} as const;

export const DEFAULT_FROM_CURRENCY = 'TWD';
export const DEFAULT_TO_CURRENCY = 'USD';
export const DEFAULT_BASE_CURRENCY = 'TWD';

export const DEFAULT_FAVORITES = ['TWD', 'USD', 'JPY', 'KRW'] as const;
export const QUICK_AMOUNTS = [100, 1000, 5000, 10000] as const;
