import Phaser from 'phaser';
import { SPORA_SLOW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale } from '../logic/combat';
import {
  BOOMY_FSM,
  GUSTY_FSM,
  MIRRI_FSM,
  SPORA_FSM,
  gustWindPush,
  resolveDrillyHit,
  resolveMagnoStarHit,
  resolveMirriStarHit,
  resolveShellyHit,
  tickBoomerangBody,
  type DrillyState,
  type MagnoPhase,
  type MirriState,
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
  // 孢子緩速（§53 孢子星/毒爆雲）：緩速期水平速度封頂＋週期輕持續傷，期滿自復。
  applySlow(enemy: Phaser.GameObjects.GameObject, slowMs: number, dotDamage: number): void;
  // 環境力（§52 Gusty 側風）：對玩家的水平位移推移，由 GameScene 逐幀委派。
  applyEnvironmentalForces(player: { x: number; y: number }, deltaMs: number): void;
  removeInhaled(enemy: Phaser.GameObjects.GameObject): void;
  kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null;
  // 個體可吸判定（§30/§47）：kind 規則 + 個體狀態（shelly 暈眩窗、drilly 破土窗）；精英不可吸。
  isInhalable(enemy: Phaser.GameObjects.GameObject): boolean;
  // 半入地無害態（§47 drilly 潛地/前搖）：觸碰不結算傷害、吸力不彈開。
  isPhasedOut(enemy: Phaser.GameObjects.GameObject): boolean;
  // 磁場星彈免傷（§59 magno field）：星彈命中吸附失效；下砸/波及/接觸照常結算。
  isStarImmune(enemy: Phaser.GameObjects.GameObject): boolean;
  // 鏡面反射（§59 mirri mirror）：星彈命中不結算，由 GameScene 分流生成反射彈。
  isReflective(enemy: Phaser.GameObjects.GameObject): boolean;
  reflectStar(x: number, y: number, towardX: number, towardY: number): void;
  getGroup(): Phaser.Physics.Arcade.Group;
  getHazards(): Phaser.Physics.Arcade.Group;
  setTarget(target: EnemyTarget | null): void;
  targetX(): number | null;
  aliveCount(): number;
  aliveInhalableCount(): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// texture keys 凍結（GAME_DESIGN §10、§19、§31、§55）；缺圖時以同色圓角色塊代替。
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
  spora: 'minion-spora',
  gusty: 'minion-gusty',
  boomy: 'minion-boomy',
  magno: 'minion-magno',
  mirri: 'minion-mirri',
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
  spora: 0xa8d8a0,
  gusty: 0xa8cbf0,
  boomy: 0xe8a878,
  magno: 0x8a98c8,
  mirri: 0xd8dce8,
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
  spora: 1,
  gusty: 1,
  boomy: 1,
  magno: 1,
  mirri: 1,
};

const SIZE = 40;
const POOL_SIZE = 16;
// puffy 爆刺彈：4 向 220px/s、0.6s 消散、傷害 1（§16）。
const SPIKE_TEX = 'hazard-spike';
const SPIKE_SPEED = 220;
const SPIKE_LIFE_MS = 600;
const SPIKE_SIZE = 12;
// v8 hazards（§52）：孢子雲滯留區與迴旋殼刃。
const SPORE_TEX = 'hazard-spore';
const SPORE_SIZE = 28;
const SHELL_TEX = 'hazard-shell';
const SHELL_SIZE = 22;
const SHELL_SPIN_RAD = 0.02;
const HAZARD_POOL_SIZE = 24;
const BITE_OFFSET_X = 22;
const BITE_SIZE = 42;
// 脈衝環 hitbox 啟用時長（zappy 放電/glowy 光脈衝共用）。
const PULSE_RING_ACTIVE_MS = 200;
// 凍結態（§46）：冰藍著色。
const FREEZE_TINT = 0xbfe8ff;
// 孢子緩速態（§53）：孢綠著色。
const SLOW_TINT = 0xbce8a0;
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
  // 孢子雲（§52）：柔和三圓簇孢子團。
  if (!scene.textures.exists(SPORE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xbce8a0, 0.85)
      .fillCircle(SPORE_SIZE / 2, SPORE_SIZE / 2, SPORE_SIZE / 2 - 2)
      .fillStyle(0xa8d8a0, 0.9)
      .fillCircle(SPORE_SIZE / 2 - 7, SPORE_SIZE / 2 + 4, 8)
      .fillCircle(SPORE_SIZE / 2 + 7, SPORE_SIZE / 2 + 3, 7)
      .generateTexture(SPORE_TEX, SPORE_SIZE, SPORE_SIZE)
      .destroy();
  }
  // 迴旋殼刃（§52）：雙圓疊色殼片，旋轉由 update 迴圈驅動。
  if (!scene.textures.exists(SHELL_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xe8a878, 1)
      .fillCircle(SHELL_SIZE / 2, SHELL_SIZE / 2, SHELL_SIZE / 2 - 1)
      .fillStyle(0xf5d8b8, 1)
      .fillCircle(SHELL_SIZE / 2 + 5, SHELL_SIZE / 2 - 3, SHELL_SIZE / 2 - 7)
      .generateTexture(SHELL_TEX, SHELL_SIZE, SHELL_SIZE)
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
    // 池回收重用：外觀屬性統一復位，避免沿用前種 hazard 的殘留樣式。
    hazard.setAlpha(1);
    hazard.setRotation(0);
    hazard.setData('boomMs', undefined);
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
    zap.setData('lifeMs', PULSE_RING_ACTIVE_MS);
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

  // 孢子雲（§52）：噴發位置滯留區域拒止，圓形 hitbox 存活 cloudMs；命中即散（走既有管線）。
  function spawnSporeCloud(x: number, y: number): void {
    playSfx('pop', 0.7);
    const cloud = spawnHazard(x, y);
    if (!cloud) return;
    cloud.setTexture(SPORE_TEX).setVisible(true);
    cloud.setDisplaySize(SPORA_FSM.cloudRadiusPx * 2, SPORA_FSM.cloudRadiusPx * 2);
    cloud.setAlpha(0.8);
    cloud.setRotation(0);
    cloud.setData('hazardKind', 'spore');
    cloud.setData('lifeMs', SPORA_FSM.cloudMs);
    const body = cloud.body as Phaser.Physics.Arcade.Body;
    const radius = SPORA_FSM.cloudRadiusPx * (cloud.width / cloud.displayWidth);
    body.setCircle(radius, cloud.width / 2 - radius, cloud.height / 2 - radius);
    body.setVelocity(0, -14);
  }

  // 鏡面反射彈（§59）：星彈被鏡面態反射為朝玩家的傷害彈，走既有 hazards 管線。
  function reflectStar(x: number, y: number, towardX: number, towardY: number): void {
    playSfx('metal', 1.15);
    const bolt = spawnHazard(x, y);
    if (!bolt) return;
    bolt.setTexture('fx-star').setVisible(true);
    bolt.setDisplaySize(18, 18);
    bolt.setTint(0xd8dce8);
    bolt.setData('hazardKind', 'reflect');
    bolt.setData('lifeMs', MIRRI_FSM.reflectLifeMs);
    const body = bolt.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 14);
    const dx = towardX - x;
    const dy = towardY - y;
    const dist = Math.hypot(dx, dy) || 1;
    body.setVelocity((dx / dist) * MIRRI_FSM.reflectSpeed, (dy / dist) * MIRRI_FSM.reflectSpeed);
  }

  // 迴旋殼刃（§52）：去而復返雙判定；速度由 update 迴圈依 boomerangVelocity 逐幀驅動。
  function spawnBoomerang(x: number, y: number, directionX: 1 | -1): void {
    playSfx('shell-spin', 1.2);
    const shell = spawnHazard(x, y);
    if (!shell) return;
    shell.setTexture(SHELL_TEX).setVisible(true);
    shell.setDisplaySize(SHELL_SIZE, SHELL_SIZE);
    shell.setAlpha(1);
    shell.setData('hazardKind', 'boomerang');
    shell.setData('lifeMs', BOOMY_FSM.shellLifeMs);
    shell.setData('boomMs', 0);
    shell.setData('boomDir', directionX);
    const body = shell.body as Phaser.Physics.Arcade.Body;
    body.setSize(SHELL_SIZE, SHELL_SIZE);
    body.setVelocity(BOOMY_FSM.shellSpeed * directionX, 0);
  }

  // 變體識別色回套（§48）：白閃/凍結清 tint 後統一恢復精英 tint（一般怪即清色）。
  function restoreTint(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.clearTint();
    const eliteTint = sprite.getData('eliteTint') as number | undefined;
    if (eliteTint !== undefined && sprite.getData('elite') === true) sprite.setTint(eliteTint);
  }

  // Phaser 4 無 setTintFill(color)：受擊白閃改用 setTint + FILL tint mode。
  function flashWhite(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setTint(0xffffff);
    sprite.setTintMode(Phaser.TintModes.FILL);
    scene.time.delayedCall(FLASH_MS, () => {
      if (!sprite.scene) return;
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      restoreTint(sprite);
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
    spawnSporeCloud,
    spawnBoomerang,
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
    // 週期計時（zappy 放電／glowy 脈衝／spora 噴發共用單計時器欄位）。
    sprite.setData('cycleMs', 0);
    sprite.setData('phase', Math.random() * Math.PI * 2);
    sprite.setData('hp', HP[kind]);
    sprite.setData('dmgCdMs', 0);
    sprite.setData('frozenMs', 0);
    sprite.setData('slowMs', 0);
    sprite.setData('dotDamage', 0);
    sprite.setData('dotAccMs', 0);
    sprite.setData('elite', false);
    sprite.setData('eliteMul', 1);
    sprite.setData('warnRing', undefined);
    sprite.setData(
      'state',
      kind === 'shelly' || kind === 'boomy'
        ? 'walk'
        : kind === 'drilly'
          ? 'burrow'
          : kind === 'gusty'
            ? 'drift'
            : kind === 'mirri'
              ? 'roam'
              : 'idle',
    );
    // magno（§59）：磁場相位鏡像供 GameScene 吸偏星彈與星彈免傷判定。
    sprite.setData('magnoPhase', kind === 'magno' ? 'idle' : undefined);
    sprite.setData('stateMs', 0);
    // gusty（§52）：航高鎖存供俯衝後回升。
    sprite.setData('baseY', y);
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
      kind !== 'floaty' &&
        kind !== 'puffy' &&
        kind !== 'zappy' &&
        kind !== 'glowy' &&
        kind !== 'gusty',
    );
    // spiky/shelly/boomy/mirri 以 bounce=1 碰牆自動折返；chompy/spora 定點紮根。
    body.setBounce(
      kind === 'spiky' || kind === 'shelly' || kind === 'boomy' || kind === 'mirri' ? 1 : 0,
      0,
    );
    body.setImmovable(kind === 'chompy' || kind === 'spora');
    // 朝向以玩家位置判向（卷軸世界中不可用單屏中心）；無 target 時退回當前鏡頭中心啟發。
    const inward = target ? (target.x >= x ? 1 : -1) : x < viewCenterX() ? 1 : -1;
    if (kind === 'spiky') body.setVelocity(SPIKY_SPEED * inward, 0);
    else if (kind === 'puffy') body.setVelocity(0, PUFFY_FALL_SPEED);
    else if (kind === 'shelly') body.setVelocity(SHELLY_WALK_SPEED * inward, 0);
    else body.setVelocity(0, 0);

    // 生成彈入；wobble 延後啟動避免同時操作 scale。
    popIn(scene, sprite);

    // wobble idle：果凍感擠壓拉伸；chompy/shelly/drilly/spora 的 scale 由各自狀態機控制，
    // 不掛 wobble。
    if (kind !== 'chompy' && kind !== 'shelly' && kind !== 'drilly' && kind !== 'spora') {
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

  // 星彈與波及共用傷害入口：扣點未死白閃，歸零致死；puffy 死於星彈時爆刺。
  // 抽為內部函式供孢子持續傷（§53）於 update 迴圈共用同一結算管線。
  function damage(enemy: Phaser.GameObjects.GameObject, amount: number): DamageOutcome {
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

    damage,

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

    // 孢子緩速（§53）：緩速計時＋每 tick 輕持續傷；水平速度封頂於 update 迴圈結算。
    applySlow(enemy: Phaser.GameObjects.GameObject, slowMs: number, dotDamage: number) {
      const kind = kindOf(enemy);
      if (!kind) return;
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      sprite.setData('slowMs', slowMs);
      sprite.setData('dotDamage', dotDamage);
      sprite.setData('dotAccMs', 0);
      sprite.setTint(SLOW_TINT);
    },

    // 側風推移（§52 Gusty）：drift 期近域對玩家水平位移推移（positional drift，
    // 不與移動速度控制器對抗）；同域多隻不疊加——合力僅取符號方向、恆速推移（KISS）。
    applyEnvironmentalForces(player: { x: number; y: number }, deltaMs: number) {
      let push = 0;
      for (const child of group.getChildren()) {
        if (!child.active || kindOf(child) !== 'gusty') continue;
        if (child.getData('state') !== 'drift') continue;
        const gusty = child as Phaser.Physics.Arcade.Sprite;
        push += gustWindPush(player.x, player.y, gusty.x, gusty.y);
      }
      if (push === 0) return;
      player.x += Math.sign(push) * GUSTY_FSM.windDriftPxPerSec * (deltaMs / 1000);
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

    // 磁場星彈免傷（§59）：僅 magno field 相位；近戰/下砸/波及/吸入不受影響。
    isStarImmune(enemy: Phaser.GameObjects.GameObject): boolean {
      if (kindOf(enemy) !== 'magno') return false;
      return resolveMagnoStarHit(enemy.getData('magnoPhase') as MagnoPhase) === 'immune';
    },

    // 鏡面反射（§59）：僅 mirri mirror 態；反射彈生成由 GameScene 於星彈 overlap 呼叫。
    isReflective(enemy: Phaser.GameObjects.GameObject): boolean {
      if (kindOf(enemy) !== 'mirri') return false;
      return resolveMirriStarHit(enemy.getData('state') as MirriState) === 'reflect';
    },

    reflectStar,

    getGroup() {
      return group;
    },

    getHazards() {
      return hazards;
    },

    setTarget(next: EnemyTarget | null) {
      target = next;
    },

    // 目標水平位置（§54 難度根修）：boss 房補給遠側生成用；無目標回 null。
    targetX() {
      return target?.x ?? null;
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
          if (left === 0) restoreTint(sprite);
          continue;
        }
        const kind = sprite.getData('kind') as EnemyKind;
        updateEnemyKind(updateCtx, sprite, kind, deltaMs);
        // 孢子緩速（§53）：AI 寫速後統一封頂水平速度＋週期輕持續傷；期滿復色。
        const slowMs = (sprite.getData('slowMs') as number) ?? 0;
        if (slowMs > 0 && sprite.active) {
          const left = Math.max(0, slowMs - deltaMs);
          sprite.setData('slowMs', left);
          body.setVelocityX(
            Phaser.Math.Clamp(body.velocity.x, -SPORA_SLOW.speedCapPx, SPORA_SLOW.speedCapPx),
          );
          const dotDamage = (sprite.getData('dotDamage') as number) ?? 0;
          const dotAccMs = ((sprite.getData('dotAccMs') as number) ?? 0) + deltaMs;
          if (dotDamage > 0 && dotAccMs >= SPORA_SLOW.dotTickMs) {
            sprite.setData('dotAccMs', 0);
            damage(sprite, dotDamage);
          } else {
            sprite.setData('dotAccMs', dotAccMs);
          }
          if (left === 0 && sprite.active) restoreTint(sprite);
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
          continue;
        }
        hazard.setData('lifeMs', lifeMs);
        // 迴旋殼刃（§52）：去而復返驅動走共用 tickBoomerangBody（與迴旋星單一實作）＋自旋；
        // 孢子雲緩升淡出。
        const boomMs = hazard.getData('boomMs') as number | undefined;
        if (boomMs !== undefined && hazard.getData('hazardKind') === 'boomerang') {
          const direction = hazard.getData('boomDir') as 1 | -1;
          const next = tickBoomerangBody(
            hazard.body as Phaser.Physics.Arcade.Body,
            boomMs,
            direction,
            BOOMY_FSM.shellSpeed,
            BOOMY_FSM.shellTurnMs,
            deltaMs,
          );
          hazard.setData('boomMs', next);
          hazard.rotation += direction * SHELL_SPIN_RAD * deltaMs;
        } else if (hazard.getData('hazardKind') === 'spore') {
          hazard.setAlpha(Math.min(0.8, (lifeMs / SPORA_FSM.cloudMs) * 1.2));
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
