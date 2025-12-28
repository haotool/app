/**
 * 建置後處理腳本
 * - 確保 dist 目錄結構正確
 * - 處理尾斜線重定向
 */
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

function ensureDistStructure() {
  if (!existsSync(distDir)) {
    console.log('⚠️ dist 目錄不存在，跳過 postbuild');
    return;
  }

  // 確保 _redirects 存在（用於 Netlify/Cloudflare Pages）
  const redirectsSource = resolve(__dirname, '../public/_redirects');
  const redirectsDest = resolve(distDir, '_redirects');

  if (existsSync(redirectsSource) && !existsSync(redirectsDest)) {
    copyFileSync(redirectsSource, redirectsDest);
    console.log('✅ 複製 _redirects');
  }

  console.log('✅ postbuild 處理完成');
}

ensureDistStructure();
