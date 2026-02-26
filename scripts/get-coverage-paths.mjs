#!/usr/bin/env node
/* eslint-env node */
/**
 * 動態發現所有 app 的 coverage 檔案路徑
 *
 * 用法:
 *   node scripts/get-coverage-paths.mjs
 *   # 輸出: apps/ratewise/coverage/coverage-final.json,apps/park-keeper/coverage/coverage-final.json,...
 *
 * 依據: [workspace-utils.mjs discoverApps][SSOT]
 */

import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverApps } from './lib/workspace-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const apps = await discoverApps();
const paths = apps
  .map((a) => join(a.path, 'coverage', 'coverage-final.json'))
  .filter(existsSync)
  .map((p) => relative(ROOT, p));

process.stdout.write(paths.join(','));
