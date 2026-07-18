import { describe, expect, it } from 'vitest';
import {
  WALK_BOB_PX,
  advanceCrouch,
  advanceStride,
  airTilt,
  idleBreath,
  strideBob,
  strideTilt,
} from './walkFeel';

describe('advanceStride（§45 速度驅動步頻）', () => {
  it('全速走動相位穩定推進；步頻 3.2Hz 下一秒約 6.4 次落腳', () => {
    let phase = 0;
    let footsteps = 0;
    for (let t = 0; t < 1000; t += 16) {
      const tick = advanceStride(phase, 1, 16);
      phase = tick.phase;
      if (tick.footstep) footsteps += 1;
    }
    expect(footsteps).toBeGreaterThanOrEqual(5);
    expect(footsteps).toBeLessThanOrEqual(7);
  });

  it('半速走動步頻減半；停走相位歸零凍結', () => {
    let phase = 0;
    let footsteps = 0;
    for (let t = 0; t < 1000; t += 16) {
      const tick = advanceStride(phase, 0.5, 16);
      phase = tick.phase;
      if (tick.footstep) footsteps += 1;
    }
    expect(footsteps).toBeGreaterThanOrEqual(2);
    expect(footsteps).toBeLessThanOrEqual(4);
    expect(advanceStride(phase, 0, 16)).toEqual({ phase: 0, footstep: false });
  });

  it('落腳拍點每半週期一次（跨 π 邊界）', () => {
    const beforeBoundary = Math.PI - 0.05;
    const crossed = advanceStride(beforeBoundary, 1, 16);
    expect(crossed.footstep).toBe(true);
    const notCrossed = advanceStride(0.1, 1, 1);
    expect(notCrossed.footstep).toBe(false);
  });
});

describe('strideBob / strideTilt（§45 視覺波形）', () => {
  it('bob 峰值受速度比縮放且不超過振幅上限', () => {
    expect(strideBob(Math.PI / 2, 1)).toBeCloseTo(WALK_BOB_PX, 5);
    expect(strideBob(Math.PI / 2, 0.5)).toBeCloseTo(WALK_BOB_PX / 2, 5);
    expect(strideBob(0, 1)).toBe(0);
    expect(strideBob(Math.PI / 2, 3)).toBeCloseTo(WALK_BOB_PX, 5);
  });

  it('tilt = 前傾 + 搖擺：全速峰值前傾為正、回擺仍保持正向重心', () => {
    const peak = strideTilt(Math.PI / 2, 1);
    const trough = strideTilt(-Math.PI / 2, 1);
    expect(peak).toBeGreaterThan(0);
    expect(trough).toBeGreaterThanOrEqual(0);
    expect(peak).toBeGreaterThan(trough);
    expect(strideTilt(Math.PI / 2, 0)).toBe(0);
  });
});

describe('idleBreath / airTilt（§45 姿態）', () => {
  it('idle 呼吸為 ±1.8% 內的緩慢正弦', () => {
    let max = 0;
    for (let t = 0; t < 2400; t += 50) max = Math.max(max, Math.abs(idleBreath(t)));
    expect(max).toBeGreaterThan(0.015);
    expect(max).toBeLessThanOrEqual(0.018);
    expect(idleBreath(0)).toBe(0);
  });

  it('空中姿態：上升後仰（負）、下墜前傾（正）、極速夾限', () => {
    expect(airTilt(-420)).toBeLessThan(0);
    expect(airTilt(500)).toBeGreaterThan(0);
    expect(airTilt(-99999)).toBe(-0.1);
    expect(airTilt(99999)).toBe(0.14);
  });
});

describe('advanceCrouch 蹲姿狀態轉換（§71）', () => {
  it('持續壓下 120ms 內線性升至 1 並夾限', () => {
    let crouch = 0;
    crouch = advanceCrouch(crouch, true, 60);
    expect(crouch).toBeCloseTo(0.5);
    crouch = advanceCrouch(crouch, true, 60);
    expect(crouch).toBe(1);
    expect(advanceCrouch(crouch, true, 500)).toBe(1);
  });

  it('鬆開後同速率回落至 0 並夾限', () => {
    let crouch = 1;
    crouch = advanceCrouch(crouch, false, 60);
    expect(crouch).toBeCloseTo(0.5);
    crouch = advanceCrouch(crouch, false, 60);
    expect(crouch).toBe(0);
    expect(advanceCrouch(crouch, false, 500)).toBe(0);
  });

  it('中途換向自當前比例續行（不跳變）', () => {
    const half = advanceCrouch(0, true, 60);
    const back = advanceCrouch(half, false, 30);
    expect(back).toBeCloseTo(0.25);
  });
});
