/**
 * SEO Helmet Component for NihonName
 * [fix:2025-12-06] 移除 JSON-LD script tags，改用 onPageRendered hook 注入
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
 *
 * 根據 vite-react-ssg 官方最佳實踐：
 * - <Head> 組件中的 <script> 標籤不會在 SSG build 時渲染
 * - JSON-LD 必須使用 vite.config.ts 的 onPageRendered hook 注入
 * - 此組件僅負責 meta tags（title, description, OG tags 等）
 *
 * @see src/seo/jsonld.ts - JSON-LD 結構化數據配置
 * @see vite.config.ts - onPageRendered hook 實作
 */
import { Helmet } from '../utils/helmet';

interface AlternateLink {
  hrefLang: string;
  href: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  pathname?: string;
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  robots?: string;
  // 兼容舊版頁面傳入的附加資訊（目前僅由 vite.config.ts 注入）
  faq?: { question: string; answer: string }[];
  breadcrumbs?: { name: string; url: string }[];
  jsonLd?: Record<string, unknown>;
}

// Site configuration
const SITE_BASE_URL = 'https://app.haotool.org/nihonname/';
const ASSET_VERSION = 'v=20251208';

const DEFAULT_TITLE = 'NihonName 皇民化改姓生成器 | 1940年代台灣日式姓名產生器';
const DEFAULT_DESCRIPTION =
  '探索1940年代台灣皇民化運動的歷史改姓對照。輸入你的姓氏，發現日治時期的日式姓名與趣味諧音名。基於歷史文獻《内地式改姓名の仕方》。';
const DEFAULT_OG_IMAGE = 'og-image.png';
const DEFAULT_LOCALE = 'zh-TW';
const DEFAULT_KEYWORDS = [
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

// Build time injected by Vite
const BUILD_TIME = (() => {
  try {
    const envBuildTime: unknown = import.meta.env['VITE_BUILD_TIME'];
    return typeof envBuildTime === 'string' ? envBuildTime : '1970-01-01T00:00:00.000Z';
  } catch {
    return '1970-01-01T00:00:00.000Z';
  }
})();

/**
 * Build canonical URL with proper path normalization
 */
const buildCanonical = (path?: string): string => {
  if (!path) return SITE_BASE_URL;

  // Normalize path: ensure trailing slash for consistency
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.endsWith('/') && !normalizedPath.includes('.')) {
    normalizedPath = `${normalizedPath}/`;
  }

  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
};

const DEFAULT_ALTERNATES: AlternateLink[] = [
  { hrefLang: 'x-default', href: SITE_BASE_URL },
  { hrefLang: DEFAULT_LOCALE, href: SITE_BASE_URL },
];

const withAssetVersion = (url: string) =>
  url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;
const buildAssetUrl = (value: string) => {
  const absolute = value.startsWith('http') ? value : `${SITE_BASE_URL}${value.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
};

/**
 * SEOHelmet - 僅處理 meta tags，JSON-LD 由 onPageRendered hook 注入
 *
 * [fix:2025-12-06] 修復 React Hydration Error #418
 * 根因：vite-react-ssg 的 <Head> 組件中的 <script> 標籤不會在 SSG build 時渲染，
 * 導致 server/client HTML 不匹配，觸發 hydration 錯誤。
 *
 * 解決方案：
 * - 移除此組件中的 JSON-LD script tags
 * - 改用 vite.config.ts 的 onPageRendered hook 在 build 時注入
 *
 * @see https://react.dev/errors/418
 * @see https://context7.com/daydreamer-riri/vite-react-ssg/llms.txt
 */
export function SEOHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  pathname,
  locale = DEFAULT_LOCALE,
  alternates,
  keywords,
  updatedTime,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}: SEOProps) {
  const fullTitle = title ? `${title} | NihonName` : DEFAULT_TITLE;

  const canonicalUrl = canonical ? buildCanonical(canonical) : buildCanonical(pathname);
  const ogImageUrl = buildAssetUrl(ogImage);
  const keywordsContent = (keywords?.length ? keywords : DEFAULT_KEYWORDS).join(', ');
  const alternatesToRender = alternates?.length ? alternates : DEFAULT_ALTERNATES;
  const normalizedAlternates = alternatesToRender.map(({ href, hrefLang }) => ({
    hrefLang,
    href: buildCanonical(href),
  }));
  const updatedTimestamp = updatedTime ?? BUILD_TIME;
  const ogLocale = locale.replace('-', '_');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="robots" content={robots} />
      <meta name="author" content="haotool" />
      <meta name="generator" content="NihonName" />
      <meta name="application-name" content="NihonName" />

      {/* Canonical & Alternates */}
      <link rel="canonical" href={canonicalUrl} />
      {normalizedAlternates.map((link) => (
        <link key={link.hrefLang} rel="alternate" hrefLang={link.hrefLang} href={link.href} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="NihonName 皇民化改姓生成器" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="NihonName" />
      <meta property="og:updated_time" content={updatedTimestamp} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@azlife_1224" />
      <meta name="twitter:creator" content="@azlife_1224" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content="NihonName 皇民化改姓生成器" />

      {/* 
        JSON-LD Structured Data 已移至 vite.config.ts onPageRendered hook
        @see src/seo/jsonld.ts
        @see vite.config.ts ssgOptions.onPageRendered
      */}
    </Helmet>
  );
}
