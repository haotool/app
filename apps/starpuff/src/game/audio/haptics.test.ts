import { describe, expect, it } from 'vitest';
import { HAPTIC_PATTERNS } from './haptics';

describe('HAPTIC_PATTERNS（§91 觸覺回饋查表）', () => {
  it('重擊與里程碑事件配震動', () => {
    for (const name of ['hurt', 'slam-down', 'boss-slam', 'boss-roar', 'win', 'lose'] as const) {
      expect(HAPTIC_PATTERNS[name]).toBeDefined();
    }
  });

  it('高頻一般音效不震（防疲勞）：跳躍、發射、腳步、命中', () => {
    for (const name of ['jump', 'flap', 'footstep', 'shoot', 'hit', 'pop'] as const) {
      expect(HAPTIC_PATTERNS[name]).toBeUndefined();
    }
  });

  it('震動長度節制（單段 ≤100ms、總長 ≤200ms），避免耗電與干擾', () => {
    for (const pattern of Object.values(HAPTIC_PATTERNS)) {
      const segments = Array.isArray(pattern) ? pattern : [pattern];
      for (const ms of segments) expect(ms).toBeLessThanOrEqual(100);
      expect(segments.reduce((sum, ms) => sum + ms, 0)).toBeLessThanOrEqual(200);
    }
  });
});
