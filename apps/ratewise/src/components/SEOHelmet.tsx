/**
 * SEO Helmet - 統一 SEO 元資料管理
 *
 * 目標：
 * - 由 Head 輸出真正的 <head> metadata，避免 SSR 時落在 body/root
 * - 所有預設值與 schema 來源統一收斂到 config/seo-metadata.ts
 */
import { Head } from 'vite-react-ssg';
import { APP_INFO } from '../config/app-info';
import {
  type AlternateLink,
  type BreadcrumbItem,
  type FAQEntry,
  type HowToData,
  type JsonLdBlock,
  DEFAULT_LOCALE,
  OG_IMAGE_ALT,
  SITE_SEO,
  buildAbsoluteAssetUrl,
  buildCanonicalUrl,
  buildShareImageJsonLd,
  buildSiteJsonLd,
} from '../config/seo-metadata';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: JsonLdBlock | JsonLdBlock[];
  pathname?: string;
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  howTo?: HowToData;
  breadcrumb?: BreadcrumbItem[];
  robots?: string;
}

const buildFaqSchema = (faq: FAQEntry[]): JsonLdBlock => ({
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
});

const buildHowToSchema = (howTo: HowToData, url: string): JsonLdBlock => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: howTo.name,
  description: howTo.description,
  url,
  totalTime: howTo.totalTime ?? 'PT30S',
  step: howTo.steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: step.position ?? index + 1,
    name: step.name,
    text: step.text,
    ...(step.image ? { image: buildAbsoluteAssetUrl(step.image) } : {}),
  })),
});

const buildBreadcrumbSchema = (items: BreadcrumbItem[]): JsonLdBlock | null => {
  if (items.length < 2) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.item),
    })),
  };
};

export function shouldRenderStructuredData(robots: string): boolean {
  return !robots.toLowerCase().includes('noindex');
}

export function SEOHelmet({
  title,
  description = SITE_SEO.description,
  canonical,
  ogImage = SITE_SEO.ogImage,
  ogType = 'website',
  jsonLd,
  pathname,
  locale = DEFAULT_LOCALE,
  alternates,
  keywords,
  updatedTime = SITE_SEO.updatedTime,
  faq,
  howTo,
  breadcrumb,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}: SEOProps) {
  const fullTitle = title ? `${title} | ${APP_INFO.name}` : SITE_SEO.title;
  const canonicalUrl = canonical ? buildCanonicalUrl(canonical) : buildCanonicalUrl(pathname);
  const ogImageUrl = buildAbsoluteAssetUrl(ogImage);
  const keywordsContent = (keywords?.length ? keywords : SITE_SEO.keywords).join(', ');
  const alternatesToRender = alternates?.length
    ? alternates
    : [
        { hrefLang: 'x-default', href: canonicalUrl },
        { hrefLang: DEFAULT_LOCALE, href: canonicalUrl },
      ];
  const normalizedAlternates = alternatesToRender.map(({ href, hrefLang }) => ({
    hrefLang,
    href: buildCanonicalUrl(href),
  }));
  const ogLocale = locale.replace('-', '_');
  const additionalJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const hasImageObject = additionalJsonLd.some((block) => block['@type'] === 'ImageObject');
  const structuredData: JsonLdBlock[] = [
    ...buildSiteJsonLd(),
    ...additionalJsonLd,
    ...(hasImageObject
      ? []
      : [buildShareImageJsonLd(OG_IMAGE_ALT, `${APP_INFO.name} 匯率換算工具預覽圖`)]),
  ];

  if (faq?.length) {
    structuredData.push(buildFaqSchema(faq));
  }

  if (howTo) {
    structuredData.push(buildHowToSchema(howTo, canonicalUrl));
  }

  if (breadcrumb?.length) {
    const breadcrumbSchema = buildBreadcrumbSchema(breadcrumb);
    if (breadcrumbSchema) {
      structuredData.push(breadcrumbSchema);
    }
  }

  const renderStructuredData = shouldRenderStructuredData(robots);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="author" content={APP_INFO.author} />
      <meta name="robots" content={robots} />
      <meta name="language" content={locale} />
      <link rel="canonical" href={canonicalUrl} />
      {normalizedAlternates.map(({ href, hrefLang }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}

      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />
      <meta property="og:locale" content={ogLocale} />
      {normalizedAlternates
        .filter(
          ({ hrefLang }) => hrefLang !== 'x-default' && hrefLang.replace('-', '_') !== ogLocale,
        )
        .map(({ hrefLang }) => (
          <meta
            key={hrefLang}
            property="og:locale:alternate"
            content={hrefLang.replace('-', '_')}
          />
        ))}
      <meta property="og:site_name" content={APP_INFO.name} />
      <meta property="og:updated_time" content={updatedTime} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />
      <meta name="twitter:site" content={APP_INFO.socialHandle} />
      <meta name="twitter:creator" content={APP_INFO.socialHandle} />

      {renderStructuredData ? (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': structuredData.map((item) => {
              const { '@context': _, ...rest } = item as Record<string, unknown>;
              return rest;
            }),
          })}
        </script>
      ) : null}
    </Head>
  );
}
