import Phaser from 'phaser';
import { GameEvents, offGameEvent, onGameEvent, type GameEventPayloads } from '../core/events';
import type { EnemyKind } from '../core/types';

type Payload<K extends keyof GameEventPayloads> = GameEventPayloads[K];
type ScaleTarget = object & { scaleX: number; scaleY: number };
type TrailTarget = Phaser.GameObjects.GameObject & Phaser.Types.Math.Vector2Like;

export interface FxSystem {
  hitStop(durationMs: number): void;
  shake(intensityPx: number): void;
  flashWhite(target: Phaser.GameObjects.GameObject): void;
  squashStretch(target: ScaleTarget, strength?: number): void;
  startInhale(target: Phaser.Types.Math.Vector2Like, directionX: 1 | -1): void;
  stopInhale(): void;
  attachStarTrail(target: TrailTarget): () => void;
  trackBoss(target: Phaser.Types.Math.Vector2Like | null): void;
  damageNumber(x: number, y: number, amount: number): void;
  starBurst(x: number, y: number): void;
  confetti(): void;
  destroy(): void;
}

const DOT_KEY = 'fx-dot';
const STAR_KEY = 'fx-star';
const GOLD = 0xffd966;
const CONFETTI_TINTS = [0xff6b6b, 0xffd966, 0x7bd88f, 0x6bc5ff, 0xcbb7f0] as const;
const ENEMY_POP_TINTS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
};

// 缺 texture 時以 graphics 產生粒子紋理；美術 stream 預載正式 fx-star 後自動略過。
function ensureParticleTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(DOT_KEY)) {
    const g = scene.add.graphics().setVisible(false);
    g.fillStyle(0xffffff, 1).fillCircle(4, 4, 4);
    g.generateTexture(DOT_KEY, 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists(STAR_KEY)) {
    const g = scene.add.graphics().setVisible(false);
    const points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? 7.5 : 3.2;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      points.push(
        new Phaser.Math.Vector2(8 + radius * Math.cos(angle), 8 + radius * Math.sin(angle)),
      );
    }
    g.fillStyle(0xffffff, 1).fillPoints(points, true);
    g.generateTexture(STAR_KEY, 16, 16);
    g.destroy();
  }
}

export function createFx(scene: Phaser.Scene): FxSystem {
  ensureParticleTextures(scene);

  let enemyPopTint = 0xffffff;
  const enemyPop = scene.add
    .particles(0, 0, DOT_KEY, {
      speed: { min: 80, max: 220 },
      lifespan: 420,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: () => enemyPopTint,
      emitting: false,
      maxAliveParticles: 40,
    })
    .setDepth(80);

  const starBurstEmitter = scene.add
    .particles(0, 0, STAR_KEY, {
      speed: { min: 140, max: 460 },
      gravityY: 500,
      lifespan: { min: 900, max: 1600 },
      rotate: { start: 0, end: 360 },
      scale: { start: 1, end: 0.15 },
      alpha: { start: 1, end: 0 },
      tint: GOLD,
      blendMode: 'ADD',
      emitting: false,
      maxAliveParticles: 60,
    })
    .setDepth(80);

  // 吸入漩渦：粒子自外環生成並於生命週期結束時抵達嘴前（moveTo 收束）。
  const inhaleRing = {
    getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 24 + Math.random() * 32;
      point.x = Math.cos(angle) * radius;
      point.y = Math.sin(angle) * radius;
    },
  };
  const inhaleVortex = scene.add
    .particles(0, 0, DOT_KEY, {
      emitZone: { type: 'random' as const, source: inhaleRing },
      moveToX: 0,
      moveToY: 0,
      lifespan: 320,
      frequency: 36,
      quantity: 2,
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.9, end: 0.15 },
      tint: 0xfff3b0,
      emitting: false,
      maxAliveParticles: 24,
    })
    .setDepth(80);

  const confettiTopEdge = {
    getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
      point.x = Math.random() * scene.scale.width;
      point.y = -8;
    },
  };
  const confettiEmitter = scene.add
    .particles(0, 0, DOT_KEY, {
      emitZone: { type: 'random' as const, source: confettiTopEdge },
      gravityY: 420,
      speedX: { min: -60, max: 60 },
      speedY: { min: 40, max: 120 },
      rotate: { start: 0, end: 540 },
      lifespan: 2200,
      quantity: 2,
      frequency: 24,
      scale: { start: 0.9, end: 0.5 },
      tint: () => CONFETTI_TINTS[Math.floor(Math.random() * CONFETTI_TINTS.length)] ?? GOLD,
      emitting: false,
      maxAliveParticles: 90,
    })
    .setDepth(95);

  const squashTweens = new WeakMap<ScaleTarget, Phaser.Tweens.Tween>();
  const squashBase = new WeakMap<ScaleTarget, { x: number; y: number }>();
  let bossTarget: Phaser.Types.Math.Vector2Like | null = null;
  let hitStopTimer: Phaser.Time.TimerEvent | null = null;
  let slowMoTimer: Phaser.Time.TimerEvent | null = null;
  let destroyed = false;

  const restoreTimeScale = () => {
    scene.physics.world.timeScale = 1;
    scene.tweens.timeScale = 1;
  };

  // Arcade timeScale 越大越慢（1/scale），TweenManager timeScale 越小越慢（scale）。
  const slowMotion = (scale: number, durationMs: number) => {
    scene.physics.world.timeScale = 1 / scale;
    scene.tweens.timeScale = scale;
    slowMoTimer?.remove();
    slowMoTimer = scene.time.delayedCall(durationMs, restoreTimeScale);
  };

  const hitStop = (durationMs: number) => {
    scene.physics.pause();
    hitStopTimer?.remove();
    hitStopTimer = scene.time.delayedCall(durationMs, () => {
      scene.physics.resume();
      hitStopTimer = null;
    });
  };

  const shake = (intensityPx: number) => {
    scene.cameras.main.shake(120, intensityPx / scene.scale.width);
  };

  const flashWhite = (target: Phaser.GameObjects.GameObject) => {
    const tintable = target as Partial<{
      setTintFill(color: number): unknown;
      clearTint(): unknown;
    }>;
    if (typeof tintable.setTintFill !== 'function' || typeof tintable.clearTint !== 'function') {
      return;
    }
    tintable.setTintFill(0xffffff);
    scene.time.delayedCall(70, () => tintable.clearTint?.());
  };

  const squashStretch = (target: ScaleTarget, strength = 0.25) => {
    const base = squashBase.get(target) ?? { x: target.scaleX, y: target.scaleY };
    squashBase.set(target, base);
    squashTweens.get(target)?.remove();
    target.scaleX = base.x;
    target.scaleY = base.y;
    const tween = scene.tweens.add({
      targets: target,
      scaleX: base.x * (1 + strength),
      scaleY: base.y * (1 - strength),
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    squashTweens.set(target, tween);
  };

  const startInhale = (target: Phaser.Types.Math.Vector2Like, directionX: 1 | -1) => {
    inhaleVortex.startFollow(target, directionX * 36, 0);
    inhaleVortex.start();
  };

  const stopInhale = () => {
    inhaleVortex.stop();
    inhaleVortex.stopFollow();
  };

  const attachStarTrail = (target: TrailTarget) => {
    const trail = scene.add
      .particles(0, 0, STAR_KEY, {
        follow: target,
        speed: { min: 10, max: 40 },
        lifespan: 350,
        frequency: 34,
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.9, end: 0 },
        rotate: { min: 0, max: 360 },
        tint: GOLD,
        blendMode: 'ADD',
        maxAliveParticles: 14,
      })
      .setDepth(80);
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      trail.stop();
      scene.time.delayedCall(400, () => trail.destroy());
    };
    target.once('destroy', stop);
    return stop;
  };

  const trackBoss = (target: Phaser.Types.Math.Vector2Like | null) => {
    bossTarget = target;
  };

  const damageNumber = (x: number, y: number, amount: number) => {
    const text = scene.add
      .text(x + Phaser.Math.Between(-10, 10), y, `${amount}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#FF6B6B',
        stroke: '#FFFFFF',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setDepth(90);
    scene.tweens.add({
      targets: text,
      y: y - 46,
      alpha: 0,
      scale: 1.15,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  };

  const starBurst = (x: number, y: number) => {
    starBurstEmitter.explode(30, x, y);
  };

  const confetti = () => {
    confettiEmitter.start(0, 1400);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    offGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, onPlayerDamaged);
    offGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyKilled);
    offGameEvent(scene.events, GameEvents.BOSS_DAMAGED, onBossDamaged);
    offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
    offGameEvent(scene.events, GameEvents.GAME_WON, onGameWon);
    scene.events.off('shutdown', destroy);
    hitStopTimer?.remove();
    slowMoTimer?.remove();
    restoreTimeScale();
    if (scene.physics.world.isPaused) scene.physics.resume();
    [enemyPop, starBurstEmitter, inhaleVortex, confettiEmitter].forEach((emitter) =>
      emitter.destroy(),
    );
  };

  const onPlayerDamaged = () => {
    shake(4);
    scene.cameras.main.flash(90, 255, 255, 255);
  };
  const onEnemyKilled = (payload: Payload<'enemy:killed'>) => {
    enemyPopTint = ENEMY_POP_TINTS[payload.kind];
    enemyPop.explode(10, payload.x, payload.y);
  };
  const onBossDamaged = (payload: Payload<'boss:damaged'>) => {
    hitStop(60);
    if (bossTarget) damageNumber(bossTarget.x, bossTarget.y - 46, payload.damage);
  };
  const onBossDefeated = (payload: Payload<'boss:defeated'>) => {
    starBurst(payload.x, payload.y);
    slowMotion(0.3, 600);
  };
  const onGameWon = () => {
    confetti();
  };

  onGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, onPlayerDamaged);
  onGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyKilled);
  onGameEvent(scene.events, GameEvents.BOSS_DAMAGED, onBossDamaged);
  onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
  onGameEvent(scene.events, GameEvents.GAME_WON, onGameWon);
  scene.events.once('shutdown', destroy);

  return {
    hitStop,
    shake,
    flashWhite,
    squashStretch,
    startInhale,
    stopInhale,
    attachStarTrail,
    trackBoss,
    damageNumber,
    starBurst,
    confetti,
    destroy,
  };
}
