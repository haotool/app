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
  });
});
