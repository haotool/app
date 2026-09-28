import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  clearCache,
  fetchHistoricalRates,
  fetchHistoricalRatesRange,
} from '../exchangeRateHistoryService';
const valid = { updateTime: '2026/09/21 08:00:00', source: 'Taiwan Bank', rates: { USD: 31 } };
beforeEach(() => {
  clearCache();
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});
it('skips invalid primary snapshots and preserves last known good on malformed responses', async () => {
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...valid, rates: { USD: -1 } }),
    } as Response)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(valid) } as Response);
  expect(await fetchHistoricalRates(new Date('2026-09-21T00:00:00'))).toEqual(valid);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('rejects a malformed aggregate and uses the validated backup without fabricated source time', async () => {
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ dates: ['2026-09-21'], rates: { USD: [-1] } }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          dates: ['2026-09-21'],
          updateTimes: ['2026/09/21 12:34:00'],
          rates: { USD: [31] },
        }),
    } as Response);
  const result = await fetchHistoricalRatesRange(1);
  expect(result[0]?.data.rates.USD).toBe(31);
  expect(result[0]?.data.updateTime).toBe('2026/09/21 12:34:00');
});

it('keeps the persisted good snapshot when both network responses are invalid', async () => {
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({ ok: true, json: () => Promise.resolve(valid) } as Response);
  const date = new Date('2026-09-21T00:00:00');
  await fetchHistoricalRates(date);
  clearCache();
  fetcher.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ...valid, source: 'MoneyBox' }),
  } as Response);
  expect(await fetchHistoricalRates(date)).toEqual(valid);
});

it('ignores malformed persisted cache and reports network unavailability', async () => {
  localStorage.setItem('ratewise-history-cache', JSON.stringify({ version: 1 }));
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
  await expect(fetchHistoricalRates(new Date('2026-09-21T00:00:00'))).rejects.toThrow(
    'Failed to fetch',
  );
});
