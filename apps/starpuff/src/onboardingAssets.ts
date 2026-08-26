// 新手引導插圖資產（由 imagegen 依 StarPuff 粉彩角色語彙生成）：DOM 引導層直接消費，
// 不進 Phaser 關卡 manifest，避免每關載入與遊戲資產責任混在一起。
import controlHintsUrl from './assets/ui/control-hints-onboarding.webp';
import pwaInstallUrl from './assets/ui/pwa-install-onboarding.webp';
import tutorialTouchMoveUrl from './assets/ui/tutorial-touch-move-v2.webp';
import tutorialTouchJumpUrl from './assets/ui/tutorial-touch-jump-v2.webp';
import tutorialTouchHoldInhaleUrl from './assets/ui/tutorial-touch-hold-inhale-v2.webp';
import tutorialTouchDualInputUrl from './assets/ui/tutorial-touch-dual-input-v4.webp';
import tutorialTouchSlamUrl from './assets/ui/tutorial-touch-slam-v2.webp';
import tutorialTouchTransformUrl from './assets/ui/tutorial-touch-transform-v2.webp';
import tutorialTouchContinuousInhaleUrl from './assets/ui/tutorial-touch-continuous-inhale-v4.webp';
import tutorialTouchShootUrl from './assets/ui/tutorial-touch-shoot-v2.webp';
import tutorialAngelUrl from './assets/ui/tutorial-angel-guide.webp';

export const CONTROL_HINTS_ILLUSTRATION_URL = controlHintsUrl;
export const PWA_INSTALL_ILLUSTRATION_URL = pwaInstallUrl;
export const TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL = tutorialTouchMoveUrl;
export const TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL = tutorialTouchJumpUrl;
// 舊匯出名稱保留相容性，但正式呈現改用有真實珊瑚粉星形鈕的吐星圖。
export const TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL = tutorialTouchShootUrl;
/** @deprecated Use the versioned shoot illustration for the tap-to-shoot lesson. */
export const TUTORIAL_TOUCH_SHOOT_ILLUSTRATION_URL = tutorialTouchShootUrl;
export const TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL = tutorialTouchHoldInhaleUrl;
export const TUTORIAL_TOUCH_DUAL_INPUT_ILLUSTRATION_URL = tutorialTouchDualInputUrl;
export const TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL = tutorialTouchSlamUrl;
export const TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL = tutorialTouchTransformUrl;
export const TUTORIAL_TOUCH_CONTINUOUS_INHALE_ILLUSTRATION_URL = tutorialTouchContinuousInhaleUrl;
export const TUTORIAL_ANGEL_ILLUSTRATION_URL = tutorialAngelUrl;
