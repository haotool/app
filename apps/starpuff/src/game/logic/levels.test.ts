import { describe, expect, it } from 'vitest';
import { canInhale } from './combat';
import {
  LEVELS,
  advanceLevelSpawn,
  createLevelRun,
  getLevel,
  isInSafeTail,
  nextLevelId,
  pickEnemyKind,
  recordKill,
  type LevelRunState,
} from './levels';

describe('LEVELS 資料（GAME_DESIGN §15）', () => {
  it('四關依序為 1-4 且參數符合 §15 表', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4]);
    expect(LEVELS.map((l) => l.worldWidth)).toEqual([1680, 1920, 2160, 480]);
    expect(LEVELS.map((l) => l.killQuota)).toEqual([6, 9, 10, 0]);
    expect(LEVELS.map((l) => l.spawnIntervalMs)).toEqual([2600, 1800, 1300, 3500]);
    expect(LEVELS.map((l) => l.maxOnScreen)).toEqual([3, 4, 5, 2]);
    expect(LEVELS.map((l) => l.safeZoneTailPx)).toEqual([480, 480, 480, 0]);
  });

  it('僅第 4 關為 boss 關；僅第 1 關帶教學', () => {
    expect(LEVELS.map((l) => l.boss)).toEqual([false, false, false, true]);
    expect(LEVELS.map((l) => l.tutorial)).toEqual([true, false, false, false]);
  });

  it('每關 enemyMix 權重總和為 1', () => {
    for (const level of LEVELS) {
      const total = level.enemyMix.reduce((sum, entry) => sum + entry.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });

  it('L2 權重為 §15 正式表（floaty 40/spiky 35/puffy 25）', () => {
    const mix = Object.fromEntries(getLevel(2).enemyMix.map((e) => [e.kind, e.weight]));
    expect(mix).toEqual({ floaty: 0.4, spiky: 0.35, puffy: 0.25 });
  });

  it('L3 五種混編且可吸怪佔比 50%', () => {
    const mix = getLevel(3).enemyMix;
    expect(mix.map((e) => e.kind).sort()).toEqual(
      ['chompy', 'floaty', 'jelly', 'puffy', 'spiky'].sort(),
    );
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeCloseTo(0.5, 5);
  });

  it('boss 關僅補生可吸怪', () => {
    const boss = getLevel(4);
    expect(boss.enemyMix.every((entry) => canInhale(entry.kind))).toBe(true);
  });

  it('平台位於世界範圍內且向上爬升可跳達（≤82px）', () => {
    for (const level of LEVELS) {
      let prevY = 774; // 主地面頂（854 - 80）
      for (const platform of level.platforms) {
        expect(platform.x - platform.w / 2).toBeGreaterThanOrEqual(0);
        expect(platform.x + platform.w / 2).toBeLessThanOrEqual(level.worldWidth);
        // 向上爬升不得超過單跳最高 98px 的安全值；向下落無限制。
        expect(prevY - platform.y).toBeLessThanOrEqual(82);
        prevY = platform.y;
      }
    }
  });

  it('getLevel 未知 id 擲錯', () => {
    expect(() => getLevel(9 as never)).toThrow();
  });

  it('nextLevelId 依 1→2→3→4→null 推進', () => {
    expect(nextLevelId(1)).toBe(2);
    expect(nextLevelId(2)).toBe(3);
    expect(nextLevelId(3)).toBe(4);
    expect(nextLevelId(4)).toBeNull();
  });
});

describe('recordKill 配額推進', () => {
  it('擊殺累計至配額時開門', () => {
    let state = createLevelRun(1);
    for (let i = 0; i < 5; i++) {
      state = recordKill(state);
      expect(state.gateOpen).toBe(false);
    }
    state = recordKill(state);
    expect(state.killCount).toBe(6);
    expect(state.gateOpen).toBe(true);
  });

  it('boss 關擊殺不開門（過關由魔王擊破觸發）', () => {
    let state = createLevelRun(4);
    for (let i = 0; i < 10; i++) state = recordKill(state);
    expect(state.gateOpen).toBe(false);
  });
});

describe('advanceLevelSpawn 節流', () => {
  const tickUntilSpawn = (state: LevelRunState, deltaMs: number, alive: number) =>
    advanceLevelSpawn(state, { deltaMs, aliveEnemies: alive });

  it('間隔未到不生成，到期生成並歸零計時', () => {
    let state = createLevelRun(1);
    let result = tickUntilSpawn(state, 2599, 0);
    expect(result.spawn).toBe(false);
    state = result.state;
    result = tickUntilSpawn(state, 1, 0);
    expect(result.spawn).toBe(true);
    expect(result.state.spawnTimerMs).toBe(0);
  });

  it('達同屏上限時暫停，空位出現即刻補生', () => {
    let state = createLevelRun(1);
    let result = tickUntilSpawn(state, 5000, 3);
    expect(result.spawn).toBe(false);
    state = result.state;
    result = tickUntilSpawn(state, 16, 2);
    expect(result.spawn).toBe(true);
  });

  it('門開後停止生成（尾端 release）', () => {
    let state = createLevelRun(1);
    for (let i = 0; i < 6; i++) state = recordKill(state);
    expect(state.gateOpen).toBe(true);
    const result = tickUntilSpawn(state, 10000, 0);
    expect(result.spawn).toBe(false);
  });
});

describe('pickEnemyKind 加權抽選', () => {
  it('rand01 落點對應權重區間', () => {
    const level = getLevel(1); // jelly 0.6 / floaty 0.4
    expect(pickEnemyKind(level, 0)).toBe('jelly');
    expect(pickEnemyKind(level, 0.59)).toBe('jelly');
    expect(pickEnemyKind(level, 0.61)).toBe('floaty');
    expect(pickEnemyKind(level, 0.999)).toBe('floaty');
  });

  it('rand01=1 邊界退回末位種類', () => {
    const level = getLevel(1);
    expect(pickEnemyKind(level, 1)).toBe('floaty');
  });
});

describe('isInSafeTail 尾端安全區', () => {
  it('世界末端 safeZoneTailPx 內為安全區', () => {
    const level = getLevel(1); // worldWidth 1680, tail 480
    expect(isInSafeTail(level, 1199)).toBe(false);
    expect(isInSafeTail(level, 1200)).toBe(true);
    expect(isInSafeTail(level, 1680)).toBe(true);
  });

  it('boss 關無安全區', () => {
    expect(isInSafeTail(getLevel(4), 400)).toBe(false);
  });
});
