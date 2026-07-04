/**
 * Meta Tags Generator for SEO（SSG onPageRendered 注入）
 * 文案方向依 PRD §9.2；終稿可後補，SSOT 一律集中本檔。
 */
import { APP_INFO } from '../config/app-info';

const SITE_URL = APP_INFO.siteUrl.replace(/\/$/, '');
const SITE_NAME = APP_INFO.name;
const DEFAULT_IMAGE = '/og-image.png';
const TWITTER_HANDLE = APP_INFO.socialHandle;
const THEME_COLOR = '#3182F6';

interface RouteMetadata {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noindex?: boolean;
}

/**
 * Route-specific metadata（統一尾斜線 key）
 */
const ROUTE_METADATA: Record<string, RouteMetadata> = {
  '/': {
    title: 'HaoTool 好工具 — 免費開源的台灣網頁工具集 | 匯率、分帳、停車、防災',
    description:
      'HaoTool 好工具：免費、開源、不收集個資的台灣網頁工具集。HaoRate 匯率換算、喵喵分帳、停車好工具 ParkKeeper、日本名字產生器、地震知識小學堂，每一個都以產品級標準交付，Lighthouse 90+ 分。',
    type: 'website',
    keywords: [
      'HaoTool',
      '好工具',
      '免費工具',
      '開源',
      '匯率換算',
      '旅遊分帳',
      '停車記錄',
      '日本名字產生器',
      '地震防災',
      'PWA',
    ],
  },
  '/tools/': {
    title: '所有工具 — HaoRate 匯率、喵喵分帳、停車好工具、日本名字、地震小學堂',
    description:
      'HaoTool 全部工具總覽：HaoRate 匯率好工具（台銀銀行賣出價）、喵喵分帳 Split Meow、停車好工具 ParkKeeper、日本名字產生器 NihonName、地震知識小學堂。全部免費、開源、離線可用。',
    type: 'website',
    keywords: ['工具總覽', '免費工具', '匯率', '分帳', '停車', '日本名字', '地震', 'PWA'],
  },
  '/about/': {
    title: '關於 HaoTool 與阿璋 — 打造好工具的開發哲學',
    description:
      '「HAO」取自「好」的拼音，HaoTool 的核心理念是打造真正的好工具。認識作者阿璋的開發哲學：效能是功能、細節是尊重、開源是承諾；並了解本站的隱私承諾。',
    type: 'profile',
    keywords: ['阿璋', 'HaoTool', '好工具', '全端工程師', '開發哲學', '隱私政策', '開源'],
  },
  '/contact/': {
    title: '聯繫阿璋 — 合作委託與問題回報',
    description:
      '有專案想法或合作委託？歡迎透過 Email、GitHub 或 Threads 聯繫阿璋，通常 24 小時內回覆。',
    type: 'website',
    keywords: ['聯繫', '合作', '委託', '前端開發', 'React'],
  },
  '/404/': {
    title: `找不到頁面 — ${SITE_NAME}`,
    description: '這頁不存在，但工具都在。回到 HaoTool 首頁，探索五個免費開源的網頁工具。',
    type: 'website',
    noindex: true,
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
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * Generate meta tags for a specific route
 */
export function getMetaTagsForRoute(route: string, buildTime: string): string {
  const normalizedRoute = normalizeRoute(route);
  const metadata = ROUTE_METADATA[normalizedRoute] ?? ROUTE_METADATA['/'];
  if (!metadata) {
    return '';
  }
  const canonicalUrl = `${SITE_URL}${normalizedRoute}`;
  const imageUrl = `${SITE_URL}${metadata.image ?? DEFAULT_IMAGE}`;

  const tags: string[] = [];

  tags.push(`<title>${escapeHtml(metadata.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}" />`);

  if (metadata.keywords && metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}" />`);
  }

  tags.push(`<meta name="author" content="${APP_INFO.author} | ${SITE_NAME}" />`);

  if (metadata.noindex) {
    tags.push(`<meta name="robots" content="noindex, follow" />`);
  } else {
    tags.push(
      `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    );
    tags.push(
      `<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    );
    // Canonical 與 hreflang 僅輸出於可索引頁
    tags.push(`<link rel="canonical" href="${canonicalUrl}" />`);
    tags.push(`<link rel="alternate" hreflang="zh-TW" href="${canonicalUrl}" />`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);
  }

  // Open Graph Tags
  tags.push(`<meta property="og:type" content="${metadata.type ?? 'website'}" />`);
  tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  tags.push(`<meta property="og:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta property="og:url" content="${canonicalUrl}" />`);
  tags.push(`<meta property="og:image" content="${imageUrl}" />`);
  tags.push(`<meta property="og:image:alt" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  tags.push(`<meta property="og:locale" content="zh_TW" />`);
  tags.push(`<meta property="og:updated_time" content="${buildTime}" />`);

  // Twitter Card Tags
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:site" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:creator" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${imageUrl}" />`);

  // Additional Meta Tags
  tags.push(`<meta name="theme-color" content="${THEME_COLOR}" />`);
  tags.push(`<meta name="format-detection" content="telephone=no" />`);
  tags.push(`<meta http-equiv="last-modified" content="${buildTime}" />`);

  return tags.join('\n');
}
