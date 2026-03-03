/**
 * Cloudflare Worker - Security Headers (SSOT) v3.2
 *
 * 目標：
 * 1. Cloudflare 成為安全標頭唯一來源
 * 2. RateWise / haotool.org/ratewise/ 保持 A+ 安全標頭評等
 * 3. 動態計算 inline script SHA-256 hash，移除 unsafe-inline
 * 4. haotool.org / www.haotool.org 根站達到 A+ 評等
 * 5. GA4 / GTM-W4LKKNL 不被 CSP 阻擋
 * 6. Zeabur 來源標頭對外隱藏
 *
 * 設計原則：
 * - CSP 僅套用在 text/html，避免非 HTML 資源帶上不必要 header
 * - ratewise 路徑（任意 host）：動態計算 inline script hashes 取代 unsafe-inline
 * - haotool.org 非 ratewise 路徑：寬鬆基本標頭（達 A+ 最低要求）
 * - OG / social 圖片保留跨域例外
 * - COEP/COOP 僅對 ratewise 生效，避免未知跨域資源中斷
 */

const HSTS = 'max-age=31536000; includeSubDomains; preload';

/** 計算 HTML 中所有 inline script 的 SHA-256 hash（Web Crypto API） */
async function computeInlineScriptHashes(html) {
	const hashes = [];
	const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
	let m;
	while ((m = re.exec(html)) !== null) {
		const attrs = m[1];
		const content = m[2].trim();
		if (!attrs.includes('src') && content) {
			const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
			const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
			hashes.push(`'sha256-${b64}'`);
		}
	}
	return hashes;
}

/** ratewise CSP：script-src 使用動態 hash 取代 unsafe-inline */
function buildRatewiseCSP(scriptHashes) {
	const scriptSrc = ["'self'", ...scriptHashes, 'https://static.cloudflareinsights.com', 'https://www.googletagmanager.com'].join(' ');

	return (
		"default-src 'self'; " +
		`script-src ${scriptSrc}; ` +
		"style-src 'self' 'unsafe-inline'; " +
		"font-src 'self'; " +
		"img-src 'self' data: blob: https://www.google-analytics.com; " +
		"connect-src 'self' https://cdn.jsdelivr.net https://raw.githubusercontent.com https://static.cloudflareinsights.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com; " +
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

/** haotool.org 根站基本安全標頭（非 ratewise 路徑，達 A+ 最低要求） */
const HAOTOOL_BASE_HEADERS = {
	'Content-Security-Policy':
		"default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
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
		// 任意 host 下的 /ratewise/ 路徑均視為 ratewise（含 haotool.org/ratewise/）
		const isRatewise = url.pathname.startsWith('/ratewise/');

		if (url.pathname === '/ratewise/__network_probe__') {
			return new Response(null, {
				status: 204,
				headers: {
					'Cache-Control': 'no-store',
					'X-Security-Policy-Version': '3.2',
				},
			});
		}

		// CSP Report 端點
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
			// 緩衝 HTML body 以動態計算 inline script hashes（取代 unsafe-inline）
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
		newResponse.headers.set('X-Security-Policy-Version', '3.2');

		if (isOgAsset) {
			newResponse.headers.set('Access-Control-Allow-Origin', '*');
			newResponse.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
			newResponse.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
			newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
		} else if (isRatewise && !isOgLikeAsset(url.pathname)) {
			// 僅 ratewise 套用嚴格 cross-origin policy；haotool.org 根站保持瀏覽器預設
			newResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
			newResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
			newResponse.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		}

		// 移除洩漏來源資訊的標頭（含 Zeabur 特有標頭）
		['Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Runtime', 'x-zeabur-ip-country', 'x-zeabur-request-id'].forEach((h) =>
			newResponse.headers.delete(h),
		);

		return newResponse;
	},
};
