#!/usr/bin/env node
/* globals console, process */
/**
 * SEO 20 輪迭代驅動器（可做 A/B 對照）
 * - 預設每輪執行 20 個 SEO 相關驗證步驟
 * - 可啟用 --dry-run 僅輸出執行序列
 * - 可加 --ab-config 載入變體命令（JSON）
 *
 * 範例：
 *   node scripts/seo-iteration-orchestrator.mjs
 *   node scripts/seo-iteration-orchestrator.mjs --iterations 3 --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SEO_STANDARD_LABEL } from './lib/seo-year-metadata.mjs';

const DEFAULT_ITERATIONS = 20;
const METRICS_DIR = '.cache/seo-iteration-metrics';
const METRICS_CMD = 'pnpm seo:collect-metrics';

const DEFAULT_STEPS = [
  { name: 'build_all', command: 'pnpm -r build', failFast: false },
  { name: 'lint', command: 'pnpm lint', failFast: false },
  { name: 'format_check', command: 'pnpm format', failFast: false },
  { name: 'typecheck', command: 'pnpm typecheck', failFast: false },
  { name: 'unit_test', command: 'pnpm test:unit', failFast: false },
  { name: 'integration_test', command: 'pnpm test:integration', failFast: false },
  { name: 'seo_health', command: 'pnpm seo:health-check', failFast: false },
  { name: 'verify_sitemap', command: 'pnpm verify:sitemap', failFast: false },
  { name: 'verify_sitemap_2026', command: 'pnpm verify:sitemap-2026', failFast: false },
  { name: 'verify_breadcrumb', command: 'pnpm verify:breadcrumb', failFast: false },
  { name: 'verify_structured_data', command: 'pnpm verify:structured-data', failFast: false },
  {
    name: 'verify_production_resources',
    command: 'pnpm verify:production-resources',
    failFast: false,
  },
  {
    name: 'verify_production_seo',
    command: 'pnpm verify:production-seo ratewise --base-url=https://app.haotool.org/ratewise',
    failFast: false,
  },
  { name: 'verify_precache', command: 'pnpm verify:precache', failFast: false },
  { name: 'seo_audit', command: 'pnpm seo:audit', failFast: false },
  { name: 'seo_doc_ssot', command: 'pnpm verify:seo-docs', failFast: false },
  { name: 'lighthouse_ci', command: 'pnpm lighthouse:ci', failFast: false },
  {
    name: 'lighthouse_scores',
    command: 'python3 scripts/analyze-lighthouse-scores.py --list',
    failFast: false,
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    iterations: DEFAULT_ITERATIONS,
    dryRun: false,
    abConfig: null,
    continueOnFailure: false,
    logFile: '.cache/seo-iteration-run.jsonl',
    prNumber: null,
    metricsDir: METRICS_DIR,
    requireImprovement: false,
    minSeoDelta: 0,
    minPassRateDelta: 0,
    metricsApp: 'ratewise',
    autoRollback: false,
    rollbackCommand: '',
  };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--iterations' && args[i + 1]) opts.iterations = Number(args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--ab-config' && args[i + 1]) opts.abConfig = args[++i];
    else if (args[i] === '--continue-on-failure') opts.continueOnFailure = true;
    else if (args[i] === '--log' && args[i + 1]) opts.logFile = args[++i];
    else if (args[i] === '--pr' && args[i + 1]) opts.prNumber = Number(args[++i]);
    else if (args[i] === '--metrics-dir' && args[i + 1]) opts.metricsDir = args[++i];
    else if (args[i] === '--require-improvement') opts.requireImprovement = true;
    else if (args[i] === '--min-seo-delta' && args[i + 1]) opts.minSeoDelta = Number(args[++i]);
    else if (args[i] === '--min-pass-rate-delta' && args[i + 1])
      opts.minPassRateDelta = Number(args[++i]);
    else if (args[i] === '--metrics-app' && args[i + 1]) opts.metricsApp = args[++i];
    else if (args[i] === '--auto-rollback') opts.autoRollback = true;
    else if (args[i] === '--rollback-command' && args[i + 1]) opts.rollbackCommand = args[++i];
  }

  return opts;
}

function readAbConfig(configPath) {
  if (!configPath) return null;
  try {
    const resolved = path.resolve(configPath);
    const raw = fs.readFileSync(resolved, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`讀取 AB config 失敗: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function runRollback(cfg) {
  if (!cfg.autoRollback || !cfg.rollbackCommand) {
    return {
      status: 0,
      skipped: true,
      message: '未設定回退 command，僅標示為失敗',
    };
  }
  console.log(`[rollback] 執行回退: ${cfg.rollbackCommand}`);
  const result = runShell(cfg.rollbackCommand, { dryRun: false });
  return {
    status: result.status,
    skipped: false,
    stdout: result.stdout.slice(0, 1200),
    stderr: result.stderr.slice(0, 1200),
  };
}

function runShell(command, options = {}) {
  if (options.dryRun) {
    console.log(`[dry-run] ${command}`);
    return { status: 0, stdout: 'dry-run', stderr: '', elapsedMs: 0 };
  }

  const start = Date.now();
  const result = spawnSync(command, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 50 * 1024 * 1024, // 50MB 避免 ENOBUFS
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout?.toString() || '',
    stderr: result.stderr?.toString() || '',
    elapsedMs: Date.now() - start,
  };
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasImproved(current, previous, cfg) {
  if (!current || !previous || !current.health || !previous.health) return false;

  const seoCurrent = current.health.seoScore ?? 0;
  const seoPrevious = previous.health.seoScore ?? 0;
  const passCurrent = current.productionResources?.passRate ?? 0;
  const passPrevious = previous.productionResources?.passRate ?? 0;

  return (
    seoCurrent - seoPrevious >= cfg.minSeoDelta &&
    passCurrent - passPrevious >= cfg.minPassRateDelta
  );
}

function summarizeImprovement(current, previous, cfg) {
  if (!previous) {
    return {
      improved: true,
      reason: 'no baseline',
      deltas: { seoScore: 0, passRate: 0 },
    };
  }

  if (!current?.health || !previous?.health) {
    return {
      improved: false,
      reason: 'missing metrics',
      deltas: { seoScore: 0, passRate: 0 },
    };
  }

  const deltas = {
    seoScore: Number((current.health.seoScore - previous.health.seoScore).toFixed(2)),
    passRate: Number(
      (current.productionResources?.passRate - previous.productionResources?.passRate).toFixed(2),
    ),
  };

  return {
    improved: hasImproved(current, previous, cfg),
    reason: hasImproved(current, previous, cfg) ? 'improved' : 'regression',
    deltas,
  };
}

function appendLog(logFile, payload) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `${JSON.stringify(payload)}\n`, 'utf8');
}

function runStep(step, cfg) {
  const timestamp = new Date().toISOString();
  const failFast = step.failFast !== false;
  if (step.control && step.variant) {
    console.log(`\n[AB] ${step.name}: control`);
    const controlResult = runShell(step.control.command, cfg);
    const variantResult = runShell(step.variant.command, cfg);
    return {
      timestamp,
      name: step.name,
      type: 'ab',
      control: controlResult.status,
      variant: variantResult.status,
      controlElapsedMs: controlResult.elapsedMs,
      variantElapsedMs: variantResult.elapsedMs,
      failFast,
    };
  }

  const result = runShell(step.command, cfg);
  return {
    timestamp,
    name: step.name,
    type: 'single',
    status: result.status,
    elapsedMs: result.elapsedMs,
    output: result.stdout.slice(0, 2000),
    error: result.stderr.slice(0, 1200),
    failFast,
  };
}

function runMetricsRound(round, cfg) {
  if (cfg.dryRun) {
    const metricsPath = path.resolve(cfg.metricsDir, `round-${round}.json`);
    return {
      name: 'collect_seo_metrics',
      type: 'single',
      status: 0,
      timestamp: new Date().toISOString(),
      elapsedMs: 0,
      outputPath: metricsPath,
      metrics: null,
      improvement: {
        improved: true,
        reason: 'dry-run',
        deltas: { seoScore: 0, passRate: 0 },
      },
      rawOutput: '',
      rawError: '',
    };
  }

  const metricsPath = path.resolve(cfg.metricsDir, `round-${round}.json`);
  const command = `${METRICS_CMD} -- --round ${round} --tag r${round} --output ${JSON.stringify(metricsPath)} --app ${cfg.metricsApp}`;
  const result = runShell(command, cfg);

  const current = safeReadJson(metricsPath);
  const previous =
    round > 1 ? safeReadJson(path.resolve(cfg.metricsDir, `round-${round - 1}.json`)) : null;
  const improvement = summarizeImprovement(current, previous, cfg);

  return {
    name: 'collect_seo_metrics',
    type: 'single',
    status: result.status,
    timestamp: new Date().toISOString(),
    elapsedMs: result.elapsedMs,
    outputPath: metricsPath,
    metrics: current
      ? {
          seoScore: current.health?.seoScore ?? null,
          passRate: current.productionResources?.passRate ?? null,
          allGreen: current.health?.allGreen ?? null,
        }
      : null,
    improvement,
    rawOutput: result.stdout.slice(0, 1600),
    rawError: result.stderr.slice(0, 1200),
  };
}

function main() {
  const cfg = parseArgs();
  const abConfig = readAbConfig(cfg.abConfig);
  const steps = [
    ...(abConfig?.steps && Array.isArray(abConfig.steps) ? abConfig.steps : DEFAULT_STEPS),
    ...(cfg.prNumber
      ? [
          {
            name: 'codex_review_once',
            command: `pnpm review:codex:once -- --pr ${cfg.prNumber}`,
            failFast: false,
          },
          {
            name: 'production_comments',
            command: `pnpm review:codex:watch -- --pr ${cfg.prNumber} --json-state .cache/iterative-review-state.json --once`,
            failFast: false,
          },
        ]
      : []),
  ];

  const result = {
    startedAt: new Date().toISOString(),
    standard: SEO_STANDARD_LABEL,
    iterations: cfg.iterations,
    rounds: [],
  };

  const maxRound = Math.max(1, Number(cfg.iterations) || 1);
  console.log(`\n🚀 啟動 ${SEO_STANDARD_LABEL} 迭代驅動（${maxRound} 輪）`);
  if (cfg.dryRun) console.log('模式: dry-run');
  if (cfg.requireImprovement) {
    console.log(
      `設定改善門檻: SEO Δ >= ${cfg.minSeoDelta}, 200 PassRate Δ >= ${cfg.minPassRateDelta}`,
    );
  }

  for (let round = 1; round <= maxRound; round += 1) {
    console.log(`\n================ Round ${round} / ${maxRound} ================`);
    const roundResult = {
      round,
      startAt: new Date().toISOString(),
      steps: [],
      failed: false,
    };

    for (const step of steps) {
      console.log(`- ${step.name}`);
      const stepResult = runStep(step, cfg);
      roundResult.steps.push(stepResult);

      const shouldFailFast = stepResult.failFast !== false;
      if (stepResult.type === 'single' && stepResult.status !== 0) {
        roundResult.failed = true;
        if (shouldFailFast && !cfg.continueOnFailure) {
          console.log(`[stop] ${step.name} failed (${stepResult.status})`);
          break;
        }
      }
      if (stepResult.type === 'ab' && (stepResult.control !== 0 || stepResult.variant !== 0)) {
        roundResult.failed = true;
        if (shouldFailFast && !cfg.continueOnFailure) {
          console.log(
            `[stop] ${step.name} AB step failed (control=${stepResult.control}, variant=${stepResult.variant})`,
          );
          break;
        }
      }
    }

    const metricsResult = runMetricsRound(round, cfg);
    roundResult.steps.push(metricsResult);
    roundResult.metrics = metricsResult.metrics;

    if (cfg.requireImprovement && !metricsResult.improvement.improved) {
      console.log(`[rollback] 警示：Round ${round} 未達 KPI 改善門檻`);
      console.log(
        `- 變化: SEOScore=${metricsResult.improvement.deltas.seoScore}, PassRate=${metricsResult.improvement.deltas.passRate}`,
      );
      const rollbackResult = runRollback(cfg);
      roundResult.rollback = rollbackResult;
      roundResult.failed = true;
      if (rollbackResult.skipped) {
        console.log('[rollback] 未設定 rollback command，請人工處理');
      } else if (rollbackResult.status !== 0) {
        console.log('[rollback] 回退指令執行失敗，請檢查後手動回退');
      }
      if (!cfg.continueOnFailure) {
        break;
      }
    }

    roundResult.finishedAt = new Date().toISOString();
    result.rounds.push(roundResult);
    appendLog(cfg.logFile, roundResult);
  }

  result.finishedAt = new Date().toISOString();
  appendLog(cfg.logFile, result);

  const failedRounds = result.rounds.filter((r) => r.failed).length;
  console.log(`\nDone: ${result.rounds.length} 輪, 失敗 ${failedRounds} 輪`);
  if (failedRounds > 0 && !cfg.dryRun) process.exit(1);
}

main();
