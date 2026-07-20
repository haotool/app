import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { getMix } from '../core/config';
import { BOSS_AIM_ASSIST } from '../logic/homing';
import { createStarSteering, type StarSteeringHooks } from './starSteering';
import { createStarCombat, type StarCombat } from './starCombat';
import type { BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// characterization（v17 債務列車）：鎖住自 GameScene 抽出的星彈導向候選過濾與
// 委派現行為；轉向數學由 logic/homing 與 logic/enemyFsm 單測覆蓋。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

interface FakeStar {
  active: boolean;
  x: number;
  y: number;
  body: { velocity: { x: number; y: number }; setVelocity: ReturnType<typeof vi.fn> };
  data: Record<string, unknown>;
  getData: (key: string) => unknown;
  setData: ReturnType<typeof vi.fn>;
}

function makeStar(x: number, y: number, vx: number, data: Record<string, unknown> = {}): FakeStar {
  const star: FakeStar = {
    active: true,
    x,
    y,
    body: { velocity: { x: vx, y: 0 }, setVelocity: vi.fn() },
    data,
    getData: (key) => star.data[key],
    setData: vi.fn((key: string, value: unknown) => {
      star.data[key] = value;
    }),
  };
  return star;
}

interface FakeEnemy {
  active: boolean;
  x: number;
  y: number;
  kind: string;
  data: Record<string, unknown>;
  getData: (key: string) => unknown;
}

function makeEnemy(
  x: number,
  y: number,
  kind = 'jelly',
  data: Record<string, unknown> = {},
): FakeEnemy {
  return { active: true, x, y, kind, data, getData: (key) => data[key] };
}

function makeHarness(config: {
  stars?: FakeStar[];
  enemies?: FakeEnemy[];
  bossLevel?: boolean;
  bossActive?: boolean;
  bossDown?: boolean;
  bossBodyAt?: { x: number; y: number };
}): { steering: ReturnType<typeof createStarSteering>; attachTrail: ReturnType<typeof vi.fn> } {
  const stars = config.stars ?? [];
  const enemies = config.enemies ?? [];
  const attachTrail = vi.fn(() => ({ stop: vi.fn() }));
  const player = {
    getStars: () => ({ getChildren: () => stars }),
    sprite: { x: 0, y: 0 },
    getTransformState: () => ({ form: null, remainingMs: 0 }),
  } as unknown as PlayerHandle;
  const enemySystem = {
    getGroup: () => ({ getChildren: () => enemies }),
    kindOf: (child: unknown) => (child as FakeEnemy).kind,
  } as unknown as EnemySystem;
  const boss = { isActive: () => config.bossActive ?? false } as unknown as BossHandle;
  const combatHooks = {
    enemies: () => enemySystem,
    fx: () => ({}) as unknown as FxSystem,
    boss: () => boss,
    player: () => player,
    buff: () => ({ id: null, remainingMs: 0 }),
    bossBodies: () => [],
    damageBossAt: vi.fn(),
  };
  const combat: StarCombat = createStarCombat({} as unknown as Phaser.Scene, combatHooks as never);
  const hooks: StarSteeringHooks = {
    player: () => player,
    enemies: () => enemySystem,
    boss: () => boss,
    combat: () => combat,
    fx: () => ({ attachTrail }) as unknown as FxSystem,
    isBossLevel: () => config.bossLevel ?? false,
    isBossDown: () => config.bossDown ?? false,
    nearestBossBody: () =>
      ({
        x: config.bossBodyAt?.x ?? 0,
        y: config.bossBodyAt?.y ?? 0,
      }) as unknown as Phaser.Physics.Arcade.Sprite,
  };
  return { steering: createStarSteering(hooks), attachTrail };
}

describe('魔王準星輔助（§54）候選過濾', () => {
  it('對向且射程內的一般星彈被限速轉向', () => {
    const star = makeStar(100, 300, 520, { flavor: 'jelly' });
    const { steering } = makeHarness({
      stars: [star],
      bossLevel: true,
      bossActive: true,
      bossBodyAt: { x: 100 + BOSS_AIM_ASSIST.rangePx - 10, y: 260 },
    });
    steering.update(16);
    expect(star.body.setVelocity).toHaveBeenCalledTimes(1);
  });

  it('非 boss 關／魔王未活動／魔王已倒：不套用輔助', () => {
    for (const config of [
      { bossLevel: false, bossActive: true, bossDown: false },
      { bossLevel: true, bossActive: false, bossDown: false },
      { bossLevel: true, bossActive: true, bossDown: true },
    ]) {
      const star = makeStar(100, 300, 520, { flavor: 'jelly' });
      const { steering } = makeHarness({
        stars: [star],
        ...config,
        bossBodyAt: { x: 200, y: 300 },
      });
      steering.update(16);
      expect(star.body.setVelocity).not.toHaveBeenCalled();
    }
  });

  it('背向魔王／超出射程的星彈不轉向', () => {
    const away = makeStar(100, 300, -520, { flavor: 'jelly' });
    const far = makeStar(100, 300, 520, { flavor: 'jelly' });
    const { steering: s1 } = makeHarness({
      stars: [away],
      bossLevel: true,
      bossActive: true,
      bossBodyAt: { x: 300, y: 300 },
    });
    s1.update(16);
    expect(away.body.setVelocity).not.toHaveBeenCalled();
    const { steering: s2 } = makeHarness({
      stars: [far],
      bossLevel: true,
      bossActive: true,
      bossBodyAt: { x: 100 + BOSS_AIM_ASSIST.rangePx + 50, y: 300 },
    });
    s2.update(16);
    expect(far.body.setVelocity).not.toHaveBeenCalled();
  });

  it('追電星與迴旋星不疊加輔助（自有彈道）', () => {
    const homing = makeStar(100, 300, 520, { mix: 'voltseeker' });
    const boomerang = makeStar(100, 300, 520, { flavor: 'boomy' });
    const { steering } = makeHarness({
      stars: [homing, boomerang],
      bossLevel: true,
      bossActive: true,
      bossBodyAt: { x: 180, y: 300 },
    });
    steering.update(16);
    // 追電星無小怪候選（enemies 空）不轉向；迴旋星被排除——兩者皆零套用。
    expect(homing.body.setVelocity).not.toHaveBeenCalled();
    expect(boomerang.body.setVelocity).not.toHaveBeenCalled();
  });
});

describe('追電星導引（§46）', () => {
  it('homing mix 朝最近小怪轉向；非 homing 不動', () => {
    expect(getMix('voltseeker').homing).toBe(true);
    const homing = makeStar(100, 300, 520, { mix: 'voltseeker' });
    const plain = makeStar(100, 300, 520, { flavor: 'jelly' });
    const { steering } = makeHarness({
      stars: [homing, plain],
      enemies: [makeEnemy(200, 300)],
    });
    steering.update(16);
    expect(homing.body.setVelocity).toHaveBeenCalledTimes(1);
    expect(plain.body.setVelocity).not.toHaveBeenCalled();
  });

  it('無存活候選時不轉向', () => {
    const homing = makeStar(100, 300, 520, { mix: 'voltseeker' });
    const dead = makeEnemy(200, 300);
    dead.active = false;
    const { steering } = makeHarness({ stars: [homing], enemies: [dead] });
    steering.update(16);
    expect(homing.body.setVelocity).not.toHaveBeenCalled();
  });
});

describe('磁場吸偏（§59 magno field）', () => {
  it('field 相位磁極獸拉偏所有星彈；非 field 相位不拉', () => {
    const star = makeStar(100, 300, 520, { flavor: 'jelly' });
    const { steering } = makeHarness({
      stars: [star],
      enemies: [makeEnemy(200, 300, 'magno', { magnoPhase: 'field' })],
    });
    steering.update(16);
    expect(star.body.setVelocity).toHaveBeenCalledTimes(1);

    const calm = makeStar(100, 300, 520, { flavor: 'jelly' });
    const { steering: s2 } = makeHarness({
      stars: [calm],
      enemies: [makeEnemy(200, 300, 'magno', { magnoPhase: 'walk' })],
    });
    s2.update(16);
    expect(calm.body.setVelocity).not.toHaveBeenCalled();
  });
});

describe('拖尾附掛（syncTrails）', () => {
  it('active 星彈補掛拖尾、失效星彈停噴並清欄位', () => {
    const fresh = makeStar(100, 300, 520);
    const stop = vi.fn();
    const spent = makeStar(200, 300, 0, { fxTrail: { stop } });
    spent.active = false;
    const { steering, attachTrail } = makeHarness({ stars: [fresh, spent] });
    steering.syncTrails();
    expect(attachTrail).toHaveBeenCalledTimes(1);
    expect(fresh.setData).toHaveBeenCalledWith('fxTrail', expect.anything());
    expect(stop).toHaveBeenCalledTimes(1);
    expect(spent.setData).toHaveBeenCalledWith('fxTrail', undefined);
  });
});
