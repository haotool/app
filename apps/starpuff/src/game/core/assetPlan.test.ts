import { describe, expect, it } from 'vitest';
import { ASSETS, type AssetEntry } from './assets';
import {
  BOSS_SUMMON_KINDS,
  BOSS_TEXTURE_KEYS,
  ENEMY_TEXTURE_KEYS,
  PENDING_TEXTURE_KEYS,
  SHARED_LEVEL_KEYS,
  bgTextureKey,
  entriesForKeys,
  entriesForLevel,
  entriesForPhase,
  levelAssetKeys,
  phaseOf,
} from './assetPlan';
import { CODEX_MONSTERS } from './codex';
import { LEVELS, getLevel } from '../logic/levels';
import { TRANSFORM_FORMS } from '../logic/transform';
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

  // 比例門檻擋單次大量漏標，但 ASSETS 將擴到 400+，分母變大會稀釋比例，逐 PR 各漏
  // 一兩筆仍過得去；絕對值上限補這個慢性侵蝕缺口，兩者並存。
  it('首屏資產量同時受絕對值與比例上限守門', () => {
    expect(bootKeys.length).toBeLessThanOrEqual(10);
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
    const bootKeys = new Set(keysOf(entriesForPhase('boot')));
    // §119 新形態立繪為佔位鍵（player 素身著色回退），素材交付前豁免在場檢查。
    const pending = new Set(PENDING_TEXTURE_KEYS);
    for (const level of LEVELS) {
      const keys = new Set(planKeys(level.id));
      // 清單取 SHARED_LEVEL_KEYS 單一真值，測試不另維護第二份。
      for (const shared of SHARED_LEVEL_KEYS) {
        if (pending.has(shared)) continue;
        expect(keys.has(shared) || bootKeys.has(shared)).toBe(true);
      }
    }
  });

  it('形態立繪鍵由 TRANSFORM_FORMS 派生，新增形態自動納管', () => {
    for (const form of Object.keys(TRANSFORM_FORMS)) {
      expect(SHARED_LEVEL_KEYS).toContain(`hero-${form}`);
    }
  });

  // form 階段一律每關載入（變身無法預測時點）。關卡限定資產誤標成 form 不會缺圖，
  // 但會讓該關資產在每一關都下載，正是本 PR 要消除的成本。
  it('關卡限定資產不得標為 form（會退回每關全載）', () => {
    const shared = new Set(SHARED_LEVEL_KEYS);
    const levelScoped = new Set(LEVELS.flatMap((level) => levelAssetKeys(level)));
    const misfiled = keysOf(entriesForPhase('form')).filter(
      (key) => levelScoped.has(key) && !shared.has(key),
    );
    expect(misfiled).toEqual([]);
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

// levelAssetKeys 派生是否完整（有沒有漏掉會登場的品種），與該派生是否真的被載到
// （phase 有沒有標錯）是兩件事，分開鎖。
describe('anti-softlock：登場貼圖派生完整', () => {
  it('enemyMix／精英與其獎勵味／教學供給的小怪立繪都被派生涵蓋', () => {
    for (const level of LEVELS) {
      const keys = new Set(levelAssetKeys(level));
      for (const entry of level.enemyMix) expect(keys).toContain(ENEMY_TEXTURE_KEYS[entry.kind]);
      for (const elite of level.elites) {
        expect(keys).toContain(ENEMY_TEXTURE_KEYS[elite.kind]);
        expect(keys).toContain(ENEMY_TEXTURE_KEYS[elite.rewardFlavor]);
      }
      for (const drill of level.drillSpawns ?? []) {
        expect(keys).toContain(ENEMY_TEXTURE_KEYS[drill.kind]);
      }
    }
  });

  it('魔王立繪與召喚品種被派生涵蓋（召喚不在 enemyMix 內仍會登場）', () => {
    for (const level of LEVELS) {
      if (!level.boss) continue;
      const keys = new Set(levelAssetKeys(level));
      for (const key of BOSS_TEXTURE_KEYS[level.boss]) expect(keys).toContain(key);
      for (const kind of BOSS_SUMMON_KINDS[level.boss]) {
        expect(keys).toContain(ENEMY_TEXTURE_KEYS[kind]);
      }
    }
  });

  it('潮汐關涵蓋生成替換與救援紮根品種（tideFilterKind／respawnRescue）', () => {
    const tideLevels = LEVELS.filter((level) => level.tide !== undefined);
    expect(tideLevels.length).toBeGreaterThan(0);
    for (const level of tideLevels) {
      const keys = new Set(levelAssetKeys(level));
      expect(keys).toContain(ENEMY_TEXTURE_KEYS.jelly);
      expect(keys).toContain(ENEMY_TEXTURE_KEYS.spora);
    }
  });
});

// phase 標錯的總守門：`lazy` 沒有 scene 呼叫點，把戰鬥資產標進去會讓該關無聲缺圖走
// 佔位色塊。此不變式與階段名稱無關——不論標成哪一階段，只要 levelAssetKeys 派生得到
// 就必須落在 boot 或該關計畫內。
// 涵蓋範圍即 levelAssetKeys 的派生鍵：關卡限定的背景／道具／小怪／魔王，加上共用的
// 主角姿勢與形態立繪。派生不到的資產（form 階段的變身動畫分鏡、特效分層等）不在此
// 守門範圍內。
describe('anti-softlock：登場貼圖必定載得到', () => {
  it('每關派生出的每一個鍵都落在 boot 或該關計畫內', () => {
    const bootKeys = new Set(keysOf(entriesForPhase('boot')));
    // §119/§120 佔位鍵豁免：無資產檔可載，運行期以生成貼圖／著色回退保證不缺圖；
    // 素材車交付自 PENDING_TEXTURE_KEYS 移除後自動回到本守門範圍。
    const pending = new Set(PENDING_TEXTURE_KEYS);
    for (const level of LEVELS) {
      const planned = new Set(planKeys(level.id));
      const missing = levelAssetKeys(level).filter(
        (key) => !planned.has(key) && !bootKeys.has(key) && !pending.has(key),
      );
      expect({ level: level.id, missing }).toEqual({ level: level.id, missing: [] });
    }
  });

  it('圖鑑立繪全數可由 manifest 補載（§120 佔位鍵走 CodexScene 剪影回退，豁免）', () => {
    const codexKeys = CODEX_MONSTERS.map((monster) => monster.textureKey).filter(
      (key) => !PENDING_TEXTURE_KEYS.includes(key),
    );
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

// PENDING 佔位鍵豁免的機械鎖（PR #886 R4）：豁免不受 anti-softlock 不變式管轄，
// 若被濫用（把真資產鍵塞進 PENDING）會靜默放行缺圖——以下三條把範圍鎖死。
describe('PENDING 佔位鍵守門（R4）', () => {
  it('PENDING ∩ ASSETS = ∅：已存在 manifest 的鍵禁止列入豁免', () => {
    const assetKeys = new Set(ASSETS.map((entry) => entry.key));
    for (const key of PENDING_TEXTURE_KEYS) {
      expect(assetKeys.has(key), key).toBe(false);
    }
  });

  it('每個 PENDING key 必落在已知運行期回退集合（minion→色塊生成、hero→素身著色）', () => {
    const minionFallback = new Set(Object.values(ENEMY_TEXTURE_KEYS));
    const heroFallback = new Set(Object.keys(TRANSFORM_FORMS).map((form) => `hero-${form}`));
    for (const key of PENDING_TEXTURE_KEYS) {
      expect(minionFallback.has(key) || heroFallback.has(key), key).toBe(true);
    }
  });

  it('PENDING 內容凍結：#857 素材交付後清空，新佔位鍵入列必須顯式過審', () => {
    expect([...PENDING_TEXTURE_KEYS]).toEqual([]);
  });
});
