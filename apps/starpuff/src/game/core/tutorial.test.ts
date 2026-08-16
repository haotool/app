import { describe, expect, it } from 'vitest';
import {
  advanceTutorial,
  createTutorialState,
  isLastTutorialStep,
  isTutorialStepComplete,
  observeTutorial,
} from './tutorial';

const observation = (overrides: Partial<Parameters<typeof observeTutorial>[1]> = {}) => ({
  input: { left: false, right: false, down: false, jumpPressed: false, actionPressed: false },
  playerX: 100,
  airborne: false,
  fired: false,
  slamLanded: false,
  slamTargetHit: false,
  transformForm: null,
  ...overrides,
});

describe('guided tutorial reducer', () => {
  it('requires movement in both directions', () => {
    let state = createTutorialState(100);
    state = observeTutorial(state, observation({ playerX: 140 }));
    expect(isTutorialStepComplete(state)).toBe(false);
    state = observeTutorial(state, observation({ playerX: 64 }));
    expect(isTutorialStepComplete(state)).toBe(true);
    expect(advanceTutorial(state)?.step).toBe('jump');
  });

  it('does not unlock a step from the next button or unrelated input', () => {
    const state = createTutorialState(100);
    expect(advanceTutorial(state)).toBeNull();
    expect(isTutorialStepComplete(observeTutorial(state, observation({ fired: true })))).toBe(
      false,
    );
  });

  it('requires a real jump, inhale, and shot event', () => {
    let state = createTutorialState(100);
    state = observeTutorial(state, observation({ playerX: 140 }));
    state = observeTutorial(state, observation({ playerX: 64 }));
    state = advanceTutorial(state)!;
    state = observeTutorial(state, observation({ airborne: true }));
    expect(advanceTutorial(state)?.step).toBe('inhale');
    state = advanceTutorial(state)!;
    state = observeTutorial(state, observation({ inhaledKind: 'jelly' }));
    state = advanceTutorial(state)!;
    state = observeTutorial(state, observation({ fired: true }));
    expect(advanceTutorial(state)?.step).toBe('slam-shelly');
  });

  it('requires both slam landing and Shelly hit', () => {
    let state = createTutorialState(100);
    state = { ...state, step: 'slam-shelly' };
    expect(isTutorialStepComplete(observeTutorial(state, observation({ slamLanded: true })))).toBe(
      false,
    );
    expect(
      isTutorialStepComplete(
        observeTutorial(state, observation({ slamLanded: true, slamTargetHit: true })),
      ),
    ).toBe(true);
  });

  it('requires a real transform form, not only a transform key press', () => {
    let state = createTutorialState(100);
    state = { ...state, step: 'transform' };
    expect(isTutorialStepComplete(observeTutorial(state, observation()))).toBe(false);
    const completed = observeTutorial(state, observation({ transformForm: 'gale' }));
    expect(isTutorialStepComplete(completed)).toBe(true);
    expect(isLastTutorialStep(completed)).toBe(true);
  });
});
