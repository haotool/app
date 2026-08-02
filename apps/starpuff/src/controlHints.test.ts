import { describe, expect, it } from 'vitest';
import { controlHintSettingsOf, isTouchCapable, shouldShowControlHints } from './controlHints';

describe('controlHints 新手提示策略（首次五場）', () => {
  it('只在開啟且尚未完成五場時顯示', () => {
    expect(shouldShowControlHints({ controlHintsEnabled: true, controlHintsPlayCount: 0 })).toBe(
      true,
    );
    expect(shouldShowControlHints({ controlHintsEnabled: true, controlHintsPlayCount: 4 })).toBe(
      true,
    );
    expect(shouldShowControlHints({ controlHintsEnabled: true, controlHintsPlayCount: 5 })).toBe(
      false,
    );
    expect(shouldShowControlHints({ controlHintsEnabled: false, controlHintsPlayCount: 0 })).toBe(
      false,
    );
  });

  it('只把觸控點或 touch event 當作觸控能力', () => {
    expect(isTouchCapable({ maxTouchPoints: 1 })).toBe(true);
    expect(isTouchCapable({ hasTouchEvent: true })).toBe(true);
    expect(isTouchCapable({ maxTouchPoints: 0, hasTouchEvent: false })).toBe(false);
  });

  it('從 UserSettings 投影教學欄位，不把其他偏好混入策略', () => {
    expect(
      controlHintSettingsOf({
        schemaVersion: 1,
        audioMuted: false,
        hapticsEnabled: true,
        wakeLockEnabled: true,
        reducedMotion: false,
        controlHintsEnabled: false,
        controlHintsPlayCount: 3,
        screenShake: 'full',
        shellRotation: null,
        keyLayout: null,
      }),
    ).toEqual({ controlHintsEnabled: false, controlHintsPlayCount: 3 });
  });
});
