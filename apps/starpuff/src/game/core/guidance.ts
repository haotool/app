import type { ControlsState } from '../systems/controls';
import type { TransformForm } from './types';

import type { LearningLessonId } from './learning';

export type GuidanceLessonId = LearningLessonId;
export type GuidanceFeatureId = LearningLessonId;

/**
 * 情境提示 reducer 只描述「怎麼判定玩家真的做到了」；lesson ID 由 learning SSOT
 * 提供，避免練習區與正常關卡各自維護一份功能清單。
 */

export interface GuidanceObservation {
  input: Pick<ControlsState, 'left' | 'right' | 'down' | 'jumpPressed' | 'actionPressed'>;
  playerX: number;
  airborne: boolean;
  ammo: number;
  inhaled: boolean;
  fired: boolean;
  slamLanded: boolean;
  slamTargetHit: boolean;
  transformForm: TransformForm | null;
  featureUsed?: GuidanceFeatureId;
}

export interface GuidanceState {
  activeLesson: GuidanceLessonId | null;
  originX: number;
  minX: number;
  maxX: number;
  jumped: boolean;
  inhaled: boolean;
  fired: boolean;
  slamLanded: boolean;
  slamTargetHit: boolean;
  transformForm: TransformForm | null;
  featureUsed: GuidanceFeatureId | null;
  completedLessons: readonly GuidanceLessonId[];
}

export const GUIDANCE_MOVE_DISTANCE = 36;

export function createGuidanceState(
  originX: number,
  completedLessons: readonly GuidanceLessonId[] = [],
): GuidanceState {
  return {
    activeLesson: null,
    originX,
    minX: originX,
    maxX: originX,
    jumped: false,
    inhaled: false,
    fired: false,
    slamLanded: false,
    slamTargetHit: false,
    transformForm: null,
    featureUsed: null,
    completedLessons: [...new Set(completedLessons)],
  };
}

export function beginGuidanceLesson(
  state: GuidanceState,
  lesson: GuidanceLessonId,
  originX: number,
): GuidanceState {
  return {
    ...createGuidanceState(originX, state.completedLessons),
    activeLesson: lesson,
  };
}

function isFormLesson(lesson: GuidanceLessonId): lesson is `form-${TransformForm}` {
  return lesson.startsWith('form-');
}

function lessonComplete(state: GuidanceState): boolean {
  const lesson = state.activeLesson;
  if (lesson === null) return false;
  switch (lesson) {
    case 'move':
      return (
        state.originX - state.minX >= GUIDANCE_MOVE_DISTANCE &&
        state.maxX - state.originX >= GUIDANCE_MOVE_DISTANCE
      );
    case 'jump':
      return state.jumped;
    case 'inhale':
      return state.inhaled;
    case 'shoot':
      return state.fired;
    case 'inhale-shoot':
      return state.inhaled && state.fired;
    case 'slam-shelly':
    case 'slam':
      return state.slamLanded && state.slamTargetHit;
    case 'transform':
      return state.transformForm !== null;
    default:
      if (isFormLesson(lesson)) {
        return state.transformForm === lesson.slice('form-'.length);
      }
      return state.featureUsed === lesson;
  }
}

export function observeGuidance(
  state: GuidanceState,
  observation: GuidanceObservation,
): GuidanceState {
  if (state.activeLesson === null) return state;
  const complete = lessonComplete({
    ...state,
    minX: Math.min(state.minX, observation.playerX),
    maxX: Math.max(state.maxX, observation.playerX),
    jumped: state.jumped || observation.airborne,
    inhaled: state.inhaled || observation.inhaled,
    fired: state.fired || observation.fired,
    slamLanded: state.slamLanded || observation.slamLanded,
    slamTargetHit: state.slamTargetHit || observation.slamTargetHit,
    transformForm: state.transformForm ?? observation.transformForm,
    featureUsed: observation.featureUsed ?? state.featureUsed,
  });
  const next: GuidanceState = {
    ...state,
    minX: Math.min(state.minX, observation.playerX),
    maxX: Math.max(state.maxX, observation.playerX),
    jumped: state.jumped || observation.airborne,
    inhaled: state.inhaled || observation.inhaled,
    fired: state.fired || observation.fired,
    slamLanded: state.slamLanded || observation.slamLanded,
    slamTargetHit: state.slamTargetHit || observation.slamTargetHit,
    transformForm: state.transformForm ?? observation.transformForm,
    featureUsed: observation.featureUsed ?? state.featureUsed,
  };
  if (!complete || next.completedLessons.includes(state.activeLesson)) return next;
  return {
    ...next,
    completedLessons: [...next.completedLessons, state.activeLesson],
  };
}

export function isGuidanceLessonComplete(state: GuidanceState): boolean {
  return state.activeLesson !== null && state.completedLessons.includes(state.activeLesson);
}

export function dismissGuidanceLesson(state: GuidanceState): GuidanceState {
  return { ...state, activeLesson: null };
}
