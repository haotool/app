import { describe, expect, it } from 'vitest';
import { VIEW } from '../core/config';
import { NOCTRA } from './noctraFsm';
import { NOCTRA_FLIGHT, approachPoint, hoverPatternPoint } from './noctraFlight';

// 返空瞬移回歸（GAME_DESIGN §64 P0 熱修）：俯衝/俯掠/長暈 tween 接管結束當幀，
// 盤旋駕駛若以凍結相位的絕對座標直寫 sprite，位移可達數百 px——即玩家所見瞬移。
// 修法契約：位置以速度上限逐幀逼近相位目標，單 tick 位移 ≤ maxSpeed×dt。

const FRAME_MS = 16.7;

// 單 tick 位移上限（px）：maxSpeed×dt；speedFactor 交由呼叫端縮放後傳入。
const stepBudget = (speedPxPerSec: number, deltaMs: number) => (speedPxPerSec * deltaMs) / 1000;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);

describe('瞬移根因重現（回歸基準）', () => {
  it('俯衝落點與凍結相位點距離遠超單幀位移預算——直寫相位座標即瞬移', () => {
    // 相位凍結於盤旋左緣（sin ≈ -1）；俯衝追玩家至右緣 aimX=794（clamp 上限）。
    const quarterMs = (Math.PI * 1.5) / NOCTRA_FLIGHT.swayFreq;
    const frozen = hoverPatternPoint(quarterMs, VIEW.minWidth);
    expect(frozen.x).toBeLessThan(240);
    const diveEnd = { x: 794, y: NOCTRA_FLIGHT.hoverY };
    // 舊版行為：steering 恢復當幀 sprite 直接跳至 frozen——位移 >550px，
    // 遠超單幀預算（約 5.7px），玩家視覺即瞬移。
    expect(dist(diveEnd, frozen)).toBeGreaterThan(550);
    expect(dist(diveEnd, frozen)).toBeGreaterThan(
      stepBudget(NOCTRA_FLIGHT.maxSpeedPxPerSec, FRAME_MS) * 20,
    );
  });
});

describe('approachPoint 連續性契約（§64）', () => {
  const cap = NOCTRA_FLIGHT.maxSpeedPxPerSec;

  it('不同落地位置返空：每 tick 位移 ≤ maxSpeed×dt 且收斂到目標', () => {
    const target = hoverPatternPoint(0, VIEW.minWidth);
    for (const startX of [60, 427, 794]) {
      let current = { x: startX, y: 340 };
      let guard = 0;
      while (dist(current, target) > 0.01 && guard < 600) {
        const next = approachPoint(current, target, cap, FRAME_MS);
        expect(dist(current, next)).toBeLessThanOrEqual(stepBudget(cap, FRAME_MS) + 1e-9);
        current = next;
        guard += 1;
      }
      expect(current.x).toBeCloseTo(target.x, 5);
      expect(current.y).toBeCloseTo(target.y, 5);
    }
  });

  it('全程直線插值：軌跡點恆在起點與目標連線上（無繞路）', () => {
    const start = { x: 794, y: 340 };
    const target = { x: 200, y: 246 };
    const dirX = target.x - start.x;
    const dirY = target.y - start.y;
    let current = start;
    for (let i = 0; i < 200 && dist(current, target) > 0.01; i += 1) {
      current = approachPoint(current, target, cap, FRAME_MS);
      // 叉積為零 → 共線。
      const cross = (current.x - start.x) * dirY - (current.y - start.y) * dirX;
      expect(Math.abs(cross)).toBeLessThan(1e-6 * Math.hypot(dirX, dirY));
    }
  });

  it('超大 dt（低 FPS／分頁切回）：位移仍 ≤ maxSpeed×dt 且不過衝目標', () => {
    const target = { x: 427, y: 246 };
    const near = { x: 430, y: 247 };
    // 大步長貼合目標而不過衝。
    const landed = approachPoint(near, target, cap, 5000);
    expect(landed).toEqual(target);
    // 遠距離大 dt：位移受 maxSpeed×dt 夾制（時間一致性，非瞬移）。
    const far = { x: 60, y: 340 };
    const step = approachPoint(far, target, cap, 500);
    expect(dist(far, step)).toBeLessThanOrEqual(stepBudget(cap, 500) + 1e-9);
  });

  it('pause 期間（dt=0）位置不動；resume 後照常推進', () => {
    const target = { x: 427, y: 246 };
    const current = { x: 100, y: 340 };
    expect(approachPoint(current, target, cap, 0)).toEqual(current);
    const resumed = approachPoint(current, target, cap, FRAME_MS);
    expect(dist(current, resumed)).toBeGreaterThan(0);
  });

  it('返空中相位轉換（速度倍率跳升）與受擊不破壞連續性：逐 tick 位移仍受當下 cap 夾制', () => {
    // 受擊只觸發演出（flash/shake），不寫位置；相位轉換使 cap ×1.15——各 tick 依當下 cap 驗證。
    const target = hoverPatternPoint(1200, VIEW.minWidth);
    let current = { x: 794, y: 340 };
    for (let i = 0; i < 300 && dist(current, target) > 0.01; i += 1) {
      const factor = i < 30 ? 1 : NOCTRA.enrageSpeedMultiplier;
      const next = approachPoint(current, target, cap * factor, FRAME_MS);
      expect(dist(current, next)).toBeLessThanOrEqual(stepBudget(cap * factor, FRAME_MS) + 1e-9);
      current = next;
    }
    expect(dist(current, target)).toBeLessThan(0.01);
  });
});

describe('hoverPatternPoint（相位 → 目標座標）', () => {
  it('相位 0 為畫面中心盤旋高度；y 呼吸振幅 ≤ ±14', () => {
    for (const viewW of [VIEW.minWidth, VIEW.maxWidth]) {
      const origin = hoverPatternPoint(0, viewW);
      expect(origin.x).toBeCloseTo(viewW / 2, 5);
      expect(origin.y).toBeCloseTo(NOCTRA_FLIGHT.hoverY, 5);
    }
    for (let ms = 0; ms < 20000; ms += 250) {
      const p = hoverPatternPoint(ms, VIEW.maxWidth);
      expect(Math.abs(p.y - NOCTRA_FLIGHT.hoverY)).toBeLessThanOrEqual(NOCTRA_FLIGHT.bobAmpPx);
      expect(p.x).toBeGreaterThanOrEqual(NOCTRA_FLIGHT.sideMarginX);
      expect(p.x).toBeLessThanOrEqual(VIEW.maxWidth - NOCTRA_FLIGHT.sideMarginX);
    }
  });

  it('歸位速度上限高於盤旋峰值橫移：貼軌後恆能跟上目標（EX 最寬幅亦然）', () => {
    // 峰值橫移 = span×swayFreq×1000（px/s）；cap 需嚴格大於，否則正常盤旋會脫軌。
    const peak = (VIEW.maxWidth / 2 - NOCTRA_FLIGHT.sideMarginX) * NOCTRA_FLIGHT.swayFreq * 1000;
    expect(NOCTRA_FLIGHT.maxSpeedPxPerSec).toBeGreaterThan(peak);
  });
});
