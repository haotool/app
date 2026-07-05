/**
 * Tools SSOT Tests — 5 工具、連結格式、分類 enum
 */
import { describe, it, expect } from 'vitest';
import { TOOLS, TOOL_CATEGORIES, getActiveCategories, getToolIconUrl, getToolUrl } from './tools';

describe('TOOLS SSOT', () => {
  it('包含 5 個工具', () => {
    expect(TOOLS).toHaveLength(5);
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
