/* global HTMLRewriter */

/**
 * 安全標頭 Worker v4.5
 *
 * 本 Worker 僅處理 Cloudflare 無法以固定規則精準表達的安全邏輯。
 * 固定站點級政策（例如 HSTS）由 Cloudflare Edge 管理；
 * Worker 專注於路由分層 CSP、CSP report、分享圖 CORS 與 ratewise 跨域隔離。
 *
 * 變更記錄：
 * - v4.5: 移除 Rocket Loader 繞過措施（data-cfasync="false"）；已在 Cloudflare Dashboard 關閉 Rocket Loader
 * - v4.4: 修正 Rocket Loader 干擾 vite-react-ssg 骨架屏卡死問題
 *         → InlineScriptNonceInjector 注入 data-cfasync="false"，防止 Rocket Loader 修改 type 屬性
 * - v4.3: 修正上游 .webmanifest 雙重 Content-Type（application/octet-stream, application/manifest+json）
 *         → 強制設為 application/manifest+json，避免 Safari 觸發下載而非解析 PWA manifest
 * - v4.2: 缺檔靜態資產改回 no-store，避免 Cloudflare 邊緣保留 stale 404 造成 SW precache 安裝失敗
 * - v4.1: 統一所有 HTML profile 的 Cache-Control（no-cache, must-revalidate）；
 *         移除上游 Expires 雜訊；OG 圖片 Cache-Control 正規化，消除 Zeabur 上游重複 token
 * - v4.0: app.haotool.org/* 納入統一保護；RateWise 改為 nonce 型 CSP + 串流 HTMLRewriter；
 *         CSP report 端點加入 method/content-type 防護；分享圖白名單改為 SSOT 檔名
 * - v3.9: 修復 PWA 冷啟動失效：COEP/COOP 移至 isHTML 分支，非 HTML 的 ratewise 靜態資源僅保留 CORP
 * - v3.8: 效能最佳化：ratewise HTML 移除 no-store 啟用 BFCache；Vite 靜態資源設 max-age=31536000, immutable
 * - v3.7: CSP-Report-Only 新增 goog#html TrustedType，修復 Google Analytics 違規 console 噪音
 * - v3.6: 改用 HTMLRewriter 解析 inline script，避免以 regex 掃描 HTML 觸發 CodeQL `js/bad-tag-filter`
 */

const SECURITY_POLICY_VERSION = '4.5';
const CSP_REPORT_MAX_BYTES = 16 * 1024;
const HASHED_ASSET_PATH = /^\/(?:[^/]+\/)?assets\/[^/]+-[A-Za-z0-9_-]{6,12}\.(?:js|css|mjs)$/;

const DEFAULT_PERMISSIONS_POLICY =
	'geolocation=(), microphone=(), camera=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=()';
const PARK_KEEPER_PERMISSIONS_POLICY =
	'geolocation=(self), microphone=(), camera=(), payment=(), accelerometer=(self), gyroscope=(self), magnetometer=(self), usb=()';
const CANONICAL_ROOT_HOST = 'haotool.org';
const WWW_HOST = 'www.haotool.org';

const BASE_RESPONSE_HEADERS = {
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'SAMEORIGIN',
	'X-Permitted-Cross-Domain-Policies': 'none',
};

const RATEWISE_REPORT_ONLY =
	"require-trusted-types-for 'script'; trusted-types default ratewise#default goog#html 'allow-duplicates'; report-uri /ratewise/csp-report;";
const RATEWISE_REPORTING_ENDPOINT = 'csp-endpoint';
const CLOUDFLARE_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';

const APP_HOST = 'app.haotool.org';
const ROOT_SITE_HOSTS = new Set(['haotool.org', 'www.haotool.org']);
const HAOTOOL_ROOT_HTML_PATHS = new Set(['/', '/projects/', '/about/', '/contact/']);

const PUBLIC_SHARE_ASSET_PATHS = new Set([
	'/og-image.png',
	'/ratewise/og-image.jpg',
	'/ratewise/twitter-image.jpg',
	'/ratewise/og-image.png',
	'/ratewise/twitter-image.png',
	'/nihonname/og-image.png',
	'/nihonname/og-image.svg',
	'/park-keeper/og-image.svg',
	'/quake-school/og-image.svg',
]);

function createHtmlProfile({
	scriptMode,
	scriptSources = [],
	styleSources = [],
	fontSources = [],
	imgSources = [],
	connectSources = [],
	permissionsPolicy = DEFAULT_PERMISSIONS_POLICY,
	enableCrossOriginIsolation = false,
	enableRatewiseReporting = false,
	// no-cache 允許 BFCache 存入；must-revalidate 確保 SW 更新後使用者取得最新 HTML。
	htmlCacheControl = 'no-cache, must-revalidate',
}) {
	return {
		scriptMode,
		scriptSources,
		styleSources,
		fontSources,
		imgSources,
		connectSources,
		permissionsPolicy,
		enableCrossOriginIsolation,
		enableRatewiseReporting,
		htmlCacheControl,
	};
}

const FALLBACK_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'unsafe-inline',
	scriptSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
	styleSources: ['https://fonts.googleapis.com', 'https://unpkg.com'],
	fontSources: ['https://fonts.gstatic.com'],
	imgSources: ['https:'],
	connectSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
});

const HAOTOOL_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'unsafe-inline',
	scriptSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
	styleSources: ['https://fonts.googleapis.com'],
	fontSources: ['https://fonts.gstatic.com'],
	connectSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
});

const NIHONNAME_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'unsafe-inline',
	scriptSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
	styleSources: ['https://fonts.googleapis.com'],
	fontSources: ['https://fonts.gstatic.com'],
	imgSources: ['https://www.transparenttextures.com'],
	connectSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
});

const PARK_KEEPER_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'nonce',
	scriptSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
	styleSources: ['https://fonts.googleapis.com', 'https://unpkg.com'],
	fontSources: ['https://fonts.gstatic.com'],
	imgSources: ['https://wmts.nlsc.gov.tw', 'https://*.basemaps.cartocdn.com'],
	connectSources: [CLOUDFLARE_INSIGHTS_SCRIPT, 'https://wmts.nlsc.gov.tw', 'https://*.basemaps.cartocdn.com'],
	permissionsPolicy: PARK_KEEPER_PERMISSIONS_POLICY,
});

const QUAKE_SCHOOL_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'unsafe-inline',
	scriptSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
	styleSources: ['https://fonts.googleapis.com'],
	fontSources: ['https://fonts.gstatic.com'],
	connectSources: [CLOUDFLARE_INSIGHTS_SCRIPT],
});

const RATEWISE_HTML_PROFILE = createHtmlProfile({
	scriptMode: 'nonce',
	scriptSources: ['https://static.cloudflareinsights.com', 'https://www.googletagmanager.com'],
	imgSources: ['https://www.google-analytics.com'],
	connectSources: [
		'https://cdn.jsdelivr.net',
		'https://raw.githubusercontent.com',
		'https://static.cloudflareinsights.com',
		'https://www.google-analytics.com',
		'https://region1.google-analytics.com',
		'https://analytics.google.com',
		'https://www.googletagmanager.com',
	],
	enableCrossOriginIsolation: true,
	enableRatewiseReporting: true,
});

function joinSources(sources) {
	return [...new Set(sources)].join(' ');
}

function normalizeHtmlPath(pathname) {
	if (pathname === '' || pathname === '/') {
		return '/';
	}

	return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function resolveHtmlProfile(url) {
	if (url.pathname.startsWith('/ratewise/')) {
		return RATEWISE_HTML_PROFILE;
	}

	if (url.pathname.startsWith('/nihonname/')) {
		return NIHONNAME_HTML_PROFILE;
	}

	if (url.pathname.startsWith('/park-keeper/')) {
		return PARK_KEEPER_HTML_PROFILE;
	}

	if (url.pathname.startsWith('/quake-school/')) {
		return QUAKE_SCHOOL_HTML_PROFILE;
	}

	if (ROOT_SITE_HOSTS.has(url.host)) {
		return HAOTOOL_HTML_PROFILE;
	}

	if (url.host === APP_HOST && HAOTOOL_ROOT_HTML_PATHS.has(normalizeHtmlPath(url.pathname))) {
		return HAOTOOL_HTML_PROFILE;
	}

	return FALLBACK_HTML_PROFILE;
}

function buildNonce() {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes));
}

function buildContentSecurityPolicy(profile, nonce = null) {
	const scriptSources =
		profile.scriptMode === 'nonce' && nonce !== null
			? ["'self'", `'nonce-${nonce}'`, ...profile.scriptSources]
			: ["'self'", "'unsafe-inline'", ...profile.scriptSources];

	const directives = [
		"default-src 'self'",
		`script-src ${joinSources(scriptSources)}`,
		`style-src ${joinSources(["'self'", "'unsafe-inline'", ...profile.styleSources])}`,
		`font-src ${joinSources(["'self'", ...profile.fontSources])}`,
		`img-src ${joinSources(["'self'", 'data:', 'blob:', ...profile.imgSources])}`,
		`connect-src ${joinSources(["'self'", ...profile.connectSources])}`,
		"worker-src 'self' blob:",
		"manifest-src 'self'",
		"frame-ancestors 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'",
		'upgrade-insecure-requests',
	];

	if (profile.enableRatewiseReporting) {
		directives.push(`report-uri /ratewise/csp-report`, `report-to ${RATEWISE_REPORTING_ENDPOINT}`);
	}

	return `${directives.join('; ')};`;
}

class InlineScriptNonceInjector {
	constructor(nonce) {
		this.nonce = nonce;
	}

	element(element) {
		if (element.getAttribute('src') === null) {
			element.setAttribute('nonce', this.nonce);
		}
	}
}

function rewriteHtmlWithNonce(response, nonce) {
	return new HTMLRewriter().on('script', new InlineScriptNonceInjector(nonce)).transform(response);
}

function isPublicShareAssetPath(pathname) {
	return PUBLIC_SHARE_ASSET_PATHS.has(pathname);
}

function isImmutableHashedAsset(pathname) {
	return HASHED_ASSET_PATH.test(pathname);
}

function isStaticAssetPath(pathname) {
	return pathname.includes('/assets/') || isImmutableHashedAsset(pathname);
}

function applyHtmlSecurityHeaders(response, url, profile, nonce) {
	// Expires 由上游產生，與 Cache-Control 語義重疊，依 RFC 7234 §5.3 應以 Cache-Control 為準。
	response.headers.delete('Expires');

	response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(profile, nonce));
	response.headers.set('Permissions-Policy', profile.permissionsPolicy);
	response.headers.set('Cache-Control', profile.htmlCacheControl);

	Object.entries(BASE_RESPONSE_HEADERS).forEach(([name, value]) => {
		response.headers.set(name, value);
	});

	if (profile.enableRatewiseReporting) {
		response.headers.set('Content-Security-Policy-Report-Only', RATEWISE_REPORT_ONLY);
		response.headers.set('Reporting-Endpoints', `${RATEWISE_REPORTING_ENDPOINT}="https://${url.host}/ratewise/csp-report"`);
	}

	if (profile.enableCrossOriginIsolation) {
		response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
		response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
		response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	}
}

function normalizeCspReports(payload) {
	if (Array.isArray(payload)) {
		return payload
			.map((entry) => {
				if (entry && typeof entry === 'object' && entry.type === 'csp-violation') {
					return entry.body ?? null;
				}

				return entry;
			})
			.filter(Boolean);
	}

	if (payload && typeof payload === 'object' && payload['csp-report']) {
		return [payload['csp-report']];
	}

	return payload ? [payload] : [];
}

function sanitizeCspReport(report) {
	return {
		documentUri: report['document-uri'] ?? report.documentURL ?? null,
		effectiveDirective: report['effective-directive'] ?? report.effectiveDirective ?? null,
		blockedUri: report['blocked-uri'] ?? report.blockedURL ?? null,
		sourceFile: report['source-file'] ?? report.sourceFile ?? null,
		disposition: report.disposition ?? null,
		statusCode: report['status-code'] ?? report.statusCode ?? null,
	};
}

async function handleCspReport(request) {
	const baseHeaders = {
		'Cache-Control': 'no-store',
	};

	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: {
				...baseHeaders,
				Allow: 'POST',
			},
		});
	}

	const contentType = request.headers.get('content-type') || '';
	const supportedContentTypes = ['application/csp-report', 'application/reports+json', 'application/json'];

	if (contentType !== '' && !supportedContentTypes.some((type) => contentType.includes(type))) {
		return new Response('Unsupported Media Type', {
			status: 415,
			headers: baseHeaders,
		});
	}

	const contentLength = Number(request.headers.get('content-length') || '0');
	if (Number.isFinite(contentLength) && contentLength > CSP_REPORT_MAX_BYTES) {
		return new Response('Payload Too Large', {
			status: 413,
			headers: baseHeaders,
		});
	}

	const bodyText = await request.text();
	if (bodyText.length > CSP_REPORT_MAX_BYTES) {
		return new Response('Payload Too Large', {
			status: 413,
			headers: baseHeaders,
		});
	}

	if (bodyText !== '') {
		try {
			const payload = JSON.parse(bodyText);
			normalizeCspReports(payload)
				.slice(0, 5)
				.forEach((report) => {
					globalThis.console.warn('csp-report', JSON.stringify(sanitizeCspReport(report)));
				});
		} catch (error) {
			globalThis.console.warn('csp-report-invalid-json', String(error));
		}
	}

	return new Response(null, {
		status: 204,
		headers: baseHeaders,
	});
}

function stripOriginLeakHeaders(response) {
	['Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Runtime', 'x-zeabur-ip-country', 'x-zeabur-request-id'].forEach((name) =>
		response.headers.delete(name),
	);
}

export default {
	async fetch(request) {
		const url = new URL(request.url);
		const isRatewisePath = url.pathname.startsWith('/ratewise/');
		const isStaticAsset = isStaticAssetPath(url.pathname);

		if (url.host === WWW_HOST) {
			url.host = CANONICAL_ROOT_HOST;
			return Response.redirect(url.toString(), 308);
		}

		if (url.pathname === '/ratewise/__network_probe__') {
			return new Response(null, {
				status: 204,
				headers: {
					'Cache-Control': 'no-store',
					'X-Security-Policy-Version': SECURITY_POLICY_VERSION,
				},
			});
		}

		if (url.pathname === '/ratewise/csp-report') {
			return handleCspReport(request);
		}

		const upstreamResponse = await fetch(request);
		const contentType = upstreamResponse.headers.get('content-type') || '';
		const isHTML = contentType.startsWith('text/html') && !isStaticAsset;
		const isPublicShareAsset = isPublicShareAssetPath(url.pathname);

		let response;

		if (isHTML) {
			const profile = resolveHtmlProfile(url);
			const nonce = profile.scriptMode === 'nonce' ? buildNonce() : null;
			const htmlResponse = new Response(upstreamResponse.body, upstreamResponse);
			const rewrittenResponse =
				profile.scriptMode === 'nonce' && nonce !== null && request.method !== 'HEAD'
					? rewriteHtmlWithNonce(htmlResponse, nonce)
					: htmlResponse;

			response = new Response(rewrittenResponse.body, rewrittenResponse);
			response.headers.delete('Content-Length');
			applyHtmlSecurityHeaders(response, url, profile, nonce);
		} else {
			response = new Response(upstreamResponse.body, upstreamResponse);

			if (isImmutableHashedAsset(url.pathname)) {
				response.headers.set('Cache-Control', 'max-age=31536000, public, immutable');
			} else if (url.pathname.endsWith('.webmanifest')) {
				// 修正上游雙重 Content-Type，確保瀏覽器正確解析為 PWA manifest 而非觸發下載。
				response.headers.set('Content-Type', 'application/manifest+json');
			}
		}

		response.headers.set('X-Security-Policy-Version', SECURITY_POLICY_VERSION);

		if (isPublicShareAsset) {
			// 社群平台爬取需跨域存取，COEP/COOP 降為 unsafe-none 並開放 CORS。
			response.headers.set('Cache-Control', 'max-age=86400, public');
			response.headers.set('Access-Control-Allow-Origin', '*');
			response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
			response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
			response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
		} else if (isStaticAsset && upstreamResponse.status >= 400) {
			// 部署切換期間若短暫命中缺檔，禁止 Cloudflare/瀏覽器保留 stale 404。
			response.headers.delete('Expires');
			response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
			response.headers.set('CDN-Cache-Control', 'no-store');
			response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
			response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		} else if (isRatewisePath && !isHTML) {
			// ratewise 靜態資源保留 same-origin，避免被第三方站點嵌入。
			response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		}

		stripOriginLeakHeaders(response);
		return response;
	},
};
