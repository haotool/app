import { describe, expect, it } from 'vitest';
import { PLAYER } from '../core/config';
import {
  TIDE,
  isTideSubmerged,
  soakWakeInvuln,
  tideFilterKind,
  tidePhase,
  tideSoakVelocity,
  tideSpawnY,
  tideWaterY,
} from './tide';

// L14 規格（主計畫 §5）：週期 9s、漲潮佔比 45%、漲頂 y=352。
const SPEC = { maxY: 352, periodMs: 9000, dutyPct: 0.45 } as const;
const GROUND_TOP = 400;
// dryMs = 9000 × (1-0.45) = 4950。
const DRY_MS = 4950;

describe('tideWaterY 水位時間軸（§71 糖漿潮汐）', () => {
  it('乾潮期水位收納於世界底（等效無水）', () => {
    expect(tideWaterY(0, SPEC, GROUND_TOP)).toBe(TIDE.baseY);
    expect(tideWaterY(DRY_MS - 1, SPEC, GROUND_TOP)).toBe(TIDE.baseY);
  });

  it('漲潮段自地面頂線性升至漲頂', () => {
    expect(tideWaterY(DRY_MS, SPEC, GROUND_TOP)).toBe(GROUND_TOP);
    expect(tideWaterY(DRY_MS + TIDE.riseMs / 2, SPEC, GROUND_TOP)).toBe(376);
    expect(tideWaterY(DRY_MS + TIDE.riseMs, SPEC, GROUND_TOP)).toBe(SPEC.maxY);
  });

  it('滿潮段持平漲頂，退潮段線性退回地面頂', () => {
    const wetMs = SPEC.periodMs * SPEC.dutyPct;
    expect(tideWaterY(DRY_MS + wetMs / 2, SPEC, GROUND_TOP)).toBe(SPEC.maxY);
    expect(tideWaterY(SPEC.periodMs - TIDE.fallMs / 2, SPEC, GROUND_TOP)).toBe(376);
    expect(tideWaterY(SPEC.periodMs - 1, SPEC, GROUND_TOP)).toBeGreaterThan(396);
  });

  it('週期循環：滿週期回乾潮', () => {
    expect(tideWaterY(SPEC.periodMs, SPEC, GROUND_TOP)).toBe(TIDE.baseY);
    expect(tideWaterY(SPEC.periodMs + DRY_MS + TIDE.riseMs, SPEC, GROUND_TOP)).toBe(SPEC.maxY);
  });
});

describe('tidePhase 相位（漲潮前 1s 冒泡 telegraph）', () => {
  it('乾潮期為 dry，末段 1s 轉 telegraph', () => {
    expect(tidePhase(0, SPEC)).toBe('dry');
    expect(tidePhase(DRY_MS - TIDE.telegraphMs - 1, SPEC)).toBe('dry');
    expect(tidePhase(DRY_MS - TIDE.telegraphMs, SPEC)).toBe('telegraph');
    expect(tidePhase(DRY_MS - 1, SPEC)).toBe('telegraph');
  });

  it('漲潮段為 flood', () => {
    expect(tidePhase(DRY_MS, SPEC)).toBe('flood');
    expect(tidePhase(SPEC.periodMs - 1, SPEC)).toBe('flood');
    expect(tidePhase(SPEC.periodMs, SPEC)).toBe('dry');
  });
});

describe('isTideSubmerged 浸入判定', () => {
  it('腳底越過水面即浸入', () => {
    expect(isTideSubmerged(360, 352)).toBe(true);
    expect(isTideSubmerged(352, 352)).toBe(true);
    expect(isTideSubmerged(340, 352)).toBe(false);
  });

  it('乾潮水位（世界底）恆不浸入', () => {
    expect(isTideSubmerged(399, TIDE.baseY)).toBe(false);
  });
});

describe('tideSoakVelocity 浸水結算（anti-softlock：永不吸底）', () => {
  it('水平速度封頂 ±60（強緩速）', () => {
    expect(tideSoakVelocity(220, 0).vx).toBe(TIDE.soakSlowCapPxPerSec);
    expect(tideSoakVelocity(-220, 0).vx).toBe(-TIDE.soakSlowCapPxPerSec);
    expect(tideSoakVelocity(30, 0).vx).toBe(30);
  });

  it('垂直速度鎖上推：下墜改上升、更快上升不鉗制', () => {
    expect(tideSoakVelocity(0, 300).vy).toBe(TIDE.soakRiseSpeed);
    expect(tideSoakVelocity(0, 0).vy).toBe(TIDE.soakRiseSpeed);
    expect(tideSoakVelocity(0, -400).vy).toBe(-400);
  });
});

describe('tideSpawnY 漲潮期生成上收（交叉不變式 17：補生不落糖漿帶）', () => {
  it('乾潮期維持原生成高度', () => {
    expect(tideSpawnY(330, TIDE.baseY)).toBe(330);
  });

  it('漲潮期上收至水面上方淨空帶', () => {
    expect(tideSpawnY(330, 352)).toBe(352 - TIDE.spawnClearancePx);
    expect(tideSpawnY(240, 352)).toBe(240);
  });
});

describe('tideFilterKind 漲潮 Magno 排除（交叉不變式 13，審查修復）', () => {
  it('非乾潮期 magno 替換為 jelly；其餘品種與乾潮期直通', () => {
    expect(tideFilterKind('magno', 'flood')).toBe('jelly');
    expect(tideFilterKind('magno', 'telegraph')).toBe('jelly');
    expect(tideFilterKind('magno', 'dry')).toBe('magno');
    expect(tideFilterKind('boomy', 'flood')).toBe('boomy');
    expect(tideFilterKind('jelly', 'flood')).toBe('jelly');
  });
});

describe('soakWakeInvuln 浸水甦醒無敵（§107，issue #806）', () => {
  it('浸水受擊實際掉血 → 授予基礎受擊 i-frame＋甦醒追加窗', () => {
    expect(soakWakeInvuln(3, 2)).toBe(PLAYER.invulnerableMs + TIDE.soakWakeInvulnMs);
  });

  it('未掉血（i-frame 期/護盾格擋）回 0＝無操作，杜絕無成本刷無敵', () => {
    expect(soakWakeInvuln(3, 3)).toBe(0);
    expect(soakWakeInvuln(2, 3)).toBe(0);
  });

  it('甦醒追加窗落於保守帶 800–1200ms（issue #806 驗收基準）', () => {
    expect(TIDE.soakWakeInvulnMs).toBeGreaterThanOrEqual(800);
    expect(TIDE.soakWakeInvulnMs).toBeLessThanOrEqual(1200);
  });
});
