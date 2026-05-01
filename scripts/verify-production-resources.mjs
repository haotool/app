#!/usr/bin/env node
/* eslint-env node */
/* global AbortController, fetch, setTimeout, clearTimeout, console, process */
/**
 * 生產環境必要資源可用性驗證。
 *
 * 從每個 app.config.mjs 的 resources.seoFiles 與 resources.images 自動展開 URL，
 * 逐一檢查正式站是否返回 200，並輸出 200 / non200 / timeout 三種結果。
 *
 * 用法：
 *   node scripts/verify-production-resources.mjs
 *   node scripts/verify-production-resources.mjs ratewise
 */

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const RESOURCE_GROUPS = [
  ['seo', 'seoFiles'],
  ['image', 'images'],
];

const DEFAULT_TIMEOUT_MS = 15000;
const EXPECTED_CONTENT_TYPES = {
  '.xml': ['application/xml', 'text/xml'],
  '.txt': ['text/plain'],
  '.json': ['application/json'],
  '.md': ['text/markdown', 'text/plain'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.ico': ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png'],
  '.webp': ['image/webp'],
  '.avif': ['image/avif'],
};

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function getPathExtension(path) {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

export function getExpectedContentTypes(resource) {
  const ext = getPathExtension(resource.path);
  if (resource.type === 'image') return EXPECTED_CONTENT_TYPES[ext] ?? ['image/'];
  return EXPECTED_CONTENT_TYPES[ext] ?? [];
}

export function isExpectedContentType(contentType, expectedTypes) {
  if (expectedTypes.length === 0) return true;
  const normalized = String(contentType ?? '').toLowerCase();
  return expectedTypes.some((expected) => normalized.startsWith(expected));
}

export function buildResourceInventory(apps) {
  const inventory = [];

  for (const app of apps) {
    const siteUrl = app?.config?.siteUrl;
    if (!siteUrl) {
      throw new Error(`App ${app?.name ?? 'unknown'} 缺少 config.siteUrl`);
    }

    const resourceConfig = app.config.resources ?? {};

    for (const [type, key] of RESOURCE_GROUPS) {
      const paths = resourceConfig[key] ?? [];

      for (const rawPath of paths) {
        if (typeof rawPath !== 'string' || rawPath.length === 0) {
          throw new Error(`App ${app.name} 的 resources.${key} 包含無效路徑`);
        }

        const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        inventory.push({
          app: app.name,
          displayName: app.config.displayName,
          type,
          path,
          url: new URL(path.replace(/^\//, ''), ensureTrailingSlash(siteUrl)).toString(),
          expectedContentTypes: getExpectedContentTypes({ type, path }),
        });
      }
    }
  }

  return inventory;
}

async function performRequest(url, method, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RateWise-SEO-ResourceCheck/1.0',
        'Cache-Control': 'no-cache',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function probeResource(resource, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRetries = options.maxRetries ?? 3;
  const startedAt = Date.now();

  let lastError = null;
  let lastStatus = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleepMs(1000 * 2 ** (attempt - 1));
    }

    try {
      let response = await performRequest(resource.url, 'HEAD', timeoutMs, fetchImpl);

      // 少數資源端點不支援 HEAD，退回 GET 以取得真實可用性。
      if (response.status === 405 || response.status === 501) {
        response = await performRequest(resource.url, 'GET', timeoutMs, fetchImpl);
      }

      lastStatus = response.status;
      lastError = null;
      const contentType = response.headers?.get?.('content-type') ?? '';
      const contentTypeOk = isExpectedContentType(
        contentType,
        resource.expectedContentTypes ?? getExpectedContentTypes(resource),
      );

      // 5xx 暫時性錯誤：重試
      if (response.status >= 500 && attempt < maxRetries) {
        continue;
      }

      return {
        ...resource,
        httpStatus: response.status,
        contentType,
        contentTypeOk,
        outcome: response.status === 200 && contentTypeOk ? '200' : 'non200',
        durationMs: Date.now() - startedAt,
        error: null,
      };
    } catch (error) {
      const isTimeout = error?.name === 'AbortError';
      lastStatus = null;
      lastError = error instanceof Error ? error.message : String(error);

      if (!isTimeout && attempt < maxRetries) {
        continue;
      }

      return {
        ...resource,
        httpStatus: null,
        outcome: isTimeout ? 'timeout' : 'non200',
        durationMs: Date.now() - startedAt,
        error: lastError,
      };
    }
  }

  return {
    ...resource,
    httpStatus: lastStatus,
    outcome: lastStatus != null && lastStatus < 500 ? 'non200' : 'non200',
    durationMs: Date.now() - startedAt,
    error: lastError,
  };
}

export function summarizeProbeResults(results) {
  return results.reduce(
    (summary, result) => {
      summary.total += 1;
      summary[result.outcome] += 1;
      return summary;
    },
    { total: 0, ['200']: 0, non200: 0, timeout: 0 },
  );
}

function formatOutcome(outcome) {
  if (outcome === '200') return `${colors.green}200${colors.reset}`;
  if (outcome === 'timeout') return `${colors.yellow}timeout${colors.reset}`;
  return `${colors.red}non200${colors.reset}`;
}

function formatStatus(httpStatus, error) {
  if (httpStatus != null) return String(httpStatus).padEnd(3, ' ');
  return error ? 'ERR' : 'N/A';
}

function printResults(results, summary) {
  console.log(`\n${colors.cyan}🔎 生產環境必要資源可用性驗證${colors.reset}`);
  console.log('─'.repeat(110));
  console.log(
    'APP'.padEnd(14) +
      'TYPE'.padEnd(8) +
      'RESULT'.padEnd(16) +
      'HTTP'.padEnd(8) +
      'CONTENT-TYPE'.padEnd(28) +
      'URL',
  );
  console.log('─'.repeat(110));

  for (const result of results) {
    console.log(
      result.app.padEnd(14) +
        result.type.padEnd(8) +
        `${formatOutcome(result.outcome)}`.padEnd(25) +
        formatStatus(result.httpStatus, result.error).padEnd(8) +
        String(result.contentType ?? '')
          .slice(0, 26)
          .padEnd(28) +
        result.url,
    );
  }

  console.log('─'.repeat(110));
  console.log(
    `總計 ${summary.total} 項：200=${summary['200']} / non200=${summary.non200} / timeout=${summary.timeout}`,
  );
}

function writeStepSummary(results, summary) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const lines = [
    '## SEO Required Resource Availability',
    '',
    '| App | Type | Result | HTTP | Content-Type | URL |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => {
      const http = result.httpStatus ?? (result.error ? 'ERR' : 'N/A');
      return `| ${result.app} | ${result.type} | ${result.outcome} | ${http} | ${result.contentType ?? ''} | ${result.url} |`;
    }),
    '',
    `總計 ${summary.total} 項：200=${summary['200']} / non200=${summary.non200} / timeout=${summary.timeout}`,
    '',
  ];

  appendFileSync(summaryFile, `${lines.join('\n')}\n`);
}

export async function runResourceVerification(options = {}) {
  const appArg = options.appName ?? process.argv[2];
  const apps = appArg ? [await loadAppConfig(appArg)].filter(Boolean) : await discoverApps();

  if (apps.length === 0) {
    throw new Error(`找不到任何 app${appArg ? `：${appArg}` : ''}`);
  }

  const inventory = buildResourceInventory(apps);

  if (inventory.length === 0) {
    throw new Error('未找到任何 resources.seoFiles 或 resources.images');
  }

  const results = [];
  for (const resource of inventory) {
    results.push(await probeResource(resource, options));
  }

  const summary = summarizeProbeResults(results);
  return { apps, inventory, results, summary };
}

async function main() {
  const { results, summary } = await runResourceVerification();

  printResults(results, summary);
  writeStepSummary(results, summary);

  if (summary.non200 > 0 || summary.timeout > 0) {
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`\n${colors.red}❌ 必要資源驗證失敗：${error.message}${colors.reset}\n`);
    process.exit(1);
  });
}
