/**
 * SEO Helmet Component
 * [context7:react-helmet-async:2025-10-18T02:00:00+08:00]
 *
 * Centralized SEO metadata management with JSON-LD structured data
 */
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_TITLE = 'RateWise - 即時匯率換算工具';
const DEFAULT_DESCRIPTION =
  '快速、準確的即時匯率轉換工具，支援多種貨幣與歷史匯率查詢。參考臺灣銀行牌告匯率，精準可靠。';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ratewise.app'; // Fallback

/**
 * Default JSON-LD structured data (SoftwareApplication + Organization)
 */
const DEFAULT_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RateWise',
    applicationCategory: 'FinanceApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
    },
    operatingSystem: 'Any',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    screenshot: `${SITE_URL}/pwa-512x512.png`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RateWise',
    url: SITE_URL,
    logo: `${SITE_URL}/pwa-512x512.png`,
    sameAs: [], // Add social media links if available
  },
];

export function SEOHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | RateWise` : DEFAULT_TITLE;
  const canonicalUrl = canonical ?? SITE_URL;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  // Merge custom JSON-LD with defaults
  const structuredData = jsonLd ?? DEFAULT_JSON_LD;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content="zh_TW" />
      <meta property="og:site_name" content="RateWise" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImageUrl} />

      {/* JSON-LD Structured Data */}
      {Array.isArray(structuredData) ? (
        structuredData.map((item, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(item)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}
