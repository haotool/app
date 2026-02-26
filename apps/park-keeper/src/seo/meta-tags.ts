import { SITE_CONFIG } from '../../app.config.mjs';

const BASE_URL = SITE_CONFIG.url.replace(/\/$/, '');

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
}

const ROUTE_META: Record<string, PageMeta> = {
  '/': {
    title: '停車好工具 — 台灣最好用的免費停車記錄與導航 App',
    description:
      '台灣最好用的停車工具！免費記錄車牌、樓層、GPS 座標與照片，羅盤導航秒找愛車。PWA 離線可用、零註冊、完全隱私。超過 170+ 停車場實測，支援繁中/英/日三語。',
    keywords:
      '台灣停車工具,停車好工具,停車記錄app,找車app,停車位記錄,GPS停車導航,羅盤找車,停車場,車牌記錄,PWA停車,離線停車app,park keeper,免費停車app,台灣停車app推薦',
  },
  '/about/': {
    title: '關於停車好工具 — 台灣免費智慧停車記錄 PWA',
    description:
      '停車好工具由 haotool.org 出品，是台灣最受歡迎的免費停車記錄 PWA。GPS 定位、羅盤導航、離線使用、零資料收集。了解功能特色與隱私政策。',
    keywords:
      '停車好工具,台灣停車app,haotool,park keeper,PWA停車工具,免費停車記錄,停車導航app,隱私停車app',
  },
  '/settings/': {
    title: '設定 — 停車好工具 | 主題與語言自訂',
    description:
      '自訂停車好工具的介面主題與語言。Zen、Nitro、Kawaii、Classic 四種風格，支援繁中、英文、日文切換。',
    keywords: '停車好工具設定,停車app主題,停車工具語言,PWA設定',
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
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Hreflang -->
    <link rel="alternate" hreflang="zh-TW" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:alt" content="停車好工具 — 台灣最好用的免費停車記錄與導航 PWA" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:site_name" content="停車好工具" />
    <meta property="og:updated_time" content="${buildTime}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta name="twitter:image:alt" content="停車好工具 — 台灣最好用的免費停車記錄與導航 PWA" />

    <!-- Build Info -->
    <meta name="build-time" content="${buildTime}" />
  `;
}
