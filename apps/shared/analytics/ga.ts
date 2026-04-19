/**
 * GA4 Analytics — 動態注入 gtag.js，無 inline script，CSP 相容。
 *
 * 設計原則：
 * - `send_page_view: false`：由 RouteAnalytics 手動送出，防止 SSG hydration 重複計算。
 * - `transport_type: 'beacon'`：使用 sendBeacon API，非阻塞且頁面卸載不丟失事件。
 * - `arguments` 物件：GA4 內部依賴 IArguments；改用 spread 會導致事件靜默失效。
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

type LoadWindow = Pick<Window, 'addEventListener'>;
type LoadDocument = Pick<Document, 'readyState'>;

/**
 * AI referral 來源判別表（2026-04 SSOT）
 *
 * ChatGPT 會自動附上 `utm_source=chatgpt.com`；其他平台多半只給 referrer。
 * key 為寫入 GA4 custom dimension 的 canonical 值，便於 channel group regex 比對。
 *
 * 規則：
 * - `hostname` 必填，用於 referrer host 比對；缺 `pathname` 時全主機命中
 * - `pathname` 可選，限縮到 Copilot 在 Bing 的專屬路徑（`/chat`、`/copilotsearch`），
 *   避免一般 Bing 搜尋被誤判為 AI referral 污染 GA4 ai_source
 * - `pathname` 存在的項目不參與 utm_source 比對（utm 無路徑資訊，不足以判別）
 */
interface AiSourceEntry {
  id: string;
  hostname: RegExp;
  pathname?: RegExp;
}

const AI_SOURCE_PATTERNS: readonly AiSourceEntry[] = [
  { id: 'chatgpt', hostname: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/i },
  { id: 'perplexity', hostname: /(^|\.)perplexity\.ai$/i },
  { id: 'claude', hostname: /(^|\.)claude\.ai$|(^|\.)claude\.com$/i },
  { id: 'gemini', hostname: /(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/i },
  { id: 'copilot', hostname: /(^|\.)copilot\.microsoft\.com$/i },
  {
    id: 'copilot',
    hostname: /(^|\.)bing\.com$/i,
    pathname: /^\/(chat|copilotsearch)(\/|$)/i,
  },
  { id: 'grok', hostname: /(^|\.)grok\.com$|(^|\.)x\.ai$/i },
  { id: 'mistral', hostname: /(^|\.)chat\.mistral\.ai$|(^|\.)mistral\.ai$/i },
  { id: 'you', hostname: /(^|\.)you\.com$/i },
  { id: 'phind', hostname: /(^|\.)phind\.com$/i },
];

/**
 * 判別當前造訪是否來自 AI 助手。
 * 優先採用 utm_source（ChatGPT 等會主動附加），其次 referrer host/path 比對。
 * 無匹配時回傳 null，呼叫端應略過事件送出以避免雜訊。
 */
export function detectAiSource(
  pageUrl: string,
  referrer: string,
): { id: string; medium: 'utm' | 'referrer'; raw: string } | null {
  try {
    const url = new URL(pageUrl);
    const utmSource = url.searchParams.get('utm_source');
    if (utmSource) {
      for (const entry of AI_SOURCE_PATTERNS) {
        if (entry.pathname) continue;
        if (entry.hostname.test(utmSource)) {
          return { id: entry.id, medium: 'utm', raw: utmSource };
        }
      }
    }
  } catch {
    // 非合法 URL,忽略
  }

  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      for (const entry of AI_SOURCE_PATTERNS) {
        if (!entry.hostname.test(refUrl.hostname)) continue;
        if (entry.pathname && !entry.pathname.test(refUrl.pathname)) continue;
        const raw = entry.pathname ? `${refUrl.hostname}${refUrl.pathname}` : refUrl.hostname;
        return { id: entry.id, medium: 'referrer', raw };
      }
    } catch {
      // referrer 非 URL,忽略
    }
  }

  return null;
}

/**
 * 頁面已 complete 時立即執行，否則延後到 load 事件。
 * 回傳值供測試驗證實際採用的初始化路徑。
 */
export function scheduleAfterPageLoad(
  task: () => void,
  targetDocument: LoadDocument = document,
  targetWindow: LoadWindow = window,
): 'immediate' | 'deferred' {
  if (targetDocument.readyState === 'complete') {
    task();
    return 'immediate';
  }

  targetWindow.addEventListener('load', task, { once: true });
  return 'deferred';
}

/**
 * 初始化 GA4 並注入 gtag.js。
 * measurementId 為空時提早返回，dev 環境不啟用。
 */
export function initGA(measurementId: string): void {
  if (!measurementId || typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];

  // 必須使用 regular function + arguments 物件。
  // spread 建立真 Array，GA4 無法識別，導致所有事件靜默丟失。
  window.gtag = function gtag(): void {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
    transport_type: 'beacon',
  });

  // CSP script-src 已允許 googletagmanager.com，Trusted Types 亦已加白名單。
  // crossOrigin='anonymous'：CORS 模式載入，符合 COEP require-corp 跨源隔離環境要求。
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/** 送出 GA4 page_view 事件。gtag 未就緒時靜默略過。 */
export function trackPageview(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

/** 送出 GA4 自訂事件。gtag 未就緒時靜默略過。 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

const AI_REFERRAL_SESSION_KEY = '__ratewise_ai_referral_sent__';

/**
 * 若本次造訪來自 AI 助手，送出 `ai_referral` 事件並設定 user property；
 * 非 AI 新 session 則主動 `ai_source = null` 清除前次殘留歸因。
 * 同 session 內只處理一次；gtag 未就緒時靜默略過。
 *
 * 為何需要 reset：GA4 `user_properties` 是 user-scoped 且跨 session 持久化；
 * 若使用者首次從 ChatGPT 到站後，下次直接開啟或從 Google 來，不清除 ai_source
 * 會讓後續 direct / organic session 仍掛著 `ai_source=chatgpt`，污染 channel attribution。
 *
 * GA4 後台建議：
 * - 於 Admin → Custom definitions 新增 user-scoped dimension `ai_source`
 * - 於 Admin → Channel groups 建立 regex：
 *   `chatgpt|perplexity|claude|gemini|copilot|grok|mistral|you|phind`
 */
export function trackAiReferral(): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  // 同 tab session 已處理過（AI 命中或已清空）→ 保留現值避免 reload 覆寫當下歸因
  try {
    if (window.sessionStorage.getItem(AI_REFERRAL_SESSION_KEY) === '1') return;
  } catch {
    // sessionStorage 不可用（private mode / 權限），繼續處理但無去重
  }

  const markSession = () => {
    try {
      window.sessionStorage.setItem(AI_REFERRAL_SESSION_KEY, '1');
    } catch {
      // 無法寫入則下次造訪可能重複處理，屬可接受雜訊
    }
  };

  const detected = detectAiSource(window.location.href, document.referrer);

  if (!detected) {
    // 非 AI 新 session：主動清除可能殘留的 ai_source，避免跨 session 歸因污染。
    window.gtag('set', 'user_properties', { ai_source: null });
    markSession();
    return;
  }

  window.gtag('set', 'user_properties', { ai_source: detected.id });
  window.gtag('event', 'ai_referral', {
    ai_source: detected.id,
    ai_medium: detected.medium,
    ai_raw: detected.raw,
    landing_page: window.location.pathname + window.location.search,
  });
  markSession();
}
