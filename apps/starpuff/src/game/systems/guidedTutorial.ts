import type Phaser from 'phaser';
import { GameEvents, offGameEvent, onGameEvent } from '../core/events';
import { bindButtonActivation } from '../core/domButton';
import {
  advanceTutorial,
  createTutorialState,
  isLastTutorialStep,
  isTutorialStepComplete,
  observeTutorial,
  type TutorialStep,
} from '../core/tutorial';
import { markGuidedTutorialCompleted, updateSettings } from '../core/settings';
import { SceneKeys } from '../core/types';
import type { EnemySystem } from './enemies';
import type { ControlsSystem } from './controls';
import type { PlayerHandle } from './player';
import {
  TUTORIAL_TOUCH_DUAL_INPUT_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
} from '../../onboardingAssets';

interface GuidedTutorialHooks {
  player: () => PlayerHandle;
  controls: () => ControlsSystem;
  enemies: () => EnemySystem;
}

interface StepCopy {
  title: string;
  touch: string;
  desktop: string;
  success: string;
  image: string;
  tip?: {
    title: string;
    touch: string;
    desktop: string;
    image: string;
  };
}

const STEP_COPY: Record<TutorialStep, StepCopy> = {
  move: {
    title: '先熟悉移動',
    touch: '左手大拇指拖曳左側搖桿，向左、向右各走一小段。',
    desktop: '按住 ←、→，向左、向右各走一小段。',
    success: '走位學會了！',
    image: TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL,
  },
  jump: {
    title: '跳起來',
    touch: '用右手大拇指按右下 A，真的離地跳一次。',
    desktop: '按 Z，真的離地跳一次。',
    success: '跳躍成功！',
    image: TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL,
  },
  inhale: {
    title: '把星星吸進來',
    touch: '用右手食指長按右上 B，先讓一顆星星被吸入。',
    desktop: '長按 X，先讓一顆星星被吸入。',
    success: '吸入成功，彈匣有星星了！',
    image: TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL,
    tip: {
      title: '可以這樣連著玩',
      touch:
        'B 不用一直點：右手食指持續按住，就能把靠近的星星一顆接一顆吸進來；右手大拇指也能同時按 A 跳躍。',
      desktop: 'X 持續按住即可連續吸入；Z 與 X 可以同時按，邊跳邊吸。',
      image: TUTORIAL_TOUCH_DUAL_INPUT_ILLUSTRATION_URL,
    },
  },
  shoot: {
    title: '吐出星彈',
    touch: '輕點 B，把剛吸入的星星吐出去。',
    desktop: '輕點 X，把剛吸入的星星吐出去。',
    success: '星彈發射成功！',
    image: TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL,
  },
  'slam-shelly': {
    title: '對 Shelly 下砸',
    touch: '先跳起，左搖桿往下，再按右下 A，從空中砸中 Shelly。',
    desktop: '先跳起，按住 ↓ 再按 Z，從空中砸中 Shelly。',
    success: '下砸命中！記住：空中「下＋跳」就是下砸。',
    image: TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
  },
  transform: {
    title: '真正變身',
    touch: '吸入三顆同味星後，按畫面上的 TF 變身鍵。',
    desktop: '吸入三顆同味星後，按 V 變身。',
    success: '變身成功！接下來正式 L1 會用情境提示帶你認識更多技能。',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
  },
};

const isDesktop = (): boolean => document.documentElement.classList.contains('sp-desktop');

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
    const copy = STEP_COPY[state.step];
    root.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'guided-tutorial-card';
    card.setAttribute('aria-label', `新手教學：${copy.title}`);
    const progress = document.createElement('div');
    progress.className = 'guided-tutorial-progress';
    progress.textContent = `操作 ${['move', 'jump', 'inhale', 'shoot', 'slam-shelly', 'transform'].indexOf(state.step) + 1} / 6`;
    card.appendChild(progress);
    const image = document.createElement('img');
    image.className = 'guided-tutorial-art';
    image.src = copy.image;
    image.alt = '';
    card.appendChild(image);
    const title = document.createElement('h2');
    title.className = 'guided-tutorial-title';
    title.textContent = copy.title;
    card.appendChild(title);
    const instruction = document.createElement('p');
    instruction.className = 'guided-tutorial-instruction';
    instruction.textContent = isDesktop() ? copy.desktop : copy.touch;
    card.appendChild(instruction);
    if (copy.tip) {
      const tip = document.createElement('aside');
      tip.className = 'guided-tutorial-tip';
      const tipImage = document.createElement('img');
      tipImage.className = 'guided-tutorial-tip-art';
      tipImage.src = copy.tip.image;
      tipImage.alt = '';
      tip.appendChild(tipImage);
      const tipContent = document.createElement('div');
      const tipTitle = document.createElement('h3');
      tipTitle.className = 'guided-tutorial-tip-title';
      tipTitle.textContent = copy.tip.title;
      tipContent.appendChild(tipTitle);
      const tipText = document.createElement('p');
      tipText.className = 'guided-tutorial-tip-text';
      tipText.textContent = isDesktop() ? copy.tip.desktop : copy.tip.touch;
      tipContent.appendChild(tipText);
      tip.appendChild(tipContent);
      card.appendChild(tip);
    }
    if (readyForNext) {
      const success = document.createElement('p');
      success.className = 'guided-tutorial-success';
      success.textContent = copy.success;
      card.appendChild(success);
      if (isLastTutorialStep(state)) {
        const actions = document.createElement('div');
        actions.className = 'guided-tutorial-actions';
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
        actions.appendChild(
          makeButton('回主選單', () => {
            markGuidedTutorialCompleted();
            scene.scene.start(SceneKeys.Title);
          }),
        );
        card.appendChild(actions);
      } else {
        card.appendChild(
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
    }
    const leave = makeButton('離開教學', () => {
      if (window.confirm('要離開新手教學嗎？下次按開始會直接進入遊戲；需要時可從設定重新播放。')) {
        finishToTitle();
      }
    });
    leave.classList.add('guided-tutorial-leave');
    card.appendChild(leave);
    root.appendChild(card);
  };

  const spawn = (kind: 'jelly' | 'shelly' | 'floaty', x: number, y: number) => {
    const enemy = hooks.enemies().spawn(kind, x, y);
    if (enemy && kind === 'shelly') {
      target = enemy;
      enemy.setData('state', 'stun');
      // 教學目標保留正式地面碰撞，只在玩家接觸傷害結算層設為無害。
      enemy.setData('tutorialContactHarmless', true);
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
    target = null;
    slamLanded = false;
    slamTargetHit = false;
    floatyInhaled = 0;
    inhaledThisStep = false;
    const x = hooks.player().sprite.x;
    if (step === 'inhale') spawn('jelly', x + 118, 330);
    if (step === 'slam-shelly') spawn('shelly', x + 48, 330);
    if (step === 'transform') {
      spawn('floaty', x + 50, 330);
      spawn('floaty', x + 105, 330);
      spawn('floaty', x + 160, 330);
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
  const onKilled = ({ kind }: { kind: string }): void => {
    if (state.step === 'slam-shelly' && kind === 'shelly' && slamLanded) slamTargetHit = true;
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
  root.className = 'guided-tutorial-overlay';
  document.body.appendChild(root);
  setupStep(state.step);
  render();

  return {
    update(_deltaMs: number): void {
      if (!root || readyForNext) return;
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
      unbinders.forEach((unbind) => unbind());
      root?.remove();
      root = null;
    },
  };
}
