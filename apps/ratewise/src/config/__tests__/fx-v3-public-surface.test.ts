/**
 * FX_V3_PUBLIC=false 時，站台生成的公開資料面必須維持 main 的 v2 語意：
 * schemaVersion 2.0、openapi 2.1.0、不宣告 v3 入口或指向尚不存在的 v3 URL。
 * v3 contract schema 可預先存在於 /api/v3/，但不得被宣告為主要入口。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FX_V3_PUBLIC } from '../api-endpoints';

const PUBLIC = resolve(__dirname, '../../../public');
const read = (path: string) => readFileSync(resolve(PUBLIC, path), 'utf8');
const V3_ENTRY = /v3\/current\.json|contract\.schema\.json|releaseId|v3 current pointer/;

describe.runIf(!FX_V3_PUBLIC)('v3 public surface stays inert', () => {
  it('keeps api/latest.json on schema 2.0 without a v3 descriptor', () => {
    const latest = JSON.parse(read('api/latest.json')) as Record<string, unknown>;
    expect(latest['schemaVersion']).toBe('2.0');
    expect(latest).not.toHaveProperty('v3');
    expect(latest).not.toHaveProperty('legacySchemaVersion');
  });

  it('keeps openapi on 2.1.0 without v3 paths or schemas', () => {
    const spec = JSON.parse(read('openapi.json')) as {
      info: Record<string, unknown>;
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    expect(spec.info['version']).toBe('2.1.0');
    expect(spec.info['x-schema-version']).toBe('2.0');
    expect(Object.keys(spec.paths).some((path) => path.includes('/v3/'))).toBe(false);
    expect(spec.components.schemas).not.toHaveProperty('CurrentRelease');
    expect(spec).not.toHaveProperty('x-fx-v3-contract');
  });

  it('keeps pair endpoints on schema 2.0 without v3 fields', () => {
    for (const file of readdirSync(resolve(PUBLIC, 'api/pairs'))) {
      const pair = JSON.parse(read(`api/pairs/${file}`)) as Record<string, unknown>;
      expect(pair['schemaVersion'], file).toBe('2.0');
      expect(pair, file).not.toHaveProperty('v3CurrentUrl');
    }
  });

  it.each(['llms.txt', 'llms-full.txt', 'open-data.md', 'about.md', 'index.md'])(
    '%s does not advertise v3 entry points',
    (file) => {
      expect(read(file)).not.toMatch(V3_ENTRY);
    },
  );
});
