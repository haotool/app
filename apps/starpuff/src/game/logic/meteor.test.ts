import { describe, expect, it } from 'vitest';
import { METEOR, advanceMeteorTimer, meteorSpawnY, pickMeteorX } from './meteor';

describe('流星雨純邏輯（§78 / 主計畫 §10.2-7）', () => {
  it('預警時長 ≥0.7s（anti-softlock 不變式）且同屏上限 3', () => {
    expect(METEOR.telegraphMs).toBeGreaterThanOrEqual(700);
    expect(METEOR.maxOnScreen).toBe(3);
    expect(METEOR.gateClearancePx).toBe(120);
    expect(METEOR.playerClearancePx).toBe(48);
  });

  it('advanceMeteorTimer：間隔未到不發波，到期發波並歸零', () => {
    let result = advanceMeteorTimer(0, 4499, 4500);
    expect(result.wave).toBe(false);
    expect(result.timerMs).toBe(4499);
    result = advanceMeteorTimer(result.timerMs, 1, 4500);
    expect(result.wave).toBe(true);
    expect(result.timerMs).toBe(0);
  });

  it('pickMeteorX：無排除帶時沿範圍線性映射', () => {
    expect(pickMeteorX(0, 100, 500, [])).toBe(100);
    expect(pickMeteorX(0.5, 100, 500, [])).toBe(300);
    expect(pickMeteorX(1, 100, 500, [])).toBeCloseTo(500, 0);
  });

  it('pickMeteorX：排除帶被挖除，落點永不落入帶內', () => {
    const exclusions = [{ center: 300, halfWidthPx: 48 }];
    for (const rand of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999]) {
      const x = pickMeteorX(rand, 100, 500, exclusions);
      expect(x).not.toBeNull();
      if (x === null) continue;
      expect(Math.abs(x - 300)).toBeGreaterThanOrEqual(48);
      expect(x).toBeGreaterThanOrEqual(100);
      expect(x).toBeLessThanOrEqual(500);
    }
  });

  it('pickMeteorX：多重排除帶（門前 ±120＋玩家 ±48）同時挖除', () => {
    const exclusions = [
      { center: 460, halfWidthPx: METEOR.gateClearancePx },
      { center: 200, halfWidthPx: METEOR.playerClearancePx },
    ];
    for (const rand of [0, 0.3, 0.6, 0.99]) {
      const x = pickMeteorX(rand, 100, 500, exclusions);
      expect(x).not.toBeNull();
      if (x === null) continue;
      expect(Math.abs(x - 460)).toBeGreaterThanOrEqual(120);
      expect(Math.abs(x - 200)).toBeGreaterThanOrEqual(48);
    }
  });

  it('pickMeteorX：範圍被排除帶完全覆蓋時回 null（該顆棄投）', () => {
    expect(pickMeteorX(0.5, 100, 300, [{ center: 200, halfWidthPx: 150 }])).toBeNull();
    expect(pickMeteorX(0.5, 300, 100, [])).toBeNull();
  });

  it('meteorSpawnY：telegraph 結束瞬間著地（墜速×預警反推，低重力不延後）', () => {
    const impactY = 392;
    const spawnY = meteorSpawnY(impactY);
    expect(spawnY).toBe(impactY - (METEOR.fallSpeedPxPerSec * METEOR.telegraphMs) / 1000);
    const fallMs = ((impactY - spawnY) / METEOR.fallSpeedPxPerSec) * 1000;
    expect(fallMs).toBeCloseTo(METEOR.telegraphMs, 5);
  });
});
