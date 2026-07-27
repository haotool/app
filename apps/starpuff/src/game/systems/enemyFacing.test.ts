import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import {
  DIRECTIONAL_ENEMY_KINDS,
  FACING_VELOCITY_EPSILON,
  NON_DIRECTIONAL_ENEMY_KINDS,
  setFacingBySign,
  setFacingFromVelocityX,
  setFacingTowardX,
} from './enemyFacing';
import { updateEnemyKind, type EnemyUpdateContext } from './enemyUpdates';
import { ENEMY_TEXTURE_KEYS } from '../core/assetPlan';
import type { EnemyKind } from '../core/types';

vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Sprite: class {} } },
    TintModes: { FILL: 1, MULTIPLY: 0 },
    Math: {
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
      },
    },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({ popIn: vi.fn(), spawnTelegraph: vi.fn() }));

function makeFacingSprite(dataInit: Record<string, unknown>) {
  const data = new Map<string, unknown>(Object.entries({ eliteMul: 1, ...dataInit }));
  const flips: boolean[] = [];
  const body = {
    velocity: { x: 0, y: 0 },
    blocked: { down: true },
    setVelocityX: (vx: number) => {
      body.velocity.x = vx;
    },
    setVelocity: (vx: number, vy: number) => {
      body.velocity.x = vx;
      body.velocity.y = vy;
    },
    setVelocityY: (vy: number) => {
      body.velocity.y = vy;
    },
  };
  const sprite = {
    x: 100,
    y: 100,
    rotation: 0,
    body,
    flips,
    getData: (key: string) => data.get(key),
    setData(key: string, value: unknown) {
      data.set(key, value);
      return sprite;
    },
    setFlipX(value: boolean) {
      flips.push(value);
      return sprite;
    },
    setRotation: () => sprite,
    setTint: () => sprite,
    setTintMode: () => sprite,
    clearTint: () => sprite,
    setAlpha: () => sprite,
  };
  return sprite;
}

const facingCtx = (target: { x: number; y: number } | null) =>
  ({
    target,
    elapsedMs: 0,
    vscale: { setBase: vi.fn(), mod: () => ({ sx: 1, sy: 1 }) },
  }) as unknown as EnemyUpdateContext;

describe('facing helper（面向 SSOT）', () => {
  it('setFacingBySign：負號朝左、正號朝右、零維持不變', () => {
    const sprite = makeFacingSprite({});
    setFacingBySign(sprite as unknown as Phaser.GameObjects.Sprite, -1);
    setFacingBySign(sprite as unknown as Phaser.GameObjects.Sprite, 1);
    setFacingBySign(sprite as unknown as Phaser.GameObjects.Sprite, 0);
    expect(sprite.flips).toEqual([true, false]);
  });

  it('setFacingFromVelocityX：死區內維持最後朝向（近零速不抖動）', () => {
    const sprite = makeFacingSprite({});
    setFacingFromVelocityX(sprite as unknown as Phaser.GameObjects.Sprite, -50);
    expect(sprite.flips).toEqual([true]);
    // bounce 折返／正弦過零瞬間的近零速：不得翻面。
    setFacingFromVelocityX(sprite as unknown as Phaser.GameObjects.Sprite, 0);
    setFacingFromVelocityX(sprite as unknown as Phaser.GameObjects.Sprite, FACING_VELOCITY_EPSILON);
    setFacingFromVelocityX(
      sprite as unknown as Phaser.GameObjects.Sprite,
      -FACING_VELOCITY_EPSILON,
    );
    expect(sprite.flips).toEqual([true]);
    // 脫離死區後照常跟隨。
    setFacingFromVelocityX(sprite as unknown as Phaser.GameObjects.Sprite, 50);
    expect(sprite.flips).toEqual([true, false]);
  });

  it('setFacingTowardX：目標在左朝左、在右朝右、重疊維持不變', () => {
    const sprite = makeFacingSprite({});
    setFacingTowardX(sprite as unknown as Phaser.GameObjects.Sprite, 0);
    setFacingTowardX(sprite as unknown as Phaser.GameObjects.Sprite, 500);
    setFacingTowardX(sprite as unknown as Phaser.GameObjects.Sprite, sprite.x);
    expect(sprite.flips).toEqual([true, false]);
  });
});

describe('品種分類完整性守門', () => {
  it('方向性∪非方向性 == 全部 EnemyKind（新增品種必須顯式歸類）', () => {
    const directional = new Set<EnemyKind>(DIRECTIONAL_ENEMY_KINDS);
    const nonDirectional = new Set<EnemyKind>(NON_DIRECTIONAL_ENEMY_KINDS);
    const all = Object.keys(ENEMY_TEXTURE_KEYS) as EnemyKind[];
    // 無重複。
    expect(directional.size).toBe(DIRECTIONAL_ENEMY_KINDS.length);
    expect(nonDirectional.size).toBe(NON_DIRECTIONAL_ENEMY_KINDS.length);
    // 無交集。
    for (const kind of directional) expect(nonDirectional.has(kind)).toBe(false);
    // 聯集全覆蓋（雙向）。
    const union = new Set<EnemyKind>([...directional, ...nonDirectional]);
    expect([...union].sort()).toEqual([...all].sort());
  });
});

// 表驅動 facing 守門：每個方向性品種在「向左移動（或目標在左）」的一幀 update 後，
// 面向必須為朝左（flipX=true）；向右對稱斷言。新增方向性品種未接 facing helper
// 即在此轉紅。dir 驅動方式依品種 AI 分兩型：target 型（走速方向由目標側決定）、
// phase 型（速度由正弦相位決定，π 得負速、0 得正速）。
interface FacingDriver {
  data: (dir: -1 | 1) => Record<string, unknown>;
  target: (dir: -1 | 1) => { x: number; y: number } | null;
}

const targetDriven = (data: Record<string, unknown>): FacingDriver => ({
  data: () => ({ ...data }),
  target: (dir) => ({ x: dir === -1 ? 0 : 500, y: 100 }),
});

const phaseDriven = (data: Record<string, unknown>): FacingDriver => ({
  data: (dir) => ({ ...data, phase: dir === -1 ? Math.PI : 0 }),
  target: () => null,
});

const FACING_DRIVERS: Record<(typeof DIRECTIONAL_ENEMY_KINDS)[number], FacingDriver> = {
  shelly: targetDriven({ state: 'walk', stateMs: 0 }),
  drilly: targetDriven({ state: 'burrow', stateMs: 0, baseSX: 1, baseSY: 1 }),
  gusty: phaseDriven({ state: 'drift', stateMs: 0, baseY: 100 }),
  boomy: targetDriven({ state: 'walk', stateMs: 0 }),
  mirri: targetDriven({ state: 'roam', stateMs: 0 }),
  cometa: phaseDriven({ state: 'glide', stateMs: 0, baseY: 100 }),
  cargo: targetDriven({ cycleMs: 0 }),
  foamy: targetDriven({ state: 'idle', stateMs: 0 }),
  frosty: targetDriven({ stateMs: 0 }),
  manta: phaseDriven({ state: 'cruise', stateMs: 0 }),
};

describe('方向性品種面向同步（表驅動守門）', () => {
  it.each(DIRECTIONAL_ENEMY_KINDS.map((kind) => [kind] as const))(
    '%s：向左時面向左、向右時面向右',
    (kind) => {
      const driver = FACING_DRIVERS[kind];

      const left = makeFacingSprite(driver.data(-1));
      updateEnemyKind(
        facingCtx(driver.target(-1)),
        left as unknown as Phaser.Physics.Arcade.Sprite,
        kind,
        16,
      );
      expect(left.flips[left.flips.length - 1]).toBe(true);

      const right = makeFacingSprite(driver.data(1));
      updateEnemyKind(
        facingCtx(driver.target(1)),
        right as unknown as Phaser.Physics.Arcade.Sprite,
        kind,
        16,
      );
      expect(right.flips[right.flips.length - 1]).toBe(false);
    },
  );
});

// 前搖／瞄準態面向：朝攻擊目標而非速度（速度為零仍須正確面向）。
describe('前搖與瞄準態面向朝目標', () => {
  const windupCases: readonly [EnemyKind, Record<string, unknown>][] = [
    ['drilly', { state: 'windup', stateMs: 0, baseSX: 1, baseSY: 1 }],
    ['boomy', { state: 'windup', stateMs: 0 }],
    ['gusty', { state: 'windup', stateMs: 0, baseY: 100 }],
    ['manta', { state: 'aim', stateMs: 0 }],
  ];

  it.each(windupCases)('%s 前搖：面向目標側', (kind, data) => {
    const left = makeFacingSprite({ ...data });
    updateEnemyKind(
      facingCtx({ x: 0, y: 100 }),
      left as unknown as Phaser.Physics.Arcade.Sprite,
      kind,
      16,
    );
    expect(left.flips[left.flips.length - 1]).toBe(true);

    const right = makeFacingSprite({ ...data });
    updateEnemyKind(
      facingCtx({ x: 500, y: 100 }),
      right as unknown as Phaser.Physics.Arcade.Sprite,
      kind,
      16,
    );
    expect(right.flips[right.flips.length - 1]).toBe(false);
  });

  it('cometa lock：面向鎖定點快照（非當前玩家位置）', () => {
    const sprite = makeFacingSprite({ state: 'lock', stateMs: 0, baseY: 100, aimX: 0 });
    updateEnemyKind(
      facingCtx({ x: 500, y: 100 }),
      sprite as unknown as Phaser.Physics.Arcade.Sprite,
      'cometa',
      16,
    );
    expect(sprite.flips[sprite.flips.length - 1]).toBe(true);
  });
});
