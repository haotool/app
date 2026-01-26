/**
 * 日本語翻訳
 */

const ja = {
  // Common
  common: {
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    retry: '再試行',
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    close: '閉じる',
    back: '戻る',
    next: '次へ',
    done: '完了',
    search: '検索',
    clear: 'クリア',
    clearAll: 'すべてクリア',
    copy: 'コピー',
    copied: 'コピーしました',
    clickToCopy: 'クリックでコピー',
  },

  // Navigation
  nav: {
    singleCurrency: '単一',
    multiCurrency: '複数',
    favorites: 'お気に入り',
    settings: '設定',
    singleCurrencyFull: '単一通貨換算',
    multiCurrencyFull: '複数通貨換算',
    favoritesFull: 'お気に入り・履歴',
    settingsFull: 'アプリ設定',
  },

  // App
  app: {
    title: 'RateWise',
    subtitle: '為替レートツール',
    version: 'バージョン',
  },

  // Single Currency Converter
  singleConverter: {
    title: '通貨換算',
    fromAmount: '金額',
    toAmount: '結果',
    selectFromCurrency: '変換元通貨を選択',
    selectToCurrency: '変換先通貨を選択',
    openCalculator: '電卓を開く',
    openCalculatorFrom: '電卓を開く (金額)',
    openCalculatorTo: '電卓を開く (結果)',
    swapCurrencies: '通貨を入れ替え',
    clickToSwap: 'クリックで入れ替え',
    addToHistory: '履歴に追加',
    addedToHistory: '履歴に追加しました',
    spotRate: '直物',
    cashRate: '現金',
    switchToSpot: '直物レートに切替',
    switchToCash: '現金レートに切替',
    viewTrendChart: 'トレンドチャートを見る',
    fromAmountLabel: '金額 ({{code}})',
    toAmountLabel: '結果 ({{code}})',
  },

  // Multi Currency Converter
  multiConverter: {
    title: '複数通貨換算',
    description: '通貨行をタップで基準設定 · 金額をタップで電卓 · ⭐をタップでお気に入り',
    instantConversion: 'リアルタイム複数通貨換算',
    addToFavorites: '⭐をタップでお気に入りに追加',
    baseCurrency: '基準通貨',
    spotOnlyNote: '{{code}} 直物レートのみ',
    cashOnlyNote: '{{code}} 現金レートのみ',
    calculating: '計算中...',
    noData: 'データなし',
    amountClickCalculator: '{{name}} ({{code}}) 金額、クリックして電卓を開く',
    currencyListLabel: '通貨リスト',
    addFavorite: '{{code}} をお気に入りに追加',
    removeFavorite: '{{code}} をお気に入りから削除',
    switchToSpot: '直物レートに切替',
    switchToCash: '現金レートに切替',
    spotRate: '直物',
    cashRate: '現金',
  },

  // Favorites
  favorites: {
    title: 'お気に入り通貨',
    allCurrencies: 'すべての通貨',
    starred: 'お気に入り',
    otherCurrencies: 'その他の通貨',
    history: '換算履歴',
    noFavorites: 'お気に入り通貨がありません',
    noFavoritesHint: '単一または複数通貨ページで⭐をタップしてお気に入りを追加',
    noHistory: '換算履歴がありません',
    noHistoryHint: '通貨換算を開始すると、履歴が自動的に保存されます',
    goToConvert: '換算する',
    addFavorite: 'お気に入りに追加',
    removeFavorite: 'お気に入りから削除',
    clickToConvert: '換算 →',
    reconvert: '再換算',
    clearAllHistory: 'すべての履歴を削除',
    dragToReorder: 'ドラッグで並べ替え',
    dragToFavorite: 'お気に入りに追加',
    dragHandle: 'ドラッグハンドル',
  },

  // Settings
  settings: {
    title: '設定',
    interfaceStyle: 'インターフェーススタイル',
    language: '言語',
    storageCache: 'ストレージとキャッシュ',
    dataManagement: 'データ管理',
    about: '情報',
    dataSource: '為替レートソース',
    taiwanBank: '台湾銀行',
    updateFrequency: '更新頻度',
    fiveMinutes: '5分',
    updateNote: '為替レートは5分ごとに更新されます。',
    resetTheme: 'テーマ設定をリセット',
    appVersion: 'アプリバージョン',
    designSystem: 'デザインシステム',
    techStack: '技術スタック',
    copyright: '© 2026 RateWise. Built with Design Token SSOT',
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
  },

  // Styles
  styles: {
    zen: 'Zen',
    zenDesc: 'ミニマル＆プロ',
    nitro: 'Nitro',
    nitroDesc: 'ダークテック',
    kawaii: 'Kawaii',
    kawaiiDesc: 'かわいい＆ピンク',
    classic: 'Classic',
    classicDesc: 'ヴィンテージブック',
    ocean: 'Ocean',
    oceanDesc: '深海',
    forest: 'Forest',
    forestDesc: '自然の森',
  },

  // Currency List
  currencyList: {
    title: 'すべての通貨',
    allCurrencies: 'すべての通貨',
    favoriteCurrencies: 'お気に入り通貨',
    refreshTrends: 'トレンドデータを更新',
    currencyListLabel: '通貨リスト',
  },

  // Conversion History
  conversionHistory: {
    title: '換算履歴',
    clearAll: 'すべて削除',
    copyResult: '結果をコピー',
    reconvert: '再換算',
    today: '今日',
    yesterday: '昨日',
    copyFailed: 'コピーに失敗しました',
    clearAllAriaLabel: 'すべての履歴を削除',
    reconvertAriaLabel: 'クイック換算 {{from}} から {{to}}',
    copyAriaLabel: '換算結果をコピー',
    entryAriaLabel: '{{amount}} {{from}} を {{result}} {{to}} に換算',
  },

  // Calculator
  calculator: {
    title: '電卓',
    clear: 'クリア',
    backspace: '一文字削除',
    confirm: '確認',
    invalidExpression: '無効な式',
    divideByZero: 'ゼロで割ることはできません',
    close: '電卓を閉じる',
    currentExpression: '現在の式',
    inputPlaceholder: '数字または式を入力',
    previewResult: 'プレビュー結果 {{value}}',
    calculationResult: '計算結果',
    resultIs: '計算結果は {{value}}',
  },

  // Rate Info
  rateInfo: {
    source: '台湾銀行レート',
    sourceTime: 'ソース',
    refreshTime: '更新',
    lastUpdate: '最終更新',
  },

  // Currency Names
  currencies: {
    TWD: '台湾ドル',
    USD: '米ドル',
    JPY: '日本円',
    EUR: 'ユーロ',
    GBP: '英ポンド',
    HKD: '香港ドル',
    CNY: '人民元',
    KRW: '韓国ウォン',
    AUD: '豪ドル',
    CAD: 'カナダドル',
    SGD: 'シンガポールドル',
    CHF: 'スイスフラン',
    NZD: 'NZドル',
    THB: 'タイバーツ',
    PHP: 'フィリピンペソ',
    IDR: 'インドネシアルピア',
    VND: 'ベトナムドン',
    MYR: 'マレーシアリンギット',
  },

  // Errors
  errors: {
    loadingFailed: '読み込みに失敗しました',
    rateLoadFailed: 'レートの読み込みに失敗しました',
    networkCheckRetry: '最新の為替レートを取得できませんでした。接続を確認して再試行してください。',
    dataLoadFailed: 'データの読み込みに失敗しました。再試行してください。',
    networkError: 'ネットワークエラー',
    unknownError: '不明なエラー',
    tryAgain: 'しばらくしてからもう一度お試しください',
    reload: '再読み込み',
  },

  // PWA
  pwa: {
    updateAvailable: '新しいバージョンが利用可能です',
    refresh: '更新',
    dismiss: '後で',
    pullToRefresh: '下にスワイプして更新',
  },

  // 404
  notFound: {
    title: 'ページが見つかりません',
    message: 'お探しのページは存在しないか、削除されました。',
    goHome: 'ホームに戻る',
  },

  // Footer
  footer: {
    taiwanBankRates: '台湾銀行レート',
    taiwanBankFull: 'Taiwan Bank (台湾銀行公式レート)',
    dataSource: 'データソース',
    updateTime: '更新時間',
    source: 'ソース',
    refresh: '更新',
    disclaimer:
      '為替レートは台湾銀行の公式レート（現金・直物売りレート）を参照しています。実際の取引レートは銀行の発表をご確認ください。',
    disclaimerDesktop: '台湾銀行のレートを5分ごとに更新。参考用のみ。',
    faq: 'よくある質問',
    about: '私たちについて',
    appName: 'RateWise',
    allRightsReserved: 'All rights reserved.',
    createdBy: '作成者',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'オープンソース',
  },
};

export default ja;
