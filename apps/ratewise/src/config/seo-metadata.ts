import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import { APP_INFO, SEO_SOCIAL_LINKS } from './app-info';
import { SHARE_IMAGE, TWITTER_IMAGE, normalizeSiteUrl } from './seo-paths';

export interface AlternateLink {
  hrefLang: string;
  href: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface HowToStep {
  position?: number;
  name: string;
  text: string;
  image?: string;
}

export interface HowToData {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export type JsonLdBlock = Record<string, unknown>;

export interface SEOPageMetadata {
  title?: string;
  description: string;
  pathname: string;
  ogType?: 'website' | 'article';
  jsonLd?: JsonLdBlock | JsonLdBlock[];
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  howTo?: HowToData;
  breadcrumb?: BreadcrumbItem[];
  robots?: string;
}

export interface HomepageQuickLink {
  href: string;
  label: string;
}

export interface HomepageContent {
  eyebrow: string;
  heading: string;
  intro: string;
  highlights: string[];
  quickLinks: HomepageQuickLink[];
}

export interface CurrencyLandingPageContent {
  currencyCode: CurrencyLandingCode;
  currencyFlag: string;
  currencyName: string;
  title: string;
  description: string;
  pathname: string;
  keywords: string[];
  faqEntries: FAQEntry[];
  howToSteps: HowToStep[];
  highlights: string[];
  faqTitle: string;
}

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const SITE_BASE_URL = ensureTrailingSlash(
  sanitizeBaseUrl(normalizeSiteUrl(import.meta.env.VITE_SITE_URL ?? APP_INFO.siteUrl)),
);
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();
const ASSET_VERSION = `v=${BUILD_TIME.replace(/[-T:Z.]/g, '').slice(0, 8) || 'dev'}`;

export const DEFAULT_LOCALE = 'zh-TW' as const;
export const DEFAULT_TITLE =
  'RateWise 匯率好工具 - 即時匯率轉換器 | 支援 TWD、USD、JPY、EUR 等多幣別換算';
export const DEFAULT_DESCRIPTION =
  'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具，歷史趨勢圖一目了然，多幣別同時比較，是您出國旅遊與外幣兌換的最佳助手。';
export const DEFAULT_KEYWORDS = [
  '匯率好工具',
  'RateWise',
  '匯率工具',
  '匯率換算',
  '即時匯率',
  '台幣匯率',
  'TWD匯率',
  'USD匯率',
  '外幣兌換',
  '匯率查詢',
  '臺灣銀行匯率',
  '台灣匯率',
  '美金匯率',
  '日幣匯率',
  '歐元匯率',
  '線上匯率',
  '匯率計算機',
  '匯率轉換器',
  '貨幣換算',
  '台幣換算',
  'exchange rate',
  'currency converter',
] as const;

export const SITE_SEO = {
  baseUrl: SITE_BASE_URL,
  locale: DEFAULT_LOCALE,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  ogImage: SHARE_IMAGE,
  twitterImage: TWITTER_IMAGE,
  socialLinks: [...SEO_SOCIAL_LINKS],
  updatedTime: BUILD_TIME,
  application: {
    category: 'FinanceApplication',
    browserRequirements: 'Requires JavaScript',
    featureList: [
      '即時匯率查詢',
      '單幣別換算',
      '多幣別同時換算',
      '歷史匯率趨勢（7~30天）',
      '離線使用（PWA）',
      'Service Worker 快取',
      '臺灣銀行牌告匯率',
      '30+ 種貨幣支援',
    ],
  },
} as const;

export function buildCanonicalUrl(pathname?: string): string {
  if (!pathname || pathname === '/') return SITE_BASE_URL;
  if (/^https?:\/\//i.test(pathname)) {
    return ensureTrailingSlash(sanitizeBaseUrl(pathname));
  }
  const normalizedPath = `${ensureLeadingSlash(pathname).replace(/\/+$/, '')}/`;
  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
}

export function withAssetVersion(url: string): string {
  return url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;
}

export function buildAbsoluteAssetUrl(pathname: string): string {
  const absolute = pathname.startsWith('http')
    ? pathname
    : `${SITE_BASE_URL}${pathname.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
}

export function buildSiteJsonLd(): JsonLdBlock[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: APP_INFO.name,
      alternateName: APP_INFO.subtitle,
      description: SITE_SEO.description,
      url: SITE_BASE_URL,
      applicationCategory: SITE_SEO.application.category,
      operatingSystem: 'Any',
      browserRequirements: SITE_SEO.application.browserRequirements,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: SITE_SEO.application.featureList,
      inLanguage: SITE_SEO.locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: APP_INFO.author,
      url: SITE_BASE_URL,
      logo: buildAbsoluteAssetUrl('/icons/ratewise-icon-512x512.png'),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: APP_INFO.email,
      },
      sameAs: SITE_SEO.socialLinks,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: APP_INFO.name,
      url: SITE_BASE_URL,
      inLanguage: SITE_SEO.locale,
    },
  ];
}

export function buildShareImageJsonLd(name: string, description: string): JsonLdBlock {
  const imageUrl = buildAbsoluteAssetUrl(SITE_SEO.ogImage);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: imageUrl,
    width: '1200',
    height: '630',
    encodingFormat: 'image/jpeg',
    name,
    description,
    creator: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: 'https://haotool.org',
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: APP_INFO.author,
    },
    copyrightNotice: `© ${new Date(BUILD_TIME).getUTCFullYear() || 2026} ${APP_INFO.author}`,
    creditText: APP_INFO.author,
  };
}

export const HOMEPAGE_FAQ = [
  {
    question: '匯率來源與更新頻率？',
    answer: '匯率 100% 參考臺灣銀行牌告，包含現金與即期買入賣出價，每 5 分鐘自動同步一次。',
  },
  {
    question: '支援哪些貨幣？',
    answer:
      '支援 30+ 種主要貨幣，包括 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等，可收藏常用貨幣。',
  },
  {
    question: '可以離線使用嗎？',
    answer: '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
  },
  {
    question: '如何查看多幣別與歷史趨勢？',
    answer:
      '切換到多幣別模式可同時查看所有支援貨幣；單幣別卡片可展開 7 到 30 天歷史趨勢圖，輔助判斷換匯時機。',
  },
] as const satisfies readonly FAQEntry[];

export const HOMEPAGE_HOW_TO: HowToData = {
  name: '如何使用 RateWise 進行匯率換算',
  description: '三步驟完成即時匯率換算，支援 30+ 種主要貨幣與歷史趨勢查看。',
  totalTime: 'PT30S',
  steps: [
    {
      position: 1,
      name: '選擇貨幣',
      text: '從下拉選單選擇來源貨幣與目標貨幣，RateWise 支援 TWD、USD、JPY、EUR、GBP 等 30+ 種主要貨幣。',
    },
    {
      position: 2,
      name: '輸入金額',
      text: '在輸入框輸入想換算的金額，系統會根據臺灣銀行牌告匯率即時計算結果。',
    },
    {
      position: 3,
      name: '查看結果與趨勢',
      text: '換算結果會立即顯示，並可展開查看歷史匯率趨勢與切換現金或即期匯率。',
    },
  ],
};

export const HOMEPAGE_SEO = {
  description: SITE_SEO.description,
  pathname: '/',
  keywords: [...SITE_SEO.keywords],
  faq: [...HOMEPAGE_FAQ],
  howTo: HOMEPAGE_HOW_TO,
  jsonLd: [
    buildShareImageJsonLd('RateWise 匯率轉換器分享圖片', 'RateWise 首頁匯率換算與趨勢功能預覽'),
  ],
  content: {
    eyebrow: '臺灣銀行牌告匯率 · 每 5 分鐘同步',
    heading: 'RateWise 即時匯率換算',
    intro:
      '提供台幣、美元、日圓、歐元、港幣、人民幣等主要貨幣的即時換算與歷史趨勢，適合出國旅遊、海外付款與跨境報價前快速比價。',
    highlights: [
      '100% 參考臺灣銀行牌告匯率，支援現金與即期買入賣出價。',
      '支援 30+ 種主要貨幣，適合旅遊換匯、跨境付款與報價試算。',
      'PWA 可離線使用，重新連線後會自動同步最新匯率。',
    ],
    quickLinks: [
      { href: '/usd-twd/', label: 'USD/TWD 匯率' },
      { href: '/faq/', label: '常見問題' },
      { href: '/guide/', label: '使用指南' },
    ],
  },
} as const satisfies SEOPageMetadata & { content: HomepageContent };

export const FAQ_PAGE_ENTRIES = [
  {
    question: '什麼是 RateWise 匯率好工具？',
    answer:
      'RateWise 是基於臺灣銀行牌告匯率的即時匯率 PWA 應用，支援 30+ 種貨幣換算，提供單幣別與多幣別換算、收藏管理、換算歷史與匯率趨勢圖。',
  },
  {
    question: '匯率數據來源是什麼？',
    answer:
      'RateWise 的匯率數據 100% 參考臺灣銀行官方牌告匯率，每 5 分鐘自動同步一次，涵蓋現金與即期買入賣出價。',
  },
  {
    question: '支援哪些貨幣？',
    answer:
      'RateWise 支援超過 30 種主要國際貨幣，涵蓋 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD、THB、NZD、CHF 等常用幣別。',
  },
  {
    question: '如何使用多幣別換算功能？',
    answer:
      '切換到多幣別模式後，可同時查看一個基準貨幣對多種目標貨幣的即時換算結果，適合旅遊比價、國際貿易報價與多市場追蹤。',
  },
  {
    question: '可以離線使用嗎？',
    answer:
      '可以。RateWise 採用 PWA 技術，首次開啟後會快取資源與最近匯率資料，離線時仍可用上次同步的數據進行換算。',
  },
  {
    question: '匯率更新頻率如何？',
    answer:
      '匯率數據每 5 分鐘自動更新一次，並在畫面顯示最近更新時間，您也可以手動重新整理以同步最新牌告資料。',
  },
  {
    question: '如何安裝 RateWise 到手機桌面？',
    answer:
      'iPhone 可在 Safari 點選分享後加入主畫面，Android 可在 Chrome 選擇安裝應用程式或加到主畫面。安裝後可像原生 App 一樣開啟。',
  },
  {
    question: 'RateWise 免費嗎？',
    answer: 'RateWise 完全免費、無廣告、無付費牆，也不要求註冊帳號。所有功能都開放給使用者使用。',
  },
  {
    question: '匯率換算結果準確嗎？',
    answer:
      '換算結果基於臺灣銀行官方牌告匯率，但實際交易匯率仍可能因銀行、平台與手續費產生差異，實際交易前請以交易方公告為準。',
  },
  {
    question: '可以查看歷史匯率嗎？',
    answer:
      '可以。RateWise 提供 7 到 30 天歷史匯率趨勢圖，幫助您觀察匯率波動並挑選較合適的換匯時機。',
  },
] as const satisfies readonly FAQEntry[];

export const FAQ_PAGE_SEO = {
  title: '常見問題 - RateWise 匯率工具完整 FAQ 解答',
  description:
    'RateWise 匯率好工具完整 FAQ 解答：匯率數據來源、支援 30+ 種貨幣、離線使用方式、安裝到手機、更新頻率與歷史匯率查看。',
  pathname: '/faq',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '常見問題', item: '/faq/' },
  ],
  faq: [...FAQ_PAGE_ENTRIES],
} as const satisfies SEOPageMetadata;

export const GUIDE_HOW_TO_STEPS = [
  {
    position: 1,
    name: '開啟 RateWise',
    text: '在瀏覽器中開啟 RateWise 匯率好工具，或將其加入手機主畫面作為 PWA 應用程式使用。',
    image: '/screenshots/step1-open-app.png',
  },
  {
    position: 2,
    name: '選擇換算模式',
    text: '在頁面頂部選擇單幣別或多幣別換算模式，依需求查看一對一或一對多的匯率結果。',
    image: '/screenshots/step2-select-mode.png',
  },
  {
    position: 3,
    name: '選擇原始貨幣',
    text: '在從欄位選擇您要兌換的貨幣，例如 TWD 台幣。',
    image: '/screenshots/step3-select-from.png',
  },
  {
    position: 4,
    name: '選擇目標貨幣',
    text: '在到欄位選擇您要兌換成的貨幣，例如 USD 美元或 JPY 日圓。',
    image: '/screenshots/step4-select-to.png',
  },
  {
    position: 5,
    name: '輸入金額',
    text: '輸入欲換算金額，或使用快速金額按鈕，系統會即時計算並顯示結果。',
    image: '/screenshots/step5-enter-amount.png',
  },
  {
    position: 6,
    name: '選擇匯率類型',
    text: '依換匯情境切換現金匯率或即期匯率。',
    image: '/screenshots/step6-rate-type.png',
  },
  {
    position: 7,
    name: '查看歷史趨勢',
    text: '展開匯率卡片可查看過去 30 天的歷史趨勢圖與波動資訊。',
    image: '/screenshots/step7-trend-chart.png',
  },
  {
    position: 8,
    name: '收藏常用貨幣',
    text: '點擊星號圖示收藏常用貨幣，方便未來快速存取。',
    image: '/screenshots/step8-favorites.png',
  },
] as const satisfies readonly HowToStep[];

export const GUIDE_PAGE_SEO = {
  title: '使用指南 - 如何使用 RateWise 進行匯率換算',
  description:
    '完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算，包含匯率類型切換、歷史趨勢查看與收藏功能。',
  pathname: '/guide',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '使用教學', item: '/guide/' },
  ],
  howTo: {
    name: '如何使用 RateWise 進行匯率換算',
    description: '完整 8 步驟教學，快速學會使用 RateWise 進行單幣別與多幣別匯率換算。',
    totalTime: 'PT2M',
    steps: [...GUIDE_HOW_TO_STEPS],
  },
  jsonLd: [buildShareImageJsonLd('RateWise 使用指南分享圖片', 'RateWise 使用指南與換算步驟預覽')],
} as const satisfies SEOPageMetadata;

export const ABOUT_PAGE_SEO = {
  title: '關於 RateWise 匯率好工具 - 資料來源與技術特色',
  description:
    'RateWise 是專為台灣用戶設計的即時匯率 PWA 工具，100% 基於臺灣銀行官方牌告匯率，支援 30+ 種貨幣換算與離線使用。',
  pathname: '/about',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '關於我們', item: '/about/' },
  ],
} as const satisfies SEOPageMetadata;

export const PRIVACY_PAGE_SEO = {
  title: '隱私政策 - RateWise 個人資料保護說明',
  description:
    'RateWise 隱私政策說明：我們不收集個人資料、不使用追蹤 Cookie，所有偏好與快取資料僅存放在您的裝置本地。',
  pathname: '/privacy',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '隱私政策', item: '/privacy/' },
  ],
  robots: 'noindex, follow',
} as const satisfies SEOPageMetadata;

export const APP_ONLY_PAGE_SEO = {
  multi: {
    title: '多幣別同時換算 - 一次比較 30+ 種即時匯率',
    description:
      'RateWise 多幣別同時換算功能，一次查看所有支援貨幣的即時匯率換算結果，適合旅遊換匯比價與跨境貿易報價。',
    pathname: '/multi',
    robots: 'noindex, follow',
  },
  favorites: {
    title: '收藏貨幣與換算歷史記錄 - 快速存取常用匯率',
    description: 'RateWise 收藏管理與換算歷史記錄頁面，支援快速回到主換算器並重新查看常用貨幣。',
    pathname: '/favorites',
    robots: 'noindex, follow',
  },
  settings: {
    title: '應用程式設定 - 介面風格切換與語言偏好管理',
    description: 'RateWise 設定頁面，提供介面風格、語言偏好與資料管理等應用程式個人化選項。',
    pathname: '/settings',
    robots: 'noindex, follow',
  },
} as const satisfies Record<string, SEOPageMetadata>;

const CURRENCY_PAGE_OVERRIDES = {
  USD: {
    displayName: '美金',
    region: '美國旅遊與海外付款',
    question: '1 USD 等於多少台幣？',
    keyword: '美金換台幣',
  },
  JPY: {
    displayName: '日圓',
    region: '日本旅遊換匯',
    question: '1 JPY 等於多少台幣？',
    keyword: '日圓換台幣',
  },
  EUR: {
    displayName: '歐元',
    region: '歐洲旅遊與跨境付款',
    question: '1 EUR 等於多少台幣？',
    keyword: '歐元換台幣',
  },
  GBP: {
    displayName: '英鎊',
    region: '英國旅遊換匯',
    question: '1 GBP 等於多少台幣？',
    keyword: '英鎊換台幣',
  },
  CNY: {
    displayName: '人民幣',
    region: '人民幣付款與報價',
    question: '1 CNY 等於多少台幣？',
    keyword: '人民幣換台幣',
  },
  KRW: {
    displayName: '韓元',
    region: '韓國旅遊換匯',
    question: '1000 KRW 等於多少台幣？',
    keyword: '韓元換台幣',
  },
  HKD: {
    displayName: '港幣',
    region: '香港旅遊換匯',
    question: '1 HKD 等於多少台幣？',
    keyword: '港幣換台幣',
  },
  AUD: {
    displayName: '澳幣',
    region: '澳洲旅遊與留學換匯',
    question: '1 AUD 等於多少台幣？',
    keyword: '澳幣換台幣',
  },
  CAD: {
    displayName: '加幣',
    region: '加拿大旅遊與留學換匯',
    question: '1 CAD 等於多少台幣？',
    keyword: '加幣換台幣',
  },
  SGD: {
    displayName: '新加坡幣',
    region: '新加坡旅遊與商務換匯',
    question: '1 SGD 等於多少台幣？',
    keyword: '新加坡幣換台幣',
  },
  THB: {
    displayName: '泰銖',
    region: '泰國旅遊換匯',
    question: '1 THB 等於多少台幣？',
    keyword: '泰銖換台幣',
  },
  NZD: {
    displayName: '紐元',
    region: '紐西蘭旅遊與留學換匯',
    question: '1 NZD 等於多少台幣？',
    keyword: '紐元換台幣',
  },
  CHF: {
    displayName: '瑞士法郎',
    region: '瑞士旅遊與跨境付款',
    question: '1 CHF 等於多少台幣？',
    keyword: '瑞士法郎換台幣',
  },
} as const;

export type CurrencyLandingCode = keyof typeof CURRENCY_PAGE_OVERRIDES;

export function getCurrencyLandingPageContent(
  code: CurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/${code.toLowerCase()}-twd`;
  const displayName = override.displayName;

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `${code} 對 TWD 匯率換算器 | 即時${displayName}台幣匯率`,
    description: `即時${displayName}兌台幣匯率換算，參考臺灣銀行官方牌告匯率，每 5 分鐘自動更新。${override.question}支援現金匯率與即期匯率切換、多幣別同時換算與離線 PWA 使用。適合${override.region}前快速比價。`,
    pathname,
    keywords: [
      `${code} TWD 匯率`,
      override.keyword,
      `${displayName}匯率`,
      '匯率換算',
      APP_INFO.name,
      'RateWise',
    ],
    faqEntries: [
      {
        question: '匯率數據來源與更新頻率？',
        answer: `資料 100% 參考臺灣銀行牌告匯率，包含現金與即期買入賣出價，每 5 分鐘自動同步一次。`,
      },
      {
        question: '換算結果與實際交易是否相同？',
        answer: `RateWise 提供牌告參考匯率，實際交易匯率仍可能因銀行、平台與手續費產生差異，請以實際交易方公告為準。`,
      },
      {
        question: '可以離線使用嗎？',
        answer: '可以。PWA 首次開啟後會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
      },
      {
        question: '如何同時查看多種貨幣？',
        answer: `切換到多幣別模式即可同時查看 ${code} 對所有支援貨幣的換算結果，也可收藏常用貨幣以便快速回查。`,
      },
    ],
    howToSteps: [
      {
        position: 1,
        name: '選擇原始貨幣',
        text: `在首頁將來源貨幣設定為 ${code}，再選擇 TWD 或其他目標貨幣。`,
      },
      {
        position: 2,
        name: '輸入金額',
        text: `輸入 ${code} 金額後會即時計算台幣換算結果，多幣別模式可同步查看 30+ 種貨幣。`,
      },
      {
        position: 3,
        name: '查看趨勢與匯率類型',
        text: '展開匯率卡片可查看歷史趨勢圖，並切換現金或即期匯率以符合不同換匯情境。',
      },
    ],
    highlights: [
      '資料來源：臺灣銀行牌告匯率，現金與即期買入賣出價完整呈現。',
      '更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間。',
      `適用情境：${override.region}前快速查看 ${code}/TWD 即時換算。`,
      'PWA 可離線使用，無網路時仍可查看最近同步的匯率資料。',
    ],
    faqTitle: `${displayName}換匯常見問題`,
  };
}
