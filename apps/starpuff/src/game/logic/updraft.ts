// 上升氣流純邏輯（GAME_DESIGN §51/§72，不 import phaser），vitest 對象。
// zone 型非碰撞：進入柱域獲得向上加速度、升速夾限；柱頂以上不再供力自然拋出。
// v11 熱泉噴口（§72）：periodMs/dutyPct 選配週期化——缺省恆常供力（L5 零回歸），
// 有值＝間歇噴發（噴發前 0.5s 蒸汽預警，非噴發期不供力）。

export const UPDRAFT = {
  liftPxPerSec2: 1600,
  // 最大上升速度（負值向上）：低於跳躍初速絕對值，柱內懸浮可控。
  maxRiseSpeed: -330,
  // 噴發前蒸汽預警時長（§72）。
  ventTelegraphMs: 500,
} as const;

export interface UpdraftZone {
  x: number;
  topY: number;
  w: number;
  // 週期噴發選配（§72）：缺省＝恆常供力。
  periodMs?: number;
  dutyPct?: number;
}

export type VentPhase = 'idle' | 'telegraph' | 'erupt';

// 噴口相位：週期頭 idle → 末段 0.5s telegraph → 尾段 duty 比例噴發。
// periodMs 缺省視為恆常噴發（既有氣流柱零回歸）。
export function ventPhase(elapsedMs: number, zone: UpdraftZone): VentPhase {
  if (zone.periodMs === undefined) return 'erupt';
  const duty = zone.dutyPct ?? 0.31;
  const position = ((elapsedMs % zone.periodMs) + zone.periodMs) % zone.periodMs;
  const idleMs = zone.periodMs * (1 - duty);
  if (position >= idleMs) return 'erupt';
  return position >= idleMs - UPDRAFT.ventTelegraphMs ? 'telegraph' : 'idle';
}

export function isVentSupplying(elapsedMs: number, zone: UpdraftZone): boolean {
  return ventPhase(elapsedMs, zone) === 'erupt';
}

// 柱域判定：水平落於柱寬內、垂直於柱頂與地面頂之間。
export function isInUpdraft(
  playerX: number,
  playerY: number,
  zone: UpdraftZone,
  groundTop: number,
): boolean {
  if (Math.abs(playerX - zone.x) > zone.w / 2) return false;
  return playerY >= zone.topY && playerY <= groundTop;
}

// 升力結算（anti-softlock §56）：頭頂受阻（卡頂）不供力，交還重力自然回落；
// 其餘逐幀向上加速並夾限至 maxRiseSpeed。
export function updraftLift(vy: number, deltaMs: number, blockedUp: boolean): number {
  if (blockedUp) return vy;
  const next = vy - UPDRAFT.liftPxPerSec2 * (deltaMs / 1000);
  return Math.max(next, UPDRAFT.maxRiseSpeed);
}
