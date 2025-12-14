#!/usr/bin/env node
/* eslint-env node */
/**
 * Workspace 自動發現工具
 *
 * 功能:
 * 1. 從 pnpm-workspace.yaml 自動發現所有 apps
 * 2. 載入每個 app 的 app.config.mjs 配置
 * 3. 提供統一的配置訪問介面
 *
 * 使用範例:
 *   import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';
 *
 *   const apps = await discoverApps();
 *   const ratewise = await loadAppConfig('ratewise');
 *
 * 建立時間: 2025-12-15
 * 依據: [Linus: 消除特殊情況][自動發現優於硬編碼]
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT_DIR = resolve(__dirname, '../..');

/**
 * 自動發現所有 apps
 *
 * 從 pnpm-workspace.yaml 讀取 workspace 配置，
 * 掃描 apps/ 目錄下所有包含 app.config.mjs 的子目錄
 *
 * @returns {Promise<Array<{name: string, path: string, config: Object}>>} Apps 列表
 */
export async function discoverApps() {
  try {
    // 讀取 pnpm-workspace.yaml
    const yamlPath = join(ROOT_DIR, 'pnpm-workspace.yaml');

    if (!existsSync(yamlPath)) {
      throw new Error(`pnpm-workspace.yaml not found at ${yamlPath}`);
    }

    const yaml = readFileSync(yamlPath, 'utf-8');

    // 簡單解析 YAML (假設格式為 "packages: - apps/*")
    // 生產環境可使用 yaml 解析庫，但為了減少依賴，這裡使用簡單方式
    const packagePatterns =
      yaml
        .match(/packages:\s*\n((?:\s*-\s*.+\n)*)/)?.[1]
        ?.split('\n')
        .map((line) => line.trim().replace(/^-\s*/, ''))
        .filter(Boolean) || [];

    const apps = [];

    // 處理每個 pattern (目前只支持 apps/*)
    for (const pattern of packagePatterns) {
      if (pattern === 'apps/*') {
        const appsDir = join(ROOT_DIR, 'apps');

        if (!existsSync(appsDir)) {
          console.warn(`⚠️  Apps directory not found: ${appsDir}`);
          continue;
        }

        const entries = readdirSync(appsDir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const appPath = join(appsDir, entry.name);
            const configPath = join(appPath, 'app.config.mjs');

            if (existsSync(configPath)) {
              try {
                // 動態導入配置
                // 使用 file:// protocol 確保跨平台相容
                const configUrl = `file://${configPath}`;
                const module = await import(configUrl);

                if (!module.APP_CONFIG) {
                  console.warn(`⚠️  ${entry.name}/app.config.mjs missing APP_CONFIG export`);
                  continue;
                }

                apps.push({
                  name: module.APP_CONFIG.name,
                  path: appPath,
                  config: module.APP_CONFIG,
                });
              } catch (error) {
                console.warn(`⚠️  Failed to load ${entry.name}/app.config.mjs: ${error.message}`);
              }
            }
          }
        }
      }
    }

    return apps;
  } catch (error) {
    console.error('❌ Error discovering apps:', error);
    throw error;
  }
}

/**
 * 載入特定 app 的配置
 *
 * @param {string} appName - App 名稱 (例如: 'ratewise', 'nihonname')
 * @returns {Promise<{name: string, path: string, config: Object} | undefined>} App 配置或 undefined
 */
export async function loadAppConfig(appName) {
  const apps = await discoverApps();
  return apps.find((app) => app.name === appName);
}

/**
 * 獲取所有啟用 SSG 的 apps
 *
 * @returns {Promise<Array<{name: string, path: string, config: Object}>>} SSG apps 列表
 */
export async function getSSGApps() {
  const apps = await discoverApps();
  return apps.filter((app) => app.config.build?.ssg === true);
}

/**
 * 驗證 app 配置完整性
 *
 * @param {Object} config - APP_CONFIG 對象
 * @returns {{valid: boolean, errors: string[]}} 驗證結果
 */
export function validateAppConfig(config) {
  const errors = [];

  // 必要欄位檢查
  if (!config.name) errors.push('Missing required field: name');
  if (!config.displayName) errors.push('Missing required field: displayName');
  if (!config.basePath) errors.push('Missing required field: basePath');
  if (!config.seoPaths || !Array.isArray(config.seoPaths)) {
    errors.push('Missing or invalid field: seoPaths (must be array)');
  }
  if (!config.siteUrl) errors.push('Missing required field: siteUrl');

  // basePath 結構檢查
  if (config.basePath) {
    if (!config.basePath.development) errors.push('Missing basePath.development');
    if (!config.basePath.ci) errors.push('Missing basePath.ci');
    if (!config.basePath.production) errors.push('Missing basePath.production');
  }

  // seoPaths 格式檢查
  if (config.seoPaths && Array.isArray(config.seoPaths)) {
    const invalidPaths = config.seoPaths.filter((path) => {
      // 根路徑或帶尾斜線的路徑
      return path !== '/' && !path.endsWith('/');
    });

    if (invalidPaths.length > 0) {
      errors.push(`SEO paths must end with '/': ${invalidPaths.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
