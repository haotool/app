import { describe, expect, it } from 'vitest';
import { canInhale, inhaleFlavor } from './combat';
import { LEVELS, getLevel } from './levels';

// §125 W4 終章關卡專項守門（levels.test.ts 1200 行閘分檔）：L29 崩盤前夜的
// 回收機制契約與收尾演出、L30 崩盤王座的魔王關體系與供給契約。
// 通用不變式（潮汐/流星/折躍/卡點/精英/佈景）仍由 levels.test.ts 全關迴圈涵蓋。

describe('§125 L29 崩盤前夜（混合挑戰走動關）', () => {
  it('十種回收混編零新怪：PRD 主編制七種全數入編、牛熊怪不入走動關', () => {
    const level = getLevel(29);
    const kinds = level.enemyMix.map((e) => e.kind);
    for (const kind of [
      'cargo',
      'frosty',
      'prismbee',
      'gravitybub',
      'bearlet',
      'scanna',
      'orbiton',
    ] as const) {
      expect(kinds).toContain(kind);
    }
    expect(kinds).not.toContain('bullrun');
    expect(kinds).not.toContain('bearmarket');
    // 恆可吸佔比 ≥0.5（bearlet/scanna 不可吸、twinkla 保守不計）。
    const inhalable = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('四段機制回收（PRD）：貨櫃磚／潮汐／鏡門折躍／引力上升流＋市場隕落', () => {
    const level = getLevel(29);
    expect(level.elements.filter((el) => el.kind === 'breakable').length).toBeGreaterThanOrEqual(2);
    expect(level.tide).toBeDefined();
    expect(level.elements.filter((el) => el.kind === 'warp')).toHaveLength(2);
    expect(level.elements.filter((el) => el.kind === 'updraft')).toHaveLength(2);
    expect(level.meteor).toBeDefined();
  });

  it('收尾演出（L30 伏筆）：全 LEVELS 僅 L29 配置 market-open；無形態教學位點', () => {
    const level = getLevel(29);
    expect(level.outroCinematic).toBe('market-open');
    for (const other of LEVELS) {
      if (other.id !== 29) expect(other.outroCinematic).toBeUndefined();
    }
    // 四形態已於 21-27 教畢：本關無教學位點。
    expect(level.teaches).toBeUndefined();
    expect(level.drillSpawns).toBeUndefined();
  });
});

describe('§125 L30 崩盤王座（最終魔王關）', () => {
  it('魔王關體系：前室與增益對表、幾何留空、七形態通用變身驗收', () => {
    const level = getLevel(30);
    expect(level.boss).toBe('liudong');
    expect(level.anteroomPx).toBe(400);
    expect(level.anteroomBuffs).toEqual(['power', 'swift']);
    expect(level.arenaBuff).toBe('shield');
    expect(level.platforms).toEqual([]);
    expect(level.elements).toEqual([]);
    expect(level.elites).toEqual([]);
    // 七形態各有優勢情境（§125 對應表）：驗收機制為通用變身。
    expect(level.bossApplies).toEqual(['transform']);
  });

  it('供給契約：雷味頭部供給 ≥0.35（雷化清熊線）、補生全可吸且恆可吸 ≥0.6', () => {
    const level = getLevel(30);
    const voltShare = level.enemyMix
      .filter((entry) => inhaleFlavor(entry.kind) === 'zappy')
      .reduce((sum, entry) => sum + entry.weight, 0);
    expect(voltShare).toBeGreaterThanOrEqual(0.35);
    for (const entry of level.enemyMix) expect(canInhale(entry.kind)).toBe(true);
    const always = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(always).toBeGreaterThanOrEqual(0.6);
  });
});
