/**
 * Meta Tags Generator for SEO
 * [context7:/google/seo-starter-guide:2025-12-14]
 */

const SITE_URL = 'https://app.haotool.org';
const SITE_NAME = 'HAOTOOL.ORG';
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
    title: 'HAOTOOL.ORG | 阿璋的作品集',
    description:
      '嗨，我是阿璋。「HAOTOOL」取自「好工具」的諧音，代表每個作品都要兼具實用與優雅。我將程式碼雕琢為數位藝術，融合現代 Web 技術與動態設計，打造令人過目不忘的使用者體驗。',
    type: 'website',
    keywords: [
      '前端開發',
      '全端工程師',
      'React',
      'TypeScript',
      '作品集',
      '開源專案',
      '阿璋',
      'HAOTOOL',
      'Web 開發',
    ],
  },
  '/projects/': {
    title: '作品集 | HAOTOOL.ORG',
    description:
      '精選作品展示：日本名字產生器、RateWise 匯率計算機等。每個專案都傾注對細節的執著，展現全端開發、設計與問題解決能力。',
    type: 'website',
    keywords: ['作品集', '專案', 'React 專案', 'TypeScript', 'PWA', '開源'],
  },
  '/about/': {
    title: '關於阿璋 | HAOTOOL.ORG',
    description:
      '我是阿璋，「HAOTOOL」取自「好工具」的諧音，也延伸自我名字的 HAO 音節，代表我對產出的堅持：它必須是個好工具。了解我的技術專長、開發哲學與職涯歷程。',
    type: 'profile',
    keywords: ['阿璋', '關於', '全端工程師', '技術背景', '開發者'],
  },
  '/contact/': {
    title: '聯繫 | HAOTOOL.ORG',
    description:
      '有問題或想法想討論？歡迎透過 Email、GitHub 或 Threads 與我聯繫，我會盡快回覆您。讓我們一起打造令人驚艷的數位體驗。',
    type: 'website',
    keywords: ['聯繫', '合作', '委託', '諮詢'],
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

  // Basic Meta Tags
  tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}" />`);

  if (metadata.keywords && metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${metadata.keywords?.join(', ') ?? ''}" />`);
  }

  tags.push(`<meta name="author" content="阿璋 | ${SITE_NAME}" />`);
  tags.push(`<meta name="robots" content="index, follow" />`);
  tags.push(`<meta name="googlebot" content="index, follow" />`);

  // Canonical URL
  tags.push(`<link rel="canonical" href="${canonicalUrl}" />`);

  // Open Graph Tags
  tags.push(`<meta property="og:type" content="${metadata.type ?? 'website'}" />`);
  tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  tags.push(`<meta property="og:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta property="og:url" content="${canonicalUrl}" />`);
  tags.push(`<meta property="og:image" content="${imageUrl}" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  tags.push(`<meta property="og:locale" content="zh_TW" />`);

  // Twitter Card Tags
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:site" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:creator" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${imageUrl}" />`);

  // Additional Meta Tags
  tags.push(`<meta name="theme-color" content="#6366f1" />`);
  tags.push(`<meta name="format-detection" content="telephone=no" />`);

  // Last Modified
  tags.push(`<meta http-equiv="last-modified" content="${buildTime}" />`);

  return tags.join('\n');
}
