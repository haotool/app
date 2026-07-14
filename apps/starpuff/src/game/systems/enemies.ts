import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { playSfx } from '../audio/sfx';
import { popIn } from './fx';

export interface EnemyTarget {
  x: number;
  y: number;
}

export type DamageOutcome = 'killed' | 'hurt' | 'ignored';

export interface EnemySystem {
  spawn(kind: EnemyKind, x: number, y: number): void;
  kill(enemy: Phaser.GameObjects.GameObject): void;
  damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome;
  removeInhaled(enemy: Phaser.GameObjects.GameObject): void;
  kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null;
  getGroup(): Phaser.Physics.Arcade.Group;
  getHazards(): Phaser.Physics.Arcade.Group;
  setTarget(target: EnemyTarget | null): void;
  aliveCount(): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// texture keys 凍結（GAME_DESIGN §10、§19）；缺圖時以同色圓角色塊代替。
const TEXTURES: Record<EnemyKind, string> = {
  jelly: 'minion-jelly',
  floaty: 'minion-floaty',
  spiky: 'minion-spiky',
  puffy: 'minion-puffy',
  chompy: 'minion-chompy',
};

const FALLBACK_COLORS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
  puffy: 0xffa8a0,
  chompy: 0xf5e6a8,
};

// HP 以傷害點計：chompy 10 = 兩發標準星（5×2），其餘一擊斃（GAME_DESIGN §16）。
const HP: Record<EnemyKind, number> = {
  jelly: 1,
  floaty: 1,
  spiky: 1,
  puffy: 1,
  chompy: 10,
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
// puffy：高空恆速下飄 + 微幅左右擺（§16）。
const PUFFY_FALL_SPEED = 55;
const PUFFY_SWAY_SPEED = 30;
const PUFFY_SWAY_OMEGA = 0.002;
// puffy 爆刺彈：4 向 220px/s、0.6s 消散、傷害 1（§16）。
const SPIKE_TEX = 'hazard-spike';
const SPIKE_SPEED = 220;
const SPIKE_LIFE_MS = 600;
const SPIKE_SIZE = 12;
const HAZARD_POOL_SIZE = 24;
// chompy：進 120px 前搖 0.4s → 咬合 0.3s → 冷卻 1.2s（§16）。
const CHOMPY_TRIGGER_PX = 120;
const CHOMPY_WINDUP_MS = 400;
const CHOMPY_BITE_MS = 300;
const CHOMPY_COOL_MS = 1200;
const BITE_OFFSET_X = 22;
const BITE_SIZE = 42;
// 穿透星停留重疊時的重複結算保護（須大於星彈穿越 hitbox 的時間）。
const DAMAGE_COOLDOWN_MS = 150;
const FLASH_MS = 80;

type ChompyState = 'idle' | 'windup' | 'bite' | 'cool';

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
  if (!scene.textures.exists(SPIKE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xffa8a0)
      .fillTriangle(SPIKE_SIZE / 2, 0, SPIKE_SIZE, SPIKE_SIZE / 2, 0, SPIKE_SIZE / 2)
      .fillTriangle(0, SPIKE_SIZE / 2, SPIKE_SIZE, SPIKE_SIZE / 2, SPIKE_SIZE / 2, SPIKE_SIZE)
      .generateTexture(SPIKE_TEX, SPIKE_SIZE, SPIKE_SIZE)
      .destroy();
  }

  const group = scene.physics.add.group({
    classType: Phaser.Physics.Arcade.Sprite,
    maxSize: POOL_SIZE,
  });
  const hazards = scene.physics.add.group({
    classType: Phaser.Physics.Arcade.Sprite,
    maxSize: HAZARD_POOL_SIZE,
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

  function spawnHazard(x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
    const hazard = hazards.get(x, y, SPIKE_TEX) as Phaser.Physics.Arcade.Sprite | null;
    if (!hazard) return null;
    hazard.setActive(true);
    const body = hazard.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    body.setAllowGravity(false);
    return hazard;
  }

  // 「啵」爆成 4 向短刺彈；落地與受星彈擊中共用。
  function burstSpikes(x: number, y: number): void {
    playSfx('pop');
    const directions: readonly (readonly [number, number])[] = [
      [SPIKE_SPEED, 0],
      [-SPIKE_SPEED, 0],
      [0, SPIKE_SPEED],
      [0, -SPIKE_SPEED],
    ];
    for (const [vx, vy] of directions) {
      const spike = spawnHazard(x, y);
      if (!spike) continue;
      spike.setTexture(SPIKE_TEX).setVisible(true);
      spike.setDisplaySize(SPIKE_SIZE, SPIKE_SIZE);
      spike.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      spike.setData('hazardKind', 'spike');
      spike.setData('lifeMs', SPIKE_LIFE_MS);
      const body = spike.body as Phaser.Physics.Arcade.Body;
      // 池回收重用：body 尺寸須重設，避免沿用咬合 hitbox 的 42px。
      body.setSize(SPIKE_SIZE, SPIKE_SIZE);
      body.setVelocity(vx, vy);
    }
  }

  // 咬合 hitbox：嘴部朝玩家側，僅啟用 0.3s；視覺由 chompy 本體咬合動畫承擔。
  function spawnBite(chompy: Phaser.Physics.Arcade.Sprite): void {
    const dir = target && target.x < chompy.x ? -1 : 1;
    const bite = spawnHazard(chompy.x + dir * BITE_OFFSET_X, chompy.y - 8);
    if (!bite) return;
    bite.setVisible(false);
    bite.setData('hazardKind', 'bite');
    bite.setData('lifeMs', CHOMPY_BITE_MS);
    (bite.body as Phaser.Physics.Arcade.Body).setSize(BITE_SIZE, BITE_SIZE);
  }

  // Phaser 4 無 setTintFill(color)：受擊白閃改用 setTint + FILL tint mode。
  function flashWhite(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setTint(0xffffff);
    sprite.setTintMode(Phaser.TintModes.FILL);
    scene.time.delayedCall(FLASH_MS, () => {
      if (!sprite.scene) return;
      sprite.clearTint();
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
    });
  }

  // 死亡消失（§18，與 popIn 對稱）：立即停用互動，0.15s squash-to-zero 播畢後隱藏回收。
  function kill(enemy: Phaser.GameObjects.GameObject): void {
    const kind = kindOf(enemy);
    if (!kind) return;
    const sprite = enemy as Phaser.Physics.Arcade.Sprite;
    const { x, y } = sprite;
    scene.tweens.killTweensOf(sprite);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    sprite.setActive(false);
    scene.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.5,
      scaleY: 0,
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: () => sprite.setVisible(false),
    });
    emitGameEvent(scene.events, GameEvents.ENEMY_KILLED, { kind, x, y });
  }

  function updateChompy(sprite: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    const state = sprite.getData('state') as ChompyState;
    const stateMs = (sprite.getData('stateMs') as number) + deltaMs;
    sprite.setData('stateMs', stateMs);
    const bsx = sprite.getData('baseSX') as number;
    const bsy = sprite.getData('baseSY') as number;
    switch (state) {
      case 'idle': {
        if (
          target &&
          Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y) <= CHOMPY_TRIGGER_PX
        ) {
          sprite.setData('state', 'windup');
          sprite.setData('stateMs', 0);
          scene.tweens.killTweensOf(sprite);
          // 張嘴 squash 蓄力。
          scene.tweens.add({
            targets: sprite,
            scaleX: bsx * 1.2,
            scaleY: bsy * 0.78,
            duration: CHOMPY_WINDUP_MS,
            ease: 'Quad.easeIn',
          });
        }
        break;
      }
      case 'windup': {
        if (stateMs < CHOMPY_WINDUP_MS) break;
        sprite.setData('state', 'bite');
        sprite.setData('stateMs', 0);
        playSfx('chomp');
        scene.tweens.killTweensOf(sprite);
        sprite.setScale(bsx, bsy);
        scene.tweens.add({
          targets: sprite,
          scaleX: bsx * 0.9,
          scaleY: bsy * 1.22,
          duration: 100,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        spawnBite(sprite);
        break;
      }
      case 'bite': {
        if (stateMs >= CHOMPY_BITE_MS) {
          sprite.setData('state', 'cool');
          sprite.setData('stateMs', 0);
        }
        break;
      }
      case 'cool': {
        if (stateMs >= CHOMPY_COOL_MS) {
          sprite.setData('state', 'idle');
          sprite.setData('stateMs', 0);
        }
        break;
      }
      default: {
        const exhaustive: never = state;
        void exhaustive;
      }
    }
  }

  return {
    spawn(kind: EnemyKind, x: number, y: number) {
      const sprite = group.get(x, y, TEXTURES[kind]) as Phaser.Physics.Arcade.Sprite | null;
      if (!sprite) return;

      // 池重用防護：死亡 squash tween 可能仍在播放，先清除再重設外觀。
      scene.tweens.killTweensOf(sprite);
      sprite.setActive(true).setVisible(true);
      sprite.setTexture(TEXTURES[kind]);
      sprite.setDisplaySize(SIZE, SIZE);
      sprite.setRotation(0);
      sprite.setAlpha(1);
      sprite.clearTint();
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      sprite.setData('kind', kind);
      sprite.setData('hopMs', 0);
      sprite.setData('phase', Math.random() * Math.PI * 2);
      sprite.setData('hp', HP[kind]);
      sprite.setData('dmgCdMs', 0);
      sprite.setData('state', 'idle');
      sprite.setData('stateMs', 0);
      sprite.setData('baseSX', sprite.scaleX);
      sprite.setData('baseSY', sprite.scaleY);

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(x, y);
      // 命中寬容：碰撞體縮至視覺 90%（spiky 85%），setSize 以未縮放的 frame 尺寸為基準。
      const hitboxScale = kind === 'spiky' ? 0.85 : 0.9;
      body.setSize(sprite.width * hitboxScale, sprite.height * hitboxScale);
      body.setCollideWorldBounds(true);
      body.setAllowGravity(kind !== 'floaty' && kind !== 'puffy');
      // spiky 以 bounce=1 碰牆自動折返；chompy 定點紮根。
      body.setBounce(kind === 'spiky' ? 1 : 0, 0);
      body.setImmovable(kind === 'chompy');
      // 朝向以玩家位置判向（卷軸世界中不可用單屏中心）；無 target 時退回畫面中心啟發。
      const inward = target ? (target.x >= x ? 1 : -1) : x < CANVAS.width / 2 ? 1 : -1;
      if (kind === 'spiky') body.setVelocity(SPIKY_SPEED * inward, 0);
      else if (kind === 'puffy') body.setVelocity(0, PUFFY_FALL_SPEED);
      else body.setVelocity(0, 0);

      // 生成彈入；wobble 延後啟動避免同時操作 scale。
      popIn(scene, sprite);

      // wobble idle：果凍感擠壓拉伸；chompy 的 scale 由咬合狀態機控制，不掛 wobble。
      if (kind !== 'chompy') {
        scene.tweens.add({
          targets: sprite,
          scaleX: sprite.scaleX * 1.08,
          scaleY: sprite.scaleY * 0.92,
          duration: 360,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: 260,
        });
      }

      emitGameEvent(scene.events, GameEvents.ENEMY_SPAWNED, { kind, x, y });
    },

    kill,

    // 星彈與波及共用傷害入口：扣點未死白閃，歸零致死；puffy 死於星彈時爆刺。
    damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome {
      const kind = kindOf(enemy);
      if (!kind) return 'ignored';
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      if ((sprite.getData('dmgCdMs') as number) > 0) return 'ignored';
      sprite.setData('dmgCdMs', DAMAGE_COOLDOWN_MS);
      const hp = (sprite.getData('hp') as number) - amount;
      if (hp > 0) {
        sprite.setData('hp', hp);
        flashWhite(sprite);
        return 'hurt';
      }
      if (kind === 'puffy') burstSpikes(sprite.x, sprite.y);
      kill(enemy);
      return 'killed';
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

    getHazards() {
      return hazards;
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
        const dmgCdMs = sprite.getData('dmgCdMs') as number;
        if (dmgCdMs > 0) sprite.setData('dmgCdMs', Math.max(0, dmgCdMs - deltaMs));
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
          case 'puffy': {
            // 落地即「啵」爆（不計擊殺配額）；被吸入由吞下流程回收不爆。
            if (body.blocked.down) {
              const { x, y } = sprite;
              deactivate(sprite);
              burstSpikes(x, y);
              break;
            }
            const phase = sprite.getData('phase') as number;
            body.setVelocity(
              Math.sin(elapsedMs * PUFFY_SWAY_OMEGA + phase) * PUFFY_SWAY_SPEED,
              PUFFY_FALL_SPEED,
            );
            break;
          }
          case 'chompy': {
            body.setVelocityX(0);
            updateChompy(sprite, deltaMs);
            break;
          }
          default: {
            const exhaustive: never = kind;
            void exhaustive;
          }
        }
      }

      for (const child of hazards.getChildren()) {
        if (!child.active) continue;
        const hazard = child as Phaser.Physics.Arcade.Sprite;
        const lifeMs = (hazard.getData('lifeMs') as number) - deltaMs;
        if (lifeMs <= 0) {
          const body = hazard.body as Phaser.Physics.Arcade.Body;
          body.stop();
          body.enable = false;
          hazard.setActive(false).setVisible(false);
        } else {
          hazard.setData('lifeMs', lifeMs);
        }
      }
    },

    destroy() {
      for (const child of group.getChildren()) scene.tweens.killTweensOf(child);
      group.destroy(true);
      hazards.destroy(true);
    },
  };
}
