import { describe, expect, it } from 'vitest';
import { LEVELS } from '../logic/levels';
import {
  FOUNDATION_LESSONS,
  getLearningSpec,
  LEARNING_LESSONS,
  mapMechanicToLearningLesson,
  PRACTICE_STEPS,
} from './learning';

describe('learning SSOT', () => {
  it('practice 與情境模式共用同一組 lesson 定義與素材', () => {
    expect(new Set(PRACTICE_STEPS).size).toBe(PRACTICE_STEPS.length);
    for (const step of PRACTICE_STEPS) {
      const spec = getLearningSpec(step);
      expect(spec.id).toBe(step);
      expect(spec.copy.focus).toBeTruthy();
      expect(spec.practice?.image).toBeTruthy();
    }
  });

  it('每個關卡 teaches 都能映射到 registry，不另建第二套功能清單', () => {
    for (const level of LEVELS) {
      for (const mechanic of level.teaches ?? []) {
        const lesson = mapMechanicToLearningLesson(mechanic);
        expect(LEARNING_LESSONS[lesson], `${level.id}:${mechanic}`).toBeDefined();
      }
    }
  });

  it('基礎操作只在 entry registry 定義一次且不重複', () => {
    expect(new Set(FOUNDATION_LESSONS).size).toBe(FOUNDATION_LESSONS.length);
    expect(FOUNDATION_LESSONS).toEqual(['move', 'jump', 'inhale-shoot']);
  });

  it('Shelly 機制映射到需要真實命中的下砸 lesson', () => {
    expect(mapMechanicToLearningLesson('slam')).toBe('slam-shelly');
    expect(getLearningSpec('slam-shelly').copy.focus).toBe('#joy-zone');
    expect(getLearningSpec('slam-shelly').copy.coachmarkPlacement).toBe('safe-top');
  });

  it('變身步驟明確教靠近每顆星，且把場景目標留在提示下方', () => {
    const copy = getLearningSpec('transform').copy;
    expect(copy.touch).toContain('食指長按');
    expect(copy.touch).toContain('靠近每顆');
    expect(copy.touch).toContain('三顆');
    expect(copy.coachmarkPlacement).toBe('safe-top');
  });

  it('行動版文案以位置、顏色與形狀描述控制，不依賴 A/B 字母', () => {
    const latinButtonLabels = /\b(?:A|B|TF|SP)\b/;
    for (const spec of Object.values(LEARNING_LESSONS)) {
      if (!spec) continue;
      expect(spec.copy.touch).not.toMatch(latinButtonLabels);
      if (spec.practice) {
        expect(spec.practice.touch).not.toMatch(latinButtonLabels);
        if (spec.practice.tip) expect(spec.practice.tip.touch).not.toMatch(latinButtonLabels);
      }
    }
  });

  it('練習步驟都提供與實際虛擬鍵對應的行動版 token', () => {
    for (const step of PRACTICE_STEPS) {
      const spec = getLearningSpec(step);
      expect(spec.practice?.touchControls ?? spec.copy.touchControls, step).toBeTruthy();
    }
  });
});
