#!/usr/bin/env node
/**
 * Sitemap 2026 標準生成器入口。
 *
 * 實作仍集中於 generate-sitemap-2025.mjs，避免在過渡期複製 sitemap 邏輯。
 */

import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { main, generateSitemap } from './generate-sitemap-2025.mjs';

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('生成失敗:', error);
    process.exit(1);
  });
}

export { generateSitemap };
