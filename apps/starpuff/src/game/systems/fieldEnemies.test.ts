import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { MAGNO_FSM, MIRRI_FSM } from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import type { EnemyUpdateContext } from './enemyUpdates';
import { updateMagno, updateMirri } from './fieldEnemies';

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

// 場域機制系 characterization（W3 前置分檔）：以真 FSM 時序驅動，鎖住磁極獸
// 磁場定身／預警圈、鏡面蟲鏡面定身與冷卻著色差異——搬移自 enemyUpdates.ts，行為零改變。

interface FakeArc {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  setStrokeStyle(width: number, color: number, alpha: number): FakeArc;
  setDepth(depth: number): FakeArc;
  setPosition(x: number, y: number): FakeArc;
  setScale(scale: number): FakeArc;
  setAlpha(alpha: number): FakeArc;
  destroy(): void;
}

function makeFieldSprite(dataInit: Record<string, unknown>) {
  const data = new Map<string, unknown>(Object.entries({ eliteMul: 1, ...dataInit }));
  const body = {
    velocity: { x: 0, y: 0 },
    blocked: { down: true },
    setVelocityX(vx: number) {
      body.velocity.x = vx;
    },
  };
  const sprite = {
    x: 100,
    y: 100,
    rotation: 0,
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
  };
  return sprite;
}

function makeFieldCtx(target: { x: number; y: number } | null) {
  const circles: FakeArc[] = [];
  const ctx = {
    target,
    elapsedMs: 0,
    scene: {
      add: {
        circle: (x: number, y: number) => {
          const arc: FakeArc = {
            x,
            y,
            scale: 1,
            alpha: 1,
            setStrokeStyle: () => arc,
            setDepth: () => arc,
            setPosition(nx, ny) {
              arc.x = nx;
              arc.y = ny;
              return arc;
            },
            setScale(scale) {
              arc.scale = scale;
              return arc;
            },
            setAlpha(alpha) {
              arc.alpha = alpha;
              return arc;
            },
            destroy: () => undefined,
          };
          circles.push(arc);
          return arc;
        },
      },
    },
  };
  return { ctx: ctx as unknown as EnemyUpdateContext, circles };
}

const asSprite = (fake: unknown) => fake as Phaser.Physics.Arcade.Sprite;

describe('磁極獸 magno 週期呈現', () => {
  it('idle 緩行：著地且停速時朝目標側復速', () => {
    const fake = makeFieldSprite({ cycleMs: 0 });
    updateMagno(makeFieldCtx({ x: 0, y: 100 }).ctx, asSprite(fake), 16);
    expect(fake.body.velocity.x).toBeLessThan(0);
    expect(fake.getData('magnoPhase')).toBe('idle');
  });

  it('windup：定身＋預警圈以磁場半徑建立（FSM SSOT）', () => {
    const fake = makeFieldSprite({ cycleMs: MAGNO_FSM.idleMs });
    const { ctx, circles } = makeFieldCtx({ x: 0, y: 100 });
    updateMagno(ctx, asSprite(fake), 16);
    expect(fake.getData('magnoPhase')).toBe('windup');
    expect(fake.body.velocity.x).toBe(0);
    expect(circles).toHaveLength(1);
  });

  it('field：定身著色、磁場圈滿張脈動、magnoPhase 供受擊決策讀取', () => {
    const fake = makeFieldSprite({ cycleMs: MAGNO_FSM.idleMs + MAGNO_FSM.windupMs });
    const { ctx, circles } = makeFieldCtx({ x: 0, y: 100 });
    updateMagno(ctx, asSprite(fake), 16);
    expect(fake.getData('magnoPhase')).toBe('field');
    expect(fake.body.velocity.x).toBe(0);
    expect(fake.tints.length).toBeGreaterThan(0);
    expect(circles).toHaveLength(1);
    expect(circles[0]?.scale).toBe(1);
    expect(circles[0]?.alpha).toBeGreaterThan(0);
  });
});

describe('鏡面蟲 mirri 三態呈現', () => {
  it('roam 停速復速：朝目標側走速（左目標得負速）', () => {
    const fake = makeFieldSprite({ state: 'roam', stateMs: 0 });
    updateMirri(makeFieldCtx({ x: 0, y: 100 }).ctx, asSprite(fake), 16);
    expect(fake.body.velocity.x).toBeLessThan(0);
  });

  it('entered mirror：金屬聲＋定身；鏡面態亮銀與冷卻態著色必須可區分', () => {
    const enterMirror = makeFieldSprite({ state: 'roam', stateMs: MIRRI_FSM.roamMs - 1 });
    updateMirri(makeFieldCtx(null).ctx, asSprite(enterMirror), 16);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('metal', 1.3);
    expect(enterMirror.getData('state')).toBe('mirror');
    expect(enterMirror.body.velocity.x).toBe(0);
    const mirrorTint = enterMirror.tints[enterMirror.tints.length - 1];

    const cooling = makeFieldSprite({ state: 'cool', stateMs: 0 });
    updateMirri(makeFieldCtx(null).ctx, asSprite(cooling), 16);
    const coolTint = cooling.tints[cooling.tints.length - 1];
    // 明確可打窗訊號：冷卻著色不得與鏡面態相同（禁硬編色碼，鎖差異契約）。
    expect(mirrorTint).toBeDefined();
    expect(coolTint).toBeDefined();
    expect(coolTint).not.toBe(mirrorTint);
  });

  it('cool 期滿回 roam 當幀復原 tint（entered roam 清著色）', () => {
    const fake = makeFieldSprite({ state: 'cool', stateMs: MIRRI_FSM.coolMs - 1 });
    updateMirri(makeFieldCtx(null).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('roam');
    expect(fake.clearTintCalls).toBeGreaterThan(0);
  });
});
