/**
 * Vite Plugin: Non-Blocking CSS
 * [Lighthouse-optimization:2025-10-28] 實現非阻塞 CSS 載入
 * 參考: https://web.dev/articles/defer-non-critical-css
 *
 * 原理:
 * 1. 使用 media="print" 延遲 CSS 載入（不阻塞渲染）
 * 2. onload 時切換回 media="all" 應用樣式
 * 3. 關鍵 CSS 已內聯在 <style> 標籤中，確保首屏立即渲染
 *
 * 效果:
 * - FCP 提升：CSS 不再阻塞首次內容繪製
 * - LCP 提升：骨架屏立即顯示，減少白屏時間
 * - 使用者體驗：立即看到內容結構（骨架屏），而非空白頁面
 */

import type { Plugin } from 'vite';

export function nonBlockingCssPlugin(): Plugin {
  return {
    name: 'non-blocking-css',
    enforce: 'post', // 在 Vite 生成 HTML 之後執行
    transformIndexHtml(html) {
      // 將 CSS link 轉換為非阻塞載入
      // <link rel="stylesheet" href="..." />
      // 轉換為:
      // <link rel="preload" href="..." as="style" onload="this.onload=null;this.rel='stylesheet'" />
      // <noscript><link rel="stylesheet" href="..." /></noscript>

      return html.replace(
        /<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+)">/g,
        (_match, href) => {
          return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="${href}"></noscript>`;
        },
      );
    },
  };
}
