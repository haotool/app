#!/usr/bin/env node
/* eslint-env node */
/**
 * 動態取得 monorepo 中所有 apps 的版本資訊
 *
 * 用法:
 *   node scripts/get-release-metadata.mjs
 *   # 輸出 JSON: [{ name, displayName, version, packageName }]
 *
 *   node scripts/get-release-metadata.mjs --changed
 *   # 只輸出與前一個 commit 相比版本號有變更的 apps
 *
 * 依據: [workspace-utils.mjs discoverApps][SSOT app.config.mjs]
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { discoverApps } from './lib/workspace-utils.mjs';

const changedOnly = process.argv.includes('--changed');

const apps = await discoverApps();
const results = [];

for (const app of apps) {
  const pkgPath = join(app.path, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const currentVersion = pkg.version;
  const packageName = pkg.name;

  let changed = true;
  if (changedOnly) {
    try {
      const prevPkg = execSync(`git show HEAD^:${join('apps', app.name, 'package.json')}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const prevVersion = JSON.parse(prevPkg).version;
      changed = prevVersion !== currentVersion;
    } catch {
      changed = true;
    }
  }

  if (!changedOnly || changed) {
    results.push({
      name: app.name,
      displayName: app.config.displayName,
      version: currentVersion,
      packageName,
    });
  }
}

process.stdout.write(JSON.stringify(results));
