#!/usr/bin/env node
/* eslint-env node */
/* global console, process */

import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_LOOKBACK_MINUTES = 31 * 24 * 60;
const DEFAULT_RUN_LIMIT = 20;

const MONTH_NAMES = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const WEEKDAY_NAMES = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function normalizeCronFieldToken(token, names) {
  const normalized = token.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new Error('Cron 欄位包含空白 token');
  }

  if (!names) {
    return normalized;
  }

  return normalized.replace(/[a-z]{3}/g, (match) => {
    const mapped = names[match];
    if (mapped == null) {
      throw new Error(`不支援的 cron 名稱：${match}`);
    }
    return String(mapped);
  });
}

function expandFieldRange(base, min, max) {
  if (base === '*') {
    return { start: min, end: max };
  }

  if (base.includes('-')) {
    const [startValue, endValue] = base.split('-').map((value) => Number.parseInt(value, 10));
    return { start: startValue, end: endValue };
  }

  const exact = Number.parseInt(base, 10);
  return { start: exact, end: exact };
}

function parseCronField(field, min, max, names) {
  const values = new Set();

  for (const rawToken of field.split(',')) {
    const token = normalizeCronFieldToken(rawToken, names);
    const [base, stepValue] = token.split('/');
    const step = stepValue ? Number.parseInt(stepValue, 10) : 1;

    if (!Number.isFinite(step) || step <= 0) {
      throw new Error(`無效的 cron step：${token}`);
    }

    const { start, end: rawEnd } = expandFieldRange(base, min, max);
    // step 語法（e.g. 20/15）：base 是純數字時，終點應延伸至欄位最大值
    // 例：20/15 → 20、35、50；而非僅 20
    const end = stepValue && !base.includes('-') && base !== '*' ? max : rawEnd;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < min ||
      end > max ||
      start > end
    ) {
      throw new Error(`無效的 cron 範圍：${token}`);
    }

    for (let current = start; current <= end; current += step) {
      values.add(current);
    }
  }

  return values;
}

function parseCronExpression(cronExpression) {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`只支援 5 欄位 cron：${cronExpression}`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  return {
    minute: parseCronField(minute, 0, 59),
    hour: parseCronField(hour, 0, 23),
    dayOfMonth: parseCronField(dayOfMonth, 1, 31),
    month: parseCronField(month, 1, 12, MONTH_NAMES),
    dayOfWeek: parseCronField(dayOfWeek, 0, 7, WEEKDAY_NAMES),
  };
}

function normalizeDayOfWeek(day) {
  return day === 7 ? 0 : day;
}

function matchesParsedCron(date, parsedCron) {
  const weekday = normalizeDayOfWeek(date.getUTCDay());
  const allowedWeekdays = new Set(Array.from(parsedCron.dayOfWeek, normalizeDayOfWeek));

  return (
    parsedCron.minute.has(date.getUTCMinutes()) &&
    parsedCron.hour.has(date.getUTCHours()) &&
    parsedCron.dayOfMonth.has(date.getUTCDate()) &&
    parsedCron.month.has(date.getUTCMonth() + 1) &&
    allowedWeekdays.has(weekday)
  );
}

function floorToMinute(dateLike) {
  const date = new Date(dateLike);
  date.setUTCSeconds(0, 0);
  return date;
}

function shiftMinutes(date, deltaMinutes) {
  return new Date(date.getTime() + deltaMinutes * 60_000);
}

function findLatestScheduledTimeForSchedules(schedules, createdAt, options = {}) {
  const lookbackMinutes = options.lookbackMinutes ?? DEFAULT_LOOKBACK_MINUTES;
  const createdDate = new Date(createdAt);
  const parsedSchedules = schedules.map((cron) => ({ cron, parsed: parseCronExpression(cron) }));

  for (let offset = 0; offset <= lookbackMinutes; offset += 1) {
    const candidate = shiftMinutes(floorToMinute(createdDate), -offset);
    const matched = parsedSchedules.find(({ parsed }) => matchesParsedCron(candidate, parsed));
    if (matched) {
      return {
        expectedAt: candidate.toISOString(),
        matchedSchedule: matched.cron,
      };
    }
  }

  return null;
}

export function findLatestScheduledTime(cronExpression, createdAt, options = {}) {
  const scheduled = findLatestScheduledTimeForSchedules([cronExpression], createdAt, options);
  return scheduled ? new Date(scheduled.expectedAt) : null;
}

function countMatchedSlotsBetweenSchedules(schedules, startInclusive, endExclusive) {
  const parsedSchedules = schedules.map((cron) => parseCronExpression(cron));
  let count = 0;
  let cursor = shiftMinutes(new Date(startInclusive), 1);
  const end = new Date(endExclusive);

  while (cursor < end) {
    if (parsedSchedules.some((parsed) => matchesParsedCron(cursor, parsed))) {
      count += 1;
    }
    cursor = shiftMinutes(cursor, 1);
  }

  return count;
}

function computeAverage(values) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function analyzeScheduledRuns({ workflowName, schedules, runs, defaultBranch = 'main' }) {
  const scheduleRuns = runs
    .filter(
      (run) => run.event === 'schedule' && (!run.headBranch || run.headBranch === defaultBranch),
    )
    .sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

  const entries = [];
  let previousExpectedAt = null;

  for (const run of scheduleRuns) {
    const scheduled = findLatestScheduledTimeForSchedules(schedules, run.createdAt);
    if (!scheduled) {
      continue;
    }

    const driftSeconds = Math.round(
      (new Date(run.createdAt).getTime() - new Date(scheduled.expectedAt).getTime()) / 1000,
    );

    const missedSlotsSincePrevious = previousExpectedAt
      ? countMatchedSlotsBetweenSchedules(schedules, previousExpectedAt, scheduled.expectedAt)
      : null;

    entries.push({
      workflowName,
      databaseId: run.databaseId,
      createdAt: run.createdAt,
      expectedAt: scheduled.expectedAt,
      matchedSchedule: scheduled.matchedSchedule,
      driftSeconds,
      missedSlotsSincePrevious,
      conclusion: run.conclusion,
      status: run.status,
    });

    previousExpectedAt = scheduled.expectedAt;
  }

  entries.reverse();

  const drifts = entries.map((entry) => entry.driftSeconds);
  const missedSlots = entries
    .map((entry) => entry.missedSlotsSincePrevious)
    .filter((value) => typeof value === 'number');

  return {
    workflowName,
    schedules,
    entries,
    summary: {
      sampleCount: entries.length,
      maxDriftSeconds: drifts.length > 0 ? Math.max(...drifts) : 0,
      averageDriftSeconds: computeAverage(drifts),
      totalMissedSlots: missedSlots.reduce((sum, value) => sum + value, 0),
    },
  };
}

export function discoverScheduledWorkflowsFromSources(sources) {
  return sources
    .map(({ filePath, source }) => {
      const nameMatch = source.match(/^name:\s*(.+)$/m);
      if (!nameMatch || !/^\s*schedule:\s*$/m.test(source)) {
        return null;
      }

      const schedules = Array.from(
        source.matchAll(/^\s*-\s*cron:\s*['"]([^'"]+)['"]\s*$/gm),
        (match) => match[1],
      );

      if (schedules.length === 0) {
        return null;
      }

      return {
        filePath,
        name: nameMatch[1].trim(),
        schedules,
      };
    })
    .filter(Boolean);
}

export function discoverScheduledWorkflows(workflowDirectory) {
  const files = readdirSync(workflowDirectory)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map((file) => {
      const filePath = path.join(workflowDirectory, file);
      return {
        filePath,
        source: readFileSync(filePath, 'utf-8'),
      };
    });

  return discoverScheduledWorkflowsFromSources(files);
}

function renderReportLine(workflow) {
  const latestEntry = workflow.entries[0];
  const latestDrift = latestEntry ? `${latestEntry.driftSeconds}s` : 'n/a';
  const totalMissed = workflow.summary.totalMissedSlots;
  const lastExpected = latestEntry?.expectedAt ?? 'n/a';
  const lastCreated = latestEntry?.createdAt ?? 'n/a';
  return [
    workflow.workflowName.padEnd(34),
    String(workflow.summary.sampleCount).padStart(3),
    String(workflow.summary.averageDriftSeconds).padStart(5),
    String(workflow.summary.maxDriftSeconds).padStart(5),
    String(totalMissed).padStart(5),
    latestDrift.padStart(8),
    lastExpected,
    lastCreated,
  ].join('  ');
}

function printReport(report) {
  console.log('\n🕒 GitHub Actions 排程延遲監測');
  console.log('─'.repeat(144));
  console.log(
    'Workflow'.padEnd(34) +
      '  n  avg_s  max_s  miss  latest  expectedAt'.padEnd(42) +
      '  createdAt',
  );
  console.log('─'.repeat(144));

  for (const workflow of report.workflows) {
    console.log(renderReportLine(workflow));
  }

  console.log('─'.repeat(144));
  console.log(
    `分析 ${report.workflows.length} 個 scheduled workflows，總樣本 ${report.totalSamples} 筆。`,
  );
}

function writeStepSummary(report) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const lines = [
    '## GitHub Actions Schedule Drift Monitor',
    '',
    '| Workflow | Samples | Avg Drift (s) | Max Drift (s) | Missed Slots | Latest Drift | Expected At | Created At |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |',
    ...report.workflows.map((workflow) => {
      const latestEntry = workflow.entries[0];
      return `| ${workflow.workflowName} | ${workflow.summary.sampleCount} | ${workflow.summary.averageDriftSeconds} | ${workflow.summary.maxDriftSeconds} | ${workflow.summary.totalMissedSlots} | ${latestEntry?.driftSeconds ?? 'n/a'} | ${latestEntry?.expectedAt ?? 'n/a'} | ${latestEntry?.createdAt ?? 'n/a'} |`;
    }),
    '',
  ];

  appendFileSync(summaryFile, `${lines.join('\n')}\n`);
}

function parseCliArgs(argv) {
  const options = {
    workflowNames: [],
    limit: DEFAULT_RUN_LIMIT,
    defaultBranch: 'main',
    workflowDirectory: path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../.github/workflows',
    ),
    failDriftSeconds: null,
    failMissedSlots: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--workflow') {
      options.workflowNames.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === '--default-branch') {
      options.defaultBranch = argv[index + 1];
      index += 1;
    } else if (arg === '--fail-drift-seconds') {
      options.failDriftSeconds = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === '--fail-missed-slots') {
      options.failMissedSlots = Number.parseInt(argv[index + 1], 10);
      index += 1;
    }
  }

  return options;
}

function ghRunList(workflowName, limit) {
  const output = execFileSync(
    'gh',
    [
      'run',
      'list',
      '--workflow',
      workflowName,
      '--event',
      'schedule',
      '--limit',
      String(limit),
      '--json',
      'databaseId,event,status,conclusion,createdAt,displayTitle,headBranch',
    ],
    { encoding: 'utf-8' },
  );

  return JSON.parse(output);
}

export async function runScheduleDriftMonitor(options = {}) {
  const workflows = discoverScheduledWorkflows(options.workflowDirectory).filter((workflow) =>
    options.workflowNames?.length ? options.workflowNames.includes(workflow.name) : true,
  );

  const analyses = workflows.map((workflow) =>
    analyzeScheduledRuns({
      workflowName: workflow.name,
      schedules: workflow.schedules,
      runs: ghRunList(workflow.name, options.limit ?? DEFAULT_RUN_LIMIT),
      defaultBranch: options.defaultBranch ?? 'main',
    }),
  );

  return {
    workflows: analyses,
    totalSamples: analyses.reduce((sum, workflow) => sum + workflow.summary.sampleCount, 0),
  };
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const report = await runScheduleDriftMonitor(options);
  printReport(report);
  writeStepSummary(report);

  const shouldFail = report.workflows.some((workflow) => {
    if (
      Number.isFinite(options.failDriftSeconds) &&
      workflow.summary.maxDriftSeconds > options.failDriftSeconds
    ) {
      return true;
    }

    if (
      Number.isFinite(options.failMissedSlots) &&
      workflow.summary.totalMissedSlots > options.failMissedSlots
    ) {
      return true;
    }

    return false;
  });

  if (shouldFail) {
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('❌ 排程延遲監測失敗');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
