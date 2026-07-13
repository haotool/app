import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';

export interface EnemyTarget {
  x: number;
  y: number;
}

export interface EnemySystem {
  spawn(kind: EnemyKind, x: number, y: number): void;
  kill(enemy: Phaser.GameObjects.GameObject): void;
  removeInhaled(enemy: Phaser.GameObjects.GameObject): void;
  kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null;
  getGroup(): Phaser.Physics.Arcade.Group;
  setTarget(target: EnemyTarget | null): void;
  aliveCount(): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// texture keys 凍結（GAME_DESIGN §10）；缺圖時以同色圓角色塊代替。
const TEXTURES: Record<EnemyKind, string> = {
  jelly: 'minion-jelly',
  floaty: 'minion-floaty',
  spiky: 'minion-spiky',
};

const FALLBACK_COLORS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
};

const SIZE = 40;
const POOL_SIZE = 16;
const JELLY_HOP_INTERVAL_MS = 1300;
const JELLY_HOP_VX = 130;
const JELLY_HOP_VY = -380;
const FLOATY_SPEED = 100;
const FLOATY_OMEGA = 0.0015;
const SPIKY_SPEED = 170;
const SPIKY_ROLL = 0.0003;

export function createEnemySystem(scene: Phaser.Scene): EnemySystem {
  for (const kind of Object.keys(TEXTURES) as EnemyKind[]) {
    if (!scene.textures.exists(TEXTURES[kind])) {
      scene.add
        .graphics()
        .fillStyle(FALLBACK_COLORS[kind])
        .fillRoundedRect(0, 0, SIZE, SIZE, 12)
        .generateTexture(TEXTURES[kind], SIZE, SIZE)
        .destroy();
    }
  }

  const group = scene.physics.add.group({
    classType: Phaser.Physics.Arcade.Sprite,
    maxSize: POOL_SIZE,
  });
  let target: EnemyTarget | null = null;
  let elapsedMs = 0;

  function kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null {
    return enemy.active ? ((enemy.getData('kind') as EnemyKind | undefined) ?? null) : null;
  }

  function deactivate(sprite: Phaser.Physics.Arcade.Sprite): void {
    scene.tweens.killTweensOf(sprite);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    sprite.setActive(false).setVisible(false);
  }

  return {
    spawn(kind: EnemyKind, x: number, y: number) {
      const sprite = group.get(x, y, TEXTURES[kind]) as Phaser.Physics.Arcade.Sprite | null;
      if (!sprite) return;

      sprite.setActive(true).setVisible(true);
      sprite.setDisplaySize(SIZE, SIZE);
      sprite.setRotation(0);
      sprite.setData('kind', kind);
      sprite.setData('hopMs', 0);
      sprite.setData('phase', Math.random() * Math.PI * 2);

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(x, y);
      body.setCollideWorldBounds(true);
      body.setAllowGravity(kind !== 'floaty');
      // spiky 以 bounce=1 碰牆自動折返。
      body.setBounce(kind === 'spiky' ? 1 : 0, 0);
      const inward = x < CANVAS.width / 2 ? 1 : -1;
      body.setVelocity(kind === 'spiky' ? SPIKY_SPEED * inward : 0, 0);

      // wobble idle：果凍感擠壓拉伸。
      scene.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.08,
        scaleY: sprite.scaleY * 0.92,
        duration: 360,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      emitGameEvent(scene.events, GameEvents.ENEMY_SPAWNED, { kind, x, y });
    },

    kill(enemy: Phaser.GameObjects.GameObject) {
      const kind = kindOf(enemy);
      if (!kind) return;
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      const { x, y } = sprite;
      deactivate(sprite);
      emitGameEvent(scene.events, GameEvents.ENEMY_KILLED, { kind, x, y });
    },

    // 被吸走時僅回收；enemy:inhaled 由吸入系統（US-003）於吞下時發出。
    removeInhaled(enemy: Phaser.GameObjects.GameObject) {
      if (!kindOf(enemy)) return;
      deactivate(enemy as Phaser.Physics.Arcade.Sprite);
    },

    kindOf,

    getGroup() {
      return group;
    },

    setTarget(next: EnemyTarget | null) {
      target = next;
    },

    aliveCount() {
      return group.countActive(true);
    },

    update(deltaMs: number) {
      elapsedMs += deltaMs;
      for (const child of group.getChildren()) {
        if (!child.active) continue;
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        const kind = sprite.getData('kind') as EnemyKind;
        switch (kind) {
          case 'jelly': {
            if (!body.blocked.down) break;
            body.setVelocityX(0);
            const hopMs = (sprite.getData('hopMs') as number) + deltaMs;
            if (hopMs < JELLY_HOP_INTERVAL_MS) {
              sprite.setData('hopMs', hopMs);
              break;
            }
            sprite.setData('hopMs', 0);
            const targetX = target?.x ?? CANVAS.width / 2;
            const direction = targetX >= sprite.x ? 1 : -1;
            body.setVelocity(direction * JELLY_HOP_VX, JELLY_HOP_VY);
            break;
          }
          case 'floaty': {
            const phase = sprite.getData('phase') as number;
            body.setVelocityX(Math.cos(elapsedMs * FLOATY_OMEGA + phase) * FLOATY_SPEED);
            break;
          }
          case 'spiky': {
            // 被外力夾停時恢復滾動。
            if (body.velocity.x === 0) body.setVelocityX(SPIKY_SPEED);
            sprite.rotation += body.velocity.x * deltaMs * SPIKY_ROLL;
            break;
          }
          default: {
            const exhaustive: never = kind;
            void exhaustive;
          }
        }
      }
    },

    destroy() {
      for (const child of group.getChildren()) scene.tweens.killTweensOf(child);
      group.destroy(true);
    },
  };
}
