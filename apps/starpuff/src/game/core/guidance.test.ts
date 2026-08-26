import { describe, expect, it } from 'vitest';
import {
  beginGuidanceLesson,
  createGuidanceState,
  dismissGuidanceLesson,
  isGuidanceLessonComplete,
  observeGuidance,
} from './guidance';

const observation = (overrides: Partial<Parameters<typeof observeGuidance>[1]> = {}) => ({
  input: { left: false, right: false, down: false, jumpPressed: false, actionPressed: false },
  playerX: 100,
  airborne: false,
  ammo: 0,
  inhaled: false,
  fired: false,
  slamLanded: false,
  slamTargetHit: false,
  transformForm: null,
  ...overrides,
});

describe('情境提示 reducer', () => {
  it('只有實際向左與向右移動都達標才完成移動 lesson', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'move', 100);
    state = observeGuidance(state, observation({ playerX: 140 }));
    expect(isGuidanceLessonComplete(state)).toBe(false);
    state = observeGuidance(state, observation({ playerX: 64 }));
    expect(isGuidanceLessonComplete(state)).toBe(true);
    expect(state.completedLessons).toContain('move');
  });

  it('不會因為不相關輸入或提示本身提前完成', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'jump', 100);
    state = observeGuidance(state, observation({ fired: true, inhaled: true }));
    expect(isGuidanceLessonComplete(state)).toBe(false);
  });

  it('下砸必須同時有落地與 Shelly 命中', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'slam-shelly', 100);
    state = observeGuidance(state, observation({ slamLanded: true }));
    expect(isGuidanceLessonComplete(state)).toBe(false);
    state = observeGuidance(state, observation({ slamTargetHit: true }));
    expect(isGuidanceLessonComplete(state)).toBe(true);
  });

  it('變身必須收到真實形態，不接受只有 TF 按鍵的觀測', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'transform', 100);
    state = observeGuidance(state, observation({ input: { ...observation().input } }));
    expect(isGuidanceLessonComplete(state)).toBe(false);
    state = observeGuidance(state, observation({ transformForm: 'gale' }));
    expect(isGuidanceLessonComplete(state)).toBe(true);
  });

  it('feature lesson 只接受相同功能的實際事件', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'updraft', 100);
    state = observeGuidance(state, observation({ featureUsed: 'warp' }));
    expect(isGuidanceLessonComplete(state)).toBe(false);
    state = observeGuidance(state, observation({ featureUsed: 'updraft' }));
    expect(isGuidanceLessonComplete(state)).toBe(true);
  });

  it('可關閉目前提示，但不會清掉已完成 lesson', () => {
    let state = beginGuidanceLesson(createGuidanceState(100), 'jump', 100);
    state = observeGuidance(state, observation({ airborne: true }));
    state = dismissGuidanceLesson(state);
    expect(state.activeLesson).toBeNull();
    expect(state.completedLessons).toContain('jump');
  });
});
