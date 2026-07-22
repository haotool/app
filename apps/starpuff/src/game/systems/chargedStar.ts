import type Phaser from 'phaser';
import { CHARGED_STAR } from '../core/config';
import type { StarburstPhase } from '../core/types';

// 蓄能大星呈現（GAME_DESIGN §109）：結晶後跟隨玩家頭頂 22px 軌道漂浮——金色、
// 緩慢自轉、呼吸縮放、微光暈；蓄爆期（0.3s）加速斂縮增亮。純呈現層，狀態機
// 由 logic/starburst.ts 持有，player 逐幀餵座標與相位。

// 頭頂軌道（§109）：玩家頂緣（半身 24px）再上 22px。
const ORBIT_ABOVE_PX = 46;
const STAR_SIZE = 34;
const GLOW_SIZE = 62;
// 自轉/呼吸/漂浮節奏：緩慢低頻，不與受擊閃爍搶注意力。
const SPIN_RAD_PER_MS = 0.0011;
const BREATH_FREQ = 0.0021;
const BREATH_AMPLITUDE = 0.09;
const SWAY_FREQ = 0.0013;
const SWAY_PX = 3;
// 蓄爆演出：斂縮至 0.55 倍並增亮（不可取消的視覺承諾）。
const DETONATE_SHRINK = 0.55;

export interface ChargedStarVisual {
  update(x: number, y: number, deltaMs: number, phase: StarburstPhase): void;
  destroy(): void;
}

export function createChargedStar(scene: Phaser.Scene): ChargedStarVisual {
  const tex = scene.textures.exists('fx-star') ? 'fx-star' : '__WHITE';
  // 光暈墊底、星體在上；預設隱藏，phase 進 charged 才顯示。
  const glow = scene.add
    .image(0, 0, tex)
    .setDisplaySize(GLOW_SIZE, GLOW_SIZE)
    .setTint(CHARGED_STAR.tint)
    .setAlpha(0)
    .setVisible(false)
    .setDepth(94);
  const star = scene.add
    .image(0, 0, tex)
    .setDisplaySize(STAR_SIZE, STAR_SIZE)
    .setTint(CHARGED_STAR.tint)
    .setVisible(false)
    .setDepth(95);
  const baseScale = star.scale;
  const glowScale = glow.scale;
  let elapsedMs = 0;
  let wasVisible = false;

  return {
    update(x: number, y: number, deltaMs: number, phase: StarburstPhase) {
      const visible = phase !== 'none';
      if (visible !== wasVisible) {
        wasVisible = visible;
        star.setVisible(visible);
        glow.setVisible(visible);
        if (visible) elapsedMs = 0;
      }
      if (!visible) return;
      elapsedMs += deltaMs;
      const sway = Math.sin(elapsedMs * SWAY_FREQ) * SWAY_PX;
      const cx = x;
      const cy = y - ORBIT_ABOVE_PX + sway;
      const breath = 1 + Math.sin(elapsedMs * BREATH_FREQ) * BREATH_AMPLITUDE;
      // 蓄爆期：斂縮增亮＋加速自轉，0.3s 後由 player 結算星暴並轉 none。
      const detonating = phase === 'detonating';
      const scaleMul = detonating ? DETONATE_SHRINK : breath;
      star.setPosition(cx, cy);
      star.setScale(baseScale * scaleMul);
      star.rotation += SPIN_RAD_PER_MS * deltaMs * (detonating ? 6 : 1);
      glow.setPosition(cx, cy);
      glow.setScale(glowScale * (detonating ? 1.4 : breath));
      glow.setAlpha(detonating ? 0.6 : 0.3 + Math.sin(elapsedMs * BREATH_FREQ) * 0.08);
    },
    destroy() {
      star.destroy();
      glow.destroy();
    },
  };
}
