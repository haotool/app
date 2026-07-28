import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { BEARMARKET_FSM, BULLRUN_FSM, MAGNO_FSM, MIRRI_FSM } from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import type { EnemyUpdateContext } from './enemyUpdates';
import { updateBearmarket, updateBullrun, updateMagno, updateMirri } from './fieldEnemies';

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
    blocked: { down: true, left: false, right: false },
    setVelocityX(vx: number) {
      body.velocity.x = vx;
    },
    setVelocity(vx: number, vy: number) {
      body.velocity.x = vx;
      body.velocity.y = vy;
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
  const spawnMarketWave = vi.fn();
  const spawnCrashArrow = vi.fn();
  const shake = vi.fn();
  const mod = { sx: 1, sy: 1 };
  const ctx = {
    target,
    elapsedMs: 0,
    spawnMarketWave,
    spawnCrashArrow,
    vscale: { mod: () => mod },
    scene: {
      cameras: { main: { shake, flash: vi.fn() } },
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
  return {
    ctx: ctx as unknown as EnemyUpdateContext,
    circles,
    spawnMarketWave,
    spawnCrashArrow,
    mod,
  };
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

describe('牛市怪 bullrun 呈現（§126.1）', () => {
  it('prowl 緩走朝目標側；prowl 期滿入 charge 定身閃爍', () => {
    const walking = makeFieldSprite({ state: 'prowl', stateMs: 0 });
    updateBullrun(makeFieldCtx({ x: 0, y: 100 }).ctx, asSprite(walking), 16);
    expect(walking.body.velocity.x).toBeLessThan(0);

    const charging = makeFieldSprite({ state: 'prowl', stateMs: BULLRUN_FSM.prowlMs - 1 });
    updateBullrun(makeFieldCtx({ x: 0, y: 100 }).ctx, asSprite(charging), 16);
    expect(charging.getData('state')).toBe('charge');
    expect(charging.body.velocity.x).toBe(0);
    expect(charging.tints.length).toBeGreaterThan(0);
  });

  it('charge 期滿入 dash：鎖定朝目標側以 dashSpeed 衝刺', () => {
    const fake = makeFieldSprite({ state: 'charge', stateMs: BULLRUN_FSM.chargeMs - 1 });
    updateBullrun(makeFieldCtx({ x: 0, y: 100 }).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('dash');
    expect(fake.body.velocity.x).toBe(-BULLRUN_FSM.dashSpeed);
  });

  it('dash 撞牆入 redash 二次加速（沿反彈後速度向 ×redashSpeedMul）', () => {
    const fake = makeFieldSprite({ state: 'dash', stateMs: 100 });
    // bounce=1 已翻向：撞左牆後速度為正向。
    fake.body.blocked.left = true;
    fake.body.velocity.x = BULLRUN_FSM.dashSpeed;
    updateBullrun(makeFieldCtx(null).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('redash');
    expect(fake.body.velocity.x).toBe(BULLRUN_FSM.dashSpeed * BULLRUN_FSM.redashSpeedMul);
  });

  it('redash 再撞牆入 recover 減速收勢；recover 期滿回 prowl', () => {
    const fake = makeFieldSprite({ state: 'redash', stateMs: 100 });
    fake.body.blocked.right = true;
    fake.body.velocity.x = -200;
    updateBullrun(makeFieldCtx(null).ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('recover');
    expect(Math.abs(fake.body.velocity.x)).toBeLessThan(200);

    const recovered = makeFieldSprite({ state: 'recover', stateMs: BULLRUN_FSM.recoverMs - 1 });
    updateBullrun(makeFieldCtx(null).ctx, asSprite(recovered), 16);
    expect(recovered.getData('state')).toBe('prowl');
  });
});

describe('熊市怪 bearmarket 呈現（§126.1）', () => {
  it('slamwind 期滿入 slam：雙側地面波＋朝目標側召一支下跌小箭頭', () => {
    const fake = makeFieldSprite({
      state: 'slamwind',
      stateMs: BEARMARKET_FSM.slamwindMs - 1,
      hp: 16,
      maxHp: 16,
    });
    const h = makeFieldCtx({ x: 0, y: 100 });
    updateBearmarket(h.ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('slam');
    expect(h.spawnMarketWave).toHaveBeenCalledTimes(2);
    // 拍地波為近距波（quake=false）。
    expect(h.spawnMarketWave).toHaveBeenCalledWith(expect.any(Number), 110, -1, false);
    expect(h.spawnMarketWave).toHaveBeenCalledWith(expect.any(Number), 110, 1, false);
    expect(h.spawnCrashArrow).toHaveBeenCalledTimes(1);
  });

  it('低血一次性冬眠：prowl 期觸發 hibernate 並鎖存 hibernated＋鼓脹前搖', () => {
    const fake = makeFieldSprite({ state: 'prowl', stateMs: 0, hp: 6, maxHp: 16 });
    const h = makeFieldCtx(null);
    updateBearmarket(h.ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('hibernate');
    expect(fake.getData('hibernated')).toBe(true);
    updateBearmarket(h.ctx, asSprite(fake), 700);
    expect(h.mod.sx).toBeGreaterThan(1);
  });

  it('hibernate 期滿入 quake：雙側全場震波（quake=true）後甦醒回 prowl', () => {
    const fake = makeFieldSprite({
      state: 'hibernate',
      stateMs: BEARMARKET_FSM.hibernateMs - 1,
      hibernated: true,
      hp: 6,
      maxHp: 16,
    });
    const h = makeFieldCtx(null);
    updateBearmarket(h.ctx, asSprite(fake), 16);
    expect(fake.getData('state')).toBe('quake');
    expect(h.spawnMarketWave).toHaveBeenCalledTimes(2);
    expect(h.spawnMarketWave).toHaveBeenCalledWith(expect.any(Number), 110, -1, true);
    expect(h.spawnMarketWave).toHaveBeenCalledWith(expect.any(Number), 110, 1, true);

    const waking = makeFieldSprite({
      state: 'wake',
      stateMs: BEARMARKET_FSM.wakeMs - 1,
      hibernated: true,
      hp: 6,
      maxHp: 16,
    });
    updateBearmarket(makeFieldCtx(null).ctx, asSprite(waking), 16);
    expect(waking.getData('state')).toBe('prowl');
  });
});
