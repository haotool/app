/**
 * Meta Tags Generation for SSG
 * [fix:2025-12-06] 在 vite-react-ssg build 時手動注入 meta tags
 *
 * 根因：vite-react-ssg 的 Head 組件在 SSG 時不會序列化 meta tags 到 HTML
 * 解法：使用 onPageRendered hook 手動注入所有 SEO meta tags
 *
 * @see vite.config.ts onPageRendered hook
 */

const SITE_BASE_URL = 'https://app.haotool.org/nihonname/';
const ASSET_VERSION = 'v=20251208';
const DEFAULT_TITLE = 'NihonName 皇民化改姓生成器 | 1940年代台灣日式姓名產生器';
const DEFAULT_DESCRIPTION =
  '探索1940年代台灣皇民化運動的歷史改姓對照。輸入你的姓氏，發現日治時期的日式姓名與趣味諧音名。基於歷史文獻《内地式改姓名の仕方》，以正確的歷史視角重現台灣日治時代的改姓政策。完全免費、開源。';
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

  switch (route) {
    case '/':
      return {
        ...baseConfig,
        title: DEFAULT_TITLE,
      };

    case '/about':
      return {
        ...baseConfig,
        title: '關於本站',
        description:
          '探索 NihonName 的開發故事、歷史資料來源與技術架構。了解台灣皇民化運動改姓政策的歷史脈絡，以及我們如何透過現代科技重現這段歷史記憶。',
        keywords: ['關於 NihonName', '台灣歷史', '皇民化運動', '歷史資料', '開放資料'],
      };

    case '/guide':
      return {
        ...baseConfig,
        title: '使用說明',
        description:
          '學習如何使用 NihonName 生成日式姓名，了解皇民化改姓規則，以及如何驗證歷史資料來源。完整的操作指南與常見問題解答。',
        keywords: ['使用說明', '操作指南', '日式改名規則', '皇民化改姓', '歷史文獻'],
      };

    case '/faq':
      return {
        ...baseConfig,
        title: '常見問題',
        description:
          '關於 NihonName 的常見問題解答。了解皇民化運動歷史、改姓規則、資料來源與隱私政策。快速找到您需要的答案。',
        keywords: ['常見問題', 'FAQ', '皇民化改姓', '日治時期', '台灣歷史', '姓氏對照'],
      };

    case '/history':
      return {
        ...baseConfig,
        title: '歷史專區',
        description:
          '深入了解 1940 年代台灣皇民化運動的歷史脈絡，探索馬關條約、舊金山和約對台灣地位的影響，以及日治時期改姓政策的演變。',
        keywords: ['台灣歷史', '皇民化運動', '馬關條約', '舊金山和約', '日治時期', '改姓政策'],
        ogType: 'article',
      };

    case '/history/kominka':
      return {
        ...baseConfig,
        title: '皇民化運動 (1937-1945)',
        description:
          '1937-1945 年間的台灣皇民化運動：日本殖民政府推行的同化政策，包含改日本姓名、講日語、信奉神道教等措施。探索這段影響深遠的歷史。',
        keywords: ['皇民化運動', '台灣日治時期', '改日本名', '同化政策', '1937-1945', '神社參拜'],
        ogType: 'article',
      };

    case '/history/shimonoseki':
      return {
        ...baseConfig,
        title: '馬關條約 (1895)',
        description:
          '1895 年馬關條約：甲午戰爭後清廷割讓台灣給日本，開啟長達 50 年的日治時期。了解這份改變台灣命運的條約內容與歷史影響。',
        keywords: ['馬關條約', '下關條約', '甲午戰爭', '台灣割讓', '1895', '日治時期開始'],
        ogType: 'article',
      };

    case '/history/san-francisco':
      return {
        ...baseConfig,
        title: '舊金山和約 (1951)',
        description:
          '1951 年舊金山和約：二戰後日本放棄台灣主權，但未明確指定歸屬，形成「台灣地位未定論」。探索這份影響台灣國際地位至今的條約。',
        keywords: ['舊金山和約', '對日和約', '台灣地位', '二戰後', '1951', '國際法'],
        ogType: 'article',
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
    '皇民化改姓',
    '日式姓名生成器',
    '台灣日治時期',
    '改姓對照表',
    '日本姓名',
    '1940年代台灣',
    '皇民化運動',
    'NihonName',
    '日式改名',
    '台灣歷史',
    '內地式改姓',
    '日式姓氏',
    '諧音日本名',
    '日治時期戶籍',
    '台灣姓氏',
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
    '<meta name="generator" content="NihonName" />',
    '<meta name="application-name" content="NihonName" />',

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
    '<meta property="og:image:alt" content="NihonName 皇民化改姓生成器" />',
    '<meta property="og:locale" content="zh_TW" />',
    '<meta property="og:site_name" content="NihonName" />',
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
    '<meta name="twitter:image:alt" content="NihonName 皇民化改姓生成器" />',
  );

  return metaTags.join('\n    ');
}

/**
 * Build canonical URL with proper path normalization
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
