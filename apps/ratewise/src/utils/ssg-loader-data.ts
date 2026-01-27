import { logger } from './logger';

type SSGWindow = Window & {
  __VITE_REACT_SSG_HASH__?: string;
  __VITE_REACT_SSG_STATIC_LOADER_DATA__?: Record<string, unknown>;
};

const isBrowser = typeof window !== 'undefined';

const buildManifestUrl = (hash: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}static-loader-data-manifest-${hash}.json`;
};

/**
 * 確保 SSG 靜態載入資料可用，避免導覽時因 JSON 解析失敗而崩潰
 */
export const ensureStaticLoaderData = async (): Promise<void> => {
  if (!isBrowser) return;

  const ssgWindow = window as SSGWindow;
  if (ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__) return;

  const hash = ssgWindow.__VITE_REACT_SSG_HASH__;
  if (!hash) {
    ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = {};
    return;
  }

  const manifestUrl = buildManifestUrl(hash);

  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Invalid content-type: ${contentType}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = data && typeof data === 'object' ? data : {};
  } catch (error) {
    ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = {};
    logger.warn('SSG 靜態載入資料取得失敗，已回退為空資料', {
      error: error instanceof Error ? error.message : String(error),
      manifestUrl,
    });
  }
};
