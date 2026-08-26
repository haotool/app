import type Phaser from 'phaser';
import { GameEvents, offGameEvent, onGameEvent } from '../core/events';
import {
  beginGuidanceLesson,
  createGuidanceState,
  dismissGuidanceLesson,
  isGuidanceLessonComplete,
  observeGuidance,
  type GuidanceFeatureId,
  type GuidanceLessonId,
  type GuidanceState,
} from '../core/guidance';
import {
  FOUNDATION_LESSONS,
  getLearningSpec,
  mapMechanicToLearningLesson,
  type LearningCopy,
} from '../core/learning';
import { loadSettings, markGuidanceLessonCompleted, type UserSettings } from '../core/settings';
import type { LevelSpec } from '../logic/levels';
import type { TransformForm } from '../core/types';
import { TUTORIAL_ANGEL_ILLUSTRATION_URL } from '../../onboardingAssets';
import type { ControlsSystem } from './controls';
import type { EnemySystem } from './enemies';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { StageHandle } from './stage';
import type { TideHandle } from './tide';
import {
  addLearningCoachmarkViewportListeners,
  clearLearningFocus,
  positionLearningCoachmark,
} from './learningCoachmark';

const isDesktop = (): boolean =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('sp-desktop');

const copyFor = (lesson: GuidanceLessonId): LearningCopy => getLearningSpec(lesson).copy;

export interface GuidanceDirectorHooks {
  player: () => PlayerHandle;
  controls: () => ControlsSystem;
  enemies: () => EnemySystem;
  level: () => LevelSpec;
  stage: () => StageHandle;
  tide: () => TideHandle | null;
  meteor: () => MeteorSystem | null;
}

export interface GuidanceDirectorHandle {
  update(deltaMs: number): void;
  destroy(): void;
}

export function createGuidanceDirector(
  scene: Phaser.Scene,
  hooks: GuidanceDirectorHooks,
): GuidanceDirectorHandle {
  const settings: UserSettings = loadSettings();
  if (!settings.guidanceEnabled) return { update: () => undefined, destroy: () => undefined };

  let state: GuidanceState = createGuidanceState(
    hooks.player().sprite.x,
    settings.guidanceCompletedLessons as GuidanceLessonId[],
  );
  let root: HTMLDivElement | null = null;
  let elapsedMs = 0;
  let successUntilMs = 0;
  let startAfterMs = 900;
  let lastRenderKey = '';
  let lastSlamAtMs = -Infinity;
  let meteorTelegraphSeen = false;
  const dismissedThisLevel = new Set<GuidanceLessonId>();
  const unbinders: (() => void)[] = [];

  const candidateLessons = (): GuidanceLessonId[] => {
    const level = hooks.level();
    if (level.id === 1) return [...FOUNDATION_LESSONS];
    return (level.teaches ?? []).map(mapMechanicToLearningLesson);
  };

  const focusSelector = (): string | undefined =>
    state.activeLesson === null ? undefined : copyFor(state.activeLesson).focus;

  const clearFocus = (): void => {
    clearLearningFocus();
  };

  const render = (force = false): void => {
    if (!root) return;
    const lesson = state.activeLesson;
    const complete = isGuidanceLessonComplete(state);
    const key = `${lesson ?? 'none'}:${complete ? 'success' : 'active'}:${isDesktop() ? 'desktop' : 'touch'}`;
    if (!force && key === lastRenderKey) return;
    lastRenderKey = key;
    clearFocus();
    root.innerHTML = '';
    root.hidden = lesson === null;
    if (lesson === null) return;

    const copy = copyFor(lesson);
    const card = document.createElement('aside');
    card.className = `learning-coachmark-card guidance-angel-card${complete ? ' is-success' : ''}`;
    card.dataset['learningCard'] = 'true';
    card.dataset['learningLesson'] = lesson;
    card.setAttribute('aria-label', `小天使提示：${copy.title}`);
    const angel = document.createElement('img');
    angel.className = 'guidance-angel-avatar';
    angel.src = TUTORIAL_ANGEL_ILLUSTRATION_URL;
    angel.alt = '';
    card.appendChild(angel);
    const body = document.createElement('div');
    body.className = 'guidance-angel-body';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'guidance-angel-eyebrow';
    eyebrow.textContent = complete ? '學會了' : '小天使提醒';
    body.appendChild(eyebrow);
    const title = document.createElement('strong');
    title.className = 'guidance-angel-title';
    title.textContent = complete ? copy.success : copy.title;
    body.appendChild(title);
    if (!complete) {
      const instruction = document.createElement('p');
      instruction.className = 'guidance-angel-instruction';
      instruction.textContent = isDesktop() ? copy.desktop : copy.touch;
      body.appendChild(instruction);
      if (copy.tip) {
        const tip = document.createElement('p');
        tip.className = 'guidance-angel-tip';
        tip.textContent = copy.tip;
        body.appendChild(tip);
      }
    }
    card.appendChild(body);
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'guidance-angel-dismiss';
    dismiss.dataset['guidance'] = 'dismiss';
    dismiss.setAttribute('aria-label', '稍後再提醒');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => {
      if (state.activeLesson === null) return;
      dismissedThisLevel.add(state.activeLesson);
      state = dismissGuidanceLesson(state);
      clearFocus();
      render(true);
    });
    card.appendChild(dismiss);
    root.appendChild(card);
    positionLearningCoachmark(root, copy.focus);
    const selector = focusSelector();
    if (!complete && selector) document.querySelector(selector)?.classList.add('learning-focus');
  };

  const observation = (extra: Partial<Parameters<typeof observeGuidance>[1]> = {}) => {
    const body = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
    return {
      input: hooks.controls().state,
      playerX: hooks.player().sprite.x,
      airborne: !(body.blocked.down || body.touching.down),
      ammo: hooks.player().getAmmoState().ammo,
      inhaled: false,
      fired: false,
      slamLanded: false,
      slamTargetHit: false,
      transformForm: hooks.player().getTransformState().form,
      ...extra,
    };
  };

  const consumeObservation = (extra: Partial<Parameters<typeof observeGuidance>[1]> = {}): void => {
    if (state.activeLesson === null || successUntilMs > elapsedMs) return;
    const active = state.activeLesson;
    state = observeGuidance(state, observation(extra));
    if (!isGuidanceLessonComplete(state)) return;
    markGuidanceLessonCompleted(active);
    successUntilMs = elapsedMs + 850;
    render(true);
  };

  const onInhaled = (): void => consumeObservation({ inhaled: true });
  const onFired = (): void => consumeObservation({ fired: true });
  const onSlam = (): void => {
    lastSlamAtMs = elapsedMs;
    consumeObservation({ slamLanded: true, featureUsed: 'slam' });
  };
  const onKilled = ({ kind, x, y }: { kind: string; x: number; y: number }): void => {
    if (kind !== 'shelly' || elapsedMs - lastSlamAtMs > 850) return;
    const player = hooks.player().sprite;
    if (Math.hypot(player.x - x, player.y - y) < 120) consumeObservation({ slamTargetHit: true });
  };
  const onShield = (): void => consumeObservation({ featureUsed: 'shell-shield' });
  const onStarburst = ({ phase }: { phase: 'none' | 'charged' | 'detonating' }): void => {
    if (phase === 'detonating') consumeObservation({ featureUsed: 'starburst' });
  };
  const onStarstorm = (): void => consumeObservation({ featureUsed: 'starburst' });
  const onFeature = ({ feature }: { feature: GuidanceFeatureId }): void =>
    consumeObservation({ featureUsed: feature });
  const onTransformStrike = ({ form }: { form: TransformForm }): void =>
    consumeObservation({ transformForm: form, featureUsed: `form-${form}` });

  onGameEvent(scene.events, GameEvents.ENEMY_INHALED, onInhaled);
  onGameEvent(scene.events, GameEvents.STAR_FIRED, onFired);
  onGameEvent(scene.events, GameEvents.SKILL_SLAM_LANDED, onSlam);
  onGameEvent(scene.events, GameEvents.ENEMY_KILLED, onKilled);
  onGameEvent(scene.events, GameEvents.SKILL_SHIELD_BLOCK, onShield);
  onGameEvent(scene.events, GameEvents.STARBURST_CHANGED, onStarburst);
  onGameEvent(scene.events, GameEvents.SKILL_STARSTORM, onStarstorm);
  onGameEvent(scene.events, GameEvents.GUIDANCE_FEATURE_USED, onFeature);
  onGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, onTransformStrike);
  unbinders.push(
    () => offGameEvent(scene.events, GameEvents.ENEMY_INHALED, onInhaled),
    () => offGameEvent(scene.events, GameEvents.STAR_FIRED, onFired),
    () => offGameEvent(scene.events, GameEvents.SKILL_SLAM_LANDED, onSlam),
    () => offGameEvent(scene.events, GameEvents.ENEMY_KILLED, onKilled),
    () => offGameEvent(scene.events, GameEvents.SKILL_SHIELD_BLOCK, onShield),
    () => offGameEvent(scene.events, GameEvents.STARBURST_CHANGED, onStarburst),
    () => offGameEvent(scene.events, GameEvents.SKILL_STARSTORM, onStarstorm),
    () => offGameEvent(scene.events, GameEvents.GUIDANCE_FEATURE_USED, onFeature),
    () => offGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, onTransformStrike),
  );

  root = document.createElement('div');
  root.className = 'learning-coachmark-layer guidance-angel-layer';
  root.dataset['guidanceLayer'] = 'true';
  root.hidden = true;
  document.body.appendChild(root);
  const removeViewportListeners = addLearningCoachmarkViewportListeners(root, focusSelector);

  const pollEnvironment = (): void => {
    const level = hooks.level();
    const feature = hooks.stage().activeGuidanceFeature?.();
    if (feature) consumeObservation({ featureUsed: feature });
    if (
      level.gravityScale !== undefined &&
      level.gravityScale < 1 &&
      !(hooks.player().sprite.body as Phaser.Physics.Arcade.Body).blocked.down
    ) {
      consumeObservation({ featureUsed: 'lowgrav' });
    }
    if (
      hooks.tide()?.phase() !== 'dry' &&
      (hooks.controls().state.left || hooks.controls().state.right)
    ) {
      consumeObservation({ featureUsed: 'tide' });
    }
    const meteorState = hooks.meteor()?.state();
    if (meteorState && meteorState.telegraphs > 0) meteorTelegraphSeen = true;
    if (meteorTelegraphSeen && (hooks.controls().state.left || hooks.controls().state.right)) {
      consumeObservation({ featureUsed: 'meteor' });
      meteorTelegraphSeen = false;
    }
  };

  const startNextLesson = (): void => {
    const next = candidateLessons().find(
      (lesson) => !state.completedLessons.includes(lesson) && !dismissedThisLevel.has(lesson),
    );
    if (!next) {
      state = dismissGuidanceLesson(state);
      render();
      return;
    }
    state = beginGuidanceLesson(state, next, hooks.player().sprite.x);
    render(true);
  };

  return {
    update(deltaMs: number): void {
      elapsedMs += deltaMs;
      pollEnvironment();
      if (successUntilMs > 0 && elapsedMs >= successUntilMs) {
        successUntilMs = 0;
        state = dismissGuidanceLesson(state);
        startAfterMs = elapsedMs + 120;
        render(true);
      }
      if (state.activeLesson === null && elapsedMs >= startAfterMs) startNextLesson();
    },
    destroy(): void {
      unbinders.forEach((unbind) => unbind());
      removeViewportListeners();
      clearFocus();
      root?.remove();
      root = null;
    },
  };
}
