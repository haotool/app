import { describe, expect, it } from 'vitest';
import {
  analyzeScheduledRuns,
  discoverScheduledWorkflowsFromSources,
  findLatestScheduledTime,
} from '../monitor-schedule-drift.mjs';

describe('monitor-schedule-drift', () => {
  it('會從 workflow YAML 自動找出有 schedule 的 workflow 與 cron 設定', () => {
    const workflows = discoverScheduledWorkflowsFromSources([
      {
        filePath: '.github/workflows/update-latest-rates.yml',
        source: `name: Update Latest Exchange Rates\non:\n  schedule:\n    - cron: '2,7,12,17,22,27,32,37,42,47,52,57 * * * *'\n  workflow_dispatch:\n`,
      },
      {
        filePath: '.github/workflows/ci.yml',
        source: `name: CI\non:\n  push:\n    branches: [main]\n`,
      },
    ]);

    expect(workflows).toEqual([
      {
        filePath: '.github/workflows/update-latest-rates.yml',
        name: 'Update Latest Exchange Rates',
        schedules: ['2,7,12,17,22,27,32,37,42,47,52,57 * * * *'],
      },
    ]);
  });

  it('會把 delayed schedule run 對應回最近一個理論 cron 時間', () => {
    const expectedAt = findLatestScheduledTime(
      '4,9,14,19,24,29,34,39,44,49,54,59 * * * *',
      '2026-03-31T16:42:15Z',
    );

    expect(expectedAt?.toISOString()).toBe('2026-03-31T16:39:00.000Z');
  });

  it('會統計 schedule run 的 drift 秒數與中間缺漏的排程次數', () => {
    const analysis = analyzeScheduledRuns({
      workflowName: 'Update Latest Exchange Rates',
      schedules: ['2,7,12,17,22,27,32,37,42,47,52,57 * * * *'],
      runs: [
        {
          databaseId: 23808806333,
          createdAt: '2026-03-31T16:42:36Z',
          event: 'schedule',
          status: 'completed',
          conclusion: 'success',
          headBranch: 'main',
        },
        {
          databaseId: 23804882144,
          createdAt: '2026-03-31T15:14:44Z',
          event: 'schedule',
          status: 'completed',
          conclusion: 'success',
          headBranch: 'main',
        },
      ],
    });

    expect(analysis.entries).toHaveLength(2);
    expect(analysis.entries[0]).toMatchObject({
      expectedAt: '2026-03-31T16:42:00.000Z',
      driftSeconds: 36,
      missedSlotsSincePrevious: 17,
    });
    expect(analysis.entries[1]).toMatchObject({
      expectedAt: '2026-03-31T15:12:00.000Z',
      driftSeconds: 164,
      missedSlotsSincePrevious: null,
    });
    expect(analysis.summary).toMatchObject({
      sampleCount: 2,
      maxDriftSeconds: 164,
      averageDriftSeconds: 100,
      totalMissedSlots: 17,
    });
  });
});
