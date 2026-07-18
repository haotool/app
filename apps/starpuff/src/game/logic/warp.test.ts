import { describe, expect, it } from 'vitest';
import { WARP, tryWarp, warpExitOf, type WarpGate } from './warp';

const gates: WarpGate[] = [
  { x: 900, y: 360, pairId: 'a' },
  { x: 2200, y: 360, pairId: 'a' },
  { x: 2600, y: 360, pairId: 'b' },
  { x: 3050, y: 176, pairId: 'b' },
];

describe('warpExitOf 配對（§65）', () => {
  it('同 pairId 兩門互為出口', () => {
    expect(warpExitOf(gates, gates[0]!)).toBe(gates[1]);
    expect(warpExitOf(gates, gates[1]!)).toBe(gates[0]);
    expect(warpExitOf(gates, gates[3]!)).toBe(gates[2]);
  });

  it('孤門（無配對）回 null', () => {
    const orphan: WarpGate = { x: 100, y: 100, pairId: 'solo' };
    expect(warpExitOf([...gates, orphan], orphan)).toBeNull();
  });
});

describe('tryWarp 進門判定與冷卻（§65）', () => {
  it('觸發半徑內命中回出口並啟動冷卻', () => {
    const result = tryWarp(gates, 905, 355, 1000, 0);
    expect(result.exit).toBe(gates[1]);
    expect(result.lockedUntilMs).toBe(1000 + WARP.cooldownMs);
  });

  it('觸發半徑邊界（恰 40px）命中；半徑外不觸發', () => {
    const onEdge = tryWarp(gates, 900 + WARP.triggerRadiusPx, 360, 0, 0);
    expect(onEdge.exit).toBe(gates[1]);
    const outside = tryWarp(gates, 900 + WARP.triggerRadiusPx + 1, 360, 0, 0);
    expect(outside.exit).toBeNull();
  });

  it('冷卻期內任何門皆不觸發（防彈跳循環）', () => {
    const locked = tryWarp(gates, 2200, 360, 1200, 1500);
    expect(locked.exit).toBeNull();
    expect(locked.lockedUntilMs).toBe(1500);
  });

  it('冷卻期滿恢復觸發', () => {
    const result = tryWarp(gates, 2200, 360, 1500, 1500);
    expect(result.exit).toBe(gates[0]);
  });

  it('孤門命中不傳送（資料防呆）', () => {
    const orphan: WarpGate = { x: 500, y: 360, pairId: 'solo' };
    const result = tryWarp([...gates, orphan], 500, 360, 0, 0);
    expect(result.exit).toBeNull();
  });
});
