/**
 * Tools SSOT Tests — 7 工具、連結格式、分類 enum
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { TOOLS, TOOL_CATEGORIES, getActiveCategories, getToolIconUrl, getToolUrl } from './tools';

const HAOTOOL_PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../public');

describe('TOOLS SSOT', () => {
  it('包含 7 個工具', () => {
    expect(TOOLS).toHaveLength(7);
  });

  it('id 唯一且涵蓋全部子 app', () => {
    const ids = TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        'ratewise',
        'split-meow',
        'park-keeper',
        'nihonname',
        'quake-school',
        'starpuff',
        'papertrade',
      ]),
    );
  });

  it('path 一律為根相對路徑並帶尾斜線', () => {
    for (const tool of TOOLS) {
      expect(tool.path).toMatch(/^\/[a-z-]+\/$/);
    }
  });

  it('分類必須屬於 TOOL_CATEGORIES enum', () => {
    for (const tool of TOOLS) {
      expect(TOOL_CATEGORIES).toContain(tool.category);
    }
  });

  it('每個工具皆有描述、icon 路徑與技術 chips', () => {
    for (const tool of TOOLS) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.iconPath.startsWith('/')).toBe(true);
      expect(tool.techChips.length).toBeGreaterThan(0);
      expect(tool.status).toBe('live');
    }
  });

  it('每個工具皆有快照素材，避免首頁產生靜態資產 404', () => {
    for (const tool of TOOLS) {
      expect(existsSync(resolve(HAOTOOL_PUBLIC_DIR, `screenshots/${tool.id}-mobile.avif`))).toBe(
        true,
      );
      expect(existsSync(resolve(HAOTOOL_PUBLIC_DIR, `screenshots/${tool.id}-mobile.webp`))).toBe(
        true,
      );
    }
  });

  it('getToolUrl 以 app.haotool.org 為 host 組出完整 URL', () => {
    const ratewise = TOOLS.find((tool) => tool.id === 'ratewise');
    expect(ratewise).toBeDefined();
    if (ratewise) {
      expect(getToolUrl(ratewise)).toBe('https://app.haotool.org/ratewise/');
      expect(getToolIconUrl(ratewise)).toBe('https://app.haotool.org/ratewise/pwa-192x192.png');
    }
  });

  it('getActiveCategories 由資料推導（工具/創意/教育）', () => {
    expect(getActiveCategories()).toEqual(['工具類', '創意類', '教育類']);
  });
});
