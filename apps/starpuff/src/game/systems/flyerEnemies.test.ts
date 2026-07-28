import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { COMETA_FSM, GLOWY_FSM, GUSTY_FSM, TWINKLA_FSM, ZAPPY_FSM } from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import type { EnemyUpdateContext } from './enemyUpdates';
import { updateCometa, updateGlowy, updateGusty, updateTwinkla, updateZappy } from './flyerEnemies';

vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Sprite: class {} } },
    Math: {
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
      },
    },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

// 飛行漂浮系 characterization（W3 前置分檔）：以真 FSM 時序驅動，鎖住 telegraph
// 定身、俯衝鎖定快照、hazards 生成節拍——搬移自 enemyUpdates.ts，行為零改變。

function makeFlyerSprite(dataInit: Record<string, unknown>) {
  const data = new Map<string, unknown>(Object.entries({ eliteMul: 1, phase: 0, ...dataInit }));
  const body = {
    velocity: { x: 0, y: 0 },
    blocked: { down: false },
    setVelocity(vx: number, vy: number) {
      body.velocity.x = vx;
      body.velocity.y = vy;
    },
    setVelocityX(vx: number) {
      body.velocity.x = vx;
    },
    setVelocityY(vy: number) {
      body.velocity.y = vy;
    },
  };
  const sprite = {
    x: 100,
    y: 100,
    rotation: 0,
    alpha: 1,
    body,
    tints: [] as number[],
    clearTintCalls: 0,
    getData: (key: string) => data.get(key),
    setData(key: string, value: unknown) {
      data.set(key, value);
      return sprite;
    },
    setFlipX() {
      return sprite;
    },
    setRotation(value: number) {
      sprite.rotation = value;
      return sprite;
    },
    setTint(tint: number) {
      sprite.tints.push(tint);
      return sprite;
    },
    clearTint() {
      sprite.clearTintCalls += 1;
      return sprite;
    },
    setAlpha(alpha: number) {
      sprite.alpha = alpha;
      return sprite;
    },
  };
  return sprite;
}

function makeFlyerCtx(target: { x: number; y: number } | null) {
  const circles: { x: number; y: number; radius: number }[] = [];
  const arcStub = {
    setStrokeStyle: () => arcStub,
    setDepth: () => arcStub,
    setPosition: () => arcStub,
    setScale: () => arcStub,
    destroy: () => undefined,
  };
  const ctx = {
    target,
    elapsedMs: 0,
    scene: {
      add: {
        circle: (x: number, y: number, radius: number) => {
          circles.push({ x, y, radius });
          return arcStub;
        },
      },
    },
    pulseRing: vi.fn(),
    spawnCometTail: vi.fn(),
  };
  return { ctx: ctx as unknown as EnemyUpdateContext, circles, raw: ctx };
}

const asSprite = (fake: unknown) => fake as Phaser.Physics.Arcade.Sprite;

describe('提燈者 glowy 週期呈現', () => {
  it('windup：定身＋預警圈以脈衝半徑建立（FSM SSOT）', () => {
    const fake = makeFlyerSprite({ cycleMs: GLOWY_FSM.intervalMs - GLOWY_FSM.windupMs });
    const { ctx, circles } = makeFlyerCtx({ x: 0, y: 100 });
    updateGlowy(ctx, asSprite(fake), 16);
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.body.velocity.y).toBe(0);
    expect(circles).toHaveLength(1);
    expect(circles[0]?.radius).toBe(GLOWY_FSM.pulseRadiusPx);
  });

  it('週期滿釋放脈衝：pulseRing 走 hazards 管線且半徑對齊 FSM SSOT', () => {
    const fake = makeFlyerSprite({ cycleMs: GLOWY_FSM.intervalMs - 1 });
    const { ctx, raw } = makeFlyerCtx(null);
    updateGlowy(ctx, asSprite(fake), 16);
    expect(raw.pulseRing).toHaveBeenCalledWith(
      100,
      100,
      GLOWY_FSM.pulseRadiusPx,
      expect.any(Number),
    );
  });
});

describe('風飄鳥 gusty 俯衝時序', () => {
  it('drift 期玩家進斜下觸發域：轉 windup 並懸停定身', () => {
    const fake = makeFlyerSprite({ state: 'drift', stateMs: 0, baseY: 100 });
    updateGusty(makeFlyerCtx({ x: 140, y: 160 }).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('windup');
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.body.velocity.y).toBe(0);
  });

  it('entered dive：鳴翅音效＋朝前搖結束當下目標以俯衝速度出擊（FSM SSOT）', () => {
    const fake = makeFlyerSprite({ state: 'windup', stateMs: GUSTY_FSM.windupMs - 1, baseY: 100 });
    updateGusty(makeFlyerCtx({ x: 140, y: 160 }).ctx, asSprite(fake), 16);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('flap');
    expect(fake.getData('state')).toBe('dive');
    const speed = Math.hypot(fake.body.velocity.x, fake.body.velocity.y);
    expect(speed).toBeCloseTo(GUSTY_FSM.diveSpeed);
    expect(fake.body.velocity.x).toBeGreaterThan(0);
    expect(fake.body.velocity.y).toBeGreaterThan(0);
  });
});

describe('星屑幽靈 twinkla 三態呈現', () => {
  it('phased：半透明穿身態、以虛化漂速追蹤目標（FSM SSOT）', () => {
    const fake = makeFlyerSprite({ state: 'phased', stateMs: 0 });
    updateTwinkla(makeFlyerCtx({ x: 0, y: 100 }).ctx, asSprite(fake), 16);
    expect(fake.alpha).toBeLessThan(1);
    expect(fake.body.velocity.x).toBeCloseTo(-TWINKLA_FSM.driftSpeed);
  });

  it('entered solid：現身音效＋透明度復原（可吸可傷窗開啟訊號）', () => {
    const fake = makeFlyerSprite({ state: 'shimmer', stateMs: TWINKLA_FSM.shimmerMs - 1 });
    updateTwinkla(makeFlyerCtx(null).ctx, asSprite(fake), 16);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('reveal', 0.6);
    expect(fake.getData('state')).toBe('solid');
    expect(fake.alpha).toBe(1);
  });
});

describe('彗尾飛魚 cometa 俯衝時序', () => {
  it('entered lock：定身＋鎖定當下玩家位置快照（之後不再修正）', () => {
    const fake = makeFlyerSprite({ state: 'glide', stateMs: 0, baseY: 100 });
    updateCometa(makeFlyerCtx({ x: 150, y: 180 }).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('lock');
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.getData('aimX')).toBe(150);
    expect(fake.getData('aimY')).toBe(180);
  });

  it('dash：沿路每 tailIntervalMs 生成一段彗尾（hazards 管線節拍）', () => {
    const fake = makeFlyerSprite({
      state: 'dash',
      stateMs: 0,
      tailMs: 0,
      baseY: 100,
      aimX: 200,
      aimY: 200,
    });
    fake.body.velocity.x = 200;
    fake.body.velocity.y = 200;
    const { ctx, raw } = makeFlyerCtx(null);
    const frames = Math.ceil(COMETA_FSM.tailIntervalMs / 16);
    for (let i = 0; i < frames; i += 1) updateCometa(ctx, asSprite(fake), 16);
    expect(raw.spawnCometTail).toHaveBeenCalledTimes(1);
    expect(raw.spawnCometTail).toHaveBeenCalledWith(100, 100);
  });
});

describe('雷雷 zappy 放電週期呈現', () => {
  it('discharge：清著色＋pulseRing 走 hazards 管線（半徑 70 放電環契約）', () => {
    const fake = makeFlyerSprite({ cycleMs: ZAPPY_FSM.intervalMs - 1 });
    const { ctx, raw } = makeFlyerCtx(null);
    updateZappy(ctx, asSprite(fake), 16);
    expect(fake.clearTintCalls).toBe(1);
    expect(raw.pulseRing).toHaveBeenCalledWith(100, 100, 70, expect.any(Number));
  });

  it('windup：定身＋閃爍預警；chase：朝目標側追蹤', () => {
    const windup = makeFlyerSprite({
      cycleMs: ZAPPY_FSM.intervalMs - ZAPPY_FSM.windupMs,
    });
    updateZappy(makeFlyerCtx({ x: 0, y: 100 }).ctx, asSprite(windup), 16);
    expect(windup.body.velocity.x).toBe(0);
    expect(windup.tints.length).toBeGreaterThan(0);

    const chase = makeFlyerSprite({ cycleMs: 0 });
    updateZappy(makeFlyerCtx({ x: 0, y: 100 }).ctx, asSprite(chase), 16);
    expect(chase.body.velocity.x).toBeLessThan(0);
  });
});
