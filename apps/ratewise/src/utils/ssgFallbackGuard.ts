/**
 * SSG SPA fallback 守門
 *
 * 靜態主機（或 SW navigation fallback）對未預渲染路徑回傳「其他路由的 SSG 快照」
 * （通常是首頁 index.html）時，快照帶有 data-server-rendered=true，
 * vite-react-ssg 會對不相符的 DOM 樹 hydrate，必然觸發 React #418。
 * 本守門在 hydration 前比對快照路由標記（meta[name="ssg-route"]，由
 * vite.config.ts onBeforePageRender 注入）與當前 URL：不相符即清空 root 並移除
 * data-server-rendered，讓 client 改走乾淨的 render()（vite-react-ssg PR #90 行為）。
 *
 * @see https://github.com/Daydreamer-riri/vite-react-ssg/pull/90
 */

/** 正規化路徑供比對：小寫＋前後斜線齊一。 */
function normalizePath(path: string): string {
  let value = path.trim().toLowerCase();
  if (!value.startsWith('/')) value = `/${value}`;
  if (!value.endsWith('/')) value = `${value}/`;
  return value;
}

/** 判斷快照路由是否與當前路徑不符（即 SPA fallback 送錯快照）。 */
export function isStaleSsgSnapshot(
  markerRoute: string | null | undefined,
  pathname: string,
  baseUrl: string,
): boolean {
  // 無標記（舊快取 HTML）採保守策略：不介入，維持既有 hydrate 行為。
  if (!markerRoute) return false;

  const base = normalizePath(baseUrl || '/');
  let routePath = normalizePath(pathname);
  if (base !== '/' && routePath.startsWith(base)) {
    routePath = normalizePath(routePath.slice(base.length - 1));
  }
  return normalizePath(markerRoute) !== routePath;
}

/**
 * 在 hydration 前套用守門：偵測到 stale 快照時清空 root 改走 client render。
 * 必須於 ViteReactSSG 啟動前（main.tsx 模組層）同步執行。
 */
export function applySsgFallbackGuard(baseUrl: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const marker = document.querySelector('meta[name="ssg-route"]')?.getAttribute('content');

  if (!isStaleSsgSnapshot(marker, window.location.pathname, baseUrl)) return false;

  const root = document.querySelector('[data-server-rendered=true]');
  if (!root) return false;

  root.removeAttribute('data-server-rendered');
  root.replaceChildren();
  return true;
}
