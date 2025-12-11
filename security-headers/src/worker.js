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
		// 邊緣僅保留無法由 <meta> 生效的 CSP 指令，避免靜態 header 阻擋 hash-based inline script/style。
		const securityHeaders = {
			'Content-Security-Policy':
				"frame-ancestors 'self'; " +
				"base-uri 'self'; " +
				"form-action 'self'; " +
				"object-src 'none'; " +
				'report-uri /csp-report; report-to csp-endpoint;',

			// Trusted Types Report-Only - 監控但不阻擋
			'Content-Security-Policy-Report-Only':
				"require-trusted-types-for 'script'; trusted-types default ratewise#default 'allow-duplicates';",

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
