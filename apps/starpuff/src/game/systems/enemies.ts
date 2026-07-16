import Phaser from 'phaser';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale } from '../logic/combat';
import {
  resolveDrillyHit,
  resolveShellyHit,
  type DrillyState,
  type ShellyState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import {
  CHOMPY_BITE_MS,
  PUFFY_FALL_SPEED,
  SHELLY_SHELL_SCALE,
  SHELLY_SPIN_SPEED,
  SHELLY_WALK_SPEED,
  SPIKY_SPEED,
  updateEnemyKind,
  type EnemyUpdateContext,
} from './enemyUpdates';
import { popIn } from './fx';

export interface EnemyTarget {
  x: number;
  y: number;
}

export type DamageOutcome = 'killed' | 'hurt' | 'ignored';

// 精英變體（§48）：既有怪 tint + scale + 血量強化 + FSM 速度倍率，零新美術。
export interface EliteOptions {
  hp: number;
  scale: number;
  tint: number;
  speedMul: number;
}

export interface EnemySystem {
  spawn(kind: EnemyKind, x: number, y: number): Phaser.Physics.Arcade.Sprite | null;
  spawnElite(
    kind: EnemyKind,
    x: number,
    y: number,
    opts: EliteOptions,
  ): Phaser.Physics.Arcade.Sprite | null;
  kill(enemy: Phaser.GameObjects.GameObject): void;
  damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome;
  // 凍結場（§46 凝光星）：域內小怪凍結停擺，期滿自復。
  freeze(enemy: Phaser.GameObjects.GameObject, durationMs: number): void;
  removeInhaled(enemy: Phaser.GameObjects.GameObject): void;
  kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null;
  // 個體可吸判定（§30/§47）：kind 規則 + 個體狀態（shelly 暈眩窗、drilly 破土窗）；精英不可吸。
  isInhalable(enemy: Phaser.GameObjects.GameObject): boolean;
  // 半入地無害態（§47 drilly 潛地/前搖）：觸碰不結算傷害、吸力不彈開。
  isPhasedOut(enemy: Phaser.GameObjects.GameObject): boolean;
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
  drilly: 'minion-drilly',
  glowy: 'minion-glowy',
};

const FALLBACK_COLORS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
  puffy: 0xffa8a0,
  chompy: 0xf5e6a8,
  shelly: 0x7fd8c8,
  zappy: 0xe8d88a,
  drilly: 0xd8a26b,
  glowy: 0xffe9a8,
};

// HP 以傷害點計：chompy 10 = 兩發標準星（5×2），其餘一擊斃（GAME_DESIGN §16）。
// shelly 的「HP 2 段」由狀態機承擔：walk 首發轉縮殼、stun 期一擊斃（§30）；
// drilly 的防禦由潛地免傷窗承擔（§47）。
const HP: Record<EnemyKind, number> = {
  jelly: 1,
  floaty: 1,
  spiky: 1,
  puffy: 1,
  chompy: 10,
  shelly: 1,
  zappy: 1,
  drilly: 1,
  glowy: 1,
};

const SIZE = 40;
const POOL_SIZE = 16;
// puffy 爆刺彈：4 向 220px/s、0.6s 消散、傷害 1（§16）。
const SPIKE_TEX = 'hazard-spike';
const SPIKE_SPEED = 220;
const SPIKE_LIFE_MS = 600;
const SPIKE_SIZE = 12;
const HAZARD_POOL_SIZE = 24;
const BITE_OFFSET_X = 22;
const BITE_SIZE = 42;
// 脈衝環 hitbox 啟用時長（zappy 放電/glowy 光脈衝共用）。
const GLOWY_RING_ACTIVE_MS = 200;
// 凍結態（§46）：冰藍著色。
const FREEZE_TINT = 0xbfe8ff;
// 穿透星停留重疊時的重複結算保護（須大於星彈穿越 hitbox 的時間）。
const DAMAGE_COOLDOWN_MS = 150;
const FLASH_MS = 80;

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
    (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
    sprite.setData('warnRing', undefined);
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

  // 放電環（§30/§47）：環形 graphics 脈衝 + 圓形 hitbox 短暫啟用；傷害結算走既有
  // hazards 管線。radius 參數化供 zappy（70）與 glowy 脈衝（80）共用。
  function pulseRing(x: number, y: number, radius: number, strokeTint: number): void {
    playSfx('zap');
    const ring = scene.add
      .circle(x, y, radius, 0xfff3b0, 0.16)
      .setStrokeStyle(4, strokeTint, 0.95)
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
    zap.setData('lifeMs', GLOWY_RING_ACTIVE_MS);
    const body = zap.body as Phaser.Physics.Arcade.Body;
    // 圓形 hitbox 以 frame 中心定位；池回收重用時 setSize 會自動復位為矩形。
    body.setCircle(radius, zap.width / 2 - radius, zap.height / 2 - radius);
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
  // 精英（§48）閃後回套變體 tint，避免白閃洗掉精英識別色。
  function flashWhite(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setTint(0xffffff);
    sprite.setTintMode(Phaser.TintModes.FILL);
    scene.time.delayedCall(FLASH_MS, () => {
      if (!sprite.scene) return;
      sprite.clearTint();
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      const eliteTint = sprite.getData('eliteTint') as number | undefined;
      if (eliteTint !== undefined && sprite.getData('elite') === true) sprite.setTint(eliteTint);
    });
  }

  // 死亡消失（§18，與 popIn 對稱）：立即停用互動，0.15s squash-to-zero 播畢後隱藏回收。
  function kill(enemy: Phaser.GameObjects.GameObject): void {
    const kind = kindOf(enemy);
    if (!kind) return;
    const sprite = enemy as Phaser.Physics.Arcade.Sprite;
    const { x, y } = sprite;
    scene.tweens.killTweensOf(sprite);
    (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
    sprite.setData('warnRing', undefined);
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

  // per-kind AI 依賴面（systems/enemyUpdates.ts）：target/elapsedMs 即時 getter，
  // hazards/回收管線以回呼銜接。
  const updateCtx: EnemyUpdateContext = {
    scene,
    get target() {
      return target;
    },
    get elapsedMs() {
      return elapsedMs;
    },
    viewCenterX,
    pulseRing,
    spawnBite,
    popPuffy(sprite) {
      const { x, y } = sprite;
      deactivate(sprite);
      burstSpikes(x, y);
    },
  };

  function spawn(kind: EnemyKind, x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
    const sprite = group.get(x, y, TEXTURES[kind]) as Phaser.Physics.Arcade.Sprite | null;
    if (!sprite) return null;

    // 池重用防護：死亡 squash tween 可能仍在播放，先清除再重設外觀。
    scene.tweens.killTweensOf(sprite);
    (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
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
    sprite.setData('frozenMs', 0);
    sprite.setData('elite', false);
    sprite.setData('eliteMul', 1);
    sprite.setData('warnRing', undefined);
    sprite.setData('state', kind === 'shelly' ? 'walk' : kind === 'drilly' ? 'burrow' : 'idle');
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
    body.setAllowGravity(
      kind !== 'floaty' && kind !== 'puffy' && kind !== 'zappy' && kind !== 'glowy',
    );
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

    // wobble idle：果凍感擠壓拉伸；chompy/shelly/drilly 的 scale 由各自狀態機控制，不掛 wobble。
    if (kind !== 'chompy' && kind !== 'shelly' && kind !== 'drilly') {
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
    return sprite;
  }

  return {
    spawn,

    // 精英變體（§48）：在標準生成上覆寫血量/縮放/著色/速度倍率；精英不可吸。
    spawnElite(kind: EnemyKind, x: number, y: number, opts: EliteOptions) {
      const sprite = spawn(kind, x, y);
      if (!sprite) return null;
      scene.tweens.killTweensOf(sprite);
      sprite.setDisplaySize(SIZE * opts.scale, SIZE * opts.scale);
      sprite.setTint(opts.tint);
      sprite.setData('hp', opts.hp);
      sprite.setData('elite', true);
      sprite.setData('eliteTint', opts.tint);
      sprite.setData('eliteMul', opts.speedMul);
      sprite.setData('baseSX', sprite.scaleX);
      sprite.setData('baseSY', sprite.scaleY);
      popIn(scene, sprite);
      return sprite;
    },

    kill,

    // 星彈與波及共用傷害入口：扣點未死白閃，歸零致死；puffy 死於星彈時爆刺。
    damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome {
      const kind = kindOf(enemy);
      if (!kind) return 'ignored';
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      if ((sprite.getData('dmgCdMs') as number) > 0) return 'ignored';
      // 殼殼二段（§30）：巡邏首發轉縮殼旋轉（不扣血）；旋轉期無敵；暈眩期正常結算。
      // 精英殼殼（§48）不入縮殼循環，直接走血量池。
      if (kind === 'shelly' && sprite.getData('elite') !== true) {
        const outcome = resolveShellyHit(sprite.getData('state') as ShellyState);
        if (outcome === 'immune') return 'ignored';
        if (outcome === 'enter-spin') {
          sprite.setData('dmgCdMs', DAMAGE_COOLDOWN_MS);
          flashWhite(sprite);
          enterShellySpin(sprite);
          return 'hurt';
        }
      }
      // 鑽地者（§47）：潛地/前搖半入地免傷，破土窗正常結算。
      if (
        kind === 'drilly' &&
        resolveDrillyHit(sprite.getData('state') as DrillyState) === 'immune'
      ) {
        return 'ignored';
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

    // 凍結場（§46 凝光星）：域內凍結停擺——AI 跳過、水平速度歸零、冰藍著色，期滿自復。
    freeze(enemy: Phaser.GameObjects.GameObject, durationMs: number) {
      const kind = kindOf(enemy);
      if (!kind) return;
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      sprite.setData('frozenMs', durationMs);
      sprite.setTint(FREEZE_TINT);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      if (!body.allowGravity) body.setVelocityY(0);
    },

    // 個體可吸判定（§30/§47）：kind 規則疊加個體狀態暴露窗；精英（§48）一律不可吸。
    isInhalable(enemy: Phaser.GameObjects.GameObject): boolean {
      const kind = kindOf(enemy);
      if (!kind || enemy.getData('elite') === true) return false;
      const state = enemy.getData('state') as string;
      return canInhale(kind, state === 'stun' || state === 'surfaced');
    },

    // 半入地無害態（§47）：drilly 潛地/前搖觸碰不結算傷害、吸力不彈開。
    isPhasedOut(enemy: Phaser.GameObjects.GameObject): boolean {
      return kindOf(enemy) === 'drilly' && enemy.getData('state') !== 'surfaced';
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

    // 反卡死（§26）：場上可吸怪數，供 spawner 保證律判定彈藥飢荒；精英不計入。
    aliveInhalableCount() {
      let count = 0;
      for (const child of group.getChildren()) {
        const kind = kindOf(child);
        if (!kind || child.getData('elite') === true) continue;
        const state = child.getData('state') as string;
        if (canInhale(kind, state === 'stun' || state === 'surfaced')) count += 1;
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
        // 凍結態（§46）：AI 跳過、原地停擺；期滿清除冰藍著色（精英回套變體色）。
        const frozenMs = (sprite.getData('frozenMs') as number) ?? 0;
        if (frozenMs > 0) {
          const left = Math.max(0, frozenMs - deltaMs);
          sprite.setData('frozenMs', left);
          body.setVelocityX(0);
          if (!body.allowGravity) body.setVelocityY(0);
          if (left === 0) {
            sprite.clearTint();
            const eliteTint = sprite.getData('eliteTint') as number | undefined;
            if (eliteTint !== undefined && sprite.getData('elite') === true)
              sprite.setTint(eliteTint);
          }
          continue;
        }
        const kind = sprite.getData('kind') as EnemyKind;
        updateEnemyKind(updateCtx, sprite, kind, deltaMs);
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
