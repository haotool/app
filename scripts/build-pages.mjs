#!/usr/bin/env node

/**
 * Build the single Cloudflare Pages asset tree from every production app.
 * The app build scripts remain the source of truth for routes, metadata,
 * generated SEO assets, and PWA configuration.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverApps } from './lib/workspace-utils.mjs';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = resolve(ROOT_DIR, '.pages-dist');
const EXPECTED_APPS = [
  'haotool',
  'ratewise',
  'nihonname',
  'quake-school',
  'park-keeper',
  'split-meow',
  'starpuff',
  'papertrade',
];
const SUBPATH_APPS = EXPECTED_APPS.filter((app) => app !== 'haotool');
const EXCLUDED_DEPLOYMENT_FILES = new Set(['_headers', '_redirects']);
const MAX_PAGES_FILES = 20_000;
const MAX_PAGES_FILE_BYTES = 25 * 1024 * 1024;

const REDIRECTS = `# Cloudflare Pages routing SSOT for the assembled multi-app site
# Keep static assets and SSG pages addressable; only PaperTrade needs a scoped SPA fallback.
/ratewise /ratewise/ 301
/nihonname /nihonname/ 301
/quake-school /quake-school/ 301
/park-keeper /park-keeper/ 301
/split-meow /split-meow/ 301
/starpuff /starpuff/ 301
/papertrade /papertrade/ 301
/tools /tools/ 301
/about /about/ 301
/contact /contact/ 301
/projects /tools/ 301
/projects/* /tools/ 301
/ratewise/og-image.png /ratewise/og-image.jpg 301
/ratewise/twitter-image.png /ratewise/twitter-image.jpg 301
/nihonname/history /nihonname/history/ 301
/nihonname/history/kominka /nihonname/history/kominka/ 301
/nihonname/history/shimonoseki /nihonname/history/shimonoseki/ 301
/nihonname/history/san-francisco /nihonname/history/san-francisco/ 301
/papertrade/chart /papertrade/ 200
/papertrade/chart/* /papertrade/ 200
/papertrade/trade /papertrade/ 200
/papertrade/trade/ /papertrade/ 200
/papertrade/trade/* /papertrade/ 200
/papertrade/portfolio /papertrade/ 200
/papertrade/portfolio/ /papertrade/ 200
/papertrade/portfolio/* /papertrade/ 200
/papertrade/settings /papertrade/ 200
/papertrade/settings/ /papertrade/ 200
/papertrade/settings/* /papertrade/ 200
`;

const STATIC_HEADERS = [
  '# Static asset policy only. CSP/HSTS/security headers remain in security-headers Worker.',
  '',
  ...SUBPATH_APPS.flatMap((app) => [
    `/${app}/assets/*`,
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ]),
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/sw.js',
  '  Cache-Control: no-cache, no-store, must-revalidate',
  '/registerSW.js',
  '  Cache-Control: no-cache, no-store, must-revalidate',
  '/workbox-*.js',
  '  Cache-Control: no-cache, no-store, must-revalidate',
  '',
  ...SUBPATH_APPS.flatMap((app) => [
    `/${app}/sw.js`,
    '  Cache-Control: no-cache, no-store, must-revalidate',
    `/${app}/registerSW.js`,
    '  Cache-Control: no-cache, no-store, must-revalidate',
    `/${app}/workbox-*.js`,
    '  Cache-Control: no-cache, no-store, must-revalidate',
    `/${app}/manifest.webmanifest`,
    '  Cache-Control: public, no-cache, must-revalidate',
    `/${app}/sitemap.xml`,
    '  Cache-Control: public, max-age=86400',
    `/${app}/robots.txt`,
    '  Cache-Control: public, max-age=86400',
    `/${app}/llms.txt`,
    '  Cache-Control: public, max-age=86400',
    '',
  ]),
  '/manifest.webmanifest',
  '  Cache-Control: public, no-cache, must-revalidate',
  '/sitemap.xml',
  '  Cache-Control: public, max-age=86400',
  '/robots.txt',
  '  Cache-Control: public, max-age=86400',
  '/llms.txt',
  '  Cache-Control: public, max-age=86400',
  '/health',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
  '/*.md',
  '  Cache-Control: public, max-age=3600, must-revalidate',
  '  Content-Type: text/markdown; charset=utf-8',
  '  X-Robots-Tag: noindex',
  '',
  ...SUBPATH_APPS.flatMap((app) => [
    `/${app}/*.md`,
    '  Cache-Control: public, max-age=3600, must-revalidate',
    '  Content-Type: text/markdown; charset=utf-8',
    '  X-Robots-Tag: noindex',
    '',
  ]),
  '/og-image.png',
  '  Access-Control-Allow-Origin: *',
  '  Cross-Origin-Resource-Policy: cross-origin',
  '/ratewise/og-image.jpg',
  '  Access-Control-Allow-Origin: *',
  '  Cross-Origin-Resource-Policy: cross-origin',
].join('\n');

function copyTree(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) throw new Error(`找不到 build output: ${sourceDir}`);
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (EXCLUDED_DEPLOYMENT_FILES.has(entry.name)) continue;
    const source = join(sourceDir, entry.name);
    const target = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(source, target);
      continue;
    }
    if (existsSync(target) && !statSync(target).isFile())
      throw new Error(`Pages output collision: ${target}`);
    cpSync(source, target);
  }
}

function assertRequiredFile(path, label) {
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`缺少 ${label}: ${path}`);
}

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else files.push(path);
  }
  return files;
}

async function main() {
  const discovered = await discoverApps();
  const byName = new Map(discovered.map((app) => [app.name, app]));
  const missing = EXPECTED_APPS.filter((name) => !byName.has(name));
  const unexpected = discovered
    .map((app) => app.name)
    .filter((name) => !EXPECTED_APPS.includes(name));
  if (missing.length || unexpected.length) {
    throw new Error(
      `app inventory drift: missing=[${missing.join(', ')}], unexpected=[${unexpected.join(', ')}]`,
    );
  }

  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const appName of EXPECTED_APPS) {
    const app = byName.get(appName);
    const source = join(app.path, 'dist');
    const productionBase = app.config.basePath.production;
    const target =
      productionBase === '/'
        ? OUTPUT_DIR
        : join(OUTPUT_DIR, productionBase.replace(/^\/+|\/+$/g, ''));
    copyTree(source, target);
    assertRequiredFile(join(target, 'index.html'), `${appName} index.html`);
    for (const file of app.config.resources?.seoFiles ?? []) {
      assertRequiredFile(join(target, file.replace(/^\/+/, '')), `${appName} ${file}`);
    }
    console.log(`✅ assembled ${appName} → ${relative(ROOT_DIR, target)}`);
  }

  assertRequiredFile(join(OUTPUT_DIR, '404.html'), 'root 404.html');
  writeFileSync(join(OUTPUT_DIR, 'health'), 'healthy\n', 'utf8');
  writeFileSync(join(OUTPUT_DIR, '_redirects'), REDIRECTS, 'utf8');
  writeFileSync(join(OUTPUT_DIR, '_headers'), `${STATIC_HEADERS}\n`, 'utf8');
  const files = collectFiles(OUTPUT_DIR);
  if (files.length > MAX_PAGES_FILES) {
    throw new Error(`Pages output has ${files.length} files; limit is ${MAX_PAGES_FILES}`);
  }
  const oversized = files
    .map((file) => ({ file, size: statSync(file).size }))
    .filter(({ size }) => size > MAX_PAGES_FILE_BYTES);
  if (oversized.length) {
    throw new Error(
      `Pages output contains files larger than ${MAX_PAGES_FILE_BYTES} bytes: ${oversized
        .map(({ file, size }) => `${relative(ROOT_DIR, file)} (${size} bytes)`)
        .join(', ')}`,
    );
  }
  const largest = files
    .map((file) => ({ file, size: statSync(file).size }))
    .sort((a, b) => b.size - a.size)[0];
  console.log(`✅ Pages output ready: ${files.length} files`);
  console.log(`✅ largest asset: ${relative(ROOT_DIR, largest.file)} (${largest.size} bytes)`);
}

main().catch((error) => {
  console.error(`❌ Pages assembly failed: ${error.message}`);
  process.exitCode = 1;
});
