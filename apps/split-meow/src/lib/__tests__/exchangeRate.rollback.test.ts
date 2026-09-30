import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@app/shared/fx/public', () => ({ FX_V3_PUBLIC: false, isFxV3Public: () => false }));
import { fetchMoneyboxRate } from '../exchangeRate';

afterEach(() => vi.unstubAllGlobals());

it('flag-off uses the legacy MoneyBox endpoint and never requests v3 current', async () => {
  const fetchMock = vi.fn(
    () =>
      new Response(
        JSON.stringify({
          timestamp: '2026-09-29T00:00:00Z',
          updateTime: '09/29',
          rates: { TWD: { sell: 42, buy: 43, base: 1 } },
        }),
        { status: 200 },
      ),
  );
  vi.stubGlobal('fetch', fetchMock);
  await expect(fetchMoneyboxRate()).resolves.toMatchObject({ krwPerTwd: 42 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/providers/moneybox/latest.json'),
  );
});
