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
  pickSpawnKind,
  type LevelRunState,
  type LevelSpec,
  type StageElementSpec,
  recordKill,
} from './levels';
import { BRICK_SIZE, maxDecorInWindow } from './stageModel';

describe('LEVELS 資料（GAME_DESIGN §15）', () => {
  it('四關依序為 1-4 且參數符合 §15/§21 表（v3 橫式世界寬）', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4]);
    expect(LEVELS.map((l) => l.worldWidth)).toEqual([2700, 3100, 3500, 854]);
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

  it('平台位於世界範圍內、雙層以內且向上爬升可跳達（≤82px）', () => {
    const groundTop = 400; // 主地面頂（480 - 80）
    for (const level of LEVELS) {
      let prevY = groundTop;
      for (const platform of level.platforms) {
        expect(platform.x - platform.w / 2).toBeGreaterThanOrEqual(0);
        expect(platform.x + platform.w / 2).toBeLessThanOrEqual(level.worldWidth);
        // 雙層以內（§21）：最高層不超過 272（自地面兩段爬升）。
        expect(platform.y).toBeGreaterThanOrEqual(272);
        // 向上爬升不得超過單跳最高 98px 的安全值；向下落無限制。
        expect(prevY - platform.y).toBeLessThanOrEqual(82);
        prevY = platform.y;
      }
    }
  });

  it('getLevel 未知 id 擲錯', () => {
    expect(() => getLevel(9 as never)).toThrow();
  });

  const elementsOf = (level: LevelSpec, kind: StageElementSpec['kind']) =>
    level.elements.filter((element) => element.kind === kind);

  it('v4 元素依 §29 推進：S1 單向、S2 +移動+彈簧、S3 +可破壞磚、boss 關僅裝飾', () => {
    for (const id of [1, 2, 3] as const) {
      const count = elementsOf(getLevel(id), 'oneway').length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
    }
    for (const id of [2, 3] as const) {
      for (const kind of ['moving', 'spring'] as const) {
        const count = elementsOf(getLevel(id), kind).length;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(2);
      }
    }
    expect(elementsOf(getLevel(1), 'moving')).toEqual([]);
    expect(elementsOf(getLevel(1), 'spring')).toEqual([]);
    expect(elementsOf(getLevel(2), 'breakable')).toEqual([]);
    const bricks = elementsOf(getLevel(3), 'breakable').length;
    expect(bricks).toBeGreaterThanOrEqual(2);
    expect(bricks).toBeLessThanOrEqual(3);
    expect(getLevel(4).elements).toEqual([]);
    expect(getLevel(4).decor.length).toBeGreaterThan(0);
  });

  it('v4 平台型元素於世界內、層高合法且移動掃程不出界（§29）', () => {
    const groundTop = 400;
    for (const level of LEVELS) {
      for (const element of level.elements) {
        if (element.kind === 'spring' || element.kind === 'breakable') continue;
        const half = element.w / 2;
        expect(element.x - half).toBeGreaterThanOrEqual(0);
        expect(element.x + half).toBeLessThanOrEqual(level.worldWidth);
        expect(element.y).toBeGreaterThanOrEqual(272);
        expect(element.y).toBeLessThan(groundTop);
        // 自地面單跳可達（≤82px 安全值）；更高層由既有平台週邊接應。
        if (element.kind === 'moving') {
          const sweepEnd = element.axis === 'x' ? element.x + element.range : element.y;
          const sweepEndY = element.axis === 'y' ? element.y + element.range : element.y;
          if (element.axis === 'x') {
            expect(sweepEnd - half).toBeGreaterThanOrEqual(0);
            expect(sweepEnd + half).toBeLessThanOrEqual(level.worldWidth);
          }
          expect(sweepEndY).toBeGreaterThanOrEqual(272);
          expect(sweepEndY).toBeLessThan(groundTop);
        }
      }
    }
  });

  it('可破壞磚為地面獨立磚（§29 反卡死）：單跳可越過、彼此不成牆、不擋星星門', () => {
    for (const level of LEVELS) {
      const bricks = elementsOf(level, 'breakable');
      const xs = bricks.map((brick) => brick.x).sort((a, b) => a - b);
      for (const brick of bricks) {
        if (brick.kind !== 'breakable') continue;
        // 立於地面（中心 y = 400 - 20）：磚高 40 遠低於單跳最高 98px，破壞前必可繞行。
        expect(brick.y).toBe(400 - BRICK_SIZE / 2);
        expect(['ammo', 'hp']).toContain(brick.loot);
        // 星星門區（worldWidth-120 ±45）不得被磚佔據。
        expect(Math.abs(brick.x - (level.worldWidth - 120))).toBeGreaterThan(45 + BRICK_SIZE);
      }
      for (let i = 1; i < xs.length; i += 1) {
        expect((xs[i] ?? 0) - (xs[i - 1] ?? 0)).toBeGreaterThan(BRICK_SIZE * 3);
      }
    }
  });

  it('佈景密度符合 §32：間距 400-600、任一 1200 視窗 ≤6、key 對應關卡主題', () => {
    for (const level of LEVELS) {
      const theme = level.bgKey.replace('bg-', '');
      for (const decor of level.decor) {
        expect(decor.key).toMatch(new RegExp(`^prop-${theme}-[1-4]$`));
        expect(decor.x).toBeGreaterThanOrEqual(0);
        expect(decor.x).toBeLessThanOrEqual(level.worldWidth);
      }
      const xs = level.decor.map((decor) => decor.x).sort((a, b) => a - b);
      // boss 關單屏僅裝飾，不套滾動關間距節奏。
      if (!level.boss) {
        for (let i = 1; i < xs.length; i += 1) {
          const gap = (xs[i] ?? 0) - (xs[i - 1] ?? 0);
          expect(gap).toBeGreaterThanOrEqual(400);
          expect(gap).toBeLessThanOrEqual(600);
        }
      }
      expect(maxDecorInWindow(xs, 1200)).toBeLessThanOrEqual(6);
    }
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

describe('反卡死保證律（§26）', () => {
  it('飢荒時 pickSpawnKind 覆蓋權重，任何 rand 皆抽出可吸怪', () => {
    const level = getLevel(3); // spiky 0.3 + chompy 0.2 佔半
    for (const rand of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(canInhale(pickSpawnKind(level, rand, true))).toBe(true);
    }
  });

  it('非飢荒時 pickSpawnKind 等同加權抽選', () => {
    const level = getLevel(3);
    for (const rand of [0, 0.4, 0.8]) {
      expect(pickSpawnKind(level, rand, false)).toBe(pickEnemyKind(level, rand));
    }
  });

  it('boss 期飢荒立即補生，不等生成間隔', () => {
    const state = createLevelRun(4);
    const result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(true);
    expect(result.state.spawnTimerMs).toBe(0);
  });

  it('非 boss 關飢荒僅覆蓋品種，生成節奏不變', () => {
    const state = createLevelRun(1);
    const result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(false);
  });
});

describe('isInSafeTail 尾端安全區', () => {
  it('世界末端 safeZoneTailPx 內為安全區', () => {
    const level = getLevel(1); // worldWidth 2700, tail 480
    expect(isInSafeTail(level, 2219)).toBe(false);
    expect(isInSafeTail(level, 2220)).toBe(true);
    expect(isInSafeTail(level, 2700)).toBe(true);
  });

  it('boss 關無安全區', () => {
    expect(isInSafeTail(getLevel(4), 400)).toBe(false);
  });
});
