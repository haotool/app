import type { EnemyKind } from '../core/types';

// 純戰鬥數值邏輯（不 import phaser），vitest 對象；上限等常數由呼叫端（config.ts）傳入。

export function applyDamage(hp: number, damage: number): number {
  return Math.max(0, hp - damage);
}

export function clampAmmo(ammo: number, maxAmmo: number): number {
  return Math.min(maxAmmo, Math.max(0, ammo));
}

// 刺刺瓜不可吸入（GAME_DESIGN §5）。
export function canInhale(kind: EnemyKind): boolean {
  return kind !== 'spiky';
}

// TODO(US-003)：吸入錐形範圍判定精化（角度限制）。
export function isInInhaleRange(
  playerX: number,
  playerY: number,
  facingX: 1 | -1,
  targetX: number,
  targetY: number,
  rangePx: number,
): boolean {
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const facingOk = Math.sign(dx) === facingX || dx === 0;
  return facingOk && dx * dx + dy * dy <= rangePx * rangePx;
}
