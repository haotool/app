#!/usr/bin/env node
/* eslint-env node */
/* globals console, process */
/**
 * SEO 可量化指標採集（v2）
 *
 * 目的：在每輪迭代後輸出可持續比較的 JSON 指標，
 * 作為 AB 對照的明確改善/回退判斷依據。
 *
 * 產生內容：
 * - Lighthouse（取 representative run 的最近平均）
 * - Sitemap 2026 快速健康度
 * - 生產環境 SEO 必要資源 200 命中率
 * - Git/執行上下文摘要
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runResourceVerification } from './verify-production-resources.mjs';
import {
  SEO_STANDARD_KEY,
  SEO_STANDARD_LABEL,
  SEO_STANDARD_YEAR,
} from './lib/seo-year-metadata.mjs';
import { SEO_PATHS, SITE_CONFIG, normalizeSiteUrl } from '../apps/ratewise/seo-paths.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MANIFEST_PATH = path.resolve(__dirname, '../lighthouse-reports/lhci/manifest.json');
const DEFAULT_SITEMAP_PATH = path.resolve(__dirname, '../apps/ratewise/public/sitemap.xml');
const DEFAULT_OUTPUT_PATH = path.resolve(__dirname, '../.cache/seo-metrics.json');

function parseArgs() {
  const args = process.argv.slice(2);
  if (args[0] === '--') args.shift();
  const out = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    sitemapPath: DEFAULT_SITEMAP_PATH,
    output: DEFAULT_OUTPUT_PATH,
    round: null,
    tag: 'manual',
    app: 'ratewise',
    exitOnNon200: false,
  };

  out.targetSeoMin = Number(process.env.SEO_TARGET_SEO_MIN || 90);
  out.targetPerformanceMin = Number(process.env.SEO_TARGET_PERFORMANCE_MIN || 95);
  out.targetPassRateMin = Number(process.env.SEO_TARGET_PASS_RATE_MIN || 95);

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--manifest' && args[i + 1]) out.manifestPath = path.resolve(args[++i]);
    else if (args[i] === '--sitemap' && args[i + 1]) out.sitemapPath = path.resolve(args[++i]);
    else if (args[i] === '--output' && args[i + 1]) out.output = path.resolve(args[++i]);
    else if (args[i] === '--round' && args[i + 1]) out.round = Number(args[++i]);
    else if (args[i] === '--tag' && args[i + 1]) out.tag = args[++i];
    else if (args[i] === '--app' && args[i + 1]) out.app = args[++i];
    else if (args[i] === '--exit-on-non200') out.exitOnNon200 = true;
  }

  return out;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function toPct(value, total) {
  return total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function parseLighthouse(manifestPath) {
  const manifest = readJson(manifestPath, []);
  const representative = Array.isArray(manifest)
    ? manifest.filter((item) => item?.isRepresentativeRun === true)
    : [];
  if (!representative.length)
    return { found: false, message: `No representative runs in ${manifestPath}` };

  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  const sums = Object.fromEntries(categories.map((c) => [c, 0]));
  const totals = { samples: representative.length };

  for (const entry of representative) {
    const summary = entry?.summary ?? {};
    for (const category of categories) {
      const score = Number(summary[category]);
      if (Number.isFinite(score)) sums[category] += score;
    }
  }

  const avgScores = {};
  const avgScores100 = {};
  for (const category of categories) {
    avgScores[category] = Number((sums[category] / totals.samples).toFixed(4));
    avgScores100[category] = Number((avgScores[category] * 100).toFixed(1));
  }

  return {
    found: true,
    samples: totals.samples,
    avgScores,
    avgScores100,
    representativeUrls: representative.map((x) => x.url),
    latest: representative.at(-1)?.url ?? null,
  };
}

function normalizeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function parseSitemap(sitemapPath) {
  if (!fs.existsSync(sitemapPath)) {
    return { found: false, message: `Sitemap not found: ${sitemapPath}` };
  }

  const xml = readText(sitemapPath);
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const imageNodes = [...xml.matchAll(/<image:image>/g)].length;
  const hasChangefreq = xml.includes('<changefreq>');
  const hasPriority = xml.includes('<priority>');
  const hasImageNamespace = xml.includes(
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
  );

  const siteUrl = normalizeSiteUrl(SITE_CONFIG.url).replace(/\/$/, '');
  const toAbsoluteUrl = (pathname) => {
    const normalized = pathname === '/' ? '' : pathname.replace(/^\//, '');
    return `${siteUrl}/${normalized}`;
  };

  const expectedUrls = SEO_PATHS.map(toAbsoluteUrl);
  const locSet = new Set(urls);
  const missingPaths = expectedUrls.filter((expected) => !locSet.has(expected));

  const lastmods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
  const uniqueDates = new Set(lastmods.map((d) => d.split('T')[0]));

  return {
    found: true,
    urlCount: urls.length,
    imageNodes,
    hasChangefreq,
    hasPriority,
    hasImageNamespace,
    lastmodCount: lastmods.length,
    uniqueLastmodDays: uniqueDates.size,
    missingExpectedCount: missingPaths.length,
    missingExpectedSamples: missingPaths.slice(0, 5),
  };
}

async function parseProductionResources(app) {
  const options = {};
  if (app) options.appName = app;

  try {
    const result = await runResourceVerification(options);
    const summary = result.summary ?? { total: 0, 200: 0, non200: 0, timeout: 0 };
    const passedRate = toPct(summary['200'], summary.total);

    return {
      found: true,
      total: summary.total,
      passCount: summary['200'],
      non200: summary.non200,
      timeout: summary.timeout,
      passRate: Number(passedRate.toFixed(2)),
    };
  } catch (error) {
    return {
      found: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function getWorkspaceMeta() {
  const git = (cmd) => {
    try {
      return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  };

  const commit = git('git rev-parse --short HEAD');
  const branch = git('git rev-parse --abbrev-ref HEAD');
  const clean = git('git status --short | wc -l');
  return {
    commit: commit || 'unknown',
    branch: branch || 'unknown',
    pendingChanges: clean ? Number(clean) > 0 : false,
  };
}

async function run(args) {
  const lighthouse = parseLighthouse(args.manifestPath);
  const sitemap = parseSitemap(args.sitemapPath);
  const productionResources = await parseProductionResources(args.app);

  const record = {
    schema: SEO_STANDARD_KEY,
    standard: SEO_STANDARD_LABEL,
    standardYear: SEO_STANDARD_YEAR,
    tag: args.tag,
    round: args.round,
    generatedAt: new Date().toISOString(),
    workspace: getWorkspaceMeta(),
    lighthouse,
    sitemap,
    productionResources,
  };

  const seoScore = Number((lighthouse.avgScores100?.seo || 0).toFixed(1));
  const performanceScore = Number((lighthouse.avgScores100?.performance || 0).toFixed(1));
  const passRate = productionResources.found ? productionResources.passRate : 0;
  const targetSeoMin = normalizeNumber(args.targetSeoMin, 90);
  const targetPerformanceMin = normalizeNumber(args.targetPerformanceMin, 95);
  const targetPassRateMin = normalizeNumber(args.targetPassRateMin, 95);
  const urlCoverageOk = sitemap.found
    ? sitemap.missingExpectedCount === 0 && !sitemap.hasChangefreq && !sitemap.hasPriority
    : false;
  const imageSitemapOk = sitemap.found
    ? sitemap.hasImageNamespace && sitemap.imageNodes > 0
    : false;
  const seoFileHealthOk = sitemap.found && urlCoverageOk && imageSitemapOk;

  record.health = {
    seoScore,
    performanceScore,
    passRate,
    urlCoverageOk,
    imageSitemapOk,
    allGreen: Boolean(
      record.workspace?.branch &&
      (!productionResources.found || productionResources.passRate >= targetPassRateMin) &&
      (!lighthouse.found || seoScore >= targetSeoMin) &&
      (!lighthouse.found || performanceScore >= targetPerformanceMin) &&
      urlCoverageOk &&
      imageSitemapOk,
    ),
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  console.log(`📦 SEO 指標已輸出: ${args.output}`);
  console.log(`   SEO=${record.health.seoScore}, 200=${productionResources.passRate ?? 'n/a'}%`);
  if (lighthouse.found) {
    console.log(
      `   LH(perf/acc/bp/seo): ${lighthouse.avgScores100.performance}/${lighthouse.avgScores100.accessibility}/${lighthouse.avgScores100['best-practices']}/${lighthouse.avgScores100.seo}`,
    );
  }

  if (args.exitOnNon200 && productionResources.found && productionResources.passRate < 100) {
    process.exit(1);
  }
}

run(parseArgs()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
