import { describe, expect, it } from 'vitest';
import { freshnessVerdict, MECHANIC_EXCLUDES, MECHANIC_PATHS } from './auditFreshness';

// 量測基準新鮮度裁決守門：audit 報告的數字是平衡決策依據，機制變更後必須能
// 機械判定其失效。真實案例——l28-tf-high 測於 #953（變身資格放寬）與 #965
// （星暴對魔王恆 0 傷修復）之前，TTK 已不可比卻仍被引用為現況。

describe('freshnessVerdict 新鮮度裁決', () => {
  it('指紋與當前一致＝新鮮（不需查提交）', () => {
    expect(freshnessVerdict('abc1234', 'abc1234', null)).toBe('fresh');
  });

  it('指紋不同但其後無機制提交＝新鮮（純呈現層改動不作廢量測）', () => {
    expect(freshnessVerdict('abc1234', 'def5678', [])).toBe('fresh');
  });

  it('其後有機制提交＝過時', () => {
    expect(freshnessVerdict('abc1234', 'def5678', [{ sha: 'x', subject: '改魔王' }])).toBe('stale');
  });

  it('報告無指紋＝unknown（守門導入前的舊報告不得默認為新鮮）', () => {
    expect(freshnessVerdict(undefined, 'abc1234', [])).toBe('unknown');
    expect(freshnessVerdict('unknown', 'abc1234', [])).toBe('unknown');
  });

  it('無法比對（git 失敗）＝unknown，不得誤判為新鮮', () => {
    expect(freshnessVerdict('abc1234', 'def5678', null)).toBe('unknown');
  });
});

describe('MECHANIC_PATHS 涵蓋面', () => {
  it('涵蓋決定戰鬥數值與時序的三處來源', () => {
    expect(MECHANIC_PATHS).toContain('apps/starpuff/src/game/logic');
    expect(MECHANIC_PATHS).toContain('apps/starpuff/src/game/systems');
    expect(MECHANIC_PATHS).toContain('apps/starpuff/src/game/core/config.ts');
  });

  // 呈現層刻意不納入：純視覺改動若作廢全部報告，訊號會被稀釋成雜訊。
  it('不納入純呈現層路徑', () => {
    expect(MECHANIC_PATHS.some((p) => p.includes('/fx') || p.includes('style'))).toBe(false);
  });

  // 測試檔與機制同住 logic/、systems/，但不改變遊戲行為。本守門導入當下即自證：
  // 新增本檔令 21 份報告全數誤判過時——排除 pathspec 移除後此案必紅。
  it('排除測試檔：補測試不得作廢量測基準', () => {
    expect(MECHANIC_EXCLUDES).toContain(':(exclude)**/*.test.ts');
  });
});
