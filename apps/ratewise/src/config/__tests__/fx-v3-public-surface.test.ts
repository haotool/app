/** 公開切換後，generated artifacts 必須宣告 v3 contract 與 current pointer。 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FX_V3_PUBLIC } from '../api-endpoints';

const PUBLIC = resolve(__dirname, '../../../public');
const read = (path: string) => readFileSync(resolve(PUBLIC, path), 'utf8');

describe.runIf(FX_V3_PUBLIC)('v3 public surface is enabled', () => {
  it('uses the public FX v3 switch', () => {
    expect(FX_V3_PUBLIC).toBe(true);
  });
  it('publishes api/latest.json on schema 3.0 with the canonical contract and current pointer', () => {
    const latest = JSON.parse(read('api/latest.json')) as Record<string, unknown>;
    expect(latest['schemaVersion']).toBe('3.0');
    expect(latest['$schema']).toContain('/api/v3/contract.schema.json');
    expect(latest['legacySchemaVersion']).toBe('2.0');
    expect(JSON.stringify(latest)).toContain('/rates/v3/current.json');
    const v3 = latest['v3'] as Record<string, unknown>;
    expect(v3['availability']).toContain('目前啟用');
    expect(v3['currentDescription']).toContain('release manifest');
    expect(latest['endpoints']).not.toHaveProperty('legacyLatest');
  });

  it('publishes OpenAPI v3 entry points and schemas', () => {
    const spec = JSON.parse(read('openapi.json')) as {
      info: Record<string, unknown>;
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    expect(spec.info['version']).toBe('3.0.0');
    expect(spec.info['x-schema-version']).toBe('3.0');
    expect(Object.keys(spec.paths).some((path) => path.includes('/v3/current.json'))).toBe(true);
    expect(spec.components.schemas).toHaveProperty('CurrentRelease');
    expect(spec).toHaveProperty('x-fx-v3-contract');
  });

  it('publishes pair endpoints with v3 current pointers', () => {
    for (const file of readdirSync(resolve(PUBLIC, 'api/pairs'))) {
      const pair = JSON.parse(read(`api/pairs/${file}`)) as Record<string, unknown>;
      expect(pair['schemaVersion'], file).toBe('3.0');
      expect(pair['v3CurrentUrl'], file).toContain('/rates/v3/current.json');
      expect(pair['liveRateUrl'], file).toMatch(/\/public\/rates\/latest\.json$/);
      expect(pair['liveRateUrl'], file).not.toContain('/v3/');
      expect(pair['v3CurrentUrlDescription'], file).toContain('release manifest');
    }
  });

  it.each(['llms.txt', 'llms-full.txt', 'open-data.md'])(
    '%s advertises v3 current as the canonical rate endpoint',
    (file) => {
      expect(read(file)).toMatch(/rates\/v3\/current\.json/);
    },
  );
});

describe('v2 provider metadata 與 v3 manifest 同源', () => {
  it('開放資料 metadata 的來源、條款與標示等於 FX_PROVIDER_METADATA', async () => {
    const { buildPublicRateProviderMetadata } = await import('../rateProviderPublicMetadata');
    const { FX_PROVIDER_METADATA } = await import('../../../../shared/fx/provider-metadata.mjs');
    const { providers } = buildPublicRateProviderMetadata({
      dataBaseUrl: 'https://example.com',
      supportedCurrencies: ['USD'],
    });
    expect(providers.length).toBeGreaterThan(0);
    for (const provider of providers) {
      const meta = FX_PROVIDER_METADATA[provider.providerId as keyof typeof FX_PROVIDER_METADATA];
      expect(meta).toBeDefined();
      expect({
        sourceUrl: provider.sourceUrl,
        termsUrl: provider.termsUrl,
        redistributionStatus: provider.redistributionStatus,
        attribution: provider.attribution,
      }).toEqual({
        sourceUrl: meta.sourceUrl,
        termsUrl: meta.termsUrl,
        redistributionStatus: meta.redistributionStatus,
        attribution: meta.attribution,
      });
    }
  });
});
