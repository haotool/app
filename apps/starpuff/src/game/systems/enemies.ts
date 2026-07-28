import Phaser from 'phaser';
import { ENEMY_TEXTURE_KEYS } from '../core/assetPlan';
import { acquirePooled } from '../core/poolFlags';
import { ENEMY_SIZE, SPORA_SLOW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale } from '../logic/combat';
import { ENEMY_THREAT } from '../logic/difficulty';
import { RESCUE_REACH_Y_TOP } from '../logic/levels';
import {
  BEARLET_FSM,
  BEARMARKET_FSM,
  BOOMY_FSM,
  COMETA_FSM,
  FOAMY_FSM,
  FROSTY_FSM,
  GRAVITYBUB_FSM,
  GUSTY_FSM,
  MANTA_FSM,
  MIRRI_FSM,
  PRISMBEE_FSM,
  SCANNA_FSM,
  SPLATTA_FSM,
  SPORA_FSM,
  gravityBubPull,
  gustWindPush,
  resolveBubblaHit,
  resolveDrillyHit,
  resolveFrostySplit,
  resolveMagnoStarHit,
  resolveMirriStarHit,
  resolvePrismbeeStarHit,
  resolveShellyHit,
  resolveTwinklaHit,
  tickBoomerangBody,
  type BubblaState,
  type DrillyState,
  type MagnoPhase,
  type MirriState,
  type ShellyState,
  type TwinklaState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import {
  PUFFY_FALL_SPEED,
  SPIKY_SPEED,
  updateEnemyKind,
  type EnemyUpdateContext,
} from './enemyUpdates';
import {
  BLOB_SIZE,
  BLOB_TEX,
  BUBBLE_SIZE,
  BUBBLE_TEX,
  MARKET_WAVE_H,
  MARKET_WAVE_TEX,
  MARKET_WAVE_W,
  SHELL_SIZE,
  SHELL_TEX,
  SPIKE_SIZE,
  SPIKE_TEX,
  SPORE_TEX,
  ensureEnemyTextures,
} from './enemyTextures';
import { popIn } from './fx';
import {
  CHOMPY_BITE_MS,
  SHELLY_SHELL_SCALE,
  SHELLY_SPIN_SPEED,
  SHELLY_WALK_SPEED,
} from './groundEnemies';
import { getVisualScale } from './visualScale';

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
  // burn（§119/§120）：焰系傷害來源——冰史萊姆被 burn 擊殺熔解不分裂。
  // prism（§123）：稜系傷害來源——複製噗被 prism 命中即破鏡像。
  damage(
    enemy: Phaser.GameObjects.GameObject,
    amount: number,
    burn?: boolean,
    prism?: boolean,
  ): DamageOutcome;
  // 凍結場（§46 凝光星）：域內小怪凍結停擺，期滿自復。
  freeze(enemy: Phaser.GameObjects.GameObject, durationMs: number): void;
  // 孢子緩速（§53 孢子星/毒爆雲）：緩速期水平速度封頂＋週期輕持續傷，期滿自復。
  applySlow(enemy: Phaser.GameObjects.GameObject, slowMs: number, dotDamage: number): void;
  // 環境力（§52 Gusty 側風／§123 Gravitybub 重力場）：對玩家的水平位移推移，
  // 由 GameScene 逐幀委派；gravityImmune＝引力化抗性（重力場拉移免效）。
  applyEnvironmentalForces(
    player: { x: number; y: number },
    deltaMs: number,
    gravityImmune?: boolean,
  ): void;
  removeInhaled(enemy: Phaser.GameObjects.GameObject): void;
  kindOf(enemy: Phaser.GameObjects.GameObject): EnemyKind | null;
  // 個體可吸判定（§30/§47）：kind 規則 + 個體狀態（shelly 暈眩窗、drilly 破土窗）；精英不可吸。
  isInhalable(enemy: Phaser.GameObjects.GameObject): boolean;
  // 半入地無害態（§47 drilly 潛地/前搖）：觸碰不結算傷害、吸力不彈開。
  isPhasedOut(enemy: Phaser.GameObjects.GameObject): boolean;
  // 磁場星彈免傷（§59 magno field）：星彈命中吸附失效；下砸/波及/接觸照常結算。
  isStarImmune(enemy: Phaser.GameObjects.GameObject): boolean;
  // 鏡面反射（§59 mirri mirror／§123 prismbee 正面）：星彈命中不結算，由 GameScene
  // 分流生成反射彈；fromX 為星彈命中位置（prismbee 面向側判定用，mirri 忽略）。
  isReflective(enemy: Phaser.GameObjects.GameObject, fromX?: number): boolean;
  reflectStar(x: number, y: number, towardX: number, towardY: number): void;
  getGroup(): Phaser.Physics.Arcade.Group;
  getHazards(): Phaser.Physics.Arcade.Group;
  setTarget(target: EnemyTarget | null): void;
  targetX(): number | null;
  aliveCount(): number;
  // 近域可吸數（#812 可及性口徑）：nearX/rangePx 給定時僅計水平距離內個體。
  aliveInhalableCount(nearX?: number, rangePx?: number): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// texture keys 凍結（GAME_DESIGN §10、§19、§31、§55）；缺圖時以同色圓角色塊代替。
// 對照表已收斂至 core/assetPlan（§115），與分階段載入計畫共用單一真值。
const TEXTURES = ENEMY_TEXTURE_KEYS;

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
  bubbla: 1,
  splatta: 1,
  twinkla: 1,
  cometa: 1,
  // cargo 重型（§120）：兩發標準星；frosty 一擊分裂由擊殺路徑結算。
  cargo: 10,
  ticketa: 1,
  scanna: 6,
  foamy: 1,
  frosty: 1,
  manta: 1,
  // §123：copypuff 兩發標準星（破鏡像窗有意義）、bearlet「清除」反制留一發裕度。
  copypuff: 6,
  prismbee: 1,
  datamote: 1,
  gravitybub: 1,
  orbiton: 1,
  riftling: 1,
  bearlet: 4,
  // §125 牛熊怪（L30 召喚體）：三發/四發標準星——蓄力中斷窗與冬眠轉場有意義。
  bullrun: 12,
  bearmarket: 16,
};

const POOL_SIZE = 16;
// 生成初始態（§120 收斂）：三元鏈改查表；未列者 'idle'。
// 無重力品種（§16/§73/§80/§120 收斂查表）。
const NO_GRAVITY_KINDS: readonly EnemyKind[] = [
  'floaty',
  'puffy',
  'zappy',
  'glowy',
  'gusty',
  'bubbla',
  'twinkla',
  'cometa',
  'ticketa',
  'scanna',
  'manta',
  'prismbee',
  'datamote',
  'gravitybub',
  'orbiton',
  'riftling',
];
// 碰牆自動折返品種（bullrun 衝刺撞牆反彈＝二次加速的物理基礎，§125）。
const BOUNCE_KINDS: readonly EnemyKind[] = [
  'spiky',
  'shelly',
  'boomy',
  'mirri',
  'cargo',
  'frosty',
  'bullrun',
];
const INITIAL_STATE: Partial<Record<EnemyKind, string>> = {
  shelly: 'walk',
  boomy: 'walk',
  drilly: 'burrow',
  gusty: 'drift',
  mirri: 'roam',
  bubbla: 'submerged',
  splatta: 'patrol',
  twinkla: 'phased',
  cometa: 'glide',
  ticketa: 'fly',
  scanna: 'scan',
  foamy: 'idle',
  manta: 'cruise',
  copypuff: 'mimic',
  prismbee: 'hover',
  orbiton: 'approach',
  riftling: 'idle',
  bearlet: 'waddle',
  bullrun: 'prowl',
  bearmarket: 'prowl',
};
// puffy 爆刺彈：4 向 220px/s、0.6s 消散、傷害 1（§16）；貼圖鍵與尺寸取
// enemyTextures SSOT（§125 分檔）。
const SPIKE_SPEED = 220;
const SPIKE_LIFE_MS = 600;
const SHELL_SPIN_RAD = 0.02;
// v12（§80）：comettail 高頻短命段加入共用池，上限 24→32 供 L19 六同屏尖峰裕度
//（耗盡時 spawnHazard 回 null 靜默略過，不致崩潰）。
const HAZARD_POOL_SIZE = 32;
// 糖球落地判定線：主地面頂 y=400 上緣（§21 世界幾何常數）。
const BLOB_GROUND_Y = 392;
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
  // 缺圖保底與 hazards 材質（§125 分檔）：單點烘焙委派 enemyTextures。
  ensureEnemyTextures(scene);

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
  // 物理/視覺縮放解耦（§77 根治）：popIn/wobble/死亡壓縮走 fx 代理、呼吸走 mod、
  // 狀態性造型（縮殼/鑽地鰭/半潛/精英體型）走 setBase——物理箱恆為狀態基準。
  const vscale = getVisualScale(scene);

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

  // hazardKind/lifeMs 收進參數（PR #886 R4）：原先依賴「每條 spawner 分支都記得
  // setData」——與 caramel 破口同模式；參數化後漏寫即型別錯誤，單點強制寫入。
  function spawnHazard(
    x: number,
    y: number,
    hazardKind: string,
    lifeMs: number,
  ): Phaser.Physics.Arcade.Sprite | null {
    const hazard = acquirePooled(hazards, x, y, SPIKE_TEX);
    if (!hazard) return null;
    hazard.setActive(true);
    // 池回收重用：外觀屬性統一復位，避免沿用前種 hazard 的殘留樣式；
    // 互動旗標（tideDeflected 等）走 poolFlags 單點復位。
    hazard.setAlpha(1);
    hazard.setRotation(0);
    hazard.setData('hazardKind', hazardKind);
    hazard.setData('lifeMs', lifeMs);
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
      const spike = spawnHazard(x, y, 'spike', SPIKE_LIFE_MS);
      if (!spike) continue;
      spike.setTexture(SPIKE_TEX).setVisible(true);
      spike.setDisplaySize(SPIKE_SIZE, SPIKE_SIZE);
      spike.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
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
    const zap = spawnHazard(x, y, 'zap', PULSE_RING_ACTIVE_MS);
    if (!zap) return;
    zap.setVisible(false);
    const body = zap.body as Phaser.Physics.Arcade.Body;
    // 圓形 hitbox 以 frame 中心定位；池回收重用時 setSize 會自動復位為矩形。
    body.setCircle(radius, zap.width / 2 - radius, zap.height / 2 - radius);
  }

  // 咬合 hitbox：嘴部朝玩家側，僅啟用 0.3s；視覺由 chompy 本體咬合動畫承擔。
  function spawnBite(chompy: Phaser.Physics.Arcade.Sprite): void {
    const dir = target && target.x < chompy.x ? -1 : 1;
    const bite = spawnHazard(chompy.x + dir * BITE_OFFSET_X, chompy.y - 8, 'bite', CHOMPY_BITE_MS);
    if (!bite) return;
    bite.setVisible(false);
    (bite.body as Phaser.Physics.Arcade.Body).setSize(BITE_SIZE, BITE_SIZE);
  }

  // 孢子雲（§52）：噴發位置滯留區域拒止，圓形 hitbox 存活 cloudMs；命中即散（走既有管線）。
  function spawnSporeCloud(x: number, y: number): void {
    playSfx('pop', 0.7);
    const cloud = spawnHazard(x, y, 'spore', SPORA_FSM.cloudMs);
    if (!cloud) return;
    cloud.setTexture(SPORE_TEX).setVisible(true);
    cloud.setDisplaySize(SPORA_FSM.cloudRadiusPx * 2, SPORA_FSM.cloudRadiusPx * 2);
    cloud.setAlpha(0.8);
    cloud.setRotation(0);
    const body = cloud.body as Phaser.Physics.Arcade.Body;
    const radius = SPORA_FSM.cloudRadiusPx * (cloud.width / cloud.displayWidth);
    body.setCircle(radius, cloud.width / 2 - radius, cloud.height / 2 - radius);
    body.setVelocity(0, -14);
  }

  // 鏡面反射彈（§59）：星彈被鏡面態反射為朝玩家的傷害彈，走既有 hazards 管線。
  function reflectStar(x: number, y: number, towardX: number, towardY: number): void {
    playSfx('metal', 1.15);
    const bolt = spawnHazard(x, y, 'reflect', MIRRI_FSM.reflectLifeMs);
    if (!bolt) return;
    bolt.setTexture('fx-star').setVisible(true);
    bolt.setDisplaySize(18, 18);
    bolt.setTint(0xd8dce8);
    const body = bolt.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 14);
    const dx = towardX - x;
    const dy = towardY - y;
    const dist = Math.hypot(dx, dy) || 1;
    body.setVelocity((dx / dist) * MIRRI_FSM.reflectSpeed, (dy / dist) * MIRRI_FSM.reflectSpeed);
  }

  // 拋物糖球（§73 splatta）：重力拋物、落地轉灼燙糖斑；壽命有界逾時必回收（§56）。
  function spawnSugarBlob(x: number, y: number, directionX: 1 | -1): void {
    playSfx('pop', 0.6);
    const blob = spawnHazard(x, y, 'sugarblob', SPLATTA_FSM.blobLifeMs);
    if (!blob) return;
    blob.setTexture(BLOB_TEX).setVisible(true);
    blob.setDisplaySize(BLOB_SIZE, BLOB_SIZE);
    const body = blob.body as Phaser.Physics.Arcade.Body;
    body.setSize(BLOB_SIZE, BLOB_SIZE);
    body.setAllowGravity(true);
    body.setVelocity(SPLATTA_FSM.blobSpeedX * directionX, SPLATTA_FSM.blobSpeedY);
  }

  // 灼燙糖斑（§73）：糖球落地滯留區域拒止（沿孢子雲管線），spotMs 期滿消散。
  function spawnSugarSpot(x: number): void {
    const spot = spawnHazard(x, BLOB_GROUND_Y, 'sugarspot', SPLATTA_FSM.spotMs);
    if (!spot) return;
    spot.setTexture(BLOB_TEX).setVisible(true);
    spot.setDisplaySize(SPLATTA_FSM.spotRadiusPx * 2, 12);
    spot.setAlpha(0.9);
    const body = spot.body as Phaser.Physics.Arcade.Body;
    body.setSize(SPLATTA_FSM.spotRadiusPx * 2 * (spot.width / spot.displayWidth), spot.height);
    body.setVelocity(0, 0);
  }

  // 彗尾段（§80 cometa）：俯衝沿路滯留短命傷害段（壽命有界逾時必回收 §56）。
  function spawnCometTail(x: number, y: number): void {
    const tail = spawnHazard(x, y, 'comettail', COMETA_FSM.tailLifeMs);
    if (!tail) return;
    tail.setTexture('fx-star').setVisible(true);
    tail.setDisplaySize(16, 16);
    tail.setTint(0x9fd8f0);
    tail.setAlpha(0.85);
    const body = tail.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setVelocity(0, 0);
  }

  // 掃描光束（§120 scanna）：鎖定側水平直線光——細長 hitbox 短存留（telegraph 由
  // aim 期承擔），走 hazards 管線。
  function spawnScanBeam(x: number, y: number, directionX: 1 | -1): void {
    playSfx('zap', 0.8);
    const beam = spawnHazard(
      x + directionX * (SCANNA_FSM.beamLengthPx / 2 + 16),
      y,
      'scanbeam',
      SCANNA_FSM.beamLifeMs,
    );
    if (!beam) return;
    beam.setTexture('fx-star').setVisible(true);
    beam.setDisplaySize(SCANNA_FSM.beamLengthPx, 10);
    beam.setTint(0xff9ec4);
    const body = beam.body as Phaser.Physics.Arcade.Body;
    body.setSize(SCANNA_FSM.beamLengthPx * (beam.width / beam.displayWidth), beam.height);
    body.setVelocity(0, 0);
  }

  // 漂浮泡泡（§120 foamy）：不傷人拒止——觸碰使玩家上浮（潮化免疫），走 hazards 管線。
  function spawnBubble(x: number, y: number, directionX: 1 | -1): void {
    const bubble = spawnHazard(x, y, 'bubble', FOAMY_FSM.bubbleLifeMs);
    if (!bubble) return;
    bubble.setTexture(BUBBLE_TEX).setVisible(true);
    bubble.setDisplaySize(BUBBLE_SIZE, BUBBLE_SIZE);
    bubble.setAlpha(0.9);
    const body = bubble.body as Phaser.Physics.Arcade.Body;
    const radius = (BUBBLE_SIZE / 2) * (bubble.width / bubble.displayWidth);
    body.setCircle(radius, bubble.width / 2 - radius, bubble.height / 2 - radius);
    body.setVelocity(FOAMY_FSM.bubbleSpeedX * directionX, FOAMY_FSM.bubbleRiseVy);
  }

  // 扇形水刃（§120 manta）：順流三發直線水刃，壽命有界逾時必回收（§56）。
  function spawnWaterBlade(x: number, y: number, vx: number, vy: number): void {
    const blade = spawnHazard(x, y, 'waterblade', MANTA_FSM.bladeLifeMs);
    if (!blade) return;
    blade.setTexture('fx-star').setVisible(true);
    blade.setDisplaySize(18, 10);
    blade.setTint(0x8ac8e8);
    blade.setRotation(Math.atan2(vy, vx));
    const body = blade.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 14);
    body.setVelocity(vx, vy);
  }

  // 三彩碎片（§123 prismbee 死亡）：面向側扇形三發彩色稜片，壽命有界逾時必回收（§56）。
  function burstPrismShards(x: number, y: number, directionX: 1 | -1): void {
    playSfx('break', 0.9);
    const tints = [0xff9ec4, 0xffd966, 0xb09ae8] as const;
    const fan = [-PRISMBEE_FSM.shardFanVy, 0, PRISMBEE_FSM.shardFanVy] as const;
    for (let i = 0; i < fan.length; i += 1) {
      const shard = spawnHazard(x, y, 'prismshard', PRISMBEE_FSM.shardLifeMs);
      if (!shard) continue;
      shard.setTexture('fx-star').setVisible(true);
      shard.setDisplaySize(14, 14);
      shard.setTint(tints[i] ?? 0xffffff);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setSize(12, 12);
      body.setVelocity(directionX * PRISMBEE_FSM.shardSpeed, fan[i] ?? 0);
    }
  }

  // 下跌箭頭（§123 bearlet，L30 熊市怪前置教學）：紅色下跌箭頭拋物墜落，
  // 落地即散；壽命有界逾時必回收（§56）。
  function spawnCrashArrow(x: number, y: number, directionX: 1 | -1): void {
    const arrow = spawnHazard(x, y, 'crasharrow', BEARLET_FSM.arrowLifeMs);
    if (!arrow) return;
    arrow.setTexture(SPIKE_TEX).setVisible(true);
    arrow.setDisplaySize(16, 16);
    arrow.setTint(0xe86a5a);
    arrow.setRotation(directionX > 0 ? Math.PI * 0.75 : -Math.PI * 0.75);
    const body = arrow.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setAllowGravity(true);
    body.setVelocity(BEARLET_FSM.arrowSpeedX * directionX, BEARLET_FSM.arrowSpeedY);
  }

  // 市場震波（§125 bearmarket）：地面行進波（拍地雙側／甦醒全場），跳躍迴避；
  // 壽命有界逾時必回收（§56）。
  function spawnMarketWave(x: number, y: number, directionX: 1 | -1, quake: boolean): void {
    const spec = quake
      ? { speed: BEARMARKET_FSM.quakeWaveSpeed, lifeMs: BEARMARKET_FSM.quakeWaveLifeMs }
      : { speed: BEARMARKET_FSM.slamWaveSpeed, lifeMs: BEARMARKET_FSM.slamWaveLifeMs };
    const wave = spawnHazard(x, y, 'marketwave', spec.lifeMs);
    if (!wave) return;
    wave.setTexture(MARKET_WAVE_TEX).setVisible(true);
    wave.setDisplaySize(MARKET_WAVE_W, MARKET_WAVE_H);
    wave.setAlpha(0.95);
    const body = wave.body as Phaser.Physics.Arcade.Body;
    body.setSize(MARKET_WAVE_W - 6, MARKET_WAVE_H - 4);
    body.setVelocity(spec.speed * directionX, 0);
  }

  // 迴旋殼刃（§52）：去而復返雙判定；速度由 update 迴圈依 boomerangVelocity 逐幀驅動。
  function spawnBoomerang(x: number, y: number, directionX: 1 | -1): void {
    playSfx('shell-spin', 1.2);
    const shell = spawnHazard(x, y, 'boomerang', BOOMY_FSM.shellLifeMs);
    if (!shell) return;
    shell.setTexture(SHELL_TEX).setVisible(true);
    shell.setDisplaySize(SHELL_SIZE, SHELL_SIZE);
    shell.setAlpha(1);
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
    // 死亡壓縮走 fx 代理（§77 解耦）：自當前形變接續壓至零高。
    vscale.killFxTweens(sprite);
    scene.tweens.add({
      targets: vscale.fx(sprite),
      sx: 1.5,
      sy: 0,
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
    // 縮殼為狀態性造型：走物理基準（§77 解耦），旋轉期碰撞體同步縮小。
    vscale.setBase(sprite, bsx * SHELLY_SHELL_SCALE, bsy * SHELLY_SHELL_SCALE);
    const direction = target && target.x < sprite.x ? -1 : 1;
    (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(SHELLY_SPIN_SPEED * direction);
  }

  // per-kind AI 依賴面（systems/enemyUpdates.ts）：target/elapsedMs 即時 getter，
  // hazards/回收管線以回呼銜接。
  const updateCtx: EnemyUpdateContext = {
    scene,
    vscale,
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
    spawnSugarBlob,
    spawnCometTail,
    spawnScanBeam,
    spawnBubble,
    spawnWaterBlade,
    spawnCrashArrow,
    spawnMarketWave,
    popPuffy(sprite) {
      const { x, y } = sprite;
      deactivate(sprite);
      burstSpikes(x, y);
    },
    // §123 datamote 聚攏：最近同類（排除自身位置重合個體）；群組由本模組持有。
    nearestKind(kind, fromX, fromY) {
      let best: { x: number; y: number } | null = null;
      let bestDist = Infinity;
      for (const child of group.getChildren()) {
        if (!child.active || kindOf(child) !== kind) continue;
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        const dist = (sprite.x - fromX) ** 2 + (sprite.y - fromY) ** 2;
        if (dist > 0 && dist < bestDist) {
          bestDist = dist;
          best = { x: sprite.x, y: sprite.y };
        }
      }
      return best;
    },
  };

  function spawn(kind: EnemyKind, x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
    const sprite = acquirePooled(group, x, y, TEXTURES[kind]);
    if (!sprite) return null;

    // 池重用防護：死亡壓縮/popIn tween 可能仍在播放，先清除再重設外觀。
    scene.tweens.killTweensOf(sprite);
    (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
    sprite.setActive(true).setVisible(true);
    sprite.setTexture(TEXTURES[kind]);
    sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
    // 冪等註冊（§77 解耦）：重錨物理基準並復位 fx/mod 與殘留 fx tween。
    vscale.register(sprite);
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
    // 血量上限鏡像（§125 bearmarket 低血冬眠閾值判定；精英覆寫時同步改寫）。
    sprite.setData('maxHp', HP[kind]);
    sprite.setData('dmgCdMs', 0);
    // §125 池重用重設：熊市怪一次性冬眠旗標不得跨個體殘留。
    sprite.setData('hibernated', false);
    sprite.setData('frozenMs', 0);
    sprite.setData('slowMs', 0);
    sprite.setData('dotDamage', 0);
    sprite.setData('dotAccMs', 0);
    // 池重用重設（§77）：吸入豁免窗不得跨個體殘留。
    sprite.setData('inhaleGraceUntil', 0);
    // R4 重查補強：inhalePull 雖由讀取端逐幀消費清除，但池復用個體在「玩家正
    // 吸入」的生成瞬間可殘留一幀錯誤拉力——重建清單強制歸位。
    sprite.setData('inhalePull', false);
    // R5 品種限定計時/瞄準欄位（scanna beamDir、cometa aimX/aimY/tailMs）：讀取端
    // 雖有 kind/state 閘，重建清單一併強制歸位，免依賴閘門記憶。
    sprite.setData('beamDir', undefined);
    sprite.setData('aimX', undefined);
    sprite.setData('aimY', undefined);
    sprite.setData('tailMs', undefined);
    sprite.setData('elite', false);
    sprite.setData('eliteMul', 1);
    sprite.setData('warnRing', undefined);
    sprite.setData('state', INITIAL_STATE[kind] ?? 'idle');
    // §120 池重用重設：票券蝠軌帶錨依生成高度、冰史萊姆迷你旗標不得跨個體殘留。
    sprite.setData('band', kind === 'ticketa' ? (y < 245 ? 'high' : 'low') : undefined);
    sprite.setData('mini', false);
    // magno（§59）：磁場相位鏡像供 GameScene 吸偏星彈與星彈免傷判定。
    sprite.setData('magnoPhase', kind === 'magno' ? 'idle' : undefined);
    // §123 池重用重設：重力泡相位鏡像、複製噗鏡像錨、裂隙怪目的地、軌道怪相位角。
    sprite.setData('bubPhase', kind === 'gravitybub' ? 'idle' : undefined);
    sprite.setData('lastTargetX', undefined);
    sprite.setData('blinkX', undefined);
    sprite.setData('orbitAngle', undefined);
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
    // bubbla（§73）定點潛伏：重力關閉，leap 位移由狀態機速度逼近驅動。
    // twinkla/cometa（§80）：星靈漂浮/高處巡游，重力一律關閉。
    // ticketa/scanna/manta（§120）：雙軌飛行/定點懸浮/低空巡游，重力一律關閉。
    body.setAllowGravity(!NO_GRAVITY_KINDS.includes(kind));
    // spiky/shelly/boomy/mirri/cargo/frosty 以 bounce=1 碰牆自動折返。
    body.setBounce(BOUNCE_KINDS.includes(kind) ? 1 : 0, 0);
    // 定點紮根（chompy/spora）由行為維持（更新迴圈不賦速），禁用 immovable——
    // immovable 動態體與靜態地面不做分離會穿地沉至世界底（#841 驗屍根因：
    // L14 救援 spora 埋於 y≈462 不可及，rescueNear 又抑制新救援成重尾）。
    body.setImmovable(false);
    // 朝向以玩家位置判向（卷軸世界中不可用單屏中心）；無 target 時退回當前鏡頭中心啟發。
    const inward = target ? (target.x >= x ? 1 : -1) : x < viewCenterX() ? 1 : -1;
    if (kind === 'spiky') body.setVelocity(SPIKY_SPEED * inward, 0);
    else if (kind === 'puffy') body.setVelocity(0, PUFFY_FALL_SPEED);
    else if (kind === 'shelly') body.setVelocity(SHELLY_WALK_SPEED * inward, 0);
    else body.setVelocity(0, 0);

    // 生成彈入；wobble 延後啟動避免同時操作 fx。
    popIn(scene, sprite);

    // wobble idle：果凍感擠壓拉伸（fx 代理，物理箱不動）；chompy/shelly/drilly/spora
    // 的造型由各自狀態機控制，不掛 wobble。
    if (kind !== 'chompy' && kind !== 'shelly' && kind !== 'drilly' && kind !== 'spora') {
      scene.tweens.add({
        targets: vscale.fx(sprite),
        sx: 1.08,
        sy: 0.92,
        duration: 360,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 260,
      });
    }
    return sprite;
  }

  // 冰史萊姆分裂（§120）：本體被擊殺分裂兩隻迷你體（半衝量左右散開，不再分裂）；
  // 池滿時 spawn 回 null 靜默略過（不致崩潰）。
  function splitFrosty(sprite: Phaser.Physics.Arcade.Sprite): void {
    for (const direction of [-1, 1] as const) {
      const mini = spawn('frosty', sprite.x + direction * 14, sprite.y);
      if (!mini) continue;
      mini.setData('mini', true);
      mini.setDisplaySize(ENEMY_SIZE * FROSTY_FSM.miniScale, ENEMY_SIZE * FROSTY_FSM.miniScale);
      // 迷你體型為狀態性造型：重錨物理基準（§77 解耦）。
      vscale.register(mini);
      mini.setData('baseSX', mini.scaleX);
      mini.setData('baseSY', mini.scaleY);
      (mini.body as Phaser.Physics.Arcade.Body).setVelocityX(direction * FROSTY_FSM.splitVx);
    }
  }

  // 星彈與波及共用傷害入口：扣點未死白閃，歸零致死；puffy 死於星彈時爆刺。
  // 抽為內部函式供孢子持續傷（§53）於 update 迴圈共用同一結算管線。
  // prism（§123 稜化破鏡像）：稜系傷害來源標記——複製噗被 prism 命中即入 broken 窗。
  function damage(
    enemy: Phaser.GameObjects.GameObject,
    amount: number,
    burn = false,
    prism = false,
  ): DamageOutcome {
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
    // 焦糖泡（§73）：僅躍出窗可傷，半潛免傷。
    if (
      kind === 'bubbla' &&
      resolveBubblaHit(sprite.getData('state') as BubblaState) === 'immune'
    ) {
      return 'ignored';
    }
    // 星屑幽靈（§80）：僅實體窗可傷，虛化/前搖穿身免傷。
    if (
      kind === 'twinkla' &&
      resolveTwinklaHit(sprite.getData('state') as TwinklaState) === 'immune'
    ) {
      return 'ignored';
    }
    sprite.setData('dmgCdMs', DAMAGE_COOLDOWN_MS);
    const hp = (sprite.getData('hp') as number) - amount;
    if (hp > 0) {
      sprite.setData('hp', hp);
      flashWhite(sprite);
      // 複製噗（§123）：稜化命中未死即破鏡像（行為解除窗，非免傷）。
      if (kind === 'copypuff' && prism) {
        sprite.setData('state', 'broken');
        sprite.setData('stateMs', 0);
        playSfx('break', 1.1);
      }
      // 牛市怪（§125）：蓄力期受星彈命中即中斷入回復——單發可斷、
      // 雷化鏈電波及＝群體中斷優勢（PRD §6.6 反制）。
      if (kind === 'bullrun' && sprite.getData('state') === 'charge') {
        sprite.setData('state', 'recover');
        sprite.setData('stateMs', 0);
        playSfx('break', 0.9);
      }
      return 'hurt';
    }
    if (kind === 'puffy') burstSpikes(sprite.x, sprite.y);
    // 冰史萊姆（§120）：擊殺分裂；焰系 burn 熔解不分裂（迷你體恆不分裂）。
    if (kind === 'frosty' && resolveFrostySplit(burn, sprite.getData('mini') === true)) {
      splitFrosty(sprite);
    }
    // 稜蜂（§123）：死亡射三彩碎片（面向側扇形）；吸入回收不經此路徑。
    if (kind === 'prismbee') {
      burstPrismShards(sprite.x, sprite.y, sprite.flipX ? -1 : 1);
    }
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
      sprite.setDisplaySize(ENEMY_SIZE * opts.scale, ENEMY_SIZE * opts.scale);
      // 精英體型為狀態性造型：重新註冊重錨物理基準（§77 解耦），並清掉 spawn 的 fx tween。
      vscale.register(sprite);
      sprite.setTint(opts.tint);
      sprite.setData('hp', opts.hp);
      sprite.setData('maxHp', opts.hp);
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

    // 側風推移（§52 Gusty）＋重力場拉移（§123 Gravitybub）：對玩家水平 positional
    // drift（不與移動速度控制器對抗）；同域多隻不疊加——合力僅取符號方向、恆速推移
    //（KISS）。gravityImmune（§119 引力化抗性）：重力場拉移對引力化免效，側風照常。
    applyEnvironmentalForces(
      player: { x: number; y: number },
      deltaMs: number,
      gravityImmune = false,
    ) {
      let push = 0;
      let pull = 0;
      for (const child of group.getChildren()) {
        if (!child.active) continue;
        const kind = kindOf(child);
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (kind === 'gusty' && child.getData('state') === 'drift') {
          push += gustWindPush(player.x, player.y, sprite.x, sprite.y);
        } else if (kind === 'gravitybub' && child.getData('bubPhase') === 'field') {
          pull += gravityBubPull(player.x, player.y, sprite.x, sprite.y);
        }
      }
      if (push !== 0) {
        player.x += Math.sign(push) * GUSTY_FSM.windDriftPxPerSec * (deltaMs / 1000);
      }
      if (pull !== 0 && !gravityImmune) {
        player.x += Math.sign(pull) * GRAVITYBUB_FSM.pullPxPerSec * (deltaMs / 1000);
      }
    },

    // 個體可吸判定（§30/§47/§73/§80）：kind 規則疊加個體狀態暴露窗；精英（§48）一律不可吸。
    isInhalable(enemy: Phaser.GameObjects.GameObject): boolean {
      const kind = kindOf(enemy);
      if (!kind || enemy.getData('elite') === true) return false;
      const state = enemy.getData('state') as string;
      return canInhale(
        kind,
        state === 'stun' || state === 'surfaced' || state === 'leap' || state === 'solid',
      );
    },

    // 半入地/穿身無害態（§47/§73/§80）：drilly 潛地/前搖、bubbla 潛伏/漣漪/回潛、
    // twinkla 虛化/前搖——觸碰不結算傷害、吸力不彈開。
    isPhasedOut(enemy: Phaser.GameObjects.GameObject): boolean {
      const kind = kindOf(enemy);
      if (kind === 'drilly') return enemy.getData('state') !== 'surfaced';
      if (kind === 'bubbla') return enemy.getData('state') !== 'leap';
      if (kind === 'twinkla') return enemy.getData('state') !== 'solid';
      return false;
    },

    // 磁場星彈免傷（§59）：僅 magno field 相位；近戰/下砸/波及/吸入不受影響。
    isStarImmune(enemy: Phaser.GameObjects.GameObject): boolean {
      if (kindOf(enemy) !== 'magno') return false;
      return resolveMagnoStarHit(enemy.getData('magnoPhase') as MagnoPhase) === 'immune';
    },

    // 鏡面反射（§59 mirri／§123 prismbee）：mirri 僅 mirror 態；prismbee 正面（面向側
    // 來彈）恆反射、側背面脆弱——側擊即反制（anti-softlock：非全向免傷）。
    isReflective(enemy: Phaser.GameObjects.GameObject, fromX?: number): boolean {
      const kind = kindOf(enemy);
      if (kind === 'mirri') {
        return resolveMirriStarHit(enemy.getData('state') as MirriState) === 'reflect';
      }
      if (kind === 'prismbee' && fromX !== undefined) {
        const sprite = enemy as Phaser.Physics.Arcade.Sprite;
        const facing = sprite.flipX ? -1 : 1;
        return resolvePrismbeeStarHit(facing, fromX - sprite.x) === 'reflect';
      }
      return false;
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
    // #812 可及性口徑：nearX/rangePx 給定時僅計「水平距離內、可及帶內的非威脅型」
    // 可吸個體——名義可吸但遠在視野外（可吸≠可及，外部評審 P0-4）、高於可及頂線
    //（高空定飄需跳拍追擊）、或屬 ranged 威脅型（放電/反射/拋射、多為移動目標，
    // 零彈追擊高成本）者，均不得阻斷救援計時。
    aliveInhalableCount(nearX?: number, rangePx?: number) {
      const near = nearX !== undefined && rangePx !== undefined;
      let count = 0;
      for (const child of group.getChildren()) {
        const kind = kindOf(child);
        if (!kind || child.getData('elite') === true) continue;
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (near && Math.abs(sprite.x - nearX) > rangePx) continue;
        if (near && (sprite.y < RESCUE_REACH_Y_TOP || ENEMY_THREAT[kind] === 'ranged')) continue;
        const state = child.getData('state') as string;
        if (canInhale(kind, state === 'stun' || state === 'surfaced' || state === 'leap'))
          count += 1;
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
        } else if (hazard.getData('hazardKind') === 'sugarblob') {
          // 糖球落地轉灼燙糖斑（§73）：越過地面線即回收本體、原地生成滯留糖斑。
          if (hazard.y >= BLOB_GROUND_Y) {
            const spotX = hazard.x;
            const body = hazard.body as Phaser.Physics.Arcade.Body;
            body.stop();
            body.enable = false;
            hazard.setActive(false).setVisible(false);
            spawnSugarSpot(spotX);
            continue;
          }
        } else if (hazard.getData('hazardKind') === 'sugarspot') {
          hazard.setAlpha(Math.min(0.9, (lifeMs / SPLATTA_FSM.spotMs) * 1.4));
        } else if (hazard.getData('hazardKind') === 'comettail') {
          // 彗尾段（§80）：沿壽命漸隱（與孢子雲/糖斑淡出語彙一致）。
          hazard.setAlpha(Math.min(0.85, (lifeMs / COMETA_FSM.tailLifeMs) * 1.3));
        } else if (hazard.getData('hazardKind') === 'crasharrow') {
          // 下跌箭頭（§123）：落地即散（不留滯留區——L30 前置教學僅教語彙）。
          if (hazard.y >= BLOB_GROUND_Y) {
            const body = hazard.body as Phaser.Physics.Arcade.Body;
            body.stop();
            body.enable = false;
            hazard.setActive(false).setVisible(false);
            continue;
          }
        } else if (hazard.getData('hazardKind') === 'prismshard') {
          // 三彩碎片（§123）：沿壽命漸隱＋自旋。
          hazard.setAlpha(Math.min(0.9, (lifeMs / PRISMBEE_FSM.shardLifeMs) * 1.3));
          hazard.rotation += deltaMs * 0.01;
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
