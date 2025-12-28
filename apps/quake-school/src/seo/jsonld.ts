/**
 * JSON-LD Structured Data Configuration
 * [fix:2025-12-29] 將 JSON-LD 從 SEOHelmet 移至 build-time 注入
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 *
 * 根據 vite-react-ssg 官方最佳實踐，JSON-LD 應該在 onPageRendered hook 中注入，
 * 而不是使用 <Head> 組件中的 <script> 標籤，因為後者不會在 SSG build 時渲染。
 */

const SITE_BASE_URL = 'https://app.haotool.org/quake-school/';
const ASSET_VERSION = 'v=20251229';

const DEFAULT_DESCRIPTION =
  '學習地震規模與震度的差異，透過互動動畫模擬與測驗掌握地震防災知識。規模看大小，震度看搖晃，掌握科學守護安全！';

const SOCIAL_LINKS = ['https://github.com/haotool/app', 'https://twitter.com/azlife_1224'];

const withAssetVersion = (url: string) =>
  url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;

const buildAssetUrl = (value: string) => {
  const absolute = value.startsWith('http') ? value : `${SITE_BASE_URL}${value.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
};

/**
 * 基礎 JSON-LD 結構化數據 (適用於所有頁面)
 */
export const BASE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '地震小學堂',
    alternateName: 'Earthquake Kids Studio',
    description: DEFAULT_DESCRIPTION,
    url: SITE_BASE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '地震規模互動模擬',
      '震度分級速查表',
      'P波S波視覺化',
      '板塊運動模擬',
      '地震知識測驗',
      'PWA 離線支援',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
    logo: buildAssetUrl('icons/icon-512x512.png'),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'haotool.org@gmail.com',
    },
    sameAs: SOCIAL_LINKS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '地震小學堂',
    url: SITE_BASE_URL,
    inLanguage: 'zh-TW',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_BASE_URL}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

/**
 * 頁面特定的 BreadcrumbList schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `${SITE_BASE_URL}${item.url.replace(/^\//, '')}`,
    })),
  };
}

/**
 * Quiz 頁面的 Quiz schema
 */
export function buildQuizSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: '地震知識測驗',
    description: '5 題精選地震知識考題，測試你對地震規模、震度、P波S波的了解程度',
    educationalLevel: '小學',
    about: {
      '@type': 'Thing',
      name: '地震科學',
    },
    hasPart: [
      {
        '@type': 'Question',
        name: '地震時，哪一種波會最先到達？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'P 波（縱波）速度最快，會先抵達地表。',
        },
      },
      {
        '@type': 'Question',
        name: '規模每增加 1.0，釋放的能量大約增加幾倍？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '約 32 倍',
        },
      },
    ],
  };
}

/**
 * EducationalOccupationalCredential for learning completion
 */
export function buildLearningSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: '地震小學堂完整課程',
    description: '涵蓋地震成因、P波S波、規模震度差異、深度影響等五大主題',
    educationalLevel: '小學至中學',
    learningResourceType: 'interactive resource',
    teaches: [
      '地震成因與板塊運動',
      'P波與S波的區別',
      '地震規模與震度的差異',
      '震源深度對搖晃的影響',
      '地震防災知識',
    ],
    inLanguage: 'zh-TW',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: 'haotool',
      url: 'https://haotool.org',
    },
  };
}

/**
 * ImageObject schema for OG images
 */
export function buildImageObjectSchema(imagePath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: buildAssetUrl(imagePath),
    width: 1200,
    height: 630,
    caption: '地震小學堂 - 互動式地震衛教網頁',
    inLanguage: 'zh-TW',
  };
}

/**
 * 根據路由生成完整的 JSON-LD 數據
 */
export function getJsonLdForRoute(route: string, _buildTime: string): Record<string, unknown>[] {
  const normalizedRoute = route.replace(/\/$/, '') || '/';

  // 基礎數據
  const jsonLd: Record<string, unknown>[] = [...BASE_JSON_LD];

  // 根據路由添加特定的 schema
  switch (normalizedRoute) {
    case '/':
    case '':
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]),
        buildLearningSchema(),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/quiz':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '知識測驗', url: `${SITE_BASE_URL}quiz/` },
        ]),
        buildQuizSchema(),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    default:
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]),
        buildImageObjectSchema('og-image.png'),
      );
  }

  return jsonLd;
}

/**
 * 將 JSON-LD 數據轉換為 HTML script 標籤
 */
export function jsonLdToScriptTags(jsonLd: Record<string, unknown>[]): string {
  return jsonLd
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n');
}
