/**
 * JSON-LD Structured Data for SEO（@graph 單一 script，PRD §9.3）
 * - 首頁：Organization + WebSite（SearchAction → /tools/?q=）+ Person
 * - 全頁：WebPage（dateModified = BUILD_TIME，禁止寫死日期）＋非首頁 BreadcrumbList
 * - /tools/：CollectionPage + ItemList（5 工具，SSOT 為 config/tools.ts）
 * - /about/：ProfilePage；FAQPage 掛點（全站唯一），內容終稿後補
 */
import { APP_INFO, AUTHOR_PERSON, SEO_SOCIAL_LINKS } from '../config/app-info';
import { TOOLS, getToolUrl } from '../config/tools';

const SITE_URL = APP_INFO.siteUrl.replace(/\/$/, '');
const SITE_NAME = APP_INFO.name;
const DATE_PUBLISHED = '2025-01-01T00:00:00Z';

type JsonLdNode = Record<string, unknown>;

/**
 * About 頁 FAQ SSOT 掛點 — 內容定稿後填入，FAQPage 即自動輸出於 /about/（全站唯一）。
 */
export const ABOUT_FAQ_ITEMS: readonly { question: string; answer: string }[] = [];

interface RouteJsonLdMetadata {
  title: string;
  description: string;
  breadcrumbs?: { name: string; url: string }[];
}

const ROUTE_METADATA: Record<string, RouteJsonLdMetadata> = {
  '/': {
    title: `${SITE_NAME} — 免費開源的台灣網頁工具集`,
    description:
      'HaoTool 好工具：免費、開源、不收集個資的台灣網頁工具集。匯率換算、旅遊分帳、停車記錄、日本名字產生、地震防災教育。',
  },
  '/tools/': {
    title: `所有工具 — ${SITE_NAME}`,
    description:
      'HaoTool 全部工具總覽：HaoRate 匯率好工具、喵喵分帳、停車好工具 ParkKeeper、日本名字產生器、地震知識小學堂。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '工具', url: '/tools/' },
    ],
  },
  '/about/': {
    title: `關於 ${APP_INFO.shortName} 與${APP_INFO.author} — ${SITE_NAME}`,
    description:
      '「HAO」取自「好」的拼音，HaoTool 的核心理念是打造真正的好工具。認識作者阿璋的開發哲學與本站隱私承諾。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '關於', url: '/about/' },
    ],
  },
  '/contact/': {
    title: `聯繫${APP_INFO.author} — ${SITE_NAME}`,
    description: '有專案想法或合作委託？歡迎透過 Email、GitHub 或 Threads 聯繫，24 小時內回覆。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '聯繫', url: '/contact/' },
    ],
  },
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
    knowsAbout: ['React', 'TypeScript', 'Vite', 'PWA', 'Tailwind CSS', 'Cloudflare'],
  };
}

/**
 * Generate JSON-LD @graph nodes for a specific route
 */
export function getJsonLdForRoute(route: string, buildTime: string): JsonLdNode[] {
  const normalizedRoute = normalizeRoute(route);
  const metadata = ROUTE_METADATA[normalizedRoute];
  // 未知路由（含 /404/）不輸出結構化資料
  if (!metadata) {
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
      founder: { '@id': `${SITE_URL}/#person` },
      sameAs: SEO_SOCIAL_LINKS,
    });

    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: [APP_INFO.shortName, APP_INFO.subtitle],
      url: `${SITE_URL}/`,
      description: metadata.description,
      inLanguage: 'zh-TW',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/tools/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
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

  if (metadata.breadcrumbs && metadata.breadcrumbs.length > 0) {
    webPageNode['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
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

    // FAQPage 全站唯一輸出處（PRD §9.3 + brief §3.1 修正）；items 為空時不輸出。
    if (ABOUT_FAQ_ITEMS.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: ABOUT_FAQ_ITEMS.map((item) => ({
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
