// 新手引導插圖資產（由 imagegen 依 StarPuff 粉彩角色語彙生成）：DOM 引導層直接消費，
// 不進 Phaser 關卡 manifest，避免每關載入與遊戲資產責任混在一起。
import controlHintsUrl from './assets/ui/control-hints-onboarding.webp';
import pwaInstallUrl from './assets/ui/pwa-install-onboarding.webp';

export const CONTROL_HINTS_ILLUSTRATION_URL = controlHintsUrl;
export const PWA_INSTALL_ILLUSTRATION_URL = pwaInstallUrl;
