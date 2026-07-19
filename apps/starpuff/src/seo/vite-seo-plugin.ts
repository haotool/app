// 建置期 SEO 注入：把 SSOT 內容寫進 index.html 的標記位，缺標記直接 fail 防止漏 meta 出貨。
import type { Plugin } from 'vite';
import { buildSeoHead, buildSeoBody } from './seo-metadata';

export const SEO_HEAD_MARKER = '<!-- %SEO_HEAD% -->';
export const SEO_BODY_MARKER = '<!-- %SEO_BODY% -->';

export function seoHtmlPlugin(): Plugin {
  return {
    name: 'starpuff-seo-inject',
    transformIndexHtml(html) {
      if (!html.includes(SEO_HEAD_MARKER) || !html.includes(SEO_BODY_MARKER)) {
        throw new Error('index.html 缺少 SEO 注入標記（%SEO_HEAD% / %SEO_BODY%）');
      }
      const buildTimeIso = new Date().toISOString();
      return html
        .replace(SEO_HEAD_MARKER, buildSeoHead(buildTimeIso))
        .replace(SEO_BODY_MARKER, buildSeoBody());
    },
  };
}
