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
});
