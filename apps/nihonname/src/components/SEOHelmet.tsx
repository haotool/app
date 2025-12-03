/**
 * SEO Helmet Component for NihonName
 * [context7:react-helmet-async:2025-12-03]
 *
 * Centralized SEO metadata management with JSON-LD structured data
 */
import { Helmet } from '../utils/react-helmet-async';

interface AlternateLink {
  hrefLang: string;
  href: string;
}

interface FAQEntry {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  pathname?: string;
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  robots?: string;
  breadcrumbs?: BreadcrumbItem[];
}

// Site configuration
const SITE_BASE_URL = 'https://app.haotool.org/nihonname/';

// Default breadcrumbs for home page
const DEFAULT_BREADCRUMBS: BreadcrumbItem[] = [{ name: '首頁', url: SITE_BASE_URL }];
const DEFAULT_TITLE = 'NihonName 皇民化改姓生成器 | 1940年代台灣日式姓名產生器';
const DEFAULT_DESCRIPTION =
  '探索1940年代台灣皇民化運動的歷史改姓對照。輸入你的姓氏，發現日治時期的日式姓名與趣味諧音名。基於歷史文獻《内地式改姓名の仕方》。';
const DEFAULT_OG_IMAGE = 'og-image.png';
const DEFAULT_LOCALE = 'zh-TW';
const DEFAULT_KEYWORDS = [
  '皇民化改姓',
  '日式姓名生成器',
  '台灣日治時期',
  '改姓對照表',
  '日本姓名',
  '1940年代台灣',
  '皇民化運動',
  'NihonName',
  '日式改名',
  '台灣歷史',
  '內地式改姓',
  '日式姓氏',
  '諧音日本名',
  '日治時期戶籍',
  '台灣姓氏',
];

const SOCIAL_LINKS = [
  'https://github.com/haotool/app',
  'https://www.threads.net/@azlife_1224',
  'https://twitter.com/azlife_1224',
];

// Build time injected by Vite
const BUILD_TIME = (() => {
  try {
    const envBuildTime: unknown = import.meta.env['VITE_BUILD_TIME'];
    return typeof envBuildTime === 'string' ? envBuildTime : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
})();

/**
 * Build canonical URL with proper path normalization
 */
const buildCanonical = (path?: string): string => {
  if (!path) return SITE_BASE_URL;

  // Normalize path: ensure trailing slash for consistency
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.endsWith('/') && !normalizedPath.includes('.')) {
    normalizedPath = `${normalizedPath}/`;
  }

  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
};

/**
 * Default JSON-LD structured data (WebApplication + Organization + Website)
 */
const DEFAULT_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NihonName 皇民化改姓生成器',
    alternateName: '日式姓名生成器',
    description: DEFAULT_DESCRIPTION,
    url: SITE_BASE_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '皇民化改姓查詢',
      '歷史姓氏對照',
      '趣味諧音日本名',
      '族譜來源查證',
      'PWA 離線支援',
      '300+ 姓氏資料庫',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
    logo: `${SITE_BASE_URL}icons/icon-512x512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'haotool.org@gmail.com',
    },
    sameAs: SOCIAL_LINKS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NihonName',
    url: SITE_BASE_URL,
    inLanguage: DEFAULT_LOCALE,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_BASE_URL}?surname={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

const DEFAULT_ALTERNATES: AlternateLink[] = [
  { hrefLang: 'x-default', href: SITE_BASE_URL },
  { hrefLang: DEFAULT_LOCALE, href: SITE_BASE_URL },
];

const buildFaqSchema = (faq: FAQEntry[], url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
  url,
});

/**
 * Build BreadcrumbList JSON-LD schema
 * @see https://schema.org/BreadcrumbList
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
const buildBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${SITE_BASE_URL}${item.url.replace(/^\//, '')}`,
  })),
});

export function SEOHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
  pathname,
  locale = DEFAULT_LOCALE,
  alternates,
  keywords,
  updatedTime,
  faq,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  breadcrumbs,
}: SEOProps) {
  const fullTitle = title ? `${title} | NihonName` : DEFAULT_TITLE;

  const canonicalUrl = canonical ? buildCanonical(canonical) : buildCanonical(pathname);
  const ogImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `${SITE_BASE_URL}${ogImage.replace(/^\//, '')}`;
  const keywordsContent = (keywords?.length ? keywords : DEFAULT_KEYWORDS).join(', ');
  const alternatesToRender = alternates?.length ? alternates : DEFAULT_ALTERNATES;
  const normalizedAlternates = alternatesToRender.map(({ href, hrefLang }) => ({
    hrefLang,
    href: buildCanonical(href),
  }));
  const updatedTimestamp = updatedTime ?? BUILD_TIME;
  const ogLocale = locale.replace('-', '_');

  // Merge default JSON-LD with custom blocks
  const baseJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const structuredData = [...DEFAULT_JSON_LD, ...baseJsonLd];

  if (faq?.length) {
    structuredData.push(buildFaqSchema(faq, canonicalUrl));
  }

  // Add BreadcrumbList schema
  const breadcrumbsToRender = breadcrumbs?.length ? breadcrumbs : DEFAULT_BREADCRUMBS;
  structuredData.push(buildBreadcrumbSchema(breadcrumbsToRender));

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="robots" content={robots} />
      <meta name="author" content="haotool" />
      <meta name="generator" content="NihonName" />
      <meta name="application-name" content="NihonName" />

      {/* Canonical & Alternates */}
      <link rel="canonical" href={canonicalUrl} />
      {normalizedAlternates.map((link) => (
        <link key={link.hrefLang} rel="alternate" hrefLang={link.hrefLang} href={link.href} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="NihonName 皇民化改姓生成器" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="NihonName" />
      <meta property="og:updated_time" content={updatedTimestamp} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@azlife_1224" />
      <meta name="twitter:creator" content="@azlife_1224" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content="NihonName 皇民化改姓生成器" />

      {/* JSON-LD Structured Data */}
      {structuredData.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
