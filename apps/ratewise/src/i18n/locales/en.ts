/**
 * English Translation
 */

const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    search: 'Search',
    clear: 'Clear',
    clearAll: 'Clear All',
    copy: 'Copy',
    copied: 'Copied',
  },

  // Navigation
  nav: {
    singleCurrency: 'Single',
    multiCurrency: 'Multi',
    favorites: 'Favorites',
    settings: 'Settings',
    singleCurrencyFull: 'Single Currency',
    multiCurrencyFull: 'Multi Currency',
    favoritesFull: 'Favorites & History',
    settingsFull: 'App Settings',
  },

  // App
  app: {
    title: 'RateWise',
    subtitle: 'Exchange Rate Tool',
    version: 'Version',
  },

  // Single Currency Converter
  singleConverter: {
    title: 'Currency Converter',
    fromAmount: 'Amount',
    toAmount: 'Result',
    selectFromCurrency: 'Select source currency',
    selectToCurrency: 'Select target currency',
    openCalculator: 'Open calculator',
    swapCurrencies: 'Swap currencies',
    clickToSwap: 'Click to swap',
    addToHistory: 'Add to history',
    spotRate: 'Spot',
    cashRate: 'Cash',
    switchToSpot: 'Switch to spot rate',
    switchToCash: 'Switch to cash rate',
    viewTrendChart: 'View trend chart',
  },

  // Multi Currency Converter
  multiConverter: {
    title: 'Multi-Currency',
    description:
      'Tap currency row to set base · Tap amount to open calculator · Tap ⭐ to add favorite',
    instantConversion: 'Real-time multi-currency conversion',
    addToFavorites: 'Tap ⭐ to add to favorites',
    baseCurrency: 'Base currency',
    spotOnlyNote: 'Spot rate only',
    cashOnlyNote: 'Cash rate only',
  },

  // Favorites
  favorites: {
    title: 'Favorite Currencies',
    history: 'Conversion History',
    noFavorites: 'No favorite currencies',
    noFavoritesHint: 'Tap ⭐ in Single or Multi currency page to add favorites',
    noHistory: 'No conversion history',
    noHistoryHint: 'Start converting currencies and history will be saved automatically',
    goToConvert: 'Go to convert',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    clickToConvert: 'Convert →',
    reconvert: 'Reconvert',
    clearAllHistory: 'Clear all history',
  },

  // Settings
  settings: {
    title: 'Settings',
    interfaceStyle: 'Interface Style',
    language: 'Language',
    storageCache: 'Storage & Cache',
    dataManagement: 'Data Management',
    about: 'About',
    dataSource: 'Exchange Rate Source',
    taiwanBank: 'Taiwan Bank',
    updateFrequency: 'Update Frequency',
    fiveMinutes: '5 minutes',
    updateNote: 'Exchange rates are updated every 5 minutes.',
    resetTheme: 'Reset Theme Settings',
    appVersion: 'App Version',
    designSystem: 'Design System',
    techStack: 'Tech Stack',
    copyright: '© 2026 RateWise. Built with Design Token SSOT',
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
  },

  // Styles
  styles: {
    zen: 'Zen',
    zenDesc: 'Minimal & Professional',
    nitro: 'Nitro',
    nitroDesc: 'Dark Tech',
    kawaii: 'Kawaii',
    kawaiiDesc: 'Cute & Pink',
    classic: 'Classic',
    classicDesc: 'Vintage Book',
    ocean: 'Ocean',
    oceanDesc: 'Deep Sea',
    forest: 'Forest',
    forestDesc: 'Natural Woods',
  },

  // Currency List
  currencyList: {
    title: 'All Currencies',
    favoriteCurrencies: 'Favorite Currencies',
    refreshTrends: 'Refresh trend data',
    currencyListLabel: 'Currency list',
  },

  // Conversion History
  conversionHistory: {
    title: 'Conversion History',
    clearAll: 'Clear All',
    copyResult: 'Copy result',
    reconvert: 'Reconvert',
    today: 'Today',
    yesterday: 'Yesterday',
  },

  // Calculator
  calculator: {
    title: 'Calculator',
    clear: 'Clear',
    backspace: 'Backspace',
    confirm: 'Confirm',
    invalidExpression: 'Invalid expression',
    divideByZero: 'Cannot divide by zero',
  },

  // Rate Info
  rateInfo: {
    source: 'Taiwan Bank Rates',
    sourceTime: 'Source',
    refreshTime: 'Refresh',
    lastUpdate: 'Last updated',
  },

  // Currency Names
  currencies: {
    TWD: 'Taiwan Dollar',
    USD: 'US Dollar',
    JPY: 'Japanese Yen',
    EUR: 'Euro',
    GBP: 'British Pound',
    HKD: 'Hong Kong Dollar',
    CNY: 'Chinese Yuan',
    KRW: 'Korean Won',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    SGD: 'Singapore Dollar',
    CHF: 'Swiss Franc',
    NZD: 'New Zealand Dollar',
    THB: 'Thai Baht',
    PHP: 'Philippine Peso',
    IDR: 'Indonesian Rupiah',
    VND: 'Vietnamese Dong',
    MYR: 'Malaysian Ringgit',
  },

  // Errors
  errors: {
    loadingFailed: 'Loading failed',
    networkError: 'Network error',
    unknownError: 'Unknown error',
    tryAgain: 'Please try again later',
  },

  // PWA
  pwa: {
    updateAvailable: 'New version available',
    refresh: 'Refresh',
    dismiss: 'Later',
    pullToRefresh: 'Pull to refresh',
  },

  // 404
  notFound: {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist or has been removed.',
    goHome: 'Go Home',
  },

  // Footer
  footer: {
    taiwanBankRates: 'Taiwan Bank Rates',
    dataSource: 'Data source',
  },
};

export default en;
