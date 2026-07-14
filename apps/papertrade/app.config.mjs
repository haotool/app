export const SEO_PATHS = ['/'];

export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

export const IMAGE_RESOURCES = ['/favicon.svg'];

export const SITE_CONFIG = {
  url: 'https://app.haotool.org/papertrade/',
  name: 'PaperTrade 模擬交易所',
  title: 'PaperTrade | 零風險模擬合約交易所',
  description: '串接真實市場行情的模擬合約交易所，零風險練習加密貨幣永續合約交易。',
};

export const APP_CONFIG = {
  name: 'papertrade',
  displayName: 'PaperTrade 模擬交易所',

  basePath: {
    development: '/',
    ci: '/papertrade/',
    production: '/papertrade/',
  },

  seoPaths: SEO_PATHS,
  siteUrl: SITE_CONFIG.url,

  build: {
    ssg: false,
    pwa: false,
  },

  resources: {
    seoFiles: SEO_FILES,
    images: IMAGE_RESOURCES,
  },
};

export function normalizePath(path) {
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') + '/';
}

export function shouldPrerender(path) {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized);
}

export function getIncludedRoutes(paths) {
  return paths.filter((path) => shouldPrerender(path));
}
