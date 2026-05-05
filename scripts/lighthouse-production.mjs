#!/usr/bin/env node
/**
 * Production Lighthouse baseline checker
 *
 * 目的：
 * 1. 每日/PR 自動跑 production 慢速路徑（Lighthouse Smoke Paths）
 * 2. 建立並持續比較 baseline（失敗條件：性能退化 >5%）
 * 3. 輸出可被 CI/Pipeline 解析的 JSON summary
 *
 * 可用環境變數：
 * - LH_PRODUCTION_URL: 目標 production base URL（預設：https://app.haotool.org/ratewise/）
 * - LH_RUNS: 每頁重跑次數（預設：3）
 * - LH_OUTPUT_DIR: 報告輸出目錄（預設：lighthouse-reports/production）
 * - LH_BASELINE_PATH: baseline 檔案路徑（預設：scripts/lighthouse-baseline.production.json）
 * - LH_BASELINE_DRIFT_PCT: 可接受退化百分比（預設：5）
 * - LH_OUTPUT_ONLY: 僅輸出 baseline summary（預設：0）
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { APP_CONFIG } from '../apps/ratewise/app.config.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');

const PRODUCTION_URL = (
  process.env.LH_PRODUCTION_URL || 'https://app.haotool.org/ratewise/'
).replace(/\/?$/, '/');
const RUNS = Number.parseInt(process.env.LH_RUNS || '3', 10);
const BASELINE_PATH = resolve(
  process.env.LH_BASELINE_PATH || join(ROOT_DIR, 'scripts/lighthouse-baseline.production.json'),
);
const REPORT_DIR = resolve(
  process.env.LH_OUTPUT_DIR || join(ROOT_DIR, 'lighthouse-reports/production'),
);
const DRIFT_PERCENT = Number.parseFloat(process.env.LH_BASELINE_DRIFT_PCT || '5');
const LIGHTHOUSE_BIN = resolve(ROOT_DIR, 'node_modules', '.bin', 'lighthouse');
const OUTPUT_ONLY = process.env.LH_OUTPUT_ONLY === '1';
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

const PATHS = Array.isArray(APP_CONFIG.lighthouseSmokePaths)
  ? APP_CONFIG.lighthouseSmokePaths
  : ['/'];

const BASELINE_ASSERT = {
  performanceScore: 0.9,
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
};

const METRIC_AUDIT_IDS = {
  lcp: 'largest-contentful-paint',
  inp: ['interaction-to-next-paint', 'experimental-interaction-to-next-paint', 'max-potential-fid'],
  cls: 'cumulative-layout-shift',
};

const CATEGORY_KEYS = {
  performance: 'performance',
  accessibility: 'accessibility',
  bestPractices: 'best-practices',
  seo: 'seo',
};

const THRESHOLD_CHECKS = [
  {
    title: 'Performance',
    path: 'performanceScore',
    compareDirection: 'higherBetter',
    threshold: BASELINE_ASSERT.performanceScore * 100,
    unit: '%',
  },
  {
    title: 'LCP',
    path: 'lcpMs',
    compareDirection: 'lowerBetter',
    threshold: BASELINE_ASSERT.lcpMs,
    unit: 'ms',
  },
  {
    title: 'INP',
    path: 'inpMs',
    compareDirection: 'lowerBetter',
    threshold: BASELINE_ASSERT.inpMs,
    unit: 'ms',
  },
  {
    title: 'CLS',
    path: 'cls',
    compareDirection: 'lowerBetter',
    threshold: BASELINE_ASSERT.cls,
    unit: '',
  },
];

/**
 * 統計：取中位數
 */
function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * 讀 baseline。檔不存在或 JSON 失效則回傳 null，讓流程進入初始化模式。
 */
function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    return null;
  }
  try {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    if (typeof baseline !== 'object' || baseline === null) {
      return null;
    }
    return baseline;
  } catch {
    return null;
  }
}

function isUsableBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object') {
    return false;
  }
  if (baseline.status === 'placeholder') {
    return false;
  }
  if (!baseline.paths || typeof baseline.paths !== 'object') {
    return false;
  }
  return Object.keys(baseline.paths).length > 0;
}

function safeRound(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function normalizePath(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\/{2,}/g, '/');
}

function buildTargetUrl(path) {
  return `${PRODUCTION_URL.replace(/\/$/, '')}${normalizePath(path)}`;
}

function pickReportNumber(report, key) {
  if (key === 'performanceScore') {
    const score = report?.categories?.[CATEGORY_KEYS.performance]?.score;
    return Number.isFinite(score) ? score * 100 : null;
  }

  if (key === 'lcpMs') {
    const value = report?.audits?.[METRIC_AUDIT_IDS.lcp]?.numericValue;
    return Number.isFinite(value) ? value : null;
  }

  if (key === 'inpMs') {
    for (const auditId of METRIC_AUDIT_IDS.inp) {
      const value = report?.audits?.[auditId]?.numericValue;
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  if (key === 'cls') {
    const value = report?.audits?.[METRIC_AUDIT_IDS.cls]?.numericValue;
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

function runLighthouse(url, outputPath) {
  const args = [
    url,
    '--preset=desktop',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${outputPath}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu',
    '--quiet',
  ];

  const result = spawnSync(LIGHTHOUSE_BIN, args, {
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'production' },
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 6,
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`Lighthouse run failed: ${stderr || result.error?.message || 'unknown error'}`);
  }

  const report = JSON.parse(readFileSync(outputPath, 'utf8'));
  return report;
}

function compareDirection(current, baseline, compareDirection) {
  if (
    baseline === null ||
    baseline === 0 ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline)
  ) {
    return { changed: 0, exceed: false };
  }

  if (compareDirection === 'higherBetter') {
    const degradePercent = ((baseline - current) / baseline) * 100;
    return {
      changed: safeRound(degradePercent, 2),
      exceed: degradePercent > DRIFT_PERCENT,
    };
  }

  const worsenPercent = ((current - baseline) / baseline) * 100;
  return {
    changed: safeRound(worsenPercent, 2),
    exceed: worsenPercent > DRIFT_PERCENT,
  };
}

function main() {
  if (!existsSync(LIGHTHOUSE_BIN)) {
    throw new Error('Lighthouse CLI not found. Run pnpm install --frozen-lockfile first.');
  }

  if (
    !Array.isArray(APP_CONFIG.lighthouseSmokePaths) ||
    APP_CONFIG.lighthouseSmokePaths.length === 0
  ) {
    throw new Error('APP_CONFIG.lighthouseSmokePaths is empty or invalid.');
  }

  if (!Number.isFinite(RUNS) || RUNS <= 0) {
    throw new Error(`Invalid LH_RUNS: ${process.env.LH_RUNS}`);
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString();
  const summary = {
    generatedAt: timestamp,
    targetUrl: PRODUCTION_URL,
    runs: RUNS,
    driftTolerancePercent: DRIFT_PERCENT,
    paths: {},
    overall: {
      drift: {},
      checks: {},
      passed: true,
    },
  };
  const baseline = readBaseline();
  const hasUsableBaseline = isUsableBaseline(baseline);
  const enforceHardThreshold = !!hasUsableBaseline;

  console.log('🚀 啟動 Production Lighthouse baseline 檢核');
  console.log(`🔗 Base URL: ${PRODUCTION_URL}`);
  console.log(`📊 路徑：${PATHS.length} 個`);
  console.log(`🎯 每頁執行：${RUNS} 次`);

  const errors = [];

  for (const path of PATHS) {
    const normalizedPath = normalizePath(path);
    const pathKey =
      normalizedPath === '/' ? 'home' : normalizedPath.replace(/\//g, '-').replace(/^-/, '');
    const url = buildTargetUrl(normalizedPath);
    console.log(`\n📍 掃描：${url}`);

    const stats = {
      path: normalizedPath,
      url,
      runs: [],
    };
    const collected = {
      performanceScore: [],
      lcpMs: [],
      inpMs: [],
      cls: [],
    };

    for (let index = 0; index < RUNS; index++) {
      const reportPath = join(REPORT_DIR, `${pathKey}-run-${index + 1}.report.json`);
      const lhr = runLighthouse(url, reportPath);
      const runResult = {
        run: index + 1,
        performanceScore: safeRound(pickReportNumber(lhr, 'performanceScore'), 2),
        lcpMs: safeRound(pickReportNumber(lhr, 'lcpMs'), 2),
        inpMs: safeRound(pickReportNumber(lhr, 'inpMs'), 2),
        cls: safeRound(pickReportNumber(lhr, 'cls'), 3),
        lighthouseScore: {
          performance: lhr?.categories?.[CATEGORY_KEYS.performance]?.score ?? null,
          accessibility: lhr?.categories?.[CATEGORY_KEYS.accessibility]?.score ?? null,
          bestPractices: lhr?.categories?.[CATEGORY_KEYS.bestPractices]?.score ?? null,
          seo: lhr?.categories?.[CATEGORY_KEYS.seo]?.score ?? null,
        },
      };

      for (const check of THRESHOLD_CHECKS) {
        const value = runResult[check.path];
        if (Number.isFinite(value)) {
          collected[check.path].push(value);
        }
      }
      stats.runs.push(runResult);
    }

    const pathSummary = {
      path: normalizedPath,
      median: {
        performanceScore: median(collected.performanceScore),
        lcpMs: median(collected.lcpMs),
        inpMs: median(collected.inpMs),
        cls: median(collected.cls),
      },
      runs: stats.runs,
    };
    summary.paths[pathKey] = pathSummary;

    for (const check of THRESHOLD_CHECKS) {
      const value = pathSummary.median[check.path];
      if (value === null) {
        continue;
      }
      if (!enforceHardThreshold) {
        continue;
      }
      if (check.compareDirection === 'higherBetter' && value < check.threshold) {
        summary.overall.passed = false;
        summary.overall.checks[`${normalizedPath}-${check.path}`] = {
          type: 'hard_fail',
          expected: check.threshold,
          actual: value,
          unit: check.unit,
        };
      }

      if (check.compareDirection === 'lowerBetter' && value > check.threshold) {
        summary.overall.passed = false;
        summary.overall.checks[`${normalizedPath}-${check.path}`] = {
          type: 'hard_fail',
          expected: check.threshold,
          actual: value,
          unit: check.unit,
        };
      }
    }
  }

  if (hasUsableBaseline) {
    for (const [pathKey, item] of Object.entries(summary.paths)) {
      const baselineItem = baseline.paths[pathKey];
      if (!baselineItem?.median) {
        continue;
      }

      for (const check of THRESHOLD_CHECKS) {
        const current = item.median?.[check.path];
        const previous = baselineItem.median?.[check.path];
        if (current === null || previous === null || previous === undefined) {
          continue;
        }

        const drift = compareDirection(current, previous, check.compareDirection);
        summary.overall.drift[`${pathKey}:${check.path}`] = drift;
        if (drift.exceed) {
          summary.overall.passed = false;
          errors.push(
            `${check.title} 退化超過 ${DRIFT_PERCENT}%：${pathKey} ${previous} -> ${current} (${drift.changed}%)`,
          );
          summary.overall.checks[`${pathKey}-${check.path}`] = {
            ...summary.overall.checks[`${pathKey}-${check.path}`],
            type: summary.overall.checks[`${pathKey}-${check.path}`] ? 'hard_fail' : 'regression',
            baseline: previous,
            drift: drift.changed,
          };
        }
      }
    }
  }

  const output = {
    generatedAt: timestamp,
    status: summary.overall.passed ? 'pass' : 'fail',
    targetUrl: PRODUCTION_URL,
    runs: RUNS,
    driftTolerancePercent: DRIFT_PERCENT,
    checks: summary.overall.checks,
    drift: summary.overall.drift,
    errors,
    paths: summary.paths,
  };

  if (!baseline) {
    console.log('📌 Baseline 不存在，將以本次結果初始化。');
    writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        {
          version: 1,
          updatedAt: timestamp,
          generatedBy: 'scripts/lighthouse-production.mjs',
          status: 'active',
          runs: RUNS,
          targetUrl: PRODUCTION_URL,
          driftTolerancePercent: DRIFT_PERCENT,
          paths: summary.paths,
        },
        null,
        2,
      ),
    );
  } else {
    writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        {
          ...baseline,
          updatedAt: timestamp,
          generatedBy: 'scripts/lighthouse-production.mjs',
          status: summary.overall.passed ? 'active' : 'degraded',
          runs: RUNS,
          targetUrl: PRODUCTION_URL,
          driftTolerancePercent: DRIFT_PERCENT,
          paths: summary.paths,
        },
        null,
        2,
      ),
    );
  }

  const summaryPath = join(REPORT_DIR, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(output, null, 2));

  console.log('\n=== Lighthouse Production Baseline Summary ===');
  for (const [name, check] of Object.entries(summary.overall.checks)) {
    if (check.type === 'hard_fail') {
      const relation = `expected ${check.expected}${check.unit} / actual ${check.actual}${check.unit}`;
      console.log(`❌ ${name}: ${relation}`);
    } else if (check.type === 'regression') {
      console.log(
        `⚠️ ${name}: baseline drift +${check.drift}% (${check.baseline} -> ${check.actual})`,
      );
    }
  }

  if (GITHUB_OUTPUT) {
    appendFileSync(
      GITHUB_OUTPUT,
      `status=${summary.overall.passed ? 'pass' : 'fail'}\n` +
        `summary_path=${summaryPath}\n` +
        `baseline_path=${BASELINE_PATH}\n` +
        `errors=${JSON.stringify(errors)}\n`,
    );
  }

  if (OUTPUT_ONLY) {
    return;
  }

  if (!summary.overall.passed) {
    throw new Error(`Lighthouse baseline 檢核失敗：${errors.join('；') || '存在硬性門檻下降'}`);
  }
}

main();
