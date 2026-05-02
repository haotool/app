/**
 * English Translation
 */

import { APP_INFO, getCopyrightYears } from '../../config/app-info';

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
    clickToCopy: 'Click to copy',
  },

  // Navigation
  nav: {
    mainNavigation: 'Main Navigation',
    singleCurrency: 'Single',
    multiCurrency: 'Multi',
    favorites: 'Favorites',
    settings: 'Settings',
    singleCurrencyFull: 'Single Currency',
    multiCurrencyFull: 'Multi Currency',
    favoritesFull: 'Favorites & History',
    settingsFull: 'App Settings',
    breadcrumb: 'Breadcrumb Navigation',
    home: 'Home',
  },

  // App
  app: {
    title: APP_INFO.shortName,
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
    addedToHistory: 'Added to history',
    spotRate: 'Spot',
    cashRate: 'Cash',
    switchToSpot: 'Switch to spot rate',
    switchToCash: 'Switch to cash rate',
    rateTypeUnavailable: '{{rateType}} rate is currently unavailable',
    rateTypeUnavailableForCurrencies:
      '{{currencies}} does not provide {{rateType}} rate, switched to {{fallbackType}}',
    viewTrendChart: 'View trend chart',
    fromAmountLabel: 'Amount ({{code}})',
    toAmountLabel: 'Result ({{code}})',
    backToConverter: 'Back to Converter',
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
    allCurrencies: 'All Currencies',
    starred: 'Starred',
    otherCurrencies: 'Other Currencies',
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
    dragToFavorite: 'Drag to favorite',
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
    copyright: `© ${getCopyrightYears()} ${APP_INFO.shortName}`,
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
    // Rate Mode section
    rateMode: 'Rate Mode',
    rateModeAuto: 'Smart',
    rateModeAutoDesc:
      'Direction-aware: spot rate for online wire, cash rate for counter exchange — mirrors your real FX cost',
    rateModeSell: 'Sell Rate',
    rateModeSellDesc:
      'Bank sell rate throughout: spot for online banking wire, cash for counter exchange',
    rateModeMid: 'Ref Rate',
    rateModeMidDesc:
      'Buy/sell midpoint, less precise — useful as a forex market reference for traders',
    // Support & Info section
    supportInfo: 'Support & Info',
    faq: 'FAQ',
    usageGuide: 'Usage Guide',
    aboutUs: 'About Us',
    openSource: 'Open Source',
    privacyPolicy: 'Privacy Policy',
    openDataApi: 'Open Data API',
    seoTech: 'SEO Technology',
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
    reconvertAriaLabel: 'Quick convert {{from}} to {{to}}',
    copyAriaLabel: 'Copy conversion result',
    entryAriaLabel: '{{amount}} {{from}} converted to {{result}} {{to}}',
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
    offlineModeTitle: 'Offline Mode',
    offlineModeDescription:
      'This page needs a network connection to load. It will retry automatically when you are back online, or you can retry manually below.',
    routeLoadFailedTitle: 'Page Load Failed',
    routeLoadFailedDescription:
      'A recent update may have left cached assets out of sync. Please reload the page.',
    crashTitle: 'Oops! An error occurred',
    crashDescription: 'Sorry, the app has encountered an issue. Please try refreshing the page.',
    errorDetails: 'Error Details (Dev Mode)',
    clearCacheHint:
      'If the problem persists, try clearing your browser cache or contact the author via:',
    appLoadTimeout: 'App Load Timeout',
    appLoadTimeoutDesc:
      'Loading took longer than expected, possibly due to expired cache or a network issue. Please force reload to get the latest version.',
    forceReload: 'Force Reload (Clear Cache)',
    reloading: 'Reloading...',
    cacheHint: 'Also try: Settings → Clear browser cache, or contact',
    reloadPage: 'Reload Page',
    rateStaleWarning:
      'Using the last available exchange rates for now. Rates will update automatically when the connection recovers.',
    rateLoadDescription:
      "Sorry, we couldn't fetch the latest exchange rates. Please check your connection and try again.",
  },

  // PWA
  pwa: {
    updateAvailable: 'New version available',
    refresh: 'Refresh',
    dismiss: 'Later',
    pullToRefresh: 'Pull to refresh',
    offlineReadyTitle: 'Offline Ready',
    offlineReadyDescription: 'Use anytime, anywhere',
    needRefreshTitle: 'New Version Available',
    needRefreshDescription: 'Tap update for latest features',
    actionUpdate: 'Update',
    actionClose: 'Close notification',
    updatingTitle: 'Updating',
    updatingDescription: 'Please wait...',
    updateFailedTitle: 'Update Failed',
    updateFailedDescription: 'Please retry or check network',
    registrationFailedTitle: 'Background updater failed to start',
    registrationFailedDescription:
      'The update worker could not start. Reload the page, and contact the author if it keeps happening.',
    actionRetry: 'Retry',
    actionReload: 'Reload',
    releaseToRefresh: 'Release to refresh',
    refreshing: 'Refreshing...',
  },

  support: {
    reportIssueLead: 'If this problem keeps happening, contact the author directly.',
    reportIssueHint:
      'Include the error screen, reproduction steps, and device details so the issue can be diagnosed quickly.',
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
    appName: APP_INFO.shortName,
    allRightsReserved: 'All rights reserved.',
    createdBy: 'Created by',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'Open Source on',
    footerNav: 'Footer Navigation',
    privacyPolicy: 'Privacy Policy',
  },

  // Rating Modal
  rating: {
    title: `Enjoying ${APP_INFO.shortName}?`,
    subtitle: 'Your rating helps others discover this tool ✨',
    starsLabel: 'Star rating',
    submit: 'Submit Rating',
    submitting: 'Submitting...',
    later: 'Maybe Later',
    dismiss: 'Do Not Ask Again',
    thankYou: 'Thank you for your rating!',
  },
};

export default en;
