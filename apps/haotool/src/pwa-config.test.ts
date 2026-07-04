/**
 * PWA Scope Guard Tests — root-scope SW 防護（046 §5）
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const viteConfigPath = resolve(import.meta.dirname, '../vite.config.ts');
const viteConfigSource = readFileSync(viteConfigPath, 'utf-8');

describe('haotool PWA scope guard', () => {
  it('限制 navigate fallback 只處理 haotool 自身路由', () => {
    expect(viteConfigSource).toContain('navigateFallbackAllowlist');
    expect(viteConfigSource).toMatch(/\^\\\/\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/tools\(\?:\\\/\.\*\)\?\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/about\(\?:\\\/\.\*\)\?\$\//);
    expect(viteConfigSource).toMatch(/\^\\\/contact\(\?:\\\/\.\*\)\?\$\//);
  });

  it('明確排除 sibling apps（含 split-meow），避免 root SW 劫持子路徑', () => {
    expect(viteConfigSource).toContain('navigateFallbackDenylist');
    expect(viteConfigSource).toContain('ratewise');
    expect(viteConfigSource).toContain('nihonname');
    expect(viteConfigSource).toContain('park-keeper');
    expect(viteConfigSource).toContain('quake-school');
    expect(viteConfigSource).toContain('split-meow');
  });

  it('registerType 使用 prompt 模式（版本撕裂治理），禁止 autoUpdate 與 skipWaiting', () => {
    expect(viteConfigSource).toContain("registerType: 'prompt'");
    expect(viteConfigSource).not.toContain("registerType: 'autoUpdate'");
    expect(viteConfigSource).not.toContain('skipWaiting: true');
  });

  it('manifest 對齊 PRD §10.1（品牌名稱與主題色）', () => {
    expect(viteConfigSource).toContain("name: 'HaoTool 好工具'");
    expect(viteConfigSource).toContain("short_name: 'HaoTool'");
    expect(viteConfigSource).toContain("theme_color: '#3182F6'");
    expect(viteConfigSource).toContain("background_color: '#F8FAFC'");
  });
});
