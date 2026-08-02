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

describe('魔王關補給個體安全責任', () => {
  it('safeSupply 不啟動 zappy 放電或 boomy 迴旋刃，仍向玩家緩慢靠近', () => {
    const pulseRing = vi.fn();
    const spawnBoomerang = vi.fn();
    const makeSprite = (kind: 'zappy' | 'boomy') => {
      const data: Record<string, unknown> = {
        state: 'idle',
        safeSupply: true,
        phase: 0,
        eliteMul: 1,
      };
      const velocity = { x: 0, y: 0 };
      const body = {
        velocity,
        setVelocityX(vx: number) {
          velocity.x = vx;
        },
        setVelocityY(vy: number) {
          velocity.y = vy;
        },
      };
      const sprite = {
        x: 200,
        y: 100,
        body,
        getData: (key: string) => data[key],
        setData(key: string, value: unknown) {
          data[key] = value;
          return sprite;
        },
      } as unknown as Phaser.Physics.Arcade.Sprite;
      updateEnemyKind(
        {
          target: { x: 100, y: 100 },
          safeSupply: true,
          pulseRing,
          spawnBoomerang,
        } as unknown as EnemyUpdateContext,
        sprite,
        kind,
        16,
      );
      return { data, velocity };
    };

    expect(makeSprite('zappy').velocity.x).toBe(-45);
    expect(makeSprite('boomy').velocity.x).toBe(-35);
    expect(pulseRing).not.toHaveBeenCalled();
    expect(spawnBoomerang).not.toHaveBeenCalled();
  });
});

// 方向性品種面向同步的表驅動守門（含 drilly/boomy/mirri/gusty/cargo/foamy 等）
// 已上收至 enemyFacing.test.ts，遍歷 DIRECTIONAL_ENEMY_KINDS 全表。
