// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../config/api-endpoints', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return { ...original, FX_V3_PUBLIC: false, isFxV3Public: () => false };
});
import { useConverterStore } from '../converterStore';

beforeEach(() => useConverterStore.setState({ rateType: 'spot', rateSource: 'bank' }));

it('flag-off sanitation restores v2 exchange-shop cash invariant', () => {
  useConverterStore.setState({
    rateSource: 'exchange-shop',
    providerPreference: {
      mode: 'manual',
      manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
    },
    rateType: 'spot',
  });
  useConverterStore.getState().__validateAndSanitize();
  expect(useConverterStore.getState().rateType).toBe('cash');
});

it('flag-off setter keeps exchange-shop selections on cash', () => {
  useConverterStore.getState().setProviderPreference({
    mode: 'manual',
    manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
  });
  useConverterStore.getState().setRateType('spot');
  expect(useConverterStore.getState().rateType).toBe('cash');
});
