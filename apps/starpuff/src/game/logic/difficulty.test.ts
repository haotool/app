import { describe, expect, it } from 'vitest';
import { GRAVITY_Y, PLAYER } from '../core/config';
import {
  AUDIT_THRESHOLDS,
  BOSS_AUDIT_FACTS,
  BOT_TIERS,
  TRANSFORM_ADVANTAGE,
  calibrate,
  computeLevelAxes,
  firstSeenKinds,
  flapApexPx,
  jumpApexPx,
  jumpFeasibilityMatrix,
  maxJumpClearancePx,
  measuredPDelta,
  percentile,
  sequenceEntropyBits,
  weightedTotal,
} from './difficulty';
import { inhaleFlavor } from './combat';
import { BOSS_LEVEL_IDS, LEVELS } from './levels';
import { eligibleForm } from './transform';

const levelOf = (id: number) => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`L${id} 不存在`);
  return level;
};

describe('驗收門檻 SSOT（機制 brief §10）', () => {
  it('門檻值與 PM 親撰總表一致', () => {
    expect(AUDIT_THRESHOLDS.starburstRecoveryP95Ms).toBe(10_000);
    expect(AUDIT_THRESHOLDS.telegraphMinMs).toBe(600);
    // #810：地面尖刺前搖下限與分級迴避率門檻。
    expect(AUDIT_THRESHOLDS.spikeTelegraphMinMs).toBe(900);
    expect(AUDIT_THRESHOLDS.spikeDodgeMinRate500).toBe(0.8);
    expect(AUDIT_THRESHOLDS.spikeDodgeMinRate350).toBe(0.85);
    expect(AUDIT_THRESHOLDS.swallowStunMinRate).toBe(0.6);
    expect(AUDIT_THRESHOLDS.swallowSpinMaxRate).toBe(0);
    expect(AUDIT_THRESHOLDS.exLowPassMaxRate).toBe(0.2);
    expect(AUDIT_THRESHOLDS.exHighPassMinRate).toBe(0.6);
  });

  it('分級 bot：低階 500ms 基礎策略、高階 250ms 完整策略', () => {
    expect(BOT_TIERS.low.reactionMs).toBe(500);
    expect(BOT_TIERS.low.dodge).toBe(false);
    expect(BOT_TIERS.high.reactionMs).toBe(250);
    expect(BOT_TIERS.high.dodge).toBe(true);
    expect(BOT_TIERS.high.kite).toBe(true);
    expect(BOT_TIERS.mid.reactionMs).toBe(350);
  });

  it('W1.5 完整策略開關：僅高階啟用拍翅/鏡界窗紀律/魔王戰吸食補彈（低/中不升級）', () => {
    expect(BOT_TIERS.high.flap).toBe(true);
    expect(BOT_TIERS.high.mirrorGuard).toBe(true);
    expect(BOT_TIERS.high.bossForage).toBe(true);
    // 變身優勢門檻跑預設關（W1.5 實測：形態技需 stance 邏輯，變身迴圈反噬輸出）；
    // --transform 顯式 A/B 管線不受影響。
    expect(BOT_TIERS.high.transformUse).toBe(false);
    for (const tier of ['low', 'mid'] as const) {
      expect(BOT_TIERS[tier].flap).toBe(false);
      expect(BOT_TIERS[tier].mirrorGuard).toBe(false);
      expect(BOT_TIERS[tier].transformUse).toBe(false);
      expect(BOT_TIERS[tier].bossForage).toBe(false);
    }
  });
});

describe('跳躍運動學（#809 解析基礎）', () => {
  it('單跳頂點＝v²/2g；拍翅增益按 floatLift 計', () => {
    expect(jumpApexPx()).toBeCloseTo(PLAYER.jumpVelocity ** 2 / (2 * GRAVITY_Y), 5);
    expect(jumpApexPx()).toBeCloseTo(98, 0);
    expect(flapApexPx()).toBeCloseTo(PLAYER.floatLift ** 2 / (2 * GRAVITY_Y), 5);
    expect(maxJumpClearancePx()).toBeCloseTo(jumpApexPx() + 3 * flapApexPx(), 5);
  });

  it('低重力提高淨高（L20 gravityScale 0.85）', () => {
    expect(jumpApexPx(0.85)).toBeGreaterThan(jumpApexPx(1));
  });

  it('跳越矩陣：地面王單跳不可越、滿拍翅可越；懸浮蝠王可自底下走過', () => {
    const matrix = jumpFeasibilityMatrix();
    const jellord = matrix.find((row) => row.boss === 'jellord');
    expect(jellord?.clearanceNeededPx).toBe(130);
    expect(jellord?.canJumpOverSingle).toBe(false);
    expect(jellord?.canJumpOverWithFlaps).toBe(true);
    const prismix = matrix.find((row) => row.boss === 'prismix');
    expect(prismix?.canJumpOverSingle).toBe(false);
    expect(prismix?.canJumpOverWithFlaps).toBe(true);
    const noctra = matrix.find((row) => row.boss === 'noctra');
    expect(noctra?.walkUnderGapPx).toBe(99);
    expect(noctra?.canWalkUnder).toBe(true);
  });
});

describe('錨定校準', () => {
  it('錨點精確重現、段內線性插值、越界夾限 1–10', () => {
    const anchors = [
      [0, 1],
      [10, 5],
      [20, 9],
    ] as const;
    expect(calibrate(0, anchors)).toBe(1);
    expect(calibrate(10, anchors)).toBe(5);
    expect(calibrate(5, anchors)).toBe(3);
    expect(calibrate(15, anchors)).toBe(7);
    expect(calibrate(100, anchors)).toBe(10);
    expect(calibrate(-5, anchors)).toBe(1);
  });
});

describe('三軸自動計算（主計畫 §3.1 錨定行重現）', () => {
  it('走動關錨定：L1 全軸 1.0、L3 D=3.5、L6 D=5.0、L19 D=8.6', () => {
    expect(computeLevelAxes(levelOf(1), LEVELS)).toMatchObject({ d: 1.0, m: 1.0, p: 1.0 });
    expect(computeLevelAxes(levelOf(3), LEVELS).d).toBe(3.5);
    expect(computeLevelAxes(levelOf(6), LEVELS).d).toBe(5.0);
    expect(computeLevelAxes(levelOf(19), LEVELS).d).toBe(8.6);
  });

  it('M 軸錨定：L5=4.0、L19=8.6；P 軸錨定：L2=3.0、L18=7.9', () => {
    expect(computeLevelAxes(levelOf(5), LEVELS).m).toBe(4.0);
    expect(computeLevelAxes(levelOf(19), LEVELS).m).toBe(8.6);
    expect(computeLevelAxes(levelOf(2), LEVELS).p).toBe(3.0);
    expect(computeLevelAxes(levelOf(18), LEVELS).p).toBe(7.9);
  });

  it('魔王關錨定：L4＝3.5/3.5/3.8 總分 3.6、L20＝8.8/9.4/9.6 總分 9.2', () => {
    const jellord = computeLevelAxes(levelOf(4), LEVELS);
    expect(jellord).toMatchObject({ d: 3.5, m: 3.5, p: 3.8, kind: 'boss' });
    expect(jellord.total).toBe(3.6);
    const voidra = computeLevelAxes(levelOf(20), LEVELS);
    expect(voidra).toMatchObject({ d: 8.8, m: 9.4, p: 9.6 });
    expect(voidra.total).toBe(9.2);
  });

  it('非錨定魔王插值落於錨帶內且總分遞增（L4 < L7 < L12 < L16 < L20）', () => {
    const totals = BOSS_LEVEL_IDS.map((id) => computeLevelAxes(levelOf(id), LEVELS).total);
    for (let i = 1; i < totals.length; i += 1) {
      expect(totals[i]).toBeGreaterThan(totals[i - 1] ?? 0);
    }
  });

  it('總分＝0.4D+0.3M+0.3P（四捨五入一位）', () => {
    expect(weightedTotal(8.8, 9.4, 9.6)).toBe(9.2);
    expect(weightedTotal(3.5, 3.5, 3.8)).toBe(3.6);
  });

  it('量測修正：死亡/重試折入 P 軸且封頂 +1.5', () => {
    expect(measuredPDelta({})).toBe(0);
    expect(measuredPDelta({ deaths: 2 })).toBe(1.0);
    expect(measuredPDelta({ deaths: 9 })).toBe(1.5);
    expect(measuredPDelta({ segmentRetries: 2, fullRetries: 1 })).toBe(1.1);
    const base = computeLevelAxes(levelOf(1), LEVELS);
    const measured = computeLevelAxes(levelOf(1), LEVELS, { deaths: 2 });
    expect(measured.p).toBeCloseTo(base.pStatic + 1.0, 5);
    expect(measured.pStatic).toBe(base.pStatic);
  });

  it('全 20 關可計算且值域 1–10', () => {
    for (const level of LEVELS) {
      const axes = computeLevelAxes(level, LEVELS);
      for (const value of [axes.d, axes.m, axes.p, axes.total]) {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('魔王稽核事實表', () => {
  it('血量由 FSM SSOT 匯入（零漂移）', () => {
    const byBoss = Object.fromEntries(BOSS_AUDIT_FACTS.map((f) => [f.boss, f]));
    expect(byBoss['jellord']?.maxHp).toBe(60);
    expect(byBoss['noctra']?.maxHp).toBe(52);
    expect(byBoss['prismix']?.maxHp).toBe(80);
    expect(byBoss['syrona']?.maxHp).toBe(90);
    expect(byBoss['voidra']?.maxHp).toBe(110);
  });

  it('五王對應 BOSS_LEVEL_IDS', () => {
    expect(BOSS_AUDIT_FACTS.map((f) => f.levelId)).toEqual([...BOSS_LEVEL_IDS]);
  });

  it('telegraph 最小窗 ≥ 驗收門檻 600ms 的可核對來源', () => {
    const prismix = BOSS_AUDIT_FACTS.find((f) => f.boss === 'prismix');
    expect(prismix?.minTelegraphMs).toBe(500);
  });
});

describe('TRANSFORM_ADVANTAGE 變身優勢情境模板（#816 W2）', () => {
  it('T4 先落 Jellord/Noctra 兩王；王/關對映與稽核事實表一致', () => {
    expect(TRANSFORM_ADVANTAGE.map((s) => s.boss)).toEqual(['jellord', 'noctra']);
    for (const spec of TRANSFORM_ADVANTAGE) {
      const facts = BOSS_AUDIT_FACTS.find((f) => f.boss === spec.boss);
      expect(facts?.levelId).toBe(spec.levelId);
    }
  });

  it('supplyFlavor 映射 form 零漂移（eligibleForm ×3 守門）', () => {
    for (const spec of TRANSFORM_ADVANTAGE) {
      const slot = { flavor: spec.supplyFlavor, charged: false, gold: false } as const;
      expect(eligibleForm([slot, slot, slot])).toBe(spec.form);
    }
  });

  it('優勢非必需（anti-softlock）：供給味存在於該關補生、且該關驗收含 transform', () => {
    for (const spec of TRANSFORM_ADVANTAGE) {
      const level = levelOf(spec.levelId);
      const supplied = level.enemyMix.some(
        (entry) => inhaleFlavor(entry.kind) === spec.supplyFlavor,
      );
      expect(supplied, `L${spec.levelId} 補生缺 ${spec.supplyFlavor} 供給`).toBe(true);
      expect(level.bossApplies).toContain('transform');
    }
  });

  it('TTK 改善門檻引 SSOT（≥15%）', () => {
    expect(AUDIT_THRESHOLDS.transformTtkGainMinPct).toBeCloseTo(0.15, 5);
  });
});

describe('量測統計輔助', () => {
  it('percentile：p95 取上界樣本', () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(percentile(values, 0.95)).toBe(19);
    expect(percentile(values, 0.5)).toBe(10);
    expect(percentile([], 0.95)).toBe(0);
  });

  it('首見怪表：L1 全首見、後續重見不重複', () => {
    const map = firstSeenKinds(LEVELS);
    expect(map.get(1)?.has('jelly')).toBe(true);
    expect(map.get(2)?.has('jelly')).toBe(false);
  });

  it('序列熵：固定循環＝0（可背板）、隨機轉移 >0', () => {
    expect(sequenceEntropyBits(['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c'])).toBe(0);
    expect(
      sequenceEntropyBits(['a', 'b', 'a', 'c', 'a', 'b', 'a', 'c', 'a', 'c', 'a', 'b']),
    ).toBeGreaterThan(0.5);
    expect(sequenceEntropyBits(['a'])).toBe(0);
  });
});
