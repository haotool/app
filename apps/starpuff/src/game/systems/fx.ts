import Phaser from 'phaser';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';

export const FX_TEXTURES = {
  dot: 'fx-dot',
  star: 'fx-star-particle',
} as const;

const PASTELS = [0xffb3c7, 0xcbb7f0, 0xd9f29b, 0xffd966, 0xbff3e0];

type FxTarget = Phaser.GameObjects.GameObject & { x: number; y: number };
interface Scalable {
  scaleX: number;
  scaleY: number;
}
interface Tintable {
  setTint(color: number): unknown;
  setTintMode(mode: number): unknown;
  clearTint(): unknown;
}

export interface TrailHandle {
  stop(): void;
}

export interface FxSystem {
  hitStop(durationMs: number): void;
  shake(intensityPx: number): void;
  flashWhite(target: Phaser.GameObjects.GameObject): void;
  squashStretch(target: Scalable, intensity?: number): void;
  startInhale(mouth: Phaser.Types.Math.Vector2Like): void;
  stopInhale(): void;
  attachTrail(target: Phaser.Types.Math.Vector2Like): TrailHandle;
  damageNumber(x: number, y: number, amount: number): void;
  starBurst(x: number, y: number): void;
  puff(x: number, y: number): void;
  confetti(): void;
  attachPlayer(target: FxTarget): void;
  attachBoss(target: FxTarget): void;
  destroy(): void;
}

// 程序化粒子紋理（不依賴 art 資產）：8px 圓點與 16px 五角星。
export function ensureFxTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FX_TEXTURES.dot)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture(FX_TEXTURES.dot, 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists(FX_TEXTURES.star)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    fillStarPath(g, 8, 8, 8, 3.4);
    g.generateTexture(FX_TEXTURES.star, 16, 16);
    g.destroy();
  }
}

export function fillStarPath(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
): void {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

function canTint(go: object): go is Tintable {
  return 'setTint' in go && 'setTintMode' in go && 'clearTint' in go;
}

// 生成彈入：自 30% 縮放淡入回彈至原尺寸；供 enemies 等系統於 spawn 時直接呼叫。
export function popIn(
  scene: Phaser.Scene,
  target: Scalable & { alpha: number },
  durationMs = 260,
): void {
  scene.tweens.add({
    targets: target,
    scaleX: { from: target.scaleX * 0.3, to: target.scaleX },
    scaleY: { from: target.scaleY * 0.3, to: target.scaleY },
    alpha: { from: 0, to: target.alpha },
    duration: durationMs,
    ease: 'Back.easeOut',
  });
}

// 落地塵埃圈：地面向外揚起的一次性塵粒，播畢自毀；供 boss 入場落地等模組層呼叫。
export function landingDust(scene: Phaser.Scene, x: number, y: number): void {
  ensureFxTextures(scene);
  const dust = scene.add
    .particles(x, y, FX_TEXTURES.dot, {
      speed: { min: 70, max: 200 },
      angle: { min: 185, max: 355 },
      scale: { start: 1.3, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: { min: 260, max: 480 },
      gravityY: 300,
      tint: [0xe8d9c8, 0xd9c8b8, 0xfff1e0],
      emitting: false,
      maxAliveParticles: 24,
    })
    .setDepth(85);
  dust.explode(16);
  scene.time.delayedCall(600, () => dust.destroy());
}

// 落點預警：白描邊粉色橢圓標記，淡入後持續脈動，durationMs 後淡出自毀。
export function spawnTelegraph(
  scene: Phaser.Scene,
  x: number,
  y: number,
  durationMs: number,
): void {
  const mark = scene.add.ellipse(x, y, 64, 22, 0xff6fa5, 0.85).setAlpha(0);
  mark.setStrokeStyle(3, 0xffffff, 0.9);
  scene.tweens.add({
    targets: mark,
    alpha: { from: 0, to: 1 },
    scaleX: { from: 0.5, to: 1 },
    scaleY: { from: 0.5, to: 1 },
    duration: 180,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: mark,
        alpha: 0.45,
        duration: 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    },
  });
  scene.time.delayedCall(durationMs, () => {
    scene.tweens.killTweensOf(mark);
    scene.tweens.add({ targets: mark, alpha: 0, duration: 120, onComplete: () => mark.destroy() });
  });
}

export function createFx(scene: Phaser.Scene): FxSystem {
  ensureFxTextures(scene);

  const bus = scene.events;
  const unbinders: (() => void)[] = [];
  let playerRef: FxTarget | null = null;
  let bossRef: FxTarget | null = null;
  let mouthRef: Phaser.Types.Math.Vector2Like | null = null;
  let hitStopTimer: Phaser.Time.TimerEvent | null = null;
  let damageNumberCount = 0;
  let destroyed = false;

  const burst = scene.add
    .particles(0, 0, FX_TEXTURES.star, {
      speed: { min: 60, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 400, max: 800 },
      gravityY: 220,
      tint: [0xffd966, 0xfff3b0, 0xffb3c7],
      blendMode: 'ADD',
      emitting: false,
      maxAliveParticles: 80,
    })
    .setDepth(90);

  const puffEmitter = scene.add
    .particles(0, 0, FX_TEXTURES.dot, {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 200, max: 420 },
      tint: PASTELS,
      emitting: false,
      maxAliveParticles: 60,
    })
    .setDepth(85);

  // 吸入漩渦：粒子自環形外圈生成、朝嘴前點匯聚（moveTo onEmit 讀取當下位置）。
  const inhaleEmitter = scene.add
    .particles(0, 0, FX_TEXTURES.dot, {
      x: () => mouthRef?.x ?? 0,
      y: () => mouthRef?.y ?? 0,
      lifespan: 300,
      frequency: 24,
      quantity: 1,
      scale: { start: 0.9, end: 0.15 },
      alpha: { start: 0.85, end: 0.1 },
      tint: [0xffffff, 0xffd966, 0xbff3e0],
      emitZone: {
        type: 'random',
        source: {
          getRandomPoint: (point) => {
            const a = Math.random() * Math.PI * 2;
            const r = 46 + Math.random() * 50;
            point.x = Math.cos(a) * r;
            point.y = Math.sin(a) * r;
          },
        },
      },
      moveToX: () => mouthRef?.x ?? 0,
      moveToY: () => mouthRef?.y ?? 0,
      emitting: false,
      maxAliveParticles: 30,
    })
    .setDepth(85);

  const confettiEmitter = scene.add
    .particles(0, 0, FX_TEXTURES.dot, {
      x: { min: 0, max: scene.scale.width },
      y: -12,
      speedY: { min: 90, max: 200 },
      speedX: { min: -40, max: 40 },
      scale: { start: 1.2, end: 0.4 },
      rotate: { min: 0, max: 360 },
      lifespan: 2400,
      frequency: 24,
      quantity: 2,
      gravityY: 140,
      tint: PASTELS,
      emitting: false,
      maxAliveParticles: 120,
    })
    .setDepth(95)
    .setScrollFactor(0);

  function hitStop(durationMs: number): void {
    if (!hitStopTimer) scene.physics.pause();
    hitStopTimer?.remove();
    hitStopTimer = scene.time.delayedCall(durationMs, () => {
      hitStopTimer = null;
      scene.physics.resume();
    });
  }

  function shake(intensityPx: number): void {
    scene.cameras.main.shake(120, intensityPx / scene.scale.width);
  }

  function flashWhite(target: Phaser.GameObjects.GameObject): void {
    if (canTint(target)) {
      // Phaser 4 已移除 setTintFill(color)，改用 setTint + FILL tint mode。
      target.setTint(0xffffff);
      target.setTintMode(Phaser.TintModes.FILL);
      scene.time.delayedCall(80, () => {
        if (!target.scene) return;
        target.clearTint();
        target.setTintMode(Phaser.TintModes.MULTIPLY);
      });
      return;
    }
    scene.tweens.add({ targets: target, alpha: 0.25, duration: 60, yoyo: true, repeat: 1 });
  }

  // 進行中不重複觸發：避免以壓扁中的 scale 為基準疊乘造成漂移。
  const squashTweens = new WeakMap<Scalable, Phaser.Tweens.Tween>();

  function squashStretch(target: Scalable, intensity = 0.22): void {
    if (squashTweens.get(target)?.isPlaying()) return;
    squashTweens.set(
      target,
      scene.tweens.add({
        targets: target,
        scaleX: target.scaleX * (1 + intensity),
        scaleY: target.scaleY * (1 - intensity),
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
      }),
    );
  }

  function damageNumber(x: number, y: number, amount: number): void {
    if (damageNumberCount >= 12) return;
    damageNumberCount++;
    const text = scene.add
      .text(x, y, `${amount}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a3a4a',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(96);
    scene.tweens.add({
      targets: text,
      y: y - 46,
      alpha: { from: 1, to: 0 },
      duration: 480,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageNumberCount--;
        text.destroy();
      },
    });
  }

  function starBurst(x: number, y: number): void {
    burst.explode(28, x, y);
  }

  function puff(x: number, y: number): void {
    puffEmitter.explode(10, x, y);
  }

  function confetti(): void {
    confettiEmitter.start();
    scene.time.delayedCall(1400, () => confettiEmitter.stop());
  }

  // 魔王死亡慢動作：Arcade timeScale > 1 為減速，真實時間後恢復。
  function slowMo(scale: number, durationMs: number): void {
    scene.physics.world.timeScale = 1 / scale;
    scene.tweens.timeScale = scale;
    scene.time.delayedCall(durationMs, () => {
      scene.physics.world.timeScale = 1;
      scene.tweens.timeScale = 1;
    });
  }

  let phaseVignette: Phaser.GameObjects.Rectangle | null = null;
  let phaseDimmer: Phaser.GameObjects.Rectangle | null = null;

  const fullscreenRect = (color: number, depth: number): Phaser.GameObjects.Rectangle =>
    scene.add
      .rectangle(
        scene.scale.width / 2,
        scene.scale.height / 2,
        scene.scale.width,
        scene.scale.height,
        color,
        1,
      )
      .setAlpha(0)
      .setDepth(depth)
      .setScrollFactor(0);

  // P2 轉換震撼（§17）：時停 0.4s → 背景暗化 + 紫 vignette 常駐脈動 → 相機微震 2s → 皇冠星火。
  function phaseShock(): void {
    if (phaseVignette) return;
    hitStop(400);
    phaseDimmer = fullscreenRect(0x241436, 88);
    scene.tweens.add({ targets: phaseDimmer, alpha: 0.18, duration: 700, ease: 'Sine.easeOut' });
    phaseVignette = fullscreenRect(0x7a3df0, 90);
    scene.tweens.add({
      targets: phaseVignette,
      alpha: { from: 0.14, to: 0.05 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.cameras.main.shake(2000, 0.0022);
    if (bossRef?.scene) burst.explode(24, bossRef.x, bossRef.y - 70);
  }

  function clearPhaseOverlays(): void {
    for (const rect of [phaseVignette, phaseDimmer]) {
      if (!rect) continue;
      scene.tweens.killTweensOf(rect);
      scene.tweens.add({
        targets: rect,
        alpha: 0,
        duration: 400,
        onComplete: () => rect.destroy(),
      });
    }
    phaseVignette = null;
    phaseDimmer = null;
  }

  function bind<K extends GameEventName>(
    event: K,
    handler: Parameters<typeof onGameEvent<K>>[2],
  ): void {
    onGameEvent(bus, event, handler);
    unbinders.push(() => offGameEvent(bus, event, handler));
  }

  bind(GameEvents.PLAYER_DAMAGED, () => {
    shake(4);
    if (playerRef?.scene) {
      flashWhite(playerRef);
      squashStretch(playerRef as unknown as Scalable, 0.28);
    }
  });
  bind(GameEvents.ENEMY_KILLED, ({ x, y }) => puff(x, y));
  bind(GameEvents.BOSS_SPAWNED, () => shake(6));
  bind(GameEvents.BOSS_DAMAGED, ({ damage }) => {
    hitStop(60);
    if (bossRef?.scene) {
      flashWhite(bossRef);
      damageNumber(bossRef.x, bossRef.y - 70, damage);
    } else {
      damageNumber(scene.scale.width / 2, 120, damage);
    }
  });
  bind(GameEvents.BOSS_PHASE, () => phaseShock());
  bind(GameEvents.BOSS_DEFEATED, ({ x, y }) => {
    clearPhaseOverlays();
    starBurst(x, y);
    slowMo(0.3, 600);
  });
  bind(GameEvents.GAME_WON, () => confetti());

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    unbinders.forEach((off) => off());
    unbinders.length = 0;
    hitStopTimer?.remove();
    hitStopTimer = null;
    [burst, puffEmitter, inhaleEmitter, confettiEmitter].forEach((e) => e.destroy());
    phaseVignette?.destroy();
    phaseDimmer?.destroy();
  }

  scene.events.once('shutdown', destroy);

  return {
    hitStop,
    shake,
    flashWhite,
    squashStretch,
    startInhale(mouth) {
      mouthRef = mouth;
      inhaleEmitter.start();
    },
    stopInhale() {
      inhaleEmitter.stop();
    },
    attachTrail(target) {
      const trail = scene.add
        .particles(0, 0, FX_TEXTURES.star, {
          follow: target,
          speed: { min: 5, max: 30 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.8, end: 0 },
          rotate: { min: 0, max: 360 },
          lifespan: 260,
          frequency: 28,
          blendMode: 'ADD',
          tint: 0xffd966,
          maxAliveParticles: 24,
        })
        .setDepth(80);
      return {
        stop() {
          if (!trail.scene) return;
          trail.stop();
          scene.time.delayedCall(320, () => trail.destroy());
        },
      };
    },
    damageNumber,
    starBurst,
    puff,
    confetti,
    attachPlayer(target) {
      playerRef = target;
    },
    attachBoss(target) {
      bossRef = target;
    },
    destroy,
  };
}
