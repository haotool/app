import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SUPPORTED_CURRENCY_COUNT } from './features/ratewise/constants';

const ROOT = resolve(__dirname, '..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

describe('SEO 內容真實性與 SSOT', () => {
  it('不應再宣稱不存在的 30+ 種貨幣支援', () => {
    const files = [
      'src/config/seo-metadata.ts',
      'src/pages/About.tsx',
      'src/pages/FAQ.tsx',
      'src/pages/Guide.tsx',
      'src/pages/MultiConverter.tsx',
      'src/pages/Favorites.tsx',
      'public/manifest.webmanifest',
      'public/llms.txt',
      'public/llms-full.txt',
    ];

    files.forEach((file) => {
      const content = read(file);
      expect(content).not.toMatch(/30\+/);
      expect(content).not.toMatch(/超過\s*30\s*種/);
    });

    expect(SUPPORTED_CURRENCY_COUNT).toBe(18);
  });

  it('不應保留過時的實驗室效能宣稱', () => {
    const files = [
      'src/pages/About.tsx',
      'src/pages/FAQ.tsx',
      'public/llms.txt',
      'public/llms-full.txt',
    ];

    files.forEach((file) => {
      const content = read(file);
      expect(content).not.toContain('489ms');
      expect(content).not.toMatch(/97\+?\/100/);
      expect(content).not.toContain('Lighthouse SEO 100/100');
    });
  });

  it('隱私頁應揭露實際的分析服務使用情況', () => {
    const privacyContent = read('src/pages/Privacy.tsx');

    expect(privacyContent).toContain('Google Analytics');
    expect(privacyContent).not.toContain('不使用追蹤 Cookie');
  });

  it('SEO 技術揭露頁的 E-E-A-T 信任訊號不得宣稱無追蹤', () => {
    const seoTechContent = read('src/pages/SeoTech.tsx');

    expect(seoTechContent).toContain('匿名流量分析');
    expect(seoTechContent).not.toContain('無追蹤');
  });

  it('seo-metadata 不應包含誤導性總覽宣稱', () => {
    const seoMetadata = read('src/config/seo-metadata.ts');

    // 「均符合」等概括性宣稱不應出現於程式碼，易導致未來維護者誤解
    expect(seoMetadata).not.toContain('均符合 Google Rich Results 規範');
  });

  it('SEO 與機器可讀文案不得保留過度承諾或 AI-first 標語', () => {
    const files = [
      'src/config/seo-static.ts',
      'src/config/seo-paths.ts',
      'src/config/seo-metadata.ts',
      'src/pages/OpenData.tsx',
      'src/pages/SeoTech.tsx',
      'src/pages/Guide.tsx',
      'scripts/generate-llms-txt.mjs',
      'scripts/generate-markdown-mirrors.mjs',
      'scripts/generate-api-json.mjs',
      'public/index.md',
      'public/about.md',
      'public/open-data.md',
      'public/faq.md',
      'public/llms.txt',
      'public/llms-full.txt',
      'public/api/latest.json',
    ];

    const riskyPatterns = [
      /台灣最精準/,
      /最精準/,
      /精確估算/,
      /無請求上限/,
      /AI-Ready/,
      /AI 友善/,
      /每 5 分鐘自動同步/,
      /每 5 分鐘自動更新/,
      /每 5 分鐘自動抓取/,
      /無速率限制/,
    ];

    for (const file of files) {
      const content = read(file);
      for (const pattern of riskyPatterns) {
        expect(content, `${file} still contains ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('Google-Extended 說明應與 Google 官方 crawler 角色一致', () => {
    const seoMetadata = read('src/config/seo-metadata.ts');
    const aboutMarkdown = read('public/about.md');

    for (const content of [seoMetadata, aboutMarkdown]) {
      expect(content).toContain('Googlebot 是 Google Search 與 AI Overviews 的主要爬取控制');
      expect(content).toContain('Google-Extended');
      expect(content).toContain('Gemini / Vertex');
      expect(content).not.toContain('Google-Extended、GrokBot、Applebot-Extended 等）全站讀取');
    }
  });
});
