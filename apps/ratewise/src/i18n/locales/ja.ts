/**
 * 日本語翻訳
 */

import { APP_INFO, getCopyrightYears } from '../../config/app-info';

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
    opensInNewWindow: '（新しいウィンドウで開きます）',
  },

  // Navigation
  nav: {
    mainNavigation: 'メインナビゲーション',
    singleCurrency: '単一',
    multiCurrency: '複数',
    favorites: 'お気に入り',
    settings: '設定',
    singleCurrencyFull: '単一通貨換算',
    multiCurrencyFull: '複数通貨換算',
    favoritesFull: 'お気に入り・履歴',
    settingsFull: 'アプリ設定',
    breadcrumb: 'パンくずナビゲーション',
    home: 'ホーム',
  },

  // App
  app: {
    title: APP_INFO.shortName,
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
    exchangeShopRate: '両替所',
    rateTypeGroup: 'レート種類',
    switchToSpot: '直物レートに切替',
    switchToCash: '現金レートに切替',
    switchToExchangeShop: '両替所レートに切替',
    fallbackRate: '参考値',
    rateTypeUnavailable: '{{rateType}}レートは現在利用できません',
    rateTypeUnavailableForCurrencies:
      '{{currencies}} は {{rateType}} レート非対応のため、{{fallbackType}} を使用します',
    viewTrendChart: 'トレンドチャートを見る',
    fromAmountLabel: '金額 ({{code}})',
    toAmountLabel: '結果 ({{code}})',
    backToConverter: 'コンバーターに戻る',
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
    switchToBank: '銀行レートに切替',
    switchToNextRate: '{{next}}に切替',
    onlyOneRateAvailable: 'このレートのみ利用可能',
    spotRate: '直物',
    cashRate: '現金',
    bankRate: '銀行',
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
    copyright: `© ${getCopyrightYears()} ${APP_INFO.shortName}`,
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
    // 為替レートモードセクション
    rateMode: '為替レートモード',
    rateModeAuto: '自動方向',
    rateModeAutoDesc:
      '方向別に自動切替：電信送金は即時レート、窓口両替は現金レートを適用。実際の換金コストに最も近い',
    rateModeSell: '売値',
    rateModeSellDesc: '全換算に銀行売値を適用。電信送金（即時）・窓口現金どちらも対応',
    rateModeMid: '参考値',
    rateModeMidDesc: '売値と買値の中間レート。精度はやや低め。外為トレーダーの市場参考値として活用',
    // サポートと情報セクション
    supportInfo: 'サポートと情報',
    supportInfoDesc: '使い方、データソース、プライバシー、技術的な透明性をここにまとめています。',
    faq: 'よくある質問',
    faqDesc: '買値・売値、現金・即時、カードレート、データ更新をすばやく確認できます。',
    usageGuide: 'ご利用ガイド',
    usageGuideDesc: '換算、モード切替、お気に入り、多通貨比較の最短手順を確認できます。',
    aboutUs: '私たちについて',
    aboutUsDesc: 'データ方法、利用シーン、作者、メンテナンス方針を確認できます。',
    openSource: 'オープンソース',
    openSourceDesc: 'ソースコード、変更履歴、公開コラボレーション状況を確認できます。',
    privacyPolicy: 'プライバシーポリシー',
    privacyPolicyDesc: 'データ処理、分析ツール、プライバシーの境界を確認できます。',
    openDataApi: 'オープンデータ API',
    openDataApiDesc: 'latest.json、OpenAPI、AI 向けデータ入口を確認できます。',
    seoTech: 'SEO 技術開示',
    seoTechDesc: 'インデックス対象ページ、構造化データ、AI 引用ガバナンスを確認できます。',
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
    categories: {
      spot: '直物',
      cash: '現金',
      'exchange-shop': '両替所',
    },
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
    offlineModeTitle: 'オフラインモード',
    offlineModeDescription:
      'このページの読み込みにはネットワーク接続が必要です。再接続後は自動で再試行するか、下のボタンから手動で再試行できます。',
    routeLoadFailedTitle: 'ページの読み込みに失敗しました',
    routeLoadFailedDescription:
      '最近の更新でキャッシュ済みリソースが不整合になっている可能性があります。ページを再読み込みしてください。',
    crashTitle: 'エラーが発生しました',
    crashDescription:
      '申し訳ありませんが、アプリにエラーが発生しました。ページを再読み込みしてください。',
    errorDetails: 'エラー詳細（開発モード）',
    clearCacheHint:
      '問題が続く場合はブラウザキャッシュをクリアするか、以下からお問い合わせください：',
    appLoadTimeout: 'アプリの読み込みタイムアウト',
    appLoadTimeoutDesc:
      '読み込みに予想以上の時間がかかっています。キャッシュ切れまたはネットワークの問題の可能性があります。強制再読み込みで最新版を取得してください。',
    forceReload: '強制再読み込み（キャッシュ削除）',
    reloading: '再読み込み中...',
    cacheHint: 'または：設定 → ブラウザキャッシュを削除、もしくはご連絡ください',
    reloadPage: 'ページを再読み込み',
    rateStaleWarning:
      '現在は最後に利用できた為替レートを使用しています。接続が復旧すると自動更新されます。',
    rateLoadDescription:
      '申し訳ありませんが、最新の為替レートを取得できませんでした。接続を確認してもう一度お試しください。',
  },

  // PWA
  pwa: {
    updateAvailable: '新しいバージョンが利用可能です',
    refresh: '更新',
    dismiss: '後で',
    pullToRefresh: '下にスワイプして更新',
    offlineReadyTitle: 'オフライン対応完了',
    offlineReadyDescription: 'いつでもどこでも利用可能',
    needRefreshTitle: '新バージョンを検出',
    needRefreshDescription: '更新をタップして最新機能を取得',
    actionUpdate: '更新',
    actionClose: '通知を閉じる',
    updatingTitle: '更新中',
    updatingDescription: 'しばらくお待ちください...',
    updateFailedTitle: '更新に失敗しました',
    updateFailedDescription: '再試行するかネットワークを確認してください',
    registrationFailedTitle: 'バックグラウンド更新の初期化に失敗しました',
    registrationFailedDescription:
      '更新ワーカーを起動できませんでした。ページを再読み込みし、続く場合は作者へ連絡してください。',
    actionRetry: '再試行',
    actionReload: '再読み込み',
    releaseToRefresh: '離して更新',
    refreshing: '更新中...',
  },

  support: {
    reportIssueLead: '問題が続く場合は、作者へ直接ご連絡ください。',
    reportIssueHint: 'エラー画面、再現手順、端末情報を添えると、原因の特定が早くなります。',
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
    appName: APP_INFO.shortName,
    allRightsReserved: 'All rights reserved.',
    createdBy: '作成者',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: 'オープンソース',
    footerNav: 'フッターナビゲーション',
    privacyPolicy: 'プライバシーポリシー',
  },

  // Rating Modal
  rating: {
    title: `${APP_INFO.shortName}を気に入っていただけましたか？`,
    subtitle: '評価することで、より多くの人にこのツールを届けられます ✨',
    starsLabel: '星評価',
    submit: '評価を送信',
    submitting: '送信中...',
    later: 'あとで',
    dismiss: '二度と表示しない',
    thankYou: '評価ありがとうございます！',
  },
};

export default ja;
