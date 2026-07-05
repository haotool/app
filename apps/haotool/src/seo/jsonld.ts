/**
 * JSON-LD Structured Data for SEO（@graph 單一 script，PRD §9.3 v2.1）
 * - 首頁：Organization(#organization) + WebSite(#website) + Person(#person)；禁止 SearchAction
 * - 全頁：WebPage（dateModified = BUILD_TIME，禁止寫死日期）＋非首頁 BreadcrumbList
 * - /tools/：CollectionPage + ItemList（5 工具，SSOT 為 config/tools.ts）
 * - /about/：ProfilePage + FAQPage（全站唯一，SSOT 為 config/faq.ts）
 * - /contact/：ContactPage（seo-2026 決定表 #5）
 */
import { APP_INFO, AUTHOR_PERSON, SEO_SOCIAL_LINKS } from '../config/app-info';
import { ABOUT_FAQS } from '../config/faq';
import { TOOLS, getToolUrl } from '../config/tools';
import { getRouteMetadata } from './meta-tags';

const SITE_URL = APP_INFO.siteUrl.replace(/\/$/, '');
const SITE_NAME = APP_INFO.name;
const DATE_PUBLISHED = '2025-01-01T00:00:00Z';

type JsonLdNode = Record<string, unknown>;

const BREADCRUMBS: Record<string, { name: string; url: string }[]> = {
  '/tools/': [
    { name: '首頁', url: '/' },
    { name: '工具', url: '/tools/' },
  ],
  '/about/': [
    { name: '首頁', url: '/' },
    { name: '關於', url: '/about/' },
  ],
  '/contact/': [
    { name: '首頁', url: '/' },
    { name: '聯繫', url: '/contact/' },
  ],
};

function normalizeRoute(route: string): string {
  if (route === '/') return '/';
  return route.endsWith('/') ? route : `${route}/`;
}

function buildPersonNode(): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: AUTHOR_PERSON.name,
    url: AUTHOR_PERSON.url,
    sameAs: AUTHOR_PERSON.sameAs,
    jobTitle: AUTHOR_PERSON.jobTitle,
    description: '專注於 React 19、TypeScript、Vite、PWA 開發，以產品級標準打造免費開源工具。',
    knowsAbout: ['React', 'TypeScript', 'Vite', 'PWA', 'Tailwind CSS', 'Cloudflare', 'Web 效能'],
  };
}

/**
 * Generate JSON-LD @graph nodes for a specific route
 */
export function getJsonLdForRoute(route: string, buildTime: string): JsonLdNode[] {
  const normalizedRoute = normalizeRoute(route);
  const metadata = getRouteMetadata(normalizedRoute);
  // 未知路由與 noindex 頁（/404/）不輸出結構化資料
  if (!metadata || metadata.noindex) {
    return [];
  }

  const graph: JsonLdNode[] = [];

  if (normalizedRoute === '/') {
    graph.push({
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/og-image.png`,
      email: APP_INFO.email,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: APP_INFO.email,
        url: `${SITE_URL}/contact/`,
      },
      founder: { '@id': `${SITE_URL}/#person` },
      sameAs: SEO_SOCIAL_LINKS,
    });

    // WebSite（站名）僅首頁輸出；alternateName 含全小寫網域名備援（site names 官方建議）。
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: [APP_INFO.shortName, APP_INFO.subtitle, 'haotool.org'],
      url: `${SITE_URL}/`,
      description: metadata.description,
      inLanguage: 'zh-TW',
      publisher: { '@id': `${SITE_URL}/#organization` },
    });

    graph.push(buildPersonNode());
  }

  const webPageNode: JsonLdNode = {
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}${normalizedRoute}`,
    inLanguage: 'zh-TW',
    datePublished: DATE_PUBLISHED,
    dateModified: buildTime,
    author: { '@id': `${SITE_URL}/#person` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  const breadcrumbs = BREADCRUMBS[normalizedRoute];
  if (breadcrumbs && breadcrumbs.length > 0) {
    webPageNode['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.url}`,
      })),
    };
  }

  graph.push(webPageNode);

  if (normalizedRoute === '/tools/') {
    graph.push({
      '@type': 'CollectionPage',
      name: '所有工具',
      description: metadata.description,
      url: `${SITE_URL}/tools/`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: TOOLS.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: getToolUrl(tool),
          description: tool.description,
        })),
      },
    });
  }

  if (normalizedRoute === '/about/') {
    graph.push({
      '@type': 'ProfilePage',
      name: metadata.title,
      description: metadata.description,
      url: `${SITE_URL}/about/`,
      mainEntity: buildPersonNode(),
    });

    // FAQPage 全站唯一輸出處（PRD §9.3）；SSOT 為 config/faq.ts。
    if (ABOUT_FAQS.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: ABOUT_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }
  }

  if (normalizedRoute === '/contact/') {
    graph.push({
      '@type': 'ContactPage',
      name: metadata.title,
      description: metadata.description,
      url: `${SITE_URL}/contact/`,
      about: { '@id': `${SITE_URL}/#organization` },
    });
  }

  return graph;
}

/**
 * Convert JSON-LD @graph nodes to a single script tag
 */
export function jsonLdToScriptTags(graph: JsonLdNode[]): string {
  if (graph.length === 0) {
    return '';
  }
  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}
