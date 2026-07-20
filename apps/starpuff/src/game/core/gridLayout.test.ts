import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CODEX_SKILLS, CODEX_TAB_GRIDS } from './codex';
import { ACHIEVEMENTS } from '../logic/achievements';
import { fitBoundedGrid, gridBottom, gridRowTop } from './gridLayout';

describe('fitBoundedGrid（§96 有界網格）', () => {
  it('列數由縱向預算推導、欄隨量增，最後一列底緣不超出 maxY', () => {
    const spec = { startY: 100, rowH: 100, itemH: 90, maxY: 470 };
    // 預算 (470-90-100)/100+1 = 3 列。
    expect(fitBoundedGrid(9, spec)).toEqual({ cols: 3, rows: 3 });
    expect(fitBoundedGrid(10, spec)).toEqual({ cols: 4, rows: 3 });
    expect(fitBoundedGrid(3, spec)).toEqual({ cols: 1, rows: 3 });
    expect(gridBottom(fitBoundedGrid(9, spec), spec)).toBeLessThanOrEqual(470);
  });

  it('實際使用列數不超過需求（條目少時不留空列）', () => {
    const spec = { startY: 100, rowH: 100, itemH: 90, maxY: 470 };
    const grid = fitBoundedGrid(2, spec);
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(1);
  });

  it('極端矮預算退化為單列多欄不拋錯', () => {
    const spec = { startY: 400, rowH: 100, itemH: 90, maxY: 470 };
    expect(fitBoundedGrid(9, spec)).toEqual({ cols: 9, rows: 1 });
  });

  it('gridRowTop 依列高遞增', () => {
    expect(gridRowTop(0, { startY: 122, rowH: 100 })).toBe(122);
    expect(gridRowTop(2, { startY: 122, rowH: 100 })).toBe(322);
  });
});

describe('圖鑑分頁縱向守門（§96 P1-01：任何分頁內容不得超出 y=470）', () => {
  it('技能分頁：當前 9 項與成長至 12 項皆不溢出邏輯畫布', () => {
    for (const count of [CODEX_SKILLS.length, 12]) {
      const grid = fitBoundedGrid(count, CODEX_TAB_GRIDS.skills);
      expect(gridBottom(grid, CODEX_TAB_GRIDS.skills)).toBeLessThanOrEqual(470);
    }
  });

  it('成就分頁：當前 21 條維持 6 欄 4 列、成長至 30 條仍不溢出', () => {
    const grid = fitBoundedGrid(ACHIEVEMENTS.length, CODEX_TAB_GRIDS.achievements);
    expect(grid).toEqual({ cols: 6, rows: 4 });
    expect(gridBottom(grid, CODEX_TAB_GRIDS.achievements)).toBeLessThanOrEqual(470);
    const future = fitBoundedGrid(30, CODEX_TAB_GRIDS.achievements);
    expect(gridBottom(future, CODEX_TAB_GRIDS.achievements)).toBeLessThanOrEqual(470);
  });

  it('技能文案長度守門：詳述 ≤72 字（超長需同步重估 itemH 假設）', () => {
    for (const skill of CODEX_SKILLS) {
      expect(skill.detail.length).toBeLessThanOrEqual(72);
      expect(skill.howTo.length).toBeLessThanOrEqual(12);
      expect(skill.nameZh.length).toBeLessThanOrEqual(4);
    }
  });

  it('CodexScene 實際引用網格 SSOT（跨檔守門防第二份常數）', () => {
    const scene = readFileSync(new URL('../scenes/CodexScene.ts', import.meta.url), 'utf8');
    expect(scene).toContain('CODEX_TAB_GRIDS.skills');
    expect(scene).toContain('CODEX_TAB_GRIDS.achievements');
    expect(scene).not.toMatch(/y = 122 \+ Math\.floor/);
  });
});
