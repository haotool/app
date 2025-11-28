/**
 * Cloudflare Worker - Security Headers
 *
 * 分層防禦策略：Cloudflare 邊緣層設定安全標頭
 * 與 nginx.conf 保持一致，提供全域保護
 *
 * 部署方式：
 * 1. 登入 Cloudflare Dashboard
 * 2. Workers & Pages > Create Worker
 * 3. 複製此程式碼並部署
 * 4. 設定 Route: app.haotool.org/ratewise/*
 *
 * 參考：
 * - [Cloudflare Workers: Security Headers](https://developers.cloudflare.com/workers/examples/security-headers/)
 * - [OWASP: Secure Headers](https://owasp.org/www-project-secure-headers/)
 *
 * 最後更新：2025-11-26
 */

export default {
  // eslint-disable-next-line no-unused-vars
  async fetch(request, _env, _ctx) {
    // 取得原始回應
    // eslint-disable-next-line no-undef
    const response = await fetch(request);

    // 建立新的回應以添加標頭
    // eslint-disable-next-line no-undef
    const newResponse = new Response(response.body, response);

    // 安全標頭配置（與 nginx.conf 一致）
    const securityHeaders = {
      // Content Security Policy - 防止 XSS 攻擊
      // [fix:2025-11-28] 允許 Vite SSG 生成的 inline scripts (hydration data)
      // 參考: https://web.dev/articles/strict-csp
      // 參考: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
      // 策略說明:
      // - 'unsafe-inline': 允許 SSG 動態生成的 inline scripts (每次構建 hash 都會變)
      // - 'strict-dynamic': CSP L3 - 對支持的瀏覽器忽略 unsafe-inline，允許信任 script 加載其他 script
      // 安全考量: Vite SSG inline scripts 是構建時靜態生成，無 XSS 風險
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'strict-dynamic' https://static.cloudflareinsights.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "object-src 'none'; " +
        'upgrade-insecure-requests;',

      // Trusted Types Report-Only - 監控但不阻擋
      // 允許 default 和 ratewise#default policies
      'Content-Security-Policy-Report-Only':
        "require-trusted-types-for 'script'; " +
        "trusted-types default ratewise#default 'allow-duplicates';",

      // 基礎安全標頭
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // HSTS - 強制 HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      // Permissions Policy - 限制瀏覽器功能
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    };

    // 應用安全標頭
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // 移除可能洩漏資訊的標頭
    newResponse.headers.delete('Server');
    newResponse.headers.delete('X-Powered-By');

    return newResponse;
  },
};
