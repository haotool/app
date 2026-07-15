import Phaser from 'phaser';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale } from '../logic/combat';
import { resolveShellyHit, tickShelly, tickZappy, type ShellyState } from '../logic/enemyFsm';
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
  // 個體可吸判定（§30）：kind 規則 + 個體狀態（shelly 僅暈眩時可吸）。
  isInhalable(enemy: Phaser.GameObjects.GameObject): boolean;
  getGroup(): Phaser.Physics.Arcade.Group;
  getHazards(): Phaser.Physics.Arcade.Group;
  setTarget(target: EnemyTarget | null): void;
  aliveCount(): number;
  aliveInhalableCount(): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// texture keys 凍結（GAME_DESIGN §10、§19、§31）；缺圖時以同色圓角色塊代替。
const TEXTURES: Record<EnemyKind, string> = {
  jelly: 'minion-jelly',
  floaty: 'minion-floaty',
  spiky: 'minion-spiky',
  puffy: 'minion-puffy',
  chompy: 'minion-chompy',
  shelly: 'minion-shelly',
  zappy: 'minion-zappy',
};

const FALLBACK_COLORS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
  puffy: 0xffa8a0,
  chompy: 0xf5e6a8,
  shelly: 0x7fd8c8,
  zappy: 0xe8d88a,
};

// HP 以傷害點計：chompy 10 = 兩發標準星（5×2），其餘一擊斃（GAME_DESIGN §16）。
// shelly 的「HP 2 段」由狀態機承擔：walk 首發轉縮殼、stun 期一擊斃（§30）。
const HP: Record<EnemyKind, number> = {
  jelly: 1,
  floaty: 1,
  spiky: 1,
  puffy: 1,
  chompy: 10,
  shelly: 1,
  zappy: 1,
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
// shelly：巡邏走動；首發受擊 → 縮殼旋轉衝刺 1.5s（無敵、碰牆反彈）→ 暈眩 1s 可吸可殺（§30）。
// 三態時序由 logic/enemyFsm.ts 決策；此處僅保留呈現層速度/縮放/擺動參數。
const SHELLY_WALK_SPEED = 60;
const SHELLY_SPIN_SPEED = 320;
const SHELLY_SPIN_OMEGA = 0.02;
const SHELLY_SHELL_SCALE = 0.82;
const SHELLY_WADDLE_OMEGA = 0.008;
const SHELLY_WADDLE_RAD = 0.08;
// zappy：緩慢懸浮追蹤；每 3s 放電環（半徑 70、前搖 0.5s 閃爍預警）（§30）。
// 放電週期時序由 logic/enemyFsm.ts 決策。
const ZAPPY_SPEED = 40;
const ZAPPY_BOB_SPEED = 14;
const ZAPPY_BOB_OMEGA = 0.003;
const ZAPPY_RING_RADIUS = 70;
const ZAPPY_RING_ACTIVE_MS = 200;
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

  // 無 target 時的朝向啟發改讀當前鏡頭中心（§28 動態視寬，禁硬編 854）。
  const viewCenterX = () => scene.cameras.main.scrollX + scene.scale.width / 2;

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

  // 放電環（§30）：環形 graphics 脈衝 + 圓形 hitbox 短暫啟用；傷害結算走既有 hazards 管線。
  function zapRing(x: number, y: number): void {
    playSfx('zap');
    const ring = scene.add
      .circle(x, y, ZAPPY_RING_RADIUS, 0xfff3b0, 0.16)
      .setStrokeStyle(4, 0xffe28a, 0.95)
      .setDepth(60);
    ring.setScale(0.25);
    scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: { from: 1, to: 0 },
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    const zap = spawnHazard(x, y);
    if (!zap) return;
    zap.setVisible(false);
    zap.setData('hazardKind', 'zap');
    zap.setData('lifeMs', ZAPPY_RING_ACTIVE_MS);
    const body = zap.body as Phaser.Physics.Arcade.Body;
    // 圓形 hitbox 以 frame 中心定位；池回收重用時 setSize 會自動復位為矩形。
    body.setCircle(
      ZAPPY_RING_RADIUS,
      zap.width / 2 - ZAPPY_RING_RADIUS,
      zap.height / 2 - ZAPPY_RING_RADIUS,
    );
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

  // 縮殼旋轉衝刺（§30）：朝玩家側 1.5s 高速滾動，期間無敵、碰牆由 bounce 反彈。
  function enterShellySpin(sprite: Phaser.Physics.Arcade.Sprite): void {
    playSfx('shell-spin');
    sprite.setData('state', 'spin');
    sprite.setData('stateMs', 0);
    const bsx = sprite.getData('baseSX') as number;
    const bsy = sprite.getData('baseSY') as number;
    sprite.setScale(bsx * SHELLY_SHELL_SCALE, bsy * SHELLY_SHELL_SCALE);
    const direction = target && target.x < sprite.x ? -1 : 1;
    (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(SHELLY_SPIN_SPEED * direction);
  }

  // 三態時序由 enemyFsm 決策；本函式只負責呈現層（速度、旋轉、著色、縮放復原）。
  function updateShelly(sprite: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    const tick = tickShelly(
      sprite.getData('state') as ShellyState,
      sprite.getData('stateMs') as number,
      deltaMs,
    );
    sprite.setData('state', tick.state);
    sprite.setData('stateMs', tick.stateMs);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (tick.entered === 'stun') {
      // 旋轉期滿：停速著灰進暈眩（可吸/可擊殺窗）。
      body.setVelocityX(0);
      sprite.setTint(0xcfcfcf);
      return;
    }
    if (tick.entered === 'walk') {
      // 暈眩期滿：復原外觀回巡邏。
      sprite.clearTint();
      sprite.setRotation(0);
      const bsx = sprite.getData('baseSX') as number;
      const bsy = sprite.getData('baseSY') as number;
      sprite.setScale(bsx, bsy);
      return;
    }
    switch (tick.state) {
      case 'walk': {
        // 巡邏：恆速走動、bounce 折返；被外力夾停時恢復。
        if (body.velocity.x === 0) {
          const direction = target && target.x < sprite.x ? -1 : 1;
          body.setVelocityX(SHELLY_WALK_SPEED * direction);
        }
        sprite.setRotation(Math.sin(tick.stateMs * SHELLY_WADDLE_OMEGA) * SHELLY_WADDLE_RAD);
        break;
      }
      case 'spin': {
        if (body.velocity.x === 0) body.setVelocityX(SHELLY_SPIN_SPEED);
        sprite.rotation += Math.sign(body.velocity.x) * SHELLY_SPIN_OMEGA * deltaMs;
        break;
      }
      case 'stun': {
        // 暈眩 1s（可吸/可擊殺）：昏沉搖擺。
        sprite.setRotation(Math.sin(tick.stateMs * 0.02) * 0.25);
        break;
      }
      default: {
        const exhaustive: never = tick.state;
        void exhaustive;
      }
    }
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
      sprite.setData('zapMs', 0);
      sprite.setData('phase', Math.random() * Math.PI * 2);
      sprite.setData('hp', HP[kind]);
      sprite.setData('dmgCdMs', 0);
      sprite.setData('state', kind === 'shelly' ? 'walk' : 'idle');
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
      body.setAllowGravity(kind !== 'floaty' && kind !== 'puffy' && kind !== 'zappy');
      // spiky/shelly 以 bounce=1 碰牆自動折返；chompy 定點紮根。
      body.setBounce(kind === 'spiky' || kind === 'shelly' ? 1 : 0, 0);
      body.setImmovable(kind === 'chompy');
      // 朝向以玩家位置判向（卷軸世界中不可用單屏中心）；無 target 時退回當前鏡頭中心啟發。
      const inward = target ? (target.x >= x ? 1 : -1) : x < viewCenterX() ? 1 : -1;
      if (kind === 'spiky') body.setVelocity(SPIKY_SPEED * inward, 0);
      else if (kind === 'puffy') body.setVelocity(0, PUFFY_FALL_SPEED);
      else if (kind === 'shelly') body.setVelocity(SHELLY_WALK_SPEED * inward, 0);
      else body.setVelocity(0, 0);

      // 生成彈入；wobble 延後啟動避免同時操作 scale。
      popIn(scene, sprite);

      // wobble idle：果凍感擠壓拉伸；chompy/shelly 的 scale 由各自狀態機控制，不掛 wobble。
      if (kind !== 'chompy' && kind !== 'shelly') {
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
    },

    kill,

    // 星彈與波及共用傷害入口：扣點未死白閃，歸零致死；puffy 死於星彈時爆刺。
    damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome {
      const kind = kindOf(enemy);
      if (!kind) return 'ignored';
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      if ((sprite.getData('dmgCdMs') as number) > 0) return 'ignored';
      // 殼殼二段（§30）：巡邏首發轉縮殼旋轉（不扣血）；旋轉期無敵；暈眩期正常結算。
      if (kind === 'shelly') {
        const outcome = resolveShellyHit(sprite.getData('state') as ShellyState);
        if (outcome === 'immune') return 'ignored';
        if (outcome === 'enter-spin') {
          sprite.setData('dmgCdMs', DAMAGE_COOLDOWN_MS);
          flashWhite(sprite);
          enterShellySpin(sprite);
          return 'hurt';
        }
      }
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

    // 個體可吸判定（§30）：kind 規則疊加個體狀態，shelly 僅暈眩窗可吸。
    isInhalable(enemy: Phaser.GameObjects.GameObject): boolean {
      const kind = kindOf(enemy);
      if (!kind) return false;
      return canInhale(kind, enemy.getData('state') === 'stun');
    },

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

    // 反卡死（§26）：場上可吸怪數，供 spawner 保證律判定彈藥飢荒。
    aliveInhalableCount() {
      let count = 0;
      for (const child of group.getChildren()) {
        const kind = kindOf(child);
        if (kind && canInhale(kind, child.getData('state') === 'stun')) count += 1;
      }
      return count;
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
            const targetX = target?.x ?? viewCenterX();
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
          case 'shelly': {
            updateShelly(sprite, deltaMs);
            break;
          }
          case 'zappy': {
            // 放電週期時序由 enemyFsm 決策；此處僅結算呈現與物理。
            const tick = tickZappy(sprite.getData('zapMs') as number, deltaMs);
            sprite.setData('zapMs', tick.zapMs);
            if (tick.phase === 'discharge') {
              sprite.clearTint();
              zapRing(sprite.x, sprite.y);
            } else if (tick.phase === 'windup') {
              // 前搖 0.5s：定身 + 明暗交替閃爍預警。
              body.setVelocity(0, 0);
              sprite.setTint(tick.flickerBright ? 0xffffff : 0xffe28a);
            } else {
              // 緩慢懸浮追蹤玩家 + 正弦上下漂浮。
              const phase = sprite.getData('phase') as number;
              const bob = Math.sin(elapsedMs * ZAPPY_BOB_OMEGA + phase) * ZAPPY_BOB_SPEED;
              if (target) {
                const angle = Math.atan2(target.y - sprite.y, target.x - sprite.x);
                body.setVelocity(
                  Math.cos(angle) * ZAPPY_SPEED,
                  Math.sin(angle) * ZAPPY_SPEED + bob,
                );
              } else {
                body.setVelocity(0, bob);
              }
            }
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
