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
 * - [MDN: CSP script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
 *
 * 最後更新：2025-11-29
 *
 * ⚠️ 重要：不要使用 'strict-dynamic'！
 * - strict-dynamic 會忽略 'self' 和域名白名單
 * - SSG 無法使用 nonce-based CSP（沒有 server runtime）
 * - 結果：所有 scripts 被阻擋，頁面完全失效
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
			// [fix:2025-11-29] 移除 strict-dynamic（SSG 無 server runtime 無法生成 nonce）
			// 參考: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
			//
			// ⚠️ 為什麼不使用 strict-dynamic:
			// 1. strict-dynamic 會忽略 'self' 和域名白名單（CSP L3 設計行為）
			// 2. strict-dynamic 需要 nonce 或 hash，但 SSG 無法生成動態 nonce
			// 3. Vite 的動態 chunk splitting 無法使用靜態 hash
			//
			// 策略說明:
			// - 'self': 只允許同源 scripts
			// - 'unsafe-inline': 允許 Vite SSG 生成的 inline scripts (__staticRouterHydrationData)
			// - https://static.cloudflareinsights.com: Cloudflare Analytics
			//
			// 安全考量: Vite SSG inline scripts 是構建時靜態生成，無 XSS 風險
			'Content-Security-Policy':
				"default-src 'self'; " +
				"script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; " +
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
				"require-trusted-types-for 'script'; " + "trusted-types default ratewise#default 'allow-duplicates';",

			// 基礎安全標頭
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'SAMEORIGIN',
			'Referrer-Policy': 'strict-origin-when-cross-origin',

			// HSTS - 強制 HTTPS
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

			// Permissions Policy - 限制瀏覽器功能
			'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

			// Cross-Origin 隔離標頭 - 增強安全性
			// 參考: https://web.dev/cross-origin-isolation-guide/
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Resource-Policy': 'same-origin',
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
