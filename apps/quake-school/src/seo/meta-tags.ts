/**
 * Meta Tags Generation for SSG
 * [fix:2025-12-29] 在 vite-react-ssg build 時手動注入 meta tags
 *
 * 根因：vite-react-ssg 的 Head 組件在 SSG 時不會序列化 meta tags 到 HTML
 * 解法：使用 onPageRendered hook 手動注入所有 SEO meta tags
 *
 * @see vite.config.ts onPageRendered hook
 */

const SITE_BASE_URL = 'https://app.haotool.org/quake-school/';
const ASSET_VERSION = 'v=20251229';
const DEFAULT_TITLE = '地震小學堂 | 互動式地震衛教網頁';
const DEFAULT_DESCRIPTION =
  '學習地震規模與震度的差異，透過互動動畫模擬與測驗掌握地震防災知識。規模看大小，震度看搖晃，掌握科學守護安全！';
const DEFAULT_OG_IMAGE = 'og-image.png';

interface MetaTagsConfig {
  route: string;
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string[];
  updatedTime?: string;
}

/**
 * 根據路由生成對應的 meta tags
 */
export function getMetaTagsForRoute(route: string, buildTime: string): string {
  const config = getRouteConfig(route, buildTime);
  return buildMetaTags(config);
}

/**
 * 根據路由路徑獲取配置
 */
function getRouteConfig(route: string, buildTime: string): MetaTagsConfig {
  const baseConfig: MetaTagsConfig = {
    route,
    description: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    updatedTime: buildTime,
  };

  const normalizedRoute = route.replace(/\/$/, '') || '/';

  switch (normalizedRoute) {
    case '/':
      return {
        ...baseConfig,
        title: DEFAULT_TITLE,
        keywords: [
          '地震教育',
          '地震規模',
          '地震震度',
          '防災知識',
          '地震模擬',
          '地震測驗',
          '台灣地震',
          '地震科普',
          '地震動畫',
          '地震學習',
        ],
      };

    case '/quiz':
      return {
        ...baseConfig,
        title: '地震知識測驗 | 地震小學堂',
        description:
          '5 題精選地震知識考題，測試你對地震規模、震度、P波S波的了解程度，成為地震防災小達人！',
        keywords: [
          '地震測驗',
          '地震考試',
          '防災知識測驗',
          '地震教育',
          'P波S波',
          '地震規模測驗',
          '震度測驗',
        ],
      };

    default:
      return {
        ...baseConfig,
        title: DEFAULT_TITLE,
      };
  }
}

const withAssetVersion = (url: string) =>
  url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;

const buildAssetUrl = (value: string) => {
  const absolute = value.startsWith('http') ? value : `${SITE_BASE_URL}${value.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
};

/**
 * 構建完整的 meta tags HTML
 */
function buildMetaTags(config: MetaTagsConfig): string {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    keywords = [],
    updatedTime,
  } = config;

  const fullTitle = title ?? DEFAULT_TITLE;
  const canonicalUrl = buildCanonical(config.route);
  const ogImageUrl = buildAssetUrl(ogImage);

  const defaultKeywords = [
    '地震教育',
    '地震規模',
    '地震震度',
    '防災知識',
    '地震模擬',
    '地震測驗',
    '台灣地震',
    '地震科普',
    'P波S波',
    '地震波',
    '震央深度',
    '地震防災',
  ];

  const keywordsContent = (keywords.length > 0 ? keywords : defaultKeywords).join(', ');

  const metaTags = [
    // Primary Meta Tags
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="keywords" content="${escapeHtml(keywordsContent)}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
    '<meta name="author" content="haotool" />',
    '<meta name="generator" content="QuakeSchool" />',
    '<meta name="application-name" content="地震小學堂" />',

    // Canonical & Alternates
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<link rel="alternate" hrefLang="x-default" href="${SITE_BASE_URL}" />`,
    `<link rel="alternate" hrefLang="zh-TW" href="${SITE_BASE_URL}" />`,

    // Open Graph / Facebook
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${ogImageUrl}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="地震小學堂 - 互動式地震衛教網頁" />',
    '<meta property="og:locale" content="zh_TW" />',
    '<meta property="og:site_name" content="地震小學堂" />',
  ];

  if (updatedTime) {
    metaTags.push(`<meta property="og:updated_time" content="${updatedTime}" />`);
  }

  // Twitter
  metaTags.push(
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:site" content="@azlife_1224" />',
    '<meta name="twitter:creator" content="@azlife_1224" />',
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${ogImageUrl}" />`,
    '<meta name="twitter:image:alt" content="地震小學堂 - 互動式地震衛教網頁" />',
  );

  return metaTags.join('\n    ');
}

/**
 * Build canonical URL with proper path normalization
 * [SEO:2025-12-29] 確保尾斜線一致性
 */
function buildCanonical(path: string): string {
  if (!path || path === '/') return SITE_BASE_URL;

  // Normalize path: ensure trailing slash for consistency
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.endsWith('/') && !normalizedPath.includes('.')) {
    normalizedPath = `${normalizedPath}/`;
  }

  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}
