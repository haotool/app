import { describe, expect, it } from 'vitest';
import { POOL_TRANSIENT_FLAGS, resetTransientFlags } from './poolFlags';

// 池瞬時旗標 SSOT 守門（PR #886）：已知的一次性互動旗標必須全數在冊，
// 且 resetTransientFlags 對在冊旗標逐一歸位 false。

describe('poolFlags（池瞬時旗標 SSOT）', () => {
  it('已知互動旗標全數在冊', () => {
    for (const flag of ['tideDeflected', 'reflected', 'burn', 'inhalable']) {
      expect(POOL_TRANSIENT_FLAGS).toContain(flag);
    }
  });

  it('resetTransientFlags 將在冊旗標全部歸位 false', () => {
    const data = new Map<string, unknown>(POOL_TRANSIENT_FLAGS.map((flag) => [flag, true]));
    resetTransientFlags({ setData: (key, value) => data.set(key, value) });
    for (const flag of POOL_TRANSIENT_FLAGS) expect(data.get(flag)).toBe(false);
  });
});
