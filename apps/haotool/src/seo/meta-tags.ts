/**
 * Meta Tags Generator for SEO
 * [context7:/google/seo-starter-guide:2025-12-14]
 */

const SITE_URL = 'https://app.haotool.org';
const SITE_NAME = 'haotool.org';
const DEFAULT_IMAGE = '/og-image.png';
const TWITTER_HANDLE = '@azlife_1224';

/**
 * Route-specific metadata
 */
const ROUTE_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    keywords?: string[];
  }
> = {
  '/': {
    title: 'haotool.org — 阿璋的全端作品集 | React TypeScript 高品質數位工具',
    description:
      '「haotool」取自「好工具」的諧音。阿璋以 React 19、TypeScript、Vite 7 打造高品質數位工具：RateWise 匯率計算機、日本名字產生器、停車好工具 ParkKeeper、地震知識小學堂。融合 3D 互動與動態設計，全部開源、免費、Lighthouse 90+ 分。',
    type: 'website',
    keywords: [
      '阿璋',
      'haotool',
      '好工具',
      '全端工程師',
      '作品集',
      'React',
      'TypeScript',
      'PWA',
      '開源專案',
      'Web 開發',
      '匯率計算機',
      '日本名字產生器',
      '停車好工具',
    ],
  },
  '/projects/': {
    title: '作品集 | React TypeScript 開源專案展示 — haotool.org',
    description:
      '精選作品展示：RateWise 即時匯率計算機（30 天歷史圖表）、日本名字產生器（Vite SSG、PWA）、停車好工具 ParkKeeper（GPS 停車記錄）、地震知識小學堂。每個作品 Lighthouse 90+ 分，全部開源免費。',
    type: 'website',
    keywords: [
      '作品集',
      '開源專案',
      'React 專案',
      'TypeScript',
      'PWA',
      'RateWise',
      '停車好工具',
      '日本名字產生器',
    ],
  },
  '/about/': {
    title: '關於阿璋 | 全端工程師 React TypeScript — haotool.org',
    description:
      '我是阿璋，「haotool」取自「好工具」的諧音，也延伸自我名字的 HAO 音節，代表我對產出的堅持：它必須是個好工具。專精 React 19、TypeScript、Vite、Tailwind CSS，追求 Lighthouse 滿分的開發哲學。',
    type: 'profile',
    keywords: ['阿璋', '全端工程師', 'React', 'TypeScript', '技術背景', '開發者', 'haotool'],
  },
  '/contact/': {
    title: '聯繫阿璋 | 合作委託 React 前端開發 — haotool.org',
    description:
      '有專案想法或合作委託？歡迎透過 Email、GitHub 或 Threads 聯繫阿璋。承接 Web 前端開發、React 應用架構、PWA 設計、3D 互動網頁等技術委託，通常 24 小時內回覆。',
    type: 'website',
    keywords: ['聯繫', '合作', '委託', '前端開發', 'React', 'PWA'],
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
  const imageUrl = metadata.image ? `${SITE_URL}${metadata.image}` : `${SITE_URL}${DEFAULT_IMAGE}`;

  void buildTime; // Used for documentation, suppress unused warning

  const tags: string[] = [];

  // Title tag (replaces the static one from index.html)
  tags.push(`<title>${escapeHtml(metadata.title)}</title>`);

  // Basic Meta Tags
  tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}" />`);

  if (metadata.keywords && metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${metadata.keywords?.join(', ') ?? ''}" />`);
  }

  tags.push(`<meta name="author" content="阿璋 | ${SITE_NAME}" />`);
  tags.push(`<meta property="article:author" content="阿璋" />`);
  tags.push(`<meta property="article:published_time" content="2025-01-01T00:00:00Z" />`);
  tags.push(`<meta property="article:modified_time" content="${buildTime}" />`);
  tags.push(
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
  );
  tags.push(
    `<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
  );

  // Canonical URL
  tags.push(`<link rel="canonical" href="${canonicalUrl}" />`);

  // Hreflang
  tags.push(`<link rel="alternate" hreflang="zh-TW" href="${canonicalUrl}" />`);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);

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
  tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(metadata.title)}" />`);

  // Additional Meta Tags
  tags.push(`<meta name="theme-color" content="#6366f1" />`);
  tags.push(`<meta name="format-detection" content="telephone=no" />`);

  // Last Modified
  tags.push(`<meta http-equiv="last-modified" content="${buildTime}" />`);

  return tags.join('\n');
}
