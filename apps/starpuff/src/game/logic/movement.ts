import { PLAYER } from '../core/config';

// 水平移動手感純邏輯（GAME_DESIGN §41，不 import phaser），vitest 對象。
// 加減速曲線取代瞬時 setVelocity：起步約 0.16s 達全速、鬆手約 0.11s 停定。

// 停定吸附閾值：殘速低於此值直接歸零，避免微速漂移拖動走路 bob。
const SNAP_EPSILON = 8;

export function approachVelocity(current: number, target: number, deltaMs: number): number {
  // 超速殘速（擊退）先夾回常速帶，避免殘速滑行（v5 為逐幀瞬時覆寫）。
  const capped =
    Math.abs(current) > PLAYER.moveSpeed ? Math.sign(current) * PLAYER.moveSpeed : current;
  const dt = deltaMs / 1000;
  if (target === 0) {
    const step = PLAYER.decelPxPerSec2 * dt;
    const next = Math.abs(capped) <= step ? 0 : capped - Math.sign(capped) * step;
    return Math.abs(next) < SNAP_EPSILON ? 0 : next;
  }
  // 反向輸入以加＋減速率疊加，轉身即刻有力。
  const opposing = capped !== 0 && Math.sign(target) !== Math.sign(capped);
  const rate = opposing ? PLAYER.accelPxPerSec2 + PLAYER.decelPxPerSec2 : PLAYER.accelPxPerSec2;
  const step = rate * dt;
  if (target > capped) return Math.min(target, capped + step);
  return Math.max(target, capped - step);
}

// 手感事件邊緣偵測（§41）：起跑塵埃、急停塵埃、轉身塵埃＋擠壓，供呈現層一次性觸發。
export type MoveFxEvent = 'run-start' | 'hard-stop' | 'turn' | null;

const RUN_START_MAX_SPEED = 40;
const HARD_STOP_MIN_SPEED = 160;
const TURN_MIN_SPEED = 120;

export function detectMoveFx(opts: {
  onGround: boolean;
  prevTarget: number;
  target: number;
  velocityX: number;
}): MoveFxEvent {
  if (!opts.onGround) return null;
  const { prevTarget, target, velocityX } = opts;
  if (
    target !== 0 &&
    prevTarget !== 0 &&
    Math.sign(target) !== Math.sign(prevTarget) &&
    Math.abs(velocityX) >= TURN_MIN_SPEED
  ) {
    return 'turn';
  }
  if (target !== 0 && prevTarget === 0 && Math.abs(velocityX) <= RUN_START_MAX_SPEED) {
    return 'run-start';
  }
  if (target === 0 && prevTarget !== 0 && Math.abs(velocityX) >= HARD_STOP_MIN_SPEED) {
    return 'hard-stop';
  }
  return null;
}
