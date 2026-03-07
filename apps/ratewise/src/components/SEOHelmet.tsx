/**
 * SEO Helmet - 統一 SEO 元資料管理
 *
 * 目標：
 * - 由 Head 輸出真正的 <head> metadata，避免 SSR 時落在 body/root
 * - 所有預設值與 schema 來源統一收斂到 config/seo-metadata.ts
 */
import { Head } from 'vite-react-ssg';
import { useEffect } from 'react';
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

const STRUCTURED_DATA_SELECTOR =
  'script[type="application/ld+json"][data-rh="true"], script[type="application/ld+json"][data-seo-helmet="structured-data"]';
const SEO_HELMET_MANAGED_ATTR = 'data-seo-helmet';
const SEO_HELMET_MANAGED_VALUE = 'managed';
const SEO_HELMET_STRUCTURED_DATA_VALUE = 'structured-data';
const SEO_HELMET_MANAGED_SELECTOR = `[${SEO_HELMET_MANAGED_ATTR}="${SEO_HELMET_MANAGED_VALUE}"]`;
const SEO_HELMET_STRUCTURED_DATA_SELECTOR = `[${SEO_HELMET_MANAGED_ATTR}="${SEO_HELMET_STRUCTURED_DATA_VALUE}"]`;

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

function upsertTitle(title: string) {
  const existing = Array.from(document.head.querySelectorAll('title'));
  const element = (existing[0] as HTMLTitleElement | undefined) ?? document.createElement('title');

  if (!element.isConnected) {
    document.head.appendChild(element);
  }

  existing.forEach((node) => {
    if (node !== element) {
      node.remove();
    }
  });

  element.textContent = title;
  element.setAttribute('data-rh', 'true');
  element.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_MANAGED_VALUE);
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  const existing = Array.from(document.head.querySelectorAll(selector));
  const element =
    (existing.find((node) => node.getAttribute('data-rh') === 'true') as
      | HTMLMetaElement
      | undefined) ??
    (existing[0] as HTMLMetaElement | undefined) ??
    document.createElement('meta');

  if (!element.isConnected) {
    document.head.appendChild(element);
  }

  existing.forEach((node) => {
    if (node !== element) {
      node.remove();
    }
  });

  Array.from(element.attributes)
    .map((attribute) => attribute.name)
    .filter((name) => name !== 'data-rh')
    .forEach((name) => element.removeAttribute(name));

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  element.setAttribute('data-rh', 'true');
  element.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_MANAGED_VALUE);
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  const existing = Array.from(document.head.querySelectorAll(selector));
  const element =
    (existing.find((node) => node.getAttribute('data-rh') === 'true') as
      | HTMLLinkElement
      | undefined) ??
    (existing[0] as HTMLLinkElement | undefined) ??
    document.createElement('link');

  if (!element.isConnected) {
    document.head.appendChild(element);
  }

  existing.forEach((node) => {
    if (node !== element) {
      node.remove();
    }
  });

  Array.from(element.attributes)
    .map((attribute) => attribute.name)
    .filter((name) => name !== 'data-rh')
    .forEach((name) => element.removeAttribute(name));

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  element.setAttribute('data-rh', 'true');
  element.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_MANAGED_VALUE);
}

function replaceHeadCollection(selector: string, elements: HTMLElement[]) {
  document.head.querySelectorAll(selector).forEach((node) => node.remove());
  elements.forEach((element) => {
    element.setAttribute('data-rh', 'true');
    element.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_MANAGED_VALUE);
    document.head.appendChild(element);
  });
}

function cleanupManagedHeadTags() {
  document.head.querySelectorAll(SEO_HELMET_MANAGED_SELECTOR).forEach((node) => node.remove());
  document.head
    .querySelectorAll(SEO_HELMET_STRUCTURED_DATA_SELECTOR)
    .forEach((node) => node.remove());
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
  const normalizedAlternatesSignature = normalizedAlternates
    .map(({ hrefLang, href }) => `${hrefLang}:${href}`)
    .join('|');
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
  const structuredDataJson = renderStructuredData
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': structuredData.map((item) => {
          const { '@context': _, ...rest } = item as Record<string, unknown>;
          return rest;
        }),
      })
    : null;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    upsertTitle(fullTitle);
    upsertMeta('meta[name="title"]', { name: 'title', content: fullTitle });
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywordsContent });
    upsertMeta('meta[name="author"]', { name: 'author', content: APP_INFO.author });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="language"]', { name: 'language', content: locale });
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

    const alternateLinks = normalizedAlternates.map(({ href, hrefLang }) => {
      const element = document.createElement('link');
      element.setAttribute('rel', 'alternate');
      element.setAttribute('hrefLang', hrefLang);
      element.setAttribute('href', href);
      return element;
    });
    replaceHeadCollection('link[rel="alternate"][hreflang]', alternateLinks);

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImageUrl });
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
    upsertMeta('meta[property="og:image:height"]', {
      property: 'og:image:height',
      content: '630',
    });
    upsertMeta('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: OG_IMAGE_ALT,
    });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: ogLocale });
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: APP_INFO.name,
    });
    upsertMeta('meta[property="og:updated_time"]', {
      property: 'og:updated_time',
      content: updatedTime,
    });

    const localeAlternates = normalizedAlternates
      .filter(({ hrefLang }) => hrefLang !== 'x-default' && hrefLang.replace('-', '_') !== ogLocale)
      .map(({ hrefLang }) => {
        const element = document.createElement('meta');
        element.setAttribute('property', 'og:locale:alternate');
        element.setAttribute('content', hrefLang.replace('-', '_'));
        return element;
      });
    replaceHeadCollection('meta[property="og:locale:alternate"]', localeAlternates);

    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:url"]', { name: 'twitter:url', content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImageUrl });
    upsertMeta('meta[name="twitter:image:alt"]', {
      name: 'twitter:image:alt',
      content: OG_IMAGE_ALT,
    });
    upsertMeta('meta[name="twitter:site"]', {
      name: 'twitter:site',
      content: APP_INFO.socialHandle,
    });
    upsertMeta('meta[name="twitter:creator"]', {
      name: 'twitter:creator',
      content: APP_INFO.socialHandle,
    });

    document.head.querySelectorAll(STRUCTURED_DATA_SELECTOR).forEach((node) => node.remove());
    if (structuredDataJson) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-rh', 'true');
      script.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_STRUCTURED_DATA_VALUE);
      script.textContent = structuredDataJson;
      document.head.appendChild(script);
    }

    return () => {
      cleanupManagedHeadTags();
    };
  }, [
    canonicalUrl,
    description,
    fullTitle,
    keywordsContent,
    locale,
    normalizedAlternatesSignature,
    ogImageUrl,
    ogLocale,
    ogType,
    renderStructuredData,
    robots,
    structuredDataJson,
    updatedTime,
  ]);

  if (typeof window !== 'undefined') {
    return null;
  }

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

      {structuredDataJson ? (
        <script type="application/ld+json" data-seo-helmet={SEO_HELMET_STRUCTURED_DATA_VALUE}>
          {structuredDataJson}
        </script>
      ) : null}
    </Head>
  );
}
