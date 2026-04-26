import { CURRENCY_DEFINITIONS, SUPPORTED_CURRENCY_COUNT } from '../features/ratewise/constants';
import { APP_INFO, AUTHOR_PERSON, SEO_SOCIAL_LINKS } from './app-info';
import { DEFAULT_TITLE, GUIDE_PAGE_TITLE } from './seo-static';
import {
  SEO_RATE_EXAMPLES,
  SEO_RATE_EXAMPLES_DATE,
  type RateExample,
  type AlternativeProvider,
} from './generated/seo-rate-examples';
import { RATING_SNAPSHOT } from './generated/rating-snapshot';
import { RATES_API } from './api-endpoints';
import {
  PRERENDER_PATHS,
  SEO_PATHS,
  SHARE_IMAGE,
  TWITTER_IMAGE,
  normalizeSiteUrl,
} from './seo-paths';

export interface AlternateLink {
  hrefLang: string;
  href: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface HowToStep {
  position: number;
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
  faqContent?: FAQEntry[];
  answerCapsule?: FAQEntry[];
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

export interface HomepageSEOContent extends SEOPageMetadata {
  content: HomepageContent;
}

export interface AuthorityGuideSection {
  title: string;
  paragraphs: string[];
}

export interface RelatedCurrencyLink {
  href: string;
  label: string;
  code: string;
}

export interface AuthorityGuideContent extends SEOPageMetadata {
  heading: string;
  intro: string;
  highlights: string[];
  sections: AuthorityGuideSection[];
  ctaTitle: string;
  ctaDescription: string;
  relatedCurrencies: RelatedCurrencyLink[];
}

export interface CommonAmountEntry {
  amount: number;
  label: string;
  question: string;
}

export interface RelatedGuideLink {
  href: string;
  label: string;
  description: string;
}

export interface CurrencyLandingPageContent {
  currencyCode: string;
  currencyFlag: string;
  currencyName: string;
  title: string;
  description: string;
  pathname: string;
  canonical: string;
  keywords: string[];
  faqEntries: FAQEntry[];
  howToSteps: HowToStep[];
  highlights: string[];
  faqTitle: string;
  commonAmounts: CommonAmountEntry[];
  travelTip: string;
  jsonLd: JsonLdBlock[];
  direction: 'to-twd' | 'twd-to-foreign';
  alternativeProviders?: AlternativeProvider[];
  relatedGuides: RelatedGuideLink[];
  answerCapsule?: FAQEntry[];
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
export const SEO_INDEXABLE_LOCALES = [DEFAULT_LOCALE] as const;
export const OG_IMAGE_ALT = `${APP_INFO.name} 匯率轉換器分享圖片` as const;
export const DEFAULT_DESCRIPTION = `${APP_INFO.shortName} 顯示臺灣銀行牌告的實際買賣價（非中間價），讓你換匯前知道真正要付多少台幣。支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，每 5 分鐘同步，免費無廣告。`;
export const DEFAULT_KEYWORDS = [
  APP_INFO.subtitle,
  APP_INFO.shortName,
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
  '台銀匯率',
  '現金匯率',
  '即期匯率',
  '賣出匯率',
  '買入匯率',
  '換匯計算',
  '旅遊換匯',
  'exchange rate',
  'currency converter',
  'Taiwan bank exchange rate',
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
      '顯示實際買賣價（非中間價）——換匯金額更精準',
      '即時匯率查詢（臺灣銀行牌告匯率）',
      '現金與即期匯率切換（適合不同換匯情境）',
      '單幣別精準換算',
      '多幣別同時比較',
      '計算機鍵盤快速輸入',
      '快速金額按鈕',
      '收藏常用貨幣',
      '拖曳排序自訂幣別順序',
      '換算歷史記錄',
      '7~30 天歷史匯率趨勢圖',
      '6 種主題風格',
      '3 語言支援（繁中／英／日）',
      '下拉更新即時同步',
      '離線使用（PWA）',
      `${SUPPORTED_CURRENCY_COUNT} 種貨幣支援`,
    ],
  },
} as const;

export function buildCanonicalUrl(pathname?: string): string {
  if (!pathname || pathname === '/') return SITE_BASE_URL;
  if (/^https?:\/\//i.test(pathname)) {
    // query string 帶參數的 URL（如 deep-link）不加 trailing slash，保留原始格式。
    if (pathname.includes('?')) return pathname;
    return ensureTrailingSlash(sanitizeBaseUrl(pathname));
  }
  const normalizedPath = `${ensureLeadingSlash(pathname).replace(/\/+$/, '')}/`;
  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
}

export function buildDefaultAlternates(pathname?: string): AlternateLink[] {
  const href = buildCanonicalUrl(pathname);

  return [
    { hrefLang: 'x-default', href },
    { hrefLang: DEFAULT_LOCALE, href },
  ];
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

export interface RatingSnapshotLike {
  ratingValue: number | null;
  ratingCount: number;
}

export function shouldIncludeAggregateRating(snapshot: RatingSnapshotLike): boolean {
  return snapshot.ratingCount >= 10 && snapshot.ratingValue !== null;
}

export function buildSiteJsonLd(): JsonLdBlock[] {
  // @id 穩定 URI 讓 Google Knowledge Graph 跨頁面識別同一實體。
  const orgId = `${SITE_BASE_URL}#organization`;
  const siteId = `${SITE_BASE_URL}#website`;
  const appId = `${SITE_BASE_URL}#softwareapplication`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': appId,
      name: APP_INFO.name,
      alternateName: APP_INFO.subtitle,
      description: SITE_SEO.description,
      url: SITE_BASE_URL,
      applicationCategory: SITE_SEO.application.category,
      operatingSystem: ['Web', 'Android', 'iOS', 'Windows', 'macOS'],
      browserRequirements: SITE_SEO.application.browserRequirements,
      installUrl: SITE_BASE_URL,
      datePublished: `${APP_INFO.copyrightStartYear}-01-01`,
      dateModified: BUILD_TIME,
      author: { '@id': orgId },
      screenshot: [
        buildAbsoluteAssetUrl('/screenshots/mobile-home.png'),
        buildAbsoluteAssetUrl('/screenshots/desktop-features.png'),
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      // aggregateRating 讓 Google 在搜尋結果顯示星評卡片（SoftwareApplication Rich Result）。
      // 由 fetch-rating-snapshot.mjs 在 prebuild 時寫入 RATING_SNAPSHOT；
      // ratingCount < 10 時省略，避免樣本過少被 Google 拒絕。
      ...(shouldIncludeAggregateRating(RATING_SNAPSHOT)
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: String(RATING_SNAPSHOT.ratingValue),
              ratingCount: String(RATING_SNAPSHOT.ratingCount),
              bestRating: '5',
              worstRating: '1',
            },
          }
        : {}),
      featureList: SITE_SEO.application.featureList,
      inLanguage: SITE_SEO.locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': orgId,
      name: APP_INFO.author,
      url: SITE_BASE_URL,
      foundingDate: String(APP_INFO.copyrightStartYear),
      logo: buildAbsoluteAssetUrl('/icons/ratewise-icon-512x512.png'),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: APP_INFO.email,
      },
      sameAs: SITE_SEO.socialLinks,
      // knowsAbout：宣告組織的核心知識領域，供 Google AI Mode 識別引用來源。
      // 2026 後是影響 AI 搜尋引擎引用率最高的單一 entity 標記。
      knowsAbout: [
        '台灣銀行牌告匯率',
        '外幣換台幣',
        '台幣換外幣',
        '即期匯率',
        '現金匯率',
        '多幣別換算',
        '匯率換算工具',
        'exchange rate',
        'currency exchange TWD',
        'TWD exchange rate',
        'Taiwan Bank exchange rate',
        'PWA progressive web app',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': siteId,
      name: APP_INFO.name,
      alternateName: APP_INFO.subtitle,
      description: SITE_SEO.description,
      url: SITE_BASE_URL,
      inLanguage: SITE_SEO.locale,
      dateModified: BUILD_TIME,
      publisher: { '@id': orgId },
      // potentialAction：讓 Google 在 SERP 顯示 sitelinks 搜尋框（SearchAction）。
      // 匯率工具查詢模式：from={currency_code} 對應工具首頁的幣別 deep-link。
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_BASE_URL}?from={currency_code}&to=TWD`,
        },
        'query-input': 'required name=currency_code',
      },
    },
  ];
}

export function buildShareImageJsonLd(name: string, description: string): JsonLdBlock {
  const imageUrl = buildAbsoluteAssetUrl(SITE_SEO.ogImage);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    // @id 讓 Google Knowledge Graph 將 OG 圖片與 SoftwareApplication 實體建立關聯。
    '@id': `${imageUrl}#og-image`,
    contentUrl: imageUrl,
    url: imageUrl,
    width: 1200,
    height: 630,
    encodingFormat: 'image/jpeg',
    name,
    description,
    creator: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: APP_INFO.organizationUrl,
    },
    license: APP_INFO.licenseUrl,
    acquireLicensePage: APP_INFO.imageLicenseContactUrl,
    copyrightHolder: {
      '@type': 'Organization',
      name: APP_INFO.author,
    },
    copyrightNotice: `© ${new Date(BUILD_TIME).getUTCFullYear() || 2026} ${APP_INFO.author}`,
    creditText: APP_INFO.author,
    dateModified: BUILD_TIME,
  };
}

/**
 * @deprecated 使用 buildWebPageJsonLd 或 buildArticleJsonLd 的 speakableCssSelectors 選項。
 * 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 Article/WebPage 的 speakable 屬性中，
 * 而非獨立的 JSON-LD 區塊。
 * 參考：https://schema.org/speakable, https://developers.google.com/search/docs/appearance/structured-data/speakable
 */
export function buildSpeakableJsonLd(
  cssSelectors: string[] = ['h1', 'details summary', 'h3'],
): JsonLdBlock {
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: cssSelectors,
  };
}

interface WebPageOptions {
  /** CSS 選擇器陣列，標記語音搜尋引擎可朗讀的頁面區塊。 */
  speakableCssSelectors?: string[];
}

/**
 * 生成 ExchangeRateSpecification JSON-LD。
 * 每個幣對頁注入即時匯率，讓 AI 引擎可提取並顯示具體數字。
 * 參考：https://schema.org/ExchangeRateSpecification
 * @param fromCurrency 來源貨幣代碼（如 USD）
 * @param toCurrency 目標貨幣代碼（如 TWD）
 * @param rate 匯率數值（即期賣出價）
 * @param rateDescription 匯率描述（如「臺灣銀行即期賣出價」）
 */
export function buildExchangeRateSpecificationJsonLd(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  rateDescription: string,
): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'ExchangeRateSpecification',
    currency: fromCurrency,
    currentExchangeRate: {
      '@type': 'UnitPriceSpecification',
      price: String(rate),
      priceCurrency: toCurrency,
      description: rateDescription,
      validFrom: SEO_RATE_EXAMPLES_DATE,
    },
  };
}

/**
 * 生成金額頁專用 ExchangeRateSpecification JSON-LD。
 * 除了基本匯率外，額外包含具體換算金額，讓 AI 引擎可提取「X 外幣 = Y 台幣」形式的答案。
 * 參考：https://schema.org/ExchangeRateSpecification
 * @param fromCurrency 來源貨幣代碼（如 USD）
 * @param toCurrency 目標貨幣代碼（如 TWD）
 * @param rate 匯率數值（現金賣出價）
 * @param amount 換算金額（來源貨幣數量）
 * @param result 換算結果（目標貨幣數量）
 * @param direction 換算方向（to-twd: 外幣→台幣；twd-to-foreign: 台幣→外幣）
 */
export function buildAmountExchangeRateSpecificationJsonLd(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  amount: number,
  result: number,
  direction: 'to-twd' | 'twd-to-foreign',
): JsonLdBlock {
  const isTwdToForeign = direction === 'twd-to-foreign';
  const rateDescription = isTwdToForeign
    ? `臺灣銀行現金賣出價（${amount.toLocaleString('zh-TW')} TWD 換 ${result.toLocaleString('zh-TW')} ${toCurrency}）`
    : `臺灣銀行現金賣出價（${amount.toLocaleString('zh-TW')} ${fromCurrency} 換 ${result.toLocaleString('zh-TW')} TWD）`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ExchangeRateSpecification',
    currency: fromCurrency,
    currentExchangeRate: {
      '@type': 'UnitPriceSpecification',
      price: String(rate),
      priceCurrency: toCurrency,
      description: rateDescription,
      validFrom: SEO_RATE_EXAMPLES_DATE,
    },
  };
}

/**
 * 生成 CurrencyConversionService JSON-LD。
 * Schema.org 精確定義此工具的核心功能，AI 引擎在匹配「幣別換算」查詢時優先引用有此 schema 的頁面。
 * 參考：https://schema.org/CurrencyConversionService
 */
export function buildCurrencyConversionServiceJsonLd(): JsonLdBlock {
  const orgId = `${SITE_BASE_URL}#organization`;
  return {
    '@context': 'https://schema.org',
    '@type': 'CurrencyConversionService',
    '@id': `${SITE_BASE_URL}#currencyconversionservice`,
    name: APP_INFO.name,
    alternateName: APP_INFO.subtitle,
    description: `顯示臺灣銀行牌告實際買入賣出價（非中間價）的即時匯率換算工具，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣、現金與即期匯率切換、PWA 離線使用。`,
    provider: { '@id': orgId },
    url: SITE_BASE_URL,
    areaServed: 'TW',
    availableLanguage: ['zh-TW', 'en', 'ja'],
    inLanguage: DEFAULT_LOCALE,
    serviceType: 'Currency Exchange Rate Information',
    featureList: [
      '台灣銀行牌告匯率（現金/即期四種報價）',
      `${SUPPORTED_CURRENCY_COUNT} 種貨幣即時換算`,
      '每 5 分鐘自動同步',
      'PWA 離線使用',
      '匯率歷史趨勢圖（7-30 天）',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
    },
  };
}

/**
 * 生成 WebPage JSON-LD。
 * 用於首頁等非 Article 類型頁面，支援 speakable 屬性標記語音搜尋可朗讀區塊。
 * 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 WebPage 的 speakable 屬性中。
 * 參考：https://schema.org/speakable, https://developers.google.com/search/docs/appearance/structured-data/speakable
 */
export function buildWebPageJsonLd(
  name: string,
  description: string,
  url: string,
  options?: WebPageOptions,
): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${buildCanonicalUrl(url)}#webpage`,
    name,
    description,
    url: buildCanonicalUrl(url),
    dateModified: BUILD_TIME,
    inLanguage: DEFAULT_LOCALE,
    isPartOf: {
      '@id': `${SITE_BASE_URL}#website`,
    },
    ...(options?.speakableCssSelectors?.length
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: options.speakableCssSelectors,
          },
        }
      : {}),
  };
}

interface ArticleOptions {
  keywords?: string[];
  articleSection?: string;
  articleBody?: string;
  /** CSS 選擇器陣列，標記語音搜尋引擎可朗讀的頁面區塊。 */
  speakableCssSelectors?: string[];
}

export function buildOpenDataDatasetJsonLd(): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${APP_INFO.shortName} 台灣銀行牌告匯率開放資料`,
    description: `${APP_INFO.shortName} 提供臺灣銀行牌告匯率的開放 JSON 資料集，包含 18 種貨幣的現金與即期買入賣出四種報價，並提供最新匯率、歷史匯率與 OpenAPI 規格。`,
    url: buildCanonicalUrl('/open-data/'),
    license: APP_INFO.licenseUrl,
    isAccessibleForFree: true,
    inLanguage: DEFAULT_LOCALE,
    dateModified: BUILD_TIME,
    keywords: ['匯率 API', '開放資料', '台灣銀行匯率', 'exchange rate API', 'currency dataset'],
    creator: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: APP_INFO.organizationUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: APP_INFO.organizationUrl,
    },
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: `${APP_INFO.name} Open Data`,
      url: buildCanonicalUrl('/open-data/'),
    },
    distribution: [
      {
        '@type': 'DataDownload',
        name: '最新匯率 JSON',
        contentUrl: RATES_API.latestCdn,
        encodingFormat: 'application/json',
      },
      {
        '@type': 'DataDownload',
        name: '歷史匯率 JSON 範例',
        contentUrl: RATES_API.historyCdnExample,
        encodingFormat: 'application/json',
      },
      {
        '@type': 'DataDownload',
        name: 'OpenAPI 3.1 規格',
        contentUrl: `${SITE_BASE_URL}openapi.json`,
        encodingFormat: 'application/json',
      },
    ],
  };
}

/**
 * 生成作者 Person JSON-LD。
 * 用於 About 頁面（作者主頁）及 Article schema 的 author 欄位。
 * Threads 帳號作為公開可驗證的社群身份，強化 YMYL E-E-A-T 信號。
 */
export function buildPersonJsonLd(): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_PERSON.name,
    url: AUTHOR_PERSON.url,
    email: AUTHOR_PERSON.email,
    sameAs: [...AUTHOR_PERSON.sameAs],
    // knowsAbout：宣告作者個人知識領域，支持 E-E-A-T Expertise 信號。
    knowsAbout: [
      '台灣銀行牌告匯率',
      '即期匯率',
      '現金匯率',
      '匯率換算工具開發',
      'exchange rate',
      'currency exchange',
      'React',
      'TypeScript',
      'PWA',
      'SEO',
      'Web Performance',
    ],
  };
}

export function buildArticleJsonLd(
  headline: string,
  description: string,
  url: string,
  datePublished: string,
  options?: ArticleOptions,
): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: buildCanonicalUrl(url),
    datePublished,
    dateModified: BUILD_TIME,
    ...(options?.articleSection ? { articleSection: options.articleSection } : {}),
    ...(options?.keywords?.length ? { keywords: options.keywords } : {}),
    ...(options?.articleBody ? { articleBody: options.articleBody } : {}),
    // speakable：標記語音搜尋引擎可朗讀的頁面區塊（Google Assistant、ChatGPT 語音模式）。
    // 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 Article 的 speakable 屬性中。
    ...(options?.speakableCssSelectors?.length
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: options.speakableCssSelectors,
          },
        }
      : {}),
    image: buildAbsoluteAssetUrl(SITE_SEO.ogImage),
    // author: Person（個人作者身份），強化 YMYL E-E-A-T；publisher 仍為 Organization
    author: {
      '@type': 'Person',
      name: AUTHOR_PERSON.name,
      url: AUTHOR_PERSON.url,
      sameAs: [...AUTHOR_PERSON.sameAs],
    },
    // publisher：@id 引用 + 內聯 name/logo，同時滿足 linked data 與嚴格驗證器。
    publisher: {
      '@id': `${SITE_BASE_URL}#organization`,
      '@type': 'Organization',
      name: APP_INFO.author,
      logo: {
        '@type': 'ImageObject',
        url: buildAbsoluteAssetUrl('/icons/ratewise-icon-512x512.png'),
      },
    },
    inLanguage: DEFAULT_LOCALE,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': buildCanonicalUrl(url),
    },
  };
}

interface TechArticleOptions extends ArticleOptions {
  /** 目標讀者技術程度：beginner / intermediate / expert。 */
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  /** 使用本文章所需的前置技術（例如 JSON、HTTP、curl）。 */
  dependencies?: string[];
}

/**
 * 生成 TechArticle JSON-LD，適用於開發者文檔與 API 說明頁。
 * TechArticle 為 Article 子類型，能在搜尋結果中以技術文件的形式出現。
 * 參考：https://schema.org/TechArticle
 */
export function buildTechArticleJsonLd(
  headline: string,
  description: string,
  url: string,
  datePublished: string,
  options?: TechArticleOptions,
): JsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url: buildCanonicalUrl(url),
    datePublished,
    dateModified: BUILD_TIME,
    ...(options?.articleSection ? { articleSection: options.articleSection } : {}),
    ...(options?.keywords?.length ? { keywords: options.keywords } : {}),
    ...(options?.articleBody ? { articleBody: options.articleBody } : {}),
    ...(options?.proficiencyLevel ? { proficiencyLevel: options.proficiencyLevel } : {}),
    ...(options?.dependencies?.length ? { dependencies: options.dependencies.join(', ') } : {}),
    ...(options?.speakableCssSelectors?.length
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: options.speakableCssSelectors,
          },
        }
      : {}),
    image: buildAbsoluteAssetUrl(SITE_SEO.ogImage),
    author: {
      '@type': 'Person',
      name: AUTHOR_PERSON.name,
      url: AUTHOR_PERSON.url,
      sameAs: [...AUTHOR_PERSON.sameAs],
    },
    publisher: {
      '@id': `${SITE_BASE_URL}#organization`,
      '@type': 'Organization',
      name: APP_INFO.author,
      logo: {
        '@type': 'ImageObject',
        url: buildAbsoluteAssetUrl('/icons/ratewise-icon-512x512.png'),
      },
    },
    inLanguage: DEFAULT_LOCALE,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': buildCanonicalUrl(url),
    },
  };
}

/**
 * 生成替代換匯管道比較 FAQ 條目。
 * 若該幣別無 alternativeProviders，回傳空陣列。
 * @param direction 換匯方向：'twd-to-foreign'（預設，出境換外幣）或 'to-twd'（入境換回台幣）
 */
export function buildAlternativeProviderFaq(
  _code: string,
  example: RateExample,
  direction: 'to-twd' | 'twd-to-foreign' = 'twd-to-foreign',
): FAQEntry[] {
  if (!example.alternativeProviders?.length) return [];

  return example.alternativeProviders.map((provider) => {
    if (direction === 'to-twd') {
      // KRW→TWD 方向：旅客返台前在明洞換回台幣（使用 rateBuy）
      const exampleKRW = 1_000_000;
      const rateBuy = provider.rateBuy ?? provider.rate;
      const providerTWD = Math.floor(exampleKRW / rateBuy);
      return {
        question: `帶韓元回台灣，可以在${provider.name}先換好台幣嗎？`,
        answer: `${provider.name}（${provider.nameEn}）同時提供韓元換台幣的現場換匯服務。以 ${exampleKRW.toLocaleString()} 韓元為例，現場換匯約可換 ${providerTWD.toLocaleString()} 台幣（匯率 ${rateBuy.toFixed(1)} KRW/TWD）。返台前在首爾兌換通常比回台灣再換更划算，需現場持韓元現鈔親自前往（資料來源：${provider.source}，更新日期 ${provider.rateDate}）。`,
      };
    }

    // twd-to-foreign 方向：出境前換韓元（使用 rate，即 sell 率）
    const exampleTWD = example.exampleTWD;
    const taiwanBankKRW = example.foreignAtCash;
    const providerKRW = Math.floor(exampleTWD * provider.rate);
    const diffKRW = providerKRW - taiwanBankKRW;
    const diffPct = ((diffKRW / taiwanBankKRW) * 100).toFixed(1);
    return {
      question: `去首爾前，換韓元可以去${provider.name}嗎？比台銀划算多少？`,
      answer: `${provider.name}（${provider.nameEn}）提供現場現金換匯服務。以 ${exampleTWD.toLocaleString()} 元新台幣為例：台銀現金賣出約可換 ${taiwanBankKRW.toLocaleString()} 韓元，而在明洞現場換匯約可換 ${providerKRW.toLocaleString()} 韓元，多換約 ${diffKRW.toLocaleString()} 韓元（約多 ${diffPct}%）。需注意需現場親自前往，建議出發前確認最新匯率（資料來源：${provider.source}，更新日期 ${provider.rateDate}）。`,
    };
  });
}

/**
 * 將 FAQEntry 陣列轉換為 schema.org FAQPage JSON-LD 格式。
 * 僅供真正 FAQ 頁使用，避免把 FAQ rich result 訊號擴散到所有內容頁或金融頁。
 * 注意：FAQPage 必須與頁面主要可見內容一致，且不應在非 FAQ 主頁面重複輸出。
 * @param faqEntries FAQ 條目列表
 * @param maxItems 最多取幾則（預設 5，避免 schema 過長）
 */
export function buildFaqPageJsonLd(faqEntries: readonly FAQEntry[], maxItems = 5): JsonLdBlock {
  const items = faqEntries.slice(0, maxItems).map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      // 截斷過長答案（schema.org 業界建議 ≤ 300~500 字，含動態數據注入後容許略超）
      text: faq.answer.length > 800 ? faq.answer.slice(0, 797) + '…' : faq.answer,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items,
  };
}

export const HOMEPAGE_FAQ_CONTENT = [
  {
    question: `${APP_INFO.shortName} 和其他匯率工具有什麼不同？`,
    answer: `多數匯率工具顯示「中間價」（買賣均值），並非銀行實際換匯報價。${APP_INFO.shortName} 直接顯示臺灣銀行牌告的現金與即期買賣四種報價，讓您換匯前就知道真正要付多少台幣。以日圓為例，中間價與賣出價差約 1～3%，換 10 萬日圓大約差 1,500～3,000 元台幣。`,
  },
  {
    question: '支援哪些貨幣？',
    answer: `支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，包括 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等，可收藏常用貨幣並以拖曳排序自訂順序。`,
  },
  {
    question: '可以離線使用嗎？',
    answer: '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
  },
  {
    question: '匯率多久更新一次？',
    answer:
      '匯率數據每 5 分鐘自動同步臺灣銀行最新牌告匯率，畫面會顯示最近更新時間。您也可以在首頁下拉重新整理以手動同步。',
  },
  {
    question: '單幣別和多幣別模式有什麼差別？',
    answer:
      '單幣別模式適合精準換算一組貨幣對，可查看詳細買賣價與趨勢圖。多幣別模式可同時查看一個基準貨幣對所有支援貨幣的即時換算結果，適合旅遊前快速比價。',
  },
  {
    question: '支援哪些介面語言？',
    answer: '支援繁體中文、English 與日本語三種介面語言，可在設定頁面中切換。',
  },
  {
    question: '有哪些主題風格可選？',
    answer:
      '提供 6 種主題風格：Zen（極簡專業）、Nitro（深色科技）、Kawaii（可愛粉嫩）、Classic（復古書卷）、Ocean（海洋深邃）、Forest（自然森林），可在設定頁面中切換。',
  },
  {
    question: '什麼是現金匯率和即期匯率？',
    answer: `現金匯率適用於臨櫃換鈔，即期匯率適用於匯款與帳戶轉帳。${APP_INFO.shortName} 同時提供兩種匯率，您可依換匯情境一鍵切換，方便比較差異。`,
  },
] as const satisfies readonly FAQEntry[];

export const HOMEPAGE_HOW_TO: HowToData = {
  name: `如何使用 ${APP_INFO.shortName} 進行匯率換算`,
  description: '四步驟完成即時匯率換算，支援計算機快速輸入、收藏管理與歷史趨勢查看。',
  totalTime: 'PT30S',
  steps: [
    {
      position: 1,
      name: '選擇貨幣',
      text: `從下拉選單選擇來源貨幣與目標貨幣，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，可收藏常用幣別以便快速存取。`,
    },
    {
      position: 2,
      name: '輸入金額',
      text: '在輸入框直接輸入或展開計算機鍵盤快速輸入金額，也可使用快速金額按鈕一鍵帶入常用數字。',
    },
    {
      position: 3,
      name: '查看結果與趨勢',
      text: '換算結果即時顯示，可展開查看 7~30 天歷史趨勢圖，並切換現金或即期匯率以符合不同換匯情境。',
    },
    {
      position: 4,
      name: '管理與個人化',
      text: '在收藏頁面透過拖曳手柄調整貨幣順序、管理收藏清單與查看換算歷史記錄，並在設定頁面切換 6 種主題風格與 3 種介面語言。',
    },
  ],
};

export const HOMEPAGE_SEO = {
  description: SITE_SEO.description,
  pathname: '/',
  keywords: [...SITE_SEO.keywords],
  faqContent: [...HOMEPAGE_FAQ_CONTENT],
  howTo: HOMEPAGE_HOW_TO,
  // AEO/GEO 快速答案：AI 引擎直接引用的核心問答，設計為自足式句子。
  answerCapsule: [
    {
      question: `${APP_INFO.shortName} 顯示的是台銀哪種匯率？`,
      answer: `${APP_INFO.shortName} 顯示臺灣銀行牌告的實際買入與賣出價（現金與即期各兩種），不是銀行間中間價。你拿台幣換外幣時看「銀行賣出價」，把外幣換回台幣時看「銀行買入價」，每 5 分鐘自動同步。`,
    },
    {
      question: '換匯前為什麼要看賣出價，不看中間價？',
      answer:
        '中間價是銀行間批發報價，一般民眾換匯必須用「銀行賣出價」——即銀行賣外幣給你的價格。中間價與賣出價的差距通常 0.5～2%，換 1,000 美元可差 150～600 元新台幣，金額越大差距越明顯。',
    },
    {
      question: '現金匯率和即期匯率怎麼選？',
      answer:
        '臨櫃換外幣現鈔（出國帶現金）看現金匯率；外幣帳戶轉換、網銀購匯或海外匯款看即期匯率。現金匯率因為包含鈔券保管與運送成本，條件通常比即期差約 0.5～1%。',
    },
  ],
  jsonLd: [
    buildShareImageJsonLd(OG_IMAGE_ALT, `${APP_INFO.name} 首頁匯率換算與趨勢功能預覽`),
    // WebPage with speakable：標記首頁 h1 為語音搜尋主要可讀區塊。
    buildWebPageJsonLd(`${APP_INFO.name} — 即時匯率換算`, SITE_SEO.description, '/', {
      speakableCssSelectors: ['h1'],
    }),
    // CurrencyConversionService：精確定義此工具的核心功能，AI 引擎優先引用。
    buildCurrencyConversionServiceJsonLd(),
  ],
  content: {
    eyebrow: '臺灣銀行牌告匯率 · 每 5 分鐘同步 · 顯示實際買賣價',
    heading: `${APP_INFO.name} 即時匯率換算`,
    intro: `顯示臺灣銀行牌告的實際買入賣出價（不是中間價），讓你換匯前就知道真正要付多少台幣。支援台幣、美元、日圓、韓元、歐元等 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，每 5 分鐘自動同步，適合出國旅遊、海外付款與跨境報價前快速比價。`,
    highlights: [
      '顯示實際買賣價：臺灣銀行牌告匯率的現金與即期買入賣出四種報價，不是中間價——換匯金額更精準。',
      `支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，提供計算機快速輸入、收藏管理、拖曳排序與換算歷史。`,
      '6 種主題風格、3 語言介面（繁中／英／日），PWA 可離線使用，重新連線自動同步。',
    ],
    quickLinks: [
      { href: '/usd-twd/', label: 'USD/TWD 匯率' },
      { href: '/sell-rate-vs-mid-rate/', label: '賣出價指南' },
      { href: '/faq/', label: '常見問題' },
      { href: '/guide/', label: '使用指南' },
    ],
  },
} as const satisfies HomepageSEOContent;

// ─────────────────────────────────────────────────────────────────────────────
// 攻略頁發布日期 SSOT：每個攻略頁的獨立 datePublished
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 攻略頁發布日期：各頁面首次上線日期，用於 Article JSON-LD 的 datePublished。
 * 格式：YYYY-MM-DD（ISO 8601 日期格式）
 */
const GUIDE_PUBLISH_DATES = {
  sellRateVsMidRate: '2025-02-15',
  cashVsSpotRate: '2025-02-20',
  cardRateGuide: '2025-03-01',
  faq: '2025-01-15',
  guide: '2025-01-10',
  openData: '2025-03-10',
  about: '2025-01-01',
  seoTech: '2026-04-06',
} as const;

export const FAQ_PAGE_ENTRIES = [
  {
    question: `什麼是 ${APP_INFO.name}？`,
    answer: `${APP_INFO.shortName} 是基於臺灣銀行牌告匯率的即時匯率 PWA 應用，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算，提供單幣別與多幣別模式、計算機鍵盤快速輸入、收藏管理、拖曳排序、換算歷史紀錄與 7~30 天匯率趨勢圖。`,
  },
  {
    question: '匯率數據來源是什麼？',
    answer: `${APP_INFO.shortName} 的匯率資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步一次，涵蓋現金與即期買入賣出價四種報價。`,
  },
  {
    question: '現金匯率和即期匯率有什麼差別？',
    answer: `現金匯率適用於臨櫃換外幣現鈔（出國帶現金），即期匯率適用於外幣帳戶轉帳或國際匯款。兩者最大差異在於：現金匯率的買賣價差通常比即期匯率大約 0.5～2%，因為銀行需承擔現鈔的保管、運輸、保險與偽鈔鑑定成本。舉例：同樣兌換美元，台銀現金賣出匯率可能是 33.05，而即期賣出可能是 32.75，相差約 0.9%，換 1,000 美元約多付 300 元台幣。${APP_INFO.shortName} 支援一鍵切換現金與即期匯率，讓您依實際情境選擇正確報價。`,
  },
  {
    question: '買入和賣出匯率怎麼看？',
    answer: `買入與賣出是站在銀行角度定義的。「銀行買入」是銀行向您收購外幣的價格——您把外幣換回台幣時，參考此價；「銀行賣出」是銀行賣外幣給您的價格——您拿台幣換外幣時，參考此價。實際規則：出國換外幣看賣出價，回國換台幣看買入價；買賣差距通常在 0.5～3% 之間。${APP_INFO.shortName} 首頁預設顯示「銀行賣出價」（您出國時實際會付的金額），可透過切換按鈕同時查看買入賣出四種報價。`,
  },
  {
    question: '如何使用計算機鍵盤？',
    answer:
      '在金額輸入框點擊即可開啟底部計算機鍵盤，採用 iOS 標準按鍵配置，支援加減乘除、百分比、正負號切換與退格。也可使用實體鍵盤直接輸入，單幣別與多幣別模式皆可使用。',
  },
  {
    question: '快速金額按鈕有哪些？',
    answer: `${APP_INFO.shortName} 依據各國旅遊與消費習慣提供常用金額按鈕。例如台幣預設 100~5,000、日圓 1,000~30,000、韓元 10,000~300,000、美元 10~500，點擊即可一鍵帶入。`,
  },
  {
    question: '如何使用多幣別換算功能？',
    answer:
      '切換到多幣別模式後，可同時查看一個基準貨幣對所有支援貨幣的即時換算結果。點擊任一貨幣即可設為新的基準貨幣，每個貨幣可獨立切換現金或即期匯率。',
  },
  {
    question: '如何收藏貨幣與拖曳排序？',
    answer:
      '點擊貨幣旁的星號圖示即可收藏或取消收藏。在收藏頁面的「所有貨幣」列表中，透過拖曳手柄可重新排列貨幣順序，拖曳未收藏的貨幣會自動加入收藏，排序結果會自動儲存。',
  },
  {
    question: '換算歷史記錄如何運作？',
    answer:
      '每次換算結果會自動記錄在收藏頁面的「歷史記錄」分頁中。單擊可複製結果到剪貼簿，雙擊或長按可重新載入該組換算，也可一鍵清除全部歷史。',
  },
  {
    question: '匯率更新頻率如何？',
    answer:
      '匯率數據每 5 分鐘自動更新一次，畫面會顯示最近更新時間。您也可以在首頁下拉重新整理（Pull to Refresh）以手動同步最新牌告資料。',
  },
  {
    question: `如何安裝 ${APP_INFO.shortName} 到手機桌面？`,
    answer:
      'iPhone 可在 Safari 點選分享後加入主畫面，Android 可在 Chrome 選擇安裝應用程式或加到主畫面。安裝後可像原生 App 一樣從桌面直接開啟。',
  },
  {
    question: `${APP_INFO.shortName} 免費嗎？`,
    answer: `${APP_INFO.shortName} 完全免費、無廣告、無付費牆，不要求註冊帳號。所有功能（包含計算機、收藏、歷史記錄、主題切換等）皆開放使用。`,
  },
  {
    question: '匯率換算結果準確嗎？',
    answer:
      '換算結果基於臺灣銀行官方牌告匯率，但實際交易匯率仍可能因金融機構、交易平台與手續費產生差異，僅供參考，實際交易前請以交易方公告為準。',
  },
  {
    question: '可以查看歷史匯率嗎？',
    answer: `可以。${APP_INFO.shortName} 提供 7 到 30 天歷史匯率趨勢圖，幫助您觀察匯率波動趨勢並挑選較合適的換匯時機。`,
  },
  {
    question: '刷卡匯率跟台銀牌告匯率一樣嗎？',
    answer: `不一樣，兩者是完全不同的匯率體系。刷卡匯率由 Visa 或 Mastercard 等卡組織決定清算匯率，再加上發卡銀行收取的海外手續費（通常約 1.5%）；若商家啟用 DCC（動態貨幣轉換）還會再加 3～18% 匯差。台銀牌告匯率則是臺灣銀行每日公告的現金與即期買賣報價，適用於臨櫃換鈔或外幣帳戶匯款，與刷卡完全無關。${APP_INFO.shortName} 提供的是台銀牌告匯率，幫助您換匯前精確估算所需金額；刷卡費用估算建議參考您的發卡銀行公告的海外手續費率。`,
  },
  {
    question: '去韓國前要先換多少韓幣？',
    answer: `建議依行程天數與消費規劃決定。可在 ${APP_INFO.shortName} 使用韓元快速金額按鈕（10,000~300,000 韓元）估算所需台幣金額。提醒：韓國多數店家接受刷卡，建議準備部分現金搭配信用卡使用。`,
  },
  {
    question: '下拉更新是什麼功能？',
    answer:
      '在首頁向下拉動畫面超過一定距離，即可觸發匯率資料重新載入，同步臺灣銀行最新牌告匯率。此功能模擬原生 App 的「Pull to Refresh」操作體驗。',
  },
  {
    question: '什麼是 DCC（動態貨幣轉換）？為什麼要拒絕？',
    answer:
      'DCC（Dynamic Currency Conversion，動態貨幣轉換）是海外消費刷卡時，商家或 ATM 提供「直接以台幣結帳」的選項。看起來方便，實際上商家採用的台幣匯率通常比 Visa/Mastercard 清算匯率差 3～18%，等於讓消費者多付一筆隱形匯差。正確做法：結帳時一律選「以當地貨幣（Local Currency）結帳」，由您的發卡銀行按卡組織匯率清算，費用通常比 DCC 低得多。台灣各大信用卡的海外手續費約 1.5%，遠低於 DCC 的 3～18%。',
  },
  {
    question: '我要換外幣應該看哪個匯率？',
    answer: `依換匯情境對照四種報價：臨櫃換外幣紙鈔（出國帶現金）看「現金賣出」；外幣帳戶線上購匯或匯款看「即期賣出」；臨櫃把外幣紙鈔換回台幣看「現金買入」；外幣帳戶結匯回台幣看「即期買入」。口訣：出國用外幣看賣出，換回台幣看買入；拿紙鈔看現金，走帳戶看即期。以美元為例，台銀現金賣出約 33.0，即期賣出約 32.7，現金買入約 32.2，即期買入約 32.5（數字每日變動，僅供說明用途）。${APP_INFO.shortName} 在主畫面支援一鍵切換四種報價，讓您依情境快速確認換匯金額。`,
  },
  {
    question: '刷卡匯率怎麼計算？',
    answer: `海外刷卡的實際費用由三個部分組成：① 卡組織清算匯率（Visa 或 Mastercard 每日公告，通常接近市場中間價）；② 發卡銀行海外交易手續費（台灣多數銀行約 1.5%，部分免手續費卡例外）；③ 若選擇 DCC（動態貨幣轉換），商家再加收約 3～18% 的匯差。公式：實際費用 ≈ 消費金額 × 卡組織匯率 × (1 + 手續費%)，選 DCC 則再乘上商家加碼匯率。台銀牌告匯率與此為不同體系，${APP_INFO.shortName} 提供的是台銀牌告用於換現鈔，而非刷卡估算。`,
  },
  {
    question: '現金匯率為什麼比即期匯率差？',
    answer:
      '因為銀行持有實體外幣現鈔會產生額外的營運成本，包括：安全金庫保管費、跨國鈔券運送費、損毀保險費，以及偽鈔鑑定所需的人力與設備費。這些成本會反映在現金匯率的買賣價差上，使現金匯率的條件通常比即期匯率差約 0.5～2%（依幣別而異）。以換 1,000 美元為例，現金賣出與即期賣出的差距通常在 150～600 元台幣之間，金額越大差距越明顯。即期匯率是外幣帳戶間的電子帳面轉帳，不涉及實體鈔券調度，因此成本較低、條件較現金匯率優惠。',
  },
] as const satisfies readonly FAQEntry[];

export const FAQ_PAGE_SEO = {
  title: `${APP_INFO.shortName} 常見問題 FAQ：台銀匯率、DCC 與現金即期一次看懂`,
  description: `整理 ${APP_INFO.shortName} 最常被問的換匯問題，涵蓋台銀匯率來源、現金與即期差異、買入賣出判讀、DCC 刷卡匯率、收藏排序、歷史記錄、離線使用與 PWA 安裝重點，讓第一次換匯也能快速判斷並少踩錯價。`,
  pathname: '/faq/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '常見問題', item: '/faq/' },
  ],
  // AEO/GEO 快速答案：FAQ 頁頂部快速提取的核心答案，AI 引擎直接引用。
  answerCapsule: [
    {
      question: '現金匯率和即期匯率有什麼差別？',
      answer:
        '現金匯率用於臨櫃換外幣現鈔（出國帶現金），即期匯率用於外幣帳戶轉帳或匯款。現金匯率買賣價差比即期大約 0.5～2%，因為銀行承擔現鈔的保管、運輸與保險成本。',
    },
    {
      question: '買入匯率和賣出匯率怎麼分辨？',
      answer:
        '「銀行賣出」是銀行賣外幣給你的價格——你拿台幣換外幣出國時看此欄；「銀行買入」是銀行向你收購外幣的價格——你把外幣換回台幣時看此欄。口訣：出國換外幣看賣出，回台換台幣看買入。',
    },
    {
      question: 'DCC 動態貨幣轉換是什麼？為什麼要拒絕？',
      answer:
        'DCC 是海外刷卡時商家提供「直接以台幣結帳」的選項，匯率通常比卡組織清算匯率差 3～18%。正確做法：一律選「當地貨幣（Local Currency）結帳」，由發卡銀行按卡組織匯率清算，手續費通常僅約 1.5%。',
    },
  ],
  faqContent: [...FAQ_PAGE_ENTRIES],
  jsonLd: [
    buildFaqPageJsonLd(FAQ_PAGE_ENTRIES),
    buildArticleJsonLd(
      `常見問題 — ${APP_INFO.name} FAQ 解答`,
      `${APP_INFO.name}完整 FAQ：匯率來源、現金與即期差別、買入賣出怎麼看、DCC 動態貨幣轉換、刷卡匯率計算。`,
      '/faq/',
      GUIDE_PUBLISH_DATES.faq,
      {
        articleSection: 'FAQ',
        keywords: [
          '匯率',
          '常見問題',
          '臺灣銀行匯率',
          '換匯',
          '現金買賣',
          '即期匯率',
          'DCC',
          '外幣匯率',
        ],
        articleBody: `${APP_INFO.name}完整 FAQ：匯率來源、現金與即期差別、買入賣出怎麼看、DCC 動態貨幣轉換、刷卡匯率計算、計算機與快速金額、收藏排序、多幣別模式、歷史趨勢、主題切換、離線使用與安裝教學。`,
        speakableCssSelectors: ['h1', 'details summary'],
      },
    ),
  ],
} satisfies SEOPageMetadata;

export const GUIDE_HOW_TO_STEPS = [
  {
    position: 1,
    name: `開啟 ${APP_INFO.shortName}`,
    text: `在瀏覽器中開啟 ${APP_INFO.name}，或將其加入手機主畫面作為 PWA 應用程式使用。`,
    image: '/screenshots/mobile-home.png',
  },
  {
    position: 2,
    name: '選擇換算模式',
    text: '在頁面頂部選擇單幣別或多幣別換算模式，依需求查看一對一或一對多的匯率結果。',
    image: '/screenshots/desktop-features.png',
  },
  {
    position: 3,
    name: '選擇原始貨幣',
    text: '在從欄位選擇您要兌換的貨幣，例如 TWD 台幣。',
    image: '/screenshots/mobile-converter-active.png',
  },
  {
    position: 4,
    name: '選擇目標貨幣',
    text: '在到欄位選擇您要兌換成的貨幣，例如 USD 美元或 JPY 日圓。',
    image: '/screenshots/desktop-converter.png',
  },
  {
    position: 5,
    name: '輸入金額',
    text: '輸入欲換算金額，或使用快速金額按鈕，系統會即時計算並顯示結果。',
    image: '/screenshots/mobile-converter-active.png',
  },
  {
    position: 6,
    name: '選擇匯率類型',
    text: '依換匯情境切換現金匯率或即期匯率。',
    image: '/screenshots/mobile-features.png',
  },
  {
    position: 7,
    name: '查看歷史趨勢',
    text: '展開匯率卡片可查看過去 30 天的歷史趨勢圖與波動資訊。',
    image: '/screenshots/desktop-features.png',
  },
  {
    position: 8,
    name: '收藏常用貨幣',
    text: '點擊星號圖示收藏常用貨幣，方便未來快速存取。',
    image: '/screenshots/mobile-features.png',
  },
] as const satisfies readonly HowToStep[];

export const GUIDE_PAGE_SEO = {
  title: GUIDE_PAGE_TITLE,
  description: `${APP_INFO.shortName} 使用指南用 8 步驟帶你完成單幣別與多幣別匯率換算，並掌握現金與即期切換、快速金額按鈕、歷史趨勢、收藏管理、下拉更新與 PWA 安裝，快速建立正確換匯操作流程與判讀順序。`,
  pathname: '/guide/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '使用教學', item: '/guide/' },
  ],
  answerCapsule: [
    {
      question: `第一次換匯時，${APP_INFO.shortName} 最重要的用法是什麼？`,
      answer: `第一次換匯時，通常先看銀行賣出價，再分辨你是臨櫃換現鈔還是走外幣帳戶／匯款。${APP_INFO.shortName} 會把這兩件事拆開顯示，避免只看中間價而低估實際成本。`,
    },
    {
      question: '什麼時候該看現金匯率，什麼時候該看即期匯率？',
      answer:
        '臨櫃換外幣現鈔看現金匯率，外幣帳戶轉換、網銀或匯款看即期匯率。現金匯率通常比即期差，因為包含現鈔保管與運送成本。',
    },
  ],
  howTo: {
    name: `如何使用 ${APP_INFO.shortName} 進行匯率換算`,
    description: `完整 8 步驟教學，快速學會使用 ${APP_INFO.shortName} 進行單幣別與多幣別匯率換算。`,
    totalTime: 'PT2M',
    steps: [...GUIDE_HOW_TO_STEPS],
  },
  jsonLd: [
    buildShareImageJsonLd(
      `${APP_INFO.shortName} 使用指南分享圖片`,
      `${APP_INFO.shortName} 使用指南與換算步驟預覽`,
    ),
    buildArticleJsonLd(
      GUIDE_PAGE_TITLE,
      `完整 8 步驟教學，快速學會使用 ${APP_INFO.shortName} 進行單幣別和多幣別匯率換算，包含匯率類型切換、歷史趨勢查看與收藏功能。`,
      '/guide/',
      GUIDE_PUBLISH_DATES.guide,
      {
        articleSection: '使用教學',
        keywords: [
          '匯率換算教學',
          '使用指南',
          '台幣換外幣',
          '即期匯率',
          '多幣別換算',
          '收藏功能',
          'PWA 安裝',
        ],
        articleBody: `完整 8 步驟教學，快速學會使用 ${APP_INFO.shortName} 進行單幣別和多幣別匯率換算，包含匯率類型切換、歷史趨勢查看與收藏功能。從開啟應用程式、選擇換算模式、選擇貨幣到輸入金額，每個步驟均有圖文說明。`,
        speakableCssSelectors: ['h1', 'h3'],
      },
    ),
  ],
} satisfies SEOPageMetadata;

export const OPEN_DATA_PAGE_FAQ = [
  {
    question: '如何取得最新匯率資料？',
    answer: `直接 GET \`${RATES_API.latestCdn}\`，無需 API Key。回傳 JSON 包含 ${SUPPORTED_CURRENCY_COUNT} 種貨幣的現金買入、現金賣出、即期買入、即期賣出四種報價。建議 client 端自行快取 5 分鐘，與資料更新頻率一致，避免無意義重複請求。`,
  },
  {
    question: 'jsDelivr CDN 和 GitHub Raw 端點有何差異？',
    answer: `jsDelivr CDN（建議）：全球 PoP 節點加速，無明確請求上限，支援 ETag 條件式請求（瀏覽器可讀取 ETag，實作 If-None-Match 省流量）。GitHub Actions 每次推送 data 分支後自動呼叫 jsDelivr Purge API，CDN 快取立即失效，實際新鮮度約 5 分鐘。GitHub Raw（備援）：無快取，每次請求直接取得最新版本，但每小時限 60 次請求，CORS 不暴露 ETag，瀏覽器端無法使用條件式請求。`,
  },
  {
    question: '有備援端點嗎？',
    answer: `有。jsDelivr CDN 不可用時會自動切換至 GitHub Raw 端點 \`${RATES_API.latestRaw}\`，無快取，每次請求直接取得最新資料。注意未認證 IP 每小時限 60 次請求。`,
  },
  {
    question: '如何查詢歷史匯率？',
    answer: `將日期代入路徑：\`${RATES_API.historyCdnExample}\`，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣歷史資料。若該日無資料（如假日），伺服器回傳 404。`,
  },
] as const satisfies readonly FAQEntry[];

export const OPEN_DATA_PAGE_SEO = {
  title: '開放資料 API — 台銀牌告匯率 JSON 端點',
  description: `${APP_INFO.shortName} 開放台灣銀行牌告匯率 JSON 資料：jsDelivr CDN 與 GitHub Raw 雙端點，支援 curl / JS / Python 查詢。免費、免 API Key。`,
  pathname: '/open-data/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '開放資料 API', item: '/open-data/' },
  ],
  answerCapsule: [
    {
      question: '要串接最新台銀牌告匯率，應該用哪個端點？',
      answer: `最新台銀牌告匯率建議直接讀取 latest.json：${RATES_API.latestCdn}。這是免 API Key 的主要 CDN 端點，適合正式環境。`,
    },
    {
      question: `SEO 與 AI 引用應該連到哪種 ${APP_INFO.shortName} URL？`,
      answer:
        '可索引金額落地頁採用 /usd-twd/1000/ 這種 path-based URL，適合內容頁、搜尋引擎與 AI 引用；首頁 query deep link 則只建議用在互動導流與分享當下狀態。',
    },
  ],
  faqContent: [...OPEN_DATA_PAGE_FAQ],
  howTo: {
    name: `如何呼叫 ${APP_INFO.shortName} 開放匯率 API`,
    description: '透過 jsDelivr CDN 端點取得台銀牌告匯率 JSON 資料，免費、免 API Key。',
    steps: [
      {
        position: 1,
        name: '選擇端點',
        text: '建議使用 jsDelivr CDN 主要端點，全球加速，適合生產環境。GitHub Raw 為備援。',
      },
      {
        position: 2,
        name: '呼叫最新匯率',
        text: `使用 curl 或任何 HTTP 客戶端，GET ${RATES_API.latestCdn}，無需 API Key。`,
      },
      {
        position: 3,
        name: '解析 JSON',
        text: '回傳 JSON 包含 details.{幣別}.cash.buy/sell 與 details.{幣別}.spot.buy/sell 四種報價。',
      },
    ],
  },
  jsonLd: [
    buildOpenDataDatasetJsonLd(),
    buildShareImageJsonLd(
      `${APP_INFO.shortName} 開放資料 API 分享圖片`,
      `${APP_INFO.shortName} 開放台灣銀行牌告匯率 JSON 資料`,
    ),
    buildTechArticleJsonLd(
      '開放資料 API — 台銀牌告匯率 JSON 端點',
      `${APP_INFO.shortName} 開放台灣銀行牌告匯率 JSON 資料：jsDelivr CDN 與 GitHub Raw 雙端點，支援 curl / JS / Python 查詢。免費、免 API Key。`,
      '/open-data/',
      GUIDE_PUBLISH_DATES.openData,
      {
        articleSection: '開放資料',
        keywords: [
          '開放資料',
          '匯率API',
          '台銀匯率',
          'JSON',
          'REST API',
          'jsDelivr',
          'GitHub',
          'curl',
          'fetch',
        ],
        articleBody: `${APP_INFO.shortName} 提供台灣銀行牌告匯率的開放 JSON 資料，無需 API Key，免費使用。主要端點透過 jsDelivr CDN 加速，備援端點透過 GitHub Raw。支援最新匯率（每 5 分鐘更新）與歷史匯率查詢，涵蓋 ${SUPPORTED_CURRENCY_COUNT} 種貨幣的現金與即期四種報價。`,
        speakableCssSelectors: ['h1', 'h3'],
        proficiencyLevel: 'Beginner',
        dependencies: ['HTTP', 'JSON', 'curl 或 fetch'],
      },
    ),
  ],
} satisfies SEOPageMetadata;

export const ABOUT_PAGE_FAQ = [
  {
    question: '匯率數據來源是什麼？',
    answer:
      '資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。',
  },
  {
    question: '免費使用嗎？需要帳號或有廣告嗎？',
    answer:
      '完全免費、無廣告、無付費功能，不需要建立帳號。計算機、收藏、歷史記錄、主題風格等所有功能皆可直接使用。',
  },
  {
    question: '和一般匯率 App 有什麼不同？',
    answer:
      '一般工具顯示中間價（買賣均值），本工具顯示臺灣銀行牌告的實際現金與即期四種報價，讓您換匯前就知道真正要付多少台幣。',
  },
  {
    question: '如何聯絡開發者？',
    answer: `可透過 Email（${APP_INFO.email}）聯繫，歡迎回饋意見或錯誤回報，也可在 GitHub（${APP_INFO.github}）查看原始碼或提交 Issue。`,
  },
  {
    question: '匯差數字如何保持最新且讓搜尋引擎正確讀取？',
    answer:
      '匯差範例數據由 GitHub Actions 每日自動執行：同時抓取台灣銀行牌告匯率與 open.er-api.com 市場中間價（Google、XE、Wise、Apple 計算機的共同基準），進行雙重驗證（兩個中間價差距須在 2% 以內），生成靜態 TypeScript 常數，透過 Pull Request 自動審核後進入主分支。最終數字直接嵌入靜態 HTML（vite-react-ssg SSG 預渲染），Google 爬蟲無需執行 JavaScript 即可讀取所有匯差數字。',
  },
  {
    question: '這個網站使用哪些結構化資料幫助搜尋引擎與 AI 系統理解內容？',
    answer: `目前站內實際部署的 schema.org JSON-LD 包含 WebSite（全站識別）、SoftwareApplication（產品資訊）、Organization（聯絡資訊）、CurrencyConversionService（首頁）、ExchangeRateSpecification（幣對頁與金額頁的匯率數值）、BreadcrumbList（麵包屑導覽）、Article（內容頁）、HowTo（Guide 教學頁）、FAQPage（僅 /faq/ 主 FAQ 頁）與 ImageObject（分享圖片授權）。首頁與內容頁仍保留可讀 FAQ HTML，但不會在所有頁面重複輸出 FAQPage JSON-LD；幣別換算頁則以可稽核的匯率數值 schema 為主，避免把 FAQ rich result 訊號擴散到金融頁。sitemap.xml 只收錄公開可索引 URL，並同步 hreflang 資訊。`,
  },
  {
    question: `${APP_INFO.shortName} 是否支援 AI 搜尋引擎與 LLM 引用？`,
    answer:
      'robots.txt 明確允許多種主流 AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot、Google-Extended、GrokBot、Applebot-Extended 等）全站讀取；另提供 llms.txt 與 llms-full.txt 供大型語言模型快速理解站點架構，openapi.json 供 AI Agent 呼叫即時匯率 API。FAQ 文案中的匯差數字採雙幣標示（外幣 + 台幣），針對 LLM 引用語意設計，確保 AI 回答換匯問題時能引用精確數字而非中間價。',
  },
] as const satisfies readonly FAQEntry[];

export const ABOUT_PAGE_SEO = {
  title: `關於 ${APP_INFO.name} - 資料來源、技術架構與 SEO 透明度`,
  description: `了解 ${APP_INFO.shortName} 的資料來源、更新機制、技術架構與 SEO 透明度。站點以台銀牌告實際買賣價為核心，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣、PWA 離線使用、SSG 預渲染、JSON-LD 結構化資料與 AI 可讀文件輸出，所有公開資訊皆可追溯。`,
  pathname: '/about/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '關於我們', item: '/about/' },
  ],
  answerCapsule: [
    {
      question: `${APP_INFO.shortName} 是什麼樣的匯率工具？`,
      answer: `${APP_INFO.shortName} 是以臺灣銀行牌告匯率為基礎的換匯工具，重點是幫台灣用戶看懂實際買入價、賣出價、現金價與即期價，不以市場中間價作為主要決策依據。`,
    },
    {
      question: '為什麼它和一般顯示中間價的匯率工具不同？',
      answer: `一般中間價工具適合觀察市場方向，但不等於實際換匯成本。${APP_INFO.shortName} 直接顯示台銀牌告四種報價，讓你在臨櫃換鈔、外幣帳戶或匯款前更接近真實金額。`,
    },
  ],
  faqContent: [...ABOUT_PAGE_FAQ],
  jsonLd: [
    buildArticleJsonLd(
      `關於 ${APP_INFO.name} - 資料來源、技術架構與 SEO 透明度`,
      `${APP_INFO.name}是專為台灣用戶設計的即時匯率 PWA 工具，資料來源為臺灣銀行官方牌告匯率，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算與離線使用。採用 SSG 靜態預渲染、schema.org JSON-LD 結構化資料與每日自動更新匯差數據。`,
      '/about/',
      GUIDE_PUBLISH_DATES.about,
      {
        articleSection: '關於我們',
        keywords: [
          '台灣銀行匯率',
          '即時匯率工具',
          'PWA',
          '離線使用',
          '台幣換算',
          '免費匯率',
          'schema.org',
          'JSON-LD',
          '結構化資料',
          'SSG',
          '靜態預渲染',
          '匯差計算',
          'LLM 引用',
        ],
        articleBody: `${APP_INFO.name}是專為台灣用戶設計的即時匯率 PWA 工具，資料來源為臺灣銀行官方牌告匯率，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算與離線使用。完全免費、無廣告，資料每 5 分鐘自動同步，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。各頁面部署 schema.org JSON-LD 結構化標記，採用 SSG 靜態預渲染確保爬蟲可讀性，匯差數據每日自動雙重驗證更新。`,
        speakableCssSelectors: ['h1', 'h3'],
      },
    ),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      url: buildCanonicalUrl('/about/'),
      name: `關於我們 - ${APP_INFO.name}`,
      description: `${APP_INFO.shortName} 關於頁面提供聯繫方式、資料來源說明、技術架構與 SEO 透明度資訊。`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: APP_INFO.email ?? 'haotool.org@gmail.com',
        url: buildCanonicalUrl('/about/'),
      },
      publisher: {
        '@id': `${SITE_BASE_URL}#organization`,
        '@type': 'Organization',
        name: APP_INFO.author,
      },
    },
    buildPersonJsonLd(),
  ],
} satisfies SEOPageMetadata;

// ─────────────────────────────────────────────────────────────────────────────
// 相關幣別連結 SSOT：攻略頁連結至熱門幣別頁
// ─────────────────────────────────────────────────────────────────────────────

/** 熱門幣別連結：攻略頁連結至最常用的幣別頁。 */
const RELATED_CURRENCIES: RelatedCurrencyLink[] = [
  { href: '/jpy-twd/', label: '日圓匯率', code: 'JPY' },
  { href: '/usd-twd/', label: '美金匯率', code: 'USD' },
  { href: '/krw-twd/', label: '韓元匯率', code: 'KRW' },
  { href: '/eur-twd/', label: '歐元匯率', code: 'EUR' },
  { href: '/cny-twd/', label: '人民幣匯率', code: 'CNY' },
  { href: '/thb-twd/', label: '泰銖匯率', code: 'THB' },
];

export const SELL_RATE_VS_MID_RATE_PAGE = {
  title: `賣出價與中間價差在哪？為什麼換匯不能只看中間價 | ${APP_INFO.shortName}`,
  description: `解析賣出價、中間價與實際換匯成本差異，說清楚為什麼 Google 或 XE 顯示的中間價不能直接拿來估算換匯預算。${APP_INFO.shortName} 聚焦臺灣銀行牌告賣出價，協助台灣用戶在買外幣前更接近真實支付金額與旅費規劃。`,
  pathname: '/sell-rate-vs-mid-rate/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '賣出價與中間價差異', item: '/sell-rate-vs-mid-rate/' },
  ],
  heading: '賣出價比中間價更接近你真正要付的台幣',
  intro:
    '多數匯率網站與金融 App 主打中間價，適合用來觀察市場方向，但不等於你去銀行買外幣時的實際成本。對台灣使用者來說，真正影響換匯預算的通常是銀行賣出價，尤其是臨櫃換現鈔時的現金賣出價。',
  highlights: [
    '中間價是買入與賣出的平均值，不是銀行實際成交價。',
    '你拿台幣買外幣時，通常要看銀行賣出價。',
    '換匯金額越大，中間價與實際賣出價的差距越明顯。',
  ],
  answerCapsule: [
    {
      question: '換匯時為什麼不能只看中間價？',
      answer:
        '因為中間價只是市場平均參考，不是銀行真正賣給你的價格。你拿台幣買外幣時，通常應該看銀行賣出價，尤其臨櫃換現鈔時更要看現金賣出。',
    },
    {
      question: '對台灣使用者來說，什麼價格最接近真實成本？',
      answer:
        '如果目標是估算今天要付多少台幣，台銀牌告的現金賣出或即期賣出，通常都比中間價更接近實際換匯成本。',
    },
  ],
  sections: [
    {
      title: '中間價適合看市場，不適合估實際換匯成本',
      paragraphs: [
        '中間價常見於 Google、XE 或國際金融資訊平台，主要用途是快速比較市場匯率方向。這類價格沒有納入銀行牌告買賣差，也沒有反映現鈔、匯款或手續費情境。',
        '如果你只是想知道最近美元或日圓偏強還是偏弱，中間價有參考價值；但若你的目標是估算「我今天去銀行換 5 萬日圓要付多少台幣」，中間價就會偏樂觀。',
      ],
    },
    {
      title: '買外幣看賣出價，賣外幣看買入價',
      paragraphs: [
        '銀行牌告的買入與賣出是站在銀行角度。你拿台幣買外幣，銀行是在賣外幣給你，所以要看賣出價；你把外幣換回台幣，銀行是在買你的外幣，所以要看買入價。',
        `${APP_INFO.shortName} 把這個判讀邏輯放在首頁、FAQ 與各幣別頁，目的就是避免使用者只看到漂亮的中間價，卻低估了實際換匯成本。`,
      ],
    },
    {
      title: '為什麼台灣用戶更需要賣出價視角',
      paragraphs: [
        '台灣多數匯率需求集中在旅遊換匯、外幣帳戶轉換與海外付款前估算。這些情境都更接近「我要付出多少台幣」，因此賣出價通常比中間價更有決策價值。',
        `${APP_INFO.shortName} 採用臺灣銀行牌告匯率作為資料來源，讓使用者在同一個介面中比較現金賣出與即期賣出，避免把不同情境混在一起判讀。`,
      ],
    },
  ],
  faqContent: [
    {
      question: '為什麼中間價看起來比較優惠？',
      answer:
        '因為中間價是買入與賣出的平均值，天然會落在兩者之間。它不是銀行實際賣給你的價格，所以看起來通常比實際賣出價更漂亮。',
    },
    {
      question: `拿台幣換外幣時，${APP_INFO.shortName} 建議看哪個欄位？`,
      answer:
        '臨櫃換現鈔看現金賣出，外幣帳戶或網銀換匯看即期賣出。兩者都比中間價更接近你真正會支付的台幣金額。',
    },
    {
      question: '中間價完全沒有參考價值嗎？',
      answer:
        '不是。中間價仍可用來觀察大方向與跨平台比較，但若目標是做換匯決策或估算預算，應優先看銀行牌告的實際賣出或買入價格。',
    },
  ],
  ctaTitle: '直接用實際賣出價換算',
  ctaDescription:
    '回到首頁輸入金額，即可用臺灣銀行牌告的現金賣出或即期賣出估算更接近實際的換匯成本。',
  relatedCurrencies: RELATED_CURRENCIES,
  jsonLd: [
    buildArticleJsonLd(
      '賣出價與中間價差在哪？為什麼換匯不能只看中間價',
      `解析賣出價、中間價與實際換匯成本差異。${APP_INFO.shortName} 聚焦臺灣銀行牌告賣出價，協助台灣用戶在買外幣前估算更接近實際支付的台幣金額。`,
      '/sell-rate-vs-mid-rate/',
      GUIDE_PUBLISH_DATES.sellRateVsMidRate,
      {
        articleSection: '匯率知識',
        keywords: ['中間價', '賣出價', '買入價', '換匯成本', '台銀牌告', '匯率差異', '台幣換外幣'],
        articleBody: `中間價是買入與賣出的平均值，不等於銀行實際賣給你的價格。你拿台幣買外幣時，要看銀行賣出價；把外幣換回台幣時，要看買入價。${APP_INFO.shortName} 聚焦臺灣銀行牌告的賣出價，讓台灣用戶在換匯前就能估算更接近實際支付的台幣金額，避免因誤看中間價而低估換匯成本。`,
        speakableCssSelectors: ['h1', 'h3'],
      },
    ),
  ],
} as const satisfies AuthorityGuideContent;

export const CASH_VS_SPOT_RATE_PAGE = {
  title: `現金匯率 vs 即期匯率：什麼情境該看哪一種 | ${APP_INFO.shortName}`,
  description:
    '說明現金匯率與即期匯率差異，整理臨櫃換鈔、外幣帳戶、匯款與旅遊換匯情境，幫助你在不同交易方式下選對報價欄位，避免高估或低估實際成本，也避免把中間價誤當成交價與預算基準。',
  pathname: '/cash-vs-spot-rate/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '現金匯率與即期匯率差異', item: '/cash-vs-spot-rate/' },
  ],
  heading: '現金與即期不是同一種匯率',
  intro:
    '很多人以為銀行只會有一個外幣價格，但實際上臺灣銀行牌告通常至少分成現金匯率與即期匯率。前者對應現鈔交易，後者對應帳戶間轉換與匯款。選錯類型，就會高估或低估實際成本。',
  highlights: [
    '臨櫃換外幣現鈔時，通常看現金匯率。',
    '外幣帳戶轉換、網銀換匯或匯款時，通常看即期匯率。',
    '現金匯率常比即期匯率差，因為包含現鈔成本。',
  ],
  answerCapsule: [
    {
      question: '什麼情境該看現金匯率？',
      answer: '臨櫃換外幣現鈔時，通常看現金匯率，因為這反映了實體鈔券的保管與運送成本。',
    },
    {
      question: '什麼情境該看即期匯率？',
      answer:
        '外幣帳戶轉換、網銀換匯與匯款時，通常看即期匯率。這類交易不涉及現鈔，所以價格通常會比現金匯率更好。',
    },
  ],
  sections: [
    {
      title: '現金匯率反映的是實體鈔券成本',
      paragraphs: [
        '銀行持有外幣現鈔需要保管、運送、清點、保險與防偽流程，這些成本會反映在現金匯率的買賣差之中。',
        '因此，若你是出國前到分行換日圓、韓元或美元現鈔，應優先比較現金賣出，而不是即期賣出或中間價。',
      ],
    },
    {
      title: '即期匯率適用帳戶交易與匯款',
      paragraphs: [
        '即期匯率通常用於外幣帳戶之間的轉換、網銀換匯或電匯場景，因為交易不涉及實體鈔券，所以成本較低，價格通常較佳。',
        '如果你是先在線上買入外幣，再之後提領現鈔，就要另外注意提領手續費與銀行規則，不能直接把即期當作全部成本。',
      ],
    },
    {
      title: `${APP_INFO.shortName} 為什麼要同時顯示兩種匯率`,
      paragraphs: [
        `同一組幣別在不同換匯方式下，成本可能差很多。${APP_INFO.shortName} 把現金與即期匯率分開顯示，讓你在同一頁面內對照情境，而不是只給一個模糊的單一價格。`,
        '對旅遊用戶來說，這能避免出發前看錯欄位；對跨境付款或外幣帳戶使用者來說，也能更精準抓到匯款與換匯成本。',
      ],
    },
  ],
  faqContent: [
    {
      question: '臨櫃換外幣要看現金還是即期？',
      answer: '臨櫃換現鈔通常看現金賣出；若是把外幣現鈔換回台幣，則看現金買入。',
    },
    {
      question: '網銀外幣帳戶換匯看哪個價格？',
      answer: '通常看即期匯率。你拿台幣換外幣看即期賣出，把外幣換回台幣看即期買入。',
    },
    {
      question: '為什麼現金匯率常比即期差？',
      answer:
        '因為現鈔交易涉及保管、運送、保險與作業成本，銀行會把這些成本反映在現金匯率的價差裡。',
    },
  ],
  ctaTitle: '依情境切換正確匯率類型',
  ctaDescription: '回到首頁後可直接切換現金與即期匯率，比較同一筆金額在不同換匯方式下的成本差異。',
  relatedCurrencies: RELATED_CURRENCIES,
  jsonLd: [
    buildArticleJsonLd(
      '現金匯率 vs 即期匯率：什麼情境該看哪一種',
      `說明現金匯率與即期匯率差異，整理臨櫃換鈔、外幣帳戶、匯款與旅遊換匯情境，幫助你在 ${APP_INFO.shortName} 正確選擇報價類型。`,
      '/cash-vs-spot-rate/',
      GUIDE_PUBLISH_DATES.cashVsSpotRate,
      {
        articleSection: '匯率知識',
        keywords: [
          '現金匯率',
          '即期匯率',
          '現金賣出',
          '即期賣出',
          '換鈔',
          '外幣帳戶',
          '銀行手續費',
        ],
        articleBody: `現金匯率對應實體鈔券交易，適用臨櫃換鈔；即期匯率對應帳戶轉換與電匯，成本通常較低。兩者差異源自現鈔的保管、運送與防偽成本。${APP_INFO.shortName} 在首頁同時顯示現金與即期四種報價，讓用戶依換匯情境選擇正確類型，避免誤用即期價估算現鈔成本而低估實際支出。`,
        speakableCssSelectors: ['h1', 'h3'],
      },
    ),
  ],
} as const satisfies AuthorityGuideContent;

export const CARD_RATE_GUIDE_PAGE = {
  title: `刷卡匯率怎麼看？台銀牌告、卡組織匯率與 DCC 一次搞懂 | ${APP_INFO.shortName}`,
  description:
    '整理海外刷卡匯率的組成方式，說明 Visa、Mastercard 清算匯率、銀行海外手續費與 DCC 差異，幫助你分辨牌告換匯、海外刷卡與商家端台幣結帳三者的成本差別，避免把刷卡匯率和銀行牌告混為一談與誤估總成本。',
  pathname: '/card-rate-guide/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '刷卡匯率與 DCC 指南', item: '/card-rate-guide/' },
  ],
  heading: '刷卡匯率不是台銀牌告，但台銀賣出價仍很有參考價值',
  intro:
    '海外刷卡走的是卡組織清算匯率，再加上發卡銀行的海外手續費，與臺灣銀行牌告匯率不是同一套系統。不過，台銀賣出價仍可作為你估算海外消費成本與現金換匯成本的基準參考。',
  highlights: [
    '海外刷卡主要看卡組織清算匯率與銀行手續費。',
    'DCC 以台幣結帳通常較差，常比當地貨幣結帳貴。',
    `${APP_INFO.shortName} 適合估算台銀牌告情境，也能作為刷卡成本的基準比較。`,
  ],
  answerCapsule: [
    {
      question: '海外刷卡時應該選台幣還是當地貨幣？',
      answer:
        '多數情況下應選當地貨幣，避免 DCC 額外匯差。讓卡組織與發卡銀行清算，通常比商家端直接換成台幣更便宜。',
    },
    {
      question: `${APP_INFO.shortName} 在刷卡情境中的正確用途是什麼？`,
      answer: `${APP_INFO.shortName} 顯示的是臺灣銀行牌告匯率，不能直接等同最終刷卡扣款，但可作為估算海外消費成本與比較 DCC 是否偏貴的基準參考。`,
    },
  ],
  sections: [
    {
      title: '刷卡金額通常由三段成本構成',
      paragraphs: [
        '第一段是 Visa、Mastercard 等卡組織在清算日時套用的匯率；第二段是發卡銀行加收的海外交易手續費；第三段若選擇 DCC，還會多一層商家或收單機構的匯差。',
        '這也是為什麼同樣一筆海外消費，刷卡金額與銀行牌告現金賣出價不會完全一致，但兩者仍能形成很有用的比較基準。',
      ],
    },
    {
      title: '為什麼 DCC 常讓實際成本更高',
      paragraphs: [
        'DCC（Dynamic Currency Conversion）是在商家端直接把當地貨幣轉成台幣請你結帳。看似方便，但轉換匯率多半比卡組織的清算匯率差，等於先被商家端換一次匯。',
        '多數情況下，選擇當地貨幣結帳，再讓發卡銀行與卡組織完成清算，通常會比直接用台幣結帳更有利。',
      ],
    },
    {
      title: `${APP_INFO.shortName} 在刷卡情境中的正確用法`,
      paragraphs: [
        `${APP_INFO.shortName} 目前顯示的是臺灣銀行牌告匯率，因此更適合臨櫃換鈔、外幣帳戶換匯與匯款前估算。`,
        '若你要估刷卡成本，可把台銀賣出價當成保守基準，額外再加上發卡銀行海外手續費，並避免 DCC。這樣通常比只看中間價更接近真實支出。',
      ],
    },
  ],
  faqContent: [
    {
      question: '海外刷卡時應該選台幣還是當地貨幣？',
      answer:
        '多數情況下建議選當地貨幣，避免 DCC 額外匯差。讓卡組織與發卡銀行處理清算，通常會比商家直接換成台幣更有利。',
    },
    {
      question: `${APP_INFO.shortName} 可以直接算出刷卡最終扣款金額嗎？`,
      answer: `${APP_INFO.shortName} 目前提供的是臺灣銀行牌告匯率，無法直接反映各銀行卡片的清算日期與海外手續費，但可作為估算與比較基準。`,
    },
    {
      question: '為什麼刷卡匯率和銀行現金賣出價不一樣？',
      answer:
        '因為兩者是不同體系。刷卡走卡組織清算與銀行手續費，現金賣出價則是銀行對外販售現鈔的牌告價格。',
    },
  ],
  ctaTitle: '先用牌告賣出價估算，再留意刷卡費用',
  ctaDescription:
    '回到首頁輸入金額，可先用台銀牌告價格抓基準，再把發卡銀行海外手續費納入最終預算判斷。',
  relatedCurrencies: RELATED_CURRENCIES,
  jsonLd: [
    buildArticleJsonLd(
      '刷卡匯率怎麼看？台銀牌告、卡組織匯率與 DCC 一次搞懂',
      `整理海外刷卡匯率的組成方式，說明 Visa、Mastercard 清算匯率、銀行海外手續費與 DCC 差異，幫助你正確理解 ${APP_INFO.shortName} 與刷卡成本的關係。`,
      '/card-rate-guide/',
      GUIDE_PUBLISH_DATES.cardRateGuide,
      {
        articleSection: '匯率知識',
        keywords: [
          '刷卡匯率',
          'DCC',
          '動態貨幣轉換',
          'Visa',
          'Mastercard',
          '海外手續費',
          '卡組織匯率',
        ],
        articleBody: `海外刷卡費用由三段構成：卡組織清算匯率、發卡銀行海外手續費，以及選擇 DCC 時的額外匯差。DCC 讓商家直接換成台幣結帳，看似方便，但匯率通常較差。建議選擇當地貨幣結帳，讓卡組織與銀行清算，成本通常優於 DCC。${APP_INFO.shortName} 的台銀牌告賣出價可作為估算與比較刷卡成本的基準參考。`,
        speakableCssSelectors: ['h1', 'h3'],
      },
    ),
  ],
} as const satisfies AuthorityGuideContent;

export const PRIVACY_PAGE_SEO = {
  title: `隱私政策 - ${APP_INFO.shortName} 個人資料保護說明`,
  description: `${APP_INFO.shortName} 隱私政策說明：本服務不要求註冊，收藏、設定與歷史記錄保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量資料。`,
  pathname: '/privacy/',
  breadcrumb: [
    { name: `${APP_INFO.shortName} 首頁`, item: '/' },
    { name: '隱私政策', item: '/privacy/' },
  ],
  robots: 'noindex, follow',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'PrivacyPolicy',
      url: buildCanonicalUrl('/privacy/'),
      name: `隱私政策 - ${APP_INFO.shortName} 個人資料保護說明`,
      description: `${APP_INFO.shortName} 隱私政策說明：本服務不要求註冊，收藏、設定與歷史記錄保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量資料。`,
      publisher: {
        '@id': `${SITE_BASE_URL}#organization`,
        '@type': 'Organization',
        name: APP_INFO.author,
      },
      dateModified: BUILD_TIME,
      inLanguage: DEFAULT_LOCALE,
    },
  ],
} as const satisfies SEOPageMetadata;

export const APP_ONLY_PAGE_SEO = {
  multi: {
    title: `多幣別同時換算 - 一次比較 ${SUPPORTED_CURRENCY_COUNT} 種即時匯率`,
    description: `${APP_INFO.shortName} 多幣別同時換算功能，一次查看所有支援貨幣的即時匯率換算結果，適合旅遊換匯比價與跨境貿易報價。`,
    pathname: '/multi',
    robots: 'noindex, follow',
  },
  favorites: {
    title: '收藏貨幣與換算歷史記錄 - 快速存取常用匯率',
    description: `${APP_INFO.shortName} 收藏管理與換算歷史記錄頁面，支援快速回到主換算器並重新查看常用貨幣。`,
    pathname: '/favorites',
    robots: 'noindex, follow',
  },
  settings: {
    title: '應用程式設定 - 介面風格切換與語言偏好管理',
    description: `${APP_INFO.shortName} 設定頁面，提供介面風格、語言偏好與資料管理等應用程式個人化選項。`,
    pathname: '/settings',
    robots: 'noindex, follow',
  },
  seoTech: {
    title: `SEO 技術揭露 - ${APP_INFO.shortName} 搜尋引擎最佳化架構完整說明`,
    description: `完整揭露 ${APP_INFO.shortName} 所採用的 SEO 技術：${SEO_PATHS.length} 個索引路徑、8 種 JSON-LD Schema、${PRERENDER_PATHS.length} 頁 SSG 預渲染、自動化資料管線與 PWA 離線支援。`,
    pathname: '/seo-tech/',
    robots: 'index, follow',
    breadcrumb: [
      { name: `${APP_INFO.shortName} 首頁`, item: '/' },
      { name: 'SEO 技術揭露', item: '/seo-tech/' },
    ],
    keywords: [
      'SEO 技術',
      'JSON-LD Schema',
      'SSG 預渲染',
      '結構化資料',
      'PWA 離線支援',
      '搜尋引擎最佳化',
      '技術 SEO',
      '網站結構化標記',
      '搜尋可見性',
      `${APP_INFO.shortName} 技術架構`,
    ],
    jsonLd: buildArticleJsonLd(
      `SEO 技術揭露 - ${APP_INFO.shortName} 搜尋引擎最佳化架構完整說明`,
      `完整揭露 ${APP_INFO.shortName} 所採用的 SEO 技術：${SEO_PATHS.length} 個索引路徑、8 種 JSON-LD Schema、${PRERENDER_PATHS.length} 頁 SSG 預渲染、自動化資料管線與 PWA 離線支援。`,
      '/seo-tech/',
      GUIDE_PUBLISH_DATES.seoTech,
      {
        articleSection: 'SEO 技術',
        keywords: [
          'SEO 技術',
          'JSON-LD Schema',
          'SSG 預渲染',
          '結構化資料',
          'PWA 離線支援',
          '搜尋引擎最佳化',
          '技術 SEO',
          '網站結構化標記',
          '搜尋可見性',
          `${APP_INFO.shortName} 技術架構`,
        ],
        articleBody: `${APP_INFO.shortName} 採用現代化 SEO 最佳實踐，包括預先渲染靜態 HTML（SSG）以提升首頁效能與可爬性、完整的 JSON-LD Schema 標記（涵蓋 Article、Organization、BreadcrumbList、FAQPage、SoftwareApplication 等多種類型）以強化搜尋引擎與 AI 系統的內容理解、優化的網站結構（${SEO_PATHS.length} 個索引路徑與 ${PRERENDER_PATHS.length} 個預渲染頁面）、自動化資料管線（每 5 分鐘從台灣銀行同步即時匯率）、與 PWA 離線支援以確保使用者體驗。技術實現包括使用 Vite + React 進行高效打包、Tailwind CSS 的原子類樣式、Workbox 的靜態資源快取策略、Cloudflare Worker 的邊緣安全標頭注入，以及搜尋可見性的完整監測與驗證流程。`,
      },
    ),
  },
} as const satisfies Record<string, SEOPageMetadata>;

// ─────────────────────────────────────────────────────────────────────────────
// 相關連結 SSOT：幣別頁↔攻略頁雙向內部連結
// ─────────────────────────────────────────────────────────────────────────────

/** 外幣→台幣方向的相關攻略連結（旅客回國換匯場景）。 */
const RELATED_GUIDES_TO_TWD: RelatedGuideLink[] = [
  {
    href: '/sell-rate-vs-mid-rate/',
    label: '賣出價 vs 中間價',
    description: '了解為何 Google、XE 顯示的匯率與銀行臨櫃不同',
  },
  {
    href: '/cash-vs-spot-rate/',
    label: '現金 vs 即期匯率',
    description: '臨櫃換鈔與外幣帳戶該看哪種匯率',
  },
];

/** 台幣→外幣方向的相關攻略連結（出國換匯場景）。 */
const RELATED_GUIDES_TWD_TO_FOREIGN: RelatedGuideLink[] = [
  {
    href: '/sell-rate-vs-mid-rate/',
    label: '賣出價 vs 中間價',
    description: '了解為何 Google、XE 顯示的匯率與銀行臨櫃不同',
  },
  {
    href: '/cash-vs-spot-rate/',
    label: '現金 vs 即期匯率',
    description: '臨櫃換鈔與外幣帳戶該看哪種匯率',
  },
  {
    href: '/card-rate-guide/',
    label: '刷卡匯率指南',
    description: '海外刷卡匯率、DCC 與手續費完整解析',
  },
];

const CURRENCY_PAGE_OVERRIDES = {
  USD: {
    displayName: '美金',
    region: '美國旅遊與海外付款',
    question: '1 USD 等於多少台幣？',
    keyword: '美金換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '美國消費以刷卡為主，建議準備少量現金搭配信用卡。',
    searchQueries: ['100 美金等於多少台幣', '美金匯率', '美元換台幣'],
  },
  JPY: {
    displayName: '日圓',
    region: '日本旅遊換匯',
    question: '1000 JPY 等於多少台幣？',
    keyword: '日圓換台幣',
    popularAmounts: [1000, 3000, 5000, 10000, 30000, 50000, 100000],
    travelTip: '日本許多餐廳與商店仍以現金為主，建議準備充足日圓現鈔。',
    searchQueries: ['1000 日幣等於多少台幣', '日圓匯率', '日幣換台幣'],
  },
  EUR: {
    displayName: '歐元',
    region: '歐洲旅遊與跨境付款',
    question: '1 EUR 等於多少台幣？',
    keyword: '歐元換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '歐洲多數國家接受刷卡，建議備少量歐元現金用於小型商店與市集。',
    searchQueries: ['100 歐元等於多少台幣', '歐元匯率', '歐元換台幣'],
  },
  GBP: {
    displayName: '英鎊',
    region: '英國旅遊換匯',
    question: '1 GBP 等於多少台幣？',
    keyword: '英鎊換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '英國刷卡普及度高，感應支付廣泛。',
    searchQueries: ['100 英鎊等於多少台幣', '英鎊匯率', '英鎊換台幣'],
  },
  CNY: {
    displayName: '人民幣',
    region: '人民幣付款與報價',
    question: '1 CNY 等於多少台幣？',
    keyword: '人民幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '中國大陸以行動支付為主，建議準備小額現金備用。',
    searchQueries: ['100 人民幣等於多少台幣', '人民幣匯率', '人民幣換台幣'],
  },
  KRW: {
    displayName: '韓元',
    region: '韓國旅遊換匯',
    question: '1000 KRW 等於多少台幣？',
    keyword: '韓元換台幣',
    popularAmounts: [1000, 5000, 10000, 50000, 100000, 300000, 500000],
    travelTip: '韓國多數店家接受刷卡，但夜市與小吃攤建議準備現金。',
    searchQueries: ['50000 韓元多少台幣', '一萬韓元多少台幣', '韓幣換台幣'],
  },
  HKD: {
    displayName: '港幣',
    region: '香港旅遊換匯',
    question: '1 HKD 等於多少台幣？',
    keyword: '港幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '香港八達通卡適用於交通與便利商店，其餘可刷卡或付現。',
    searchQueries: ['100 港幣等於多少台幣', '港幣匯率', '港幣換台幣'],
  },
  AUD: {
    displayName: '澳幣',
    region: '澳洲旅遊與留學換匯',
    question: '1 AUD 等於多少台幣？',
    keyword: '澳幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '澳洲刷卡非常普遍，感應支付接受度高。',
    searchQueries: ['100 澳幣等於多少台幣', '澳幣匯率', '澳幣換台幣'],
  },
  CAD: {
    displayName: '加幣',
    region: '加拿大旅遊與留學換匯',
    question: '1 CAD 等於多少台幣？',
    keyword: '加幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '加拿大刷卡普及，建議準備少量現金用於小費。',
    searchQueries: ['100 加幣等於多少台幣', '加幣匯率', '加幣換台幣'],
  },
  SGD: {
    displayName: '新加坡幣',
    region: '新加坡旅遊與商務換匯',
    question: '1 SGD 等於多少台幣？',
    keyword: '新加坡幣換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '新加坡刷卡與行動支付普及，熟食中心建議準備現金。',
    searchQueries: ['100 新加坡幣等於多少台幣', '新幣匯率', '新加坡幣換台幣'],
  },
  THB: {
    displayName: '泰銖',
    region: '泰國旅遊換匯',
    question: '100 THB 等於多少台幣？',
    keyword: '泰銖換台幣',
    popularAmounts: [100, 500, 1000, 3000, 5000, 10000],
    travelTip: '泰國路邊攤、計程車與夜市以現金為主，建議準備充足泰銖。',
    searchQueries: ['1000 泰銖等於多少台幣', '泰銖匯率', '泰銖換台幣'],
  },
  NZD: {
    displayName: '紐元',
    region: '紐西蘭旅遊與留學換匯',
    question: '1 NZD 等於多少台幣？',
    keyword: '紐元換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '紐西蘭刷卡普及，但部分戶外活動可能需要現金。',
    searchQueries: ['100 紐元等於多少台幣', '紐元匯率', '紐元換台幣'],
  },
  CHF: {
    displayName: '瑞士法郎',
    region: '瑞士旅遊與跨境付款',
    question: '1 CHF 等於多少台幣？',
    keyword: '瑞士法郎換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '瑞士消費水準高，刷卡普遍，建議備少量法郎現金。',
    searchQueries: ['100 瑞士法郎等於多少台幣', '瑞郎匯率', '瑞士法郎換台幣'],
  },
  VND: {
    displayName: '越南盾',
    region: '越南旅遊換匯',
    question: '100000 VND 等於多少台幣？',
    keyword: '越南盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip:
      '越南以現金為主，建議準備充足越南盾。信用卡在大城市飯店與餐廳可用，但市集與路邊攤需現金。',
    searchQueries: ['100000 越南盾多少台幣', '越南盾匯率', '越南幣換台幣'],
  },
  PHP: {
    displayName: '菲律賓披索',
    region: '菲律賓旅遊換匯',
    question: '1000 PHP 等於多少台幣？',
    keyword: '菲律賓披索換台幣',
    popularAmounts: [100, 500, 1000, 5000, 10000, 50000],
    travelTip: '菲律賓刷卡接受度視地區而異，宿霧與長灘島觀光區較普及，偏遠地區建議準備現金。',
    searchQueries: ['1000 菲律賓披索等於多少台幣', '菲律賓披索匯率', '披索換台幣'],
  },
  IDR: {
    displayName: '印尼盾',
    region: '印尼旅遊換匯',
    question: '100000 IDR 等於多少台幣？',
    keyword: '印尼盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip: '印尼（峇里島）以現金為主，建議在機場或市區換匯所兌換。注意面額較大的紙鈔較受歡迎。',
    searchQueries: ['100000 印尼盾多少台幣', '印尼盾匯率', '印尼盾換台幣'],
  },
  MYR: {
    displayName: '馬來幣',
    region: '馬來西亞旅遊換匯',
    question: '100 MYR 等於多少台幣？',
    keyword: '馬來幣換台幣',
    popularAmounts: [10, 50, 100, 500, 1000, 5000],
    travelTip: '馬來西亞刷卡普及度中等，吉隆坡市區可刷卡，但夜市、熟食中心與小鎮建議準備現金。',
    searchQueries: ['100 馬來幣等於多少台幣', '馬來幣匯率', '馬來西亞幣換台幣'],
  },
} as const;

/**
 * 幣別特化 FAQ：基於權威金融網站資訊，為每個幣別提供獨特的換匯知識。
 * 資料來源：台灣銀行、兆豐銀行、Money101、Trip.com、各國旅遊換匯攻略（2026 年）。
 * 每個幣別至少 2-3 則特化 FAQ，避免模板重複，提升 SEO 獨特性。
 */
const CURRENCY_SPECIFIC_FAQ: Record<string, FAQEntry[]> = {
  USD: [
    {
      question: '在台灣換美金，哪種方式最划算？',
      answer:
        '線上換匯（網銀 App）通常匯率最優，採用即期匯率且常有減分優惠；臨櫃換匯使用現金匯率，成本較高但可取得小面額鈔票；外幣 ATM 24 小時服務但僅提供大面額。大額換匯（超過 1 萬美元）時，匯差可達 30-50 美元（約 900-1,500 台幣），應優先比較匯率而非手續費。',
    },
    {
      question: '美金換匯有什麼省錢技巧？',
      answer:
        '善用銀行線上匯率優惠（如減 3.5 分）、分批買入分散風險、比較各銀行牌告匯率。台銀、兆豐等主要銀行匯率存在差異，換匯前應多方比較。線上結匯可提前鎖定匯率，到機場或分行領取。',
    },
    {
      question: '去美國旅遊需要換多少美金現金？',
      answer:
        '美國消費以刷卡為主，建議準備 200-500 美元現金用於小費、停車費、小型商家等場合。多數餐廳、商店、加油站皆接受信用卡，選擇海外回饋 ≥1.5% 的信用卡可抵消手續費。',
    },
  ],
  JPY: [
    {
      question: '去日本旅遊，該換現金還是刷卡？',
      answer:
        '建議採用「高回饋信用卡為主 + 日圓現鈔備用」的組合。信用卡海外手續費約 1.5%，選擇回饋率 ≥3% 的卡片（如國泰 CUBE 卡日本 3.3%、台新 Richart 卡 3.3%）可抵消手續費並額外獲利。日本許多餐廳、便利商店與小店仍以現金為主，建議準備 3-5 萬日圓現鈔。',
    },
    {
      question: '日圓雙幣卡值得辦嗎？',
      answer:
        '雙幣卡（如玉山熊本熊卡）可在匯率低點先換日圓存入外幣帳戶，未來刷卡直接扣日圓帳戶，避免匯率波動風險。若日圓匯率已夠甜、且有明確赴日計畫，雙幣卡是分散風險的好選擇。',
    },
    {
      question: '在日本可以用台灣的電子支付嗎？',
      answer:
        '全支付、街口支付、玉山 Wallet 等台灣電子支付已串接日本 PayPay，免收 1.5% 海外交易手續費，適合小額消費（便利商店、藥妝店）。但多有回饋上限，大額消費仍建議用高回饋信用卡。',
    },
  ],
  KRW: [
    {
      question: '去韓國換韓元，在台灣換還是到當地換？',
      answer:
        '強烈建議到韓國當地換。以 10,000 台幣為例，台灣銀行約換 419,639 韓元，明洞換錢所約換 452,000 韓元，相差約 32,361 韓元（約台幣 770 元）。帶台幣千元鈔到明洞 Money Plant、大使館、一品香等換錢所換最划算。',
    },
    {
      question: '首爾明洞哪家換錢所匯率最好？',
      answer:
        'Money Plant（明洞 5 號出口）、大使館、一品香、SKY 匯率基本一致，差異僅 0.0X，不需執著比較。Money Box 提供台灣旅客專屬優惠（匯率 +0.1）。營業時間約 09:00-21:00，建議白天前往。',
    },
    {
      question: '韓國旅遊信用卡回饋 ≥3.5% 是否比換現金划算？',
      answer:
        '是的。若信用卡海外回饋 ≥3.5%，刷卡比在明洞換現金更划算。韓國多數店家接受刷卡，但夜市、路邊攤、傳統市場仍需現金。建議現金 40%、刷卡 60% 的配置。',
    },
  ],
  EUR: [
    {
      question: '去歐洲旅遊，現金和刷卡怎麼搭配？',
      answer:
        '歐洲大城市刷卡普及，建議以信用卡為主、現金為輔。出發前在台灣換 200-300 歐元小額鈔票（50 歐元以下），用於小餐廳、傳統市集、公共廁所等現金場合。避免在機場換錢，匯率最差。',
    },
    {
      question: '在歐洲刷卡要注意什麼？',
      answer:
        '刷卡時務必選擇「歐元」或「當地貨幣」結算，拒絕「台幣」結算（DCC 動態貨幣轉換），否則會被收取 3-18% 額外匯差。部分無人機台需輸入 PIN 碼，建議出發前向銀行申請。',
    },
    {
      question: '歐洲退稅怎麼操作？',
      answer:
        '歐洲各國退稅比率 19-25% 不等，門檻約 40-300 歐元。購物時向店家索取退稅單，離境前在機場海關蓋章，可選擇現金或信用卡退稅。建議選信用卡退稅，金額較完整但需等 1-2 個月入帳。',
    },
  ],
  HKD: [
    {
      question: '港幣匯率為什麼很穩定？',
      answer:
        '港幣採聯繫匯率制度，與美元維持在 7.75-7.85 的固定區間。因此港幣對台幣的匯率主要隨美元走勢波動，相對其他貨幣更穩定可預測。',
    },
    {
      question: '去香港需要換多少港幣？',
      answer:
        '香港八達通卡適用於交通、便利商店、部分餐廳，建議儲值 300-500 港幣。其餘消費可刷卡或付現，一般 3-5 天行程準備 2,000-3,000 港幣現金即可。',
    },
  ],
  CNY: [
    {
      question: '台灣人攜帶人民幣出入境有限額嗎？',
      answer:
        '有。根據台灣法規，民眾攜帶人民幣進出境的限額為人民幣 2 萬元。超過需向海關申報，經許可的金融機構不受此限。',
    },
    {
      question: '去中國大陸需要換多少人民幣現金？',
      answer:
        '中國大陸以微信支付、支付寶等行動支付為主，外國旅客可綁定國際信用卡使用。建議準備 500-1,000 人民幣小額現金備用，用於不支援行動支付的場合。',
    },
    {
      question: '在台灣換人民幣有什麼注意事項？',
      answer:
        '等值新台幣 50 萬元以上的外幣兌換需事先預約，並可能需填寫申報書。線上結匯（如台銀 Easy 購）匯率最優惠、24 小時可下單，可選擇機場或分行領取。',
    },
  ],
  THB: [
    {
      question: '去泰國換泰銖，在台灣換還是到當地換？',
      answer:
        '強烈建議到泰國當地換。台灣銀行匯率約 1 TWD = 0.89-1.07 THB，曼谷 Super Rich 約 1 TWD = 1.115-1.135 THB，價差超過 10%。帶台幣到曼谷 Super Rich（綠標或橘標）換最划算。',
    },
    {
      question: '曼谷機場可以換泰銖嗎？',
      answer:
        '可以，但要選對地點。素萬那普機場地下室（B1 捷運站旁）有 Super Rich，匯率優良；行李轉盤區的換匯所匯率差 20% 以上，千萬不要在那裡換。廊曼機場無 Super Rich，建議到市區再換。',
    },
    {
      question: '泰國旅遊現金和刷卡怎麼配置？',
      answer:
        '建議現金 40%、刷卡 60%。泰國數位支付漸普及，但嘟嘟車、路邊攤、夜市、小費仍需現金。準備新台幣現鈔時注意鈔票狀態，有皺摺、破洞、記號的舊鈔可能被拒收或匯率打折。',
    },
  ],
  VND: [
    {
      question: '去越南換越南盾，在台灣換還是到當地換？',
      answer:
        '建議到越南當地換。台灣銀行匯率約 1:752 越南盾，越南當地銀樓約 1:854，每 1 萬台幣相差超過 100 萬越盾。在台灣先換 1,000-2,000 台幣的越南盾作為應急金，大筆金額到當地再換。',
    },
    {
      question: '在越南可以用台幣直接換越南盾嗎？',
      answer:
        '可以。越南當地銀樓可直接用台幣換越南盾，不需先換美金。匯率參考：10,000 台幣 ≈ 750-830 萬越南盾。可查詢 CHỢ GIÁ（chogia.vn）網站了解當日匯率。',
    },
    {
      question: '越南換匯有什麼注意事項？',
      answer:
        '2026 年越南實施外匯管理新制，政府對非法換匯查緝趨嚴格，建議選擇合法且有營業執照的銀樓或銀行兌換。越南以現金為主，信用卡僅在大城市飯店與餐廳可用。',
    },
  ],
  SGD: [
    {
      question: '新加坡幣匯率大約多少？',
      answer:
        '1 新加坡幣約等於 24-25 台幣（2026 年）。新加坡幣相對穩定，與美元連動性高。各銀行匯率略有差異，星展銀行通常提供較優惠的新幣匯率。',
    },
    {
      question: '去新加坡需要換多少新幣現金？',
      answer:
        '新加坡刷卡與行動支付非常普及，但熟食中心（Hawker Centre）多以現金為主。建議準備 200-300 新幣現金用於熟食中心、小販與交通，其餘可刷卡。',
    },
  ],
  AUD: [
    {
      question: '澳幣匯率大約多少？',
      answer:
        '1 澳幣約等於 22-23 台幣（2026 年）。澳幣屬於商品貨幣，匯率受原物料價格影響較大。換澳幣最便宜的銀行為高雄銀行，換回台幣最划算的是台新銀行。',
    },
    {
      question: '去澳洲需要換多少澳幣現金？',
      answer:
        '澳洲刷卡非常普遍，感應支付（tap-and-go）接受度極高，許多店家甚至不收現金。建議準備 100-200 澳幣現金備用即可，主要用於小費或緊急情況。',
    },
  ],
  GBP: [
    {
      question: '英鎊匯率大約多少？',
      answer:
        '1 英鎊約等於 41-43 台幣（2026 年）。英鎊是主要貨幣中單位價值較高的，換匯時注意金額。玉山銀行通常提供較優惠的英鎊匯率。',
    },
    {
      question: '去英國需要換多少英鎊現金？',
      answer:
        '英國感應支付極為普及，幾乎所有商家都接受 contactless payment。建議準備 50-100 英鎊現金備用，主要用於小費、市集或緊急情況。',
    },
  ],
  CAD: [
    {
      question: '加幣匯率大約多少？',
      answer:
        '1 加幣約等於 23 台幣（2026 年）。加幣屬於商品貨幣，與油價有一定連動性。現金匯率通常比即期匯率差 0.2-0.5 元。',
    },
    {
      question: '去加拿大需要換多少加幣現金？',
      answer:
        '加拿大刷卡普及，但小費文化盛行（餐廳 15-20%、計程車 10-15%）。建議準備 100-200 加幣現金用於小費，其餘可刷卡。',
    },
  ],
  CHF: [
    {
      question: '瑞士法郎為什麼被稱為避險貨幣？',
      answer:
        '瑞士政治中立、經濟穩定、銀行體系健全，瑞士法郎在國際市場動盪時常被視為資金避風港，匯率易走強。這也使得瑞郎長期維持較高幣值。',
    },
    {
      question: '去瑞士需要換多少瑞郎現金？',
      answer:
        '瑞士消費水準全球最高，但刷卡普遍。建議準備 100-200 瑞郎現金備用，主要用於小費或小型商家。瑞郎在台灣大型銀行可換，非主要幣別建議提前預約。',
    },
  ],
  NZD: [
    {
      question: '紐元匯率大約多少？',
      answer:
        '1 紐元約等於 18-19 台幣（2026 年）。紐元與澳幣走勢相近，同屬商品貨幣。新光銀行通常提供較優惠的紐元即期匯率。',
    },
    {
      question: '去紐西蘭需要換多少紐元現金？',
      answer:
        '紐西蘭刷卡普及，但部分戶外活動（如極限運動、農場體驗）可能需要現金。建議準備 100-200 紐元現金，其餘可刷卡。',
    },
  ],
  PHP: [
    {
      question: '去菲律賓換披索，帶台幣還是美金？',
      answer:
        '建議在台灣先換美金，到菲律賓當地再換披索，比直接換披索更划算。要求銀行準備新版、大面額（100 元與 50 元）美金，舊版美金在菲律賓可能被拒收。',
    },
    {
      question: '菲律賓刷信用卡方便嗎？哪些地方需要現金？',
      answer:
        '菲律賓現金仍是多數場合的主力支付。馬尼拉、宿霧、長灘島（Boracay）的國際飯店、Ayala Mall 等大型商場、連鎖餐廳可刷 Visa/Mastercard；但三輪車（tricycle）、路邊攤、傳統市場、偏遠島嶼（科隆、薩馬島）幾乎只收現金。ATM 每次提款固定手續費約 ₱250，建議單次提足。刷卡時選 PHP 結算，拒絕 DCC 台幣選項，以免多付 2-5% 匯差。',
    },
  ],
  IDR: [
    {
      question: '印尼盾面額很大，怎麼換算？',
      answer:
        '印尼盾面額大，1 台幣約等於 500-540 印尼盾。簡易換算：印尼盾去掉 3 個零再除以 2，約等於台幣金額。例如 100,000 印尼盾 ≈ 100 ÷ 2 = 50 台幣。',
    },
    {
      question: '去峇里島刷信用卡還是換現金？QRIS 可以用嗎？',
      answer:
        '峇里島現金與信用卡並行。Seminyak、Canggu、Uluwatu 的中高級餐廳與精品店可刷 Visa/Mastercard；便利商店（Indomaret、Alfamart）也可刷卡。但市集攤販、偏遠地區仍以現金為主。建議帶 USD 100 面額鈔票到認明「PVA Berizin」綠牌的合法換匯所（如 Central Kuta）兌換，匯率比台灣換台幣好 10-15%。QRIS 統一 QR 碼已在峇里島廣泛使用，可下載 GoPay 並綁定 Visa/Mastercard 使用。刷卡選 IDR 結算，避免 DCC 多付 5-7%。',
    },
  ],
  MYR: [
    {
      question: '馬來幣匯率大約多少？',
      answer:
        '1 馬來幣約等於 7-8.5 台幣（2026 年），各銀行匯率差異較大。台灣銀行現金賣出約 8.52，兆豐銀行約 8.60，建議多方比較。',
    },
    {
      question: "去馬來西亞刷信用卡方便嗎？需要辦 Touch 'n Go 嗎？",
      answer:
        "馬來西亞是東南亞刷卡環境最完善的國家之一，吉隆坡、檳城的商場、餐廳、飯店全面支援 Visa/Mastercard 感應支付（contactless）。搭地鐵（LRT/MRT/KTM）、公車、高速公路 ETC 建議購買實體 Touch 'n Go 卡（類悠遊卡，KLIA 機場可買）；夜市（亞羅街）、熟食中心（hawker）以現金為主，建議備 300-500 馬來幣。選擇海外回饋 ≥1.5% 的信用卡（如台新 Richart 3.3%）刷卡，避免 DCC 台幣結算。",
    },
  ],
};

/**
 * 反向頁（TWD→外幣）特化 FAQ：強調出國前換匯場景的獨特知識。
 * 與正向頁 FAQ 互補，避免重複內容。
 */
const REVERSE_CURRENCY_SPECIFIC_FAQ: Record<string, FAQEntry[]> = {
  USD: [
    {
      question: '出國前換美金，線上換還是臨櫃換？',
      answer:
        '線上換匯（網銀 App）使用即期匯率，通常比臨櫃現金匯率優惠 0.5-1%。但線上換匯需轉入外幣帳戶，若要提領現鈔需另外預約。若急需現鈔，臨櫃換匯較方便但匯率稍差。',
    },
    {
      question: '換美金要選哪家銀行？',
      answer:
        '台銀、兆豐、彰銀等大型銀行匯率差異不大，但部分銀行提供線上減分優惠（如減 3.5 分）。大額換匯（超過 1 萬美元）時，0.1% 的匯差就是 300-500 台幣，值得多方比較。',
    },
  ],
  JPY: [
    {
      question: '什麼時候換日圓最划算？',
      answer: `日圓匯率受日本央行政策影響大，難以預測最低點。建議出發前 1-2 週開始觀察趨勢，分 2-3 次換匯分散風險。${APP_INFO.shortName} 提供 7-30 天趨勢圖，可觀察近期高低區間。`,
    },
    {
      question: '日圓現鈔要換多少面額？',
      answer:
        '日本自動販賣機、小店常不收萬元大鈔，建議換匯時要求部分千元鈔（1,000 日圓）。台銀臨櫃可指定面額，線上結匯則依銀行庫存配置。',
    },
  ],
  KRW: [
    {
      question: '台幣換韓元，在台灣換還是到首爾換？',
      answer:
        '到首爾明洞換匯所換最划算，匯率比台灣銀行好 7-10%。但若不想帶大量台幣現鈔出國，可在台灣先換少量韓元（約 5 萬韓元）用於機場交通，抵達後再到明洞換足額。',
    },
    {
      question: '去韓國要帶台幣還是美金去換？',
      answer:
        '帶台幣直接換最方便，明洞換錢所接受台幣千元鈔。帶美金換匯率有時略優，但需先在台灣換美金，兩次換匯較麻煩。除非已有美金現鈔，否則建議直接帶台幣。',
    },
  ],
  EUR: [
    {
      question: '去歐洲要換多少歐元現金？',
      answer:
        '歐洲刷卡普及，建議準備 200-300 歐元現金即可，用於小餐廳、市集、公共廁所等現金場合。盡量換 50 歐元以下小額鈔票，部分商家不收 100、200 歐元大鈔。',
    },
    {
      question: '歐元在台灣哪裡換最划算？',
      answer:
        '台銀、兆豐等大型銀行皆可換歐元，匯率差異不大。線上結匯通常比臨櫃優惠，可提前鎖定匯率，到機場或分行領取。建議提早 2-3 個工作天預約，確保有足夠庫存。',
    },
  ],
  HKD: [
    {
      question: '港幣匯率很穩定，什麼時候換都一樣嗎？',
      answer:
        '港幣採聯繫匯率制度，與美元維持固定區間，因此匯率波動較小。但仍會隨美元對台幣走勢變動，若美元走弱時換港幣會稍划算。短期旅遊不需太在意時機，隨時換即可。',
    },
  ],
  CNY: [
    {
      question: '去中國大陸要換多少人民幣？',
      answer:
        '中國大陸行動支付極為普及，外國旅客可用國際信用卡綁定微信支付或支付寶。建議準備 500-1,000 人民幣現金備用，用於不支援行動支付的小攤或緊急情況。',
    },
    {
      question: '人民幣攜帶出境有限額嗎？',
      answer:
        '有。台灣法規規定攜帶人民幣進出境限額為 2 萬元人民幣。超過需向海關申報。建議大額資金透過外幣帳戶匯款，避免攜帶大量現金。',
    },
  ],
  THB: [
    {
      question: '去泰國要在台灣先換泰銖嗎？',
      answer:
        '不建議在台灣換大量泰銖，台灣銀行匯率比曼谷 Super Rich 差 10% 以上。建議只在台灣換少量（約 1,000-2,000 泰銖）用於機場交通，抵達曼谷後再到 Super Rich 換足額。',
    },
    {
      question: '帶台幣去泰國換泰銖要注意什麼？',
      answer:
        '準備新鈔、無摺痕的台幣千元鈔票。有皺摺、破損、塗鴉的舊鈔可能被拒收或匯率打折。換匯時需攜帶護照，每人每次換匯無上限，但建議依行程需求分批換。',
    },
  ],
  VND: [
    {
      question: '台幣換越南盾，在台灣換還是到當地換？',
      answer:
        '強烈建議到越南當地換。台灣銀行匯率約 1:752，越南銀樓約 1:854，每 1 萬台幣相差超過 100 萬越盾。在台灣只需換少量（約 50-100 萬越盾）應急金即可。',
    },
  ],
  SGD: [
    {
      question: '新加坡幣在台灣好換嗎？',
      answer:
        '新加坡幣是主要貨幣，台灣大型銀行皆有提供。星展銀行（新加坡銀行）通常提供較優惠的新幣匯率，可優先比較。',
    },
  ],
  AUD: [
    {
      question: '去澳洲需要換多少澳幣現金？',
      answer:
        '澳洲刷卡極為普及，許多店家甚至不收現金（cash-free）。建議只準備 100-200 澳幣現金備用，主要用於小費或緊急情況，其餘全程刷卡即可。',
    },
  ],
  GBP: [
    {
      question: '英鎊在台灣好換嗎？',
      answer:
        '英鎊是主要貨幣，台灣大型銀行皆可換。玉山銀行通常提供較優惠的英鎊匯率。建議提前 1-2 天預約，確保有足夠庫存。',
    },
  ],
  CAD: [
    {
      question: '去加拿大要準備多少加幣現金？',
      answer:
        '加拿大刷卡普及，但小費文化盛行（餐廳 15-20%）。建議準備 100-200 加幣現金用於小費，其餘可刷卡。部分餐廳會在帳單上直接加小費選項，可選擇刷卡支付。',
    },
  ],
  CHF: [
    {
      question: '瑞士法郎在台灣好換嗎？',
      answer:
        '瑞士法郎非主要幣別，部分銀行可能庫存有限。建議提前 2-3 天向銀行預約，或選擇台銀、兆豐等大型銀行換匯。',
    },
  ],
  NZD: [
    {
      question: '紐元在台灣好換嗎？',
      answer:
        '紐元是次要貨幣，部分銀行可能庫存有限。新光銀行通常提供較優惠的紐元匯率。建議提前預約，或選擇大型銀行換匯。',
    },
  ],
  PHP: [
    {
      question: '去菲律賓要帶台幣還是美金？',
      answer:
        '建議帶美金到菲律賓換披索，匯率比直接換披索更好。在台灣先換新版、大面額美金（100 元與 50 元），舊版美金在菲律賓可能被拒收。',
    },
  ],
  IDR: [
    {
      question: '去峇里島要在台灣先換印尼盾嗎？',
      answer:
        '不建議在台灣換大量印尼盾。台灣銀行匯率較差，且印尼盾面額大、張數多不便攜帶。建議只換少量應急金，抵達峇里島後在市區換匯所（如 Sanur、Ubud）換足額。',
    },
  ],
  MYR: [
    {
      question: '馬來幣在台灣好換嗎？',
      answer:
        '馬來幣是次要貨幣，部分銀行可能庫存有限。台灣銀行、兆豐銀行通常有提供，建議提前預約。或抵達吉隆坡後在市區換匯所換，匯率可能更優。',
    },
  ],
};

export type CurrencyLandingCode = keyof typeof CURRENCY_PAGE_OVERRIDES;

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-TW');
}

export const DEFAULT_EXAMPLE_AMOUNTS = {
  USD: 1000,
  JPY: 100000,
  EUR: 1000,
  KRW: 100000,
  HKD: 10000,
  THB: 10000,
  VND: 1000000,
} as const;

export function getDefaultExampleAmount(currencyCode: string): number {
  return Object.prototype.hasOwnProperty.call(DEFAULT_EXAMPLE_AMOUNTS, currencyCode)
    ? DEFAULT_EXAMPLE_AMOUNTS[currencyCode as keyof typeof DEFAULT_EXAMPLE_AMOUNTS]
    : 1000;
}

export interface RateDifferenceSentenceInput {
  currencyCode: string;
  currencyName: string;
  direction: 'to-twd' | 'twd-to-foreign';
  exampleAmount?: number;
  bankMid?: number | null;
  cashSell?: number | null;
}

export function buildRateDifferenceSentence(input: RateDifferenceSentenceInput): string {
  const { currencyCode, currencyName, direction, exampleAmount, bankMid, cashSell } = input;
  const amount = exampleAmount && exampleAmount > 0 ? exampleAmount : 1000;

  if (bankMid == null || cashSell == null) {
    return '中間價只適合觀察市場方向，實際換匯仍應以銀行牌告買入價或賣出價為準。換匯金額越大，買賣價差的影響越明顯。';
  }

  if (direction === 'twd-to-foreign') {
    const foreignAtMid = amount / bankMid;
    const foreignAtSell = amount / cashSell;
    const diffForeign = Math.abs(foreignAtMid - foreignAtSell);
    return `差距有多大？以 ${formatAmount(amount)} 台幣估算 TWD→${currencyCode}，若用中間價推算約可換得 ${formatAmount(
      foreignAtMid,
    )} ${currencyCode}，實際台銀賣出價約可換得 ${formatAmount(
      foreignAtSell,
    )} ${currencyCode}，少換約 ${formatAmount(diffForeign)} ${currencyCode}。換匯金額越大，差距越明顯。`;
  }

  const midCost = amount * bankMid;
  const sellCost = amount * cashSell;
  const diff = Math.abs(sellCost - midCost);

  return `差距有多大？以 ${formatAmount(amount)} ${currencyName} 換台幣估算，中間價與台銀實際賣出價約相差 ${Math.round(
    diff,
  ).toLocaleString('zh-TW')} 元台幣；金額越大，差距越明顯。`;
}

export interface PairAmountSeoCopy {
  title: string;
  description: string;
}

export function buildPairAmountSeo(
  amount: number,
  currencyCode: string,
  currencyName: string,
  direction: 'to-twd' | 'twd-to-foreign' = 'to-twd',
): PairAmountSeoCopy {
  const formatted = formatAmount(amount);

  if (direction === 'twd-to-foreign') {
    return {
      title: `台幣換 ${formatted} ${currencyName}（TWD/${currencyCode}）— 台銀實際賣出價 | ${APP_INFO.shortName}`,
      description: `${formatted} 台幣今日可換多少${currencyName}？${APP_INFO.shortName} 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算可兌換的外幣金額，避免被中間價誤導。`,
    };
  }

  return {
    title: `${formatted} ${currencyName}換新台幣（${currencyCode}/TWD）— 台銀實際賣出價 | ${APP_INFO.shortName}`,
    description: `${formatted} ${currencyName}今日換新台幣要多少？${APP_INFO.shortName} 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算所需台幣金額，避免被中間價誤導。`,
  };
}

/**
 * 根據每日更新的匯差數據，產生具體落差敘述句。
 * 同時顯示外幣數量（實際 vs 中間價預期）與台幣差距，提升 LLM 引用精確度。
 */
function buildRateExampleSentence(code: string, displayName: string): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '換匯金額越大、落差越明顯。';
  // 整萬數格式：30000 → "3 萬"，以符合中文閱讀習慣。
  const twdLabel =
    ex.exampleTWD % 10000 === 0 ? `${ex.exampleTWD / 10000} 萬` : formatAmount(ex.exampleTWD);
  const fCash = formatAmount(ex.foreignAtCash);
  const fMid = formatAmount(ex.foreignAtMarketMid);
  const fDiff = formatAmount(ex.diffForeign);
  return `以換 ${twdLabel}元新台幣的${displayName}為例：台灣銀行臨櫃現金實際只能換到 ${fCash} ${code}，而 Google（資料來源：Morningstar）、XE、Wise、Apple 計算機（資料來源：Yahoo Finance）等工具顯示的市場中間價換算結果約為 ${fMid} ${code}——兩者相差約 ${fDiff} ${code}（差距 ${ex.diffPct}%）。若先用中間價估算再去台銀換匯，實際會比預期少換 ${fDiff} ${code}，等於多花了 ${ex.diffTWD} 元新台幣的匯差。（匯差數據每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）`;
}

/**
 * 在 FAQ 答案中嵌入靜態匯率數字，讓 Googlebot 原始 HTML 層次即可讀到匯率。
 * 數據來自 SEO_RATE_EXAMPLES（每日 GitHub Actions 自動更新）。
 */
function buildCashSellRateSentence(code: string, baseAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(baseAmount * ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(baseAmount)} ${code} ≈ ${formatAmount(result)} 元台幣（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/** 反向頁（TWD→外幣）FAQ：嵌入台幣換外幣的靜態換算結果。 */
function buildTwdToForeignRateSentence(code: string, twdAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(twdAmount / ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(twdAmount)} 台幣 ≈ ${formatAmount(result)} ${code}（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/**
 * 幣對頁 Answer Capsule：40-60 字直接答案段落，供 AI 引擎直接引用。
 * P1-1 任務：在所有 34 幣對頁頂部加入 Answer Capsule，提升 AI 引用率 +40%。
 */
function buildCurrencyAnswerCapsule(
  code: string,
  displayName: string,
  direction: 'to-twd' | 'twd-to-foreign',
): FAQEntry[] {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return [];

  if (direction === 'to-twd') {
    return [
      {
        question: `${displayName}換台幣今日匯率是多少？`,
        answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${APP_INFO.shortName} 直接顯示臺灣銀行牌告的實際賣出價，非中間價，換匯前可精準估算所需台幣。`,
      },
      {
        question: `為什麼 ${APP_INFO.shortName} 顯示的${displayName}匯率和 Google 不一樣？`,
        answer: `Google 顯示的是市場中間價（批發參考價），一般人換不到。${APP_INFO.shortName} 顯示的是台銀牌告的現金賣出價，是你臨櫃換匯的實際匯率，兩者差距可達 ${ex.diffPct}%。`,
      },
    ];
  }

  // twd-to-foreign
  const exampleTwd = ex.exampleTWD;
  const foreignResult = Math.round(exampleTwd / ex.cashSell);
  return [
    {
      question: `台幣換${displayName}今日匯率是多少？`,
      answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${formatAmount(exampleTwd)} 台幣約可換 ${formatAmount(foreignResult)} ${code}。${APP_INFO.shortName} 顯示臺灣銀行牌告實際賣出價，出國換匯前可精準估算。`,
    },
    {
      question: `出國前換${displayName}，該用哪個匯率？`,
      answer: `臨櫃換現鈔看「現金賣出」，網銀外幣帳戶看「即期賣出」。${APP_INFO.shortName} 同時顯示兩種匯率，讓你依換匯情境選擇正確報價。`,
    },
  ];
}

export function getCurrencyLandingPageContent(
  code: CurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/${code.toLowerCase()}-twd`;
  const displayName = override.displayName;

  const commonAmounts: CommonAmountEntry[] = override.popularAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} ${code}`,
    question: `${formatAmount(amount)} ${displayName}等於多少台幣？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    {
      question: `為什麼 Google、XE、Wise、Apple 計算機顯示的${displayName}換算金額，和台灣銀行臨櫃換匯的實際結果不同？`,
      answer: `Google 匯率（資料來源：Morningstar）、XE、Wise 及 Apple 計算機（資料來源：Yahoo Finance）所顯示的匯率均為「市場中間價」（mid-market rate）——即全球銀行同業間批發交易的參考基準價，一般消費者無法直接以此價格換匯。這些工具本質上是匯率參考儀表板，並非反映實際臨櫃換匯成本。台灣銀行臨櫃現金換匯使用的是「現金賣出」牌告價，因需涵蓋現鈔保管、運送與保險成本，通常比市場中間價高出 1% 至 10% 以上（東南亞及非主流貨幣差距尤為顯著）。${buildRateExampleSentence(code, displayName)} ${APP_INFO.name}直接顯示臺灣銀行官方牌告的${spotAvailable ? '現金賣出與即期賣出價' : '現金賣出價'}，是專為台灣人設計的精準換匯工具，讓使用者出門換匯前即可掌握真實兌換金額，不被市場中間價誤導。`,
    },
    // 幣別特化 FAQ：基於權威金融網站資訊，提供該幣別獨特的換匯知識
    ...(CURRENCY_SPECIFIC_FAQ[code] ?? []),
    ...(spotAvailable
      ? [
          {
            question: `${displayName}現金賣出和即期賣出有什麼差別？怎麼選？`,
            answer: `「現金賣出」適合臨櫃換外幣現鈔，「即期賣出」適合網銀外幣帳戶轉換或匯款。現金匯率通常比即期差，因為銀行需負擔現鈔的保管、運送與保險成本。出國旅遊前換現金看「現金賣出」，線上外幣轉換看「即期賣出」。`,
          },
        ]
      : []),
    {
      question: override.question,
      answer: `${buildCashSellRateSentence(code, override.popularAmounts[0])}使用本工具可查看 5 分鐘即時更新匯率，點擊「開始換算」輸入任意金額查看結果。`,
    },
    {
      question: `${formatAmount(override.popularAmounts.at(-1) ?? 0)} ${displayName}大約等於多少台幣？`,
      answer: `${buildCashSellRateSentence(code, override.popularAmounts.at(-1) ?? 0)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡的匯率跟 ${APP_INFO.shortName} 顯示的${displayName}台銀牌告匯率一樣嗎？`,
      answer: `不一樣。出國刷卡使用的是發卡組織（Visa、Mastercard）的清算匯率，再加上發卡銀行的海外交易手續費（通常 1.5%），與臺灣銀行牌告匯率是不同體系。本工具顯示的台銀牌告匯率適用於臨櫃換鈔或外幣帳戶匯款，不代表你出國刷卡時的實際扣款匯率。若出國以刷卡為主，建議另行查詢發卡銀行的海外手續費規定。`,
    },
    // 替代換匯管道 FAQ（如明洞換匯所），僅有 alternativeProviders 的幣別（KRW）會產生條目
    // /krw-twd/ 頁方向為 to-twd（旅客持 KRW 換 TWD），使用 rateBuy 版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'to-twd'),
  ];

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `即時${displayName}匯率 — 台銀實際賣出價 | ${code}/TWD`,
    description: spotAvailable
      ? `即時查看台銀${displayName}現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。適合${override.region}費用估算使用。`
      : `即時查看台銀${displayName}現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，附快速金額按鈕與 7～30 天歷史趨勢圖。適合${override.region}費用估算使用。`,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      `${code} TWD 匯率`,
      override.keyword,
      `${displayName}匯率`,
      `${displayName}換台幣`,
      ...override.searchQueries,
      '匯率換算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `${displayName}兌台幣匯率分享圖片`,
        `${APP_INFO.name} ${code}/TWD 即時匯率換算與趨勢`,
      ),
      // 幣別頁只輸出可稽核的匯率數值 schema，避免把 FAQ rich result 訊號擴散到金融頁。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              code,
              'TWD',
              rateExample.cashSell,
              `臺灣銀行現金賣出價（${displayName}換台幣匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇原始貨幣',
        text: `在首頁將來源貨幣設定為 ${code}，再選擇 TWD 或其他目標貨幣。可點擊星號收藏常用幣別。`,
      },
      {
        position: 2,
        name: '輸入金額',
        text: `輸入 ${code} 金額、使用計算機鍵盤或點擊快速金額按鈕（如 ${override.popularAmounts.slice(0, 3).map(formatAmount).join('、')}），系統即時計算換算結果。`,
      },
      {
        position: 3,
        name: '切換匯率類型',
        text: spotAvailable
          ? '依換匯情境切換現金匯率或即期匯率。臨櫃換鈔選現金，匯款轉帳選即期。'
          : '此幣別以現金牌告為主，換匯前請直接確認現金賣出價並搭配歷史趨勢判斷預算。',
      },
      {
        position: 4,
        name: '查看趨勢與歷史',
        text: '展開匯率卡片可查看 7~30 天歷史趨勢圖，幫助判斷換匯時機。',
      },
    ],
    highlights: [
      spotAvailable
        ? `精準賣出價：顯示臺灣銀行牌告的現金賣出與即期賣出實際報價，非中間價——換匯金額更精準，避免低估所需台幣。`
        : `精準賣出價：顯示臺灣銀行牌告的現金賣出實際報價，非中間價——換匯金額更精準，避免低估所需台幣。`,
      spotAvailable
        ? `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`
        : `資料來源：臺灣銀行牌告匯率，頁面以該幣別可實際查得的現金買入賣出報價為準。`,
      `更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間，亦可下拉手動重新整理。`,
      `適用情境：${override.region}前快速查看 ${code}/TWD 即時換算與歷史趨勢。`,
      `${override.travelTip}`,
      `工具功能：計算機鍵盤快速輸入、快速金額按鈕、收藏管理與拖曳排序、換算歷史紀錄。`,
    ],
    commonAmounts,
    travelTip: override.travelTip,
    faqTitle: `${displayName}換匯常見問題`,
    direction: 'to-twd' as const,
    relatedGuides: RELATED_GUIDES_TO_TWD,
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'to-twd'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 反向幣別頁（TWD→外幣）：出國換匯場景 SSOT
// ─────────────────────────────────────────────────────────────────────────────

/** 反向幣別頁的差異化覆寫：強調出國前換匯場景與台幣→外幣方向。 */
const REVERSE_CURRENCY_PAGE_OVERRIDES = {
  USD: {
    keyword: '台幣換美金',
    travelTip: '出國前在台灣市區銀行換美金現鈔，匯率通常優於機場；信用卡手續費另計。',
    outboundTip: '赴美期間以刷卡為主，建議備少量現金備用。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換美金', '30000台幣換多少美金', '美金匯率今日買入'],
  },
  JPY: {
    keyword: '台幣換日圓',
    travelTip: '日本許多餐廳與小店仍以現金為主，建議出發前換足日圓現鈔。',
    outboundTip: '可在台灣銀行或兆豐銀行換日圓，機場匯率通常較差。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換日圓', '50000台幣換多少日圓', '日圓匯率買入'],
  },
  EUR: {
    keyword: '台幣換歐元',
    travelTip: '歐洲多數商家接受刷卡，建議備少量歐元現金用於小攤或市集。',
    outboundTip: '歐元在台灣市區銀行可換，建議提早預留 2~3 個工作天。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換歐元', '30000台幣換多少歐元', '歐元匯率買入'],
  },
  GBP: {
    keyword: '台幣換英鎊',
    travelTip: '英國感應支付普及，現金需求少；建議少量備用即可。',
    outboundTip: '英鎊在台灣大型銀行可換，非主要幣別建議提前詢問庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換英鎊', '30000台幣換多少英鎊', '英鎊匯率買入'],
  },
  CNY: {
    keyword: '台幣換人民幣',
    travelTip: '中國大陸以行動支付為主，少量人民幣備用即可應付小額付款。',
    outboundTip: '赴中國大陸前可在台灣銀行換人民幣現鈔，建議確認各行庫存。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換人民幣', '10000台幣換多少人民幣', '人民幣匯率買入'],
  },
  KRW: {
    keyword: '台幣換韓元',
    travelTip: '韓國多數店家接受刷卡，但夜市與路邊攤建議準備現金。',
    outboundTip: '韓元在台灣部分銀行可換，或抵達首爾明洞換匯所匯率有時更優。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換韓元', '10000台幣換多少韓元', '韓元匯率買入'],
  },
  HKD: {
    keyword: '台幣換港幣',
    travelTip: '香港八達通卡方便；其餘可刷卡或付港幣現金。',
    outboundTip: '港幣在台灣市區銀行可換，匯率穩定且流動性佳。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換港幣', '10000台幣換多少港幣', '港幣匯率買入'],
  },
  AUD: {
    keyword: '台幣換澳幣',
    travelTip: '澳洲刷卡普及，建議少量備用澳幣現金即可。',
    outboundTip: '澳幣在台灣大型銀行可換，建議提前 2 天預約。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換澳幣', '30000台幣換多少澳幣', '澳幣匯率買入'],
  },
  CAD: {
    keyword: '台幣換加幣',
    travelTip: '加拿大刷卡普及，備少量現金用於小費或緊急情況。',
    outboundTip: '加幣在台灣大型銀行可換，非旺季建議提前確認庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換加幣', '30000台幣換多少加幣', '加幣匯率買入'],
  },
  SGD: {
    keyword: '台幣換新加坡幣',
    travelTip: '新加坡刷卡與行動支付普及，熟食中心建議備少量現金。',
    outboundTip: '新幣在台灣銀行可換，或抵達後在機場/市區換匯所換。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換新幣', '10000台幣換多少新加坡幣', '新幣匯率買入'],
  },
  THB: {
    keyword: '台幣換泰銖',
    travelTip: '泰國夜市、計程車以現金為主，建議攜帶充足泰銖。',
    outboundTip: '泰銖在台灣部分銀行可換，或抵達曼谷後在蘇坤蔚路換匯所換。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換泰銖', '10000台幣換多少泰銖', '泰銖匯率買入'],
  },
  NZD: {
    keyword: '台幣換紐元',
    travelTip: '紐西蘭刷卡普及，部分戶外活動建議備少量現金。',
    outboundTip: '紐元在台灣大型銀行可換，建議提前確認庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換紐元', '30000台幣換多少紐元', '紐元匯率買入'],
  },
  CHF: {
    keyword: '台幣換瑞士法郎',
    travelTip: '瑞士消費水準高，刷卡普遍；備少量法郎現金備用即可。',
    outboundTip: '瑞郎在台灣大型銀行可換，非主要幣別建議提前預約。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換瑞郎', '30000台幣換多少瑞士法郎', '瑞郎匯率買入'],
  },
  VND: {
    keyword: '台幣換越南盾',
    travelTip: '越南以現金為主，建議攜帶充足越南盾，面額大鈔較受歡迎。',
    outboundTip: '越南盾在台灣部分銀行可換，或抵達後在河內/胡志明市換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換越南盾', '10000台幣換多少越南盾', '越南盾匯率買入'],
  },
  PHP: {
    keyword: '台幣換菲律賓披索',
    travelTip: '菲律賓觀光區刷卡普及，偏遠地區建議準備披索現金。',
    outboundTip: '披索在台灣銀行可換，或抵達馬尼拉/宿霧後在機場換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換菲律賓披索', '10000台幣換多少披索', '披索匯率買入'],
  },
  IDR: {
    keyword: '台幣換印尼盾',
    travelTip: '印尼（峇里島）以現金為主，建議在峇里島市區換匯所兌換，匯率通常優於機場。',
    outboundTip: '印尼盾在台灣部分銀行可換，面額大，建議確認所需張數。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換印尼盾', '10000台幣換多少印尼盾', '印尼盾匯率買入'],
  },
  MYR: {
    keyword: '台幣換馬來幣',
    travelTip: '吉隆坡市區刷卡普及，夜市和熟食中心建議準備現金。',
    outboundTip: '馬來幣在台灣部分銀行可換，或抵達後在吉隆坡市區換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換馬來幣', '10000台幣換多少馬來幣', '馬來幣匯率買入'],
  },
} as const;

export type ReverseCurrencyLandingCode = keyof typeof REVERSE_CURRENCY_PAGE_OVERRIDES;

export function getReverseCurrencyLandingPageContent(
  code: ReverseCurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = REVERSE_CURRENCY_PAGE_OVERRIDES[code];
  const forwardOverride = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/twd-${code.toLowerCase()}`;
  const displayName = forwardOverride.displayName;

  const commonAmounts: CommonAmountEntry[] = override.popularTwdAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} TWD`,
    question: `${formatAmount(amount)} 台幣可以換多少${displayName}？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    {
      question: `現在台幣換${displayName}划算嗎？什麼時候換比較好？`,
      answer: `匯率每日波動，難以預測「最佳時機」。${APP_INFO.shortName} 提供 7～30 天歷史趨勢圖，讓你觀察近期走勢。建議分批換匯分散風險，而非等待所謂最低點。出發前 1～2 週開始觀察趨勢，視需求分 2～3 次換匯是常見策略。`,
    },
    // 反向頁特化 FAQ：基於權威金融網站資訊，提供出國換匯場景的獨特知識
    ...(REVERSE_CURRENCY_SPECIFIC_FAQ[code] ?? []),
    {
      question: `帶台幣去銀行換${displayName}，要看哪個匯率？`,
      answer: `你帶台幣去銀行買${displayName}現鈔，銀行是在「賣出」外幣給你，需參考台銀牌告的「現金賣出」價。${APP_INFO.shortName} 直接顯示此數字——這才是你實際要付的台幣金額，而非 Google 或 XE 顯示的市場中間價。`,
    },
    {
      question: `${formatAmount(override.popularTwdAmounts[2] ?? 30000)} 台幣可以換多少${displayName}？`,
      answer: `${buildTwdToForeignRateSentence(code, override.popularTwdAmounts[2] ?? 30000)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡跟換現金哪個比較省？`,
      answer: `取決於發卡銀行的海外手續費。部分無手續費卡片搭配Visa/Mastercard清算匯率，整體成本可能低於現金換匯。但現金在特定地區（如泰國、日本）更實用。建議同時準備少量現金加信用卡。`,
    },
    ...(spotAvailable
      ? [
          {
            question: `換${displayName}現金和外幣帳戶匯款哪種匯率較好？`,
            answer: `外幣帳戶使用「即期賣出」匯率，通常優於「現金賣出」，因為銀行省去了現鈔保管與運送成本。如不急需現鈔，透過網銀外幣帳戶換匯通常可省下一些匯差。${APP_INFO.shortName} 可一鍵切換查看兩種報價。`,
          },
        ]
      : []),
    // 替代換匯管道 FAQ（如明洞換匯所），僅 KRW 等有 alternativeProviders 的幣別會產生條目
    // /twd-krw/ 頁方向為 twd-to-foreign（旅客持 TWD 換 KRW），使用 rate（sell 率）版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'twd-to-foreign'),
  ];

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `台幣換${displayName}匯率 — 出國換匯實際費率 | TWD/${code}`,
    description: spotAvailable
      ? `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖，幫助你合理規劃換匯預算。`
      : `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，附快速金額按鈕與 7～30 天歷史趨勢圖，幫助你合理規劃換匯預算。`,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      override.keyword,
      `TWD ${code} 匯率`,
      `台幣換${displayName}`,
      `${displayName}匯率今日`,
      ...override.searchQueries,
      '換匯計算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `台幣換${displayName}匯率分享圖片`,
        `${APP_INFO.name} TWD/${code} 出國換匯即時計算`,
      ),
      // 反向幣別頁同樣只輸出可稽核的匯率數值 schema。
      // 反向頁（TWD→外幣）：currency 為 TWD，priceCurrency 為外幣代碼。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              'TWD',
              code,
              Number((1 / rateExample.cashSell).toFixed(6)),
              `臺灣銀行現金賣出價（台幣換${displayName}匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇換算方向',
        text: `進入 ${APP_INFO.shortName} 首頁，設定來源貨幣為 TWD，目標貨幣選 ${code}。`,
      },
      {
        position: 2,
        name: '輸入台幣金額',
        text: `輸入你想換出的台幣金額，或使用快速金額按鈕（如 ${override.popularTwdAmounts.slice(0, 3).map(formatAmount).join('、')} 台幣），系統即時顯示可換到的${displayName}。`,
      },
      {
        position: 3,
        name: '確認匯率類型',
        text: spotAvailable
          ? '確認使用「現金匯率」（臨櫃換鈔）或「即期匯率」（網銀外幣帳戶）。兩者費率不同，請依換匯方式選擇。'
          : '此幣別以現金牌告為主，出國前請直接確認現金賣出價並搭配歷史趨勢安排換匯節奏。',
      },
      {
        position: 4,
        name: '觀察趨勢，決定換匯時機',
        text: '展開匯率卡片查看 7～30 天歷史趨勢，了解近期匯率高低區間，協助判斷換匯時機。',
      },
    ],
    highlights: [
      `精準費率：顯示台銀現金賣出價——這是你帶台幣換${displayName}現鈔的實際費率，非中間價。`,
      spotAvailable
        ? `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`
        : `資料來源：臺灣銀行牌告匯率，頁面以該幣別可實際查得的現金買入賣出報價為準。`,
      `更新頻率：每 5 分鐘自動同步，顯示最近更新時間，可手動重新整理。`,
      `換匯估算：輸入台幣金額即時計算可換到的${displayName}，並附 7～30 天趨勢。`,
      `${override.travelTip}`,
      `工具功能：計算機鍵盤快速輸入、快速金額按鈕、收藏管理、換算歷史紀錄。`,
    ],
    commonAmounts,
    travelTip: override.travelTip,
    faqTitle: `台幣換${displayName}常見問題`,
    direction: 'twd-to-foreign' as const,
    relatedGuides: RELATED_GUIDES_TWD_TO_FOREIGN,
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'twd-to-foreign'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}
