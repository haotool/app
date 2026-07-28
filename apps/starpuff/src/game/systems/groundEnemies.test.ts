import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import {
  BOOMY_FSM,
  BUBBLA_FSM,
  DRILLY_FSM,
  SHELLY_FSM,
  SPLATTA_FSM,
  SPORA_FSM,
  bubblaLeapOffsetY,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import type { EnemyUpdateContext } from './enemyUpdates';
import {
  SHELLY_WALK_SPEED,
  updateBoomy,
  updateBubbla,
  updateChompy,
  updateDrilly,
  updateShelly,
  updateSplatta,
  updateSpora,
} from './groundEnemies';

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

// 地面走動／定點據點系 characterization（W3 前置分檔）：以真 FSM 時序驅動，鎖住
// 復速方向、半入地壓扁、hazards 生成原點、telegraph 定身——搬移自 enemyUpdates.ts，
// 行為零改變。

function makeGroundSprite(dataInit: Record<string, unknown>) {
  const data = new Map<string, unknown>(Object.entries({ eliteMul: 1, phase: 0, ...dataInit }));
  const body = {
    velocity: { x: 0, y: 0 },
    blocked: { down: true },
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
    setTintMode() {
      return sprite;
    },
    clearTint() {
      return sprite;
    },
    setAlpha(alpha: number) {
      sprite.alpha = alpha;
      return sprite;
    },
  };
  return sprite;
}

function makeGroundCtx(target: { x: number; y: number } | null, elapsedMs = 0) {
  const circles: { x: number; y: number; radius: number }[] = [];
  const images: { destroyed: boolean }[] = [];
  const ringStub = {
    setStrokeStyle: () => ringStub,
    setDepth: () => ringStub,
    setPosition: () => ringStub,
    setScale: () => ringStub,
    destroy: () => undefined,
  };
  const fxProxy = { sx: 1, sy: 1 };
  const modProxy = { sx: 1, sy: 1 };
  const raw = {
    target,
    elapsedMs,
    scene: {
      add: {
        circle: (x: number, y: number, radius: number) => {
          circles.push({ x, y, radius });
          return ringStub;
        },
        image: () => {
          const image = {
            destroyed: false,
            setDisplaySize: () => image,
            setDepth: () => image,
            setPosition: () => image,
            destroy() {
              image.destroyed = true;
            },
          };
          images.push(image);
          return image;
        },
      },
      tweens: { add: vi.fn() },
    },
    vscale: {
      setBase: vi.fn(),
      resetFx: vi.fn(),
      fx: () => fxProxy,
      mod: () => modProxy,
    },
    spawnBite: vi.fn(),
    spawnSporeCloud: vi.fn(),
    spawnBoomerang: vi.fn(),
    spawnSugarBlob: vi.fn(),
  };
  return { ctx: raw as unknown as EnemyUpdateContext, circles, images, modProxy, raw };
}

const asSprite = (fake: unknown) => fake as Phaser.Physics.Arcade.Sprite;

describe('殼殼 shelly 三態呈現', () => {
  it('walk 停速復速：朝目標側以巡邏走速前進', () => {
    const fake = makeGroundSprite({ state: 'walk', stateMs: 0 });
    updateShelly(makeGroundCtx({ x: 0, y: 100 }).ctx, asSprite(fake), 16);
    expect(fake.body.velocity.x).toBe(-SHELLY_WALK_SPEED);
  });

  it('entered stun：停速＋頭頂眩星建立（#811 暈眩雙訊號）', () => {
    const fake = makeGroundSprite({ state: 'spin', stateMs: SHELLY_FSM.spinMs - 1 });
    fake.body.velocity.x = 320;
    const { ctx, images } = makeGroundCtx(null);
    updateShelly(ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('stun');
    expect(fake.body.velocity.x).toBe(0);
    expect(images).toHaveLength(1);
    expect(fake.getData('warnRing')).toBe(images[0]);
  });

  it('entered walk：眩星回收＋縮殼復原走物理基準（§77 解耦）', () => {
    const star = { destroyed: false, destroy: vi.fn() };
    const fake = makeGroundSprite({
      state: 'stun',
      stateMs: SHELLY_FSM.stunMs - 1,
      warnRing: star,
      baseSX: 1.2,
      baseSY: 1.1,
    });
    const { ctx, raw } = makeGroundCtx(null);
    updateShelly(ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('walk');
    expect(star.destroy).toHaveBeenCalledTimes(1);
    expect(raw.vscale.setBase).toHaveBeenCalledWith(fake, 1.2, 1.1);
    expect(fake.rotation).toBe(0);
  });
});

describe('鑽地者 drilly 半入地時序', () => {
  it('burrow：壓扁貼地（物理基準同步）＋朝目標潛行', () => {
    const fake = makeGroundSprite({ state: 'burrow', stateMs: 0, baseSX: 1, baseSY: 1 });
    const { ctx, raw } = makeGroundCtx({ x: 0, y: 100 });
    updateDrilly(ctx, asSprite(fake), 16);
    expect(fake.alpha).toBeCloseTo(0.85);
    expect(fake.body.velocity.x).toBeLessThan(0);
    const calls = raw.vscale.setBase.mock.calls;
    const [, squashedSX, squashedSY] = calls[calls.length - 1] ?? [];
    expect(squashedSX).toBeLessThan(1);
    expect(squashedSY).toBeLessThan(1);
  });

  it('entered surfaced：破土音效＋造型復原＋向上躍出', () => {
    const fake = makeGroundSprite({
      state: 'windup',
      stateMs: DRILLY_FSM.windupMs - 1,
      baseSX: 1,
      baseSY: 1,
    });
    const { ctx, raw } = makeGroundCtx({ x: 0, y: 100 });
    updateDrilly(ctx, asSprite(fake), 16);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('pop');
    expect(fake.getData('state')).toBe('surfaced');
    expect(fake.alpha).toBe(1);
    expect(fake.body.velocity.y).toBeLessThan(0);
    expect(raw.vscale.setBase).toHaveBeenCalledWith(fake, 1, 1);
  });
});

describe('孢子菇 spora 定點週期', () => {
  it('紮根契約：外力殘速每幀歸零（#841 全相位一致）', () => {
    const fake = makeGroundSprite({ cycleMs: 0 });
    fake.body.velocity.x = 33;
    fake.body.velocity.y = -7;
    updateSpora(makeGroundCtx(null).ctx, asSprite(fake), 16);
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.body.velocity.y).toBe(0);
  });

  it('windup：預警圈在噴發位置（cloudOffsetY）先行擴張', () => {
    const fake = makeGroundSprite({ cycleMs: SPORA_FSM.intervalMs - SPORA_FSM.windupMs });
    const { ctx, circles } = makeGroundCtx(null);
    updateSpora(ctx, asSprite(fake), 16);
    expect(circles).toHaveLength(1);
    expect(circles[0]?.y).toBe(100 + SPORA_FSM.cloudOffsetY);
    expect(circles[0]?.radius).toBe(SPORA_FSM.cloudRadiusPx);
  });

  it('burst：向上噴孢子雲走 hazards 管線（生成點對齊 FSM SSOT）', () => {
    const fake = makeGroundSprite({ cycleMs: SPORA_FSM.intervalMs - 1 });
    const { ctx, raw } = makeGroundCtx(null);
    updateSpora(ctx, asSprite(fake), 16);
    expect(raw.spawnSporeCloud).toHaveBeenCalledWith(100, 100 + SPORA_FSM.cloudOffsetY);
  });

  it('idle 呼吸：mod 逐幀直寫（物理箱不動）', () => {
    const fake = makeGroundSprite({ cycleMs: 0 });
    const { ctx, modProxy } = makeGroundCtx(null, 500);
    updateSpora(ctx, asSprite(fake), 16);
    expect(modProxy.sx).toBeGreaterThan(1);
    expect(modProxy.sy).toBeLessThan(1);
  });
});

describe('迴力殼 boomy 投擲時序', () => {
  it('throw：投擲原點（前方 20、上方 6）與方向對齊目標側', () => {
    const fake = makeGroundSprite({ state: 'windup', stateMs: BOOMY_FSM.windupMs - 1 });
    const { ctx, raw } = makeGroundCtx({ x: 0, y: 100 });
    updateBoomy(ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('throw');
    expect(raw.spawnBoomerang).toHaveBeenCalledWith(80, 94, -1);
  });
});

describe('焦糖泡 bubbla 潛伏躍出', () => {
  it('submerged：半潛壓扁＋定身（不可吸不可傷態視覺）', () => {
    const fake = makeGroundSprite({
      state: 'submerged',
      stateMs: 0,
      baseSX: 1,
      baseSY: 1,
      baseY: 100,
    });
    const { ctx, raw } = makeGroundCtx(null);
    updateBubbla(ctx, asSprite(fake), 16);
    expect(fake.alpha).toBeCloseTo(0.85);
    expect(fake.body.velocity.x).toBe(0);
    const calls = raw.vscale.setBase.mock.calls;
    const [, sunkSX, sunkSY] = calls[calls.length - 1] ?? [];
    expect(sunkSX).toBeLessThan(1);
    expect(sunkSY).toBeLessThan(1);
  });

  it('entered leap：躍出音效＋造型復原；leap 高度由 bubblaLeapOffsetY 導出速度逼近', () => {
    const enterLeap = makeGroundSprite({
      state: 'ripple',
      stateMs: BUBBLA_FSM.rippleMs - 1,
      baseSX: 1,
      baseSY: 1,
      baseY: 100,
    });
    const { ctx, raw } = makeGroundCtx(null);
    updateBubbla(ctx, asSprite(enterLeap), 16);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('pop', 0.85);
    expect(enterLeap.alpha).toBe(1);
    expect(raw.vscale.setBase).toHaveBeenCalledWith(enterLeap, 1, 1);

    const midLeap = makeGroundSprite({
      state: 'leap',
      stateMs: 100,
      baseSX: 1,
      baseSY: 1,
      baseY: 100,
    });
    updateBubbla(makeGroundCtx(null).ctx, asSprite(midLeap), 16);
    const expectedVy = (bubblaLeapOffsetY(116) * 1000) / 16;
    expect(midLeap.body.velocity.y).toBeCloseTo(expectedVy);
  });
});

describe('熔糖投手 splatta 拋射時序', () => {
  it('entered aim：舉勺定身＋著色 telegraph', () => {
    const fake = makeGroundSprite({ state: 'patrol', stateMs: SPLATTA_FSM.patrolMs - 1 });
    fake.body.velocity.x = 55;
    updateSplatta(makeGroundCtx(null).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('aim');
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.tints.length).toBeGreaterThan(0);
  });

  it('lob：拋物糖球生成原點（前方 18、上方 14）與方向對齊目標側', () => {
    const fake = makeGroundSprite({ state: 'aim', stateMs: SPLATTA_FSM.aimMs - 1 });
    const { ctx, raw } = makeGroundCtx({ x: 0, y: 100 });
    updateSplatta(ctx, asSprite(fake), 16);
    expect(raw.spawnSugarBlob).toHaveBeenCalledWith(82, 86, -1);
  });
});

describe('咬咬花 chompy 咬合時序', () => {
  it('idle 進 120px 觸發域：轉 windup＋張嘴蓄力 tween（fx 代理，物理箱不動）', () => {
    const fake = makeGroundSprite({ state: 'idle', stateMs: 0 });
    const { ctx, raw } = makeGroundCtx({ x: 150, y: 100 });
    updateChompy(ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('windup');
    expect(raw.vscale.resetFx).toHaveBeenCalledTimes(1);
    expect(raw.scene.tweens.add).toHaveBeenCalledTimes(1);
  });

  it('windup 期滿：咬合音效＋spawnBite 生成咬合判定', () => {
    // CHOMPY_WINDUP_MS=400：前一幀 384 ＋ delta 16 期滿轉 bite。
    const fake = makeGroundSprite({ state: 'windup', stateMs: 384 });
    const { ctx, raw } = makeGroundCtx({ x: 150, y: 100 });
    updateChompy(ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('bite');
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('chomp');
    expect(raw.spawnBite).toHaveBeenCalledWith(fake);
  });
});
