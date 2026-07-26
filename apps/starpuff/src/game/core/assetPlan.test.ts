import { describe, expect, it } from 'vitest';
import { ASSETS, type AssetEntry } from './assets';
import {
  BOSS_SUMMON_KINDS,
  BOSS_TEXTURE_KEYS,
  ENEMY_TEXTURE_KEYS,
  bgTextureKey,
  entriesForKeys,
  entriesForLevel,
  entriesForPhase,
  levelAssetKeys,
  phaseOf,
} from './assetPlan';
import { CODEX_MONSTERS } from './codex';
import { LEVELS, getLevel } from '../logic/levels';
import type { LevelId } from './types';

const keysOf = (entries: readonly AssetEntry[]): string[] => entries.map((entry) => entry.key);
const planKeys = (id: LevelId): string[] => keysOf(entriesForLevel(getLevel(id), LEVELS));

describe('phase 安全預設', () => {
  it('未標註 phase 的條目視為 boot——漏標只拖慢首屏，不會缺圖', () => {
    expect(phaseOf({ key: 'x', url: 'x.webp' })).toBe('boot');
    expect(phaseOf({ key: 'x', url: 'x.webp', phase: 'lazy' })).toBe('lazy');
  });

  it('entriesForPhase(boot) 收得未標註條目（素材車 append 不落單）', () => {
    const appended: AssetEntry[] = [
      { key: 'labelled', url: 'a.webp', phase: 'level' },
      { key: 'unlabelled', url: 'b.webp' },
    ];
    expect(keysOf(entriesForPhase('boot', appended))).toEqual(['unlabelled']);
  });

  it('未標註條目在關卡計畫中不出現（已由 boot 覆蓋，不重複載入）', () => {
    const appended: AssetEntry[] = [{ key: 'unlabelled', url: 'b.webp' }];
    expect(entriesForLevel(getLevel(1), LEVELS, appended)).toEqual([]);
  });
});

describe('boot 階段最小集合', () => {
  const bootKeys = keysOf(entriesForPhase('boot'));

  it('只含 Title／Map／Codex／Result 選單殼所需資產', () => {
    expect(bootKeys.sort()).toEqual(
      ['bg-arena-l', 'bg-heights-l', 'bg-meadow-l', 'fx-clouds', 'fx-star', 'hero-idle'].sort(),
    );
  });

  it('首屏資產量佔 manifest 一成以下（分階段載入的驗收門檻）', () => {
    expect(bootKeys.length / ASSETS.length).toBeLessThan(0.1);
  });
});

describe('manifest 驅動的分階段載入', () => {
  it('每個 manifest 條目都被某個階段收走，無孤兒資產', () => {
    const reachable = new Set<string>(keysOf(entriesForPhase('boot')));
    for (const level of LEVELS) {
      for (const key of keysOf(entriesForLevel(level, LEVELS))) reachable.add(key);
    }
    for (const key of keysOf(entriesForKeys(CODEX_MONSTERS.map((m) => m.textureKey)))) {
      reachable.add(key);
    }
    const orphans = ASSETS.filter(
      (entry) => !reachable.has(entry.key) && phaseOf(entry) !== 'lazy',
    );
    expect(keysOf(orphans)).toEqual([]);
  });

  it('關卡限定資產只在需要的關載入', () => {
    // 焙糖火山橫景屬 L13–L16；果凍草原不得載入。
    expect(planKeys(1)).not.toContain('bg-kiln-l');
    expect(planKeys(13)).toContain('bg-kiln-l');
    // 主題道具同理：L1 只帶 meadow 條。
    expect(planKeys(1)).toContain('prop-meadow-1');
    expect(planKeys(1)).not.toContain('prop-kiln-1');
  });

  it('全關共用核心（主角姿勢／形態立繪）每關都在場', () => {
    for (const id of [1, 7, 13, 20] as LevelId[]) {
      const keys = planKeys(id);
      for (const shared of ['hero-inhale', 'hero-puffed', 'hero-hurt']) {
        expect(keys).toContain(shared);
      }
      // 變身可於關內任意時點觸發，形態立繪必須隨關備妥。
      for (const form of ['hero-volt', 'hero-gale', 'hero-shell']) expect(keys).toContain(form);
    }
  });

  it('魔王立繪只在魔王關載入', () => {
    expect(planKeys(1)).not.toContain('boss-idle');
    expect(planKeys(4)).toEqual(expect.arrayContaining(['boss-idle', 'boss-enraged']));
    expect(planKeys(4)).not.toContain('boss-voidra');
    expect(planKeys(20)).toContain('boss-voidra');
  });

  it('boot 階段資產不重複排進關卡計畫', () => {
    const bootKeys = new Set(keysOf(entriesForPhase('boot')));
    for (const level of LEVELS) {
      for (const key of keysOf(entriesForLevel(level, LEVELS)))
        expect(bootKeys.has(key)).toBe(false);
    }
  });
});

describe('anti-softlock：關卡計畫涵蓋所有登場貼圖', () => {
  it('每關 enemyMix／精英／教學供給的小怪立繪都在計畫內', () => {
    for (const level of LEVELS) {
      const keys = new Set(planKeys(level.id));
      const bootKeys = new Set(keysOf(entriesForPhase('boot')));
      for (const entry of level.enemyMix) {
        const key = ENEMY_TEXTURE_KEYS[entry.kind];
        expect(keys.has(key) || bootKeys.has(key)).toBe(true);
      }
      for (const elite of level.elites) {
        expect(keys.has(ENEMY_TEXTURE_KEYS[elite.kind])).toBe(true);
        expect(keys.has(ENEMY_TEXTURE_KEYS[elite.rewardFlavor])).toBe(true);
      }
      for (const drill of level.drillSpawns ?? []) {
        expect(keys.has(ENEMY_TEXTURE_KEYS[drill.kind])).toBe(true);
      }
    }
  });

  it('魔王召喚品種併入該關計畫（不在 enemyMix 內仍會登場）', () => {
    for (const level of LEVELS) {
      if (!level.boss) continue;
      const keys = new Set(planKeys(level.id));
      for (const kind of BOSS_SUMMON_KINDS[level.boss]) {
        expect(keys.has(ENEMY_TEXTURE_KEYS[kind])).toBe(true);
      }
      for (const key of BOSS_TEXTURE_KEYS[level.boss]) expect(keys.has(key)).toBe(true);
    }
  });

  it('潮汐關併入生成替換與救援紮根品種（tideFilterKind／respawnRescue）', () => {
    const tideLevels = LEVELS.filter((level) => level.tide !== undefined);
    expect(tideLevels.length).toBeGreaterThan(0);
    for (const level of tideLevels) {
      const keys = new Set(planKeys(level.id));
      expect(keys.has(ENEMY_TEXTURE_KEYS.jelly)).toBe(true);
      expect(keys.has(ENEMY_TEXTURE_KEYS.spora)).toBe(true);
    }
  });

  it('每關背景貼圖（含重用別名）都在計畫或 boot 內', () => {
    const bootKeys = new Set(keysOf(entriesForPhase('boot')));
    for (const level of LEVELS) {
      const key = bgTextureKey(level.bgKey);
      const keys = new Set(planKeys(level.id));
      expect(keys.has(key) || bootKeys.has(key)).toBe(true);
    }
  });

  it('圖鑑立繪全數可由 manifest 補載', () => {
    const codexKeys = CODEX_MONSTERS.map((monster) => monster.textureKey);
    expect(keysOf(entriesForKeys(codexKeys)).sort()).toEqual([...codexKeys].sort());
  });
});

describe('levelAssetKeys 派生', () => {
  it('背景重用別名解析為實際貼圖鍵', () => {
    expect(bgTextureKey('bg-gallery')).toBe('bg-arena-l');
    expect(bgTextureKey('bg-meadow')).toBe('bg-meadow-l');
  });

  it('鍵不重複', () => {
    for (const level of LEVELS) {
      const keys = levelAssetKeys(level);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
