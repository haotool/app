import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { GRAVITY_Y } from '../core/config';
import { BOSS } from '../logic/bossFsm';
import { GRAVION } from '../logic/gravionFsm';
import { LIUDONG } from '../logic/liudongFsm';
import { MARIDELLA } from '../logic/maridellaFsm';
import { NOCTRA } from '../logic/noctraFsm';
import { PRISMIX } from '../logic/prismixFsm';
import { REFLECTOR } from '../logic/reflectorFsm';
import { SYRONA } from '../logic/syronaFsm';
import { TARIFFANG } from '../logic/tariffangFsm';
import { VOIDRA } from '../logic/voidraFsm';
import type { LevelSpec } from '../logic/levels';
import { createBossKit, type BossFactoryHooks } from './bossFactory';
import { createBoss } from './boss';
import { createGravion } from './gravion';
import { createLiudong } from './liudong';
import { createMaridella } from './maridella';
import { createNoctra } from './noctra';
import { createPrismix } from './prismix';
import { createReflector } from './reflector';
import { createSyrona } from './syrona';
import { createTariffang } from './tariffang';
import { createVoidra } from './voidra';
import { spawnHealPickup } from './pickups';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { TideHandle } from './tide';

// characterization（v17 債務列車）：鎖住自 GameScene 抽出的魔王工廠現行為——
// 品種分派表、體傷常數對映、補給小怪節奏與品種回呼接線；呈現層本體由各自
// systems 模組與 e2e 覆蓋。

vi.mock('./boss', () => ({ createBoss: vi.fn(() => ({ id: 'jellord-handle' })) }));
vi.mock('./noctra', () => ({ createNoctra: vi.fn(() => ({ id: 'noctra-handle' })) }));
vi.mock('./prismix', () => ({ createPrismix: vi.fn(() => ({ id: 'prismix-handle' })) }));
vi.mock('./syrona', () => ({ createSyrona: vi.fn(() => ({ id: 'syrona-handle' })) }));
vi.mock('./voidra', () => ({ createVoidra: vi.fn(() => ({ id: 'voidra-handle' })) }));
vi.mock('./tariffang', () => ({ createTariffang: vi.fn(() => ({ id: 'tariffang-handle' })) }));
vi.mock('./maridella', () => ({ createMaridella: vi.fn(() => ({ id: 'maridella-handle' })) }));
vi.mock('./reflector', () => ({ createReflector: vi.fn(() => ({ id: 'reflector-handle' })) }));
vi.mock('./gravion', () => ({ createGravion: vi.fn(() => ({ id: 'gravion-handle' })) }));
vi.mock('./liudong', () => ({ createLiudong: vi.fn(() => ({ id: 'liudong-handle' })) }));
vi.mock('./pickups', () => ({ spawnHealPickup: vi.fn() }));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

const GROUND_TOP = 400;

function makeScene(): { scene: Phaser.Scene; flash: ReturnType<typeof vi.fn> } {
  const flash = vi.fn();
  return {
    flash,
    scene: {
      cameras: { main: { flash } },
      scale: { width: 854 },
      physics: { world: { gravity: { y: GRAVITY_Y } } },
    } as unknown as Phaser.Scene,
  };
}

function makeLevel(overrides: Partial<LevelSpec>): LevelSpec {
  return {
    boss: null,
    maxOnScreen: 5,
    enemyMix: [{ kind: 'jelly', weight: 1 }],
    gravityScale: undefined,
    ...overrides,
  } as unknown as LevelSpec;
}

interface EnemiesStub {
  system: EnemySystem;
  spawned: { kind: string; x: number; y: number }[];
  safeSupplyKinds: string[];
  setAlive(entries: { kind: string; active?: boolean; x?: number }[]): void;
  aliveTotal: number;
}

function makeEnemies(): EnemiesStub {
  const spawned: { kind: string; x: number; y: number }[] = [];
  const safeSupplyKinds: string[] = [];
  let children: { kind: string; active: boolean; x: number }[] = [];
  const stub: EnemiesStub = {
    spawned,
    safeSupplyKinds,
    aliveTotal: 0,
    setAlive(entries) {
      children = entries.map((entry) => ({
        kind: entry.kind,
        active: entry.active ?? true,
        x: entry.x ?? 0,
      }));
    },
    system: {
      spawn: (kind: string, x: number, y: number) => {
        spawned.push({ kind, x, y });
        return {
          setData: (key: string, value: unknown) => {
            if (key === 'safeSupply' && value === true) safeSupplyKinds.push(kind);
            return undefined;
          },
        };
      },
      aliveCount: () => stub.aliveTotal,
      getGroup: () => ({ getChildren: () => children }),
      kindOf: (child: unknown) => (child as { kind: string }).kind,
    } as unknown as EnemySystem,
  };
  return stub;
}

function makeHooks(
  enemies: EnemiesStub,
  overrides: Partial<BossFactoryHooks> = {},
): {
  hooks: BossFactoryHooks;
  feedEggs: ReturnType<typeof vi.fn>;
  fxStarBurst: ReturnType<typeof vi.fn>;
  replaceTide: ReturnType<typeof vi.fn>;
} {
  const feedEggs = vi.fn();
  const fxStarBurst = vi.fn();
  const replaceTide = vi.fn();
  const hooks: BossFactoryHooks = {
    exMode: false,
    arenaLeft: () => 0,
    worldWidth: () => 854,
    enemies: () => enemies.system,
    fx: () => ({ starBurst: fxStarBurst, burstSmall: vi.fn() }) as unknown as FxSystem,
    player: () => ({}) as unknown as PlayerHandle,
    playerHp: () => 5,
    tide: () => null,
    replaceTide,
    meteor: () => null,
    feedEggs,
    ...overrides,
  };
  return { hooks, feedEggs, fxStarBurst, replaceTide };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createBossKit 品種分派表（§54 唯一分派點）', () => {
  it('jellord：createBoss 接 ex 旗標、bodyDamage 取 BOSS 常數', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies, { exMode: true });
    const kit = createBossKit(makeScene().scene, makeLevel({ boss: 'jellord' }), GROUND_TOP, hooks);
    expect(kit.handle).toEqual({ id: 'jellord-handle' });
    expect(kit.bodyDamage).toBe(BOSS.bodyDamage);
    expect(vi.mocked(createBoss).mock.calls[0]?.[1]).toMatchObject({ ex: true });
  });

  it('非 boss 關建 jellord 待命殼（永不 spawn 的預設分支）', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies);
    const kit = createBossKit(makeScene().scene, makeLevel({ boss: null }), GROUND_TOP, hooks);
    expect(kit.handle).toEqual({ id: 'jellord-handle' });
    expect(vi.mocked(createBoss)).toHaveBeenCalledTimes(1);
  });

  it('noctra/prismix/syrona/voidra/tariffang/maridella/reflector/gravion/liudong 各取對應 handle 與體傷常數', () => {
    const cases = [
      { boss: 'noctra', factory: createNoctra, damage: NOCTRA.bodyDamage },
      { boss: 'prismix', factory: createPrismix, damage: PRISMIX.bodyDamage },
      { boss: 'syrona', factory: createSyrona, damage: SYRONA.bodyDamage },
      { boss: 'voidra', factory: createVoidra, damage: VOIDRA.bodyDamage },
      { boss: 'tariffang', factory: createTariffang, damage: TARIFFANG.bodyDamage },
      { boss: 'maridella', factory: createMaridella, damage: MARIDELLA.bodyDamage },
      { boss: 'reflector', factory: createReflector, damage: REFLECTOR.bodyDamage },
      { boss: 'gravion', factory: createGravion, damage: GRAVION.bodyDamage },
      { boss: 'liudong', factory: createLiudong, damage: LIUDONG.bodyDamage },
    ] as const;
    for (const spec of cases) {
      const enemies = makeEnemies();
      const { hooks } = makeHooks(enemies);
      const kit = createBossKit(
        makeScene().scene,
        makeLevel({ boss: spec.boss }),
        GROUND_TOP,
        hooks,
      );
      expect(kit.handle).toEqual({ id: `${spec.boss}-handle` });
      expect(kit.bodyDamage).toBe(spec.damage);
      expect(vi.mocked(spec.factory)).toHaveBeenCalledTimes(1);
    }
  });

  it('jellord EX 擊破分裂：onSplit 於魔王位置置中生成 count 隻小果凍', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies, { exMode: true });
    createBossKit(makeScene().scene, makeLevel({ boss: 'jellord' }), GROUND_TOP, hooks);
    const options = vi.mocked(createBoss).mock.calls[0]?.[1] as {
      onSplit?: (x: number, y: number, count: number) => void;
    };
    options.onSplit?.(400, 300, 3);
    expect(enemies.spawned).toEqual([
      { kind: 'jelly', x: 400 - 46, y: 280 },
      { kind: 'jelly', x: 400, y: 280 },
      { kind: 'jelly', x: 400 + 46, y: 280 },
    ]);
  });
});

describe('spawnBossMinion 補給節奏（每損 10 HP 掉補給）', () => {
  it('左右邊緣交替入場、品種依 enemyMix 輪替、floaty 走空中高度', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies);
    const level = makeLevel({
      boss: 'jellord',
      enemyMix: [
        { kind: 'jelly', weight: 1 },
        { kind: 'floaty', weight: 1 },
      ] as LevelSpec['enemyMix'],
    });
    const kit = createBossKit(makeScene().scene, level, GROUND_TOP, hooks);
    kit.spawnBossMinion();
    kit.spawnBossMinion();
    kit.spawnBossMinion();
    expect(enemies.spawned).toEqual([
      { kind: 'jelly', x: 48, y: 330 },
      { kind: 'floaty', x: 854 - 48, y: 240 },
      { kind: 'jelly', x: 48, y: 330 },
    ]);
  });

  it('場上達 maxOnScreen+2 時不再補生（防接觸傷害牆）', () => {
    const enemies = makeEnemies();
    enemies.aliveTotal = 7;
    const { hooks } = makeHooks(enemies);
    const kit = createBossKit(
      makeScene().scene,
      makeLevel({ boss: 'jellord', maxOnScreen: 5 }),
      GROUND_TOP,
      hooks,
    );
    kit.spawnBossMinion();
    expect(enemies.spawned).toEqual([]);
  });

  it('L30 召喚與每 10 HP 補給共用 arena 總量上限（不形成接觸牆）', () => {
    const enemies = makeEnemies();
    enemies.setAlive([
      { kind: 'jelly', x: 80 },
      { kind: 'floaty', x: 360 },
      { kind: 'boomy', x: 720 },
    ]);
    const { hooks } = makeHooks(enemies);
    const kit = createBossKit(
      makeScene().scene,
      makeLevel({
        boss: 'liudong',
        enemyMix: [
          { kind: 'jelly', weight: 1 },
          { kind: 'floaty', weight: 1 },
        ] as LevelSpec['enemyMix'],
      }),
      GROUND_TOP,
      hooks,
    );
    kit.spawnBossMinion();
    const liudongHooks = vi.mocked(createLiudong).mock.calls[0]?.[1] as {
      summonMinion(kind: string, cap: number): void;
    };
    liudongHooks.summonMinion('jelly', 3);
    expect(enemies.spawned).toEqual([]);
  });

  it('每 10 HP 補給小怪標記為非接觸傷害資源，召喚攻擊體不共用該標記', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies);
    const kit = createBossKit(
      makeScene().scene,
      makeLevel({
        boss: 'liudong',
        enemyMix: [{ kind: 'jelly', weight: 1 }],
      }),
      GROUND_TOP,
      hooks,
    );
    kit.spawnBossMinion();
    expect(enemies.safeSupplyKinds).toEqual(['jelly']);

    const liudongHooks = vi.mocked(createLiudong).mock.calls[0]?.[1] as {
      summonMinion(kind: string, cap: number): void;
    };
    liudongHooks.summonMinion('bearmarket', 1);
    expect(enemies.safeSupplyKinds).toEqual(['jelly']);
  });
});

describe('summonMinion 召喚夾限（P2 帶品種 cap）', () => {
  it('noctra summonFloaty：依場上現量補至 cap、左右交替入場', () => {
    const enemies = makeEnemies();
    enemies.setAlive([{ kind: 'floaty' }, { kind: 'jelly' }]);
    const { hooks } = makeHooks(enemies);
    createBossKit(makeScene().scene, makeLevel({ boss: 'noctra' }), GROUND_TOP, hooks);
    const summonHooks = vi.mocked(createNoctra).mock.calls[0]?.[1] as {
      summonFloaty(cap: number): void;
    };
    summonMinionViaCap(summonHooks, 3);
    // 場上已 1 隻 floaty → 補 2 隻至 cap 3；jelly 不計入同種現量。
    expect(enemies.spawned).toEqual([
      { kind: 'floaty', x: 48, y: 240 },
      { kind: 'floaty', x: 854 - 48, y: 240 },
    ]);
  });

  it('召喚路徑同套潮汐生成調整（交叉不變式 13/17）', () => {
    const enemies = makeEnemies();
    const tide = {
      filterSpawnKind: vi.fn(() => 'jelly'),
      adjustSpawnY: vi.fn(() => 300),
    } as unknown as TideHandle;
    const { hooks } = makeHooks(enemies, { tide: () => tide });
    createBossKit(makeScene().scene, makeLevel({ boss: 'noctra' }), GROUND_TOP, hooks);
    const summonHooks = vi.mocked(createNoctra).mock.calls[0]?.[1] as {
      summonFloaty(cap: number): void;
    };
    summonMinionViaCap(summonHooks, 1);
    expect(enemies.spawned).toEqual([{ kind: 'jelly', x: 48, y: 300 }]);
  });
});

function summonMinionViaCap(hooks: { summonFloaty(cap: number): void }, cap: number): void {
  hooks.summonFloaty(cap);
}

describe('品種回呼接線（彩蛋餵送與環境管線委派）', () => {
  it('prismix onTwinFinish：餵 twin-finish 彩蛋＋全屏稜光演出', () => {
    const enemies = makeEnemies();
    const { hooks, feedEggs, fxStarBurst } = makeHooks(enemies);
    const { scene, flash } = makeScene();
    createBossKit(scene, makeLevel({ boss: 'prismix' }), GROUND_TOP, hooks);
    const prismixHooks = vi.mocked(createPrismix).mock.calls[0]?.[1] as {
      onTwinFinish(): void;
    };
    prismixHooks.onTwinFinish();
    expect(feedEggs).toHaveBeenCalledWith({ kind: 'twin-finish' });
    expect(flash).toHaveBeenCalled();
    expect(fxStarBurst).toHaveBeenCalledWith(854 / 2, expect.any(Number));
  });

  it('syrona startTide/boilTide：換裝走 replaceTide、沸騰走現役 setSpec', () => {
    const enemies = makeEnemies();
    const setSpec = vi.fn();
    const tide = { setSpec } as unknown as TideHandle;
    const { hooks, replaceTide } = makeHooks(enemies, { tide: () => tide });
    createBossKit(makeScene().scene, makeLevel({ boss: 'syrona' }), GROUND_TOP, hooks);
    const syronaHooks = vi.mocked(createSyrona).mock.calls[0]?.[1] as {
      startTide(spec: unknown): void;
      boilTide(spec: unknown): void;
    };
    const spec = { periodMs: 1000 };
    syronaHooks.startTide(spec);
    expect(replaceTide).toHaveBeenCalledWith(spec);
    syronaHooks.boilTide(spec);
    expect(setSpec).toHaveBeenCalledWith(spec);
  });

  it('voidra setBombardment：開＝setSpec+setActive(true)、關＝setActive(false)+清空中隕星', () => {
    const enemies = makeEnemies();
    const setSpec = vi.fn();
    const setActive = vi.fn();
    const clearAirborne = vi.fn();
    const meteor = { setSpec, setActive, clearAirborne } as unknown as MeteorSystem;
    const { hooks } = makeHooks(enemies, { meteor: () => meteor });
    createBossKit(makeScene().scene, makeLevel({ boss: 'voidra' }), GROUND_TOP, hooks);
    const voidraHooks = vi.mocked(createVoidra).mock.calls[0]?.[1] as {
      setBombardment(spec: unknown): void;
    };
    voidraHooks.setBombardment({ intervalMs: 3400, waveSize: 2 });
    expect(setSpec).toHaveBeenCalledWith({ intervalMs: 3400, waveSize: 2 });
    expect(setActive).toHaveBeenCalledWith(true);
    voidraHooks.setBombardment(null);
    expect(setActive).toHaveBeenCalledWith(false);
    expect(clearAirborne).toHaveBeenCalledTimes(1);
  });

  it('voidra setGravityScale：直寫全域重力、null 回關卡預設', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies);
    const { scene } = makeScene();
    createBossKit(scene, makeLevel({ boss: 'voidra', gravityScale: 0.8 }), GROUND_TOP, hooks);
    const voidraHooks = vi.mocked(createVoidra).mock.calls[0]?.[1] as {
      setGravityScale(scale: number | null): void;
    };
    voidraHooks.setGravityScale(0.5);
    expect(scene.physics.world.gravity.y).toBe(GRAVITY_Y * 0.5);
    voidraHooks.setGravityScale(null);
    expect(scene.physics.world.gravity.y).toBe(GRAVITY_Y * 0.8);
  });

  it('voidra dropSurvivalHeart：走 heal pickup 管線、緩降至地面帶', () => {
    const enemies = makeEnemies();
    const { hooks } = makeHooks(enemies);
    createBossKit(makeScene().scene, makeLevel({ boss: 'voidra' }), GROUND_TOP, hooks);
    const voidraHooks = vi.mocked(createVoidra).mock.calls[0]?.[1] as {
      dropSurvivalHeart(): void;
    };
    voidraHooks.dropSurvivalHeart();
    expect(vi.mocked(spawnHealPickup)).toHaveBeenCalledTimes(1);
    const args = vi.mocked(spawnHealPickup).mock.calls[0];
    expect(args?.[1]).toBe(854 * 0.3);
    expect(args?.[4]).toMatchObject({ driftToY: GROUND_TOP - 22 });
  });

  it('tariffang playerStars：燒稅票 overlap 的星彈群由 player 單點供給（§122）', () => {
    const enemies = makeEnemies();
    const stars = { id: 'stars-group' };
    const { hooks } = makeHooks(enemies, {
      player: () => ({ getStars: () => stars }) as unknown as PlayerHandle,
    });
    createBossKit(makeScene().scene, makeLevel({ boss: 'tariffang' }), GROUND_TOP, hooks);
    const tariffangHooks = vi.mocked(createTariffang).mock.calls[0]?.[1] as {
      playerStars(): unknown;
    };
    expect(tariffangHooks.playerStars()).toBe(stars);
  });

  it('maridella summonFoamy 走召喚夾限管線；playerForm 取 player 形態真值（§122）', () => {
    const enemies = makeEnemies();
    enemies.setAlive([{ kind: 'foamy' }]);
    const { hooks } = makeHooks(enemies, {
      player: () => ({ getTransformState: () => ({ form: 'tide' }) }) as unknown as PlayerHandle,
    });
    createBossKit(makeScene().scene, makeLevel({ boss: 'maridella' }), GROUND_TOP, hooks);
    const maridellaHooks = vi.mocked(createMaridella).mock.calls[0]?.[1] as {
      summonFoamy(cap: number): void;
      playerForm(): string | null;
    };
    maridellaHooks.summonFoamy(2);
    // 場上已 1 隻 foamy → 補 1 隻至 cap 2。
    expect(enemies.spawned).toEqual([{ kind: 'foamy', x: 48, y: 330 }]);
    expect(maridellaHooks.playerForm()).toBe('tide');
  });
});
