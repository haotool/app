import type Phaser from 'phaser';
import { PLAYER, STAR } from '../core/config';
import { GameEvents, offGameEvent, onGameEvent, type GameEventPayloads } from '../core/events';
import type { WaveId } from '../core/types';

type Payload<K extends keyof GameEventPayloads> = GameEventPayloads[K];

export interface Hud {
  destroy(): void;
}

const DEPTH = 100;
const BAR_W = 300;
const BAR_H = 14;
const BOSS_COLOR_P1 = 0x9b7bd8;
const BOSS_COLOR_P2 = 0xff6b6b;
const WAVE_LABELS: Record<WaveId, string> = {
  tutorial: '準備開始！',
  wave1: '第 1 波',
  wave2: '第 2 波',
  boss: '魔王來襲！',
};

export function createHud(scene: Phaser.Scene): Hud {
  const { width, height } = scene.scale;
  const uiText = (
    x: number,
    y: number,
    content: string,
    fontSize: string,
    color: string,
  ): Phaser.GameObjects.Text =>
    scene.add
      .text(x, y, content, {
        fontFamily: 'system-ui, sans-serif',
        fontSize,
        fontStyle: 'bold',
        color,
        stroke: '#FFFFFF',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH);

  const hearts = Array.from({ length: PLAYER.maxHp }, (_, i) =>
    uiText(34 + i * 32, 32, '♥', '28px', '#FF6B8A'),
  );
  const stars = Array.from({ length: STAR.maxAmmo }, (_, i) =>
    uiText(32 + i * 30, 68, '★', '24px', '#FFB300').setAlpha(0.22),
  );

  const barX = (width - BAR_W) / 2;
  const barY = 100;
  const bossBg = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH).setVisible(false);
  bossBg.fillStyle(0x3a3a4a, 0.55);
  bossBg.fillRoundedRect(barX - 3, barY - 3, BAR_W + 6, BAR_H + 6, (BAR_H + 6) / 2);
  const bossFill = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH).setVisible(false);
  const bossLabel = uiText(width / 2, barY - 18, '果凍王', '16px', '#6B5AA0').setVisible(false);

  const bossRatio = { value: 1 };
  let bossColor = BOSS_COLOR_P1;
  let bossTween: Phaser.Tweens.Tween | null = null;

  const drawBossFill = () => {
    bossFill.clear();
    const w = BAR_W * Math.max(0, Math.min(1, bossRatio.value));
    if (w < 1) return;
    bossFill.fillStyle(bossColor, 1);
    bossFill.fillRoundedRect(barX, barY, w, BAR_H, Math.min(BAR_H / 2, w / 2));
  };

  const waveText = uiText(width / 2, height * 0.32, '', '36px', '#3A3A4A').setAlpha(0);

  const setHearts = (hp: number) => {
    hearts.forEach((heart, i) => heart.setAlpha(i < hp ? 1 : 0.22));
  };
  const setStars = (ammo: number) => {
    stars.forEach((star, i) => star.setAlpha(i < ammo ? 1 : 0.22));
  };

  let prevAmmo = 0;
  let destroyed = false;

  const onPlayerDamaged = (payload: Payload<'player:damaged'>) => {
    setHearts(payload.hp);
    scene.tweens.add({
      targets: hearts,
      scale: 1.35,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      delay: scene.tweens.stagger(40),
    });
  };

  const onAmmoChanged = (payload: Payload<'ammo:changed'>) => {
    setStars(payload.ammo);
    const gained = stars[payload.ammo - 1];
    if (payload.ammo > prevAmmo && gained) {
      scene.tweens.add({
        targets: gained,
        scale: 1.5,
        duration: 110,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
    prevAmmo = payload.ammo;
  };

  const onBossSpawned = () => {
    bossRatio.value = 1;
    bossColor = BOSS_COLOR_P1;
    drawBossFill();
    [bossBg, bossFill, bossLabel].forEach((obj) => obj.setVisible(true).setAlpha(0));
    scene.tweens.add({ targets: [bossBg, bossFill, bossLabel], alpha: 1, duration: 300 });
  };

  const onBossDamaged = (payload: Payload<'boss:damaged'>) => {
    bossTween?.remove();
    bossTween = scene.tweens.add({
      targets: bossRatio,
      value: payload.hp / payload.maxHp,
      duration: 180,
      ease: 'Quad.easeOut',
      onUpdate: drawBossFill,
    });
  };

  const onBossPhase = (payload: Payload<'boss:phase'>) => {
    bossColor = payload.phase === 'p2' ? BOSS_COLOR_P2 : BOSS_COLOR_P1;
    drawBossFill();
  };

  const onBossDefeated = () => {
    scene.tweens.add({
      targets: [bossBg, bossFill, bossLabel],
      alpha: 0,
      duration: 400,
      onComplete: () => [bossBg, bossFill, bossLabel].forEach((obj) => obj.setVisible(false)),
    });
  };

  const onWaveChanged = (payload: Payload<'wave:changed'>) => {
    scene.tweens.killTweensOf(waveText);
    waveText.setText(WAVE_LABELS[payload.wave]).setAlpha(0).setScale(0.8);
    scene.tweens.chain({
      targets: waveText,
      tweens: [
        { alpha: 1, scale: 1, duration: 200, ease: 'Back.easeOut' },
        { alpha: 0, duration: 300, delay: 800 },
      ],
    });
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    offGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, onPlayerDamaged);
    offGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
    offGameEvent(scene.events, GameEvents.BOSS_SPAWNED, onBossSpawned);
    offGameEvent(scene.events, GameEvents.BOSS_DAMAGED, onBossDamaged);
    offGameEvent(scene.events, GameEvents.BOSS_PHASE, onBossPhase);
    offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
    offGameEvent(scene.events, GameEvents.WAVE_CHANGED, onWaveChanged);
    scene.events.off('shutdown', destroy);
    bossTween?.remove();
    [...hearts, ...stars, bossBg, bossFill, bossLabel, waveText].forEach((obj) => obj.destroy());
  };

  setHearts(PLAYER.maxHp);
  setStars(0);
  onGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, onPlayerDamaged);
  onGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
  onGameEvent(scene.events, GameEvents.BOSS_SPAWNED, onBossSpawned);
  onGameEvent(scene.events, GameEvents.BOSS_DAMAGED, onBossDamaged);
  onGameEvent(scene.events, GameEvents.BOSS_PHASE, onBossPhase);
  onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
  onGameEvent(scene.events, GameEvents.WAVE_CHANGED, onWaveChanged);
  scene.events.once('shutdown', destroy);

  return { destroy };
}
