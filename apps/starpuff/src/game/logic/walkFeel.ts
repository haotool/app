// 走動手感純邏輯（GAME_DESIGN §45，不 import phaser），vitest 對象。
// 速度驅動步頻：相位累積速率 ∝ 水平速度比，停走即凍結；bob/傾斜/腳步拍點皆由相位導出。

// 全速步頻 3.2Hz（相位 2π/步）：220px/s 走速下視覺步距約 69px，貼近角色身寬讀感。
const STRIDE_HZ_AT_FULL = 3.2;
// bob 振幅與前傾/搖擺角度（純視覺，不動 hurtbox）。
export const WALK_BOB_PX = 3.2;
const WALK_SWAY_RAD = 0.045;
const WALK_LEAN_RAD = 0.06;
// idle 呼吸：週期 2.4s、scaleY 振幅 ±1.8%。
const BREATH_HZ = 1 / 2.4;
const BREATH_AMPLITUDE = 0.018;
// 空中姿態：垂直速度映射前傾角，上升後仰、下墜前傾（夾限防過轉）。
const AIR_TILT_PER_VY = 1 / 5200;
const AIR_TILT_MIN = -0.1;
const AIR_TILT_MAX = 0.14;

export interface StrideTick {
  phase: number;
  // 本 tick 是否落腳（半週期一次）：呈現層據此觸發腳塵與步伐音。
  footstep: boolean;
}

// 相位推進：speedRatio 為 |vx|/moveSpeed（0..1+），低速走慢拍、全速走快拍。
// 落腳判定：|sin| 每半週期回零一次，跨越 π 整數倍即為落腳拍點。
export function advanceStride(phase: number, speedRatio: number, deltaMs: number): StrideTick {
  if (speedRatio <= 0) return { phase: 0, footstep: false };
  const next = phase + speedRatio * STRIDE_HZ_AT_FULL * 2 * Math.PI * (deltaMs / 1000);
  const footstep = Math.floor(next / Math.PI) > Math.floor(phase / Math.PI);
  return { phase: next, footstep };
}

// y 軸 bob（雙頻小彈跳）：|sin| 波形，峰值 WALK_BOB_PX；速度比縮放振幅。
export function strideBob(phase: number, speedRatio: number): number {
  return Math.abs(Math.sin(phase)) * WALK_BOB_PX * Math.min(1, speedRatio);
}

// 走動角度 = 前傾 lean（隨速恆定）+ 步頻搖擺 sway（隨相位振盪）；面向由呼叫端乘上。
export function strideTilt(phase: number, speedRatio: number): number {
  const capped = Math.min(1, speedRatio);
  return WALK_LEAN_RAD * capped + Math.sin(phase) * WALK_SWAY_RAD * capped;
}

// idle 呼吸 scaleY 偏移（-amp..+amp）：地面靜止時緩慢起伏。
export function idleBreath(elapsedMs: number): number {
  return Math.sin(elapsedMs * BREATH_HZ * 2 * Math.PI * 0.001) * BREATH_AMPLITUDE;
}

// 空中姿態角：上升（vy<0）後仰、下墜（vy>0）前傾；面向由呼叫端乘上。
export function airTilt(velocityY: number): number {
  return Math.min(AIR_TILT_MAX, Math.max(AIR_TILT_MIN, velocityY * AIR_TILT_PER_VY));
}
