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
}

const DEFAULT_TITLE = 'RateWise - 即時匯率換算工具';
const DEFAULT_DESCRIPTION =
  '快速、準確的即時匯率轉換工具，支援多種貨幣與歷史匯率查詢。參考臺灣銀行牌告匯率，精準可靠。';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ratewise.app'; // Fallback
const DEFAULT_LOCALE = 'zh-TW';
const DEFAULT_KEYWORDS = ['匯率', '匯率換算', '即時匯率', '台灣銀行', '多幣別換算', 'RateWise'];

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

/**
 * Default JSON-LD structured data (SoftwareApplication + Organization)
 */
const DEFAULT_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RateWise',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    screenshot: `${SITE_URL}/pwa-512x512.png`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
      url: SITE_URL,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RateWise',
    url: SITE_URL,
    logo: `${SITE_URL}/pwa-512x512.png`,
    sameAs: [], // Add social media links if available
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RateWise',
    url: SITE_URL,
    inLanguage: DEFAULT_LOCALE,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
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

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
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

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImageUrl} />

      {/* JSON-LD Structured Data */}
      {structuredData.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
