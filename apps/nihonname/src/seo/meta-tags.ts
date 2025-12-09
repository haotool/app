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
  '輸入姓氏，秒查日治時期改姓對照！收錄90+漢姓、1700+筆歷史記錄，基於《内地式改姓名の仕方》。免費查詢你的日式姓名。';
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
        title: '關於本站 - NihonName 開發故事與資料來源',
        description:
          '了解 NihonName 的開發背景、歷史文獻來源與技術架構。資料來自國史館、學術論文、《内地式改姓名の仕方》等權威來源。',
        keywords: [
          '關於 NihonName',
          '台灣歷史',
          '皇民化運動',
          '歷史資料',
          '開放資料',
          '國史館',
          '日治時期文獻',
        ],
      };

    case '/guide':
      return {
        ...baseConfig,
        title: '使用說明 - 4步驟查詢日式姓名',
        description:
          '4步驟教你查詢日治時期改姓對照：輸入姓氏→點擊查詢→查看結果→分享截圖。支援90+漢姓，含來源說明與變異法解析。',
        keywords: [
          '使用說明',
          '操作指南',
          '日式改名規則',
          '皇民化改姓',
          '歷史文獻',
          '姓氏查詢教學',
        ],
      };

    case '/faq':
      return {
        ...baseConfig,
        title: '常見問題 FAQ - 皇民化改姓問答',
        description:
          '18題常見問答：什麼是皇民化運動？改姓是強制的嗎？資料來源是什麼？一次解答所有疑惑，了解1940年代台灣改姓歷史。',
        keywords: [
          '常見問題',
          'FAQ',
          '皇民化改姓',
          '日治時期',
          '台灣歷史',
          '姓氏對照',
          '改姓問答',
          '歷史問答',
        ],
      };

    case '/history':
      return {
        ...baseConfig,
        title: '歷史專區 - 皇民化運動、馬關條約、舊金山和約',
        description:
          '完整解析台灣日治時期三大歷史：1895馬關條約、1937-1945皇民化運動、1951舊金山和約。附時間軸與專題文章。',
        keywords: [
          '台灣歷史',
          '皇民化運動',
          '馬關條約',
          '舊金山和約',
          '日治時期',
          '改姓政策',
          '台灣日治時期',
          '歷史專區',
        ],
        ogType: 'article',
      };

    case '/history/kominka':
      return {
        ...baseConfig,
        title: '皇民化運動 1937-1945 - 台灣改姓名運動完整解析',
        description:
          '1937-1945皇民化運動全解析：改日本姓名、國語運動、神社參拜。約7.6%家庭改姓，17萬戶受影響。含改姓五大原則說明。',
        keywords: [
          '皇民化運動',
          '台灣日治時期',
          '改日本名',
          '同化政策',
          '1937-1945',
          '神社參拜',
          '皇民化改姓運動',
          '日治時期改名',
          '台灣人改姓名單',
        ],
        ogType: 'article',
      };

    case '/history/shimonoseki':
      return {
        ...baseConfig,
        title: '馬關條約 1895 - 台灣割讓日本的歷史真相',
        description:
          '1895年馬關條約完整解析：甲午戰爭後台灣割讓日本，開啟50年日治時期。破解「馬關續約」迷思，條約為永久割讓非租借。',
        keywords: [
          '馬關條約',
          '下關條約',
          '甲午戰爭',
          '台灣割讓',
          '1895',
          '日治時期開始',
          '馬關條約強制續約',
          '馬關續約',
          '台灣日治時期',
        ],
        ogType: 'article',
      };

    case '/history/san-francisco':
      return {
        ...baseConfig,
        title: '舊金山和約 1951 - 日本放棄台灣主權的法律依據',
        description:
          '1951年舊金山和約第二條：日本放棄台灣主權。1952年生效，結束日本對台50年統治。了解台灣地位的國際法依據。',
        keywords: [
          '舊金山和約',
          '對日和約',
          '台灣地位',
          '二戰後',
          '1951',
          '國際法',
          '日本放棄台灣',
          '對日和平條約',
          '台灣主權',
        ],
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
    // 核心關鍵字
    '皇民化改姓',
    '日式姓名生成器',
    '台灣日治時期',
    '改姓對照表',
    'NihonName',
    // 長尾關鍵字（搜索熱詞）
    '皇民化改姓運動',
    '日治時期改名',
    '台灣人改姓名單',
    '改日本姓',
    '日式改名查詢',
    // 歷史相關
    '皇民化運動',
    '內地式改姓名',
    '1940年代台灣',
    '日治時期戶籍',
    // 功能相關
    '日本名字產生器',
    '姓氏對照查詢',
    '諧音日本名',
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
    `<link rel="alternate" hrefLang="x-default" href="${canonicalUrl}" />`,
    `<link rel="alternate" hrefLang="zh-TW" href="${canonicalUrl}" />`,

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
