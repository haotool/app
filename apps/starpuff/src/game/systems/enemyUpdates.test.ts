import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { updateEnemyKind, type EnemyUpdateContext } from './enemyUpdates';

// shelly 每幀朝向同步補測（#857 審查應修 5）：walk/spin 態的物理反彈（bounce 折返）
// 會直接改 velocity 而不經復速分支，視覺朝向必須每幀跟隨速度符號，
// 不得只在停住復速時才轉向。

vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Sprite: class {} } },
    TintModes: { FILL: 1, MULTIPLY: 0 },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({ popIn: vi.fn(), spawnTelegraph: vi.fn() }));

function makeShelly(state: 'walk' | 'spin', velocityX: number) {
  const data: Record<string, unknown> = { state, stateMs: 0, eliteMul: 1 };
  const setFlipX = vi.fn();
  const sprite = {
    x: 100,
    y: 100,
    rotation: 0,
    body: { velocity: { x: velocityX }, setVelocityX: vi.fn(), blocked: { down: true } },
    getData: (key: string) => data[key],
    setData: (key: string, value: unknown) => {
      data[key] = value;
    },
    setFlipX,
    setRotation: vi.fn(),
  } as unknown as Phaser.Physics.Arcade.Sprite;
  return { sprite, setFlipX };
}

const ctx = { target: null } as unknown as EnemyUpdateContext;

describe('shelly 視覺朝向每幀同步（walk/spin）', () => {
  it('walk 態：速度為負面向左、為正面向右', () => {
    const left = makeShelly('walk', -50);
    updateEnemyKind(ctx, left.sprite, 'shelly', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeShelly('walk', 50);
    updateEnemyKind(ctx, right.sprite, 'shelly', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });

  it('spin 態：反彈改變速度符號時朝向即時跟隨', () => {
    const left = makeShelly('spin', -120);
    updateEnemyKind(ctx, left.sprite, 'shelly', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeShelly('spin', 120);
    updateEnemyKind(ctx, right.sprite, 'shelly', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });
});

// 面向同步缺口回歸（facing hotfix）：drilly/boomy/mirri/gusty 為方向性素材
// （基準朝右）卻無任何 setFlipX 呼叫，向與素材反向移動時視覺恆背對行進方向。
// 契約＝每幀朝向跟隨水平速度符號（同 shelly 慣例）。

function makeMover(dataInit: Record<string, unknown>, velocityX: number) {
  const data: Record<string, unknown> = { eliteMul: 1, ...dataInit };
  const setFlipX = vi.fn();
  const body = {
    velocity: { x: velocityX, y: 0 },
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
    getData: (key: string) => data[key],
    setData: (key: string, value: unknown) => {
      data[key] = value;
    },
    setFlipX,
    setRotation: vi.fn(),
    setAlpha: vi.fn(),
    setTint: vi.fn(),
    clearTint: vi.fn(),
  } as unknown as Phaser.Physics.Arcade.Sprite;
  return { sprite, setFlipX };
}

const ctxWith = (target: { x: number; y: number } | null) =>
  ({
    target,
    elapsedMs: 0,
    vscale: { setBase: vi.fn(), mod: () => ({ sx: 1, sy: 1 }) },
  }) as unknown as EnemyUpdateContext;

describe('方向性素材怪視覺朝向同步（facing hotfix 回歸）', () => {
  it('drilly burrow：朝玩家潛行時面向跟隨速度符號', () => {
    const left = makeMover({ state: 'burrow', stateMs: 0, baseSX: 1, baseSY: 1 }, 0);
    updateEnemyKind(ctxWith({ x: 0, y: 100 }), left.sprite, 'drilly', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeMover({ state: 'burrow', stateMs: 0, baseSX: 1, baseSY: 1 }, 0);
    updateEnemyKind(ctxWith({ x: 300, y: 100 }), right.sprite, 'drilly', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });

  it('boomy walk：巡邏面向跟隨速度符號', () => {
    const left = makeMover({ state: 'walk', stateMs: 0 }, 0);
    updateEnemyKind(ctxWith({ x: 0, y: 100 }), left.sprite, 'boomy', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeMover({ state: 'walk', stateMs: 0 }, 0);
    updateEnemyKind(ctxWith({ x: 300, y: 100 }), right.sprite, 'boomy', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });

  it('mirri roam：巡邏面向跟隨速度符號', () => {
    const left = makeMover({ state: 'roam', stateMs: 0 }, 0);
    updateEnemyKind(ctxWith({ x: 0, y: 100 }), left.sprite, 'mirri', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeMover({ state: 'roam', stateMs: 0 }, 0);
    updateEnemyKind(ctxWith({ x: 300, y: 100 }), right.sprite, 'mirri', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });

  it('gusty drift：漂移面向跟隨速度符號', () => {
    // drift 速度＝cos(elapsedMs×ω＋phase)×速度：phase=π 得負速（向左）、0 得正速。
    const left = makeMover({ state: 'drift', stateMs: 0, phase: Math.PI, baseY: 100 }, 0);
    updateEnemyKind(ctxWith(null), left.sprite, 'gusty', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeMover({ state: 'drift', stateMs: 0, phase: 0, baseY: 100 }, 0);
    updateEnemyKind(ctxWith(null), right.sprite, 'gusty', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });

  it('gusty dive：俯衝面向跟隨速度符號', () => {
    const left = makeMover({ state: 'dive', stateMs: 0, phase: 0, baseY: 100 }, -200);
    updateEnemyKind(ctxWith(null), left.sprite, 'gusty', 16);
    expect(left.setFlipX).toHaveBeenCalledWith(true);

    const right = makeMover({ state: 'dive', stateMs: 0, phase: 0, baseY: 100 }, 200);
    updateEnemyKind(ctxWith(null), right.sprite, 'gusty', 16);
    expect(right.setFlipX).toHaveBeenCalledWith(false);
  });
});
