import type Phaser from 'phaser';

// 龜甲護罩呈現層（GAME_DESIGN §40 重設計）：全向綠色防護罩，逐幀重繪。
// 舊版殼盾是面向側弧盾；護甲改為不分正背面後，視覺也必須「整顆包起來」，
// 否則會誤導玩家去對正方向。狀態真值留在 logic/skills.ts，此處只負責畫。
// 抽為獨立模組（沿 chargedStar／formSkills 慣例）：player.ts 逼近 1200 行閘。

// 綠色與 §119 潮化泡泡盾的淡藍圓刻意區隔——兩者可能同時在場。
const ARMOR_TINT = 0x4ade80;
const ARMOR_RADIUS_PX = 34;
// 吸吐：半徑正弦脈動，與 idle 呼吸同語彙但週期略慢。
const ARMOR_BREATH_OMEGA = 0.003;
const ARMOR_BREATH_AMP = 0.07;
// 卸甲預告：剩餘不足 3 秒閃爍——形狀不變、僅明滅，色弱不依賴 tint 單一通道。
const ARMOR_WARN_MS = 3000;
const ARMOR_BLINK_INTERVAL_MS = 220;
// 龜甲同心六邊形佔罩半徑比。
const ARMOR_HEX_OUTER = 0.86;
const ARMOR_HEX_INNER = 0.44;

export interface TurtleArmorVisual {
  // armorMs 為剩餘護甲視窗；≤0 即清空不繪。
  draw(armorMs: number, x: number, y: number, nowMs: number): void;
  destroy(): void;
}

export function createTurtleArmor(scene: Phaser.Scene): TurtleArmorVisual {
  const gfx = scene.add.graphics().setDepth(94);

  // 以圓心與半徑描一個正六邊形外框（頂點朝上）。
  const strokeHex = (cx: number, cy: number, radius: number) => {
    gfx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const hx = cx + Math.cos(angle) * radius;
      const hy = cy + Math.sin(angle) * radius;
      if (i === 0) gfx.moveTo(hx, hy);
      else gfx.lineTo(hx, hy);
    }
    gfx.strokePath();
  };

  return {
    draw(armorMs, x, y, nowMs) {
      gfx.clear();
      if (armorMs <= 0) return;
      const radius =
        ARMOR_RADIUS_PX * (1 + Math.sin(nowMs * ARMOR_BREATH_OMEGA) * ARMOR_BREATH_AMP);
      const blink =
        armorMs <= ARMOR_WARN_MS && Math.floor(armorMs / ARMOR_BLINK_INTERVAL_MS) % 2 === 0;
      const alpha = blink ? 0.35 : 1;
      // 防護罩本體：柔光填充 + 外環。
      gfx.fillStyle(ARMOR_TINT, 0.16 * alpha);
      gfx.fillCircle(x, y, radius);
      gfx.lineStyle(3, ARMOR_TINT, 0.9 * alpha);
      gfx.strokeCircle(x, y, radius);
      // 龜甲紋：同心六邊形 + 輻射稜線，讀作龜殼而非泛用泡泡盾。
      gfx.lineStyle(2, ARMOR_TINT, 0.75 * alpha);
      strokeHex(x, y, radius * ARMOR_HEX_OUTER);
      strokeHex(x, y, radius * ARMOR_HEX_INNER);
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        gfx.beginPath();
        gfx.moveTo(
          x + Math.cos(angle) * radius * ARMOR_HEX_INNER,
          y + Math.sin(angle) * radius * ARMOR_HEX_INNER,
        );
        gfx.lineTo(
          x + Math.cos(angle) * radius * ARMOR_HEX_OUTER,
          y + Math.sin(angle) * radius * ARMOR_HEX_OUTER,
        );
        gfx.strokePath();
      }
    },
    destroy() {
      gfx.destroy();
    },
  };
}
