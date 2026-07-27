import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { AUDIT_THRESHOLDS } from '../logic/difficulty';
import { TICKETA_FSM } from '../logic/enemyFsm';
import type { EnemyUpdateContext } from './enemyUpdates';
import { TICKETA_WARN_MS, updateTicketa } from './finaleEnemies';

// zzfx 於 import 期建 AudioContext（node 無此 API）；沿 player.test.ts 慣例替換。
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

// 票券蝠 telegraph 反應窗（#899）：原 telegraph 閃爍與換軌俯掠同一物理幀啟動，
// 玩家反應窗為 0。修法＝fly 尾段 TICKETA_WARN_MS 懸停＋閃爍（沿 scanna aim 定點
// 鎖定語彙），shift 才開始位移。本檔以呈現層替身鎖住「先亮後動」時序契約。

interface FakeTicketaSprite {
  y: number;
  tintCalls: number[];
  clearCalls: number;
  flipX: boolean | null;
  body: {
    velocity: { x: number; y: number };
    setVelocity(vx: number, vy: number): void;
  };
  getData(key: string): unknown;
  setData(key: string, value: unknown): FakeTicketaSprite;
  setTint(tint: number): FakeTicketaSprite;
  clearTint(): FakeTicketaSprite;
  setFlipX(value: boolean): FakeTicketaSprite;
}

function makeTicketa(state: 'fly' | 'shift', stateMs: number): FakeTicketaSprite {
  const data = new Map<string, unknown>([
    ['state', state],
    ['stateMs', stateMs],
    ['band', 'high'],
    ['phase', 0],
    ['eliteMul', 1],
  ]);
  const sprite: FakeTicketaSprite = {
    y: TICKETA_FSM.bandHighY,
    tintCalls: [],
    clearCalls: 0,
    flipX: null,
    body: {
      velocity: { x: 0, y: 0 },
      setVelocity(vx: number, vy: number) {
        sprite.body.velocity.x = vx;
        sprite.body.velocity.y = vy;
      },
    },
    getData: (key) => data.get(key),
    setData(key, value) {
      data.set(key, value);
      return sprite;
    },
    setTint(tint) {
      sprite.tintCalls.push(tint);
      return sprite;
    },
    clearTint() {
      sprite.clearCalls += 1;
      return sprite;
    },
    setFlipX(value) {
      sprite.flipX = value;
      return sprite;
    },
  };
  return sprite;
}

const asSprite = (fake: FakeTicketaSprite) => fake as unknown as Phaser.Physics.Arcade.Sprite;
const ctxAt = (elapsedMs: number) => ({ elapsedMs, target: null }) as unknown as EnemyUpdateContext;

describe('票券蝠換軌 telegraph 反應窗（#899）', () => {
  it('預警窗對齊 telegraph SSOT 門檻（≥600ms，與 scanna aim／spora windup 同級）', () => {
    expect(TICKETA_WARN_MS).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    // 預警屬 fly 期尾段：不得長於 fly 期本身，否則永久閃爍失去訊號意義。
    expect(TICKETA_WARN_MS).toBeLessThan(TICKETA_FSM.flyMs);
  });

  it('fly 中段：漂移不閃爍（telegraph 訊號僅存在於尾段預警窗）', () => {
    const fake = makeTicketa('fly', 0);
    updateTicketa(ctxAt(0), asSprite(fake), 16);
    expect(fake.tintCalls).toEqual([]);
    // cos(0)＝1 → 水平漂移全速，垂直貼軌（y 已在軌帶上為 0）。
    expect(fake.body.velocity.x).toBeCloseTo(TICKETA_FSM.flySpeed);
  });

  it('fly 尾段預警：閃爍亮起且懸停（水平歸 0、垂直僅貼軌），尚未俯掠', () => {
    const fake = makeTicketa('fly', TICKETA_FSM.flyMs - TICKETA_WARN_MS);
    updateTicketa(ctxAt(0), asSprite(fake), 16);
    expect(fake.tintCalls.length).toBeGreaterThan(0);
    expect(fake.body.velocity.x).toBe(0);
    expect(Math.abs(fake.body.velocity.y)).toBeLessThan(TICKETA_FSM.shiftSpeed);
  });

  it('shift 首幀才開始俯掠位移（telegraph 已先亮滿預警窗）', () => {
    const fake = makeTicketa('fly', TICKETA_FSM.flyMs - 1);
    updateTicketa(ctxAt(0), asSprite(fake), 16);
    expect(fake.getData('state')).toBe('shift');
    expect(Math.abs(fake.body.velocity.y)).toBeCloseTo(TICKETA_FSM.shiftSpeed);
    expect(fake.tintCalls.length).toBeGreaterThan(0);
  });

  // 反應窗機械量測：逐 16ms 幀序推進，量「telegraph 首亮」到「俯掠開始」的實際
  // 毫秒差。移除 fly 尾段預警分支（回到同幀啟動）時本案必紅（差值歸 0）。
  it('反應窗實測：telegraph 首亮至俯掠開始 ≥ telegraphMinMs', () => {
    const fake = makeTicketa('fly', 0);
    const STEP = 16;
    let elapsed = 0;
    let firstTintAt: number | null = null;
    let shiftMoveAt: number | null = null;
    for (let i = 0; i < 400 && shiftMoveAt === null; i += 1) {
      fake.tintCalls.length = 0;
      updateTicketa(ctxAt(elapsed), asSprite(fake), STEP);
      elapsed += STEP;
      if (firstTintAt === null && fake.tintCalls.length > 0) firstTintAt = elapsed;
      if (Math.abs(fake.body.velocity.y) >= TICKETA_FSM.shiftSpeed) shiftMoveAt = elapsed;
    }
    expect(firstTintAt).not.toBeNull();
    expect(shiftMoveAt).not.toBeNull();
    expect((shiftMoveAt ?? 0) - (firstTintAt ?? 0)).toBeGreaterThanOrEqual(
      AUDIT_THRESHOLDS.telegraphMinMs,
    );
  });

  it('俯掠動力學不變（難度不侵蝕）：週期與俯掠速度沿 FSM SSOT，預警不延長換軌節奏', () => {
    // FSM 常數未被呈現層改寫：fly 2400／shift 600／shiftSpeed 260。
    expect(TICKETA_FSM.flyMs).toBe(2400);
    expect(TICKETA_FSM.shiftMs).toBe(600);
    expect(TICKETA_FSM.shiftSpeed).toBe(260);
    // 完整週期模擬：shift 期滿回 fly 當幀翻轉軌帶（entered 幀 clearTint）。
    const fake = makeTicketa('shift', TICKETA_FSM.shiftMs - 1);
    updateTicketa(ctxAt(0), asSprite(fake), 16);
    expect(fake.getData('state')).toBe('fly');
    expect(fake.getData('band')).toBe('low');
    expect(fake.clearCalls).toBe(1);
  });
});

// cargo/foamy 面向同步守門已上收至 enemyFacing.test.ts 表驅動全表遍歷。
