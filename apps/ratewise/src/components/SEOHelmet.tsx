/**
 * SEO Helmet Component
 * [context7:react-helmet-async:2025-10-18T02:00:00+08:00]
 *
 * Centralized SEO metadata management with JSON-LD structured data
 */
import { Helmet } from 'react-helmet-async';

interface AlternateLink {
  hrefLang: string;
  href: string;
}

interface FAQEntry {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  pathname?: string;
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  howTo?: {
    name: string;
    description: string;
    steps: HowToStep[];
  };
}

const DEFAULT_TITLE = 'RateWise - 即時匯率轉換器 | 支援 TWD、USD、JPY、EUR 等多幣別換算';
const DEFAULT_DESCRIPTION =
  'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。';
const DEFAULT_OG_IMAGE = '/og-image.png';
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ratewise.app'; // Fallback
const DEFAULT_LOCALE = 'zh-TW';
const DEFAULT_KEYWORDS = [
  '匯率好工具',
  '匯率',
  '匯率換算',
  '即時匯率',
  '台幣匯率',
  'TWD',
  'USD',
  '外幣兌換',
  '匯率查詢',
  '臺灣銀行匯率',
  '台灣匯率',
  '美金匯率',
  '日幣匯率',
  '歐元匯率',
  '線上匯率',
  '匯率計算機',
  'RateWise',
];

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

/**
 * Default JSON-LD structured data (WebApplication + Organization + Website)
 * Optimized for 2025 AI search (LLMO, GEO, AEO)
 */
const DEFAULT_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RateWise',
    alternateName: '匯率好工具',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '即時匯率查詢',
      '單幣別換算',
      '多幣別同時換算',
      '歷史匯率趨勢',
      '離線使用',
      'PWA 支援',
      '台灣銀行牌告匯率',
      '30+ 種貨幣支援',
    ],
    // 使用實際存在的 OG image 作為 screenshot
    screenshot: `${SITE_URL}/og-image.png`,
    image: `${SITE_URL}/og-image.png`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RateWise',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'haotool.org@gmail.com',
    },
    sameAs: [], // Add social media links if available
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RateWise',
    url: SITE_URL,
    inLanguage: DEFAULT_LOCALE,
    description: DEFAULT_DESCRIPTION,
  },
];

const DEFAULT_ALTERNATES: AlternateLink[] = [
  { hrefLang: 'x-default', href: SITE_URL },
  { hrefLang: DEFAULT_LOCALE, href: SITE_URL },
];

const buildFaqSchema = (faq: FAQEntry[], url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
  url,
});

const buildHowToSchema = (
  howTo: { name: string; description: string; steps: HowToStep[] },
  url: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: howTo.name,
  description: howTo.description,
  url,
  step: howTo.steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
    ...(step.image && { image: step.image }),
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
  howTo,
}: SEOProps) {
  const fullTitle = title ? `${title} | RateWise` : DEFAULT_TITLE;
  const baseUrl = trimTrailingSlash(SITE_URL);
  const path = pathname ? ensureLeadingSlash(pathname) : '/';
  const canonicalUrl = canonical ?? `${baseUrl}${path === '//' ? '/' : path}`;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  const keywordsContent = (keywords?.length ? keywords : DEFAULT_KEYWORDS).join(', ');
  const alternatesToRender = alternates?.length ? alternates : DEFAULT_ALTERNATES;
  const updatedTimestamp = updatedTime ?? new Date().toISOString();
  const ogLocale = locale.replace('-', '_');

  // Merge default JSON-LD with custom blocks
  const baseJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const structuredData = [...DEFAULT_JSON_LD, ...baseJsonLd];

  if (faq?.length) {
    structuredData.push(buildFaqSchema(faq, canonicalUrl));
  }

  if (howTo) {
    structuredData.push(buildHowToSchema(howTo, canonicalUrl));
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="author" content="RateWise Team" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="language" content={locale} />
      <meta httpEquiv="content-language" content={locale} />
      <link rel="canonical" href={canonicalUrl} />
      {alternatesToRender.map(({ href, hrefLang }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="RateWise 匯率轉換器應用截圖" />
      <meta property="og:locale" content={ogLocale} />
      {alternatesToRender
        .filter(({ hrefLang }) => hrefLang !== 'x-default')
        .map(({ hrefLang }) => (
          <meta
            key={hrefLang}
            property="og:locale:alternate"
            content={hrefLang.replace('-', '_')}
          />
        ))}
      <meta property="og:site_name" content="RateWise" />
      <meta property="og:updated_time" content={updatedTimestamp} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content="RateWise 匯率轉換器" />

      {/* JSON-LD Structured Data */}
      {structuredData.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
