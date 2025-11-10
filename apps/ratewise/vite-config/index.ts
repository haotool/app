/**
 * Vite 配置主檔案
 *
 * @description
 * 簡潔的主配置檔案，所有複雜邏輯已拆分至獨立模組
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:vitejs/vite:2025-10-21]
 * @philosophy
 * - Linus 三問：✅ 真問題（559行太長）| ✅ 簡潔方案（模組化）| ✅ 不破壞現有功能
 * - 好品味：消除重複邏輯，每個模組職責單一
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { UserConfig } from 'vite';
import { generateVersion } from './version.js';
import { generatePlugins } from './plugins.js';
import { generateBuildOptions } from './build-options.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = resolve(__dirname, '..', 'package.json');

/**
 * 生成 Vite 配置
 * @returns Vite UserConfig
 */
export function createViteConfig(): UserConfig {
  // 自動生成版本號（語義化版本 + git metadata）
  const appVersion = generateVersion(packagePath);
  const buildTime = new Date().toISOString();

  // [fix:2025-10-27] 遵循 Linus 原則 - "好品味"：消除條件判斷
  // CI 環境: VITE_BASE_PATH='/' (Lighthouse/E2E)
  // 生產環境: VITE_BASE_PATH='/ratewise/' (Zeabur)
  const base = process.env['VITE_BASE_PATH'] ?? '/';

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: generatePlugins(base, appVersion, buildTime),
    resolve: {
      alias: {
        '@app/ratewise': resolve(__dirname, '..', 'src'),
        '@shared': resolve(__dirname, '../../shared'),
      },
    },
    build: generateBuildOptions(),
  };
}
