import type Phaser from 'phaser';
import { GameEvents, offGameEvent, onGameEvent } from '../core/events';
import { bindButtonActivation } from '../core/domButton';
import {
  advanceTutorial,
  createTutorialState,
  isLastTutorialStep,
  isTutorialStepComplete,
  observeTutorial,
  retryTutorialStep,
  type TutorialStep,
} from '../core/tutorial';
import { getLearningSpec, PRACTICE_STEPS } from '../core/learning';
import { markGuidedTutorialCompleted, updateSettings } from '../core/settings';
import { SceneKeys } from '../core/types';
import type { EnemySystem } from './enemies';
import type { ControlsSystem } from './controls';
import type { PlayerHandle } from './player';
import {
  addLearningCoachmarkViewportListeners,
  appendTouchControlTokens,
  clearLearningFocus,
  positionLearningCoachmark,
} from './learningCoachmark';

interface GuidedTutorialHooks {
  player: () => PlayerHandle;
  controls: () => ControlsSystem;
  enemies: () => EnemySystem;
}

const isDesktop = (): boolean => document.documentElement.classList.contains('sp-desktop');
const PRACTICE_RESCUE_DELAY_MS = 850;
const PRACTICE_REACH_PX = 300;

export interface GuidedTutorialHandle {
  update(deltaMs: number): void;
  destroy(): void;
}

export function createGuidedTutorial(
  scene: Phaser.Scene,
  hooks: GuidedTutorialHooks,
): GuidedTutorialHandle {
  let state = createTutorialState(hooks.player().sprite.x);
  let readyForNext = false;
  let floatyInhaled = 0;
  let inhaledThisStep = false;
  let slamLanded = false;
  let slamTargetHit = false;
  let target: Phaser.Physics.Arcade.Sprite | null = null;
  let tutorialSupplies: Phaser.Physics.Arcade.Sprite[] = [];
  let rescueCooldownMs = 0;
  let root: HTMLDivElement | null = null;
  const unbinders: (() => void)[] = [];

  const makeButton = (label: string, onClick: () => void, className = ''): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `guided-tutorial-btn ${className}`.trim();
    button.textContent = label;
    bindButtonActivation(button, onClick);
    return button;
  };

  const finishToTitle = (): void => {
    updateSettings({ guidedTutorialStatus: 'skipped' });
    scene.scene.start(SceneKeys.Title);
  };

  const render = (): void => {
    if (!root) return;
    const spec = getLearningSpec(state.step);
    const copy = spec.copy;
    const practice = spec.practice;
    clearLearningFocus();
    root.innerHTML = '';
    const card = document.createElement('section');
    card.className = `learning-coachmark-card guided-tutorial-card${readyForNext ? ' is-success' : ''}`;
    card.dataset['learningCard'] = 'true';
    card.dataset['learningLesson'] = state.step;
    card.dataset['guidanceState'] = readyForNext ? 'success' : 'active';
    card.setAttribute('aria-label', `新手教學：${copy.title}`);
    const progress = document.createElement('div');
    progress.className = 'guided-tutorial-progress';
    progress.textContent = `操作 ${PRACTICE_STEPS.indexOf(state.step) + 1} / ${PRACTICE_STEPS.length}`;
    card.appendChild(progress);
    const imageSrc = practice?.image ?? copy.image;
    if (imageSrc) {
      const image = document.createElement('img');
      image.className = 'guided-tutorial-art';
      image.src = imageSrc;
      image.alt = '';
      // coachmark 是目前視線中的必要教學，不延遲載入，避免第一次出現時只剩空白框。
      image.loading = 'eager';
      card.appendChild(image);
    }
    const title = document.createElement('h2');
    title.className = 'guided-tutorial-title';
    title.textContent = copy.title;
    card.appendChild(title);
    const instruction = document.createElement('p');
    instruction.className = 'guided-tutorial-instruction';
    instruction.textContent = isDesktop()
      ? (practice?.desktop ?? copy.desktop)
      : (practice?.touch ?? copy.touch);
    card.appendChild(instruction);
    if (!isDesktop()) {
      appendTouchControlTokens(card, practice?.touchControls ?? copy.touchControls);
    }
    if (practice?.tip) {
      const tip = document.createElement('aside');
      tip.className = 'guided-tutorial-tip';
      const tipImage = document.createElement('img');
      tipImage.className = 'guided-tutorial-tip-art';
      tipImage.src = practice.tip.image;
      tipImage.alt = '';
      tip.appendChild(tipImage);
      const tipContent = document.createElement('div');
      const tipTitle = document.createElement('h3');
      tipTitle.className = 'guided-tutorial-tip-title';
      tipTitle.textContent = practice.tip.title;
      tipContent.appendChild(tipTitle);
      const tipText = document.createElement('p');
      tipText.className = 'guided-tutorial-tip-text';
      tipText.textContent = isDesktop() ? practice.tip.desktop : practice.tip.touch;
      tipContent.appendChild(tipText);
      tip.appendChild(tipContent);
      if (!isDesktop()) appendTouchControlTokens(tip, practice.tip.touchControls);
      card.appendChild(tip);
    }
    let readyActions: HTMLDivElement | null = null;
    if (readyForNext) {
      const success = document.createElement('p');
      success.className = 'guided-tutorial-success';
      success.textContent = practice?.success ?? copy.success;
      card.appendChild(success);
      const actions = document.createElement('div');
      actions.className = 'guided-tutorial-actions';
      readyActions = actions;
      if (isLastTutorialStep(state)) {
        actions.appendChild(
          makeButton(
            '開始正式 L1',
            () => {
              markGuidedTutorialCompleted();
              scene.scene.start(SceneKeys.Game, { levelId: 1, deaths: 0, newSession: false });
            },
            'guided-tutorial-primary',
          ),
        );
        const finish = makeButton('回主選單', () => {
          markGuidedTutorialCompleted();
          scene.scene.start(SceneKeys.Title);
        });
        finish.classList.add('guided-tutorial-leave');
        actions.appendChild(finish);
      } else {
        actions.appendChild(
          makeButton(
            '下一步',
            () => {
              const next = advanceTutorial(state);
              if (!next) return;
              state = next;
              readyForNext = false;
              setupStep(state.step);
              render();
            },
            'guided-tutorial-primary',
          ),
        );
      }
      card.appendChild(actions);
    } else {
      const retry = makeButton('重試本步', () => retryCurrentStep(), 'guided-tutorial-secondary');
      retry.setAttribute('aria-label', '重新配置目前練習');
      const utility = document.createElement('div');
      utility.className = 'guided-tutorial-utility';
      utility.appendChild(retry);
      card.appendChild(utility);
    }
    const leave = makeButton('離開', () => {
      if (window.confirm('要離開新手教學嗎？下次按開始會直接進入遊戲；需要時可從設定重新播放。')) {
        finishToTitle();
      }
    });
    leave.classList.add('guided-tutorial-leave');
    leave.setAttribute('aria-label', '離開教學');
    if (readyActions && !isLastTutorialStep(state)) readyActions.appendChild(leave);
    else if (!readyActions) {
      const leaveUtility = card.querySelector<HTMLElement>('.guided-tutorial-utility');
      if (leaveUtility) leaveUtility.appendChild(leave);
      else {
        const utility = document.createElement('div');
        utility.className = 'guided-tutorial-utility';
        utility.appendChild(leave);
        card.appendChild(utility);
      }
    }
    root.appendChild(card);
    positionLearningCoachmark(root, copy.focus, copy.coachmarkPlacement);
    if (!readyForNext) document.querySelector(copy.focus)?.classList.add('learning-focus');
  };

  const clearTutorialSupplies = (): void => {
    for (const enemy of tutorialSupplies) {
      if (enemy.active) hooks.enemies().kill(enemy);
    }
    tutorialSupplies = [];
    target = null;
  };

  const spawn = (kind: 'jelly' | 'shelly' | 'floaty', x: number, y: number) => {
    const enemy = hooks.enemies().spawn(kind, x, y);
    if (!enemy) return enemy;
    tutorialSupplies.push(enemy);
    // 練習區的目標永遠不會因等待或失誤扣血；玩家仍使用正式吸入、星彈與下砸碰撞。
    enemy.setData('tutorialContactHarmless', true);
    if (kind === 'shelly') {
      target = enemy;
      enemy.setData('state', 'stun');
      // 教學目標保留正式地面碰撞，只在玩家接觸傷害結算層設為無害。
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      // immovable 動態體與靜態地面可能無法完成分離；由地面碰撞防止下沉，
      // update() 每幀歸零速度以維持教學目標在原地。
      body.setImmovable(false);
      body.checkCollision.none = false;
    }
    return enemy;
  };

  const setupStep = (step: TutorialStep): void => {
    clearTutorialSupplies();
    slamLanded = false;
    slamTargetHit = false;
    floatyInhaled = 0;
    inhaledThisStep = false;
    rescueCooldownMs = 0;
    const x = hooks.player().sprite.x;
    if (step === 'inhale') spawn('jelly', x + 118, 330);
    if (step === 'slam-shelly') spawn('shelly', x + 48, 330);
    if (step === 'transform') {
      spawn('floaty', x + 50, 330);
      spawn('floaty', x + 105, 330);
      spawn('floaty', x + 160, 330);
    }
  };

  const retryCurrentStep = (): void => {
    state = retryTutorialStep(state, hooks.player().sprite.x);
    readyForNext = false;
    setupStep(state.step);
    render();
  };

  const isReachable = (enemy: Phaser.Physics.Arcade.Sprite): boolean =>
    enemy.active &&
    Math.abs(enemy.x - hooks.player().sprite.x) <= PRACTICE_REACH_PX &&
    enemy.y > -80 &&
    enemy.y < 520;

  const reachableSupplyCount = (kind: 'jelly' | 'floaty'): number =>
    tutorialSupplies.filter((enemy) => hooks.enemies().kindOf(enemy) === kind && isReachable(enemy))
      .length;

  const retireUnreachableSupplies = (kind: 'jelly' | 'floaty'): void => {
    const retained: Phaser.Physics.Arcade.Sprite[] = [];
    for (const enemy of tutorialSupplies) {
      if (!enemy.active) continue;
      if (hooks.enemies().kindOf(enemy) === kind && !isReachable(enemy)) {
        // 教學補給不是正式敵人：離開可及範圍就直接回池，不播死亡效果、不發擊殺事件，
        // 讓下一輪能在玩家身邊補出替代目標，也不會持續佔滿共用 enemy pool。
        hooks.enemies().removeInhaled(enemy);
        continue;
      }
      if (!retained.includes(enemy)) retained.push(enemy);
    }
    tutorialSupplies = retained;
  };

  const maintainPracticeSupplies = (deltaMs: number): void => {
    rescueCooldownMs = Math.max(0, rescueCooldownMs - deltaMs);
    if (rescueCooldownMs > 0) return;
    const x = hooks.player().sprite.x;
    if (state.step === 'inhale' && !inhaledThisStep) {
      retireUnreachableSupplies('jelly');
      const available = tutorialSupplies.some(
        (enemy) => hooks.enemies().kindOf(enemy) === 'jelly' && isReachable(enemy),
      );
      if (!available) {
        spawn('jelly', x + 118, 330);
        rescueCooldownMs = PRACTICE_RESCUE_DELAY_MS;
      }
      return;
    }
    if (state.step === 'slam-shelly' && !slamTargetHit) {
      if (target && isReachable(target)) return;
      // 下砸失手或把 Shelly 推出練習區時，重置目前步驟再補一隻，保證仍需
      // 下一次真實「下＋A」命中才可繼續。
      retryCurrentStep();
      rescueCooldownMs = PRACTICE_RESCUE_DELAY_MS;
      return;
    }
    if (state.step === 'transform' && floatyInhaled < 3) {
      // 只把仍在玩家可及練習範圍內的怪算作供給；若玩家把怪追出畫面或誤殺，
      // 原本 active 但已不可達的池物件不能阻止補怪，避免變身步驟卡死。
      retireUnreachableSupplies('floaty');
      const missing = 3 - floatyInhaled - reachableSupplyCount('floaty');
      if (missing <= 0) return;
      for (let index = 0; index < missing; index += 1) {
        spawn('floaty', x + 70 + index * 55, 330);
      }
      rescueCooldownMs = PRACTICE_RESCUE_DELAY_MS;
    }
  };

  const onInhaled = ({ kind }: { kind: string }): void => {
    if (state.step === 'inhale') inhaledThisStep = true;
    if (state.step === 'transform' && kind === 'floaty') floatyInhaled += 1;
  };
  const onFired = (): void => {
    if (state.step === 'shoot') state = observeTutorial(state, makeObservation({ fired: true }));
  };
  const onSlam = (): void => {
    if (state.step !== 'slam-shelly') return;
    slamLanded = true;
    // Shelly 的正式 FSM 只有 2.2 秒暈眩窗；教學目標必須在玩家真正落地命中
    // 的同一事件回呼前恢復為可擊殺的 stun，否則過期後第一次下砸只會讓它進 spin。
    if (target?.active) {
      target.setData('state', 'stun');
      target.setData('stateMs', 0);
      (target.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
  };
  const onKilled = ({ kind, x, y }: { kind: string; x: number; y: number }): void => {
    if (state.step !== 'slam-shelly' || kind !== 'shelly' || !slamLanded || !target) return;
    // 只接受下砸落點附近的 Shelly；練習區若未來補入其他 Shelly，不會誤判成功。
    if (Math.hypot(target.x - x, target.y - y) <= 96) slamTargetHit = true;
  };
  const makeObservation = (
    extra: Partial<{
      inhaledKind?: string;
      fired: boolean;
      slamLanded: boolean;
      slamTargetHit: boolean;
    }> = {},
  ) => ({
    ...makeBaseObservation(),
    ...extra,
  });
  const makeBaseObservation = () => ({
    input: hooks.controls().state,
    playerX: hooks.player().sprite.x,
    airborne: !(
      (hooks.player().sprite.body as Phaser.Physics.Arcade.Body).blocked.down ||
      (hooks.player().sprite.body as Phaser.Physics.Arcade.Body).touching.down
    ),
    fired: false,
    slamLanded: false,
    slamTargetHit: false,
    transformForm: hooks.player().getTransformState().form,
  });

  onGameEvent(scene.events, GameEvents.ENEMY_INHALED, onInhaled);
  onGameEvent(scene.events, GameEvents.STAR_FIRED, onFired);
  onGameEvent(scene.events, GameEvents.SKILL_SLAM_LANDED, onSlam);
  onGameEvent(scene.events, GameEvents.ENEMY_KILLED, onKilled);
  unbinders.push(
    () => offGameEvent(scene.events, GameEvents.ENEMY_INHALED, onInhaled),
    () => offGameEvent(scene.events, GameEvents.STAR_FIRED, onFired),
    () => offGameEvent(scene.events, GameEvents.SKILL_SLAM_LANDED, onSlam),
    () => offGameEvent(scene.events, GameEvents.ENEMY_KILLED, onKilled),
  );

  root = document.createElement('div');
  root.className = 'learning-coachmark-layer guided-tutorial-overlay';
  root.dataset['learningMode'] = 'practice';
  document.body.appendChild(root);
  const removeViewportListeners = addLearningCoachmarkViewportListeners(
    root,
    () => {
      const activeSpec = getLearningSpec(state.step);
      return activeSpec.copy.focus;
    },
    () => getLearningSpec(state.step).copy.coachmarkPlacement ?? 'auto',
  );
  setupStep(state.step);
  render();

  return {
    update(deltaMs: number): void {
      if (!root || readyForNext) return;
      maintainPracticeSupplies(deltaMs);
      if (target?.active) {
        const body = target.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
      }
      if (state.step === 'transform' && floatyInhaled < 3) return;
      const next = observeTutorial(
        state,
        makeObservation({
          inhaledKind: inhaledThisStep ? 'tutorial-target' : undefined,
          slamLanded,
          slamTargetHit,
        }),
      );
      state = next;
      if (isTutorialStepComplete(state)) {
        readyForNext = true;
        render();
      }
    },
    destroy(): void {
      clearLearningFocus();
      unbinders.forEach((unbind) => unbind());
      removeViewportListeners();
      clearTutorialSupplies();
      root?.remove();
      root = null;
    },
  };
}
