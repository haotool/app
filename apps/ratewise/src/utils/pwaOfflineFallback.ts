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
    <script>
      (function () {
        var K = 'ratewise-theme';
        var D = 'zen';
        var A = ['zen', 'nitro', 'kawaii', 'classic', 'ocean', 'forest'];
        function v(c) {
          if (c === null || typeof c !== 'object' || Array.isArray(c) || c.constructor !== Object) return D;
          if (!Object.prototype.hasOwnProperty.call(c, 'style')) return D;
          var s = c.style;
          return typeof s === 'string' && A.indexOf(s) !== -1 ? s : D;
        }
        try {
          var t = localStorage.getItem(K);
          document.documentElement.dataset.style = t ? v(JSON.parse(t)) : D;
        } catch (e) {
          document.documentElement.dataset.style = D;
        }
      })();
    </script>
    <style>
      :root,
      [data-style='zen'] {
        color-scheme: light;
        --rw-bg: 248 250 252;
        --rw-surface: 255 255 255;
        --rw-text: 15 23 42;
        --rw-muted: 100 116 139;
        --rw-border: 226 232 240;
        --rw-primary: 124 58 237;
        --rw-shadow: 15 23 42;
      }
      [data-style='nitro'] {
        color-scheme: dark;
        --rw-bg: 2 6 23;
        --rw-surface: 15 23 42;
        --rw-text: 255 255 255;
        --rw-muted: 203 213 225;
        --rw-border: 30 41 59;
        --rw-primary: 103 232 249;
        --rw-shadow: 0 0 0;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-style]) {
          color-scheme: dark;
          --rw-bg: 2 6 23;
          --rw-surface: 15 23 42;
          --rw-text: 255 255 255;
          --rw-muted: 203 213 225;
          --rw-border: 30 41 59;
          --rw-primary: 103 232 249;
          --rw-shadow: 0 0 0;
        }
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgb(var(--rw-bg));
        color: rgb(var(--rw-text));
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .card {
        width: min(100%, 360px);
        border: 1px solid rgb(var(--rw-border));
        border-radius: 24px;
        background: rgb(var(--rw-surface));
        box-shadow: 0 1px 2px 0 rgb(var(--rw-shadow) / 0.04), 0 12px 32px -24px rgb(var(--rw-shadow) / 0.28);
        padding: 24px 20px;
        text-align: center;
      }
      .icon { font-size: 40px; line-height: 1; margin-bottom: 12px; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      p { margin: 0; line-height: 1.65; color: rgb(var(--rw-muted)); }
      button {
        margin-top: 16px;
        border: 0;
        border-radius: 999px;
        background: rgb(var(--rw-primary));
        color: rgb(var(--rw-bg));
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
