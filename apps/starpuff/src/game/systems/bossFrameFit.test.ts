import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createBossFrameFitter } from './bossFrameFit';
import { BOSS_ART_BOUNDS } from '../core/bossArtBounds';

vi.mock('./visualScale', () => ({
  getVisualScale: () => ({
    register: vi.fn(),
    rebase: vi.fn(),
    setBase: vi.fn(),
    fx: () => ({ sx: 1, sy: 1 }),
    mod: () => ({ sx: 1, sy: 1 }),
    killFxTweens: vi.fn(),
    resetFx: vi.fn(),
    isFxTweening: () => false,
    unregister: vi.fn(),
  }),
}));

const BODY_W = 170;
const BODY_H = 150;
// bossFrameFit 的判定內縮常數（與實作同值；改動時本測試需同步）。
const HITBOX_INSET = 0.9;

// 素材替身：512 畫布，scale 由 setDisplaySize 依 frame 尺寸推導——與 Phaser 同語意。
function makeSprite() {
  const FRAME = 512;
  const sprite = {
    scaleX: 1,
    scaleY: 1,
    displayWidth: FRAME,
    displayHeight: FRAME,
    body: {
      width: FRAME,
      height: FRAME,
      setSize(w: number, h: number) {
        this.width = w;
        this.height = h;
      },
    },
    setTexture: () => sprite,
    setDisplaySize(w: number, h: number) {
      sprite.scaleX = w / FRAME;
      sprite.scaleY = h / FRAME;
      sprite.displayWidth = w;
      sprite.displayHeight = h;
      return sprite;
    },
  };
  return sprite as unknown as Phaser.Physics.Arcade.Sprite & {
    body: { width: number; height: number };
  };
}

function makeScene(): Phaser.Scene {
  return { textures: { exists: () => true } } as unknown as Phaser.Scene;
}

// 世界尺寸＝未縮放 body 尺寸 × 當前 scale（Phaser Arcade updateBounds 的算式）。
const worldW = (s: ReturnType<typeof makeSprite>): number => s.body.width * s.scaleX;
const worldH = (s: ReturnType<typeof makeSprite>): number => s.body.height * s.scaleY;

describe('bossFrameFit 魔王換幀佔幅正規化（#943）', () => {
  it('小佔幅幀放大顯示框：可見身體的世界尺寸恆等於 base 幀', () => {
    const sprite = makeSprite();
    const fitter = createBossFrameFitter(makeScene(), sprite, {
      baseKey: 'boss-liudong',
      bodyW: BODY_W,
      bodyH: BODY_H,
    });
    const base = BOSS_ART_BOUNDS['boss-liudong'];
    const idle3 = BOSS_ART_BOUNDS['boss-liudong-idle-3'];
    expect(base).toBeDefined();
    expect(idle3).toBeDefined();
    // 前提固定：idle-3 佔幅顯著小於 base——本測試守的正是這個落差。
    expect(idle3!.w).toBeLessThan(base!.w * 0.85);

    fitter.setFrame('boss-liudong');
    const baseVisibleW = sprite.displayWidth * base!.w;

    fitter.setFrame('boss-liudong-idle-3');
    const idleVisibleW = sprite.displayWidth * idle3!.w;

    // 可見身體寬度跨幀恆定（修前為 170×0.58＝98.6px vs 170×0.815＝138.6px）。
    expect(idleVisibleW).toBeCloseTo(baseVisibleW, 6);
    expect(baseVisibleW).toBeCloseTo(BODY_W * base!.w, 6);
    // 顯示框確實被放大以補償小佔幅。
    expect(sprite.displayWidth).toBeGreaterThan(BODY_W);
  });

  it('碰撞箱世界尺寸跨幀恆定，且恆小於可見身體（看起來沒碰到就不扣血）', () => {
    const sprite = makeSprite();
    const fitter = createBossFrameFitter(makeScene(), sprite, {
      baseKey: 'boss-liudong',
      bodyW: BODY_W,
      bodyH: BODY_H,
    });
    const base = BOSS_ART_BOUNDS['boss-liudong']!;

    fitter.setFrame('boss-liudong');
    const hitW = worldW(sprite);
    const hitH = worldH(sprite);
    expect(hitW).toBeCloseTo(BODY_W * base.w * HITBOX_INSET, 6);
    expect(hitH).toBeCloseTo(BODY_H * base.h * HITBOX_INSET, 6);

    // 換到小佔幅幀後碰撞箱世界尺寸不得跟著顯示框放大（R8 教訓的反向守門）。
    fitter.setFrame('boss-liudong-idle-3');
    expect(worldW(sprite)).toBeCloseTo(hitW, 6);
    expect(worldH(sprite)).toBeCloseTo(hitH, 6);

    // 判定恆內縮於可見身體。
    expect(hitW).toBeLessThan(sprite.displayWidth * BOSS_ART_BOUNDS['boss-liudong-idle-3']!.w);
  });

  it('缺表鍵視為滿幅：正規化倍率退回 base 佔幅，不炸不放大到離譜尺寸', () => {
    const sprite = makeSprite();
    const fitter = createBossFrameFitter(makeScene(), sprite, {
      baseKey: 'boss-does-not-exist',
      bodyW: BODY_W,
      bodyH: BODY_H,
    });
    fitter.setFrame('boss-also-missing');
    // base 與該幀都缺表＝兩邊都當滿幅，顯示框退回原始 bodyW×bodyH（修前行為）。
    expect(sprite.displayWidth).toBeCloseTo(BODY_W, 6);
    expect(sprite.displayHeight).toBeCloseTo(BODY_H, 6);
    expect(worldW(sprite)).toBeCloseTo(BODY_W * HITBOX_INSET, 6);
  });

  it('缺圖靜默跳過：textures.exists 為偽時不動貼圖與尺寸（anti-softlock 契約）', () => {
    const sprite = makeSprite();
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    const fitter = createBossFrameFitter(scene, sprite, {
      baseKey: 'boss-liudong',
      bodyW: BODY_W,
      bodyH: BODY_H,
    });
    const before = sprite.displayWidth;
    fitter.setFrame('boss-liudong-idle-3');
    expect(sprite.displayWidth).toBe(before);
  });
});
