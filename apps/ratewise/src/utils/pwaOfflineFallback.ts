import { APP_INFO } from '../config/app-info';

export type EmergencyOfflineFallbackReason =
  | 'emergency-document-fallback'
  | 'emergency-navigation-fallback';

export const EMERGENCY_OFFLINE_HTML = `<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>離線模式 - ${APP_INFO.name}</title>
    <meta name="robots" content="noindex,nofollow">
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .card {
        width: min(100%, 360px);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        padding: 24px 20px;
        text-align: center;
      }
      .icon { font-size: 40px; line-height: 1; margin-bottom: 12px; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      p { margin: 0; line-height: 1.65; color: #475569; }
      button {
        margin-top: 16px;
        border: 0;
        border-radius: 999px;
        background: #0f172a;
        color: #fff;
        font: inherit;
        padding: 10px 16px;
      }
    </style>
  </head>
  <body data-ratewise-emergency-fallback="true">
    <main class="card" role="alert" aria-live="assertive">
      <div class="icon">⚠️</div>
      <h1>離線啟動保護模式</h1>
      <p>目前無法取得完整快取資源，已切換到最低限度離線保護頁。請重新連線後再試一次。</p>
      <button type="button" onclick="window.location.reload()">重新載入</button>
    </main>
  </body>
</html>`;

export function createEmergencyOfflineResponse(reason: EmergencyOfflineFallbackReason): Response {
  return new Response(EMERGENCY_OFFLINE_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-RateWise-Offline-Fallback': reason,
    },
  });
}

interface ResolveOfflineDocumentFallbackOptions {
  emergencyReason: EmergencyOfflineFallbackReason;
  matchPrecache: (
    url: 'index.html' | 'offline.html',
  ) => Response | undefined | null | Promise<Response | undefined | null>;
  matchIndexHtmlInAnyCache: () =>
    | Response
    | undefined
    | null
    | Promise<Response | undefined | null>;
  matchOfflineHtmlInAnyCache: () =>
    | Response
    | undefined
    | null
    | Promise<Response | undefined | null>;
}

function getPrecacheLookupKeys(request: Request): string[] {
  const pathname = new URL(request.url).pathname;
  const keys = new Set<string>();
  const withoutLeadingSlash = pathname.replace(/^\//, '');
  if (withoutLeadingSlash) keys.add(withoutLeadingSlash);

  const assetsIndex = pathname.indexOf('/assets/');
  if (assetsIndex >= 0) {
    keys.add(pathname.slice(assetsIndex + 1));
  }

  const filename = pathname.split('/').pop();
  if (filename) keys.add(filename);

  return [...keys];
}

type MatchPrecacheFn = (
  url: string,
) => Response | undefined | null | Promise<Response | undefined | null>;

/** JS/CSS 離線回退：exact URL → ignoreSearch → matchPrecache。 */
export async function resolveOfflineStaticResourceFallback(
  request: Request,
  matchPrecacheFn: MatchPrecacheFn,
): Promise<Response> {
  try {
    const exact = await caches.match(request);
    if (exact) return exact;
  } catch {
    // 忽略快取存取錯誤。
  }

  const bareUrl = request.url.split('?')[0] ?? request.url;
  try {
    const ignoreSearchMatch = await caches.match(bareUrl, { ignoreSearch: true });
    if (ignoreSearchMatch) return ignoreSearchMatch;
  } catch {
    // 忽略快取存取錯誤。
  }

  for (const key of getPrecacheLookupKeys(request)) {
    try {
      const precached = await matchPrecacheFn(key);
      if (precached) return precached;
    } catch {
      // 忽略 matchPrecache 錯誤。
    }
  }

  return Response.error();
}

export async function resolveOfflineDocumentFallback({
  emergencyReason,
  matchPrecache,
  matchIndexHtmlInAnyCache,
  matchOfflineHtmlInAnyCache,
}: ResolveOfflineDocumentFallbackOptions): Promise<Response> {
  // 1. Workbox precache（正常情況）
  const precachedIndex = await matchPrecache('index.html');
  if (precachedIndex) return precachedIndex;

  // 2. 任何快取中的 index.html（iOS eviction 後 html-cache 仍可能有備份）
  const anyIndex = await matchIndexHtmlInAnyCache();
  if (anyIndex) return anyIndex;

  // 3. offline.html（precache 或 html-cache）
  const precachedOffline = await matchPrecache('offline.html');
  if (precachedOffline) return precachedOffline;

  return (await matchOfflineHtmlInAnyCache()) ?? createEmergencyOfflineResponse(emergencyReason);
}
