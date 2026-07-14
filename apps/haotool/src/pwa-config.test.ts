/**
 * PWA Scope Guard Tests — root-scope SW 防護（046 §5）
 * allow/denylist 行為測試以 src/config/sw-routes.ts（SSOT）為準；
 * vite.config.ts 僅驗證引用 SSOT 與不可退化的字串設定（registerType / manifest）。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST, SIBLING_APP_DENYLIST } from './config/sw-routes';

const viteConfigPath = resolve(import.meta.dirname, '../vite.config.ts');
const viteConfigSource = readFileSync(viteConfigPath, 'utf-8');

function matchesAny(patterns: RegExp[], pathname: string): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}

describe('haotool PWA scope guard（行為級）', () => {
  it.each(['/', '/tools/', '/about/x', '/contact'])(
    'allowlist 命中 haotool 自身路由 %s',
    (pathname) => {
      expect(matchesAny(HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST, pathname)).toBe(true);
    },
  );

  it.each([
    '/split-meow/foo',
    '/ratewise/',
    '/nihonname/a/b',
    '/park-keeper',
    '/quake-school/x',
    '/starpuff/',
    '/papertrade/chart/BTCUSDT',
  ])('denylist 命中 sibling app 路徑 %s', (pathname) => {
    expect(matchesAny(SIBLING_APP_DENYLIST, pathname)).toBe(true);
  });

  it('allowlist 不得命中前綴相似的非自身路徑（/toolsfoo）', () => {
    expect(matchesAny(HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST, '/toolsfoo')).toBe(false);
  });

  it('sibling denylist 不得命中 haotool 自身路由', () => {
    for (const pathname of ['/', '/tools/', '/about/', '/contact/']) {
      expect(matchesAny(SIBLING_APP_DENYLIST, pathname)).toBe(false);
    }
  });

  it('denylist 覆蓋全部七個 sibling apps', () => {
    const sources = SIBLING_APP_DENYLIST.map((pattern) => pattern.source);
    for (const sibling of [
      'ratewise',
      'nihonname',
      'park-keeper',
      'quake-school',
      'split-meow',
      'starpuff',
      'papertrade',
    ]) {
      expect(sources.some((source) => source.includes(sibling))).toBe(true);
    }
  });
});

describe('haotool PWA vite config 守門', () => {
  it('vite.config.ts 由 sw-routes SSOT 引用 allow/denylist（禁止第二份清單）', () => {
    expect(viteConfigSource).toContain("from './src/config/sw-routes'");
    expect(viteConfigSource).toContain(
      'navigateFallbackAllowlist: HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST',
    );
    expect(viteConfigSource).toContain('navigateFallbackDenylist: SIBLING_APP_DENYLIST');
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
