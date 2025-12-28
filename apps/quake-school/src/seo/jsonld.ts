/**
 * 地震知識小學堂 - JSON-LD 結構化數據
 * [2025 SEO 最佳實踐 - Schema.org]
 */

interface JsonLdData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

const SITE_URL = 'https://app.haotool.org/quake-school';

/**
 * Organization Schema
 */
const organizationSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'haotool.org',
  url: 'https://haotool.org',
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  sameAs: ['https://github.com/haotool'],
};

/**
 * WebApplication Schema
 */
const webApplicationSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '地震知識小學堂',
  alternateName: 'Quake School',
  description: '互動式地震衛教網頁應用程式。透過分級教學、互動模擬和測驗，幫助您了解地震科學知識。',
  url: SITE_URL,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TWD',
  },
  author: {
    '@type': 'Organization',
    name: 'haotool.org',
  },
  inLanguage: 'zh-TW',
};

/**
 * Course Schema for lessons page
 */
const courseSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: '地震科學基礎課程',
  description: '學習地震成因、地震波、規模與震度等核心知識',
  provider: {
    '@type': 'Organization',
    name: 'haotool.org',
  },
  courseCode: 'QUAKE-101',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    inLanguage: 'zh-TW',
  },
};

/**
 * Quiz Schema
 */
const quizSchema: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'Quiz',
  name: '地震知識測驗',
  description: '5題精選考題，測試你的地震知識',
  about: {
    '@type': 'Thing',
    name: '地震科學',
  },
  educationalLevel: '初級',
  numberOfQuestions: 5,
};

/**
 * 取得特定路由的 JSON-LD 數據
 */
export function getJsonLdForRoute(route: string, _buildTime: string): JsonLdData[] {
  const normalizedRoute = route === '' ? '/' : route.replace(/\/$/, '') || '/';

  switch (normalizedRoute) {
    case '/':
      return [organizationSchema, webApplicationSchema];
    case '/lessons':
      return [organizationSchema, courseSchema];
    case '/quiz':
      return [organizationSchema, quizSchema];
    case '/about':
      return [organizationSchema, webApplicationSchema];
    default:
      return [organizationSchema];
  }
}

/**
 * 將 JSON-LD 數據轉換為 script 標籤
 */
export function jsonLdToScriptTags(jsonLdArray: JsonLdData[]): string {
  return jsonLdArray
    .map(
      (jsonLd) => `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 0)}</script>`,
    )
    .join('\n');
}

export { organizationSchema, webApplicationSchema, courseSchema, quizSchema };
