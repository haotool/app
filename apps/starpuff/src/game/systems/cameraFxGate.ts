// 震屏/閃光強度閘（v19 #819 卡 12）：以 UserSettings 的 screenShake 與 reducedMotion
// 單點縮放 camera.shake/flash——包裝 main camera 方法一次安裝，全部 boss/fx 呼叫端
//（cameras.main.shake/flash 與 fx.shake）零改動即受管；偏好每次呼叫重讀即時生效。

import { loadSettings, type UserSettings } from '../core/settings';

type FxPrefs = Pick<UserSettings, 'screenShake' | 'reducedMotion'>;

// Phaser flash 預設時長（官方預設值 250ms）：未帶參呼叫也要能縮短。
const PHASER_FLASH_DEFAULT_MS = 250;

export function shakeIntensityScale(prefs: FxPrefs): number {
  if (prefs.reducedMotion) return 0;
  switch (prefs.screenShake) {
    case 'off':
      return 0;
    case 'low':
      return 0.5;
    case 'full':
      return 1;
    default: {
      const exhaustive: never = prefs.screenShake;
      return exhaustive;
    }
  }
}

export function flashDurationScale(prefs: Pick<UserSettings, 'reducedMotion'>): number {
  return prefs.reducedMotion ? 0.3 : 1;
}

// camera 結構型別（方法簽名＝bivariant，Phaser main camera 與單測假物件皆可傳入）；
// 呼叫端全數以位置參數傳 number/boolean，restArgs 承接 callback/context 透傳。
interface CameraFxTarget {
  shake(duration?: number, intensity?: number, ...restArgs: never[]): unknown;
  flash(duration?: number, red?: number, green?: number, blue?: number): unknown;
}

export function installCameraFxGate(
  camera: CameraFxTarget,
  readPrefs: () => FxPrefs = loadSettings,
): void {
  const shake = camera.shake.bind(camera) as (...args: unknown[]) => unknown;
  const flash = camera.flash.bind(camera) as (...args: unknown[]) => unknown;
  camera.shake = (duration?: number, intensity?: number, ...restArgs: never[]) => {
    const scale = shakeIntensityScale(readPrefs());
    if (scale <= 0) return camera;
    if (scale === 1 || intensity === undefined) return shake(duration, intensity, ...restArgs);
    return shake(duration, intensity * scale, ...restArgs);
  };
  camera.flash = (duration?: number, ...restArgs: never[]) => {
    const scale = flashDurationScale(readPrefs());
    if (scale === 1) return flash(duration, ...restArgs);
    return flash((duration ?? PHASER_FLASH_DEFAULT_MS) * scale, ...restArgs);
  };
}
