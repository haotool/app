import type { MechanicId } from '../logic/levels';
import type { TransformForm } from './types';
import {
  TUTORIAL_TOUCH_CONTINUOUS_INHALE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
  TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
} from '../../onboardingAssets';

/**
 * Learning SSOT：正常關卡情境提示與可選練習區共用同一組 lesson 定義。
 *
 * 這個模組只保存資料與關卡機制映射，不依賴 Phaser、DOM 或場景生命週期。
 * 呈現層可以選擇 context coachmark 或 practice coachmark，但不得另建一份
 * 文案、素材與對應控制的清單。
 */
export type LearningLessonId =
  | 'move'
  | 'jump'
  | 'inhale'
  | 'shoot'
  | 'slam-shelly'
  | 'transform'
  | 'starburst'
  | MechanicId
  | `form-${TransformForm}`;

export interface LearningCopy {
  title: string;
  touch: string;
  desktop: string;
  success: string;
  image?: string;
  tip?: string;
  focus: string;
}

export interface PracticeTipCopy {
  title: string;
  touch: string;
  desktop: string;
  image: string;
}

export interface PracticeCopy {
  touch: string;
  desktop: string;
  success: string;
  image: string;
  tip?: PracticeTipCopy;
}

export interface LearningLessonSpec {
  id: LearningLessonId;
  copy: LearningCopy;
  practice?: PracticeCopy;
}

/** 基礎操作只在 L1 以順序提示；L1 的 teaches 仍負責吸吐機制的唯一進度來源。 */
export const FOUNDATION_LESSONS = [
  'move',
  'jump',
  'inhale-shoot',
] as const satisfies readonly LearningLessonId[];

/** 練習區的實作順序；內容與正常情境提示由同一 registry 提供。 */
export const PRACTICE_STEPS = [
  'move',
  'jump',
  'inhale',
  'shoot',
  'slam-shelly',
  'transform',
] as const satisfies readonly LearningLessonId[];

const FORM_BY_MECHANIC: Partial<Record<MechanicId, TransformForm>> = {
  'ember-form': 'ember',
  'tide-form': 'tide',
  'prism-form': 'prism',
  'gravity-form': 'gravity',
};

const lesson = (
  id: LearningLessonId,
  copy: LearningCopy,
  practice?: PracticeCopy,
): LearningLessonSpec => ({ id, copy, practice });

export const LEARNING_LESSONS: Partial<Record<LearningLessonId, LearningLessonSpec>> = {
  move: lesson(
    'move',
    {
      title: '往前走走看',
      touch: '左手大拇指輕推左側搖桿；左右移動都試一次。',
      desktop: '按住 ←、→，左右移動都試一次。',
      success: '走位學會了！',
      image: TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL,
      focus: '#joy-zone',
    },
    {
      touch: '左手大拇指拖曳左側搖桿，向左、向右各走一小段。',
      desktop: '按住 ←、→，向左、向右各走一小段。',
      success: '走位學會了！',
      image: TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL,
    },
  ),
  jump: lesson(
    'jump',
    {
      title: '跳一下就好',
      touch: '右手大拇指輕按右下 A，真的離地一次。',
      desktop: '按 Z，真的離地跳一次。',
      success: '跳躍成功！',
      image: TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL,
      focus: '[data-btn="a"]',
    },
    {
      touch: '用右手大拇指按右下 A，真的離地跳一次。',
      desktop: '按 Z，真的離地跳一次。',
      success: '跳躍成功！',
      image: TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL,
    },
  ),
  inhale: lesson(
    'inhale',
    {
      title: '把星星吸進來',
      touch: '右手食指長按右上 B，讓附近的星星靠近嘴巴。',
      desktop: '長按 X，讓附近的星星靠近嘴巴。',
      success: '吸入成功！',
      image: TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL,
      tip: 'B 可以一直按著連吞；右手大拇指也能同時按 A，邊跳邊吸。',
      focus: '[data-btn="b"]',
    },
    {
      touch: '用右手食指長按右上 B，先讓一顆星星被吸入。',
      desktop: '長按 X，先讓一顆星星被吸入。',
      success: '吸入成功，彈匣有星星了！',
      image: TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL,
      tip: {
        title: '可以這樣連著玩',
        touch:
          'B 不用一直點：右手食指持續按住，就能一顆接一顆吸進來；右手大拇指也能同時按 A 跳躍。',
        desktop: 'X 持續按住即可連續吸入；Z 與 X 可以同時按，邊跳邊吸。',
        image: TUTORIAL_TOUCH_CONTINUOUS_INHALE_ILLUSTRATION_URL,
      },
    },
  ),
  shoot: lesson(
    'shoot',
    {
      title: '把星彈吐出去',
      touch: 'B 輕點一下，把剛吸入的星星發射出去。',
      desktop: 'X 輕點一下，把剛吸入的星星發射出去。',
      success: '星彈發射成功！',
      image: TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL,
      focus: '[data-btn="b"]',
    },
    {
      touch: '輕點 B，把剛吸入的星星吐出去。',
      desktop: '輕點 X，把剛吸入的星星吐出去。',
      success: '星彈發射成功！',
      image: TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL,
    },
  ),
  'inhale-shoot': lesson('inhale-shoot', {
    title: '吸入，再吐出',
    touch: '右手食指長按 B 連吞，放開後輕點 B 發射。',
    desktop: '長按 X 連續吸入，放開後輕點 X 發射。',
    success: '吸吐節奏學會了！',
    // A+B 同按改用已修正手勢的連續吸入圖，避免舊 dual-input 版本的手腕／指節
    // 變形再次出現在正式提示；按鈕名稱仍由 DOM 與實際雙 pointer 輸入呈現。
    image: TUTORIAL_TOUCH_CONTINUOUS_INHALE_ILLUSTRATION_URL,
    tip: 'A 與 B 可以同時按：大拇指跳、食指吸，移動時更靈活。',
    focus: '[data-btn="b"]',
  }),
  'shell-shield': lesson('shell-shield', {
    title: 'Shelly 的殼可以擋',
    touch: '看到攻擊時靠近 Shelly，讓它的殼盾真的格擋一次。',
    desktop: '看到攻擊時靠近 Shelly，讓它的殼盾真的格擋一次。',
    success: '殼盾成功！',
    image: TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
    focus: '[data-btn="a"]',
  }),
  'slam-shelly': lesson(
    'slam-shelly',
    {
      title: '遇到 Shelly 就下砸',
      touch: '跳起後左搖桿往下，再按 A，從空中砸中 Shelly。',
      desktop: '跳起後按住 ↓ 再按 Z，從空中砸中 Shelly。',
      success: '下砸命中！',
      image: TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
      tip: '失手不用怕：Shelly 會再出現，慢慢抓準落點。',
      focus: '#joy-zone',
    },
    {
      touch: '先跳起，左搖桿往下，再按右下 A，從空中砸中 Shelly。',
      desktop: '先跳起，按住 ↓ 再按 Z，從空中砸中 Shelly。',
      success: '下砸命中！記住：空中「下＋跳」就是下砸。',
      image: TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL,
    },
  ),
  transform: lesson(
    'transform',
    {
      title: '三顆同味可以變身',
      touch: '吸入三顆同味星後，按亮起的 TF。',
      desktop: '吸入三顆同味星後，按亮起的 V。',
      success: '真的變身成功！',
      image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
      focus: '[data-btn="tf"]',
    },
    {
      touch: '吸入三顆同味星後，按畫面上的 TF 變身鍵。',
      desktop: '吸入三顆同味星後，按 V 變身。',
      success: '變身成功！接下來正式 L1 會用情境提示帶你認識更多技能。',
      image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    },
  ),
  starburst: lesson('starburst', {
    title: '蓄滿就放星暴',
    touch: '星暴蓄能完成後，按 SP 釋放。',
    desktop: '星暴蓄能完成後，按 C 釋放。',
    success: '星暴成功！',
    focus: '[data-btn="sp"]',
  }),
  updraft: lesson('updraft', {
    title: '站進氣流往上飛',
    touch: '走進氣流柱，讓它把你托起來。',
    desktop: '走進氣流柱，讓它把你托起來。',
    success: '氣流學會了！',
    focus: '#joy-zone',
  }),
  vent: lesson('vent', {
    title: '先看噴口，再乘風',
    touch: '看到蒸汽亮起時走進噴口，乘著它升空。',
    desktop: '看到蒸汽亮起時走進噴口，乘著它升空。',
    success: '噴口用法學會了！',
    focus: '#joy-zone',
  }),
  tide: lesson('tide', {
    title: '漲潮時走平台',
    touch: '水面冒泡就先跳上平台，等退潮再回地面。',
    desktop: '水面冒泡就先跳上平台，等退潮再回地面。',
    success: '潮汐節奏學會了！',
    focus: '#joy-zone',
  }),
  lowgrav: lesson('lowgrav', {
    title: '低重力跳得更遠',
    touch: '按 A 跳起，感受飄浮時間，再移向下一塊平台。',
    desktop: '按 Z 跳起，感受飄浮時間，再移向下一塊平台。',
    success: '低重力掌握了！',
    focus: '[data-btn="a"]',
  }),
  meteor: lesson('meteor', {
    title: '看到預警圈就閃開',
    touch: '地面出現預警圈時，立刻用左搖桿離開圈內。',
    desktop: '地面出現預警圈時，立刻用 ←、→ 離開圈內。',
    success: '閃避成功！',
    focus: '#joy-zone',
  }),
  warp: lesson('warp', {
    title: '星環可以折躍',
    touch: '走進星環，實際穿越到另一個位置。',
    desktop: '走進星環，實際穿越到另一個位置。',
    success: '折躍成功！',
    focus: '#joy-zone',
  }),
  magnet: lesson('magnet', {
    title: '磁場會拉偏星彈',
    touch: '對磁極獸發射一顆星，觀察它被磁場拉偏。',
    desktop: '對磁極獸發射一顆星，觀察它被磁場拉偏。',
    success: '看懂磁場了！',
    focus: '[data-btn="b"]',
  }),
  mirror: lesson('mirror', {
    title: '鏡面正面會反射',
    touch: '不要正面硬射；先繞到側面再吐星。',
    desktop: '不要正面硬射；先繞到側面再吐星。',
    success: '鏡面反制學會了！',
    focus: '[data-btn="b"]',
  }),
  'form-volt': lesson('form-volt', {
    title: '雷化首次登場',
    touch: '吸入同味星並按 TF 變成雷化，接著按 B 釋放雷束。',
    desktop: '吸入同味星並按 V 變成雷化，接著按 X 釋放雷束。',
    success: '雷化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="tf"]',
  }),
  'form-gale': lesson('form-gale', {
    title: '風化首次登場',
    touch: '變成風化後，跳起或下砸感受滑翔與落地衝擊。',
    desktop: '變成風化後，跳起或下砸感受滑翔與落地衝擊。',
    success: '風化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="tf"]',
  }),
  'form-shell': lesson('form-shell', {
    title: '殼化首次登場',
    touch: '變成殼化後，讓一次攻擊撞上殼盾。',
    desktop: '變成殼化後，讓一次攻擊撞上殼盾。',
    success: '殼化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="tf"]',
  }),
  'form-ember': lesson('form-ember', {
    title: '焰化首次登場',
    touch: '變身後按 B 發射焰彈，看看它如何處理冰晶敵人。',
    desktop: '變身後按 X 發射焰彈，看看它如何處理冰晶敵人。',
    success: '焰化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="b"]',
  }),
  'form-tide': lesson('form-tide', {
    title: '潮化首次登場',
    touch: '變身後讓水環撥開一次彈幕。',
    desktop: '變身後讓水環撥開一次彈幕。',
    success: '潮化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="tf"]',
  }),
  'form-prism': lesson('form-prism', {
    title: '稜化首次登場',
    touch: '變身後用 B 長按彩虹光束，實際抵銷一次彈幕。',
    desktop: '變身後用 X 長按彩虹光束，實際抵銷一次彈幕。',
    success: '稜化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="b"]',
  }),
  'form-gravity': lesson('form-gravity', {
    title: '引力化首次登場',
    touch: '變身後使用下砸，感受引力井的範圍。',
    desktop: '變身後使用下砸，感受引力井的範圍。',
    success: '引力化技能成功！',
    image: TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL,
    focus: '[data-btn="a"]',
  }),
};

const FALLBACK_SPEC: LearningLessonSpec = lesson('move', {
  title: '試試新的玩法',
  touch: '在安全時機實際使用這個新機制。',
  desktop: '在安全時機實際使用這個新機制。',
  success: '新機制學會了！',
  focus: '#joy-zone',
});

export function getLearningSpec(id: LearningLessonId): LearningLessonSpec {
  return LEARNING_LESSONS[id] ?? { ...FALLBACK_SPEC, id };
}

export function mapMechanicToLearningLesson(mechanic: MechanicId): LearningLessonId {
  if (mechanic === 'slam') return 'slam-shelly';
  const form = FORM_BY_MECHANIC[mechanic];
  return form ? `form-${form}` : mechanic;
}
