#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Sitemap/SSG 一致性驗證腳本
 * 確保 sitemap.xml 與 SSG 預渲染路徑一致
 *
 * 建立時間: 2025-11-30T13:54:46+08:00
 * 依據: docs/dev/002_development_reward_penalty_log.md - 避免 sitemap/SSG 不一致
 *
 * 使用方式:
 *   node scripts/verify-sitemap-ssg.mjs
 *
 * CI 整合:
 *   pnpm verify:sitemap
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// sitemap.xml 路徑
const SITEMAP_PATH = resolve(rootDir, 'apps/ratewise/public/sitemap.xml');

// routes.tsx 路徑
const ROUTES_PATH = resolve(rootDir, 'apps/ratewise/src/routes.tsx');

// vite.config.ts 路徑
const VITE_CONFIG_PATH = resolve(rootDir, 'apps/ratewise/vite.config.ts');

/**
 * 從 sitemap.xml 提取 URL 路徑
 */
function extractSitemapPaths(sitemapContent) {
  const locRegex = /<loc>https:\/\/app\.haotool\.org\/ratewise(\/[^<]*)<\/loc>/g;
  const paths = [];
  let match;

  while ((match = locRegex.exec(sitemapContent)) !== null) {
    // 移除尾斜線以標準化比較
    const path = match[1].replace(/\/+$/, '') || '/';
    paths.push(path);
  }

  return paths;
}

/**
 * 從 routes.tsx 提取 getIncludedRoutes 中的路徑
 */
function extractRoutesIncludedPaths(routesContent) {
  const match = /const includedPaths = \[([^\]]+)\]/.exec(routesContent);
  if (!match) {
    console.error('❌ 無法從 routes.tsx 提取 includedPaths');
    return [];
  }

  // 解析陣列內容
  const pathsString = match[1];
  const paths = pathsString
    .split(',')
    .map((p) => p.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  return paths;
}

/**
 * 從 vite.config.ts 提取 ssgOptions.includedRoutes 中的路徑
 */
function extractViteConfigPaths(viteContent) {
  const match = /const includedPaths = \[([^\]]+)\]/.exec(viteContent);
  if (!match) {
    console.error('❌ 無法從 vite.config.ts 提取 includedPaths');
    return [];
  }

  const pathsString = match[1];
  const paths = pathsString
    .split(',')
    .map((p) => p.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  return paths;
}

/**
 * 比較兩個路徑陣列
 */
function comparePaths(name1, paths1, name2, paths2) {
  const set1 = new Set(paths1.map((p) => (p === '/' ? '/' : p.replace(/\/+$/, ''))));
  const set2 = new Set(paths2.map((p) => (p === '/' ? '/' : p.replace(/\/+$/, ''))));

  const onlyIn1 = [...set1].filter((p) => !set2.has(p));
  const onlyIn2 = [...set2].filter((p) => !set1.has(p));

  return { onlyIn1, onlyIn2 };
}

async function main() {
  console.log('🔍 Sitemap/SSG 一致性驗證\n');

  let hasErrors = false;

  try {
    // 讀取檔案
    const sitemapContent = readFileSync(SITEMAP_PATH, 'utf-8');
    const routesContent = readFileSync(ROUTES_PATH, 'utf-8');
    const viteContent = readFileSync(VITE_CONFIG_PATH, 'utf-8');

    // 提取路徑
    const sitemapPaths = extractSitemapPaths(sitemapContent);
    const routesPaths = extractRoutesIncludedPaths(routesContent);
    const vitePaths = extractViteConfigPaths(viteContent);

    console.log(`📄 sitemap.xml 路徑: ${JSON.stringify(sitemapPaths)}`);
    console.log(`📄 routes.tsx 路徑:  ${JSON.stringify(routesPaths)}`);
    console.log(`📄 vite.config.ts:   ${JSON.stringify(vitePaths)}`);
    console.log('');

    // 驗證 1: sitemap vs routes.tsx
    const { onlyIn1: onlyInSitemap, onlyIn2: onlyInRoutes } = comparePaths(
      'sitemap',
      sitemapPaths,
      'routes',
      routesPaths,
    );

    if (onlyInSitemap.length > 0) {
      console.error(`❌ sitemap.xml 包含但 routes.tsx 未預渲染: ${JSON.stringify(onlyInSitemap)}`);
      hasErrors = true;
    }

    if (onlyInRoutes.length > 0) {
      console.error(`❌ routes.tsx 預渲染但 sitemap.xml 未包含: ${JSON.stringify(onlyInRoutes)}`);
      hasErrors = true;
    }

    // 驗證 2: routes.tsx vs vite.config.ts
    const { onlyIn1: onlyInRoutesVsVite, onlyIn2: onlyInVite } = comparePaths(
      'routes',
      routesPaths,
      'vite',
      vitePaths,
    );

    if (onlyInRoutesVsVite.length > 0 || onlyInVite.length > 0) {
      console.error(`❌ routes.tsx 與 vite.config.ts 不一致:`);
      if (onlyInRoutesVsVite.length > 0) {
        console.error(`   - 只在 routes.tsx: ${JSON.stringify(onlyInRoutesVsVite)}`);
      }
      if (onlyInVite.length > 0) {
        console.error(`   - 只在 vite.config.ts: ${JSON.stringify(onlyInVite)}`);
      }
      hasErrors = true;
    }

    // 結果
    console.log('');
    if (hasErrors) {
      console.error('❌ 驗證失敗：sitemap/SSG 配置不一致');
      console.error('   請確保以下三個位置的路徑一致：');
      console.error('   1. apps/ratewise/public/sitemap.xml');
      console.error('   2. apps/ratewise/src/routes.tsx (getIncludedRoutes)');
      console.error('   3. apps/ratewise/vite.config.ts (ssgOptions.includedRoutes)');
      process.exit(1);
    } else {
      console.log('✅ 驗證通過：sitemap/SSG 配置一致');
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ 驗證失敗：${error.message}`);
    process.exit(1);
  }
}

main();
