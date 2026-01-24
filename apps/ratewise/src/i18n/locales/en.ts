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
    openCalculatorFrom: 'Open calculator (Amount)',
    openCalculatorTo: 'Open calculator (Result)',
    swapCurrencies: 'Swap currencies',
    clickToSwap: 'Click to swap',
    addToHistory: 'Add to history',
    spotRate: 'Spot',
    cashRate: 'Cash',
    switchToSpot: 'Switch to spot rate',
    switchToCash: 'Switch to cash rate',
    viewTrendChart: 'View trend chart',
    fromAmountLabel: 'Amount ({{code}})',
    toAmountLabel: 'Result ({{code}})',
  },

  // Multi Currency Converter
  multiConverter: {
    title: 'Multi-Currency',
    description:
      'Tap currency row to set base · Tap amount to open calculator · Tap ⭐ to add favorite',
    instantConversion: 'Real-time multi-currency conversion',
    addToFavorites: 'Tap ⭐ to add to favorites',
    baseCurrency: 'Base currency',
    spotOnlyNote: '{{code}} spot rate only',
    cashOnlyNote: '{{code}} cash rate only',
    calculating: 'Calculating...',
    noData: 'No data',
    amountClickCalculator: '{{name}} ({{code}}) amount, click to open calculator',
    currencyListLabel: 'Currency list',
    addFavorite: 'Add {{code}} to favorites',
    removeFavorite: 'Remove {{code}} from favorites',
    switchToSpot: 'Switch to spot rate',
    switchToCash: 'Switch to cash rate',
    spotRate: 'Spot',
    cashRate: 'Cash',
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
    dragToReorder: 'Drag to reorder',
    dragHandle: 'Drag handle',
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
    allCurrencies: 'All Currencies',
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
    copyFailed: 'Copy failed',
    clearAllAriaLabel: 'Clear all history',
    reconvertAriaLabel: 'Reconvert {{amount}} {{from}} to {{to}}',
    copyAriaLabel: 'Copy conversion result',
  },

  // Calculator
  calculator: {
    title: 'Calculator',
    clear: 'Clear',
    backspace: 'Backspace',
    confirm: 'Confirm',
    invalidExpression: 'Invalid expression',
    divideByZero: 'Cannot divide by zero',
    close: 'Close calculator',
    currentExpression: 'Current expression',
    inputPlaceholder: 'Enter number or expression',
    previewResult: 'Preview result {{value}}',
    calculationResult: 'Calculation Result',
    resultIs: 'Result is {{value}}',
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
    rateLoadFailed: 'Failed to load rates',
    networkCheckRetry:
      'Unable to fetch latest exchange rates. Please check your connection and try again.',
    dataLoadFailed: 'Failed to load data. Please try again.',
    networkError: 'Network error',
    unknownError: 'Unknown error',
    tryAgain: 'Please try again later',
    reload: 'Reload',
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
    taiwanBankFull: 'Taiwan Bank (Official Exchange Rates)',
    dataSource: 'Data source',
    updateTime: 'Update time',
    source: 'Source',
    refresh: 'Refresh',
    disclaimer:
      'Exchange rates are based on Taiwan Bank official rates (cash and spot selling rates). Actual transaction rates may vary.',
    disclaimerDesktop:
      'Exchange rates from Taiwan Bank, updated every 5 minutes. For reference only.',
    faq: 'FAQ',
    about: 'About Us',
    appName: 'RateWise',
    allRightsReserved: 'All rights reserved.',
    createdBy: 'Created by',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'Open Source on',
  },
};

export default en;
