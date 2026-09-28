import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FX_PUBLISHER } from '../../../../shared/fx/publisher-metadata.mjs';
import { ensurePrerenderDist } from '../../__tests__/helpers/ensurePrerenderDist';
import { API_ATTRIBUTION } from '../seo-metadata/api-attribution';
import { OPEN_DATA_PAGE_SEO } from '../seo-metadata/core';

const ROOT = resolve(import.meta.dirname, '../../..');
const PUBLIC = resolve(ROOT, 'public');
const noDofollowRequirement = /(必須|須|需|require[sd]?|must).{0,20}do-?follow/i;
const noNofollowBan = /(不得|禁止|must not|may not).{0,20}nofollow/i;
const noRateCopyright = /著作權所有|all rights reserved|©.*(匯率|RateWise)/i;

describe('RateWise API attribution SSOT', () => {
  it('does not require dofollow or forbid nofollow in terms or generated surfaces', () => {
    const files = [
      'open-data.md',
      'llms.txt',
      'llms-full.txt',
      'openapi.json',
      'api/latest.json',
      '_headers',
      ...readdirSync(resolve(PUBLIC, 'api/pairs')).map((file) => `api/pairs/${file}`),
    ];
    const content = [
      API_ATTRIBUTION.terms.join('\n'),
      readFileSync(resolve(ROOT, 'src/pages/OpenData.tsx'), 'utf8'),
      ...files.map((file) => readFileSync(resolve(PUBLIC, file), 'utf8')),
    ].join('\n');
    expect(content).not.toMatch(noDofollowRequirement);
    expect(content).not.toMatch(noNofollowBan);
    for (const file of ['open-data.md', 'llms.txt', 'llms-full.txt']) {
      const mirror = readFileSync(resolve(PUBLIC, file), 'utf8');
      expect(mirror).toContain(FX_PUBLISHER.requiredText);
      expect(mirror).toContain('rel="nofollow"');
      expect(mirror).toContain('rel="sponsored"');
      expect(mirror).toContain('rel="ugc"');
      expect(mirror).toContain(FX_PUBLISHER.termsUrl);
    }
  });

  it('makes the additive v2 publisher agree with the v3 SSOT and OpenAPI example', () => {
    const latest = JSON.parse(readFileSync(resolve(PUBLIC, 'api/latest.json'), 'utf8'));
    const openapi = JSON.parse(readFileSync(resolve(PUBLIC, 'openapi.json'), 'utf8'));
    expect(latest.publisher).toEqual(FX_PUBLISHER);
    for (const file of readdirSync(resolve(PUBLIC, 'api/pairs'))) {
      expect(
        JSON.parse(readFileSync(resolve(PUBLIC, 'api/pairs', file), 'utf8')).publisher,
      ).toEqual(FX_PUBLISHER);
    }
    expect(openapi.info['x-publisher']).toEqual(FX_PUBLISHER);
    expect(openapi.components.schemas.Publisher.example).toEqual(FX_PUBLISHER);
    expect(openapi.components.schemas.RatesResponse.properties.publisher.example).toEqual(
      FX_PUBLISHER,
    );
    expect(openapi.components.schemas.PairInfo.properties.publisher.example).toEqual(FX_PUBLISHER);
  });

  it('keeps the terms Link rules and exactly one Dataset in the prerendered page', async () => {
    const headers = readFileSync(resolve(PUBLIC, '_headers'), 'utf8');
    expect(headers).toContain(
      '/ratewise/api/*\n  Link: <' + FX_PUBLISHER.termsUrl + '>; rel="terms-of-service"',
    );
    expect(headers).toContain(
      '/ratewise/openapi.json\n  Link: <' + FX_PUBLISHER.termsUrl + '>; rel="terms-of-service"',
    );

    const blocks = OPEN_DATA_PAGE_SEO.jsonLd ?? [];
    const dataset = blocks.filter((block) => block['@type'] === 'Dataset');
    expect(dataset).toHaveLength(1);
    expect(dataset[0]).toMatchObject({
      creator: { '@type': 'Organization', name: FX_PUBLISHER.name },
      license: FX_PUBLISHER.termsUrl,
      isAccessibleForFree: true,
      citation: FX_PUBLISHER.requiredText,
    });
    expect(JSON.stringify(dataset[0]).match(/"@type":"Dataset"/g)).toHaveLength(1);

    const openDataHtmlPath = resolve(PUBLIC, '../dist/open-data/index.html');
    await ensurePrerenderDist({
      projectRoot: ROOT,
      distRoot: resolve(PUBLIC, '../dist'),
      requiredPaths: [openDataHtmlPath],
      sourcePaths: [
        resolve(ROOT, 'src/pages/OpenData.tsx'),
        resolve(ROOT, 'src/config/seo-metadata/core.ts'),
      ],
    });
    const html = readFileSync(openDataHtmlPath, 'utf8');
    expect(html).toContain('id="api-terms"');
    const graph = [
      ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ].flatMap(([, json]) => {
      const parsed = JSON.parse(json ?? '{}') as { '@graph'?: Record<string, unknown>[] };
      return parsed['@graph'] ?? [parsed as Record<string, unknown>];
    });
    const prerenderedDatasets = graph.filter((block) => block['@type'] === 'Dataset');
    expect(prerenderedDatasets).toHaveLength(1);
    expect(prerenderedDatasets[0]).toMatchObject({
      creator: { '@type': 'Organization', name: FX_PUBLISHER.name },
      license: FX_PUBLISHER.termsUrl,
      isAccessibleForFree: true,
      citation: FX_PUBLISHER.requiredText,
    });
  });

  it('does not claim copyright over rates in terms or OpenData source', () => {
    expect(API_ATTRIBUTION.terms.join('\n')).not.toMatch(noRateCopyright);
    expect(readFileSync(resolve(ROOT, 'src/pages/OpenData.tsx'), 'utf8')).not.toMatch(
      noRateCopyright,
    );
  });
});
