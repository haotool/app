/**
 * 更新發版相關靜態資源（目前包含 sitemap）
 * 在 Changeset version 階段執行，確保 release PR 包含最新 metadata。
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSitemap } from './generate-sitemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateSitemap() {
  const sitemap = generateSitemap();
  const outputPath = join(__dirname, '../apps/ratewise/public/sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Updated sitemap lastmod at ${outputPath}`);
}

function syncRootVersion() {
  const rootPackagePath = join(__dirname, '../package.json');
  const appPackagePath = join(__dirname, '../apps/ratewise/package.json');

  const rootPackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
  const appPackageJson = JSON.parse(readFileSync(appPackagePath, 'utf-8'));

  const appVersion = appPackageJson.version;

  if (rootPackageJson.version === appVersion) {
    console.log('ℹ️ Root package version already in sync, skipping update');
    return;
  }

  rootPackageJson.version = appVersion;
  writeFileSync(rootPackagePath, `${JSON.stringify(rootPackageJson, null, 2)}\n`, 'utf-8');
  console.log(`✅ Synced root package version to ${appVersion}`);
}

function mirrorStaticAssets() {
  const baseEnv = process.env.VITE_BASE_PATH ?? '/ratewise/';
  const normalizedSubpath = baseEnv.replace(/^\/|\/$/g, '');

  if (!normalizedSubpath) {
    console.log('ℹ️ VITE_BASE_PATH resolved to root. Skipping static asset mirroring.');
    return;
  }

  const publicDir = join(__dirname, '../apps/ratewise/public');
  const targetDir = join(publicDir, normalizedSubpath);
  mkdirSync(targetDir, { recursive: true });

  const filesToMirror = [
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'manifest.webmanifest',
    'favicon.ico',
    'favicon.svg',
    'apple-touch-icon.png',
    'loading.css',
    'logo.png',
    'og-image.png',
    'og-image-old.png',
    'pwa-192x192.png',
    'pwa-384x384.png',
    'pwa-512x512-maskable.png',
    'pwa-512x512.png',
  ];

  filesToMirror.forEach((filename) => {
    const source = join(publicDir, filename);
    if (!existsSync(source)) {
      console.warn(`⚠️  Skipping missing static asset: ${filename}`);
      return;
    }
    const destination = join(targetDir, filename);
    copyFileSync(source, destination);
  });

  const directoriesToMirror = ['icons', 'screenshots'];
  directoriesToMirror.forEach((directory) => {
    const sourceDir = join(publicDir, directory);
    if (!existsSync(sourceDir)) {
      console.warn(`⚠️  Skipping missing static directory: ${directory}`);
      return;
    }
    const destinationDir = join(targetDir, directory);
    cpSync(sourceDir, destinationDir, { recursive: true });
  });

  console.log(`✅ Mirrored static assets for subpath deployment: /${normalizedSubpath}`);
}

function main() {
  console.log('🛠  Updating release metadata');
  updateSitemap();
  syncRootVersion();
  mirrorStaticAssets();
  console.log('🎉 Release metadata update completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateSitemap };
