/**
 * JSON-LD Structured Data Configuration
 * [fix:2025-12-06] 將 JSON-LD 從 SEOHelmet 移至 build-time 注入
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
 *
 * 根據 vite-react-ssg 官方最佳實踐，JSON-LD 應該在 onPageRendered hook 中注入，
 * 而不是使用 <Head> 組件中的 <script> 標籤，因為後者不會在 SSG build 時渲染。
 */

const SITE_BASE_URL = 'https://app.haotool.org/nihonname/';

const DEFAULT_DESCRIPTION =
  '探索1940年代台灣皇民化運動的歷史改姓對照。輸入你的姓氏，發現日治時期的日式姓名與趣味諧音名。基於歷史文獻《内地式改姓名の仕方》。';

const SOCIAL_LINKS = [
  'https://github.com/haotool/app',
  'https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF0K8pg5PLpzoBz7nnYMEI2CdxVzs2pUyIJHabwZWeYCw',
  'https://twitter.com/azlife_1224',
];

/**
 * 基礎 JSON-LD 結構化數據 (適用於所有頁面)
 */
export const BASE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NihonName 皇民化改姓生成器',
    alternateName: '日式姓名生成器',
    description: DEFAULT_DESCRIPTION,
    url: SITE_BASE_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '皇民化改姓查詢',
      '歷史姓氏對照',
      '趣味諧音日本名',
      '族譜來源查證',
      'PWA 離線支援',
      '300+ 姓氏資料庫',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
    logo: `${SITE_BASE_URL}icons/icon-512x512.png`,
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
    name: 'NihonName',
    url: SITE_BASE_URL,
    inLanguage: 'zh-TW',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_BASE_URL}?surname={search_term_string}`,
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
 * FAQ 頁面的 FAQPage schema
 */
export interface FAQEntry {
  question: string;
  answer: string;
}

export function buildFaqSchema(faq: FAQEntry[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    url,
  };
}

/**
 * 歷史專區頁面的 Article schema
 */
export interface ArticleData {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
}

export function buildArticleSchema(article: ArticleData, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    url,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Organization',
      name: 'haotool',
      url: 'https://haotool.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'haotool',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_BASE_URL}icons/icon-512x512.png`,
      },
    },
    keywords: article.keywords,
    inLanguage: 'zh-TW',
  };
}

/**
 * HowTo schema for Guide page
 */
export function buildHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '如何使用皇民化改姓生成器',
    description: '學習如何使用 NihonName 查詢日治時期的日式姓名對照',
    step: [
      {
        '@type': 'HowToStep',
        name: '輸入姓氏',
        text: '在輸入框中輸入你的中文姓氏（支援單姓與複姓）',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: '點擊查詢',
        text: '點擊「改名実行」按鈕開始查詢',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: '查看結果',
        text: '系統會顯示對應的日式姓名、羅馬拼音和歷史來源',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: '分享結果',
        text: '可以使用截圖模式分享你的日式姓名',
        position: 4,
      },
    ],
    totalTime: 'PT1M',
  };
}

/**
 * 根據路由生成完整的 JSON-LD 數據
 */
export function getJsonLdForRoute(route: string, buildTime: string): Record<string, unknown>[] {
  const normalizedRoute = route.replace(/\/$/, '') || '/';
  const fullUrl = `${SITE_BASE_URL}${normalizedRoute.replace(/^\//, '')}`;

  // 基礎數據
  const jsonLd: Record<string, unknown>[] = [...BASE_JSON_LD];

  // 根據路由添加特定的 schema
  switch (normalizedRoute) {
    case '/':
    case '':
      jsonLd.push(buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]));
      break;

    case '/about':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '關於', url: `${SITE_BASE_URL}about` },
        ]),
      );
      break;

    case '/guide':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '使用指南', url: `${SITE_BASE_URL}guide` },
        ]),
        buildHowToSchema(),
      );
      break;

    case '/faq':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '常見問題', url: `${SITE_BASE_URL}faq` },
        ]),
      );
      // FAQ 內容在頁面組件中定義，這裡只添加基礎 breadcrumb
      break;

    case '/history':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
        ]),
        buildArticleSchema(
          {
            headline: '台灣歷史專區 - 皇民化運動與改姓歷史',
            description: '深入了解台灣日治時期的皇民化運動、馬關條約、舊金山和約等重要歷史事件',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['皇民化運動', '馬關條約', '舊金山和約', '台灣歷史', '日治時期'],
          },
          fullUrl,
        ),
      );
      break;

    case '/history/kominka':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '皇民化運動', url: `${SITE_BASE_URL}history/kominka` },
        ]),
        buildArticleSchema(
          {
            headline: '皇民化運動 - 1937-1945 台灣同化政策',
            description: '詳細介紹日本殖民時期對台灣實施的皇民化運動，包括改姓名、國語運動等政策',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['皇民化運動', '改姓名運動', '國語運動', '台灣日治時期', '1940年代'],
          },
          fullUrl,
        ),
      );
      break;

    case '/history/shimonoseki':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '馬關條約', url: `${SITE_BASE_URL}history/shimonoseki` },
        ]),
        buildArticleSchema(
          {
            headline: '馬關條約 - 1895 台灣割讓日本',
            description: '介紹甲午戰爭後簽訂的馬關條約，以及台灣被割讓給日本的歷史背景',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['馬關條約', '甲午戰爭', '台灣割讓', '1895年', '清日戰爭'],
          },
          fullUrl,
        ),
      );
      break;

    case '/history/san-francisco':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '舊金山和約', url: `${SITE_BASE_URL}history/san-francisco` },
        ]),
        buildArticleSchema(
          {
            headline: '舊金山和約 - 1951 台灣主權歸屬',
            description: '介紹二戰後簽訂的舊金山和約，以及台灣主權歸屬的國際法爭議',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['舊金山和約', '台灣主權', '二戰後', '1951年', '國際法'],
          },
          fullUrl,
        ),
      );
      break;

    default:
      // 未知路由使用預設 breadcrumb
      jsonLd.push(buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]));
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
