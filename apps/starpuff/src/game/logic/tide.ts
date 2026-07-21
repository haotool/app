import { PLAYER } from '../core/config';

// 糖漿潮汐純邏輯（GAME_DESIGN §71，不 import phaser），vitest 對象。
// 關卡級機制（非 stage element）：底部糖漿帶週期漲落，漲潮時強制走平台層。
// anti-softlock（主計畫 §10.2-4）：接觸結算永不吸底（垂直鎖上推）、每週期主地面
// 露出時間 ≥40%（dry-window 不變式由 levels.test 守門）、漲潮期等窗為合法保底行為。

export const TIDE = {
  // 乾潮收納水位：大於世界高（480）即等效無水。
  baseY: 600,
  // 漲潮前 1s 河面冒泡 telegraph。
  telegraphMs: 1000,
  // 漲退坡段：水位於地面頂與漲頂之間線性移動。
  riseMs: 900,
  fallMs: 900,
  // 浸水強緩速：水平速度封頂 60px/s。
  soakSlowCapPxPerSec: 60,
  // 浸水上推（永不吸底）：下墜/緩升一律改為上浮速度；更快上升不鉗制。
  soakRiseSpeed: -240,
  contactDamage: 1,
  // 浸水甦醒無敵追加窗（§107，issue #806）：浸水受擊實際掉血後追加於基礎 i-frame
  // 之上，總保護 2.5s 涵蓋「浮出水面＋跳回平台層」重站位，打斷滿潮死亡螺旋。
  soakWakeInvulnMs: 1000,
  // 漲潮期生成上收淨空：補生怪落點距水面的最小高度（交叉不變式 17）。
  spawnClearancePx: 48,
} as const;

// 關卡級配置（LevelSpec.tide）：maxY 為漲頂水位、dutyPct 為漲潮佔比。
export interface TideSpec {
  maxY: number;
  periodMs: number;
  dutyPct: number;
}

export type TidePhase = 'dry' | 'telegraph' | 'flood';

const cyclePosition = (elapsedMs: number, periodMs: number): number => {
  const position = elapsedMs % periodMs;
  return position < 0 ? position + periodMs : position;
};

// 水位時間軸：乾潮（收納世界底）→ 漲坡（地面頂→漲頂）→ 滿潮持平 → 退坡回地面頂。
export function tideWaterY(elapsedMs: number, spec: TideSpec, groundTop: number): number {
  const position = cyclePosition(elapsedMs, spec.periodMs);
  const dryMs = spec.periodMs * (1 - spec.dutyPct);
  if (position < dryMs) return TIDE.baseY;
  const wet = position - dryMs;
  const wetMs = spec.periodMs * spec.dutyPct;
  if (wet < TIDE.riseMs) {
    return groundTop + (spec.maxY - groundTop) * (wet / TIDE.riseMs);
  }
  if (wet >= wetMs - TIDE.fallMs) {
    const fallProgress = (wet - (wetMs - TIDE.fallMs)) / TIDE.fallMs;
    return spec.maxY + (groundTop - spec.maxY) * fallProgress;
  }
  return spec.maxY;
}

// 相位：乾潮末段 telegraphMs 轉 telegraph（河面冒泡預警），漲潮段為 flood。
export function tidePhase(elapsedMs: number, spec: TideSpec): TidePhase {
  const position = cyclePosition(elapsedMs, spec.periodMs);
  const dryMs = spec.periodMs * (1 - spec.dutyPct);
  if (position >= dryMs) return 'flood';
  return position >= dryMs - TIDE.telegraphMs ? 'telegraph' : 'dry';
}

// 浸入判定：腳底（bottom y）越過水面即浸入。
export function isTideSubmerged(playerBottomY: number, waterY: number): boolean {
  return playerBottomY >= waterY;
}

// 浸水速度結算：水平強緩速封頂、垂直鎖上推（永不吸底）。
export function tideSoakVelocity(vx: number, vy: number): { vx: number; vy: number } {
  const cap = TIDE.soakSlowCapPxPerSec;
  return {
    vx: Math.max(-cap, Math.min(cap, vx)),
    vy: Math.min(vy, TIDE.soakRiseSpeed),
  };
}

// 漲潮期生成上收（交叉不變式 17）：預設生成高度落於糖漿帶內時上收至水面上方淨空帶。
export function tideSpawnY(defaultY: number, waterY: number): number {
  return Math.min(defaultY, waterY - TIDE.spawnClearancePx);
}

// 浸水甦醒無敵（§107，issue #806）：浸水受擊「實際掉血」才回傳總保護窗（基礎受擊
// i-frame＋追加窗），呼叫端沿既有 grantInvulnerability 取 max 語意授予；
// 未掉血（i-frame 期/護盾格擋）回 0＝無操作，杜絕無成本刷無敵。
export function soakWakeInvuln(hpBefore: number, hpAfter: number): number {
  return hpAfter < hpBefore ? PLAYER.invulnerableMs + TIDE.soakWakeInvulnMs : 0;
}

// 漲潮期 Magno 生成排除（交叉不變式 13）：磁場不得覆蓋漲潮期可站位——非乾潮期
// 抽到 magno 一律替換為恆可吸 jelly；其餘品種直通。
export function tideFilterKind<T extends string>(kind: T, phase: TidePhase): T | 'jelly' {
  return kind === 'magno' && phase !== 'dry' ? 'jelly' : kind;
}
