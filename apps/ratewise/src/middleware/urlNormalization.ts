/**
 * 產生小寫且去除重複斜線的 URL。
 */
export function normalizeUrl(url: string): string {
  if (!url) return '/';

  let normalized = url.replace(/\/+/g, '/');
  normalized = normalized.toLowerCase();

  return normalized;
}

export function shouldRedirect(pathname: string): boolean {
  if (/[A-Z]/.test(pathname)) {
    return true;
  }

  if (/\/\/+/.test(pathname)) {
    return true;
  }

  return false;
}

export function getRedirectUrl(pathname: string, origin: string, search = '', hash = ''): string {
  const normalizedPathname = normalizeUrl(pathname);
  const normalizedSearch = search ? normalizeUrl(search) : '';
  const normalizedHash = hash ? normalizeUrl(hash) : '';
  return `${origin}${normalizedPathname}${normalizedSearch}${normalizedHash}`;
}

export function useUrlNormalization(): void {
  // 保留函式邊界，供 React Router 整合層擴充。
}
