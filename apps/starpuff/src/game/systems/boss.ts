import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { createBossFsm, type BossCommand } from '../logic/bossFsm';

export interface BossHandle {
  spawn(): void;
  applyDamage(amount: number): void;
  update(deltaMs: number): void;
  destroy(): void;
  getBody(): Phaser.GameObjects.GameObject;
  getProjectiles(): Phaser.Physics.Arcade.Group;
  getShockwaves(): Phaser.Physics.Arcade.Group;
  onMinionDrop(handler: () => void): void;
}

const GROUND_TOP = CANVAS.height - 80;
const BOSS_W = 150;
const BOSS_H = 130;
const STAND_Y = GROUND_TOP - BOSS_H / 2;
const SIDE_X = { left: 110, right: CANVAS.width - 110 } as const;
const ENRAGE_TINT = { r: 255, g: 107, b: 107 } as const;

// 佔位材質：正式 sprite 由美術 stream 交付，缺件時以圓形烘焙保底避免 runtime crash。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-idle', 0x9b7bd8, BOSS_W, BOSS_H);
  bake('boss-enraged', 0xd86b7b, BOSS_W, BOSS_H);
  bake('boss-jelly-ball', 0xffb3c7, 20, 20);
  bake('boss-shockwave', 0xb69df0, 60, 16);
}

export function createBoss(scene: Phaser.Scene): BossHandle {
  ensureTextures(scene);

  const fsm = createBossFsm();
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let side: keyof typeof SIDE_X = 'right';

  const sprite = scene.physics.add.sprite(SIDE_X.right, -BOSS_H, 'boss-idle');
  sprite.setDisplaySize(BOSS_W, BOSS_H);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setImmovable(true);

  const projectiles = scene.physics.add.group({ maxSize: 16 });
  const shockwaves = scene.physics.add.group({ maxSize: 6, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 常駐果凍 wobble；slam / dash 期間暫停避免 scale 衝突。
  const wobble = scene.tweens.add({
    targets: sprite,
    scaleX: sprite.scaleX * 1.05,
    scaleY: sprite.scaleY * 0.94,
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    paused: true,
  });

  let enrageTween: Phaser.Tweens.Tween | null = null;

  const startEnrage = () => {
    sprite.setTexture('boss-enraged').setDisplaySize(BOSS_W, BOSS_H);
    enrageTween = scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const v = tween.getValue() ?? 0;
        const g = Math.round(255 - (255 - ENRAGE_TINT.g) * v);
        const b = Math.round(255 - (255 - ENRAGE_TINT.b) * v);
        sprite.setTint((ENRAGE_TINT.r << 16) | (g << 8) | b);
      },
    });
  };

  const flashWhite = () => {
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    delay(90, () => {
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      if (!enrageTween) sprite.clearTint();
    });
  };

  const shake = () => {
    scene.tweens.add({ targets: sprite, angle: 4, duration: 45, yoyo: true, repeat: 3 });
  };

  const launchRain = (count: number) => {
    const stagger = 660 / count / fsm.speedFactor;
    for (let i = 0; i < count; i += 1) {
      delay(i * stagger, () => {
        if (dying) return;
        const ball = projectiles.get(
          sprite.x,
          sprite.y - BOSS_H / 2,
          'boss-jelly-ball',
        ) as Phaser.Physics.Arcade.Sprite | null;
        if (!ball) return;
        ball.enableBody(true, sprite.x, sprite.y - BOSS_H / 2, true, true);
        ball.setVelocity(
          Phaser.Math.Between(60, 230) * (Math.random() < 0.5 ? -1 : 1),
          Phaser.Math.Between(-520, -340),
        );
      });
    }
  };

  const spawnShockwave = (directionX: 1 | -1) => {
    const wave = shockwaves.get(
      sprite.x + directionX * BOSS_W * 0.5,
      GROUND_TOP - 8,
      'boss-shockwave',
    ) as Phaser.Physics.Arcade.Sprite | null;
    if (!wave) return;
    wave.enableBody(true, sprite.x + directionX * BOSS_W * 0.5, GROUND_TOP - 8, true, true);
    wave.setVelocity(directionX * 320 * fsm.speedFactor, 0);
  };

  const doSlam = () => {
    wobble.pause();
    const sf = fsm.speedFactor;
    scene.tweens.chain({
      targets: sprite,
      tweens: [
        { y: STAND_Y - 170, duration: 300 / sf, ease: 'Quad.easeOut' },
        { y: STAND_Y, duration: 180 / sf, ease: 'Quad.easeIn' },
        { scaleX: sprite.scaleX * 1.22, scaleY: sprite.scaleY * 0.78, duration: 90, yoyo: true },
      ],
      onComplete: () => {
        wobble.resume();
      },
    });
    delay(480 / sf, () => {
      if (dying) return;
      scene.cameras.main.shake(180, 0.008);
      spawnShockwave(1);
      spawnShockwave(-1);
    });
  };

  const doDash = () => {
    wobble.pause();
    side = side === 'right' ? 'left' : 'right';
    const targetX = SIDE_X[side];
    sprite.setFlipX(side === 'left');
    scene.tweens.chain({
      targets: sprite,
      tweens: [
        { x: targetX, duration: 550 / fsm.speedFactor, ease: 'Sine.easeIn' },
        { scaleX: sprite.scaleX * 1.28, scaleY: sprite.scaleY * 0.76, duration: 110, yoyo: true },
      ],
      onComplete: () => {
        wobble.resume();
      },
    });
  };

  const runCommand = (command: BossCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'rain':
        launchRain(command.count);
        return;
      case 'slam':
        doSlam();
        return;
      case 'dash':
        doDash();
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(sprite);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: sprite.x, y: sprite.y });
    // 慢動作 0.5s（實時計時），恢復後星爆並淡出。
    scene.tweens.timeScale = 0.3;
    scene.physics.world.timeScale = 3;
    delay(500, () => {
      scene.tweens.timeScale = 1;
      scene.physics.world.timeScale = 1;
      const burst = scene.add.particles(0, 0, 'boss-jelly-ball', {
        speed: { min: 120, max: 340 },
        scale: { start: 0.9, end: 0 },
        lifespan: 650,
        blendMode: 'ADD',
        emitting: false,
      });
      burst.explode(28, sprite.x, sprite.y);
      delay(900, () => burst.destroy());
      scene.tweens.add({
        targets: sprite,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 420,
        ease: 'Back.easeIn',
      });
    });
  };

  return {
    spawn() {
      emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
      scene.tweens.add({
        targets: sprite,
        y: STAND_Y,
        duration: 900,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          scene.cameras.main.shake(300, 0.015);
          wobble.play();
          active = true;
        },
      });
    },
    applyDamage(amount: number) {
      if (!active) return;
      for (const event of fsm.takeDamage(amount)) {
        switch (event.kind) {
          case 'damaged':
            flashWhite();
            shake();
            emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
              hp: event.hp,
              maxHp: fsm.maxHp,
              damage: amount,
            });
            break;
          case 'phase':
            startEnrage();
            emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
            break;
          case 'minionDrop':
            minionHandlers.forEach((handler) => handler());
            break;
          case 'defeated':
            dieSequence();
            break;
          default: {
            const unhandled: never = event;
            throw new Error(`未知事件：${String(unhandled)}`);
          }
        }
      }
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      projectiles.getMatching('active', true).forEach((obj) => {
        const ball = obj as Phaser.Physics.Arcade.Sprite;
        const falling = (ball.body as Phaser.Physics.Arcade.Body).velocity.y > 0;
        if ((falling && ball.y > GROUND_TOP - 10) || ball.x < -40 || ball.x > CANVAS.width + 40) {
          killProjectile(ball);
        }
      });
      shockwaves.getMatching('active', true).forEach((obj) => {
        const wave = obj as Phaser.Physics.Arcade.Sprite;
        if (wave.x < -60 || wave.x > CANVAS.width + 60) killProjectile(wave);
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      enrageTween?.destroy();
      wobble.destroy();
      scene.tweens.killTweensOf(sprite);
      projectiles.destroy(true);
      shockwaves.destroy(true);
      sprite.destroy();
    },
    getBody() {
      return sprite;
    },
    getProjectiles() {
      return projectiles;
    },
    getShockwaves() {
      return shockwaves;
    },
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
  };
}
