import { describe, expect, it } from 'vitest';
import {
  MIRROR_SHADOW,
  shadowActive,
  shadowSpawnX,
  stepShadowX,
  stepShadowY,
} from './mirrorShadow';

describe('鏡像殘影（§5 W2）', () => {
  it('規格定值：壽命 6s、觸傷 1、1 發即破', () => {
    expect(MIRROR_SHADOW.lifespanMs).toBe(6000);
    expect(MIRROR_SHADOW.touchDamage).toBe(1);
    expect(MIRROR_SHADOW.hp).toBe(1);
  });

  it('生成位為 arena 中線鏡射', () => {
    expect(shadowSpawnX(400, 100)).toBe(700);
    expect(shadowSpawnX(400, 400)).toBe(400);
    expect(shadowSpawnX(400, 650)).toBe(150);
  });

  it('水平反向移動：玩家位移取負向套用（遠離殘影＝加速分離）', () => {
    // 玩家右移 10 → 殘影左移 10。
    expect(stepShadowX(700, 10)).toBe(690);
    // 玩家左移 10 → 殘影右移 10。
    expect(stepShadowX(700, -10)).toBe(710);
    // 玩家不動 → 殘影不動。
    expect(stepShadowX(700, 0)).toBe(700);
  });

  it('分離律：玩家向遠離殘影方向移動時間距單調擴大', () => {
    // 玩家 100（殘影 700 右側）向左走：間距擴大。
    let playerX = 100;
    let shadowX = 700;
    let gap = Math.abs(shadowX - playerX);
    for (let i = 0; i < 5; i += 1) {
      playerX -= 8;
      shadowX = stepShadowX(shadowX, -8);
      const next = Math.abs(shadowX - playerX);
      expect(next).toBeGreaterThan(gap);
      gap = next;
    }
  });

  it('垂直跟隨：速度上限逼近，不瞬移', () => {
    // 16ms 幀最大步長 = 320 * 0.016 = 5.12px。
    expect(stepShadowY(100, 300, 16)).toBeCloseTo(105.12, 2);
    expect(stepShadowY(300, 100, 16)).toBeCloseTo(294.88, 2);
    // 差距小於步長時直接貼齊。
    expect(stepShadowY(100, 102, 16)).toBe(102);
  });

  it('壽命窗：6s 內存活、期滿消散、未生成（-1）恆為非活', () => {
    expect(shadowActive(1000, 1000 + MIRROR_SHADOW.lifespanMs - 1)).toBe(true);
    expect(shadowActive(1000, 1000 + MIRROR_SHADOW.lifespanMs)).toBe(false);
    expect(shadowActive(-1, 5000)).toBe(false);
  });
});
