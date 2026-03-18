/**
 * SEO Helmet - 統一 SEO 元資料管理
 *
 * 目標：
 * - 由 Head 輸出真正的 <head> metadata，避免 SSR 時落在 body/root
 * - 所有預設值與 schema 來源統一收斂到 config/seo-metadata.ts
 */
import { Head } from 'vite-react-ssg';
import { useEffect, useMemo } from 'react';
import { APP_INFO } from '../config/app-info';
import { shouldRenderStructuredData } from './seo-helmet-utils';
import {
  type AlternateLink,
  type BreadcrumbItem,
  type HowToData,
  type JsonLdBlock,
  DEFAULT_LOCALE,
  OG_IMAGE_ALT,
  SITE_SEO,
  buildAbsoluteAssetUrl,
  buildCanonicalUrl,
  buildDefaultAlternates,
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
  howTo?: HowToData;
  breadcrumb?: BreadcrumbItem[];
  robots?: string;
}

const STRUCTURED_DATA_SELECTOR =
  'script[type="application/ld+json"][data-rh="true"], script[type="application/ld+json"][data-seo-helmet="structured-data"]';
const SEO_HELMET_MANAGED_ATTR = 'data-seo-helmet';
const SEO_HELMET_MANAGED_VALUE = 'managed';
const SEO_HELMET_STRUCTURED_DATA_VALUE = 'structured-data';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDocumentTitle(title?: string) {
  if (!title) return SITE_SEO.title;

  const trailingBrandPattern = new RegExp(`\\s*\\|\\s*${escapeRegExp(APP_INFO.name)}$`);
  const normalizedTitle = title.trim().replace(trailingBrandPattern, '').trim();
  return `${normalizedTitle} | ${APP_INFO.name}`;
}

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
  // 清除兩類 SEOHelmet 自行寫入的節點，防止 SSR 與 CSR 節點並存（重複 hreflang / og:locale:alternate）：
  //   - data-seo-helmet="managed"：client-side useEffect 寫入
  //   - data-rh="true"：SSR <Head>（vite-react-ssg）輸出，hydration 後由 useEffect 接管
  // 不含任一標記的節點視為外部注入，不予移除。
  document.head
    .querySelectorAll(
      `${selector}[${SEO_HELMET_MANAGED_ATTR}="${SEO_HELMET_MANAGED_VALUE}"], ${selector}[data-rh="true"]`,
    )
    .forEach((node) => node.remove());
  elements.forEach((element) => {
    element.setAttribute('data-rh', 'true');
    element.setAttribute(SEO_HELMET_MANAGED_ATTR, SEO_HELMET_MANAGED_VALUE);
    document.head.appendChild(element);
  });
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
  howTo,
  breadcrumb,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}: SEOProps) {
  const fullTitle = buildDocumentTitle(title);
  const canonicalUrl = canonical ? buildCanonicalUrl(canonical) : buildCanonicalUrl(pathname);
  const ogImageUrl = buildAbsoluteAssetUrl(ogImage);
  const normalizedAlternates = useMemo(() => {
    const alternatesToRender = alternates?.length ? alternates : buildDefaultAlternates(pathname);

    return alternatesToRender.map(({ href, hrefLang }) => ({
      hrefLang,
      href: buildCanonicalUrl(href),
    }));
  }, [alternates, pathname]);
  const normalizedAlternatesSignature = useMemo(
    () => normalizedAlternates.map(({ hrefLang, href }) => `${hrefLang}:${href}`).join('|'),
    [normalizedAlternates],
  );
  const ogLocale = locale.replace('-', '_');
  const structuredDataJson = useMemo(() => {
    if (!shouldRenderStructuredData(robots)) return null;

    const additionalJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    const hasImageObject = additionalJsonLd.some((block) => block['@type'] === 'ImageObject');
    const data: JsonLdBlock[] = [
      ...buildSiteJsonLd(),
      ...additionalJsonLd,
      ...(hasImageObject
        ? []
        : [buildShareImageJsonLd(OG_IMAGE_ALT, `${APP_INFO.name} 匯率換算工具預覽圖`)]),
      ...(howTo ? [buildHowToSchema(howTo, canonicalUrl)] : []),
      ...(breadcrumb?.length
        ? ([buildBreadcrumbSchema(breadcrumb)].filter(Boolean) as JsonLdBlock[])
        : []),
    ];

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': data.map((item) => {
        const { '@context': _, ...rest } = item as Record<string, unknown>;
        return rest;
      }),
    });
  }, [robots, jsonLd, howTo, breadcrumb, canonicalUrl]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    upsertTitle(fullTitle);
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="author"]', { name: 'author', content: APP_INFO.author });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    if (keywords?.length) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords.join(', ') });
    } else {
      document.head
        .querySelectorAll(
          `meta[name="keywords"][${SEO_HELMET_MANAGED_ATTR}="${SEO_HELMET_MANAGED_VALUE}"]`,
        )
        .forEach((n) => n.remove());
    }
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

    // SPA 導覽：不在 unmount 時清除，避免新頁面掛載前短暫無 metadata 的閃爍。
    // 所有標籤由 upsert* 與 replaceHeadCollection 負責覆寫或替換。
  }, [
    canonicalUrl,
    description,
    fullTitle,
    keywords,
    locale,
    normalizedAlternates,
    normalizedAlternatesSignature,
    ogImageUrl,
    ogLocale,
    ogType,
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
      <meta name="description" content={description} />
      <meta name="author" content={APP_INFO.author} />
      <meta name="robots" content={robots} />
      {keywords?.length ? <meta name="keywords" content={keywords.join(', ')} /> : null}
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
