/* global HTMLRewriter, performance */

/**
 * 安全標頭 Worker v4.8
 *
 * 處理 Cloudflare 無法以固定規則精準表達的安全邏輯。
 * 固定站點級政策由 Cloudflare Edge 管理，Worker 專注於路由分層 CSP、
 * CSP report、分享圖 CORS 與 ratewise 跨域隔離。
 *
 * 變更記錄：
 * - v4.8: 新增 AI 爬蟲存取記錄，追蹤 llms.txt 與 Markdown 鏡像存取頻率
 * - v4.7: 新增 Server-Timing 診斷標頭，記錄 fetch 與 rewrite 耗時
 * - v4.6: 新增穩定公開資產快取，logo.png 等設 7 天 public 快取
 * - v4.5: 移除 Rocket Loader 繞過措施，已於 Dashboard 關閉
 * - v4.4: 修正 Rocket Loader 干擾骨架屏問題
 * - v4.3: 修正 webmanifest 雙重 Content-Type 問題
 * - v4.2: 缺檔靜態資產改回 no-store，避免 stale 404
 * - v4.1: 統一 HTML Cache-Control，移除上游 Expires
 * - v4.0: 全站納入保護，改為 nonce 型 CSP
 * - v3.9: 修復 PWA 冷啟動失效，COEP/COOP 移至 HTML 分支
 * - v3.8: 效能最佳化，啟用 BFCache，靜態資源設 immutable
 * - v3.7: CSP-Report-Only 新增 goog#html TrustedType
 * - v3.6: 改用 HTMLRewriter 解析 inline script
 */

const SECURITY_POLICY_VERSION = '4.8';
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
const ROOT_SITE_HOSTS = new Set(['haotool.org', 'www.haotool.org', APP_HOST]);
const ROOT_SITE_HTML_HOSTS = new Set(['haotool.org', 'www.haotool.org']);
const HAOTOOL_ROOT_HTML_PATHS = new Set(['/', '/projects/', '/about/', '/contact/']);
const RATEWISE_MARKDOWN_MIRROR = '/ratewise/index.md';
const CONTENT_SIGNAL_HEADER = 'Content-Signal: ai-train=no, search=yes, ai-input=no';

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

/** 穩定公開資產路徑，設 7 天快取。 */
const STABLE_PUBLIC_ASSET_PATHS = new Set(['/ratewise/logo.png']);

/** AI 爬蟲 User-Agent 關鍵字，與 robots.txt 允許清單一致。 */
const AI_CRAWLER_PATTERNS = [
	'GPTBot',
	'ClaudeBot',
	'PerplexityBot',
	'Google-Extended',
	'GrokBot',
	'Applebot-Extended',
	'cohere-ai',
	'AI2Bot',
	'Amazonbot',
	'anthropic-ai',
	'Bytespider',
	'CCBot',
	'ChatGLMBot',
	'Diffbot',
	'FacebookBot',
	'meta-externalagent',
	'OAI-SearchBot',
	'YouBot',
];

/** LLM 可讀文件路徑。 */
const LLM_DOC_PATHS = new Set([
	'/ratewise/llms.txt',
	'/ratewise/llms-full.txt',
	'/nihonname/llms.txt',
	'/park-keeper/llms.txt',
	'/quake-school/llms.txt',
]);

/** 檢測是否為已知 AI 爬蟲。 */
function detectAiCrawler(userAgent) {
	if (!userAgent) return null;
	for (const pattern of AI_CRAWLER_PATTERNS) {
		if (userAgent.includes(pattern)) {
			return pattern;
		}
	}
	return null;
}

/** 檢測是否為 LLM 文件或 Markdown 鏡像。 */
function isLlmDocPath(pathname) {
	return LLM_DOC_PATHS.has(pathname) || pathname.endsWith('.md');
}

function isMarkdownRequest(request) {
	const accept = request.headers.get('accept') || '';
	return accept.includes('text/markdown') || accept.includes('text/x-markdown');
}

function isRatewiseHomepage(pathname) {
	return pathname === '/ratewise/' || pathname === '/ratewise';
}

function shouldServeRatewiseMarkdown(request, pathname, isRootHost) {
	if (request.method !== 'GET') {
		return false;
	}

	if (!isMarkdownRequest(request)) {
		return false;
	}

	return isRatewiseHomepage(pathname) || (isRootHost && pathname === '/');
}

function shouldInjectRatewiseMarkdownLink(pathname, isRootHost) {
	return isRatewiseHomepage(pathname) || (isRootHost && pathname === '/');
}

function addLinkHeader(response, headerValue) {
	const existing = response.headers.get('Link');
	if (existing == null || existing === '') {
		response.headers.set('Link', headerValue);
		return;
	}

	if (!existing.includes(headerValue)) {
		response.headers.set('Link', `${existing}, ${headerValue}`);
	}
}

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
	if (ROOT_SITE_HTML_HOSTS.has(url.host)) {
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

function isStablePublicAssetPath(pathname) {
	return STABLE_PUBLIC_ASSET_PATHS.has(pathname);
}

function isImmutableHashedAsset(pathname) {
	return HASHED_ASSET_PATH.test(pathname);
}

function isStaticAssetPath(pathname) {
	return pathname.includes('/assets/') || isImmutableHashedAsset(pathname);
}

function applyHtmlSecurityHeaders(response, url, profile, nonce) {
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
	const baseHeaders = { 'Cache-Control': 'no-store' };

	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: { ...baseHeaders, Allow: 'POST' },
		});
	}

	const contentType = request.headers.get('content-type') || '';
	const supportedContentTypes = ['application/csp-report', 'application/reports+json', 'application/json'];

	if (contentType !== '' && !supportedContentTypes.some((type) => contentType.includes(type))) {
		return new Response('Unsupported Media Type', { status: 415, headers: baseHeaders });
	}

	const contentLength = Number(request.headers.get('content-length') || '0');
	if (Number.isFinite(contentLength) && contentLength > CSP_REPORT_MAX_BYTES) {
		return new Response('Payload Too Large', { status: 413, headers: baseHeaders });
	}

	const bodyText = await request.text();
	if (bodyText.length > CSP_REPORT_MAX_BYTES) {
		return new Response('Payload Too Large', { status: 413, headers: baseHeaders });
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

	return new Response(null, { status: 204, headers: baseHeaders });
}

function stripOriginLeakHeaders(response) {
	['Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Runtime', 'x-zeabur-ip-country', 'x-zeabur-request-id'].forEach((name) =>
		response.headers.delete(name),
	);
}

/**
 * 構建 Server-Timing 標頭，格式遵循 RFC 8941。
 * @param {Object} timings - 各階段耗時（毫秒）
 * @returns {string} Server-Timing 標頭值
 */
function buildServerTiming(timings) {
	const entries = [];
	if (timings.fetch != null) {
		entries.push(`fetch;dur=${timings.fetch.toFixed(1)};desc="upstream fetch"`);
	}
	if (timings.rewrite != null) {
		entries.push(`rewrite;dur=${timings.rewrite.toFixed(1)};desc="html nonce rewrite"`);
	}
	if (timings.total != null) {
		entries.push(`total;dur=${timings.total.toFixed(1)};desc="worker total"`);
	}
	return entries.join(', ');
}

export default {
	async fetch(request) {
		const workerStart = performance.now();
		const url = new URL(request.url);
		const isRatewisePath = url.pathname.startsWith('/ratewise/');
		const isRootSiteHost = ROOT_SITE_HOSTS.has(url.host);
		const isStaticAsset = isStaticAssetPath(url.pathname);
		const isRatewiseHomeMarkdown = shouldServeRatewiseMarkdown(request, url.pathname, isRootSiteHost);
		const markdownMirrorUrl = new URL(RATEWISE_MARKDOWN_MIRROR, request.url);
		const upstreamUrl = isRatewiseHomeMarkdown ? new URL(RATEWISE_MARKDOWN_MIRROR, request.url) : url;

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
					'Server-Timing': buildServerTiming({ total: performance.now() - workerStart }),
				},
			});
		}

		if (url.pathname === '/ratewise/csp-report') {
			return handleCspReport(request);
		}

		const fetchStart = performance.now();
		const shouldRewriteRobotsTxt = isRootSiteHost && url.pathname === '/robots.txt';
		const upstreamHeaders = new globalThis.Headers(request.headers);
		if (shouldRewriteRobotsTxt) {
			upstreamHeaders.delete('if-none-match');
			upstreamHeaders.delete('if-modified-since');
		}
		const upstreamRequestInit = {
			method: request.method,
			headers: upstreamHeaders,
			redirect: request.redirect,
		};

		if (request.method !== 'GET' && request.method !== 'HEAD' && request.body != null) {
			upstreamRequestInit.body = request.body;
		}

		const upstreamResponse = await fetch(upstreamUrl.toString(), upstreamRequestInit);
		const fetchDuration = performance.now() - fetchStart;

		const contentType = upstreamResponse.headers.get('content-type') || '';
		const isHTML = contentType.startsWith('text/html') && !isStaticAsset;
		const isPublicShareAsset = isPublicShareAssetPath(url.pathname);
		const isStablePublicAsset = isStablePublicAssetPath(url.pathname);

		let response;
		let rewriteDuration = null;

		if (isHTML) {
			const profile = resolveHtmlProfile(url);
			const nonce = profile.scriptMode === 'nonce' ? buildNonce() : null;
			const htmlResponse = new Response(upstreamResponse.body, upstreamResponse);

			let rewrittenResponse;
			if (profile.scriptMode === 'nonce' && nonce !== null && request.method !== 'HEAD') {
				const rewriteStart = performance.now();
				rewrittenResponse = rewriteHtmlWithNonce(htmlResponse, nonce);
				rewriteDuration = performance.now() - rewriteStart;
			} else {
				rewrittenResponse = htmlResponse;
			}

			response = new Response(rewrittenResponse.body, rewrittenResponse);
			response.headers.delete('Content-Length');
			applyHtmlSecurityHeaders(response, url, profile, nonce);
		} else {
			if (shouldRewriteRobotsTxt) {
				const robotsText = await upstreamResponse.text();
				const robotsWithSignal = robotsText.includes('Content-Signal:') ? robotsText : `${robotsText}\n${CONTENT_SIGNAL_HEADER}\n`;

				response = new Response(robotsWithSignal, {
					status: upstreamResponse.status,
					headers: upstreamResponse.headers,
				});
				response.headers.set('Content-Type', 'text/plain; charset=utf-8');
				response.headers.delete('Content-Length');
				response.headers.delete('ETag');
				response.headers.delete('Last-Modified');
			} else {
				response = new Response(upstreamResponse.body, upstreamResponse);
			}

			if (isImmutableHashedAsset(url.pathname)) {
				response.headers.set('Cache-Control', 'max-age=31536000, public, immutable');
			} else if (url.pathname.endsWith('.webmanifest')) {
				response.headers.set('Content-Type', 'application/manifest+json');
			}
		}

		response.headers.set('X-Security-Policy-Version', SECURITY_POLICY_VERSION);

		const timings = {
			fetch: fetchDuration,
			rewrite: rewriteDuration,
			total: performance.now() - workerStart,
		};
		response.headers.set('Server-Timing', buildServerTiming(timings));

		if (isPublicShareAsset) {
			response.headers.set('Cache-Control', 'max-age=86400, public');
			response.headers.set('Access-Control-Allow-Origin', '*');
			response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
			response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
			response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
		} else if (isStablePublicAsset) {
			response.headers.set('Cache-Control', 'max-age=604800, public');
			response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		} else if (isStaticAsset && upstreamResponse.status >= 400) {
			response.headers.delete('Expires');
			response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
			response.headers.set('CDN-Cache-Control', 'no-store');
			response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
			response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		} else if (isRatewisePath && !isHTML) {
			response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		}

		if (shouldInjectRatewiseMarkdownLink(url.pathname, isRootSiteHost) && isHTML) {
			addLinkHeader(response, `<${markdownMirrorUrl.toString()}>; rel="alternate"; type="text/markdown"`);
		}

		stripOriginLeakHeaders(response);

		const userAgent = request.headers.get('user-agent') || '';
		const aiCrawler = detectAiCrawler(userAgent);
		if (aiCrawler && isLlmDocPath(url.pathname)) {
			globalThis.console.log(
				JSON.stringify({
					type: 'ai-crawler-access',
					crawler: aiCrawler,
					path: url.pathname,
					status: response.status,
					timestamp: new Date().toISOString(),
				}),
			);
		}

		return response;
	},
};
