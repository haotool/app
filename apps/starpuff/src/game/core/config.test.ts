import { describe, expect, it } from 'vitest';
import { STAR, STAR_FLAVORS, computeLogicalWidth } from './config';

// 吞噬賦星效果表（GAME_DESIGN §20）：表驅動 SSOT 的守門測試。
describe('STAR_FLAVORS（§20）', () => {
  it('標準星（jelly）：傷害 5、速度 520、穿透 1、pitch 1.0', () => {
    expect(STAR_FLAVORS.jelly).toMatchObject({
      damage: 5,
      speed: 520,
      pierceCount: 1,
      sfxPitch: 1,
      aoeRadiusPx: 0,
    });
  });

  it('疾風星（floaty）：速度 650、穿透 2、藍紫 tint、pitch 1.15', () => {
    expect(STAR_FLAVORS.floaty).toMatchObject({
      damage: 5,
      speed: 650,
      pierceCount: 2,
      tint: 0xa78bfa,
      sfxPitch: 1.15,
      aoeRadiusPx: 0,
    });
  });

  it('爆裂星（puffy）：60px AoE 主 5 波及 2、珊瑚 tint、pitch 0.85', () => {
    expect(STAR_FLAVORS.puffy).toMatchObject({
      damage: 5,
      tint: 0xff8a80,
      aoeRadiusPx: 60,
      aoeDamage: 2,
      sfxPitch: 0.85,
    });
  });

  it('彈匣上限 5 不受屬性影響（§109 星暴 2.0：3 → 5 槽，滿匣自動結晶）', () => {
    expect(STAR.maxAmmo).toBe(5);
  });
});

// 響應寬幅邊界（§28）：clamp(round(aspect×480), 854, 1200) 的守門測試。
describe('computeLogicalWidth（§28 邊界）', () => {
  it('下限 clamp：窄比殼（1024×768 → raw 640）收斂至最小寬 854', () => {
    expect(computeLogicalWidth(1024, 768)).toBe(854);
  });

  it('上限 clamp：極寬殼（5000×480 → raw 5000）收斂至最大寬 1200', () => {
    expect(computeLogicalWidth(5000, 480)).toBe(1200);
  });

  it('邊界精確值直通：854×480 與 1200×480 不受 clamp 影響', () => {
    expect(computeLogicalWidth(854, 480)).toBe(854);
    expect(computeLogicalWidth(1200, 480)).toBe(1200);
  });

  it('極窄與無效量測回退最小寬：直式誤量（390×844）與零尺寸', () => {
    expect(computeLogicalWidth(390, 844)).toBe(854);
    expect(computeLogicalWidth(0, 480)).toBe(854);
    expect(computeLogicalWidth(854, 0)).toBe(854);
  });
});
