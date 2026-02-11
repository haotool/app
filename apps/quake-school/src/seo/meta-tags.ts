/**
 * 地震知識小學堂 - SEO Meta Tags 配置
 * [2025 SEO 最佳實踐]
 */

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

const SITE_URL = 'https://app.haotool.org/quake-school/';
const DEFAULT_OG_IMAGE = new URL('og-image.svg', SITE_URL).toString();

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: '地震知識小學堂 | 互動式地震衛教科學 - 防災教育',
    description:
      '透過互動式教學了解地震科學知識。規模看大小，震度看搖晃，掌握科學，守護安全！學習板塊運動、地震波、防災知識，成為地震防災達人。完全免費、適合各年齡層。',
    keywords: '地震, 地震教育, 地震知識, 防災教育, 震度, 規模, 地震波, P波, S波',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/lessons': {
    title: '課程學習 | 地震知識小學堂',
    description:
      '學習地震成因、地震波、規模與震度等核心知識。透過互動模擬深入了解地震科學，掌握板塊運動、斷層活動與地震波傳播原理，成為地震科學達人。',
    keywords: '地震課程, 地震學習, 地震模擬, 地震成因, 板塊運動, 斷層',
  },
  '/quiz': {
    title: '知識測驗 | 地震知識小學堂',
    description:
      '測試你的地震知識！5題精選考題，幫助鞏固正確觀念，成為地震防災小達人。測驗內容涵蓋規模、震度、地震波、防災措施，快來挑戰看看你對地震了解多少！',
    keywords: '地震測驗, 地震問答, 防災測驗, 地震考試',
  },
  '/about': {
    title: '關於 | 地震知識小學堂',
    description:
      '地震知識小學堂是一個專為行動裝置設計的互動式地震衛教應用程式，幫助大眾了解地震科學知識。內容涵蓋規模與震度的差異、地震波種類、板塊運動與防災知識，完全免費使用。',
    keywords: '地震知識小學堂, 關於, 地震教育應用',
  },
};

/**
 * 取得特定路由的 Meta Tags HTML
 */
export function getMetaTagsForRoute(route: string, buildTime: string): string {
  const normalizedRoute = route === '' ? '/' : route.replace(/\/$/, '') || '/';
  const meta = PAGE_META[normalizedRoute] ?? PAGE_META['/'];
  if (!meta) {
    throw new Error(`No meta data found for route: ${normalizedRoute}`);
  }
  const canonicalPath = normalizedRoute === '/' ? '' : `${normalizedRoute.replace(/^\//, '')}/`;
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();

  return `
    <!-- Primary Meta Tags -->
    <title>${meta.title}</title>
    <meta name="title" content="${meta.title}" />
    <meta name="description" content="${meta.description}" />
    <meta name="keywords" content="${meta.keywords}" />
    <meta name="author" content="haotool.org" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.ogImage ?? DEFAULT_OG_IMAGE}" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:site_name" content="地震知識小學堂" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${meta.ogImage ?? DEFAULT_OG_IMAGE}" />

    <!-- Additional SEO -->
    <meta name="generator" content="Vite React SSG" />
    <meta name="build-time" content="${buildTime}" />
    <link rel="alternate" hreflang="zh-TW" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />
  `;
}

export { PAGE_META, SITE_URL };
