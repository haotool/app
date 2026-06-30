import { describe, expect, it } from 'vitest';

import { shouldRefreshLatestSnapshot } from '../fetch-moneybox-rates.js';

const baseRates = {
  TWD: { sell: 46.1, buy: 46.7, base: 47.95, spbuy: 54.23, spsell: 43.16 },
};

describe('fetch-moneybox-rates / shouldRefreshLatestSnapshot', () => {
  it('跨到首爾新的一天時，即使牌價未變也刷新 latest snapshot', () => {
    const oldData = {
      timestamp: '2026-05-31T11:56:44.177Z',
      updateTime: '2026/05/31 20:56:44',
      rates: baseRates,
    };
    const newData = {
      timestamp: '2026-05-31T16:36:06.583Z',
      updateTime: '2026/06/01 01:36:06',
      rates: baseRates,
    };

    expect(shouldRefreshLatestSnapshot(oldData, newData)).toMatchObject({
      shouldUpdate: true,
      reason: 'date-rollover',
      oldSnapshotDate: '2026-05-31',
      newSnapshotDate: '2026-06-01',
    });
  });

  it('同一首爾日且牌價未變時不刷新', () => {
    const oldData = {
      timestamp: '2026-05-31T11:56:44.177Z',
      updateTime: '2026/05/31 20:56:44',
      rates: baseRates,
    };
    const newData = {
      timestamp: '2026-05-31T12:01:44.177Z',
      updateTime: '2026/05/31 21:01:44',
      rates: baseRates,
    };

    expect(shouldRefreshLatestSnapshot(oldData, newData)).toMatchObject({
      shouldUpdate: false,
      reason: 'unchanged',
    });
  });

  it('牌價有變化時刷新（reason=rate-changed）', () => {
    const oldData = { updateTime: '2026/05/31 20:56:44', rates: baseRates };
    const newData = {
      updateTime: '2026/05/31 21:01:44',
      rates: { TWD: { ...baseRates.TWD, sell: 46.2 } },
    };

    const decision = shouldRefreshLatestSnapshot(oldData, newData);
    expect(decision.shouldUpdate).toBe(true);
    expect(decision.reason).toBe('rate-changed');
    expect(decision.rateChanges.length).toBeGreaterThan(0);
  });
});
