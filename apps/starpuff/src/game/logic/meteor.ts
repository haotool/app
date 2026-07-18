// 流星雨純邏輯（GAME_DESIGN §78，不 import phaser），vitest 對象。
// 關卡級環境彈幕（主計畫 §5 L18）：落點預警 0.8s → 隕星直墜（可被星彈擊碎）→
// 落地餘燼 0.4s 後消散。anti-softlock（§10.2-7）：預警 ≥0.7s、開門後門前 ±120px
// 禁投、同屏 ≤3（效能預算）；玩家所在縱帶 ±48px 禁投（交叉不變式 14 滯空無水平
// 逃逸速度、L18 保底線腳下不連投，取聯集恆排除）。

export const METEOR = {
  // 預警時長（≥0.7s 不變式）：預警圈滿即著地。
  telegraphMs: 800,
  // 恆定墜速（px/s）：不掛重力——低重力關落地時刻不延後（交叉不變式 14）。
  fallSpeedPxPerSec: 520,
  emberMs: 400,
  maxOnScreen: 3,
  gateClearancePx: 120,
  playerClearancePx: 48,
  // 視窗側緣安全邊距：隕星不落在半屏外側緣。
  edgeMarginPx: 60,
} as const;

// 關卡級配置（LevelSpec.meteor）：波間隔與單波顆數。
export interface MeteorSpec {
  intervalMs: number;
  waveSize: number;
}

export interface MeteorTimerResult {
  timerMs: number;
  wave: boolean;
}

// 波次節拍：間隔到期發波並歸零（單計時器，沿 enemyFsm 週期慣例）。
export function advanceMeteorTimer(
  timerMs: number,
  deltaMs: number,
  intervalMs: number,
): MeteorTimerResult {
  const next = timerMs + deltaMs;
  if (next >= intervalMs) return { timerMs: 0, wave: true };
  return { timerMs: next, wave: false };
}

export interface ExclusionBand {
  center: number;
  halfWidthPx: number;
}

// 落點抽選：可投範圍挖除排除帶後，rand01 沿剩餘總長線性映射；無合法段回 null（該顆棄投）。
export function pickMeteorX(
  rand01: number,
  minX: number,
  maxX: number,
  exclusions: readonly ExclusionBand[],
): number | null {
  interface Segment {
    lo: number;
    hi: number;
  }
  let segments: Segment[] = maxX > minX ? [{ lo: minX, hi: maxX }] : [];
  for (const band of exclusions) {
    const lo = band.center - band.halfWidthPx;
    const hi = band.center + band.halfWidthPx;
    const next: Segment[] = [];
    for (const segment of segments) {
      if (hi <= segment.lo || lo >= segment.hi) {
        next.push(segment);
        continue;
      }
      if (lo > segment.lo) next.push({ lo: segment.lo, hi: lo });
      if (hi < segment.hi) next.push({ lo: hi, hi: segment.hi });
    }
    segments = next;
  }
  const total = segments.reduce((sum, segment) => sum + (segment.hi - segment.lo), 0);
  if (total <= 0) return null;
  let offset = Math.min(Math.max(rand01, 0), 0.999999) * total;
  for (const segment of segments) {
    const length = segment.hi - segment.lo;
    if (offset < length) return segment.lo + offset;
    offset -= length;
  }
  return null;
}

// 生成高度：telegraph 結束瞬間著地——由墜速×預警時長自著地點反推。
export function meteorSpawnY(impactY: number): number {
  return impactY - (METEOR.fallSpeedPxPerSec * METEOR.telegraphMs) / 1000;
}
