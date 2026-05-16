/**
 * 繁體中文翻譯
 */

import { APP_INFO, getCopyrightYears } from '../../config/app-info';

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
    opensInNewWindow: '（開新視窗）',
  },

  // Navigation
  nav: {
    mainNavigation: '主導覽列',
    singleCurrency: '單幣別',
    multiCurrency: '多幣別',
    favorites: '收藏',
    settings: '設定',
    singleCurrencyFull: '單幣別轉換',
    multiCurrencyFull: '多幣別轉換',
    favoritesFull: '收藏與歷史',
    settingsFull: '應用程式設定',
    breadcrumb: '麵包屑導航',
    home: '首頁',
  },

  // App
  app: {
    title: APP_INFO.shortName,
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
    exchangeShopRate: '換錢所',
    rateTypeGroup: '匯率類型',
    switchToSpot: '切換到即期匯率',
    switchToCash: '切換到現金匯率',
    switchToExchangeShop: '切換到換錢所匯率',
    fallbackRate: '參考值',
    rateTypeUnavailable: '目前不提供 {{rateType}} 匯率',
    rateTypeUnavailableForCurrencies:
      '{{currencies}} 不提供 {{rateType}} 匯率，已改用 {{fallbackType}}',
    viewTrendChart: '查看趨勢圖',
    fromAmountLabel: '轉換金額 ({{code}})',
    toAmountLabel: '轉換結果 ({{code}})',
    backToConverter: '返回主換算器',
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
    switchToBank: '切換到銀行匯率',
    switchToNextRate: '切換到{{next}}',
    onlyOneRateAvailable: '此幣別僅有一種匯率可用',
    spotRate: '即期',
    cashRate: '現金',
    bankRate: '銀行',
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
    dragToFavorite: '拖曳加收藏',
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
    copyright: `© ${getCopyrightYears()} ${APP_INFO.name}`,
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
    // 匯率模式區塊
    rateMode: '匯率模式',
    rateModeAuto: '自動方向',
    rateModeAutoDesc:
      '依換算方向切換：即期匯率用於網銀換匯，現金匯率用於臨櫃換外幣，最接近真實換匯成本',
    rateModeSell: '賣出價',
    rateModeSellDesc: '全程以銀行賣出牌告計算；即期適用網銀換匯，現金適用臨櫃買外幣現鈔',
    rateModeMid: '參考價',
    rateModeMidDesc: '買賣中間價，精準度相對較低，適合外匯交易者做市場行情參考',
    // 支援與資訊區塊
    supportInfo: '支援與資訊',
    supportInfoDesc: '查使用教學、資料來源、API、隱私與服務說明。',
    faq: '常見問題',
    faqDesc: '快速釐清買入賣出、現金即期、刷卡匯率與資料更新。',
    usageGuide: '使用指南',
    usageGuideDesc: '用最短路徑完成換算、切換模式、收藏與多幣別比較。',
    aboutUs: '關於我們',
    aboutUsDesc: '了解資料方法、適用情境、作者與維護方式。',
    openSource: '開放原始碼',
    openSourceDesc: '查看程式碼、變更紀錄與公開協作狀態。',
    privacyPolicy: '隱私權政策',
    privacyPolicyDesc: '了解資料處理、分析工具與使用者隱私邊界。',
    openDataApi: '開放資料 API',
    openDataApiDesc: '查看 latest.json、OpenAPI 與資料欄位，方便接入或稽核。',
    seoTech: 'SEO 技術揭露',
    seoTechDesc: '查看可索引頁面、sitemap、結構化資料與公開檔案。',
  },

  // Support pages
  supportPages: {
    common: {
      author: '作者',
      version: '版本',
      lastUpdated: '最後更新',
      estimatedTime: '預估完成時間',
      twoMinutes: '約 2 分鐘',
    },
    faq: {
      title: '常見問題',
      subtitle: '把買入賣出、現金即期、刷卡匯率、DCC 與資料更新一次說清楚。',
    },
    guide: {
      title: '如何使用 {{appName}} 進行匯率換算',
      subtitle: '完整 8 步驟教學，從單筆換算、多幣別比較到收藏設定，完成出國前常見查價。',
    },
    about: {
      title: '關於 {{appName}}',
      subtitle: '{{appName}} 專注台灣換匯情境：看買入賣出、現金即期與公開資料來源。',
    },
    privacy: {
      title: '隱私政策',
      subtitle: '收藏、設定與換算歷史留在你的裝置；這頁列出分析、安全服務與資料處理邊界。',
    },
    openData: {
      title: '開放資料 API',
      subtitle: '台灣銀行牌告匯率 JSON 端點，提供 latest.json、歷史資料、OpenAPI 與資料欄位。',
      badges: {
        currencyCount: '{{count}} 種幣別',
        refresh: '每 5 分鐘更新',
        noApiKey: '無需 API Key',
        etag: 'ETag 支援',
        cdn: 'CDN 全球加速',
      },
    },
    seoTech: {
      eyebrow: 'SEO 技術揭露',
      title: '{{appName}} SEO 架構',
      subtitle:
        '這頁列出 {{appName}} 目前公開給搜尋引擎和 AI 讀取的檔案、頁面與資料更新流程。數字直接來自設定檔，方便核對實際部署狀態。',
    },
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
    reconvertAriaLabel: '點擊快速換算 {{from}} 到 {{to}}',
    copyAriaLabel: '複製轉換結果',
    entryAriaLabel: '{{amount}} {{from}} 換算為 {{result}} {{to}}',
    categories: {
      spot: '即期',
      cash: '現金',
      'exchange-shop': '換錢所',
    },
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
    offlineModeTitle: '離線模式',
    offlineModeDescription:
      '此頁面需要網路連線才能載入。恢復連線後將自動重試，或點擊下方按鈕手動重試。',
    routeLoadFailedTitle: '頁面載入失敗',
    routeLoadFailedDescription: '可能是最近版本更新造成資源不一致，請重新載入試試。',
    crashTitle: '哎呀！發生錯誤',
    crashDescription: '抱歉，應用程式遇到了一些問題。請重新整理頁面試試。',
    errorDetails: '錯誤詳情（開發模式）',
    clearCacheHint: '若問題持續發生，請清除瀏覽器快取後重試，或透過以下方式聯繫作者：',
    appLoadTimeout: '應用程式載入逾時',
    appLoadTimeoutDesc:
      '載入時間超過預期，可能是快取過期或網路問題。請強制重新載入以取得最新版本。',
    forceReload: '強制重新載入（清除快取）',
    reloading: '重新載入中...',
    cacheHint: '也可嘗試：設定 → 清除瀏覽器快取，或聯絡',
    reloadPage: '重新整理頁面',
    rateStaleWarning: '目前使用上次可用的匯率資料；恢復連線後會自動更新。',
    rateLoadDescription:
      '抱歉，我們無法從網路獲取最新的匯率資料。請檢查您的網路連線，然後再試一次。',
  },

  // PWA
  pwa: {
    updateAvailable: '有新版本可用',
    refresh: '重新整理',
    dismiss: '稍後',
    pullToRefresh: '下拉重新整理',
    offlineReadyTitle: '離線模式已就緒',
    offlineReadyDescription: '隨時隨地都能使用',
    needRefreshTitle: '發現新版本',
    needRefreshDescription: '點擊更新獲取最新功能',
    actionUpdate: '更新',
    actionClose: '關閉通知',
    updatingTitle: '正在更新',
    updatingDescription: '請稍候...',
    updateFailedTitle: '更新失敗',
    updateFailedDescription: '請重試或檢查網路',
    registrationFailedTitle: '背景更新初始化失敗',
    registrationFailedDescription: '更新模組載入失敗，請重新載入；若仍持續發生，請直接聯繫作者。',
    actionRetry: '重試',
    actionReload: '重新載入',
    releaseToRefresh: '放開以重新整理',
    refreshing: '重新整理中...',
  },

  support: {
    reportIssueLead: '若問題持續發生，請直接聯繫作者回報。',
    reportIssueHint: '建議附上錯誤畫面、操作步驟與裝置資訊，方便快速排查。',
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
    appName: APP_INFO.subtitle,
    allRightsReserved: 'All rights reserved.',
    createdBy: 'Created by',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'Open Source on',
    footerNav: '頁腳導航',
    privacyPolicy: '隱私政策',
  },

  // Rating Modal
  rating: {
    title: `喜歡 ${APP_INFO.shortName} 嗎？`,
    subtitle: '您的評分讓更多人找到這個工具 ✨',
    starsLabel: '星評',
    submit: '送出評分',
    submitting: '送出中...',
    later: '以後再說',
    dismiss: '不再提醒',
    thankYou: '感謝您的評分！',
  },
};

export default zhTW;
