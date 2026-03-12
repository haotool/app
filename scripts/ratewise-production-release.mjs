#!/usr/bin/env node
/* eslint-env node */

import { pathToFileURL } from 'node:url';

const DEFAULT_RATEWISE_BASE_URL = 'https://app.haotool.org/ratewise/';
const DEFAULT_WAIT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_WAIT_INTERVAL_MS = 10 * 1000;
const PROBE_PARAM = '__release_probe__';

export function normalizeBase(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

export function extractAppVersion(html) {
  const match = html.match(/<meta\s+name="app-version"\s+content="([^"]+)"/i);
  return match?.[1] ?? null;
}

export function isExpectedAppVersion(html, expectedVersion) {
  return extractAppVersion(html) === expectedVersion;
}

export function buildVersionProbeUrl(baseUrl, probeToken) {
  const url = new URL(normalizeBase(baseUrl));
  url.searchParams.set(PROBE_PARAM, probeToken);
  return url.toString();
}

export function buildRatewisePurgePayload(originOrBase = DEFAULT_RATEWISE_BASE_URL) {
  const url = new URL(originOrBase);
  const origin = url.origin;
  const host = url.host;

  return {
    files: [
      `${origin}/ratewise/`,
      `${origin}/ratewise/sw.js`,
      `${origin}/ratewise/registerSW.js`,
      `${origin}/ratewise/manifest.webmanifest`,
      `${origin}/ratewise/offline.html`,
    ],
    prefixes: [
      `${host}/ratewise/assets`,
      `${host}/ratewise/workbox-`,
      `${host}/ratewise/static-loader-data-manifest`,
    ],
  };
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`無法取得 ${url} (status: ${response.status})`);
  }

  return response.text();
}

export async function waitForExpectedVersion(expectedVersion, options = {}) {
  const {
    baseUrl = DEFAULT_RATEWISE_BASE_URL,
    timeoutMs = DEFAULT_WAIT_TIMEOUT_MS,
    intervalMs = DEFAULT_WAIT_INTERVAL_MS,
    fetchImpl = fetch,
    now = () => Date.now(),
  } = options;

  if (!expectedVersion) {
    throw new Error('缺少 RATEWISE_EXPECTED_VERSION，無法等待正式站版本。');
  }

  const startedAt = now();
  let lastObservedVersion = null;
  let attempts = 0;

  while (now() - startedAt < timeoutMs) {
    attempts += 1;
    const probeToken = `${expectedVersion}-${attempts}-${now().toString(36)}`;
    const probeUrl = buildVersionProbeUrl(baseUrl, probeToken);

    try {
      const html = await fetchText(probeUrl, fetchImpl);
      lastObservedVersion = extractAppVersion(html);

      if (lastObservedVersion === expectedVersion) {
        console.log(`✅ RateWise 正式站版本已就緒：${lastObservedVersion}（${attempts} 次探測）`);
        return { attempts, version: lastObservedVersion };
      }

      console.log(
        `⏳ RateWise 正式站尚未更新，當前版本：${lastObservedVersion ?? 'unknown'}，預期：${expectedVersion}`,
      );
    } catch (error) {
      console.log(
        `⏳ RateWise 正式站探測失敗（第 ${attempts} 次）：${error instanceof Error ? error.message : String(error)}`,
      );
    }

    await delay(intervalMs);
  }

  throw new Error(
    `等待 RateWise 正式站版本逾時：預期 ${expectedVersion}，最後觀察到 ${lastObservedVersion ?? 'unknown'}`,
  );
}

export async function purgeCloudflareCache(payload, options = {}) {
  const {
    zoneId = process.env.CLOUDFLARE_ZONE_ID,
    apiToken = process.env.CLOUDFLARE_API_TOKEN,
    fetchImpl = fetch,
  } = options;

  if (!zoneId || !apiToken) {
    throw new Error('缺少 CLOUDFLARE_ZONE_ID 或 CLOUDFLARE_API_TOKEN，無法執行 purge。');
  }

  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const result = await response.json();
  if (!response.ok || result.success !== true) {
    throw new Error(`Cloudflare purge 失敗：${JSON.stringify(result)}`);
  }

  console.log(`✅ Cloudflare purge 已接受：${result.result?.id ?? 'unknown'}`);
  return result;
}

export async function main() {
  const action = process.env.RATEWISE_RELEASE_ACTION ?? process.argv[2] ?? 'wait';
  const baseUrl = process.env.RATEWISE_BASE_URL ?? DEFAULT_RATEWISE_BASE_URL;

  if (action === 'wait') {
    await waitForExpectedVersion(process.env.RATEWISE_EXPECTED_VERSION, {
      baseUrl,
      timeoutMs: Number(process.env.RATEWISE_WAIT_TIMEOUT_MS ?? DEFAULT_WAIT_TIMEOUT_MS),
      intervalMs: Number(process.env.RATEWISE_WAIT_INTERVAL_MS ?? DEFAULT_WAIT_INTERVAL_MS),
    });
    return;
  }

  if (action === 'print-payload') {
    console.log(JSON.stringify(buildRatewisePurgePayload(baseUrl), null, 2));
    return;
  }

  if (action === 'purge') {
    const payload = buildRatewisePurgePayload(baseUrl);
    console.log(`🔄 Purging RateWise CDN cache for ${normalizeBase(baseUrl)}`);
    await purgeCloudflareCache(payload);
    return;
  }

  throw new Error(`未知的 RATEWISE_RELEASE_ACTION: ${action}`);
}

const entryScript = process.argv[1];
const isDirectExecution = entryScript ? import.meta.url === pathToFileURL(entryScript).href : false;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
