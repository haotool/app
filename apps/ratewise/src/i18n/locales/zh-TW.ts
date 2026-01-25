/**
 * 繁體中文翻譯
 */

const zhTW = {
  // Common
  common: {
    loading: '載入中...',
    error: '發生錯誤',
    retry: '重試',
    confirm: '確認',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    close: '關閉',
    back: '返回',
    next: '下一步',
    done: '完成',
    search: '搜尋',
    clear: '清除',
    clearAll: '清除全部',
    copy: '複製',
    copied: '已複製',
    clickToCopy: '點擊複製',
  },

  // Navigation
  nav: {
    singleCurrency: '單幣別',
    multiCurrency: '多幣別',
    favorites: '收藏',
    settings: '設定',
    singleCurrencyFull: '單幣別轉換',
    multiCurrencyFull: '多幣別轉換',
    favoritesFull: '收藏與歷史',
    settingsFull: '應用程式設定',
  },

  // App
  app: {
    title: 'RateWise',
    subtitle: '匯率換算工具',
    version: '版本',
  },

  // Single Currency Converter
  singleConverter: {
    title: '單幣別換算',
    fromAmount: '轉換金額',
    toAmount: '轉換結果',
    selectFromCurrency: '選擇來源貨幣',
    selectToCurrency: '選擇目標貨幣',
    openCalculator: '開啟計算機',
    openCalculatorFrom: '開啟計算機 (轉換金額)',
    openCalculatorTo: '開啟計算機 (轉換結果)',
    swapCurrencies: '交換幣別',
    clickToSwap: '點擊交換',
    addToHistory: '加入歷史記錄',
    addedToHistory: '已加入歷史記錄',
    spotRate: '即期',
    cashRate: '現金',
    switchToSpot: '切換到即期匯率',
    switchToCash: '切換到現金匯率',
    viewTrendChart: '查看趨勢圖',
    fromAmountLabel: '轉換金額 ({{code}})',
    toAmountLabel: '轉換結果 ({{code}})',
  },

  // Multi Currency Converter
  multiConverter: {
    title: '多幣別換算',
    description: '點擊貨幣行切換基準 · 點擊金額開啟計算機 · 點擊 ⭐ 加入常用',
    instantConversion: '即時多幣別換算',
    addToFavorites: '點擊 ⭐ 可加入常用',
    baseCurrency: '基準貨幣',
    spotOnlyNote: '{{code}} 僅提供即期匯率',
    cashOnlyNote: '{{code}} 僅提供現金匯率',
    calculating: '計算中...',
    noData: '無資料',
    amountClickCalculator: '{{name}} ({{code}}) 金額，點擊開啟計算機',
    currencyListLabel: '貨幣列表',
    addFavorite: '加入常用貨幣 {{code}}',
    removeFavorite: '移除常用貨幣 {{code}}',
    switchToSpot: '切換到即期匯率',
    switchToCash: '切換到現金匯率',
    spotRate: '即期',
    cashRate: '現金',
  },

  // Favorites
  favorites: {
    title: '常用貨幣',
    allCurrencies: '所有貨幣',
    starred: '已收藏',
    otherCurrencies: '其他貨幣',
    history: '轉換歷史',
    noFavorites: '尚無常用貨幣',
    noFavoritesHint: '在單幣別或多幣別頁面中點擊 ⭐ 加入常用貨幣',
    noHistory: '尚無轉換記錄',
    noHistoryHint: '開始使用匯率換算，記錄會自動保存',
    goToConvert: '前往換算',
    addFavorite: '加入常用貨幣',
    removeFavorite: '移除常用貨幣',
    clickToConvert: '換算 →',
    reconvert: '重新轉換',
    clearAllHistory: '清除全部歷史記錄',
    dragToReorder: '拖曳排序',
    dragHandle: '拖曳手柄',
  },

  // Settings
  settings: {
    title: '設定',
    interfaceStyle: '介面風格',
    language: '語言',
    storageCache: '儲存與快取',
    dataManagement: '資料管理',
    about: '關於',
    dataSource: '匯率資料來源',
    taiwanBank: '台灣銀行',
    updateFrequency: '更新頻率',
    fiveMinutes: '5 分鐘',
    updateNote: '匯率資料每 5 分鐘自動更新。',
    resetTheme: '重置主題設定',
    appVersion: '應用程式版本',
    designSystem: '設計系統',
    techStack: '技術棧',
    copyright: '© 2026 RateWise. Built with Design Token SSOT',
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
  },

  // Styles
  styles: {
    zen: 'Zen',
    zenDesc: '極簡專業',
    nitro: 'Nitro',
    nitroDesc: '深色科技感',
    kawaii: 'Kawaii',
    kawaiiDesc: '可愛粉嫩',
    classic: 'Classic',
    classicDesc: '復古書卷',
    ocean: 'Ocean',
    oceanDesc: '海洋深邃',
    forest: 'Forest',
    forestDesc: '自然森林',
  },

  // Currency List
  currencyList: {
    title: '全部幣種',
    allCurrencies: '全部幣種',
    favoriteCurrencies: '常用貨幣',
    refreshTrends: '刷新趨勢數據',
    currencyListLabel: '貨幣列表',
  },

  // Conversion History
  conversionHistory: {
    title: '轉換歷史',
    clearAll: '清除全部',
    copyResult: '複製轉換結果',
    reconvert: '重新轉換',
    today: '今天',
    yesterday: '昨天',
    copyFailed: '複製失敗',
    clearAllAriaLabel: '清除全部歷史記錄',
    reconvertAriaLabel: '重新轉換 {{amount}} {{from}} 到 {{to}}',
    copyAriaLabel: '複製轉換結果',
  },

  // Calculator
  calculator: {
    title: '計算機',
    clear: '清除',
    backspace: '退格',
    confirm: '確認',
    invalidExpression: '無效運算式',
    divideByZero: '不能除以零',
    close: '關閉計算機',
    currentExpression: '當前表達式',
    inputPlaceholder: '輸入數字或表達式',
    previewResult: '預覽結果 {{value}}',
    calculationResult: '計算結果',
    resultIs: '計算結果為 {{value}}',
  },

  // Rate Info
  rateInfo: {
    source: '臺灣銀行牌告',
    sourceTime: '來源',
    refreshTime: '刷新',
    lastUpdate: '最後更新',
  },

  // Currency Names
  currencies: {
    TWD: '新台幣',
    USD: '美元',
    JPY: '日圓',
    EUR: '歐元',
    GBP: '英鎊',
    HKD: '港幣',
    CNY: '人民幣',
    KRW: '韓元',
    AUD: '澳幣',
    CAD: '加幣',
    SGD: '新加坡幣',
    CHF: '瑞士法郎',
    NZD: '紐元',
    THB: '泰銖',
    PHP: '菲律賓披索',
    IDR: '印尼盾',
    VND: '越南盾',
    MYR: '馬來幣',
  },

  // Errors
  errors: {
    loadingFailed: '載入失敗',
    rateLoadFailed: '匯率載入失敗',
    networkCheckRetry: '無法獲取最新匯率資料，請檢查網路連線後重試。',
    dataLoadFailed: '無法載入資料，請重試。',
    networkError: '網路錯誤',
    unknownError: '未知錯誤',
    tryAgain: '請稍後再試',
    reload: '重新載入',
  },

  // PWA
  pwa: {
    updateAvailable: '有新版本可用',
    refresh: '重新整理',
    dismiss: '稍後',
    pullToRefresh: '下拉重新整理',
  },

  // 404
  notFound: {
    title: '頁面不存在',
    message: '您要找的頁面不存在或已被移除。',
    goHome: '返回首頁',
  },

  // Footer
  footer: {
    taiwanBankRates: '臺灣銀行牌告',
    taiwanBankFull: 'Taiwan Bank (臺灣銀行牌告匯率)',
    dataSource: '資料來源',
    updateTime: '更新時間',
    source: '來源',
    refresh: '刷新',
    disclaimer:
      '本服務匯率資料參考臺灣銀行牌告匯率（現金與即期賣出價）· 實際交易匯率以各銀行公告為準',
    disclaimerDesktop:
      '匯率數據參考臺灣銀行牌告匯率，每 5 分鐘更新。僅供參考，實際交易請以銀行公告為準。',
    faq: '常見問題',
    about: '關於我們',
    appName: '匯率好工具',
    allRightsReserved: 'All rights reserved.',
    createdBy: 'Created by',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'Open Source on',
  },
};

export default zhTW;
