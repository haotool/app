import { describe, expect, it, vi } from 'vitest';
import { flashDurationScale, installCameraFxGate, shakeIntensityScale } from './cameraFxGate';

// 震屏/閃光強度閘（v19 #819 卡 12）：screenShake off|low|full 縮放震屏強度、
// reducedMotion 強制關震屏並縮短閃光；單點包裝 camera.shake/flash，
// 全部 boss/fx 呼叫端零改動。

describe('強度決策（純函式）', () => {
  it('screenShake：off=0、low=0.5、full=1', () => {
    expect(shakeIntensityScale({ screenShake: 'off', reducedMotion: false })).toBe(0);
    expect(shakeIntensityScale({ screenShake: 'low', reducedMotion: false })).toBe(0.5);
    expect(shakeIntensityScale({ screenShake: 'full', reducedMotion: false })).toBe(1);
  });

  it('reducedMotion 強制震屏 0（覆蓋 screenShake 設定）', () => {
    expect(shakeIntensityScale({ screenShake: 'full', reducedMotion: true })).toBe(0);
    expect(shakeIntensityScale({ screenShake: 'low', reducedMotion: true })).toBe(0);
  });

  it('flash：reducedMotion 縮短為 0.3 倍，否則原樣', () => {
    expect(flashDurationScale({ reducedMotion: false })).toBe(1);
    expect(flashDurationScale({ reducedMotion: true })).toBe(0.3);
  });
});

describe('installCameraFxGate（camera 包裝）', () => {
  function makeCamera() {
    return { shake: vi.fn(), flash: vi.fn() };
  }

  it('full：shake/flash 原樣透傳', () => {
    const camera = makeCamera();
    const shake = camera.shake;
    const flash = camera.flash;
    installCameraFxGate(camera, () => ({ screenShake: 'full', reducedMotion: false }));
    camera.shake(200, 0.008, true);
    expect(shake).toHaveBeenCalledWith(200, 0.008, true);
    camera.flash(320, 255, 200, 180);
    expect(flash).toHaveBeenCalledWith(320, 255, 200, 180);
  });

  it('low：shake 強度減半；off：shake 完全略過', () => {
    const camera = makeCamera();
    const shake = camera.shake;
    installCameraFxGate(camera, () => ({ screenShake: 'low', reducedMotion: false }));
    camera.shake(200, 0.008);
    expect(shake).toHaveBeenCalledWith(200, 0.004);

    const off = makeCamera();
    const offShake = off.shake;
    installCameraFxGate(off, () => ({ screenShake: 'off', reducedMotion: false }));
    off.shake(200, 0.008);
    expect(offShake).not.toHaveBeenCalled();
  });

  it('reducedMotion：shake 略過、flash 時長縮 0.3 倍（未給時長用 Phaser 預設 250）', () => {
    const camera = makeCamera();
    const shake = camera.shake;
    const flash = camera.flash;
    installCameraFxGate(camera, () => ({ screenShake: 'full', reducedMotion: true }));
    camera.shake(120, 0.006);
    expect(shake).not.toHaveBeenCalled();
    camera.flash(320, 255, 200, 180);
    expect(flash).toHaveBeenCalledWith(96, 255, 200, 180);
    camera.flash();
    expect(flash).toHaveBeenLastCalledWith(75);
  });

  it('偏好即時生效：每次呼叫重讀設定（切換不需重裝）', () => {
    const camera = makeCamera();
    const shake = camera.shake;
    let pref: 'off' | 'full' = 'full';
    installCameraFxGate(camera, () => ({ screenShake: pref, reducedMotion: false }));
    camera.shake(100, 0.01);
    expect(shake).toHaveBeenCalledTimes(1);
    pref = 'off';
    camera.shake(100, 0.01);
    expect(shake).toHaveBeenCalledTimes(1);
  });
});
