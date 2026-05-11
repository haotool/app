/**
 * 한국어 번역
 */

import { APP_INFO, getCopyrightYears } from '../../config/app-info';

const ko = {
  // Common
  common: {
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    retry: '다시 시도',
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    close: '닫기',
    back: '뒤로',
    next: '다음',
    done: '완료',
    search: '검색',
    clear: '지우기',
    clearAll: '모두 지우기',
    copy: '복사',
    copied: '복사됨',
    clickToCopy: '클릭하여 복사',
  },

  // Navigation
  nav: {
    mainNavigation: '주요 내비게이션',
    singleCurrency: '단일',
    multiCurrency: '복수',
    favorites: '즐겨찾기',
    settings: '설정',
    singleCurrencyFull: '단일 통화 환산',
    multiCurrencyFull: '복수 통화 환산',
    favoritesFull: '즐겨찾기 및 기록',
    settingsFull: '앱 설정',
    breadcrumb: '이동 경로 내비게이션',
    home: '홈',
  },

  // App
  app: {
    title: APP_INFO.shortName,
    subtitle: '환율 계산 도구',
    version: '버전',
  },

  // Single Currency Converter
  singleConverter: {
    title: '통화 환산',
    fromAmount: '금액',
    toAmount: '결과',
    selectFromCurrency: '출발 통화 선택',
    selectToCurrency: '도착 통화 선택',
    openCalculator: '계산기 열기',
    openCalculatorFrom: '계산기 열기 (금액)',
    openCalculatorTo: '계산기 열기 (결과)',
    swapCurrencies: '통화 교체',
    clickToSwap: '클릭하여 교체',
    addToHistory: '기록에 추가',
    addedToHistory: '기록에 추가됨',
    spotRate: '전신환',
    cashRate: '현금',
    exchangeShopRate: '환전소',
    rateTypeGroup: '환율 유형',
    switchToSpot: '전신환 환율로 전환',
    switchToCash: '현금 환율로 전환',
    switchToExchangeShop: '환전소 환율로 전환',
    fallbackRate: '참고값',
    rateTypeUnavailable: '{{rateType}} 환율은 현재 이용할 수 없습니다',
    rateTypeUnavailableForCurrencies:
      '{{currencies}}는 {{rateType}} 환율을 지원하지 않아 {{fallbackType}}으로 전환되었습니다',
    viewTrendChart: '추세 차트 보기',
    fromAmountLabel: '금액 ({{code}})',
    toAmountLabel: '결과 ({{code}})',
    backToConverter: '환산기로 돌아가기',
  },

  // Multi Currency Converter
  multiConverter: {
    title: '복수 통화 환산',
    description: '통화 행을 탭하여 기준 설정 · 금액을 탭하여 계산기 · ⭐를 탭하여 즐겨찾기 추가',
    instantConversion: '실시간 복수 통화 환산',
    addToFavorites: '⭐를 탭하여 즐겨찾기에 추가',
    baseCurrency: '기준 통화',
    spotOnlyNote: '{{code}} 전신환 환율만 지원',
    cashOnlyNote: '{{code}} 현금 환율만 지원',
    calculating: '계산 중...',
    noData: '데이터 없음',
    amountClickCalculator: '{{name}} ({{code}}) 금액, 클릭하여 계산기 열기',
    currencyListLabel: '통화 목록',
    addFavorite: '{{code}} 즐겨찾기에 추가',
    removeFavorite: '{{code}} 즐겨찾기에서 제거',
    switchToSpot: '전신환 환율로 전환',
    switchToCash: '현금 환율로 전환',
    spotRate: '전신환',
    cashRate: '현금',
    bankRate: '은행',
    exchangeShopRate: '환전소',
  },

  // Favorites
  favorites: {
    title: '즐겨찾기 통화',
    allCurrencies: '모든 통화',
    starred: '즐겨찾기',
    otherCurrencies: '기타 통화',
    history: '환산 기록',
    noFavorites: '즐겨찾기 통화가 없습니다',
    noFavoritesHint: '단일 또는 복수 통화 페이지에서 ⭐를 탭하여 즐겨찾기를 추가하세요',
    noHistory: '환산 기록이 없습니다',
    noHistoryHint: '통화 환산을 시작하면 기록이 자동으로 저장됩니다',
    goToConvert: '환산하러 가기',
    addFavorite: '즐겨찾기에 추가',
    removeFavorite: '즐겨찾기에서 제거',
    clickToConvert: '환산 →',
    reconvert: '재환산',
    clearAllHistory: '모든 기록 삭제',
    dragToReorder: '드래그하여 순서 변경',
    dragToFavorite: '드래그하여 즐겨찾기 추가',
    dragHandle: '드래그 핸들',
  },

  // Settings
  settings: {
    title: '설정',
    interfaceStyle: '인터페이스 스타일',
    language: '언어',
    storageCache: '저장소 및 캐시',
    dataManagement: '데이터 관리',
    about: '정보',
    dataSource: '환율 데이터 출처',
    taiwanBank: '대만 은행',
    updateFrequency: '업데이트 빈도',
    fiveMinutes: '5분',
    updateNote: '환율 데이터는 5분마다 자동으로 업데이트됩니다.',
    resetTheme: '테마 설정 초기화',
    appVersion: '앱 버전',
    designSystem: '디자인 시스템',
    techStack: '기술 스택',
    copyright: `© ${getCopyrightYears()} ${APP_INFO.shortName}`,
    sixStylesSST: '6 Styles SSOT',
    reactTailwind: 'React + Tailwind',
    // 환율 모드 섹션
    rateMode: '환율 모드',
    rateModeAuto: '자동 방향',
    rateModeAutoDesc:
      '방향별 자동 전환: 인터넷뱅킹 송금은 전신환율, 창구 환전은 현금율 적용 — 실제 환전 비용에 가장 근접',
    rateModeSell: '매도율',
    rateModeSellDesc: '전 구간 은행 매도율 적용. 전신환(인터넷뱅킹)·창구 현금 매수 모두 동일 기준',
    rateModeMid: '참고율',
    rateModeMidDesc: '매도·매입 중간값. 정밀도가 낮아 외환 트레이더의 시장 참고용으로 적합',
    // 지원 및 정보 섹션
    supportInfo: '지원 및 정보',
    faq: '자주 묻는 질문',
    usageGuide: '사용 가이드',
    aboutUs: '소개',
    openSource: '오픈 소스',
    privacyPolicy: '개인정보 처리방침',
    openDataApi: '공개 데이터 API',
    seoTech: 'SEO 기술 공개',
  },

  // Styles
  styles: {
    zen: 'Zen',
    zenDesc: '미니멀 & 프로',
    nitro: 'Nitro',
    nitroDesc: '다크 테크',
    kawaii: 'Kawaii',
    kawaiiDesc: '귀엽고 핑크',
    classic: 'Classic',
    classicDesc: '빈티지 북',
    ocean: 'Ocean',
    oceanDesc: '심해',
    forest: 'Forest',
    forestDesc: '자연의 숲',
  },

  // Currency List
  currencyList: {
    title: '모든 통화',
    allCurrencies: '모든 통화',
    favoriteCurrencies: '즐겨찾기 통화',
    refreshTrends: '추세 데이터 새로고침',
    currencyListLabel: '통화 목록',
  },

  // Conversion History
  conversionHistory: {
    title: '환산 기록',
    clearAll: '모두 삭제',
    copyResult: '결과 복사',
    reconvert: '재환산',
    today: '오늘',
    yesterday: '어제',
    copyFailed: '복사 실패',
    clearAllAriaLabel: '모든 기록 삭제',
    reconvertAriaLabel: '{{from}}에서 {{to}}로 빠른 환산',
    copyAriaLabel: '환산 결과 복사',
    entryAriaLabel: '{{amount}} {{from}}를 {{result}} {{to}}로 환산',
    categories: {
      spot: '전신환',
      cash: '현금',
      'exchange-shop': '환전소',
    },
  },

  // Calculator
  calculator: {
    title: '계산기',
    clear: '지우기',
    backspace: '한 자리 삭제',
    confirm: '확인',
    invalidExpression: '잘못된 수식',
    divideByZero: '0으로 나눌 수 없습니다',
    close: '계산기 닫기',
    currentExpression: '현재 수식',
    inputPlaceholder: '숫자 또는 수식을 입력하세요',
    previewResult: '미리보기 결과 {{value}}',
    calculationResult: '계산 결과',
    resultIs: '결과는 {{value}}',
  },

  // Rate Info
  rateInfo: {
    source: '대만 은행 환율',
    sourceTime: '출처',
    refreshTime: '새로고침',
    lastUpdate: '마지막 업데이트',
  },

  // Currency Names
  currencies: {
    TWD: '대만 달러',
    USD: '미국 달러',
    JPY: '일본 엔',
    EUR: '유로',
    GBP: '영국 파운드',
    HKD: '홍콩 달러',
    CNY: '중국 위안',
    KRW: '한국 원',
    AUD: '호주 달러',
    CAD: '캐나다 달러',
    SGD: '싱가포르 달러',
    CHF: '스위스 프랑',
    NZD: '뉴질랜드 달러',
    THB: '태국 바트',
    PHP: '필리핀 페소',
    IDR: '인도네시아 루피아',
    VND: '베트남 동',
    MYR: '말레이시아 링깃',
  },

  // Errors
  errors: {
    loadingFailed: '로딩 실패',
    rateLoadFailed: '환율 로딩 실패',
    networkCheckRetry: '최신 환율을 가져올 수 없습니다. 연결 상태를 확인하고 다시 시도해 주세요.',
    dataLoadFailed: '데이터를 불러올 수 없습니다. 다시 시도해 주세요.',
    networkError: '네트워크 오류',
    unknownError: '알 수 없는 오류',
    tryAgain: '잠시 후 다시 시도해 주세요',
    reload: '새로고침',
    offlineModeTitle: '오프라인 모드',
    offlineModeDescription:
      '이 페이지를 로드하려면 네트워크 연결이 필요합니다. 재연결 후 자동으로 재시도하거나 아래 버튼을 눌러 수동으로 재시도할 수 있습니다.',
    routeLoadFailedTitle: '페이지 로드 실패',
    routeLoadFailedDescription:
      '최근 업데이트로 인해 캐시된 리소스가 불일치할 수 있습니다. 페이지를 새로고침해 주세요.',
    crashTitle: '이런! 오류가 발생했습니다',
    crashDescription: '앱에 문제가 발생했습니다. 페이지를 새로고침해 주세요.',
    errorDetails: '오류 세부사항 (개발 모드)',
    clearCacheHint: '문제가 계속되면 브라우저 캐시를 지우거나 아래 방법으로 문의해 주세요:',
    appLoadTimeout: '앱 로딩 시간 초과',
    appLoadTimeoutDesc:
      '로딩에 예상보다 오랜 시간이 걸리고 있습니다. 캐시 만료 또는 네트워크 문제일 수 있습니다. 강제 새로고침으로 최신 버전을 받아 주세요.',
    forceReload: '강제 새로고침 (캐시 삭제)',
    reloading: '새로고침 중...',
    cacheHint: '또는: 설정 → 브라우저 캐시 삭제, 혹은 문의하기',
    reloadPage: '페이지 새로고침',
    rateStaleWarning:
      '현재 마지막으로 사용 가능한 환율을 표시합니다. 연결이 복구되면 자동으로 업데이트됩니다.',
    rateLoadDescription:
      '죄송합니다. 최신 환율을 가져올 수 없습니다. 연결 상태를 확인하고 다시 시도해 주세요.',
  },

  // PWA
  pwa: {
    updateAvailable: '새 버전이 있습니다',
    refresh: '새로고침',
    dismiss: '나중에',
    pullToRefresh: '당겨서 새로고침',
    offlineReadyTitle: '오프라인 준비 완료',
    offlineReadyDescription: '언제 어디서나 사용 가능',
    needRefreshTitle: '새 버전 감지됨',
    needRefreshDescription: '업데이트를 탭하여 최신 기능 받기',
    actionUpdate: '업데이트',
    actionClose: '알림 닫기',
    updatingTitle: '업데이트 중',
    updatingDescription: '잠시 기다려 주세요...',
    updateFailedTitle: '업데이트 실패',
    updateFailedDescription: '다시 시도하거나 네트워크를 확인해 주세요',
    registrationFailedTitle: '백그라운드 업데이트 초기화 실패',
    registrationFailedDescription:
      '업데이트 워커를 시작할 수 없습니다. 페이지를 새로고침하고 계속되면 작성자에게 문의해 주세요.',
    actionRetry: '재시도',
    actionReload: '새로고침',
    releaseToRefresh: '놓아서 새로고침',
    refreshing: '새로고침 중...',
  },

  support: {
    reportIssueLead: '문제가 계속되면 작성자에게 직접 연락해 주세요.',
    reportIssueHint: '오류 화면, 재현 단계, 기기 정보를 함께 보내주시면 빠른 해결에 도움이 됩니다.',
  },

  // 404
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    message: '찾으시는 페이지가 존재하지 않거나 삭제되었습니다.',
    goHome: '홈으로 이동',
  },

  // Footer
  footer: {
    taiwanBankRates: '대만 은행 환율',
    taiwanBankFull: 'Taiwan Bank (대만 은행 공식 환율)',
    dataSource: '데이터 출처',
    updateTime: '업데이트 시간',
    source: '출처',
    refresh: '새로고침',
    disclaimer:
      '환율은 대만 은행 공식 환율(현금·전신환 매도 가격)을 참고합니다. 실제 거래 환율은 각 은행 공지를 확인하세요.',
    disclaimerDesktop: '대만 은행 기준 환율, 5분마다 업데이트. 참고용으로만 사용하세요.',
    faq: '자주 묻는 질문',
    about: '소개',
    appName: APP_INFO.shortName,
    allRightsReserved: 'All rights reserved.',
    createdBy: '만든 이',
    by: 'By',
    builtWith: 'Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)',
    openSourceOn: '오픈 소스',
    footerNav: '푸터 내비게이션',
    privacyPolicy: '개인정보 처리방침',
  },

  // Rating Modal
  rating: {
    title: `${APP_INFO.shortName}가 마음에 드시나요?`,
    subtitle: '평가해 주시면 더 많은 분들이 이 도구를 발견할 수 있어요 ✨',
    starsLabel: '별점',
    submit: '평가 제출',
    submitting: '제출 중...',
    later: '나중에',
    dismiss: '다시 표시 안 함',
    thankYou: '평가해 주셔서 감사합니다!',
  },
};

export default ko;
