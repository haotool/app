import { SITE_CONFIG } from '../../app.config.mjs';

const BASE_URL = SITE_CONFIG.url.replace(/\/$/, '');

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
}

const ROUTE_META: Record<string, PageMeta> = {
  '/': {
    title: '停車好工具 | 智慧停車記錄與導航 PWA',
    description:
      '免費停車位置記錄工具。記錄車牌、樓層、GPS 座標與照片，透過羅盤導航快速找回愛車。支援離線使用、多主題與多語言。',
    keywords: '停車記錄,停車位,找車,GPS導航,羅盤,停車場,車牌,PWA,離線,park keeper',
  },
  '/about/': {
    title: '關於停車好工具 | About ParkKeeper',
    description:
      '了解停車好工具的功能特色與開發理念。由 haotool.org 出品的免費智慧停車記錄 PWA 應用。',
    keywords: '停車好工具,關於,haotool,park keeper,PWA',
  },
  '/settings/': {
    title: '設定 | 停車好工具',
    description:
      '自訂停車好工具的介面主題、語言與快取設定。支援 Zen、Nitro、Kawaii、Classic 四種風格。',
    keywords: '停車好工具,設定,主題,語言,快取',
  },
};

export function getMetaTagsForRoute(route: string, buildTime: string): string {
  const normalized = route === '/' ? '/' : route.replace(/\/?$/, '/');
  const meta = ROUTE_META[normalized] ?? ROUTE_META['/'];
  if (!meta) throw new Error('Route meta not found');
  const canonicalUrl = normalized === '/' ? `${BASE_URL}/` : `${BASE_URL}${normalized}`;
  const ogImageUrl = `${BASE_URL}/og-image.svg`;

  return `
    <!-- SEO Meta Tags -->
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta name="keywords" content="${meta.keywords}" />
    <meta name="author" content="阿璋 (Ah Zhang)" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:site_name" content="停車好工具" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${ogImageUrl}" />

    <!-- Build Info -->
    <meta name="build-time" content="${buildTime}" />
  `;
}
