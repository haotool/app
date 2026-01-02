/**
 * JSON-LD Structured Data for SEO
 * [context7:/google/structured-data:2025-12-14]
 */

const SITE_URL = 'https://app.haotool.org';
const SITE_NAME = 'haotool.org';
const AUTHOR_NAME = '阿璋';

interface JsonLdBase {
  '@context': 'https://schema.org';
  '@type': string;
}

interface WebSiteJsonLd extends JsonLdBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  inLanguage: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
}

interface PersonJsonLd extends JsonLdBase {
  '@type': 'Person';
  name: string;
  url: string;
  sameAs: string[];
  jobTitle: string;
  description: string;
}

interface WebPageJsonLd extends JsonLdBase {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  dateModified: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
  breadcrumb?: BreadcrumbListJsonLd;
}

interface BreadcrumbListJsonLd extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

interface CollectionPageJsonLd extends JsonLdBase {
  '@type': 'CollectionPage';
  name: string;
  description: string;
  url: string;
  mainEntity: {
    '@type': 'ItemList';
    itemListElement: {
      '@type': 'ListItem';
      position: number;
      name: string;
      url: string;
      description?: string;
    }[];
  };
}

interface ProfilePageJsonLd extends JsonLdBase {
  '@type': 'ProfilePage';
  name: string;
  description: string;
  url: string;
  mainEntity: PersonJsonLd;
}

type JsonLd =
  | WebSiteJsonLd
  | PersonJsonLd
  | WebPageJsonLd
  | BreadcrumbListJsonLd
  | CollectionPageJsonLd
  | ProfilePageJsonLd;

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
    title: 'haotool.org | 阿璋的作品集',
    description:
      '嗨，我是阿璋。「haotool」取自「好工具」的諧音，代表每個作品都必須實用又優雅。融合現代 Web 技術與動態設計，打造令人過目不忘的使用者體驗。',
  },
  '/projects/': {
    title: '作品集 | haotool.org',
    description:
      '精選作品展示：日本名字產生器、RateWise 匯率計算機等。每個專案都傾注對細節的執著。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '作品集', url: '/projects/' },
    ],
  },
  '/about/': {
    title: '關於阿璋 | haotool.org',
    description:
      '我是阿璋，「haotool」取自「好工具」的諧音，也延伸自我名字的 HAO 音節，代表我對產出的堅持：它必須是個好工具。',
    breadcrumbs: [
      { name: '首頁', url: '/' },
      { name: '關於', url: '/about/' },
    ],
  },
  '/contact/': {
    title: '聯繫 | haotool.org',
    description: '有問題或想法想討論？歡迎透過 Email、GitHub 或 Threads 與我聯繫。',
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

  // Person schema (used on multiple pages)
  const personSchema: PersonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: ['https://github.com/azlife', 'https://www.threads.net/@azlife_1224'],
    jobTitle: '全端工程師',
    description: '專注於 React, TypeScript, Tailwind CSS 開發，打造高效能 Web 應用。',
  };

  // Always include WebSite schema on home page
  if (normalizedRoute === '/') {
    const websiteJsonLd: WebSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: metadata.description,
      inLanguage: 'zh-TW',
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
        url: SITE_URL,
      },
    };
    jsonLdArray.push(websiteJsonLd);

    // Add Person schema on home page
    jsonLdArray.push(personSchema);
  }

  // Add WebPage schema for all pages
  const webPageJsonLd: WebPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}${normalizedRoute}`,
    inLanguage: 'zh-TW',
    dateModified: buildTime,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  // Add breadcrumbs if available
  if (metadata.breadcrumbs && metadata.breadcrumbs.length > 0) {
    const breadcrumbJsonLd: BreadcrumbListJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem' as const,
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.url}`,
      })),
    };
    webPageJsonLd.breadcrumb = breadcrumbJsonLd;
  }

  jsonLdArray.push(webPageJsonLd);

  // Add CollectionPage schema for projects page
  if (normalizedRoute === '/projects/') {
    const collectionJsonLd: CollectionPageJsonLd = {
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
            name: '日本名字產生器',
            url: `${SITE_URL}/nihonname/`,
            description: '輸入中文姓氏，產生道地日文名字與諧音梗。',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'RateWise 匯率計算機',
            url: `${SITE_URL}/ratewise/`,
            description: '即時匯率換算工具，整合 30 天歷史數據視覺化。',
          },
        ],
      },
    };
    jsonLdArray.push(collectionJsonLd);
  }

  // Add ProfilePage schema for about page
  if (normalizedRoute === '/about/') {
    const profileJsonLd: ProfilePageJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: metadata.title,
      description: metadata.description,
      url: `${SITE_URL}/about/`,
      mainEntity: personSchema,
    };
    jsonLdArray.push(profileJsonLd);
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
