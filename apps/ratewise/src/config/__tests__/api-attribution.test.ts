import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FX_PUBLISHER } from '../../../../shared/fx/publisher-metadata.mjs';
import { ensurePrerenderDist } from '../../__tests__/helpers/ensurePrerenderDist';
import { API_ATTRIBUTION } from '../seo-metadata/api-attribution';
import { OPEN_DATA_PAGE_SEO } from '../seo-metadata/core';
import {
  FX_ATTRIBUTION_METADATA,
  FX_PROVIDER_METADATA,
} from '../../../../shared/fx/provider-metadata.mjs';
import {
  CURRENCY_SEO_PATHS,
  INDEXABLE_AMOUNT_SEO_PATHS,
  INDEXABLE_REVERSE_AMOUNT_SEO_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
} from '../seo-paths';

const ROOT = resolve(import.meta.dirname, '../../..');
const PUBLIC = resolve(ROOT, 'public');
const noDofollowRequirement = /(必須|須|需|require[sd]?|must).{0,20}do-?follow/i;
const noNofollowBan = /(不得|禁止|must not|may not).{0,20}nofollow/i;
const noRateCopyright = /著作權所有|all rights reserved|©.*(匯率|RateWise)/i;

describe('RateWise API attribution SSOT', () => {
  it('renders ExchangeRate-API attribution on the homepage and each currency comparison page', async () => {
    const landingPaths = [
      ...CURRENCY_SEO_PATHS,
      ...REVERSE_CURRENCY_SEO_PATHS,
      ...INDEXABLE_AMOUNT_SEO_PATHS,
      ...INDEXABLE_REVERSE_AMOUNT_SEO_PATHS,
    ];
    const currencyPaths = landingPaths.map((path) =>
      resolve(ROOT, 'dist', path.replace(/^\//, ''), 'index.html'),
    );
    const homePath = resolve(ROOT, 'dist/index.html');
    await ensurePrerenderDist({
      projectRoot: ROOT,
      distRoot: resolve(ROOT, 'dist'),
      requiredPaths: [homePath, ...currencyPaths],
      sourcePaths: [
        resolve(ROOT, 'src/components/CurrencyLandingPage.tsx'),
        resolve(ROOT, 'src/components/HomepageSEOSection.tsx'),
        resolve(ROOT, 'src/components/ExchangeRateApiAttribution.tsx'),
      ],
    });

    const provider = FX_ATTRIBUTION_METADATA.exchangeRateApi;
    expect(provider.name).toBe('ExchangeRate-API');
    expect(provider.sourceUrl).toBe(['https:', '', 'www.exchangerate-api.com'].join('/'));
    expect(provider.requiredText).toBe('Rates By Exchange Rate API');
    const escapedUrl = provider.sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expectedLink = new RegExp(`<a href="${escapedUrl}">${provider.requiredText}<\\/a>`, 'g');
    for (const path of [homePath, ...currencyPaths]) {
      const html = readFileSync(path, 'utf8');
      expect(html.match(expectedLink), path).toHaveLength(1);
    }
  }, 300000);

  it('keeps ExchangeRate-API-derived spread figures out of llms mirrors', () => {
    const provider = FX_ATTRIBUTION_METADATA.exchangeRateApi;
    expect(readFileSync(resolve(PUBLIC, 'index.md'), 'utf8')).toContain(provider.attributionLine);
    for (const file of ['llms.txt', 'llms-full.txt']) {
      const content = readFileSync(resolve(PUBLIC, file), 'utf8');
      expect(content).not.toContain('主要貨幣通常約 1～2%');
    }
  });

  it('keeps the provider URL literal in shared provider metadata only', () => {
    const providerUrl = FX_ATTRIBUTION_METADATA.exchangeRateApi.sourceUrl;
    const sourceRoots = [
      resolve(ROOT, 'src'),
      resolve(ROOT, 'scripts'),
      resolve(ROOT, '../shared/fx'),
    ];
    const literals = sourceRoots
      .flatMap(collectSourceFiles)
      .filter((file) => readFileSync(file, 'utf8').includes(providerUrl));
    const ssotPath = resolve(ROOT, '../shared/fx/provider-metadata.mjs');
    expect(literals).toEqual([ssotPath]);
    expect(readFileSync(ssotPath, 'utf8').split(providerUrl)).toHaveLength(2);
  });

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
      const publisherText = file.startsWith('llms')
        ? FX_PUBLISHER.requiredText.replace('）', ' ）')
        : FX_PUBLISHER.requiredText;
      expect(mirror).toContain(publisherText);
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
    expect(openapi.components.schemas.RatesResponse.properties).not.toHaveProperty('publisher');
    expect(openapi.components.schemas.PairInfo.properties.publisher.example).toEqual(FX_PUBLISHER);
  });

  it('keeps exactly one Dataset with usage terms and upstream provenance', async () => {
    const blocks = OPEN_DATA_PAGE_SEO.jsonLd ?? [];
    const dataset = blocks.filter((block) => block['@type'] === 'Dataset');
    expect(dataset).toHaveLength(1);
    expect(dataset[0]).toMatchObject({
      creator: { '@type': 'Organization', name: FX_PUBLISHER.name },
      usageInfo: FX_PUBLISHER.termsUrl,
      isBasedOn: [FX_PROVIDER_METADATA.bot.sourceUrl, FX_PROVIDER_METADATA.moneybox.sourceUrl],
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
      usageInfo: FX_PUBLISHER.termsUrl,
      isBasedOn: [FX_PROVIDER_METADATA.bot.sourceUrl, FX_PROVIDER_METADATA.moneybox.sourceUrl],
      isAccessibleForFree: true,
      citation: FX_PUBLISHER.requiredText,
    });
  }, 300000);

  it('does not claim copyright over rates in terms or OpenData source', () => {
    expect(API_ATTRIBUTION.terms.join('\n')).not.toMatch(noRateCopyright);
    expect(readFileSync(resolve(ROOT, 'src/pages/OpenData.tsx'), 'utf8')).not.toMatch(
      noRateCopyright,
    );
  });
});

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(?:mjs|mts|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}
