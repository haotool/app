import fs from 'node:fs';
import path from 'node:path';
import {
  CURRENCY_SEO_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
  SEO_PATHS,
  PRERENDER_PATHS,
} from '../seo-paths.config.mjs';

const README_PATH = path.resolve('apps/ratewise/README.md');

const currencyCodes = new Set(
  [...CURRENCY_SEO_PATHS, ...REVERSE_CURRENCY_SEO_PATHS].flatMap((route) =>
    [...route.matchAll(/[a-z]{3}/g)].map(([code]) => code.toUpperCase()),
  ),
);

const statusBlock = `<!-- SEO_STATUS_START -->\n支援 ${currencyCodes.size} 種貨幣；${SEO_PATHS.length} 個可索引 SEO path；${PRERENDER_PATHS.length} 個 SSG prerender path。\n<!-- SEO_STATUS_END -->`;

const readme = fs.readFileSync(README_PATH, 'utf8');
const markerPattern = /<!-- SEO_STATUS_START -->[\s\S]*?<!-- SEO_STATUS_END -->/;

if (!markerPattern.test(readme)) {
  throw new Error('README marker block not found.');
}

const nextReadme = readme.replace(markerPattern, statusBlock);

if (nextReadme === readme) {
  console.log('README SEO status already up to date.');
  process.exit(0);
}

fs.writeFileSync(README_PATH, nextReadme);
console.log(
  `✅ Updated README SEO status: ${SEO_PATHS.length} SEO paths / ${PRERENDER_PATHS.length} SSG paths`,
);
