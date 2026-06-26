import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  API_SEMANTICS_SCHEMA_VERSION,
  buildSemanticFieldMapping,
  enrichCurrencyDetail,
  enrichRatesPayload,
} from '../api-semantics-v2';

const buildTimeRatesPath = resolve(__dirname, '../generated/build-time-rates.json');
const buildTimeRates = JSON.parse(readFileSync(buildTimeRatesPath, 'utf-8')) as {
  timestamp: string;
  updateTime: string;
  details: Record<
    string,
    { spot: { buy: number; sell: number }; cash: { buy: number; sell: number } }
  >;
};

const usdRates = buildTimeRates.details['USD']!;
const jpyRates = buildTimeRates.details['JPY']!;

describe('api-semantics-v2', () => {
  it('maps USD cash customerBuyForeignRate to legacy sell (spec §21.3)', () => {
    const enriched = enrichCurrencyDetail('USD', usdRates);

    expect(enriched.cash.customerBuyForeignRate).toBe(usdRates.cash.sell);
    expect(enriched.cash.customerSellForeignRate).toBe(usdRates.cash.buy);
    expect(enriched.cash.midMarketRate).toBe(
      Number(((usdRates.cash.buy + usdRates.cash.sell) / 2).toFixed(6)),
    );
  });

  it('maps USD spot fields with rateType=cash|spot', () => {
    const enriched = enrichCurrencyDetail('USD', usdRates);

    expect(enriched.spot.rateType).toBe('spot');
    expect(enriched.cash.rateType).toBe('cash');
    expect(enriched.spot.currency).toBe('USD');
    expect(enriched.spot.customerBuyForeignRate).toBe(usdRates.spot.sell);
  });

  it('enriches full payload with schemaVersion and asOf', () => {
    const enriched = enrichRatesPayload(buildTimeRates);

    expect(enriched.schemaVersion).toBe(API_SEMANTICS_SCHEMA_VERSION);
    expect(enriched.asOf).toBeTruthy();
    expect(enriched.details?.['USD']?.cash.customerBuyForeignRate).toBe(usdRates.cash.sell);
  });

  it('preserves legacy buy/sell on enriched blocks', () => {
    const enriched = enrichCurrencyDetail('JPY', jpyRates);

    expect(enriched.cash.buy).toBe(jpyRates.cash.buy);
    expect(enriched.cash.sell).toBe(jpyRates.cash.sell);
  });

  it('exports semantic field mapping metadata', () => {
    const mapping = buildSemanticFieldMapping();

    expect(mapping.schemaVersion).toBe('2.0');
    expect(mapping.fields.customerBuyForeignRate.legacyPath).toContain('.sell');
    expect(mapping.fields.customerSellForeignRate.legacyPath).toContain('.buy');
  });
});
