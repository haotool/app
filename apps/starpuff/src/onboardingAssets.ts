// 新手引導插圖資產（由 imagegen 依 StarPuff 粉彩角色語彙生成）：DOM 引導層直接消費，
// 不進 Phaser 關卡 manifest，避免每關載入與遊戲資產責任混在一起。
import controlHintsUrl from './assets/ui/control-hints-onboarding.webp';
import pwaInstallUrl from './assets/ui/pwa-install-onboarding.webp';
import tutorialTouchMoveUrl from './assets/ui/tutorial-touch-move.webp';
import tutorialTouchJumpUrl from './assets/ui/tutorial-touch-jump.webp';
import tutorialTouchInhaleUrl from './assets/ui/tutorial-touch-inhale.webp';
import tutorialTouchHoldInhaleUrl from './assets/ui/tutorial-touch-hold-inhale.webp';
import tutorialTouchDualInputUrl from './assets/ui/tutorial-touch-dual-input.webp';
import tutorialTouchSlamUrl from './assets/ui/tutorial-touch-slam.webp';
import tutorialTouchTransformUrl from './assets/ui/tutorial-touch-transform.webp';

export const CONTROL_HINTS_ILLUSTRATION_URL = controlHintsUrl;
export const PWA_INSTALL_ILLUSTRATION_URL = pwaInstallUrl;
export const TUTORIAL_TOUCH_MOVE_ILLUSTRATION_URL = tutorialTouchMoveUrl;
export const TUTORIAL_TOUCH_JUMP_ILLUSTRATION_URL = tutorialTouchJumpUrl;
export const TUTORIAL_TOUCH_INHALE_ILLUSTRATION_URL = tutorialTouchInhaleUrl;
export const TUTORIAL_TOUCH_HOLD_INHALE_ILLUSTRATION_URL = tutorialTouchHoldInhaleUrl;
export const TUTORIAL_TOUCH_DUAL_INPUT_ILLUSTRATION_URL = tutorialTouchDualInputUrl;
export const TUTORIAL_TOUCH_SLAM_ILLUSTRATION_URL = tutorialTouchSlamUrl;
export const TUTORIAL_TOUCH_TRANSFORM_ILLUSTRATION_URL = tutorialTouchTransformUrl;
