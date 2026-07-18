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

describe('LEVELS 資料（GAME_DESIGN §15/§50/§60）', () => {
  it('九關依序為 1-9 且參數符合 §15/§21/§50/§60 表', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(LEVELS.map((l) => l.worldWidth)).toEqual([
      2700, 3100, 3500, 854, 3300, 3600, 854, 3400, 3700,
    ]);
    expect(LEVELS.map((l) => l.killQuota)).toEqual([6, 9, 10, 0, 10, 12, 0, 11, 12]);
    expect(LEVELS.map((l) => l.spawnIntervalMs)).toEqual([
      2600, 1800, 1300, 3500, 1500, 1200, 4500, 1400, 1150,
    ]);
    expect(LEVELS.map((l) => l.maxOnScreen)).toEqual([3, 4, 5, 2, 5, 5, 1, 5, 5]);
    expect(LEVELS.map((l) => l.safeZoneTailPx)).toEqual([480, 480, 480, 0, 480, 480, 0, 480, 480]);
  });

  it('雙魔王品種標記（§54）：L4 果凍王、L7 暗月蝠王；僅第 1 關帶教學、L8 帶星化提示', () => {
    expect(LEVELS.map((l) => l.boss)).toEqual([
      null,
      null,
      null,
      'jellord',
      null,
      null,
      'noctra',
      null,
      null,
    ]);
    expect(LEVELS.map((l) => l.tutorial)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(getLevel(8).hint).toContain('星化');
  });

  it('每關 enemyMix 權重總和為 1', () => {
    for (const level of LEVELS) {
      const total = level.enemyMix.reduce((sum, entry) => sum + entry.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });

  it('L2 權重重配（§30/§47）：shelly 15% + glowy 10% 入編，可吸佔比 ≥50%', () => {
    const mix = Object.fromEntries(getLevel(2).enemyMix.map((e) => [e.kind, e.weight]));
    expect(mix).toEqual({ floaty: 0.3, spiky: 0.25, puffy: 0.2, shelly: 0.15, glowy: 0.1 });
    const inhalable = getLevel(2)
      .enemyMix.filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L3 八種混編（§47 drilly/glowy 入編）且可吸怪佔比 ≥50%（drilly 保守不計）', () => {
    const mix = getLevel(3).enemyMix;
    expect(mix.map((e) => e.kind).sort()).toEqual(
      ['chompy', 'drilly', 'floaty', 'glowy', 'jelly', 'puffy', 'spiky', 'zappy'].sort(),
    );
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('中魔王精英（§48/§52）：走動關皆配置、boss 關無；房址落於安全帶且獎勵為稀有味', () => {
    for (const level of LEVELS) {
      if (level.boss) {
        expect(level.elites).toEqual([]);
        continue;
      }
      expect(level.elites.length).toBeGreaterThanOrEqual(1);
      for (const elite of level.elites) {
        // 多房關（L6 雙精英）放寬至 25%-75% 帶；房界不得越出世界。
        expect(elite.x).toBeGreaterThan(level.worldWidth * 0.25);
        expect(elite.x).toBeLessThan(level.worldWidth * 0.75);
        expect(elite.x + 300).toBeLessThan(level.worldWidth - level.safeZoneTailPx);
        expect(elite.hp).toBeGreaterThanOrEqual(10);
        expect(elite.speedMul).toBeGreaterThan(1);
        // 稀有味必為可吸屬性怪（glowy/spora/boomy 恆可吸、drilly 破土窗可吸）。
        expect(['drilly', 'glowy', 'spora', 'boomy']).toContain(elite.rewardFlavor);
      }
      // 雙精英房（§52）不重疊：房心距 ≥ 2×門距（600px）。
      for (let i = 1; i < level.elites.length; i += 1) {
        const prev = level.elites[i - 1];
        const curr = level.elites[i];
        expect((curr?.x ?? 0) - (prev?.x ?? 0)).toBeGreaterThanOrEqual(600);
      }
    }
  });

  it('boss 關補生全為可吸或條件可吸（L4/L7）；恆可吸佔比 ≥0.6 保飢荒保證律', () => {
    for (const id of [4, 7] as const) {
      const mix = getLevel(id).enemyMix;
      expect(mix.every((entry) => canInhale(entry.kind, true))).toBe(true);
      const always = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
      expect(always).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('L8 磁極洞窟（§60）：magno 主場、drilly 地下突襲組合、可吸佔比 ≥50%', () => {
    const mix = getLevel(8).enemyMix;
    expect(mix.find((e) => e.kind === 'magno')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(mix.some((e) => e.kind === 'drilly')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L9 鏡影迴廊（§60）：mirri 主場、雙新怪同場、雙精英房距 ≥600、可吸佔比 ≥50%', () => {
    const level = getLevel(9);
    expect(level.enemyMix.find((e) => e.kind === 'mirri')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(level.enemyMix.some((e) => e.kind === 'magno')).toBe(true);
    expect(level.elites).toHaveLength(2);
    expect(level.elites.map((e) => e.kind)).toEqual(['mirri', 'magno']);
    const inhalable = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L5 氣流關（§51/§52）：gusty 主場、含 spora、可吸佔比 ≥50%', () => {
    const mix = getLevel(5).enemyMix;
    expect(mix.find((e) => e.kind === 'gusty')?.weight).toBeGreaterThanOrEqual(0.25);
    expect(mix.some((e) => e.kind === 'spora')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L6 全怪種高密度混編（§52）：十二種全數入編、可吸佔比 ≥50%', () => {
    const mix = getLevel(6).enemyMix;
    expect(mix.map((e) => e.kind).sort()).toEqual(
      [
        'boomy',
        'chompy',
        'drilly',
        'floaty',
        'glowy',
        'gusty',
        'jelly',
        'puffy',
        'shelly',
        'spiky',
        'spora',
        'zappy',
      ].sort(),
    );
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  // 高台（y < 272）必須被氣流柱涵蓋（anti-softlock §56）：柱域水平涵蓋且柱頂高於平台。
  const updraftServed = (level: LevelSpec, platform: { x: number; y: number; w: number }) =>
    level.elements.some(
      (element) =>
        element.kind === 'updraft' &&
        Math.abs(element.x - platform.x) <= (element.w + platform.w) / 2 &&
        element.topY < platform.y,
    );

  it('平台位於世界範圍內；雙層以內或氣流柱可達（§21/§51）；向上爬升可跳達（≤82px）', () => {
    const groundTop = 400; // 主地面頂（480 - 80）
    for (const level of LEVELS) {
      let prevY = groundTop;
      for (const platform of level.platforms) {
        expect(platform.x - platform.w / 2).toBeGreaterThanOrEqual(0);
        expect(platform.x + platform.w / 2).toBeLessThanOrEqual(level.worldWidth);
        if (platform.y < 272) {
          // v8 高台（§51）：超出雙層的平台必為氣流柱服務對象，且不逼近世界頂。
          expect(platform.y).toBeGreaterThanOrEqual(190);
          expect(updraftServed(level, platform)).toBe(true);
        } else {
          // 向上爬升不得超過單跳最高 98px 的安全值；向下落無限制；氣流高台不入跳鏈。
          expect(prevY - platform.y).toBeLessThanOrEqual(82);
        }
        if (platform.y >= 272) prevY = platform.y;
      }
    }
  });

  it('氣流柱（§51）：僅 L5 配置、柱域於世界內、柱頂留頂部安全帶（≥100px）', () => {
    for (const level of LEVELS) {
      const updrafts = level.elements.filter((element) => element.kind === 'updraft');
      if (level.id !== 5) {
        expect(updrafts).toEqual([]);
        continue;
      }
      expect(updrafts.length).toBeGreaterThanOrEqual(2);
      for (const zone of updrafts) {
        if (zone.kind !== 'updraft') continue;
        expect(zone.x - zone.w / 2).toBeGreaterThanOrEqual(0);
        expect(zone.x + zone.w / 2).toBeLessThanOrEqual(level.worldWidth);
        // 卡頂防護（§56）：柱頂距世界頂 ≥100px，升力止於柱頂自然拋出。
        expect(zone.topY).toBeGreaterThanOrEqual(100);
        expect(zone.topY).toBeLessThan(400);
      }
    }
  });

  it('getLevel 未知 id 擲錯', () => {
    expect(() => getLevel(10 as never)).toThrow();
  });

  const elementsOf = (level: LevelSpec, kind: StageElementSpec['kind']) =>
    level.elements.filter((element) => element.kind === kind);

  it('v4 元素依 §29 推進：S1 單向、S2 +移動+彈簧、S3 +可破壞磚、boss 關佈局特化', () => {
    for (const id of [1, 2, 3, 5, 6, 8, 9] as const) {
      const count = elementsOf(getLevel(id), 'oneway').length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
    }
    for (const id of [2, 3, 6, 8, 9] as const) {
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
    // L4 僅裝飾；L7 加雙彈簧板（§58 非風化到空路徑），不配其他元素。
    expect(getLevel(4).elements).toEqual([]);
    expect(elementsOf(getLevel(7), 'spring')).toHaveLength(2);
    expect(getLevel(7).elements).toHaveLength(2);
    for (const id of [4, 7] as const) {
      expect(getLevel(id).decor.length).toBeGreaterThan(0);
    }
  });

  it('v4 平台型元素於世界內、層高合法且移動掃程不出界（§29）', () => {
    const groundTop = 400;
    for (const level of LEVELS) {
      for (const element of level.elements) {
        if (element.kind === 'spring' || element.kind === 'breakable') continue;
        if (element.kind === 'updraft') continue;
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
    // v8 道具主題重用（§55）：新 biome 沿用既有主題道具條。
    const decorTheme: Record<string, string> = {
      'bg-canyon': 'heights',
      'bg-gallery': 'arena',
      'bg-eclipse': 'throne',
      'bg-cavern': 'arena',
      'bg-mirror': 'arena',
    };
    for (const level of LEVELS) {
      const theme = decorTheme[level.bgKey] ?? level.bgKey.replace('bg-', '');
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

  it('nextLevelId 依 1→…→9→null 推進', () => {
    expect(nextLevelId(1)).toBe(2);
    expect(nextLevelId(2)).toBe(3);
    expect(nextLevelId(3)).toBe(4);
    expect(nextLevelId(4)).toBe(5);
    expect(nextLevelId(5)).toBe(6);
    expect(nextLevelId(6)).toBe(7);
    expect(nextLevelId(7)).toBe(8);
    expect(nextLevelId(8)).toBe(9);
    expect(nextLevelId(9)).toBeNull();
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
