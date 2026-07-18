import type { StarFlavor } from '../core/config';
import type { EnemyKind } from '../core/types';

// 純戰鬥數值邏輯（不 import phaser），vitest 對象；上限等常數由呼叫端（config.ts）傳入。

export function applyDamage(hp: number, damage: number): number {
  return Math.max(0, hp - damage);
}

export interface HitResult {
  hp: number;
  invulnerableMs: number;
  damaged: boolean;
}

// 受擊結算：i-frame 期間或已死亡免傷，否則扣血並重啟無敵計時。
export function resolveHit(
  hp: number,
  invulnerableMs: number,
  damage: number,
  invulnerableDurationMs: number,
): HitResult {
  if (invulnerableMs > 0 || hp <= 0) return { hp, invulnerableMs, damaged: false };
  return { hp: applyDamage(hp, damage), invulnerableMs: invulnerableDurationMs, damaged: true };
}

export function tickTimer(remainingMs: number, deltaMs: number): number {
  return Math.max(0, remainingMs - deltaMs);
}

// 擊退：遠離傷害來源並向上抬升；與來源同 x 時預設向右退。
export function knockbackVelocity(
  x: number,
  sourceX: number,
  speed: number,
  lift: number,
): { x: number; y: number } {
  return { x: x < sourceX ? -speed : speed, y: lift };
}

export function clampAmmo(ammo: number, maxAmmo: number): number {
  return Math.min(maxAmmo, Math.max(0, ammo));
}

// 可吸怪的星彈屬性對照（§20/§30/§40/§47/§52）：v6 起 shelly 得殼盾星、zappy 得雷鏈星；
// v7 起 drilly 得重鑽星（破土窗）、glowy 得流光星；v8 起 spora 得孢子星、boomy 得迴旋星、
// gusty 歸入既有疾風味（避免味數爆炸）；不可吸者無屬性。
// v9 起 magno 歸雷鏈味、mirri 歸迴旋味（§59，均歸既有味系不加新味）。
// v11 起 bubbla 歸爆裂味（躍出窗）、splatta 歸孢子味（§73 零新味裁決延續）。
const INHALE_FLAVORS: Partial<Record<EnemyKind, StarFlavor>> = {
  jelly: 'jelly',
  floaty: 'floaty',
  puffy: 'puffy',
  shelly: 'shelly',
  zappy: 'zappy',
  drilly: 'drilly',
  glowy: 'glowy',
  spora: 'spora',
  gusty: 'floaty',
  boomy: 'boomy',
  magno: 'zappy',
  mirri: 'boomy',
  bubbla: 'puffy',
  splatta: 'spora',
};

export function inhaleFlavor(kind: EnemyKind): StarFlavor | null {
  return INHALE_FLAVORS[kind] ?? null;
}

// 刺刺瓜與咬咬花不可吸入（§5、§16）；殼殼僅暈眩窗（§30）、鑽地者僅破土窗（§47）、
// 焦糖泡僅躍出窗（§73）可吸，exposed 由呼叫端依個體狀態傳入；
// 未帶狀態時視為不可吸（spawner 保證律與權重驗證取保守值）。
export function canInhale(kind: EnemyKind, exposed = false): boolean {
  if (kind === 'shelly' || kind === 'drilly' || kind === 'bubbla') return exposed;
  return inhaleFlavor(kind) !== null;
}

// 半徑選敵（§46 凝光星等範圍效果共用）：圓域內全取，不排序不限量；純函式供 vitest。
export interface RadiusCandidate {
  x: number;
  y: number;
}

export function pickInRadius<T extends RadiusCandidate>(
  originX: number,
  originY: number,
  candidates: readonly T[],
  radiusPx: number,
): T[] {
  return candidates.filter(
    (candidate) =>
      (candidate.x - originX) ** 2 + (candidate.y - originY) ** 2 <= radiusPx * radiusPx,
  );
}

// 吸入接觸豁免（§71）：被吸入中的怪對玩家無接觸傷害——拉力逐幀刷新豁免窗，
// 吸入中斷（鬆開/轉向/離錐）後窗過期即恢復傷害性；未被吸的其他怪不受影響，
// 風險回報保留（非吸入全程無敵）。窗長 250ms：涵蓋拉力幀間隔與貼身吞下前緣。
export const INHALE_GRACE_MS = 250;

export function inhaleGraceUntil(nowMs: number): number {
  return nowMs + INHALE_GRACE_MS;
}

export function isContactHarmless(nowMs: number, graceUntilMs: number): boolean {
  return nowMs < graceUntilMs;
}

// 錐形判定：面向側、距離內、且垂直偏移不超過水平距離（半角 45°）。
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
  return facingOk && dx * dx + dy * dy <= rangePx * rangePx && Math.abs(dy) <= Math.abs(dx);
}
