/**
 * JSON-LD Structured Data for SEO
 * [context7:/google/structured-data:2025-12-14]
 */

const SITE_URL = 'https://haotool.org';
const APPS_HOST_URL = 'https://app.haotool.org';
const SITE_NAME = 'haotool.org';
const AUTHOR_NAME = '阿璋';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonLd = Record<string, any>;

/**
 * Route-specific metadata
 */
const ROUTE_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    breadcrumbs?: { name: string; url: string }[];
  }
> = {
  '/': {
    title: 'haotool.org — 阿璋的全端作品集',
    description:
      '「haotool」取自「好工具」的諧音。阿璋以 React 19、TypeScript、Vite 7 打造高品質數位工具，融合 3D 互動與動態設計，全部開源、免費。',
  },
  '/projects/': {
    title: '作品集 — haotool.org',
    description:
      '精選作品：RateWise 匯率計算機、日本名字產生器、停車好工具 ParkKeeper、地震知識小學堂。每個專案 Lighthouse 90+ 分，全部開源免費。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '作品集', url: '/projects/' },
    ],
  },
  '/about/': {
    title: '關於阿璋 — haotool.org',
    description:
      '我是阿璋，「haotool」取自「好工具」的諧音。專精 React 19、TypeScript、Vite、Tailwind CSS，追求 Lighthouse 滿分的開發哲學。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '關於', url: '/about/' },
    ],
  },
  '/contact/': {
    title: '聯繫阿璋 — haotool.org',
    description: '有專案想法或合作委託？歡迎透過 Email、GitHub 或 Threads 聯繫。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '聯繫', url: '/contact/' },
    ],
  },
};

/**
 * Normalize route to have trailing slash
 */
function normalizeRoute(route: string): string {
  if (route === '/') return '/';
  return route.endsWith('/') ? route : `${route}/`;
}

/**
 * Generate JSON-LD for a specific route
 */
export function getJsonLdForRoute(route: string, buildTime: string): JsonLd[] {
  const normalizedRoute = normalizeRoute(route);
  const metadata = ROUTE_METADATA[normalizedRoute] ?? ROUTE_METADATA['/'];
  if (!metadata) {
    return [];
  }
  const jsonLdArray: JsonLd[] = [];

  const personSchema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: [
      'https://github.com/azlife',
      'https://www.threads.net/@azlife_1224',
      'https://github.com/haotool',
    ],
    jobTitle: '全端工程師',
    description:
      '專注於 React 19、TypeScript、Vite、Tailwind CSS 開發，打造高效能 Web 應用與互動體驗。',
    knowsAbout: ['React', 'TypeScript', 'Vite', 'PWA', 'Tailwind CSS', 'Three.js'],
  };

  if (normalizedRoute === '/') {
    // Organization
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/og-image.png`,
      founder: { '@id': `${SITE_URL}/#person` },
      sameAs: ['https://github.com/haotool', 'https://www.threads.net/@azlife_1224'],
    });

    // WebSite with SearchAction
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ['haotool', '好工具', '阿璋作品集'],
      url: SITE_URL,
      description: metadata.description,
      inLanguage: 'zh-TW',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/projects/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    });

    jsonLdArray.push(personSchema);

    // FAQPage
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'haotool.org 是什麼？有哪些好用的工具？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'haotool.org 是阿璋的全端作品集，「haotool」取自「好工具」的諧音。主要作品包括：RateWise 即時匯率計算機（支援 30+ 幣別、30 天歷史圖表）、日本名字產生器（100+ 漢姓對照）、停車好工具 ParkKeeper（GPS 停車記錄與導航）、地震知識小學堂（互動式防災教育）。全部免費開源，Lighthouse 90+ 分。',
          },
        },
        {
          '@type': 'Question',
          name: 'haotool 的名字由來？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '「HAO」是中文「好」的拼音。haotool 的核心理念是打造真正的「好工具」——每個數位產品不僅要有功能，更要在使用過程中帶來愉悅感。',
          },
        },
        {
          '@type': 'Question',
          name: 'haotool 使用什麼技術？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '主要技術棧：React 19、TypeScript、Vite 7、Tailwind CSS、Framer Motion、Three.js。採用 SSG 預渲染、PWA 離線支援、Workbox 快取策略，追求 Lighthouse 90+ 分的效能表現。',
          },
        },
        {
          '@type': 'Question',
          name: '阿璋接受合作委託嗎？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '是的，目前開放承接 Web 前端開發、React 應用架構、PWA 設計、3D 互動網頁等技術委託。歡迎透過 Email（haotool.org@gmail.com）、GitHub 或 Threads 聯繫，通常 24 小時內回覆。',
          },
        },
      ],
    });
  }

  // WebPage for all pages
  const webPageJsonLd: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}${normalizedRoute}`,
    inLanguage: 'zh-TW',
    datePublished: '2025-01-01T00:00:00Z',
    dateModified: buildTime,
    author: { '@id': `${SITE_URL}/#person` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  if (metadata.breadcrumbs && metadata.breadcrumbs.length > 0) {
    webPageJsonLd['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.url}`,
      })),
    };
  }

  jsonLdArray.push(webPageJsonLd);

  // CollectionPage for projects
  if (normalizedRoute === '/projects/') {
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '精選作品',
      description: metadata.description,
      url: `${SITE_URL}/projects/`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'RateWise 匯率計算機',
            url: `${APPS_HOST_URL}/ratewise/`,
            description: '即時匯率換算工具，整合台灣銀行牌告匯率與 30 天歷史數據視覺化。',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '日本名字產生器',
            url: `${APPS_HOST_URL}/nihonname/`,
            description: '輸入中文姓氏，瞬間產生道地日文名字與諧音梗，支援 100+ 漢姓對照。',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: '停車好工具 ParkKeeper',
            url: `${APPS_HOST_URL}/park-keeper/`,
            description: '台灣最好用的免費停車記錄 App，支援 GPS 定位、羅盤導航、離線使用。',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: '地震知識小學堂',
            url: `${APPS_HOST_URL}/quake-school/`,
            description: '互動式地震衛教平台，18 道測驗題搭配 SVG 動畫深入淺出講解地震科學。',
          },
        ],
      },
    });
  }

  // ProfilePage for about
  if (normalizedRoute === '/about/') {
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: metadata.title,
      description: metadata.description,
      url: `${SITE_URL}/about/`,
      mainEntity: personSchema,
    });
  }

  return jsonLdArray;
}

/**
 * Convert JSON-LD array to script tags
 */
export function jsonLdToScriptTags(jsonLdArray: JsonLd[]): string {
  return jsonLdArray
    .map((jsonLd) => `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`)
    .join('\n');
}
