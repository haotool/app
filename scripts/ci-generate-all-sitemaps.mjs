#!/usr/bin/env node
/**
 * CI Sitemap Generator - Unified script for all apps
 *
 * Generates sitemap.xml for all apps in CI/CD environment
 * Uses app.config.mjs as SSOT for paths
 *
 * Usage:
 *   node scripts/ci-generate-all-sitemaps.mjs
 *
 * Created: 2025-12-30
 * Depends: workspace-utils.mjs, app.config.mjs (each app)
 *
 * BDD Status: Phase 2 GREEN (implementation)
 */

import { existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { discoverApps } from './lib/workspace-utils.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * Generate sitemap for RateWise (2025 standard with Image Sitemap)
 * Uses existing generate-sitemap-2025.mjs via exec
 */
async function generateRateWiseSitemap(appName, appPath, config) {
  try {
    log(colors.cyan, '📝', `${appName}: Using 2025 standard with Image Sitemap Extension`);

    // Execute existing script
    const scriptPath = resolve(rootDir, 'scripts/generate-sitemap-2025.mjs');
    await execAsync(`node "${scriptPath}"`, { cwd: rootDir });

    log(colors.green, '✓', `${appName}: sitemap.xml generated (${config.seoPaths.length} URLs)`);
  } catch (error) {
    log(colors.red, '✗', `${appName}: Generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate sitemap for traditional apps (nihonname, haotool, quake-school)
 *
 * 2025 SEO Best Practices:
 * - Google and Bing ignore <changefreq> and <priority>
 * - Only <loc> and <lastmod> are meaningful
 * - Reference: Google Search Central, Bing Webmaster Guidelines
 */
function generateTraditionalSitemap(appName, appPath, config) {
  const { seoPaths, siteUrl } = config;
  // Use ISO 8601 format with timezone for lastmod
  const lastmod = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  function buildFullUrl(path) {
    const base = siteUrl.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  function escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function generateUrlEntry(path) {
    const fullUrl = buildFullUrl(path);
    return `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${escapeXml(fullUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(fullUrl)}" />
  </url>`;
  }

  const urlEntries = seoPaths.map(generateUrlEntry).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;

  const outputPath = resolve(appPath, 'public/sitemap.xml');

  // Ensure public/ directory exists
  if (!existsSync(resolve(appPath, 'public'))) {
    log(colors.yellow, '⚠', `${appName}: public/ directory not found, skipping`);
    log(colors.cyan, 'ℹ', 'Run "pnpm build" first to create public/ directory');
    return;
  }

  writeFileSync(outputPath, sitemap, 'utf-8');
  log(colors.green, '✓', `${appName}: sitemap.xml generated (${seoPaths.length} URLs)`);
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bold}${colors.cyan}🗺️  CI Sitemap Generator${colors.reset}`);
  console.log('━'.repeat(60));

  try {
    // Auto-discover all apps
    const apps = await discoverApps();
    const appNames = apps.map((a) => a.name);
    console.log(`\n📦 Discovered ${apps.length} apps: ${appNames.join(', ')}`);

    let successCount = 0;
    let failureCount = 0;

    for (const app of apps) {
      console.log(`\n${colors.cyan}${colors.bold}📦 ${app.config.displayName}${colors.reset}`);

      try {
        if (app.name === 'ratewise') {
          // RateWise uses advanced 2025 standard
          await generateRateWiseSitemap(app.name, app.path, app.config);
        } else {
          // Traditional sitemap for other apps
          generateTraditionalSitemap(app.name, app.path, app.config);
        }
        successCount++;
      } catch (error) {
        log(colors.red, '✗', `${app.name}: Failed - ${error.message}`);
        failureCount++;
      }
    }

    console.log('\n' + '━'.repeat(60));

    if (failureCount === 0) {
      log(colors.green, '✅', `All ${successCount} sitemaps generated successfully`);
      process.exit(0);
    } else {
      log(colors.red, '❌', `${failureCount}/${apps.length} apps failed`);
      process.exit(1);
    }
  } catch (error) {
    log(colors.red, '❌', `Generation failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
