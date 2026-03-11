import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const viteConfigPath = resolve(import.meta.dirname, '../vite.config.ts');
const viteConfigSource = readFileSync(viteConfigPath, 'utf-8');

describe('haotool PWA scope guard', () => {
  it('限制 navigate fallback 只處理 haotool 自身路由', () => {
    expect(viteConfigSource).toContain('navigateFallbackAllowlist');
    expect(viteConfigSource).toMatch(/\^\\\/\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/projects\(\?:\\\/\.\*\)\?\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/about\(\?:\\\/\.\*\)\?\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/contact\(\?:\\\/\.\*\)\?\$\//);
  });

  it('明確排除 sibling apps，避免 root-scope service worker 劫持子路徑', () => {
    expect(viteConfigSource).toContain('navigateFallbackDenylist');
    expect(viteConfigSource).toContain('ratewise');
    expect(viteConfigSource).toContain('nihonname');
    expect(viteConfigSource).toContain('park-keeper');
    expect(viteConfigSource).toContain('quake-school');
  });
});
