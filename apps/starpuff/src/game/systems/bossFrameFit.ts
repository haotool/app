import type Phaser from 'phaser';
import { BOSS_ART_BOUNDS, type ArtBounds } from '../core/bossArtBounds';
import { getVisualScale } from './visualScale';

// 魔王換幀單點（#943 根修）：顯示尺寸依素材佔幅正規化＋碰撞箱世界尺寸恆定。
//
// 病灶：各幀在 512 畫布內的實際不透明佔幅差異達 58%~100%，舊寫法對每幀硬套
// setDisplaySize(bodyW, bodyH)——畫面上的身體隨 idle 輪播忽大忽小，而物理箱恆定，
// 玩家在小佔幅幀時距離可見身體 15~20px 外就吃到接觸傷害（劉董 idle-3 最嚴重）。
//
// 修法：以「base 幀佔幅 / 該幀佔幅」放大顯示框，令可見身體的世界尺寸恆等於 base
// 幀；碰撞箱一律由 base 幀佔幅回推，與顯示框的縮放脫鉤——判定因而對齊眼睛所見。

// 缺表降級：未收錄的鍵視為滿幅，正規化倍率退回 1（行為等同修前）。
const FULL_BLEED_BOUNDS: ArtBounds = { w: 1, h: 1 };

// 接觸判定內縮（沿 enemies.ts 命中寬容慣例）：判定略小於可見身體——「看起來還沒
// 碰到」一律不得扣血。
const HITBOX_INSET = 0.9;

// this: void 標註讓消費端可直接把 setFrame 解構出來當獨立函式（各王的分鏡碼皆如此
// 使用），不觸發 unbound-method。
export interface BossFrameFitter {
  /** 換幀：缺圖靜默跳過（維持當前立繪），沿既有 anti-softlock 契約。 */
  setFrame(this: void, key: string): void;
  /** 重套碰撞箱：構築期取代各王 createBoss 內的固定比例 setSize。 */
  refit(this: void): void;
}

export function createBossFrameFitter(
  scene: Phaser.Scene,
  body: Phaser.Physics.Arcade.Sprite,
  opts: { baseKey: string; bodyW: number; bodyH: number },
): BossFrameFitter {
  const vscale = getVisualScale(scene);
  const baseBounds = BOSS_ART_BOUNDS[opts.baseKey] ?? FULL_BLEED_BOUNDS;

  const refit = (): void => {
    const phys = body.body as Phaser.Physics.Arcade.Body | null;
    if (!phys) return;
    // setSize 以未縮放 frame 像素計，而 displaySize 剛被幀佔幅改動——除以當前 scale
    // 抵銷，碰撞箱才不會跟著顯示框一起放大（沿 player.ts fitHurtbox 的 R8 教訓）。
    const sx = Math.abs(body.scaleX) || 1;
    const sy = Math.abs(body.scaleY) || 1;
    phys.setSize(
      (opts.bodyW * baseBounds.w * HITBOX_INSET) / sx,
      (opts.bodyH * baseBounds.h * HITBOX_INSET) / sy,
    );
    // 換裝當幀立即同步（#896）：否則 scale 已變而 body 快取未更，暫態誤差要等下一
    // 物理步才修正。測試替身的 body 為精簡物件——缺此法時略過，下一物理步自動收斂。
    phys.updateBounds?.();
  };

  return {
    setFrame(key) {
      if (!scene.textures.exists(key)) return;
      const bounds = BOSS_ART_BOUNDS[key] ?? FULL_BLEED_BOUNDS;
      body.setTexture(key);
      body.setDisplaySize(
        (opts.bodyW * baseBounds.w) / bounds.w,
        (opts.bodyH * baseBounds.h) / bounds.h,
      );
      refit();
      vscale.rebase(body);
    },
    refit,
  };
}
