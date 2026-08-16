import type { ControlsState } from '../systems/controls';
import type { TransformForm } from './types';

export type GuidedTutorialStatus = 'unseen' | 'skipped' | 'completed';

export type TutorialStep = 'move' | 'jump' | 'inhale' | 'shoot' | 'slam-shelly' | 'transform';

export interface TutorialObservation {
  input: Pick<ControlsState, 'left' | 'right' | 'down' | 'jumpPressed' | 'actionPressed'>;
  playerX: number;
  airborne: boolean;
  inhaledKind?: string;
  fired: boolean;
  slamLanded: boolean;
  slamTargetHit: boolean;
  transformForm: TransformForm | null;
}

export interface TutorialState {
  step: TutorialStep;
  originX: number;
  minX: number;
  maxX: number;
  jumped: boolean;
  inhaled: boolean;
  fired: boolean;
  slamLanded: boolean;
  slamTargetHit: boolean;
  transformForm: TransformForm | null;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  'move',
  'jump',
  'inhale',
  'shoot',
  'slam-shelly',
  'transform',
];

export const TUTORIAL_MOVE_DISTANCE = 36;

export function createTutorialState(originX: number): TutorialState {
  return {
    step: 'move',
    originX,
    minX: originX,
    maxX: originX,
    jumped: false,
    inhaled: false,
    fired: false,
    slamLanded: false,
    slamTargetHit: false,
    transformForm: null,
  };
}

function stepComplete(state: TutorialState): boolean {
  switch (state.step) {
    case 'move':
      return (
        state.originX - state.minX >= TUTORIAL_MOVE_DISTANCE &&
        state.maxX - state.originX >= TUTORIAL_MOVE_DISTANCE
      );
    case 'jump':
      return state.jumped;
    case 'inhale':
      return state.inhaled;
    case 'shoot':
      return state.fired;
    case 'slam-shelly':
      return state.slamLanded && state.slamTargetHit;
    case 'transform':
      return state.transformForm !== null;
  }
}

export function observeTutorial(
  state: TutorialState,
  observation: TutorialObservation,
): TutorialState {
  const next: TutorialState = {
    ...state,
    minX: Math.min(state.minX, observation.playerX),
    maxX: Math.max(state.maxX, observation.playerX),
    jumped: state.jumped || observation.airborne,
    inhaled: state.inhaled || observation.inhaledKind !== undefined,
    fired: state.fired || observation.fired,
    slamLanded: state.slamLanded || observation.slamLanded,
    slamTargetHit: state.slamTargetHit || observation.slamTargetHit,
    transformForm: state.transformForm ?? observation.transformForm,
  };
  return next;
}

export function isTutorialStepComplete(state: TutorialState): boolean {
  return stepComplete(state);
}

export function advanceTutorial(state: TutorialState): TutorialState | null {
  if (!stepComplete(state)) return null;
  const index = TUTORIAL_STEPS.indexOf(state.step);
  const nextStep = TUTORIAL_STEPS[index + 1];
  if (nextStep === undefined) return null;
  return {
    ...createTutorialState(state.maxX),
    step: nextStep,
  };
}

export function isLastTutorialStep(state: TutorialState): boolean {
  return state.step === TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];
}
