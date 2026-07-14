import { describe, expect, it } from 'vitest';
import { STAR, STAR_FLAVORS } from './config';

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

  it('彈匣上限 3 不受屬性影響', () => {
    expect(STAR.maxAmmo).toBe(3);
  });
});
