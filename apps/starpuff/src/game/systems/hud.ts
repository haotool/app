import type Phaser from 'phaser';
import { isMuted, setMuted } from '../audio/mute';
import { PLAYER, STAR, STAR_FLAVORS, type StarFlavor } from '../core/config';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';
import { fillStarPath } from './fx';

const HEART_TEX = 'hud-heart';
const STAR_TEX = 'hud-star';
const HUD_DEPTH = 100;
const MUTE_STORAGE_KEY = 'sp-muted';

export interface Hud {
  destroy(): void;
}

// 右上角靜音鈕（修復包 B）：Title 與 Game 場景共用；狀態經 localStorage 跨次保存。
export function addMuteButton(scene: Phaser.Scene): void {
  const label = () => (isMuted() ? '🔇' : '🔊');
  const button = scene.add
    .text(scene.scale.width - 12, 12, label(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      padding: { x: 10, y: 10 },
    })
    .setOrigin(1, 0)
    .setDepth(HUD_DEPTH + 20)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  button.on('pointerdown', () => {
    const next = !isMuted();
    setMuted(next);
    localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
    button.setText(label());
  });
}

// 開機還原上次靜音選擇；由 main.ts 於建立遊戲前呼叫。
export function restoreMutePreference(): void {
  setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === '1');
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

  const hearts: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < PLAYER.maxHp; i++) {
    hearts.push(scene.add.image(24 + i * 30, 26, HEART_TEX));
  }
  root.add(hearts);

  const ammoStars: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < STAR.maxAmmo; i++) {
    ammoStars.push(scene.add.image(22 + i * 26, 58, STAR_TEX).setAlpha(0.25));
  }
  root.add(ammoStars);

  // 關卡標示與擊殺配額進度（§15）：boss 關無配額，僅顯示關卡名。
  const labelStyle = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '18px',
    fontStyle: 'bold',
    color: '#3a3a4a',
    stroke: '#ffffff',
    strokeThickness: 4,
  };
  const stageText = scene.add.text(12, 78, '', labelStyle);
  const quotaText = scene.add.text(12, 102, '', labelStyle);
  root.add([stageText, quotaText]);

  // Boss HP 條：__WHITE 內建紋理拉伸上色，fill 以 scaleX tween 平滑更新。
  const barWidth = 320;
  const barHeight = 12;
  const bossBar = scene.add.container(centerX, 26).setAlpha(0);
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
    hearts.forEach((heart, i) => heart.setAlpha(i < hp ? 1 : 0.25));
    scene.tweens.add({
      targets: hearts,
      scale: 1.3,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      delay: scene.tweens.stagger(30),
    });
  }

  // 彈藥星依星彈屬性上色（§20）；HUD 星紋理本體為金黃，標準星以白 tint 保留原色。
  function updateAmmo(ammo: number, flavor: StarFlavor): void {
    const tint = flavor === 'jelly' ? 0xffffff : STAR_FLAVORS[flavor].tint;
    ammoStars.forEach((star, i) => {
      const filled = i < ammo;
      const wasFilled = star.alpha === 1;
      star.setTint(tint);
      star.setAlpha(filled ? 1 : 0.25);
      if (filled && !wasFilled) {
        scene.tweens.add({
          targets: star,
          scale: { from: 0.4, to: 1 },
          duration: 220,
          ease: 'Back.easeOut',
        });
      }
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
  bind(GameEvents.AMMO_CHANGED, ({ ammo, flavor }) => updateAmmo(ammo, flavor));
  bind(GameEvents.BOSS_SPAWNED, () => {
    barFill.scaleX = fullScaleX;
    scene.tweens.add({
      targets: bossBar,
      alpha: 1,
      y: { from: 12, to: 26 },
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
    quotaText.setText(isBoss ? '' : `⭐ 0/${killQuota}`);
    showAnnounce(isBoss ? '魔王來襲！' : `STAGE ${levelId} ${nameZh}`);
  });
  bind(GameEvents.LEVEL_QUOTA, ({ killCount, killQuota }) => {
    if (killQuota <= 0) return;
    quotaText.setText(`⭐ ${Math.min(killCount, killQuota)}/${killQuota}`);
  });
  bind(GameEvents.LEVEL_GATE_OPENED, () => {
    quotaText.setText('⭐ 星星門開啟！往右前進');
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
