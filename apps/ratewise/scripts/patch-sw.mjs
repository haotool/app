#!/usr/bin/env node
/**
 * Post-build script: Patch Service Worker with required polyfills
 *
 * Issue: Workbox uses location.href and document which are undefined in SW context
 * Solution: Inject polyfills at the beginning of sw.js
 *
 * Reference:
 * - [Vite Issue #12611] Undefined document in worker
 * - [MDN: WorkerGlobalScope.location]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SW_PATH = resolve(__dirname, '../dist/sw.js');

const POLYFILL = `// [Workbox Polyfill] Service Worker 環境全域變數修正
// Service Workers 沒有 location 屬性（這是 Window 專屬）
// Workbox 使用 location.href 作為 URL 構造的 base，必須是完整的 URL
// Reference: [Vite Issue #12611] [MDN: ServiceWorkerGlobalScope]

// 獲取 Service Worker 的完整 URL（從 scope 或 importScripts 推斷）
function getServiceWorkerLocation() {
  try {
    // 優先使用 registration.scope（完整的 URL）
    if (self.registration && self.registration.scope) {
      return self.registration.scope;
    }
    // 回退：使用當前執行腳本的 URL
    // 在 SW 中，self 有一個隱藏的 location 屬性指向腳本URL
    if (self.location && self.location.href) {
      return self.location.href;
    }
    // 最後回退：假設在根目錄
    return 'http://localhost/';
  } catch (e) {
    return 'http://localhost/';
  }
}

// 創建假的 location 物件
var location = {
  href: getServiceWorkerLocation(),
  get origin() {
    try {
      return new URL(this.href).origin;
    } catch (e) {
      return '';
    }
  }
};

// document 在 SW 中不存在
var document = undefined;

// 同時在 self 上定義
self.location = location;
self.document = undefined;

`;

try {
  console.log('📝 Patching sw.js with Workbox polyfills...');

  const swContent = readFileSync(SW_PATH, 'utf8');

  // Check if already patched
  if (swContent.includes('[Workbox Polyfill]')) {
    console.log('✅ sw.js already patched, skipping');
    process.exit(0);
  }

  const patchedContent = POLYFILL + swContent;

  writeFileSync(SW_PATH, patchedContent, 'utf8');

  console.log('✅ Successfully patched sw.js');
  console.log(`   Size: ${(patchedContent.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Failed to patch sw.js:', error.message);
  process.exit(1);
}
