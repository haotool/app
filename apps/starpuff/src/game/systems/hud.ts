import type Phaser from 'phaser';
import { isMuted, setMuted } from '../audio/mute';
import {
  CHARGED_STAR,
  EGG_HP_CAP,
  PLAYER,
  STAR,
  STAR_FLAVORS,
  type MagazineSlot,
} from '../core/config';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';
import { fillStarPath } from './fx';

const HEART_TEX = 'hud-heart';
const STAR_TEX = 'hud-star';
const SLOT_RING_TEX = 'hud-slot-ring';
const SPEAKER_ON_TEX = 'hud-spk-on';
const SPEAKER_OFF_TEX = 'hud-spk-off';
const HUD_DEPTH = 100;
const MUTE_STORAGE_KEY = 'sp-muted';

export interface Hud {
  destroy(): void;
}

// 喇叭圖形（§21 去文字化）：喇叭錐體 + 聲波弧；靜音態改斜線覆蓋。
function ensureSpeakerTextures(scene: Phaser.Scene): void {
  const drawBody = (g: Phaser.GameObjects.Graphics) => {
    g.fillStyle(0x3a3a4a, 0.85);
    g.fillRect(4, 11, 6, 8);
    g.fillTriangle(10, 15, 17, 7, 17, 23);
  };
  if (!scene.textures.exists(SPEAKER_ON_TEX)) {
    const g = scene.add.graphics();
    drawBody(g);
    g.lineStyle(2.5, 0x3a3a4a, 0.85);
    g.beginPath();
    g.arc(18, 15, 5, -0.9, 0.9);
    g.strokePath();
    g.beginPath();
    g.arc(18, 15, 9, -0.9, 0.9);
    g.strokePath();
    g.generateTexture(SPEAKER_ON_TEX, 30, 30);
    g.destroy();
  }
  if (!scene.textures.exists(SPEAKER_OFF_TEX)) {
    const g = scene.add.graphics();
    drawBody(g);
    g.lineStyle(3, 0xd94b4b, 0.9);
    g.lineBetween(4, 4, 26, 26);
    g.generateTexture(SPEAKER_OFF_TEX, 30, 30);
    g.destroy();
  }
}

// 右上角靜音鈕（修復包 B）：Title 與 Game 場景共用；狀態經 localStorage 跨次保存。
export function addMuteButton(scene: Phaser.Scene): void {
  ensureSpeakerTextures(scene);
  const texture = () => (isMuted() ? SPEAKER_OFF_TEX : SPEAKER_ON_TEX);
  const button = scene.add
    .image(scene.scale.width - 26, 26, texture())
    .setDepth(HUD_DEPTH + 20)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  // 觸控熱區擴至 48px（HIG 44pt+）：以紋理中心向外擴張，不放大視覺。
  (button.input?.hitArea as Phaser.Geom.Rectangle | undefined)?.setTo(-9, -9, 48, 48);
  button.on('pointerdown', () => {
    const next = !isMuted();
    setMuted(next);
    // 隱私模式下 localStorage 可能拋錯：靜音仍生效，僅不跨次保存。
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* noop */
    }
    button.setTexture(texture());
  });
}

// 開機還原上次靜音選擇；由 main.ts 於建立遊戲前呼叫。
export function restoreMutePreference(): void {
  // 隱私模式下 localStorage 可能拋錯：維持預設不靜音。
  try {
    setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === '1');
  } catch {
    /* noop */
  }
}

function ensureHudTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(HEART_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(0xff6b8a, 1);
    g.fillCircle(7, 8, 6.5);
    g.fillCircle(17, 8, 6.5);
    g.fillTriangle(1.5, 11, 22.5, 11, 12, 22);
    g.generateTexture(HEART_TEX, 24, 24);
    g.destroy();
  }
  if (!scene.textures.exists(STAR_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffd966, 1);
    fillStarPath(g, 10, 10, 10, 4.2);
    g.generateTexture(STAR_TEX, 20, 20);
    g.destroy();
  }
  // 強化槽金邊（§23）：星形外圈描邊，charged/gold 槽位顯示。
  if (!scene.textures.exists(SLOT_RING_TEX)) {
    const g = scene.add.graphics();
    g.lineStyle(2.5, CHARGED_STAR.tint, 1);
    g.strokeCircle(14, 14, 12);
    g.generateTexture(SLOT_RING_TEX, 28, 28);
    g.destroy();
  }
}

export function createHud(scene: Phaser.Scene): Hud {
  ensureHudTextures(scene);
  addMuteButton(scene);

  const bus = scene.events;
  const unbinders: (() => void)[] = [];
  const centerX = scene.scale.width / 2;
  let destroyed = false;
  let waveText: Phaser.GameObjects.Text | null = null;

  const root = scene.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);

  // 心心至彩蛋上限 6（§24）：第 6 顆僅在超額治療時顯示。
  const hearts: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < EGG_HP_CAP; i++) {
    hearts.push(scene.add.image(24 + i * 30, 26, HEART_TEX).setVisible(i < PLAYER.maxHp));
  }
  root.add(hearts);

  const ammoStars: Phaser.GameObjects.Image[] = [];
  const slotRings: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < STAR.maxAmmo; i++) {
    ammoStars.push(scene.add.image(22 + i * 26, 58, STAR_TEX).setAlpha(0.25));
    slotRings.push(scene.add.image(22 + i * 26, 58, SLOT_RING_TEX).setVisible(false));
  }
  root.add(ammoStars);
  root.add(slotRings);

  // 頂列橫排（§21）：HP 左上、STAGE 中上、配額（星形+數字）右上、Boss 條頂中。
  const labelStyle = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '18px',
    fontStyle: 'bold',
    color: '#3a3a4a',
    stroke: '#ffffff',
    strokeThickness: 4,
  };
  const stageText = scene.add.text(centerX, 26, '', labelStyle).setOrigin(0.5);
  const quotaIcon = scene.add.image(scene.scale.width - 64, 26, STAR_TEX).setVisible(false);
  const quotaText = scene.add.text(scene.scale.width - 78, 26, '', labelStyle).setOrigin(1, 0.5);
  root.add([stageText, quotaIcon, quotaText]);

  // Boss HP 條：__WHITE 內建紋理拉伸上色，fill 以 scaleX tween 平滑更新。
  const barWidth = 320;
  const barHeight = 12;
  const bossBar = scene.add.container(centerX, 52).setAlpha(0);
  const barBg = scene.add
    .image(0, 0, '__WHITE')
    .setDisplaySize(barWidth + 4, barHeight + 4)
    .setTint(0x3a3a4a)
    .setAlpha(0.45);
  const barFill = scene.add
    .image(-barWidth / 2, 0, '__WHITE')
    .setOrigin(0, 0.5)
    .setDisplaySize(barWidth, barHeight)
    .setTint(0x9b7bd8);
  const fullScaleX = barFill.scaleX;
  bossBar.add([barBg, barFill]);
  root.add(bossBar);

  function updateHearts(hp: number): void {
    hearts.forEach((heart, i) => {
      heart.setVisible(i < PLAYER.maxHp || i < hp);
      heart.setAlpha(i < hp ? 1 : 0.25);
    });
    scene.tweens.add({
      targets: hearts,
      scale: 1.3,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      delay: scene.tweens.stagger(30),
    });
  }

  // 槽位彈匣（§23）：每槽依屬性上色、charged/gold 加金邊；標準星白 tint 保留原色。
  function updateAmmo(magazine: readonly MagazineSlot[]): void {
    ammoStars.forEach((star, i) => {
      const slot = magazine[i];
      const wasFilled = star.alpha === 1;
      if (slot) {
        star.setTint(
          slot.gold
            ? CHARGED_STAR.tint
            : slot.flavor === 'jelly'
              ? 0xffffff
              : STAR_FLAVORS[slot.flavor].tint,
        );
        star.setAlpha(1);
        if (!wasFilled) {
          scene.tweens.add({
            targets: star,
            scale: { from: 0.4, to: 1 },
            duration: 220,
            ease: 'Back.easeOut',
          });
        }
      } else {
        star.setTint(0xffffff);
        star.setAlpha(0.25);
      }
      slotRings[i]?.setVisible(Boolean(slot && (slot.charged || slot.gold)));
    });
  }

  function showAnnounce(message: string): void {
    waveText?.destroy();
    waveText = scene.add
      .text(centerX, scene.scale.height * 0.34, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a3a4a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 10)
      .setScrollFactor(0)
      .setAlpha(0);
    scene.tweens.chain({
      targets: waveText,
      tweens: [
        { alpha: 1, duration: 200, ease: 'Quad.easeOut' },
        { alpha: 0, y: '-=20', duration: 300, delay: 900, ease: 'Quad.easeIn' },
      ],
      onComplete: () => {
        waveText?.destroy();
        waveText = null;
      },
    });
  }

  function bind<K extends GameEventName>(
    event: K,
    handler: Parameters<typeof onGameEvent<K>>[2],
  ): void {
    onGameEvent(bus, event, handler);
    unbinders.push(() => offGameEvent(bus, event, handler));
  }

  bind(GameEvents.PLAYER_DAMAGED, ({ hp }) => updateHearts(hp));
  bind(GameEvents.PLAYER_HEALED, ({ hp }) => updateHearts(hp));
  bind(GameEvents.AMMO_CHANGED, ({ magazine }) => updateAmmo(magazine));
  bind(GameEvents.BOSS_SPAWNED, () => {
    barFill.scaleX = fullScaleX;
    scene.tweens.add({
      targets: bossBar,
      alpha: 1,
      y: { from: 38, to: 52 },
      duration: 300,
      ease: 'Quad.easeOut',
    });
  });
  bind(GameEvents.BOSS_DAMAGED, ({ hp, maxHp }) => {
    scene.tweens.add({
      targets: barFill,
      scaleX: fullScaleX * Math.max(0, hp / maxHp),
      duration: 180,
      ease: 'Cubic.easeOut',
    });
  });
  bind(GameEvents.BOSS_PHASE, ({ phase }) => {
    if (phase === 'p2') barFill.setTint(0xd94b4b);
  });
  bind(GameEvents.BOSS_DEFEATED, () => {
    scene.tweens.add({ targets: bossBar, alpha: 0, duration: 400 });
  });

  bind(GameEvents.LEVEL_CHANGED, ({ levelId, nameZh, killQuota }) => {
    const isBoss = killQuota <= 0;
    stageText.setText(`STAGE ${levelId} ${nameZh}`);
    quotaIcon.setVisible(!isBoss);
    quotaText.setText(isBoss ? '' : `0/${killQuota}`);
    showAnnounce(isBoss ? '魔王來襲！' : `STAGE ${levelId} ${nameZh}`);
  });
  bind(GameEvents.LEVEL_QUOTA, ({ killCount, killQuota }) => {
    if (killQuota <= 0) return;
    quotaText.setText(`${Math.min(killCount, killQuota)}/${killQuota}`);
  });
  bind(GameEvents.LEVEL_GATE_OPENED, () => {
    quotaText.setText('星星門開啟！往右前進');
  });

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    unbinders.forEach((off) => off());
    unbinders.length = 0;
    waveText?.destroy();
    waveText = null;
    root.destroy(true);
  }

  scene.events.once('shutdown', destroy);

  return { destroy };
}
