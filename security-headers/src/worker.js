/**
 * 安全標頭 Worker v3.5
 *
 * 本 Worker 為 HTTP 安全標頭的唯一來源（SSOT），統一管理所有路由的安全政策，
 * 無需修改應用程式原始碼。
 *
 * 路由策略：
 * - /ratewise/*  嚴格 CSP，動態計算 SHA-256 inline script hash 取代 unsafe-inline；
 *                啟用 COEP/COOP 跨域隔離；connect-src 相容 GA4 所需域名。
 * - haotool.org  寬鬆基準 CSP，符合 A+ 安全評等最低要求。
 * - OG 圖片資源  開放跨域存取，確保社群平台爬取正常運作。
 * - 所有路由     HSTS、X-Content-Type-Options、X-Frame-Options；
 *                移除洩漏來源資訊的上游標頭（Server、X-Powered-By 等）。
 *
 * CSP Hash 計算原則：
 * 使用 Web Crypto API（SHA-256）對 inline script 原始內容進行雜湊計算。
 * 內容不可正規化空白，瀏覽器以原始字元序列驗證。
 */

const HSTS = 'max-age=31536000; includeSubDomains; preload';

/** 解析 HTML 中所有 inline script，回傳 CSP 所需的 SHA-256 hash token 陣列。 */
async function computeInlineScriptHashes(html) {
	const hashes = [];
	const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
	let m;
	while ((m = re.exec(html)) !== null) {
		const attrs = m[1];
		const content = m[2]; // 保留原始空白，不可正規化；瀏覽器以原始字元序列驗證 hash。
		if (!attrs.includes('src') && content) {
			const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
			const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
			hashes.push(`'sha256-${b64}'`);
		}
	}
	return hashes;
}

/** 組建 /ratewise/* 路由的 Content-Security-Policy 標頭值。 */
function buildRatewiseCSP(scriptHashes) {
	const scriptSrc = ["'self'", ...scriptHashes, 'https://static.cloudflareinsights.com', 'https://www.googletagmanager.com'].join(' ');

	return (
		"default-src 'self'; " +
		`script-src ${scriptSrc}; ` +
		"style-src 'self' 'unsafe-inline'; " +
		"font-src 'self'; " +
		"img-src 'self' data: blob: https://www.google-analytics.com; " +
		"connect-src 'self' https://cdn.jsdelivr.net https://raw.githubusercontent.com https://static.cloudflareinsights.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; " +
		"worker-src 'self' blob:; " +
		"manifest-src 'self'; " +
		"frame-ancestors 'self'; " +
		"base-uri 'self'; " +
		"form-action 'self'; " +
		"object-src 'none'; " +
		'upgrade-insecure-requests; ' +
		'report-uri /ratewise/csp-report; report-to csp-endpoint;'
	);
}

/** 非 ratewise 路由的基準安全標頭組合，符合 A+ 安全評等要求。 */
const HAOTOOL_BASE_HEADERS = {
	'Content-Security-Policy':
		"default-src 'self' 'unsafe-inline' https:; " +
		'img-src * data: blob:; ' +
		"frame-ancestors 'self'; " +
		"base-uri 'self'; " +
		"object-src 'none';",
	'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=()',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'SAMEORIGIN',
	'X-Permitted-Cross-Domain-Policies': 'none',
};

function isOgLikeAsset(pathname) {
	return (
		pathname.endsWith('/og-image.png') || pathname.endsWith('/twitter-image.png') || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname)
	);
}

export default {
	async fetch(request) {
		const url = new URL(request.url);
		// 所有已綁定路由中，路徑以 /ratewise/ 開頭者均套用 ratewise 政策。
		const isRatewise = url.pathname.startsWith('/ratewise/');

		if (url.pathname === '/ratewise/__network_probe__') {
			return new Response(null, {
				status: 204,
				headers: {
					'Cache-Control': 'no-store',
					'X-Security-Policy-Version': '3.5',
				},
			});
		}

		// CSP 違規回報收集端點。
		if (url.pathname === '/ratewise/csp-report') {
			return new Response(null, {
				status: 204,
				headers: { 'Cache-Control': 'no-store' },
			});
		}

		const response = await fetch(request);
		const contentType = response.headers.get('content-type') || '';
		const isHTML = contentType.startsWith('text/html');

		const isOgAsset =
			url.pathname.startsWith('/ratewise/') && (url.pathname.endsWith('/og-image.png') || url.pathname.endsWith('/twitter-image.png'));

		let newResponse;

		if (isRatewise && isHTML) {
			// 緩衝完整 HTML body，逐回應動態計算 inline script hash。
			const html = await response.text();
			const scriptHashes = await computeInlineScriptHashes(html);
			const csp = buildRatewiseCSP(scriptHashes);

			newResponse = new Response(html, response);
			newResponse.headers.set('Content-Security-Policy', csp);
			newResponse.headers.set(
				'Content-Security-Policy-Report-Only',
				"require-trusted-types-for 'script'; trusted-types default ratewise#default 'allow-duplicates'; report-uri /ratewise/csp-report;",
			);
			newResponse.headers.set(
				'Permissions-Policy',
				'geolocation=(), microphone=(), camera=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=()',
			);
			newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
			newResponse.headers.set('X-Content-Type-Options', 'nosniff');
			newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
			newResponse.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
			newResponse.headers.set('Reporting-Endpoints', `csp-endpoint="https://${url.host}/ratewise/csp-report"`);
		} else if (!isRatewise && isHTML) {
			newResponse = new Response(response.body, response);
			Object.entries(HAOTOOL_BASE_HEADERS).forEach(([k, v]) => newResponse.headers.set(k, v));
		} else {
			newResponse = new Response(response.body, response);
		}

		newResponse.headers.set('Strict-Transport-Security', HSTS);
		newResponse.headers.set('X-Security-Policy-Version', '3.5');

		if (isOgAsset) {
			newResponse.headers.set('Access-Control-Allow-Origin', '*');
			newResponse.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
			newResponse.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
			newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
		} else if (isRatewise && !isOgLikeAsset(url.pathname)) {
			// /ratewise/* 套用嚴格跨域隔離；根網域保持瀏覽器預設值。
			newResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
			newResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
			newResponse.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		}

		// 移除可能洩漏後端基礎架構資訊的回應標頭。
		['Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Runtime', 'x-zeabur-ip-country', 'x-zeabur-request-id'].forEach((h) =>
			newResponse.headers.delete(h),
		);

		return newResponse;
	},
};
