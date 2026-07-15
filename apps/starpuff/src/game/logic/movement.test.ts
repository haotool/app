import { describe, expect, it } from 'vitest';
import { PLAYER } from '../core/config';
import { approachVelocity, detectMoveFx } from './movement';

describe('approachVelocity（§41 加減速曲線）', () => {
  it('起步逐幀加速，約 0.16s 內達全速且不超調', () => {
    let v = 0;
    let elapsed = 0;
    while (v < PLAYER.moveSpeed && elapsed < 1000) {
      v = approachVelocity(v, PLAYER.moveSpeed, 16);
      elapsed += 16;
    }
    expect(v).toBe(PLAYER.moveSpeed);
    expect(elapsed).toBeLessThanOrEqual(176);
    expect(approachVelocity(PLAYER.moveSpeed, PLAYER.moveSpeed, 16)).toBe(PLAYER.moveSpeed);
  });

  it('鬆手減速至停定，殘速吸附歸零', () => {
    let v: number = PLAYER.moveSpeed;
    let elapsed = 0;
    while (v !== 0 && elapsed < 1000) {
      v = approachVelocity(v, 0, 16);
      elapsed += 16;
    }
    expect(v).toBe(0);
    expect(elapsed).toBeLessThanOrEqual(128);
    expect(approachVelocity(5, 0, 16)).toBe(0);
  });

  it('反向輸入以加減速疊加率轉身，快於純加速', () => {
    const turn = approachVelocity(PLAYER.moveSpeed, -PLAYER.moveSpeed, 16);
    const accelOnly = approachVelocity(0, -PLAYER.moveSpeed, 16);
    expect(PLAYER.moveSpeed - turn).toBeGreaterThan(0 - accelOnly);
    expect(turn).toBeLessThan(PLAYER.moveSpeed);
  });

  it('超速殘速（擊退/疾衝）夾回常速帶，維持疾衝距離契約', () => {
    expect(approachVelocity(1000, PLAYER.moveSpeed, 16)).toBe(PLAYER.moveSpeed);
    expect(approachVelocity(-1000, -PLAYER.moveSpeed, 16)).toBe(-PLAYER.moveSpeed);
    const stopping = approachVelocity(1000, 0, 16);
    expect(stopping).toBeLessThan(PLAYER.moveSpeed);
    expect(stopping).toBeGreaterThan(0);
  });
});

describe('detectMoveFx（§41 手感事件邊緣）', () => {
  it('靜止起跑觸發 run-start；行進中不重複', () => {
    expect(detectMoveFx({ onGround: true, prevTarget: 0, target: 220, velocityX: 0 })).toBe(
      'run-start',
    );
    expect(detectMoveFx({ onGround: true, prevTarget: 220, target: 220, velocityX: 180 })).toBe(
      null,
    );
  });

  it('高速鬆手觸發 hard-stop；低速鬆手無事件', () => {
    expect(detectMoveFx({ onGround: true, prevTarget: 220, target: 0, velocityX: 200 })).toBe(
      'hard-stop',
    );
    expect(detectMoveFx({ onGround: true, prevTarget: 220, target: 0, velocityX: 80 })).toBe(null);
  });

  it('高速反向觸發 turn；空中一律無事件', () => {
    expect(detectMoveFx({ onGround: true, prevTarget: 220, target: -220, velocityX: 200 })).toBe(
      'turn',
    );
    expect(detectMoveFx({ onGround: false, prevTarget: 220, target: -220, velocityX: 200 })).toBe(
      null,
    );
  });
});
