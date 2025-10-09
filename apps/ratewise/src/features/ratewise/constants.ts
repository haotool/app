export const CURRENCY_DEFINITIONS = {
  TWD: { name: '新台幣', flag: '🇹🇼', rate: 1, symbol: 'NT$' },
  USD: { name: '美元', flag: '🇺🇸', rate: 30.775, symbol: '$' },
  HKD: { name: '港幣', flag: '🇭🇰', rate: 3.968, symbol: 'HK$' },
  GBP: { name: '英鎊', flag: '🇬🇧', rate: 41.83, symbol: '£' },
  AUD: { name: '澳幣', flag: '🇦🇺', rate: 20.54, symbol: 'A$' },
  CAD: { name: '加幣', flag: '🇨🇦', rate: 22.3, symbol: 'C$' },
  SGD: { name: '新加坡幣', flag: '🇸🇬', rate: 23.9, symbol: 'S$' },
  CHF: { name: '瑞士法郎', flag: '🇨🇭', rate: 38.48, symbol: 'CHF' },
  JPY: { name: '日圓', flag: '🇯🇵', rate: 0.2035, symbol: '¥' },
  EUR: { name: '歐元', flag: '🇪🇺', rate: 36.04, symbol: '€' },
  KRW: { name: '韓元', flag: '🇰🇷', rate: 0.02367, symbol: '₩' },
  CNY: { name: '人民幣', flag: '🇨🇳', rate: 4.343, symbol: '¥' },
} as const;

export const DEFAULT_FROM_CURRENCY = 'TWD';
export const DEFAULT_TO_CURRENCY = 'USD';
export const DEFAULT_BASE_CURRENCY = 'TWD';

export const DEFAULT_FAVORITES = ['TWD', 'USD', 'JPY', 'KRW'] as const;
export const QUICK_AMOUNTS = [100, 1000, 5000, 10000] as const;
