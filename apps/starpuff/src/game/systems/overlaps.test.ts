import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { ENEMY, STAR_FLAVORS } from '../core/config';
import { SHELL_REFLECT } from '../logic/transform';
import { wireCombatOverlaps, type CombatOverlapHooks } from './overlaps';
import type { BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { StageHandle } from './stage';
import type { StarCombat } from './starCombat';

// characterization（v17 債務列車）：鎖住自 GameScene 抽出的 overlap 接線現行為——
// 接線數量/順序與關鍵回調結算路徑；真實碰撞偵測由 Phaser 引擎與 e2e 覆蓋。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

type OverlapCallback = (a: unknown, b: unknown) => void;

interface Wiring {
  kind: 'overlap' | 'collider';
  a: unknown;
  b: unknown;
  callback: OverlapCallback | undefined;
}

function makeScene(): { scene: Phaser.Scene; wirings: Wiring[]; moveTo: ReturnType<typeof vi.fn> } {
  const wirings: Wiring[] = [];
  const moveTo = vi.fn();
  const scene = {
    physics: {
      add: {
        overlap: (a: unknown, b: unknown, callback?: OverlapCallback) => {
          wirings.push({ kind: 'overlap', a, b, callback });
        },
        collider: (
          a: unknown,
          b: unknown,
          callback?: OverlapCallback,
          process?: OverlapCallback,
        ) => {
          wirings.push({ kind: 'collider', a, b, callback: callback ?? process });
        },
      },
      moveTo,
    },
  } as unknown as Phaser.Scene;
  return { scene, wirings, moveTo };
}

interface HarnessConfig {
  bossBodies?: unknown[];
  shields?: unknown[] | null;
  meteor?: boolean;
  bossActive?: boolean;
  settled?: boolean;
  reflectForm?: boolean;
  inhaling?: boolean;
}

function makeHarness(config: HarnessConfig = {}): {
  scene: Phaser.Scene;
  wirings: Wiring[];
  hooks: CombatOverlapHooks;
  spies: {
    damagePlayer: ReturnType<typeof vi.fn>;
    damageBossAt: ReturnType<typeof vi.fn>;
    onStarHit: ReturnType<typeof vi.fn>;
    enemyDamage: ReturnType<typeof vi.fn>;
    shatter: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    trySlamStun: ReturnType<typeof vi.fn>;
    onSlamBounce: ReturnType<typeof vi.fn>;
    applyCaramel: ReturnType<typeof vi.fn>;
    grantStar: ReturnType<typeof vi.fn>;
  };
  groups: {
    stars: object;
    enemyGroup: object;
    hazards: object;
    inhaleZone: object;
    playerSprite: { x: number; y: number; body: object };
    projectiles: object;
    shockwaves: object;
  };
} {
  const { scene, wirings, moveTo } = makeScene();
  const stars = { name: 'stars' };
  const enemyGroup = { name: 'enemies', getChildren: () => [] as unknown[] };
  const hazards = { name: 'hazards' };
  const inhaleZone = { name: 'inhale-zone' };
  const playerSprite = { x: 100, y: 300, body: { bottom: 300 } };
  const projectiles = { name: 'projectiles' };
  const shockwaves = { name: 'shockwaves' };
  const shields = config.shields ? { name: 'shields', getChildren: () => config.shields! } : null;
  const damagePlayer = vi.fn();
  const applyCaramel = vi.fn();
  const damageBossAt = vi.fn();
  const onStarHit = vi.fn();
  const enemyDamage = vi.fn(() => 'hurt');
  const shatter = vi.fn();
  const trySlamStun = vi.fn(() => false);
  const onSlamBounce = vi.fn();
  const grantStar = vi.fn();
  const player = {
    sprite: playerSprite,
    getStars: () => stars,
    getInhaleZone: () => inhaleZone,
    onStarHit,
    grantStar,
    isInhaling: () => config.inhaling ?? false,
    getFacing: () => 1,
    isSlamming: () => false,
    onSlamBounce,
    getTransformState: () => ({ form: config.reflectForm ? 'shell' : null, remainingMs: 0 }),
  } as unknown as PlayerHandle;
  const enemies = {
    getGroup: () => enemyGroup,
    getHazards: () => hazards,
    kindOf: (child: unknown) => (child as { kind?: string }).kind ?? null,
    isStarImmune: () => false,
    isReflective: () => false,
    isPhasedOut: () => false,
    isInhalable: () => false,
    damage: enemyDamage,
    applySlow: vi.fn(),
    reflectStar: vi.fn(),
  } as unknown as EnemySystem;
  const boss = {
    isActive: () => config.bossActive ?? true,
    getShields: shields ? () => shields : undefined,
    getProjectiles: () => projectiles,
    getShockwaves: () => shockwaves,
    trySlamStun,
  } as unknown as BossHandle;
  const meteor = config.meteor
    ? ({
        getMeteors: () => ({ name: 'meteors', getChildren: () => [] as unknown[] }),
        getEmbers: () => ({ name: 'embers' }),
        shatter,
      } as unknown as MeteorSystem)
    : null;
  const stage = {
    getOneWay: () => ({ name: 'oneway' }),
    getMoving: () => ({ name: 'moving' }),
    getBreakables: () => ({ name: 'breakables' }),
    getSprings: () => ({ name: 'springs' }),
    canLandOneWay: vi.fn(),
    onSpringOverlap: vi.fn(),
    breakBrick: vi.fn(() => true),
  } as unknown as StageHandle;
  const combat = {
    specOf: (star: unknown) =>
      (star as { spec?: typeof STAR_FLAVORS.jelly }).spec ?? STAR_FLAVORS.jelly,
    mixOf: () => null,
    damageOf: () => 5,
    playerFormSpec: () =>
      config.reflectForm ? { reflectProjectiles: true, contactDamage: 0 } : null,
    explodeStar: vi.fn(),
    chainLightning: vi.fn(),
    freezeField: vi.fn(),
  } as unknown as StarCombat;
  const hooks: CombatOverlapHooks = {
    player: () => player,
    enemies: () => enemies,
    boss: () => boss,
    fx: () => ({ burstSmall: vi.fn(), shake: vi.fn() }) as unknown as FxSystem,
    meteor: () => meteor,
    stage: () => stage,
    combat: () => combat,
    bossBodies: () => (config.bossBodies ?? []) as Phaser.Physics.Arcade.Sprite[],
    nearestBossBody: () => ({ x: 400, y: 200 }) as unknown as Phaser.Physics.Arcade.Sprite,
    bossTouchDamage: () => 2,
    damagePlayer,
    damageBossAt,
    isSettled: () => config.settled ?? false,
    isBossDown: () => false,
    now: () => 10_000,
    applyCaramel,
  };
  return {
    scene,
    wirings,
    hooks,
    spies: {
      damagePlayer,
      damageBossAt,
      onStarHit,
      enemyDamage,
      shatter,
      moveTo,
      trySlamStun,
      onSlamBounce,
      applyCaramel,
      grantStar,
    },
    groups: { stars, enemyGroup, hazards, inhaleZone, playerSprite, projectiles, shockwaves },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('接線數量與順序（凍結契約）', () => {
  it('單本體魔王＋無盾＋無流星雨：13 條接線且順序固定', () => {
    const body = { name: 'boss-body', body: { enable: true } };
    const { scene, wirings, hooks, groups } = makeHarness({ bossBodies: [body] });
    wireCombatOverlaps(scene, hooks);
    expect(wirings.map((w) => w.kind)).toEqual([
      'overlap', // 星彈 vs 小怪
      'overlap', // 星彈 vs 魔王本體
      'overlap', // 玩家 vs 危險物
      'overlap', // 玩家 vs 小怪
      'overlap', // 吸入區 vs 小怪
      'overlap', // 玩家 vs 魔王本體
      'overlap', // 玩家 vs 彈幕
      'overlap', // 反彈彈幕 vs 魔王本體
      'overlap', // 玩家 vs 衝擊波
      'collider', // 玩家 vs 單向平台
      'collider', // 玩家 vs 移動平台
      'collider', // 玩家 vs 磚
      'overlap', // 玩家 vs 彈簧
      'overlap', // 星彈 vs 磚
    ]);
    expect(wirings[0]?.a).toBe(groups.stars);
    expect(wirings[0]?.b).toBe(groups.enemyGroup);
    expect(wirings[1]?.b).toBe(body);
  });

  it('雙本體魔王：星彈/觸碰/反彈各逐本體接線（+3）；流星雨關再 +3', () => {
    const bodies = [
      { name: 'a', body: { enable: true } },
      { name: 'b', body: { enable: true } },
    ];
    const twin = makeHarness({ bossBodies: bodies });
    wireCombatOverlaps(twin.scene, twin.hooks);
    const twinCount = twin.wirings.length;
    const single = makeHarness({ bossBodies: [bodies[0]] });
    wireCombatOverlaps(single.scene, single.hooks);
    expect(twinCount).toBe(single.wirings.length + 3);

    const meteor = makeHarness({ bossBodies: [bodies[0]], meteor: true });
    wireCombatOverlaps(meteor.scene, meteor.hooks);
    expect(meteor.wirings.length).toBe(single.wirings.length + 3);
  });
});

describe('關鍵回調結算路徑', () => {
  it('危險物命中：hazard 失效＋damagePlayer 單一入口；轉場窗靜默', () => {
    const { scene, wirings, hooks, spies, groups } = makeHarness({});
    wireCombatOverlaps(scene, hooks);
    const hazardWiring = wirings.find((w) => w.b === groups.hazards);
    const hazard = { active: true, x: 240, disableBody: vi.fn() };
    hazardWiring?.callback?.({}, hazard);
    expect(hazard.disableBody).toHaveBeenCalledWith(true, true);
    expect(spies.damagePlayer).toHaveBeenCalledWith(ENEMY.touchDamage, 240);

    const settled = makeHarness({ settled: true });
    wireCombatOverlaps(settled.scene, settled.hooks);
    const settledWiring = settled.wirings.find((w) => w.b === settled.groups.hazards);
    const hazard2 = { active: true, x: 240, disableBody: vi.fn() };
    settledWiring?.callback?.({}, hazard2);
    expect(settled.spies.damagePlayer).not.toHaveBeenCalled();
  });

  it('星彈命中魔王本體：吸收＋damageBossAt 帶命中座標；非 active 穿過', () => {
    const body = { name: 'boss-body', body: { enable: true } };
    const { scene, wirings, hooks, spies } = makeHarness({ bossBodies: [body] });
    wireCombatOverlaps(scene, hooks);
    const wiring = wirings[1];
    const star = { active: true, x: 300, y: 200, getData: () => undefined };
    wiring?.callback?.(star, body);
    expect(spies.onStarHit).toHaveBeenCalledWith(star, 'absorb');
    expect(spies.damageBossAt).toHaveBeenCalledWith(5, 300, 200);

    spies.damageBossAt.mockClear();
    const spent = { active: false, x: 300, y: 200, getData: () => undefined };
    wiring?.callback?.(spent, body);
    expect(spies.damageBossAt).not.toHaveBeenCalled();
  });

  it('殼化反彈：彈幕標記 reflected＋朝最近本體 moveTo，不傷玩家', () => {
    const body = { name: 'boss-body', body: { enable: true } };
    const { scene, wirings, hooks, spies, groups } = makeHarness({
      bossBodies: [body],
      reflectForm: true,
    });
    wireCombatOverlaps(scene, hooks);
    const wiring = wirings.find((w) => w.a === groups.playerSprite && w.b === groups.projectiles);
    const data: Record<string, unknown> = {};
    const projectile = {
      active: true,
      x: 150,
      y: 250,
      getData: (key: string) => data[key],
      setData: (key: string, value: unknown) => {
        data[key] = value;
      },
      setTint: vi.fn(),
      disableBody: vi.fn(),
      body: { setAllowGravity: vi.fn() },
    };
    wiring?.callback?.({}, projectile);
    expect(data['reflected']).toBe(true);
    expect(spies.moveTo).toHaveBeenCalledWith(projectile, 400, 200, SHELL_REFLECT.speed);
    expect(spies.damagePlayer).not.toHaveBeenCalled();
    expect(projectile.disableBody).not.toHaveBeenCalled();
  });

  it('反彈彈幕回傷：僅帶標記彈體對魔王結算 reflect 歸因', () => {
    const body = { name: 'boss-body', body: { enable: true } };
    const { scene, wirings, hooks, spies } = makeHarness({ bossBodies: [body] });
    wireCombatOverlaps(scene, hooks);
    const wiring = wirings.find((w) => w.a === body);
    const reflected = {
      active: true,
      x: 350,
      y: 180,
      getData: (key: string) => (key === 'reflected' ? true : undefined),
      disableBody: vi.fn(),
    };
    wiring?.callback?.(body, reflected);
    expect(spies.damageBossAt).toHaveBeenCalledWith(SHELL_REFLECT.damage, 350, 180, 'reflect');

    spies.damageBossAt.mockClear();
    const plain = { active: true, x: 350, y: 180, getData: () => undefined, disableBody: vi.fn() };
    wiring?.callback?.(body, plain);
    expect(spies.damageBossAt).not.toHaveBeenCalled();
  });

  it('魔王頭頂 hit window：下砸命中上半身走暈眩回彈免體傷', () => {
    const body = { name: 'boss-body', y: 320, x: 400, body: { enable: true } };
    const harness = makeHarness({ bossBodies: [body] });
    const player = harness.hooks.player();
    (player as { isSlamming(): boolean }).isSlamming = () => true;
    (player.sprite.body as { bottom: number }).bottom = 300;
    wireCombatOverlaps(harness.scene, harness.hooks);
    const wiring = harness.wirings[5];
    wiring?.callback?.(harness.groups.playerSprite, body);
    expect(harness.spies.trySlamStun).toHaveBeenCalledTimes(1);
    expect(harness.spies.onSlamBounce).toHaveBeenCalledTimes(1);
    expect(harness.spies.damagePlayer).not.toHaveBeenCalled();
  });

  it('折返彈吸入回收（§5 W2）：inhalable＋吸入中 → grantStar 免傷；未吸入照常結算', () => {
    const inhaling = makeHarness({ inhaling: true });
    wireCombatOverlaps(inhaling.scene, inhaling.hooks);
    const wiring = inhaling.wirings.find(
      (w) => w.a === inhaling.groups.playerSprite && w.b === inhaling.groups.projectiles,
    );
    const makeProjectile = () => ({
      active: true,
      x: 150,
      getData: (key: string) => (key === 'inhalable' ? true : undefined),
      disableBody: vi.fn(),
    });
    const recycled = makeProjectile();
    wiring?.callback?.({}, recycled);
    expect(inhaling.spies.grantStar).toHaveBeenCalledWith('jelly');
    expect(inhaling.spies.damagePlayer).not.toHaveBeenCalled();
    expect(recycled.disableBody).toHaveBeenCalledWith(true, true);

    // 負例：未吸入 → inhalable 彈照常 1 傷路徑（bossTouchDamage）。
    const idle = makeHarness({});
    wireCombatOverlaps(idle.scene, idle.hooks);
    const idleWiring = idle.wirings.find(
      (w) => w.a === idle.groups.playerSprite && w.b === idle.groups.projectiles,
    );
    idleWiring?.callback?.({}, makeProjectile());
    expect(idle.spies.grantStar).not.toHaveBeenCalled();
    expect(idle.spies.damagePlayer).toHaveBeenCalledWith(2, 150);
  });

  it('糖漿波焦糖化（§5 W2）：caramel 旗標 → applyCaramel＋傷害照常；無旗標不沾糖', () => {
    const { scene, wirings, hooks, spies, groups } = makeHarness({});
    wireCombatOverlaps(scene, hooks);
    const wiring = wirings.find((w) => w.a === groups.playerSprite && w.b === groups.shockwaves);
    const caramelWave = {
      active: true,
      x: 220,
      getData: (key: string) => (key === 'caramel' ? true : undefined),
    };
    wiring?.callback?.({}, caramelWave);
    expect(spies.applyCaramel).toHaveBeenCalledTimes(1);
    expect(spies.damagePlayer).toHaveBeenCalledWith(2, 220);

    // 負例：一般衝擊波僅結算傷害，不套焦糖。
    spies.applyCaramel.mockClear();
    spies.damagePlayer.mockClear();
    const plainWave = { active: true, x: 220, getData: () => undefined };
    wiring?.callback?.({}, plainWave);
    expect(spies.applyCaramel).not.toHaveBeenCalled();
    expect(spies.damagePlayer).toHaveBeenCalledWith(2, 220);
  });

  it('隕星命中玩家：先碎裂再走 damagePlayer 單一入口', () => {
    const harness = makeHarness({ meteor: true });
    wireCombatOverlaps(harness.scene, harness.hooks);
    const meteorWiring = harness.wirings.find(
      (w) => w.a === harness.groups.playerSprite && (w.b as { name?: string }).name === 'meteors',
    );
    const rock = { active: true, x: 500 };
    meteorWiring?.callback?.({}, rock);
    expect(harness.spies.shatter).toHaveBeenCalledWith(rock);
    expect(harness.spies.damagePlayer).toHaveBeenCalledWith(ENEMY.touchDamage, 500);
  });
});
