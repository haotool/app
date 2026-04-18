#!/usr/bin/env node
/**
 * verify-seo-ssot.mjs — SEO SSOT 驗證腳本（適用於本站所有頁面）
 *
 * 驗證範圍：
 * - JSON-LD 結構化資料（schema type 正確性）
 * - canonical URL（HTTPS + trailing slash）
 * - meta description / title 非空
 * - sitemap.xml 格式 + URL 可達
 * - robots.txt 完整性
 * - 各頁面型態 schema 規則
 *
 * 用法：
 *   node scripts/verify-seo-ssot.mjs              # 只驗證生產環境
 *   node scripts/verify-seo-ssot.mjs local        # 只驗證本地 (localhost:4173)
 *   node scripts/verify-seo-ssot.mjs both         # 兩者都跑
 *   BASE_URL=https://staging.example.com node scripts/verify-seo-ssot.mjs
 */

/* globals console:readonly, process:readonly, URL:readonly */

import https from 'node:https';
import http from 'node:http';
import { APP_INFO } from '../src/config/app-info.ts';

// ─── 常數 ────────────────────────────────────────────────────────────────────

const PROD_BASE = 'https://app.haotool.org/ratewise';
const LOCAL_BASE = 'http://localhost:4173/ratewise';
const TIMEOUT = 15_000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// ─── HTTP 工具 ────────────────────────────────────────────────────────────────

function fetch(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      url,
      { method, timeout: TIMEOUT, headers: { 'User-Agent': `${APP_INFO.shortName}-SEO-SSOT/1.0` } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

/** 跟隨最多 5 次 redirect，回傳最終回應 */
async function fetchFollow(url, max = 5) {
  let cur = url;
  let hops = 0;
  while (hops < max) {
    const res = await fetch(cur);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      const loc = res.headers.location;
      cur = loc.startsWith('http') ? loc : new URL(loc, cur).toString();
      hops++;
    } else {
      return { ...res, redirects: hops, finalUrl: cur };
    }
  }
  throw new Error(`Too many redirects from ${url}`);
}

// ─── HTML 解析工具 ────────────────────────────────────────────────────────────

/** 擷取所有 <script type="application/ld+json"> 並解析為物件 */
function extractJsonLd(html) {
  const schemas = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed['@graph']) {
        schemas.push(...parsed['@graph'].map((n) => ({ ...n, _source: 'graph' })));
      } else {
        schemas.push({ ...parsed, _source: 'standalone' });
      }
    } catch {
      schemas.push({ _parseError: true, _raw: m[1].slice(0, 80) });
    }
  }
  return schemas;
}

/** 從 HTML 提取指定 meta 內容 */
function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = re.exec(html) ?? /noop/.exec('');
  return m?.[1] ?? null;
}

/** 從 HTML 提取 <link rel="canonical"> href */
function extractCanonical(html) {
  const m = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html);
  return m?.[1] ?? null;
}

/** 從 HTML 提取 <title> */
function extractTitle(html) {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m?.[1]?.trim() ?? null;
}

/** 從 sitemap XML 提取所有 <loc> URL */
function extractSitemapUrls(xml) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

// ─── 斷言工具 ─────────────────────────────────────────────────────────────────

class Results {
  constructor(name) {
    this.name = name;
    this.pass = 0;
    this.fail = 0;
    this.warns = [];
  }
  ok(msg) {
    this.pass++;
    console.log(`  ${colors.green}✓${colors.reset} ${msg}`);
  }
  err(msg) {
    this.fail++;
    console.log(`  ${colors.red}✗${colors.reset} ${msg}`);
  }
  warn(msg) {
    this.warns.push(msg);
    console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`);
  }
  assert(cond, pass, fail) {
    if (cond) this.ok(pass);
    else this.err(fail);
  }
}

// ─── 驗證邏輯 ─────────────────────────────────────────────────────────────────

/**
 * 驗證單一頁面
 * @param {Results} r
 * @param {string} url
 * @param {Object} rules
 * @param {string[]} rules.requiredSchemas  必要的 @type
 * @param {string[]} [rules.forbidSchemas]  不應有的 @type
 * @param {boolean}  [rules.needsBreadcrumb]
 * @param {boolean}  [rules.needsCanonicalTrailingSlash]
 */
async function validatePage(r, url, rules) {
  let res;
  try {
    res = await fetchFollow(url);
  } catch (e) {
    r.err(`fetch failed: ${url} — ${e.message}`);
    return;
  }

  r.assert(res.status === 200, `HTTP 200: ${url}`, `HTTP ${res.status}: ${url}`);
  if (res.status !== 200) return;

  // trailing slash 重定向
  if (rules.needsCanonicalTrailingSlash !== false && res.redirects > 0) {
    r.warn(`${url} → ${res.finalUrl} (${res.redirects} redirect)`);
  }

  const html = res.body;

  // title
  const title = extractTitle(html);
  r.assert(title && title.length > 5, `title 存在: "${title?.slice(0, 50)}"`, `title 空白或缺失`);

  // meta description（noindex 頁不強制長度）
  const desc = extractMeta(html, 'description');
  if (!rules.shouldBeNoindex) {
    r.assert(
      desc && desc.length >= 50,
      `meta description 長度 ${desc?.length ?? 0} chars`,
      `meta description 過短或缺失（長度 ${desc?.length ?? 0}）`,
    );
  }

  // canonical
  const canonical = extractCanonical(html);
  if (canonical) {
    r.assert(
      canonical.startsWith('https://'),
      `canonical HTTPS: ${canonical}`,
      `canonical 非 HTTPS: ${canonical}`,
    );
    r.assert(
      canonical.endsWith('/'),
      `canonical trailing slash: ${canonical}`,
      `canonical 缺少 trailing slash: ${canonical}`,
    );
    r.assert(
      canonical === res.finalUrl || res.redirects === 0,
      `canonical 與 finalUrl 一致`,
      `canonical (${canonical}) ≠ finalUrl (${res.finalUrl})`,
    );
  } else {
    r.err(`缺少 canonical link tag: ${url}`);
  }

  // JSON-LD
  const schemas = extractJsonLd(html);
  const parseErrors = schemas.filter((s) => s._parseError);
  r.assert(
    parseErrors.length === 0,
    `JSON-LD 解析無誤`,
    `JSON-LD 解析失敗 × ${parseErrors.length}`,
  );

  const types = schemas.map((s) => s['@type']).filter(Boolean);

  // 必要 schema
  for (const required of rules.requiredSchemas ?? []) {
    r.assert(
      types.includes(required),
      `JSON-LD contains ${required}`,
      `缺少 JSON-LD: ${required}（有：${types.join(', ')}）`,
    );
  }

  // @id linked data 驗證（SoftwareApplication / Organization / WebSite）
  const orgSchema = schemas.find((s) => s['@type'] === 'Organization');
  const siteSchema = schemas.find((s) => s['@type'] === 'WebSite');
  const appSchema = schemas.find((s) => s['@type'] === 'SoftwareApplication');
  if (orgSchema) {
    r.assert(
      typeof orgSchema['@id'] === 'string' && orgSchema['@id'].includes('#organization'),
      `Organization 有 @id`,
      `Organization 缺少 @id URI`,
    );
  }
  if (siteSchema) {
    r.assert(
      typeof siteSchema['@id'] === 'string' && siteSchema['@id'].includes('#website'),
      `WebSite 有 @id`,
      `WebSite 缺少 @id URI`,
    );
  }
  if (appSchema) {
    r.assert(
      typeof appSchema['@id'] === 'string' && appSchema['@id'].includes('#softwareapplication'),
      `SoftwareApplication 有 @id`,
      `SoftwareApplication 缺少 @id URI`,
    );
  }

  // 禁止 schema（例如 noindex 頁不應有 SoftwareApplication）
  for (const forbidden of rules.forbidSchemas ?? []) {
    r.assert(!types.includes(forbidden), `正確排除 ${forbidden}`, `不應有 ${forbidden}`);
  }

  // robots meta（noindex 頁）
  const robotsMeta = extractMeta(html, 'robots');
  if (rules.shouldBeNoindex) {
    r.assert(
      robotsMeta?.includes('noindex'),
      `robots=noindex: ${url}`,
      `應有 noindex 但缺失: ${url}`,
    );
  } else {
    r.assert(!robotsMeta?.includes('noindex'), `robots 正常可索引`, `意外 noindex: ${robotsMeta}`);
  }
}

/** 驗證 sitemap.xml */
async function validateSitemap(r, baseUrl) {
  const url = `${baseUrl}/sitemap.xml`;
  const isProd = baseUrl.startsWith('https://');
  let res;
  try {
    res = await fetchFollow(url);
  } catch (e) {
    r.err(`sitemap fetch 失敗: ${e.message}`);
    return [];
  }

  r.assert(res.status === 200, `sitemap HTTP 200`, `sitemap HTTP ${res.status}`);

  const ct = res.headers['content-type'] ?? '';
  r.assert(
    ct.includes('xml') || ct.includes('text/plain'),
    `sitemap content-type: ${ct}`,
    `sitemap content-type 異常: ${ct}`,
  );

  r.assert(
    res.body.startsWith('<?xml'),
    `sitemap 是有效 XML`,
    `sitemap 非 XML（開頭: ${res.body.slice(0, 50)}）`,
  );

  const urls = extractSitemapUrls(res.body);
  r.assert(
    urls.length >= 40,
    `sitemap 包含 ${urls.length} 個 URL（≥40）`,
    `sitemap URL 數量過少: ${urls.length}`,
  );

  // sitemap URL 以 HTTPS 生產域名為準（本地環境 sitemap 固定指向生產 URL）
  const noHttps = urls.filter((u) => !u.startsWith('https://'));
  r.assert(
    noHttps.length === 0,
    `sitemap 所有 URL 為 HTTPS`,
    `sitemap 有非 HTTPS URL: ${noHttps.slice(0, 3).join(', ')}`,
  );

  const noSlash = urls.filter((u) => {
    const path = new URL(u).pathname;
    return !path.endsWith('/') && !path.includes('.');
  });
  r.assert(
    noSlash.length === 0,
    `sitemap 所有路徑有 trailing slash`,
    `sitemap 有路徑缺少 trailing slash: ${noSlash.slice(0, 3).join(', ')}`,
  );

  // 核心頁驗證：使用 sitemap 中的實際 base（生產 URL）
  const sitemapBase = urls[0]
    ? new URL(urls[0]).origin + new URL(urls[0]).pathname.split('/').slice(0, 2).join('/')
    : PROD_BASE;
  const core = ['/', '/faq/', '/about/', '/guide/', '/usd-twd/', '/jpy-twd/'];
  for (const p of core) {
    const expected = `${sitemapBase}${p}`;
    r.assert(urls.includes(expected), `sitemap 包含 ${p}`, `sitemap 缺少 ${expected}`);
  }

  // noindex 頁不應在 sitemap（依 sitemap base 判斷）
  const noindexPaths = ['/multi/', '/favorites/', '/settings/', '/privacy/'];
  for (const p of noindexPaths) {
    const u = `${sitemapBase}${p}`;
    r.assert(!urls.includes(u), `sitemap 正確排除 ${p}`, `sitemap 不應包含 noindex 頁: ${u}`);
  }

  // 本地模式跳過此提示（sitemap 固定生產 URL，屬預期行為）
  if (!isProd) {
    r.warn(`本地模式：sitemap URL 指向生產域名（正常）`);
  }

  return urls;
}

/** 驗證 robots.txt */
async function validateRobots(r, baseUrl) {
  const url = `${baseUrl}/robots.txt`;
  let res;
  try {
    res = await fetchFollow(url);
  } catch (e) {
    r.err(`robots.txt fetch 失敗: ${e.message}`);
    return;
  }

  r.assert(res.status === 200, `robots.txt HTTP 200`, `robots.txt HTTP ${res.status}`);

  const body = res.body;
  r.assert(body.includes('Sitemap:'), `robots.txt 包含 Sitemap 宣告`, `robots.txt 缺少 Sitemap`);
  r.assert(
    body.includes('sitemap.xml'),
    `robots.txt Sitemap 指向 sitemap.xml`,
    `robots.txt Sitemap URL 異常`,
  );
  r.assert(
    body.includes('Disallow: /ratewise/?'),
    `robots.txt 封鎖 deep-link query strings`,
    `缺少 deep-link Disallow`,
  );
  r.assert(body.includes('ClaudeBot'), `robots.txt 允許 ClaudeBot`, `缺少 ClaudeBot`);
  r.assert(body.includes('GPTBot'), `robots.txt 允許 GPTBot`, `缺少 GPTBot`);
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

const PAGE_RULES = {
  home: {
    requiredSchemas: ['SoftwareApplication', 'Organization', 'WebSite', 'HowTo', 'ImageObject'],
  },
  faq: {
    requiredSchemas: [
      'SoftwareApplication',
      'Organization',
      'WebSite',
      'Article',
      'BreadcrumbList',
    ],
  },
  about: {
    requiredSchemas: ['SoftwareApplication', 'Organization', 'WebSite', 'Article'],
  },
  guide: {
    requiredSchemas: [
      'SoftwareApplication',
      'Organization',
      'WebSite',
      'Article',
      'HowTo',
      'BreadcrumbList',
    ],
  },
  'usd-twd': {
    requiredSchemas: [
      'SoftwareApplication',
      'Organization',
      'WebSite',
      'FAQPage',
      'HowTo',
      'BreadcrumbList',
    ],
  },
  'jpy-twd': {
    requiredSchemas: [
      'SoftwareApplication',
      'Organization',
      'WebSite',
      'FAQPage',
      'HowTo',
      'BreadcrumbList',
    ],
  },
  'usd-twd/100': {
    requiredSchemas: ['SoftwareApplication', 'Organization', 'WebSite', 'BreadcrumbList'],
  },
  settings: {
    requiredSchemas: [],
    shouldBeNoindex: true,
  },
};

async function runSuite(baseUrl) {
  console.log(`\n${colors.bold}${colors.blue}${'─'.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}🔍 SEO SSOT 驗證: ${baseUrl}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'─'.repeat(50)}${colors.reset}\n`);

  const totalR = new Results('total');

  // sitemap
  console.log(`${colors.gray}[1/4] sitemap.xml${colors.reset}`);
  const sitemapR = new Results('sitemap');
  await validateSitemap(sitemapR, baseUrl);
  totalR.pass += sitemapR.pass;
  totalR.fail += sitemapR.fail;

  // robots.txt
  console.log(`\n${colors.gray}[2/4] robots.txt${colors.reset}`);
  const robotsR = new Results('robots');
  await validateRobots(robotsR, baseUrl);
  totalR.pass += robotsR.pass;
  totalR.fail += robotsR.fail;

  // 各頁面
  console.log(`\n${colors.gray}[3/4] 頁面驗證${colors.reset}`);
  for (const [page, rules] of Object.entries(PAGE_RULES)) {
    const url = page === 'home' ? `${baseUrl}/` : `${baseUrl}/${page}/`;
    console.log(`\n  ${colors.gray}→ ${url}${colors.reset}`);
    const pageR = new Results(page);
    await validatePage(pageR, url, rules);
    totalR.pass += pageR.pass;
    totalR.fail += pageR.fail;
  }

  // trailing slash 重定向驗證（僅生產環境；本地 vite preview 無此 redirect 規則）
  const isProd = baseUrl.startsWith('https://');
  console.log(
    `\n${colors.gray}[4/4] trailing slash 重定向${isProd ? '' : '（本地跳過）'}${colors.reset}`,
  );
  const redirectR = new Results('redirects');
  if (isProd) {
    for (const path of ['/faq', '/about', '/guide', '/usd-twd']) {
      const url = `${baseUrl}${path}`;
      try {
        const res = await fetchFollow(url);
        const expected = `${baseUrl}${path}/`;
        redirectR.assert(
          res.finalUrl === expected && res.redirects >= 1,
          `${path} → ${path}/ (redirect)`,
          `${path} 未正確 redirect 到 ${path}/ (finalUrl: ${res.finalUrl})`,
        );
      } catch (e) {
        redirectR.err(`${path} 重定向測試失敗: ${e.message}`);
      }
    }
  } else {
    redirectR.warn('本地模式：trailing slash redirect 由 Cloudflare/Zeabur 處理，跳過');
  }
  totalR.pass += redirectR.pass;
  totalR.fail += redirectR.fail;

  // 總結
  console.log(`\n${colors.bold}${colors.blue}${'─'.repeat(50)}${colors.reset}`);
  const icon = totalR.fail === 0 ? '✅' : '❌';
  const color = totalR.fail === 0 ? colors.green : colors.red;
  console.log(`${color}${icon} 結果: ${totalR.pass} 通過, ${totalR.fail} 失敗${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(50)}${colors.reset}\n`);

  return totalR.fail === 0;
}

async function main() {
  const arg = process.argv[2] ?? 'prod';
  const baseUrlOverride = process.env.BASE_URL;

  let allPassed = true;

  if (baseUrlOverride) {
    allPassed = await runSuite(baseUrlOverride.replace(/\/$/, ''));
  } else if (arg === 'local') {
    allPassed = await runSuite(LOCAL_BASE);
  } else if (arg === 'both') {
    const local = await runSuite(LOCAL_BASE);
    const prod = await runSuite(PROD_BASE);
    allPassed = local && prod;
  } else {
    allPassed = await runSuite(PROD_BASE);
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(`${colors.red}Fatal:${colors.reset}`, e);
  process.exit(1);
});
