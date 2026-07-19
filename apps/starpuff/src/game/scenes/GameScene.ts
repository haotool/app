import Phaser from 'phaser';
import {
  EGG_HP_CAP,
  ENEMY,
  GRAVITY_Y,
  INHALE,
  PLAYER,
  SLAM,
  STARSTORM,
  STAR_FLAVORS,
  VIEW,
  getMix,
  type MixId,
  type StarFlavor,
  type StarFlavorSpec,
  type StarMixSpec,
} from '../core/config';
import {
  GameEvents,
  emitGameEvent,
  offGameEvent,
  onGameEvent,
  type GameEventName,
} from '../core/events';
import { FLAVOR_HINTS, MIX_HINTS } from '../core/codex';
import {
  loadSave,
  persistSave,
  recordEgg,
  recordExClear,
  recordLevelClear,
  type SaveData,
} from '../core/save';
import {
  SceneKeys,
  type BossKind,
  type EnemyKind,
  type GameResultData,
  type LevelId,
} from '../core/types';
import { BOSS } from '../logic/bossFsm';
import { NOCTRA } from '../logic/noctraFsm';
import { PRISMIX } from '../logic/prismixFsm';
import { SYRONA } from '../logic/syronaFsm';
import { VOIDRA } from '../logic/voidraFsm';
import {
  inhaleFlavor,
  inhaleGraceUntil,
  isContactHarmless,
  isInInhaleRange,
  knockbackVelocity,
  pickInRadius,
} from '../logic/combat';
import { magnetPull } from '../logic/enemyFsm';
import {
  BOSS_AIM_ASSIST,
  HOMING_RANGE_PX,
  HOMING_TURN_RAD_PER_MS,
  nearestInRange,
  steerTowardTarget,
} from '../logic/homing';
import { SHELL_SHIELD, pickChainTargets } from '../logic/skills';
import { GALE_FLIGHT, SHELL_REFLECT, TRANSFORM_FORMS, VOLT_BEAM } from '../logic/transform';
import {
  advanceEgg,
  createEggProgress,
  type EasterEggSpec,
  type EggEvent,
  type EggProgress,
} from '../logic/eggs';
import {
  buffAccelMul,
  buffDamageMul,
  buffSpeedMul,
  consumeShieldBlock,
  createBuffState,
  pickupBuff,
  tickBuff,
  BUFF_SPECS,
  type BuffId,
  type BuffState,
} from '../logic/buffs';
import { checkpointRespawnX, getLevel, nextLevelId, type LevelSpec } from '../logic/levels';
import {
  MERCY_HEAL,
  advanceMercyHeal,
  createMercyState,
  type MercyState,
} from '../logic/mercyHeal';
import { crossedGate, type BoundsRect } from '../logic/stageModel';
import { createParallaxBackground, type BackgroundHandle } from '../systems/background';
import { createBoss, type BossDamageSource, type BossHandle } from '../systems/boss';
import { createBossRoom, type BossRoomHandle } from '../systems/bossRoom';
import { createNoctra } from '../systems/noctra';
import { createPrismix } from '../systems/prismix';
import { createSyrona } from '../systems/syrona';
import { createVoidra } from '../systems/voidra';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createEliteRoom, type EliteRoomHandle } from '../systems/eliteRoom';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem, type TrailHandle } from '../systems/fx';
import { createHud } from '../systems/hud';
import { openPauseMenu } from '../systems/pause';
import { spawnHealPickup } from '../systems/pickups';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createMeteorSystem, type MeteorSystem } from '../systems/meteor';
import { createStage, type StageHandle } from '../systems/stage';
import { createTide, type TideHandle } from '../systems/tide';
import { TIDE, tideSoakVelocity } from '../logic/tide';
import { createWaveRunner, type WaveRunner } from '../systems/waves';
import { bindSfxToEvents, playSfx, stopSfx } from '../audio/sfx';

const GROUND_HEIGHT = 80;
const GROUND_TOP = VIEW.height - GROUND_HEIGHT;
const SPAWN_EDGE_X = 48;
// 與 waves.ts 生成高度一致：飄飄鳥須在跳躍＋拍翅可達高度（橫式地面頂 y=400）。
const SPAWN_AIR_Y = 240;
const SPAWN_DROP_Y = 330;
const MOUTH_OFFSET_X = 26;
const SWALLOW_RANGE_PX = 46;
const PULL_BASE_SPEED = 160;
const PULL_GAIN = 2.2;
const REPEL_SPEED = 260;
const REPEL_LIFT = -180;
// 魔王死亡演出：慢動作 0.5s + 星爆 0.9s 後進勝利流程。
const WIN_DELAY_MS = 1500;
// P3（§30）：進場時停 0.3s；全場震落強制彈起初速。
const P3_HITSTOP_MS = 300;
const QUAKE_BOUNCE_VY = -360;
// 死亡重試：噗滅演出後 ≤400ms 回到可操作（§15.1 M-09）。
const RETRY_DELAY_MS = 350;
// 星星門：位於世界右端、地面上方；演出時玩家縮小旋轉飛入。
const GATE_MARGIN_X = 120;
const GATE_Y = GROUND_TOP - 90;
const GATE_ZONE_W = 90;
const GATE_ZONE_H = 150;
const GATE_ABSORB_MS = 700;
// 過關星爆停留短拍後進世界地圖（§39：通關後自動進入）。
const MAP_ENTER_DELAY_MS = 500;
// 雷鏈跳電演出（§40）：折線閃電段淡出時長。
const BOLT_FADE_MS = 200;

interface GameSceneData {
  levelId?: LevelId;
  deaths?: number;
  // EX 變體挑戰（§58）：已通關魔王節點的第二入口。
  ex?: boolean;
}

const asSprite = (obj: unknown): Phaser.Physics.Arcade.Sprite =>
  obj as Phaser.Physics.Arcade.Sprite;

// 星味首遇提示（§46/§47）：seen 僅存 session 記憶體（跨關卡重試保留、重載重置），
// 不動 save schema。
const seenFlavorHints = new Set<string>();

export class GameScene extends Phaser.Scene {
  playerHp: number = PLAYER.maxHp;
  bossHp = -1;
  currentLevelId: LevelId = 1;

  private level!: LevelSpec;
  // 存檔 session 快取（§38）：create 載入一次，事件時就地更新＋單次 persist，
  // 避免每次寫入重複 loadSave 解析。
  private save!: SaveData;
  // 本關累計死亡次數：死亡重試與敗北重試皆延續，結算畫面展示。
  private deaths = 0;
  // EX 變體模式（§58）：魔王工廠與通關記錄依此分流。
  private exMode = false;
  // 慈悲補血（§62）：每關每命狀態（create 重建即歸零）；rng/時間快轉供 e2e 注入。
  private mercy: MercyState = createMercyState();
  private mercyRng: () => number = Math.random;
  private mercyWarpMs = 0;
  private startedAt = 0;
  // 魔王擊破瞬間鎖存的通關用時（審查修復 #724）；非 boss 關恆 null 走即時計算。
  private clearTimeMs: number | null = null;
  private finished = false;
  private transitioning = false;
  private bossDown = false;
  private prevVy = 0;
  private wasInhaling = false;
  private minionDropCount = 0;
  private mouth = { x: 0, y: 0 };
  private gate: Phaser.GameObjects.Container | null = null;
  private gateRect: BoundsRect | null = null;
  private prevPlayerX = 0;
  // 卡點關中點重生（§67）：本命最遠推進 x——越過 checkpoint 後死亡自 checkpoint 重生。
  private farthestX = 0;
  // 彩蛋（§24）：每關進度鎖存；bossActiveAt 供 crown-early-hit 時間窗。
  private eggProgress: EggProgress[] = [];
  private bossActiveAt = -1;
  // 中魔王精英房（§48/§52）：全流程委派 systems/eliteRoom.ts；v8 起一關可多房（L6 雙精英）。
  private eliteRooms: EliteRoomHandle[] = [];

  private tide: TideHandle | null = null;
  // 流星雨（§79）：關卡級環境彈幕；無配置關為 null。
  private meteor: MeteorSystem | null = null;
  // 魔王關體系（§69）：前室 prefab 與短期增益狀態；非前室魔王關為 null。
  private bossRoom: BossRoomHandle | null = null;
  private buff: BuffState = createBuffState();
  // e2e 觀測（§69）：本局累計增益拾取數——護盾可能拾取後旋即格擋消耗，快照式觀測會漏。
  private buffPickups = 0;
  private unbinders: (() => void)[] = [];
  private terrainGround: Phaser.GameObjects.Rectangle | null = null;
  // 地形單向平台（§77）：交 stage 統一下穿裁決（與 elements oneway 同權）。
  private terrainPlatforms: Phaser.GameObjects.Rectangle[] = [];
  private background!: BackgroundHandle;
  private controls!: ControlsSystem;
  private player!: PlayerHandle;
  private enemies!: EnemySystem;
  private waves!: WaveRunner;
  private boss!: BossHandle;
  // 魔王體傷（§54）：由 buildBoss 工廠隨品種一次取齊。
  private bossTouchDamage: number = BOSS.bodyDamage;
  private fx!: FxSystem;
  private stage!: StageHandle;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: GameSceneData): void {
    this.currentLevelId = data.levelId ?? 1;
    this.deaths = data.deaths ?? 0;
    this.exMode = data.ex === true;
  }

  create(): void {
    this.level = getLevel(this.currentLevelId);
    this.save = loadSave();
    this.startedAt = this.time.now;
    this.clearTimeMs = null;
    this.finished = false;
    this.transitioning = false;
    this.bossDown = false;
    this.wasInhaling = false;
    this.minionDropCount = 0;
    this.playerHp = PLAYER.maxHp;
    this.bossHp = -1;
    this.gate = null;
    this.gateRect = null;
    this.eggProgress = this.level.easterEggs.map(() => createEggProgress());
    this.bossActiveAt = -1;
    this.farthestX = 0;
    this.mercy = createMercyState();
    this.mercyRng = Math.random;
    this.mercyWarpMs = 0;

    this.physics.world.setBounds(0, 0, this.worldWidth(), VIEW.height);
    // 低重力（§81）：關卡級重力係數單點注入（缺省 1.0 零回歸）；世界重力為全域值，
    // 每次 create 必須顯式重設（防前關/Voidra P3 注入殘留）。
    this.physics.world.gravity.y = GRAVITY_Y * (this.level.gravityScale ?? 1);
    this.background = createParallaxBackground(this, this.level);
    const { ground, platforms } = this.addTerrain();
    this.terrainGround = ground;
    this.terrainPlatforms = platforms;
    // v4 平台元素與佈景（§29/§32）：緊接地形建立，維持 平台 < 佈景/元素 < 玩家 繪製序；
    // hooks 以閉包延遲解析（player/enemies 於後續建立，呼叫時已就緒）。
    this.stage = createStage(this, this.level, {
      player: () => this.player,
      spawnAmmoMinion: (x, y) => this.enemies.spawn('jelly', x, y),
      // 折躍瞬移（§66）：重置門掃掠基準，防前後幀大位移被誤判為跨越星星門。
      onWarp: (x) => {
        this.prevPlayerX = x;
      },
      // §77：地形粉紅平台納入下穿裁決（下＋跳可穿落，與 elements oneway 同權）。
      terrainOneWay: () => this.terrainPlatforms,
    });

    this.controls = createControls(this);
    this.buff = createBuffState();
    this.buffPickups = 0;
    // 前室魔王關（§69）：自廊道起點入場；一般魔王關維持 arena 中央。
    const startX = this.level.boss
      ? this.level.anteroomPx !== undefined
        ? 60
        : this.worldWidth() / 2
      : 100;
    this.player = createPlayer(this, startX, GROUND_TOP - 40);
    this.enemies = createEnemySystem(this);
    // 糖漿潮汐（§71）：關卡級配置建立；spawn 調整走交叉不變式 13/17 hook。
    this.tide = this.level.tide ? createTide(this, this.level.tide, this.worldWidth()) : null;
    // 流星雨（§79）：關卡級配置建立；落點排除與傷害結算見 advanceMeteors/addOverlaps。
    // Voidra 關（§82）：預建停用態系統供 P2 轟炸沿單一管線開關（overlap 於 create 接線）。
    this.meteor = this.level.meteor
      ? createMeteorSystem(this, this.level.meteor)
      : this.level.boss === 'voidra'
        ? createMeteorSystem(this, { intervalMs: 3400, waveSize: 2 }, false)
        : null;
    this.waves = createWaveRunner(this, this.enemies, this.currentLevelId, {
      adjustSpawn: (kind, y) =>
        this.tide
          ? { kind: this.tide.filterSpawnKind(kind), y: this.tide.adjustSpawnY(y) }
          : { kind, y },
    });
    // 雙魔王（§54）：品種唯一分派點 buildBoss；非 boss 關建 jellord 待命殼（永不 spawn）。
    const bossKit = this.buildBoss(this.level.boss ?? 'jellord');
    this.boss = bossKit.handle;
    this.bossTouchDamage = bossKit.bodyDamage;
    this.fx = createFx(this);
    createHud(this);
    // 精英房（§48/§52）：boss 關無精英；一關可多房，hooks 閉包延遲解析既有系統。
    const eliteHooks = {
      player: () => this.player,
      enemies: () => this.enemies,
      fx: () => this.fx,
      playerHp: () => this.playerHp,
      gateOpen: () => this.waves.isGateOpen(),
    };
    this.eliteRooms = (this.level.boss ? [] : this.level.elites).map((spec) =>
      createEliteRoom(this, spec, GROUND_TOP, eliteHooks),
    );
    // 魔王關前室（§69）：廊道 prefab＋單向門；入 arena 當幀停跟隨、對齊相機、啟動入場。
    this.bossRoom =
      this.level.boss && this.level.anteroomPx !== undefined
        ? createBossRoom(this, this.level, {
            player: () => this.player,
            playerHp: () => this.playerHp,
            spawnSupply: (kind, x, y) => this.enemies.spawn(kind, x, y),
            onPickBuff: (id) => this.applyBuff(id),
            onEnterArena: () => {
              this.cameras.main.stopFollow();
              this.cameras.main.setScroll(this.level.anteroomPx ?? 0, 0);
              this.boss.spawn();
            },
          })
        : null;
    const unbindSfx = bindSfxToEvents(this.events);

    this.cameras.main.setBounds(0, 0, this.worldWidth(), VIEW.height);
    // 剛性跟隨（US-022 / recon 硬規則 9）：lerp 1,1 消除 lerp×roundPixels 逐幀往返跳動；
    // boss 關單屏不跟隨（入場運鏡不被覆寫）；前室魔王關廊道段跟隨、入 arena 停跟隨。
    if (!this.level.boss || this.bossRoom) {
      this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
    }
    this.scale.on('resize', this.onScaleResize);
    this.unbinders.push(() => this.scale.off('resize', this.onScaleResize));

    // 桌機暫停備援（§35）：ESC / P 開啟暫停選單；觸控走 HUD 暫停鍵。
    const onPauseKey = (): void => openPauseMenu(this.game);
    this.input.keyboard?.on('keydown-ESC', onPauseKey);
    this.input.keyboard?.on('keydown-P', onPauseKey);
    this.unbinders.push(() => {
      this.input.keyboard?.off('keydown-ESC', onPauseKey);
      this.input.keyboard?.off('keydown-P', onPauseKey);
    });

    this.fx.attachPlayer(this.player.sprite);
    this.fx.attachBoss(asSprite(this.boss.getBody()));
    this.enemies.setTarget(this.player.sprite);
    this.boss.setTarget(this.player.sprite);

    this.physics.add.collider(this.player.sprite, ground);
    // §77：粉紅平台改走 canLandOneWay 裁決——下穿窗放行、高速著地帶動態放寬。
    this.physics.add.collider(
      this.player.sprite,
      platforms,
      undefined,
      this.stage.canLandOneWay,
      this,
    );
    // 場控魔王 arena 浮台（§74 Syrona）：呈現層動態佈建，此處接玩家 collider。
    const bossPlatforms = this.boss.getPlatforms?.() ?? [];
    if (bossPlatforms.length > 0) {
      this.physics.add.collider(this.player.sprite, bossPlatforms, undefined, (_p, platform) => {
        const rect = platform as Phaser.GameObjects.Rectangle;
        const rectBody = rect.body as Phaser.Physics.Arcade.StaticBody;
        const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        return playerBody.velocity.y >= 0 && playerBody.bottom <= rectBody.top + 6;
      });
    }
    this.physics.add.collider(this.enemies.getGroup(), ground);
    this.addOverlaps();
    this.bindEvents();

    this.boss.onMinionDrop(() => this.spawnBossMinion());

    // shutdown 清理 Phaser 不接管的資源：scene.events 監聽（restart 不重建 emitter，
    // 未解除即跨局累積）、DOM 監聽、音訊迴圈。player 的 PRE/POST_UPDATE bob 掛鉤必須
    // 在此解除；fx/hud 自掛 shutdown 自清，enemies/boss 無 scene.events 與 DOM 監聽，
    // 其 group/timer/tween 由 Phaser 系統先行銷毀，不得在此重複呼叫（group 已失效）。
    this.events.once('shutdown', () => {
      this.unbinders.forEach((off) => off());
      this.unbinders.length = 0;
      unbindSfx();
      stopSfx('inhale');
      this.waves.destroy();
      this.controls.destroy();
      this.background.destroy();
      this.player.destroy();
      this.stage.destroy();
      this.bossRoom?.destroy();
      this.bossRoom = null;
      this.tide?.destroy();
      this.tide = null;
      this.meteor?.destroy();
      this.meteor = null;
    });

    this.waves.start();
    // 前室魔王關（§69）：入場運鏡延至玩家走入 arena 才啟動（onEnterArena）。
    if (this.level.boss && !this.bossRoom) this.boss.spawn();
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.player) return;
    this.background.update(deltaMs);
    this.controls.update(deltaMs);
    if (!this.finished && !this.transitioning) {
      this.syncTutorialInput();
      this.player.update(this.controls.state, deltaMs);
      this.stage.update(this.controls.state, deltaMs);
      // 下跳指示（§77/§85）：下向意圖（含釋放緩衝窗）＋站台 → 跳鍵變色與箭頭翻轉。
      this.controls.setDropReady(this.stage.isDropReady(this.controls.state.downBuffered));
      this.clampAboveGround();
      this.farthestX = Math.max(this.farthestX, this.player.sprite.x);
      this.syncJumpSfx();
      this.syncInhale();
      this.syncEggs();
      this.syncGateSweep();
      for (const room of this.eliteRooms) room.update();
      this.bossRoom?.update();
      this.advanceBuff(deltaMs);
      this.steerHomingStars(deltaMs);
      this.steerBossAimAssist(deltaMs);
      this.steerMagnetizedStars(deltaMs);
      this.advanceMercy(deltaMs);
      // 側風推移（§52）：委派 enemies 系統結算；迴旋星驅動已內建於 player.update。
      this.enemies.applyEnvironmentalForces(this.player.sprite, deltaMs);
      this.advanceTide(deltaMs);
      this.advanceMeteors(deltaMs);
      this.applyBossVents(deltaMs);
    }
    this.enemies.update(deltaMs);
    // 拉力必須在 enemies AI 之後套用，避免被小怪速度邏輯覆寫。
    if (!this.finished && !this.transitioning) this.applyInhalePull();
    // 魔王關補生等入場運鏡完成（boss active）才推進，避免入場中生怪干擾玩家（review #698）。
    if (!this.level.boss || this.boss.isActive()) this.waves.update(deltaMs);
    this.boss.update(deltaMs);
    this.syncStarTrails();
  }

  forceWin(): void {
    if (this.scene.isActive()) this.finish('won');
  }

  // e2e 鉤子：模擬死亡結果（魔王關敗北進結算、卡點關越過中點自 checkpoint 重生、
  // 其餘重試當前關）——與 PLAYER_DIED 真實路徑同分岔。
  forceLose(): void {
    if (!this.scene.isActive() || this.finished || this.transitioning) return;
    this.deaths += 1;
    if (this.level.boss) {
      // 段起點重試（§82 Voidra）：P2/P3 死亡不回滾整場，玩家重生於 arena 左帶。
      if (this.boss.trySegmentRespawn?.() === true) {
        this.player.sprite.setVisible(false);
        this.clearFieldForSegmentRetry();
        this.respawnAtCheckpoint(this.arenaLeft() + 90);
        return;
      }
      this.finish('lost');
      return;
    }
    const respawnX = checkpointRespawnX(this.level, this.farthestX);
    if (respawnX !== null) this.respawnAtCheckpoint(respawnX);
    else this.retryLevel();
  }

  // 段重試清場（§82 審查根修）：段起點重試保留同一場景，補給小怪與飛行中隕星/餘燼
  // 會跨重試累積——重生前全數清除（比照整場重啟語義），彈藥由飢荒保證律立即補生。
  private clearFieldForSegmentRetry(): void {
    for (const child of this.enemies.getGroup().getChildren()) {
      if (child.active) this.enemies.kill(child);
    }
    this.meteor?.clearAirborne();
  }

  // e2e 鉤子：直接補滿配額觸發星星門。
  forceGate(): void {
    if (this.scene.isActive()) this.waves.forceQuota();
  }

  // e2e 鉤子（§48/§52）：以正式傷害管線秒殺當前武裝中的精英（多房依進度逐房）。
  slayElite(): void {
    if (!this.scene.isActive()) return;
    const room = this.eliteRooms.find((candidate) => {
      const state = candidate.state();
      return state.armed && !state.done;
    });
    room?.slay();
  }

  // e2e 觀測點（§48/§52）：回報第一個未完成房的狀態（單房關語意不變）；全完成回末房。
  eliteState(): { armed: boolean; done: boolean; doorX: number | null } {
    const pending = this.eliteRooms.find((room) => !room.state().done);
    const room = pending ?? this.eliteRooms[this.eliteRooms.length - 1];
    return room ? room.state() : { armed: false, done: true, doorX: null };
  }

  // e2e 鉤子：跳至魔王關直達魔王戰。
  skipToBoss(): void {
    if (this.scene.isActive()) this.restartWith({ levelId: 4 });
  }

  // e2e 鉤子（§54）：以正式傷害管線對魔王結算傷害（階段轉換/死亡走完整 FSM 事件流）。
  damageBoss(amount: number): void {
    if (this.scene.isActive()) this.boss.applyDamage(amount);
  }

  // e2e 鉤子（§83 v11 觀察項收尾）：帶命中座標的精確傷害——皇冠 ×2／雙子受擊側可驗。
  damageBossAtPoint(amount: number, x: number, y: number): void {
    if (this.scene.isActive()) this.damageBossAt(amount, x, y);
  }

  // e2e 觀測點（§83）：魔王 FSM 階段/招式（品種未實作回 null）。
  bossDebugState(): { phase: string; state: string } | null {
    return this.boss.getDebugState?.() ?? null;
  }

  // e2e 鉤子（§83）：受控無敵窗——自然循環觀測案存活用（僅測試環境掛載）。
  grantInvuln(ms: number): void {
    if (this.scene.isActive()) this.player.grantInvulnerability(ms);
  }

  // e2e 鉤子：直達任一關（各關反卡關走查用）。
  gotoLevel(levelId: LevelId): void {
    if (this.scene.isActive()) this.restartWith({ levelId });
  }

  // e2e 觀測點（§71）：潮汐水位與相位；無潮汐關回 null。
  tideState(): { waterY: number; phase: string } | null {
    if (!this.tide) return null;
    return { waterY: Math.round(this.tide.waterY()), phase: this.tide.phase() };
  }

  // 暫停選單「重新開始」（§35）：重置當前關卡全狀態（血量/彈藥/擊殺/計時/實體由
  // create 重建），保留本輪死亡數。
  restartCurrentLevel(): void {
    this.restartWith({
      levelId: this.currentLevelId,
      deaths: this.deaths,
    });
  }

  private restartWith(data: GameSceneData): void {
    this.scene.restart(data);
  }

  // 低幀率沉地防護（§45 已知引擎行為：極端掉幀下重力穿透地面分離）：主地面全寬無坑洞
  //（§26），玩家軀體「完整」沒入地面帶即回貼地表——正常著地（腳底=地面頂）永不觸發，
  // 不取代既有碰撞與掃掠守門。
  private clampAboveGround(): void {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.top <= GROUND_TOP + 2 || body.velocity.y < 0) return;
    const { x: vx } = body.velocity;
    const lift = body.bottom - GROUND_TOP;
    body.reset(this.player.sprite.x, this.player.sprite.y - lift);
    body.setVelocity(vx, 0);
  }

  // 世界有效寬（§28）：捲軸關讀關卡資料；boss 關 = 前室寬＋當前視寬（854–1200 動態）。
  private worldWidth(): number {
    if (!this.level.boss) return this.level.worldWidth;
    return this.scale.width + (this.level.anteroomPx ?? 0);
  }

  // arena 左緣（§69）：前室魔王關的 arena 自前室右緣起算；其餘關恆 0。
  private arenaLeft(): number {
    return this.level.boss ? (this.level.anteroomPx ?? 0) : 0;
  }

  // 糖漿潮汐逐幀結算（§71）：水位推進＋浸水傷害/強緩速/上推（anti-softlock 永不吸底）。
  // 接觸傷害走 damagePlayer 單一入口（i-frame/護盾泡自然生效）。
  private advanceTide(deltaMs: number): void {
    if (!this.tide) return;
    this.tide.update(deltaMs);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!this.tide.isSubmerged(body.bottom)) return;
    this.damagePlayer(TIDE.contactDamage, this.player.sprite.x);
    const soaked = tideSoakVelocity(body.velocity.x, body.velocity.y);
    body.setVelocity(soaked.vx, soaked.vy);
  }

  // 流星雨逐幀結算（§79）：波次推進委派呈現層；排除帶＝玩家縱帶＋開門後門前帶。
  private advanceMeteors(deltaMs: number): void {
    if (!this.meteor) return;
    const view = this.cameras.main.worldView;
    this.meteor.update(deltaMs, {
      viewLeft: view.x,
      viewRight: view.right,
      playerX: this.player.sprite.x,
      gateX: this.gate?.x ?? null,
    });
  }

  // e2e 觀測點（§79）：墜落中/餘燼/預警圈數量；無流星雨關回 null。
  meteorState(): { falling: number; embers: number; telegraphs: number } | null {
    return this.meteor?.state() ?? null;
  }

  // 場控魔王噴口供力（§74 Syrona）：呈現層持有幾何與相位，此處逐幀委派結算。
  private applyBossVents(deltaMs: number): void {
    if (!this.boss.getVentLift) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const lifted = this.boss.getVentLift(
      this.player.sprite.x,
      this.player.sprite.y,
      body.velocity.y,
      deltaMs,
      body.blocked.up,
    );
    if (lifted !== null) body.setVelocityY(lifted);
  }

  // 短期增益（§69）：拾取單點——同時僅存一個、後拾覆蓋；移動倍率同步注入 player。
  private applyBuff(id: BuffId): void {
    this.buff = pickupBuff(this.buff, id);
    this.buffPickups += 1;
    this.player.setBuffMoveMods(buffSpeedMul(this.buff), buffAccelMul(this.buff));
    this.flavorToast(`${BUFF_SPECS[id].nameZh}！短暫強化`);
  }

  private advanceBuff(deltaMs: number): void {
    if (this.buff.id === null) {
      this.bossRoom?.updateBuffHud(this.buff);
      return;
    }
    const result = tickBuff(this.buff, deltaMs);
    this.buff = result.state;
    if (result.expired) this.player.setBuffMoveMods(1, 1);
    this.bossRoom?.updateBuffHud(this.buff);
  }

  // 玩家受擊單一入口（§69 護盾泡）：持盾期吸收 1 次任意傷害（彈幕/接觸/hazard）後破盾；
  // 破盾走 0 傷受擊管線取得擊退＋i-frame，杜絕同一接觸下一幀連擊。
  private damagePlayer(damage: number, sourceX: number): void {
    const block = consumeShieldBlock(this.buff);
    if (block.blocked) {
      this.buff = block.state;
      this.fx.burstSmall(this.player.sprite.x, this.player.sprite.y, BUFF_SPECS.shield.tint);
      playSfx('metal');
      this.player.takeDamage(0, sourceX);
      return;
    }
    this.player.takeDamage(damage, sourceX);
  }

  // 視寬變更回呼（recon-v4 B.3）：僅更新 bounds 與佈局，禁止 setGameSize（防循環）。
  // 相機尺寸由 Phaser CameraManager 於 RESIZE 事件自動同步。
  private onScaleResize = (): void => {
    const width = this.worldWidth();
    this.physics.world.setBounds(0, 0, width, VIEW.height);
    this.cameras.main.setBounds(0, 0, width, VIEW.height);
    if (this.level.boss && this.terrainGround) {
      this.terrainGround.setPosition(width / 2, VIEW.height - GROUND_HEIGHT / 2);
      this.terrainGround.setSize(width, GROUND_HEIGHT);
      (this.terrainGround.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
  };

  private addTerrain(): {
    ground: Phaser.GameObjects.Rectangle;
    platforms: Phaser.GameObjects.Rectangle[];
  } {
    const ground = this.add.rectangle(
      this.worldWidth() / 2,
      VIEW.height - GROUND_HEIGHT / 2,
      this.worldWidth(),
      GROUND_HEIGHT,
      0xbff3e0,
      0.9,
    );
    this.physics.add.existing(ground, true);
    const platforms = this.level.platforms.map((spec) => {
      const platform = this.add.rectangle(spec.x, spec.y, spec.w, 16, 0xffd1e0, 0.95);
      this.physics.add.existing(platform, true);
      // 單向平台：僅上方著地，起跳穿越不撞頭。
      const body = platform.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      // §77：oneway 標記供 canLandOneWay 的 a/b 解析（與 stage elements 同制）。
      platform.setData('oneway', true);
      return platform;
    });
    return { ground, platforms };
  }

  // 多本體魔王（§68）：未實作 getBodies 的品種回落單本體清單。
  private bossBodies(): Phaser.Physics.Arcade.Sprite[] {
    return this.boss.getBodies?.() ?? [asSprite(this.boss.getBody())];
  }

  // 存活本體（body.enable）中最近者：準星輔助/殼化反彈/鏈電束的目標歸屬。
  private nearestBossBody(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const bodies = this.bossBodies().filter(
      (body) => (body.body as Phaser.Physics.Arcade.Body).enable,
    );
    let best = bodies[0] ?? asSprite(this.boss.getBody());
    let bestDist = Number.POSITIVE_INFINITY;
    for (const body of bodies) {
      const dist = Phaser.Math.Distance.Between(x, y, body.x, body.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = body;
      }
    }
    return best;
  }

  // 魔王受擊單一出口（§68）：具位置歸屬時走 applyDamageAt（雙子受擊側判定）。
  private damageBossAt(amount: number, x: number, y: number, source?: BossDamageSource): void {
    if (this.boss.applyDamageAt) this.boss.applyDamageAt(amount, x, y, source);
    else this.boss.applyDamage(amount, source);
  }

  private addOverlaps(): void {
    const stars = this.player.getStars();

    this.physics.add.overlap(stars, this.enemies.getGroup(), (star, enemy) => {
      const target = enemy as Phaser.GameObjects.GameObject;
      const s = asSprite(star);
      if (!s.active || !this.enemies.kindOf(target)) return;
      // 磁場星彈免傷（§59 magno field）：星彈吸附於磁殼失效，近戰/下砸路徑不受影響。
      if (this.enemies.isStarImmune(target)) {
        this.fx.burstSmall(s.x, s.y, 0x8ab0e8);
        playSfx('metal', 0.7);
        this.player.onStarHit(s, 'absorb');
        return;
      }
      // 鏡面反射（§59 mirri mirror）：星彈改生成朝玩家的反射彈（反射彈有傷害）。
      if (this.enemies.isReflective(target)) {
        const mirri = asSprite(enemy);
        this.enemies.reflectStar(mirri.x, mirri.y, this.player.sprite.x, this.player.sprite.y);
        this.fx.burstSmall(s.x, s.y, 0xf0f4ff);
        this.player.onStarHit(s, 'absorb');
        return;
      }
      const spec = this.starSpecOf(s);
      const outcome = this.enemies.damage(target, this.starDamageOf(s));
      if (outcome === 'ignored') return;
      if (spec.aoeRadiusPx > 0) this.explodeStar(s.x, s.y, spec, target);
      // 雷鏈星（§40）：命中後跳電至半徑內最近敵，主目標排除。
      if (spec.chainCount > 0) this.chainLightning(s.x, s.y, spec, target);
      // 孢子星（§53）：命中未死目標套緩速＋輕持續傷。
      if (spec.slowMs > 0 && outcome === 'hurt') {
        this.enemies.applySlow(target, spec.slowMs, spec.dotDamage);
      }
      // 凝光星（§46）：命中處生成凍結光域。
      const mix = this.starMixOf(s);
      if (mix && mix.freezeRadiusPx > 0) this.freezeField(s.x, s.y, mix);
      // 未死目標（chompy 扣血）吃掉星彈；擊殺則依穿透續飛。
      // 迴旋星（§53）：命中不吸收——依穿透結算，保留回程判定。
      this.player.onStarHit(s, outcome === 'killed' || spec.boomerang ? 'pierce' : 'absorb');
    });

    // group vs sprite 的回調參數順序不保證，取非魔王側為星彈。
    // 入場動畫與死亡演出期間（非 active）星彈直接穿過，不消耗。
    // 多本體（§68）：逐本體接線，受擊側由 damageBossAt 依命中位置歸屬。
    for (const hitBody of this.bossBodies()) {
      this.physics.add.overlap(stars, hitBody, (a, b) => {
        const star = asSprite((a as unknown) === (hitBody as unknown) ? b : a);
        if (!star.active || !this.boss.isActive()) return;
        if (!(hitBody.body as Phaser.Physics.Arcade.Body).enable) return;
        const spec = this.starSpecOf(star);
        if (spec.aoeRadiusPx > 0) this.explodeStar(star.x, star.y, spec, null);
        // 雷鏈星命中魔王同樣跳電波及補給小怪（§40 群戰原型）。
        if (spec.chainCount > 0) this.chainLightning(star.x, star.y, spec, null);
        const mix = this.starMixOf(star);
        if (mix && mix.freezeRadiusPx > 0) this.freezeField(star.x, star.y, mix);
        this.player.onStarHit(star, 'absorb');
        this.damageBossAt(this.starDamageOf(star), star.x, star.y);
      });
    }

    // 碎晶盾（§68 P3）：可擊破的星彈屏障——星彈被吸收、盾即碎裂。
    const shields = this.boss.getShields?.();
    if (shields) {
      this.physics.add.overlap(stars, shields, (a, b) => {
        const isShield = (shields.getChildren() as unknown[]).includes(a);
        const shard = asSprite(isShield ? a : b);
        const star = asSprite(isShield ? b : a);
        if (!star.active || !shard.active) return;
        shard.disableBody(true, true);
        this.fx.burstSmall(shard.x, shard.y, 0xe8dcff);
        playSfx('break', 0.7);
        this.player.onStarHit(star, 'absorb');
      });
    }

    // 新怪危險物：puffy 爆刺彈與 chompy 咬合 hitbox（傷害 1，命中即失效）。
    // zappy 放電環（§30）同走此 hazards 管線結算，不另設 overlap。
    this.physics.add.overlap(this.player.sprite, this.enemies.getHazards(), (_p, hz) => {
      const hazard = asSprite(hz);
      if (!hazard.active || this.finished || this.transitioning) return;
      hazard.disableBody(true, true);
      this.damagePlayer(ENEMY.touchDamage, hazard.x);
    });

    this.physics.add.overlap(this.player.sprite, this.enemies.getGroup(), (_p, enemy) => {
      const kind = this.enemies.kindOf(enemy as Phaser.GameObjects.GameObject);
      if (!kind || this.finished || this.transitioning) return;
      // 半入地無害態（§47 drilly 潛地/前搖）：不結算觸碰傷害。
      if (this.enemies.isPhasedOut(enemy as Phaser.GameObjects.GameObject)) return;
      const target = asSprite(enemy);
      // 雷化帶電體（§57）：接觸對小怪放電（damage CD 節流），玩家觸碰傷害照常結算。
      const contactDamage = this.playerFormSpec()?.contactDamage ?? 0;
      if (contactDamage > 0) {
        const zapped = this.enemies.damage(enemy as Phaser.GameObjects.GameObject, contactDamage);
        if (zapped !== 'ignored') this.fx.burstSmall(target.x, target.y, TRANSFORM_FORMS.volt.tint);
        if (zapped === 'killed') return;
      }
      // 吸入錐形內的可吸怪（§30：shelly 僅暈眩窗）交由吞下流程，不結算觸碰傷害。
      const { x, y } = this.player.sprite;
      if (
        this.player.isInhaling() &&
        this.enemies.isInhalable(enemy as Phaser.GameObjects.GameObject) &&
        isInInhaleRange(x, y, this.player.getFacing(), target.x, target.y, INHALE.rangePx)
      ) {
        return;
      }
      // 吸入接觸豁免（§77）：被吸入中（拉力豁免窗內）的怪貼身不傷——涵蓋轉向/
      // 鬆開瞬間與出錐殘餘飛行；窗過期即恢復傷害性，未被吸的其他怪照常結算。
      if (isContactHarmless(this.time.now, (target.getData('inhaleGraceUntil') as number) ?? 0)) {
        return;
      }
      this.damagePlayer(ENEMY.touchDamage, target.x);
    });

    this.physics.add.overlap(this.player.getInhaleZone(), this.enemies.getGroup(), (_z, enemy) => {
      asSprite(enemy).setData('inhalePull', true);
    });

    // 觸碰與頭頂 hit window（§58/§68）：多本體逐一接線，停用本體不結算；
    // 入場運鏡期（非 active）傷害雙向靜默——降落中的魔王不得對走位玩家先手。
    for (const touchBody of this.bossBodies()) {
      this.physics.add.overlap(this.player.sprite, touchBody, () => {
        if (this.finished || this.transitioning || this.bossDown) return;
        if (!this.boss.isActive()) return;
        if (!(touchBody.body as Phaser.Physics.Arcade.Body).enable) return;
        const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        // 魔王頭頂 hit window（§58）：下砸命中上半身＝頭頂——嘗試觸發暈眩並回彈，免體傷。
        if (this.player.isSlamming() && playerBody.bottom <= touchBody.y) {
          const stunned = this.boss.trySlamStun();
          this.player.onSlamBounce();
          this.fx.burstSmall(this.player.sprite.x, playerBody.bottom, 0xffd966);
          if (stunned) this.fx.shake(8);
          return;
        }
        this.damagePlayer(this.bossTouchDamage, touchBody.x);
      });
    }

    this.physics.add.overlap(this.player.sprite, this.boss.getProjectiles(), (_p, ball) => {
      const projectile = asSprite(ball);
      if (!projectile.active || this.finished || this.transitioning) return;
      if (projectile.getData('reflected') === true) return;
      // 殼化反彈（§57/§58）：彈幕不傷身，反向射回最近存活本體（§68 多本體）。
      if (this.playerFormSpec()?.reflectProjectiles) {
        projectile.setData('reflected', true);
        projectile.setTint(TRANSFORM_FORMS.shell.tint);
        (projectile.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        const boss = this.nearestBossBody(projectile.x, projectile.y);
        this.physics.moveTo(projectile, boss.x, boss.y, SHELL_REFLECT.speed);
        playSfx('metal');
        return;
      }
      projectile.disableBody(true, true);
      this.damagePlayer(this.bossTouchDamage, projectile.x);
    });

    // 反彈彈幕回傷（§57/§58）：僅帶反彈標記的彈體對魔王結算（§68 多本體逐一接線）。
    for (const reflectBody of this.bossBodies()) {
      this.physics.add.overlap(reflectBody, this.boss.getProjectiles(), (a, b) => {
        const projectile = asSprite((a as unknown) === (reflectBody as unknown) ? b : a);
        if (!projectile.active || projectile.getData('reflected') !== true) return;
        if (!this.boss.isActive() || !(reflectBody.body as Phaser.Physics.Arcade.Body).enable) {
          return;
        }
        projectile.disableBody(true, true);
        this.fx.burstSmall(projectile.x, projectile.y, TRANSFORM_FORMS.shell.tint);
        this.damageBossAt(SHELL_REFLECT.damage, projectile.x, projectile.y, 'reflect');
      });
    }

    this.physics.add.overlap(this.player.sprite, this.boss.getShockwaves(), (_p, wave) => {
      const shockwave = asSprite(wave);
      if (!shockwave.active || this.finished || this.transitioning) return;
      this.damagePlayer(this.bossTouchDamage, shockwave.x);
    });

    // 流星雨（§79）：隕星可被星彈擊碎（碎裂演出、星彈吸收）；隕星與餘燼命中玩家
    // 走 damagePlayer 單一入口（i-frame/護盾泡自然生效），隕星命中即碎。
    if (this.meteor) {
      const meteorGroup = this.meteor.getMeteors();
      this.physics.add.overlap(stars, meteorGroup, (a, b) => {
        const isRock = (meteorGroup.getChildren() as unknown[]).includes(a);
        const rock = asSprite(isRock ? a : b);
        const star = asSprite(isRock ? b : a);
        if (!star.active || !rock.active) return;
        this.meteor?.shatter(rock);
        this.player.onStarHit(star, 'absorb');
      });
      this.physics.add.overlap(this.player.sprite, meteorGroup, (_p, rock) => {
        const sprite = asSprite(rock);
        if (!sprite.active || this.finished || this.transitioning) return;
        this.meteor?.shatter(sprite);
        this.damagePlayer(ENEMY.touchDamage, sprite.x);
      });
      this.physics.add.overlap(this.player.sprite, this.meteor.getEmbers(), (_p, hz) => {
        const ember = asSprite(hz);
        if (!ember.active || this.finished || this.transitioning) return;
        ember.disableBody(true, true);
        this.damagePlayer(ENEMY.touchDamage, ember.x);
      });
    }

    // v4 平台元素（§29）：單向自上著地、移動平台載運、磚體實心；彈簧與破磚交由 stage 結算。
    this.physics.add.collider(
      this.player.sprite,
      this.stage.getOneWay(),
      undefined,
      this.stage.canLandOneWay,
    );
    this.physics.add.collider(this.player.sprite, this.stage.getMoving());
    this.physics.add.collider(this.player.sprite, this.stage.getBreakables());
    this.physics.add.overlap(
      this.player.sprite,
      this.stage.getSprings(),
      this.stage.onSpringOverlap,
    );
    this.physics.add.overlap(stars, this.stage.getBreakables(), (a, b) => {
      const brick = (this.stage.getBreakables() as unknown[]).includes(a) ? a : b;
      const star = asSprite(brick === a ? b : a);
      if (!star.active) return;
      if (this.stage.breakBrick(brick as Phaser.GameObjects.GameObject)) {
        this.player.onStarHit(star, 'absorb');
      }
    });
  }

  private bindEvents(): void {
    const bind = <K extends GameEventName>(
      event: K,
      handler: Parameters<typeof onGameEvent<K>>[2],
    ): void => {
      onGameEvent(this.events, event, handler);
      this.unbinders.push(() => offGameEvent(this.events, event, handler));
    };

    bind(GameEvents.PLAYER_DAMAGED, ({ hp }) => {
      this.playerHp = hp;
    });
    bind(GameEvents.PLAYER_HEALED, ({ hp }) => {
      this.playerHp = hp;
    });
    // 星味首遇提示（§46/§47）：新取得的味/配方必經頂槽，首見即 toast 一次。
    bind(GameEvents.AMMO_CHANGED, ({ magazine }) => {
      const top = magazine[magazine.length - 1];
      if (!top || top.gold) return;
      const key = top.mix ?? top.flavor;
      if (seenFlavorHints.has(key)) return;
      seenFlavorHints.add(key);
      this.flavorToast(top.mix !== undefined ? MIX_HINTS[top.mix] : FLAVOR_HINTS[top.flavor]);
    });
    // 技能世界結算（§23）：player 只發事件，場上效果集中於 GameScene。
    bind(GameEvents.SKILL_STARSTORM, () => this.resolveStarstorm());
    // 下衝擊落點同步破磚（§29）：磚的 damage 接口由 stage 提供，沿用既有 SKILL 事件契約。
    bind(GameEvents.SKILL_SLAM_LANDED, ({ x, y }) => {
      this.resolveSlamImpact(x, y);
      this.stage.damageBricksInRadius(x, y, this.slamRadiusPx());
    });
    // 殼盾格擋成功（§40）：正面反擊星爆，波及面前小怪。
    bind(GameEvents.SKILL_SHIELD_BLOCK, ({ x, y, facing }) =>
      this.resolveShieldCounter(x, y, facing),
    );
    // 星化形態技（§57）：雷化鏈電束／風化落地衝擊由 player 發事件、此處結算世界效果。
    bind(GameEvents.SKILL_TRANSFORM_STRIKE, ({ kind, x, y, facing }) => {
      if (kind === 'volt-beam') this.resolveVoltBeam(x, y, facing);
      else this.resolveGaleLanding(x, y);
    });
    bind(GameEvents.BOSS_SPAWNED, ({ maxHp }) => {
      this.bossHp = maxHp;
    });
    bind(GameEvents.BOSS_DAMAGED, ({ hp }) => {
      this.bossHp = hp;
      if (this.bossActiveAt >= 0) {
        this.feedEggs({ kind: 'boss-hit', sinceActiveMs: this.time.now - this.bossActiveAt });
      }
    });
    // P3 進場演出（§30）：星環衝擊波由 boss 系統呈現，時停以既有 fx API 組合。
    // 高風險位增益投放（§69/§82）：arena 中央高位刷 1 顆；EX 刷新減半＝不投放；
    // 投放階段資料驅動（缺省 P2；Voidra P2 為生存段改 P3）。
    bind(GameEvents.BOSS_PHASE, ({ phase }) => {
      if (phase === 'p3') this.fx.hitStop(P3_HITSTOP_MS);
      const buffPhase = this.level.arenaBuffPhase ?? 'p2';
      if (phase === buffPhase && !this.exMode && this.level.arenaBuff && this.bossRoom) {
        this.bossRoom.dropArenaBuff(
          this.level.arenaBuff,
          this.arenaLeft() + this.scale.width / 2,
          190,
        );
      }
    });
    bind(GameEvents.BOSS_QUAKE, () => this.resolveBossQuake());
    // 彩蛋事件餵送（§24）：吞噬歷史與魔王首擊時間窗。
    bind(GameEvents.ENEMY_INHALED, ({ kind }) => {
      const flavor = inhaleFlavor(kind);
      if (flavor) this.feedEggs({ kind: 'swallow', flavor });
    });
    // 敗北語意：走動關死亡重試當前關（卡點關越過中點改自 checkpoint 重生，§67）；
    // 魔王戰死亡進敗北結算（再玩一次直接重試魔王關）。
    bind(GameEvents.PLAYER_DIED, ({ x, y }) => {
      // 勝利結算窗防護（§82 QA 根修）：魔王已倒後殘餘 hazard（隕星/潮汐）不得奪走勝利。
      if (this.bossDown) return;
      this.deaths += 1;
      this.player.sprite.setVisible(false);
      this.fx.puff(x, y);
      if (this.level.boss) {
        // 段起點重試（§82 Voidra）：P2/P3 死亡不回滾整場（呈現層已自清＋FSM 重置）。
        if (this.boss.trySegmentRespawn?.() === true) {
          this.clearFieldForSegmentRetry();
          this.respawnAtCheckpoint(this.arenaLeft() + 90);
          return;
        }
        this.finish('lost');
        return;
      }
      const respawnX = checkpointRespawnX(this.level, this.farthestX);
      if (respawnX !== null) this.respawnAtCheckpoint(respawnX);
      else this.retryLevel();
    });
    bind(GameEvents.BOSS_DEFEATED, () => {
      this.bossDown = true;
      this.bossHp = 0;
      // 勝利結算窗防護（§82）：殘餘環境傷害（墜落中隕星/餘燼/潮汐）不再扣血。
      this.player.grantInvulnerability(WIN_DELAY_MS + 2000);
      // 通關計時單一來源（審查修復 #724）：擊破瞬間擷取用時，存檔與結算共用，
      // 避免 WIN_DELAY_MS 演出期使結算成績比地圖最佳時間多 1.5s。
      this.clearTimeMs = this.levelTimeMs();
      // EX 擊破（§58）：僅記 exCleared 紀念星章，不動一般通關與最佳時間。
      if (this.exMode) persistSave(recordExClear(this.save, this.currentLevelId));
      else persistSave(recordLevelClear(this.save, this.currentLevelId, this.clearTimeMs));
      this.time.delayedCall(WIN_DELAY_MS, () => this.finish('won'));
    });
    bind(GameEvents.LEVEL_GATE_OPENED, () => this.spawnGate());
  }

  // 死亡重試當前關：已完成關卡的累計用時保留，當前關計時重來。
  private retryLevel(): void {
    if (this.finished || this.transitioning) return;
    this.transitioning = true;
    stopSfx('inhale');
    this.fx.stopInhale();
    playSfx('lose');
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).stop();
    this.time.delayedCall(RETRY_DELAY_MS, () =>
      this.restartWith({
        levelId: this.currentLevelId,
        deaths: this.deaths,
      }),
    );
  }

  // 卡點關中點重生（§67）：不重啟場景——killCount／彩蛋進度／計時全數保留，
  // 血量回滿基礎值、慈悲補血每命狀態重置，死亡 i-frame 覆蓋落地瞬間。
  private respawnAtCheckpoint(respawnX: number): void {
    if (this.finished || this.transitioning) return;
    this.transitioning = true;
    stopSfx('inhale');
    this.fx.stopInhale();
    playSfx('lose');
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    this.time.delayedCall(RETRY_DELAY_MS, () => {
      body.reset(respawnX, GROUND_TOP - 40);
      this.player.sprite.setVisible(true);
      this.player.heal(PLAYER.maxHp, PLAYER.maxHp);
      // 落地護體顯式重授（審查修復）：不依賴致死當下殘餘 i-frame，重生窗恆為完整時長。
      this.player.grantInvulnerability(PLAYER.invulnerableMs);
      this.mercy = createMercyState();
      this.prevPlayerX = respawnX;
      this.fx.burstSmall(respawnX, GROUND_TOP - 40, 0x9fe8ff);
      playSfx('reveal');
      this.transitioning = false;
    });
  }

  // 星星門：fx-star 放大 + 光暈脈動 + 浮動 tween（graphics 組合，不新增美術）。
  private spawnGate(): void {
    if (this.gate || this.level.boss || this.finished || this.transitioning) return;
    const gx = this.worldWidth() - GATE_MARGIN_X;
    const glow = this.add.image(0, 0, 'fx-star').setDisplaySize(150, 150).setAlpha(0.35);
    const core = this.add.image(0, 0, 'fx-star').setDisplaySize(96, 96);
    const gate = this.add.container(gx, GATE_Y, [glow, core]);
    gate.setScale(0);
    this.gate = gate;
    this.tweens.add({ targets: gate, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: glow,
      scale: glow.scale * 1.25,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: gate,
      y: GATE_Y - 14,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const zone = this.add.zone(gx, GATE_Y, GATE_ZONE_W, GATE_ZONE_H);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player.sprite, zone, () => this.completeLevel());
    this.gateRect = {
      left: gx - GATE_ZONE_W / 2,
      right: gx + GATE_ZONE_W / 2,
      top: GATE_Y - GATE_ZONE_H / 2,
      bottom: GATE_Y + GATE_ZONE_H / 2,
    };
    this.prevPlayerX = this.player.sprite.x;
    // 門生在身後（§43）：開門瞬間玩家已在門區內或門心右側（右緣紮營），直接判入門。
    if (this.playerCrossedGate(this.prevPlayerX)) this.completeLevel();
  }

  // 星星門必達背擋（§26/§43）：門 overlap 為 direct pair，Phaser 4 實測間歇漏檢——
  // 逐幀以 crossedGate 幾何判定補判（跨門心/站門心右側/AABB 交疊），不得移除。
  private syncGateSweep(): void {
    if (!this.gate) return;
    const x = this.player.sprite.x;
    const crossed = this.playerCrossedGate(this.prevPlayerX);
    this.prevPlayerX = x;
    if (crossed) this.completeLevel();
  }

  private playerCrossedGate(prevX: number): boolean {
    if (!this.gate || !this.gateRect) return false;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    return crossedGate(
      prevX,
      this.player.sprite.x,
      this.gate.x,
      { left: body.left, right: body.right, top: body.top, bottom: body.bottom },
      this.gateRect,
    );
  }

  // 過關演出（§39）：玩家縮小旋轉飛入門 → 寫入存檔 → 世界地圖（揭霧下一關節點）。
  private completeLevel(): void {
    if (this.finished || this.transitioning || !this.gate) return;
    this.transitioning = true;
    stopSfx('inhale');
    this.fx.stopInhale();
    playSfx('swallow');
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    // 存檔寫入時機（§38）：通關即記錄，演出中斷（切頁/重載）不掉進度。
    persistSave(recordLevelClear(this.save, this.currentLevelId, this.levelTimeMs()));
    this.tweens.add({
      targets: this.player.sprite,
      x: this.gate.x,
      y: this.gate.y,
      scale: 0,
      angle: 720,
      duration: GATE_ABSORB_MS,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.fx.starBurst(this.gate?.x ?? this.player.sprite.x, this.gate?.y ?? GATE_Y);
        playSfx('win');
        this.time.delayedCall(MAP_ENTER_DELAY_MS, () =>
          this.scene.start(SceneKeys.Map, { reveal: nextLevelId(this.currentLevelId) }),
        );
      },
    });
  }

  // 當前關卡淨用時：死亡重試會重置 startedAt，等同本次成功嘗試的用時。
  private levelTimeMs(): number {
    return this.time.now - this.startedAt;
  }

  // 慈悲補血（§62）：每 5s 評估低血久戰保底；一般關與魔王關（含 EX）皆啟用。
  private advanceMercy(deltaMs: number): void {
    const result = advanceMercyHeal(this.mercy, {
      deltaMs,
      elapsedMs: this.levelTimeMs() + this.mercyWarpMs,
      hp: this.playerHp,
      maxHp: PLAYER.maxHp,
      rng: this.mercyRng,
      bossRoom: this.level.boss !== null,
    });
    this.mercy = result.state;
    if (result.spawn) this.spawnMercyHeart();
  }

  // 愛心生成（§62）：隨機空中緩降型或地面定點型；落點沿地面錨點、夾限世界內必可達。
  private spawnMercyHeart(): void {
    const side = this.mercyRng() < 0.5 ? -1 : 1;
    const offset = 120 + this.mercyRng() * 120;
    // 夾限下界 50：玩家貼世界左牆（hurtbox 右緣 ~31）時拾取帶仍可觸及（anti-softlock）。
    // 前室魔王關（§69）：入 arena 後單向門鎖閉，錨點下界改 arena 左緣防落於門後。
    const minX =
      this.bossRoom?.entered() === true && this.player.sprite.x >= this.arenaLeft()
        ? this.arenaLeft() + 50
        : 50;
    const x = Phaser.Math.Clamp(this.player.sprite.x + side * offset, minX, this.worldWidth() - 50);
    const groundY = GROUND_TOP - 22;
    const airborne = this.mercyRng() >= 0.5;
    const y = airborne ? 150 : groundY;
    playSfx('reveal');
    this.fx.burstSmall(x, y, 0xff9ec4);
    spawnHealPickup(
      this,
      x,
      y,
      { player: () => this.player, playerHp: () => this.playerHp },
      { healHp: MERCY_HEAL.healHp, ...(airborne ? { driftToY: groundY } : {}) },
    );
  }

  // e2e 鉤子（§62）：時間快轉＋RNG 固定必中，供慈悲補血守門案觸發。
  mercyWarp(ms: number): void {
    if (!this.scene.isActive()) return;
    this.mercyWarpMs += ms;
    this.mercyRng = () => 0;
  }

  // e2e 鉤子（§62）：以正式受擊管線壓低血量（i-frame 期間自然免傷，呼叫端輪詢）。
  hurtPlayer(damage: number): void {
    if (this.scene.isActive()) this.player.takeDamage(damage, this.player.sprite.x + 1);
  }

  // e2e 觀測點（§62）：本命累計愛心生成數。
  mercySpawnedCount(): number {
    return this.mercy.spawned;
  }

  // e2e 觀測點（§69）：當前短期增益狀態與本局累計拾取數。
  buffState(): { id: string | null; remainingMs: number; pickups: number } {
    return { id: this.buff.id, remainingMs: this.buff.remainingMs, pickups: this.buffPickups };
  }

  // e2e 觀測點（§54 難度 bot）：魔王本體與彈幕群（座標/迴避取樣用）。
  bossBody(): Phaser.GameObjects.GameObject {
    return this.boss.getBody();
  }

  // e2e 觀測點（§68 多本體）：全部存活本體座標（雙子迴避取樣用）。
  bossBodyPositions(): { x: number; y: number }[] {
    return this.bossBodies()
      .filter((body) => (body.body as Phaser.Physics.Arcade.Body).enable)
      .map((body) => ({ x: body.x, y: body.y }));
  }

  bossProjectiles(): Phaser.Physics.Arcade.Group {
    return this.boss.getProjectiles();
  }

  private finish(result: 'won' | 'lost'): void {
    if (this.finished) return;
    this.finished = true;
    this.fx.stopInhale();
    stopSfx('inhale');
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).stop();
    const timeMs = this.clearTimeMs ?? this.levelTimeMs();
    emitGameEvent(this.events, result === 'won' ? GameEvents.GAME_WON : GameEvents.GAME_LOST, {
      timeMs,
    });
    const data: GameResultData = {
      result,
      timeMs,
      deaths: this.deaths,
      levelId: this.currentLevelId,
    };
    // 謝幕（§84）：全破最終魔王關（鏈末魔王關，資料驅動非硬編關號）先播星光復甦再結算。
    const finale =
      result === 'won' && this.level.boss !== null && nextLevelId(this.currentLevelId) === null;
    this.time.delayedCall(result === 'won' ? 1300 : 900, () =>
      this.scene.start(finale ? SceneKeys.Credits : SceneKeys.Result, data),
    );
  }

  // 魔王每損 10 HP 補生可吸小怪（供彈藥），arena 左右邊緣交替入場；品種輪替讀關卡 enemyMix。
  // 場上上限（§82 審查根修）：爆發傷害連觸多次掉落時夾限累積（waves 上限 +2 供給裕度），
  // 防補給怪堆積形成接觸傷害牆；彈藥保證由飢荒立即補生承擔（§26）。
  private spawnBossMinion(): void {
    if (this.enemies.aliveCount() >= this.level.maxOnScreen + 2) return;
    const kinds = this.level.enemyMix.map((entry) => entry.kind);
    const kind = kinds[this.minionDropCount % kinds.length] ?? 'jelly';
    const x =
      this.minionDropCount % 2 === 0
        ? this.arenaLeft() + SPAWN_EDGE_X
        : this.worldWidth() - SPAWN_EDGE_X;
    this.minionDropCount += 1;
    this.enemies.spawn(kind, x, kind === 'floaty' || kind === 'gusty' ? SPAWN_AIR_Y : SPAWN_DROP_Y);
  }

  // 魔王召喚小怪（§54 P2 floaty／§68 P2 mirri／§74 P2 bubbla）：依場上現量夾限至 cap，
  // 走正式 spawn 管線；召喚路徑同套潮汐生成調整（交叉不變式 13/17，審查修復）。
  private summonMinion(kind: EnemyKind, cap: number): void {
    let alive = 0;
    for (const child of this.enemies.getGroup().getChildren()) {
      if (child.active && this.enemies.kindOf(child) === kind) alive += 1;
    }
    for (let i = 0; i < cap - alive; i += 1) {
      const x = i % 2 === 0 ? this.arenaLeft() + SPAWN_EDGE_X : this.worldWidth() - SPAWN_EDGE_X;
      const defaultY = kind === 'floaty' ? SPAWN_AIR_Y : SPAWN_DROP_Y;
      const adjusted = this.tide
        ? { kind: this.tide.filterSpawnKind(kind), y: this.tide.adjustSpawnY(defaultY) }
        : { kind, y: defaultY };
      this.enemies.spawn(adjusted.kind, x, adjusted.y);
    }
  }

  // 魔王品種工廠（§54）：BossKind 唯一分派點（呈現層 handle＋體傷常數一次取齊）；
  // 新增品種未接線將於編譯期 never 守衛失敗。
  private buildBoss(kind: BossKind): { handle: BossHandle; bodyDamage: number } {
    switch (kind) {
      case 'jellord':
        return {
          handle: createBoss(this, {
            ex: this.exMode,
            // EX 擊破分裂（§58）：於魔王位置生成小果凍，走正式 spawn 管線。
            onSplit: (x, y, count) => {
              for (let i = 0; i < count; i += 1) {
                this.enemies.spawn('jelly', x + (i - (count - 1) / 2) * 46, y - 20);
              }
            },
          }),
          bodyDamage: BOSS.bodyDamage,
        };
      case 'noctra':
        return {
          handle: createNoctra(
            this,
            { summonFloaty: (cap) => this.summonMinion('floaty', cap) },
            { ex: this.exMode },
          ),
          bodyDamage: NOCTRA.bodyDamage,
        };
      case 'prismix':
        return {
          handle: createPrismix(
            this,
            {
              summonMirri: (cap) => this.summonMinion('mirri', cap),
              // 雙子連破（§68/§70）：FSM 單一真值，GameScene 餵彩蛋＋全屏稜光演出。
              onTwinFinish: () => {
                this.feedEggs({ kind: 'twin-finish' });
                this.cameras.main.flash(360, 220, 200, 255);
                this.fx.starBurst(this.arenaLeft() + this.scale.width / 2, VIEW.height / 2 - 40);
              },
            },
            { ex: this.exMode, arenaLeft: () => this.arenaLeft() },
          ),
          bodyDamage: PRISMIX.bodyDamage,
        };
      case 'syrona':
        return {
          handle: createSyrona(
            this,
            {
              summonBubbla: (cap) => this.summonMinion('bubbla', cap),
              // 窯風三連（§75）：呈現層單一真值，GameScene 餵彩蛋＋窯火謝幕演出。
              onVentEgg: () => {
                this.feedEggs({ kind: 'vent-hit-count' });
                this.cameras.main.flash(320, 255, 214, 140);
                this.fx.starBurst(this.arenaLeft() + this.scale.width / 2, VIEW.height / 2 - 40);
              },
              // 場控潮汐（§74）：沿 GameScene 單一潮汐管線（浸水/生成過濾自然生效）。
              startTide: (spec) => {
                this.tide?.destroy();
                this.tide = createTide(this, spec, this.worldWidth());
              },
              boilTide: (spec) => this.tide?.setSpec(spec),
            },
            { ex: this.exMode, arenaLeft: () => this.arenaLeft() },
          ),
          bodyDamage: SYRONA.bodyDamage,
        };
      case 'voidra':
        return {
          handle: createVoidra(
            this,
            {
              // 星核共鳴（§83）：FSM 單一真值，GameScene 餵彩蛋＋星雨謝幕演出。
              onShardEgg: () => {
                this.feedEggs({ kind: 'survive-collect' });
                this.cameras.main.flash(360, 255, 230, 160);
                this.fx.starBurst(this.arenaLeft() + this.scale.width / 2, VIEW.height / 2 - 40);
              },
              // P2 定點轟炸（§82）：沿 GameScene 單一 meteor 管線開關與調參；
              // 收轟炸（轉段/擊破/段重試）連飛行中隕星一併回收（審查收斂）。
              setBombardment: (spec) => {
                if (spec) {
                  this.meteor?.setSpec(spec);
                  this.meteor?.setActive(true);
                } else {
                  this.meteor?.setActive(false);
                  this.meteor?.clearAirborne();
                }
              },
              // P3 低重力（§81）：全域重力直寫；null 回關卡預設（create 亦會重設）。
              setGravityScale: (scale) => {
                this.physics.world.gravity.y = GRAVITY_Y * (scale ?? this.level.gravityScale ?? 1);
              },
              // P2 段內固定愛心（§6.3 保底）：走既有 heal pickup 管線、緩降至地面帶。
              dropSurvivalHeart: () => {
                const x = this.arenaLeft() + this.scale.width * 0.3;
                playSfx('reveal');
                this.fx.burstSmall(x, 150, 0xff9ec4);
                spawnHealPickup(
                  this,
                  x,
                  150,
                  { player: () => this.player, playerHp: () => this.playerHp },
                  { healHp: MERCY_HEAL.healHp, driftToY: GROUND_TOP - 22 },
                );
              },
            },
            { ex: this.exMode, arenaLeft: () => this.arenaLeft() },
          ),
          bodyDamage: VOIDRA.bodyDamage,
        };
      default: {
        const unhandled: never = kind;
        throw new Error(`未知魔王品種：${String(unhandled)}`);
      }
    }
  }

  // 跳躍/拍翅無契約事件，以速度轉變判定配音（buffer 觸發的跳躍無當幀按壓）。
  private syncJumpSfx(): void {
    const vy = (this.player.sprite.body as Phaser.Physics.Arcade.Body).velocity.y;
    if (vy !== this.prevVy) {
      if (vy === PLAYER.jumpVelocity) playSfx('jump');
      else if (vy === PLAYER.floatLift) playSfx('flap');
    }
    this.prevVy = vy;
  }

  private syncInhale(): void {
    this.mouth.x = this.player.sprite.x + this.player.getFacing() * MOUTH_OFFSET_X;
    this.mouth.y = this.player.sprite.y;
    const inhaling = this.player.isInhaling();
    if (inhaling && !this.wasInhaling) {
      this.fx.startInhale(this.mouth);
      playSfx('inhale');
    } else if (!inhaling && this.wasInhaling) {
      this.fx.stopInhale();
      stopSfx('inhale');
    }
    this.wasInhaling = inhaling;
  }

  // zone overlap 僅標記候選，錐形收斂與拉近集中於此處理。
  private applyInhalePull(): void {
    for (const child of this.enemies.getGroup().getChildren()) {
      const enemy = asSprite(child);
      if (!enemy.getData('inhalePull')) continue;
      enemy.setData('inhalePull', false);
      const kind = this.enemies.kindOf(enemy);
      if (!kind || !this.player.isInhaling()) continue;
      const { x, y } = this.player.sprite;
      const facing = this.player.getFacing();
      if (!isInInhaleRange(x, y, facing, enemy.x, enemy.y, INHALE.rangePx)) continue;
      if (!this.enemies.isInhalable(enemy)) {
        // 旋轉衝刺中的殼殼為無敵段、半入地 drilly（§47）不受吸力彈開；其餘照舊彈開。
        if (enemy.getData('state') !== 'spin' && !this.enemies.isPhasedOut(enemy)) {
          enemy.setVelocity(REPEL_SPEED * facing, REPEL_LIFT);
        }
        continue;
      }
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.mouth.x, this.mouth.y);
      if (dist <= SWALLOW_RANGE_PX) {
        this.enemies.removeInhaled(enemy);
        this.player.swallow(kind);
        continue;
      }
      // 拉力漸增：越接近嘴邊吸力越強。
      // 吸入接觸豁免（§77）：拉力逐幀刷新豁免窗，被吸入中的怪貼身零傷害。
      enemy.setData('inhaleGraceUntil', inhaleGraceUntil(this.time.now));
      this.physics.moveTo(
        enemy,
        this.mouth.x,
        this.mouth.y,
        PULL_BASE_SPEED + (INHALE.rangePx - dist) * PULL_GAIN,
      );
    }
  }

  // 彩蛋逐幀事件（§24）：世界座標與平台站立；魔王可擊打起點供時間窗計算。
  private syncEggs(): void {
    if (this.level.boss && this.bossActiveAt < 0 && this.boss.isActive()) {
      this.bossActiveAt = this.time.now;
    }
    if (this.eggProgress.every((progress) => progress.done)) return;
    this.feedEggs({ kind: 'position', x: this.player.sprite.x });
    this.feedEggs({ kind: 'stand', platformY: this.standingPlatformY() });
  }

  // 站立平台判定：腳底貼齊平台頂（rect 高 16 → 頂 = y - 8）且 x 落於平台範圍。
  private standingPlatformY(): number | null {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down && !body.touching.down) return null;
    for (const spec of this.level.platforms) {
      if (
        Math.abs(body.bottom - (spec.y - 8)) <= 4 &&
        Math.abs(this.player.sprite.x - spec.x) <= spec.w / 2 + 12
      ) {
        return spec.y;
      }
    }
    return null;
  }

  private feedEggs(event: EggEvent): void {
    this.level.easterEggs.forEach((spec, i) => {
      const progress = this.eggProgress[i];
      if (!progress || progress.done) return;
      const result = advanceEgg(spec, progress, event);
      this.eggProgress[i] = result.progress;
      if (result.triggered) this.grantEggReward(spec);
    });
  }

  // 獎勵落地（§24）：+1 HP（上限 6）／滿彈匣／金星彈／+1 HP。
  private grantEggReward(spec: EasterEggSpec): void {
    // 存檔寫入時機（§38）：彩蛋觸發即記錄（trigger 型別為關內唯一 id）。
    persistSave(recordEgg(this.save, this.currentLevelId, spec.trigger));
    switch (spec.reward) {
      case 'hp-up':
        this.player.heal(1, EGG_HP_CAP);
        this.eggCelebration('彩虹果凍 +1 HP');
        break;
      case 'full-magazine':
        this.player.grantFullMagazine();
        this.eggCelebration('星星雨！彈匣全滿');
        break;
      case 'gold-star':
        this.player.grantGoldStar();
        this.eggCelebration('金星彈入匣！');
        break;
      case 'heal':
        // 滿血時 heal 無感（player.heal 靜默略過）：fallback 改給滿彈匣，獎勵必有回饋。
        if (this.playerHp >= PLAYER.maxHp) {
          this.player.grantFullMagazine();
          this.eggCelebration('皇冠火花！彈匣全滿');
        } else {
          this.player.heal(1, PLAYER.maxHp);
          this.eggCelebration('皇冠火花 +1 HP');
        }
        break;
      default: {
        const exhaustive: never = spec.reward;
        void exhaustive;
      }
    }
  }

  // 星味首遇 toast（§46/§47）：頂部橫幅下方一行小字，淡入停留後上飄淡出。
  private flavorToast(message: string): void {
    const toast = this.add
      .text(this.scale.width / 2, this.scale.height * 0.22, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#7a5fb8',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(110)
      .setScrollFactor(0)
      .setAlpha(0);
    this.tweens.chain({
      targets: toast,
      tweens: [
        { alpha: 1, duration: 220, ease: 'Quad.easeOut' },
        { alpha: 0, y: '-=16', duration: 360, delay: 1600, ease: 'Quad.easeIn' },
      ],
      onComplete: () => toast.destroy(),
    });
  }

  // 彩蛋演出（§24）：金光 popIn + 專屬 jingle + 浮字（既有 fx 組合）。
  private eggCelebration(message: string): void {
    playSfx('jingle');
    const { y } = this.player.sprite;
    // 浮字夾限於鏡頭視野內，避免世界邊緣觸發時被裁切。
    const view = this.cameras.main.worldView;
    const x = Phaser.Math.Clamp(this.player.sprite.x, view.x + 110, view.right - 110);
    const glow = this.add
      .image(x, y, 'fx-star')
      .setDisplaySize(130, 130)
      .setTint(0xffc93c)
      .setAlpha(0)
      .setDepth(94);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.9, to: 0 },
      scale: { from: glow.scale * 0.3, to: glow.scale * 1.7 },
      duration: 750,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy(),
    });
    this.fx.starBurst(x, y - 20);
    const label = this.add
      .text(x, y - 64, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffc93c',
        stroke: '#3a3a4a',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(96);
    this.tweens.add({
      targets: label,
      y: y - 118,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private starFlavorOf(star: Phaser.Physics.Arcade.Sprite): StarFlavor {
    return (star.getData('flavor') as StarFlavor | undefined) ?? 'jelly';
  }

  // 混合星規格（§46）：發射端寫入 mix id；非混合彈回 null。
  private starMixOf(star: Phaser.Physics.Arcade.Sprite): StarMixSpec | null {
    const id = star.getData('mix') as MixId | null | undefined;
    return id ? getMix(id) : null;
  }

  // 彈道有效規格單一出口（§46）：混合彈讀配方表，其餘讀屬性表。
  private starSpecOf(star: Phaser.Physics.Arcade.Sprite): StarFlavorSpec {
    return this.starMixOf(star) ?? STAR_FLAVORS[this.starFlavorOf(star)];
  }

  // 星彈傷害（§23/§69）：發射端已依槽位（強化 ×1.6 / 金星 20）寫入；星力果倍率結算端疊乘。
  private starDamageOf(star: Phaser.Physics.Arcade.Sprite): number {
    const base = (star.getData('damage') as number | undefined) ?? this.starSpecOf(star).damage;
    return base * buffDamageMul(this.buff);
  }

  // 星暴（§23）：白閃 + 震屏 + 視野內星雨連爆；清場全小怪、魔王固定 12 傷。
  private resolveStarstorm(): void {
    this.cameras.main.flash(280, 255, 255, 255);
    this.fx.shake(12);
    const view = this.cameras.main.worldView;
    for (let i = 0; i < 6; i += 1) {
      this.time.delayedCall(i * 90, () =>
        this.fx.starBurst(
          view.x + Math.random() * view.width,
          view.y + Math.random() * view.height * 0.6,
        ),
      );
    }
    for (const child of this.enemies.getGroup().getChildren()) {
      if (child.active) this.enemies.kill(child);
    }
    if (this.boss.isActive()) {
      // 多本體（§68）：星暴固定傷結算至玩家最近的存活本體。
      this.damageBossAt(STARSTORM.bossDamage, this.player.sprite.x, this.player.sprite.y);
    }
  }

  // P3 全場震落（§30）：slam 附加全場訊號，站立玩家強制彈起。
  private resolveBossQuake(): void {
    if (this.finished || this.transitioning) return;
    this.fx.shake(10);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) this.player.sprite.setVelocityY(QUAKE_BOUNCE_VY);
  }

  // 玩家當前形態規格（§57）：未變身為 null。
  private playerFormSpec(): (typeof TRANSFORM_FORMS)['volt'] | null {
    const form = this.player.getTransformState().form;
    return form ? TRANSFORM_FORMS[form] : null;
  }

  // 下衝擊有效半徑（§57）：殼化下砸範圍加倍。
  private slamRadiusPx(): number {
    return SLAM.radiusPx * (this.playerFormSpec()?.slamRadiusMul ?? 1);
  }

  // 下衝擊落地（§23）：60px 圓域傷害 2 + 擊退；未死者被震開。
  private resolveSlamImpact(x: number, y: number): void {
    this.fx.shake(6);
    const radius = this.slamRadiusPx();
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius) continue;
      const outcome = this.enemies.damage(child, SLAM.damage);
      if (outcome === 'hurt') {
        const kb = knockbackVelocity(enemy.x, x, SLAM.knockbackSpeed, SLAM.knockbackLift);
        enemy.setVelocity(kb.x, kb.y);
      }
    }
  }

  // 殼盾反擊星爆（§40）：盾面前定點星爆，波及面前 90px 小怪。
  private resolveShieldCounter(x: number, y: number, facing: 1 | -1): void {
    const originX = x + facing * 30;
    this.fx.starBurst(originX, y);
    this.fx.shake(5);
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      if (
        Phaser.Math.Distance.Between(originX, y, enemy.x, enemy.y) <= SHELL_SHIELD.counterRadiusPx
      ) {
        this.enemies.damage(child, SHELL_SHIELD.counterDamage);
      }
    }
  }

  // 雷化鏈電束（§57/§68）：短程面向側取最近目標（小怪或魔王本體）主傷，再沿雷鏈跳電
  // 波及——跳電候選含小怪、其餘存活魔王本體與碎晶盾（分裂型天然剋制，審查修復）。
  private resolveVoltBeam(x: number, y: number, facing: 1 | -1): void {
    interface BeamTarget {
      x: number;
      y: number;
      ref: Phaser.GameObjects.GameObject | null;
      shield?: Phaser.Physics.Arcade.Sprite;
    }
    const candidates: BeamTarget[] = [];
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    if (this.boss.isActive()) {
      // 多本體（§68）：全部存活本體入候選，鏈電束就近取目標。
      for (const body of this.bossBodies()) {
        if (!(body.body as Phaser.Physics.Arcade.Body).enable) continue;
        candidates.push({ x: body.x, y: body.y, ref: null });
      }
      for (const obj of this.boss.getShields?.()?.getMatching('active', true) ?? []) {
        const shard = asSprite(obj);
        candidates.push({ x: shard.x, y: shard.y, ref: null, shield: shard });
      }
    }
    const inFront = candidates.filter((c) => Math.sign(c.x - x) === facing || c.x === x);
    const target = pickChainTargets(x, y, inFront, 1, VOLT_BEAM.rangePx)[0];
    if (!target) return;
    // 跳電單一結算出口：主傷與波及共用（盾碎裂/小怪/魔王本體三路）。
    const strike = (hit: BeamTarget, damage: number): void => {
      this.fx.burstSmall(hit.x, hit.y, TRANSFORM_FORMS.volt.tint);
      if (hit.shield) {
        hit.shield.disableBody(true, true);
        playSfx('break', 0.7);
        return;
      }
      if (hit.ref) {
        this.enemies.damage(hit.ref, damage);
        return;
      }
      this.damageBossAt(damage, hit.x, hit.y, 'volt');
    };
    playSfx('zap');
    this.drawBolt(x, y, target.x, target.y);
    // 星力果（§69）：變身射擊同享傷害倍率。
    strike(target, VOLT_BEAM.damage * buffDamageMul(this.buff));
    // 跳電波及：以主目標為原點取最近候選（排除主目標自身）。
    const rest = candidates.filter((c) => c !== target);
    let fromX = target.x;
    let fromY = target.y;
    for (const hop of pickChainTargets(
      target.x,
      target.y,
      rest,
      VOLT_BEAM.chainCount,
      VOLT_BEAM.rangePx,
    )) {
      this.drawBolt(fromX, fromY, hop.x, hop.y);
      strike(hop, VOLT_BEAM.chainDamage);
      fromX = hop.x;
      fromY = hop.y;
    }
  }

  // 風化落地衝擊（§57）：小範圍傷害＋輕擊退（半徑/傷害低於下衝擊，零彈藥消耗）。
  private resolveGaleLanding(x: number, y: number): void {
    this.fx.shake(3);
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > GALE_FLIGHT.landingRadiusPx) {
        continue;
      }
      const outcome = this.enemies.damage(child, GALE_FLIGHT.landingDamage);
      if (outcome === 'hurt') {
        const kb = knockbackVelocity(enemy.x, x, SLAM.knockbackSpeed * 0.7, SLAM.knockbackLift);
        enemy.setVelocity(kb.x, kb.y);
      }
    }
  }

  // 雷鏈跳電（§40）：命中點半徑內取最近 chainCount 隻依序跳電，折線閃電演出。
  private chainLightning(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
  ): void {
    const candidates: { x: number; y: number; ref: Phaser.GameObjects.GameObject }[] = [];
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active || child === exclude) continue;
      const enemy = asSprite(child);
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    const targets = pickChainTargets(x, y, candidates, spec.chainCount, spec.chainRadiusPx);
    if (targets.length === 0) return;
    playSfx('zap');
    let fromX = x;
    let fromY = y;
    for (const target of targets) {
      this.drawBolt(fromX, fromY, target.x, target.y);
      this.fx.burstSmall(target.x, target.y, spec.tint);
      this.enemies.damage(target.ref, spec.chainDamage);
      fromX = target.x;
      fromY = target.y;
    }
  }

  // 折線閃電：兩點間三段隨機垂直抖動折線，快速淡出自毀。
  private drawBolt(x1: number, y1: number, x2: number, y2: number): void {
    const bolt = this.add.graphics().setDepth(93);
    bolt.lineStyle(3, 0xffe28a, 1);
    bolt.beginPath();
    bolt.moveTo(x1, y1);
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    for (const t of [0.25, 0.5, 0.75]) {
      const jitter = (Math.random() - 0.5) * 22;
      bolt.lineTo(
        x1 + (x2 - x1) * t + (nx / len) * jitter,
        y1 + (y2 - y1) * t + (ny / len) * jitter,
      );
    }
    bolt.lineTo(x2, y2);
    bolt.strokePath();
    this.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: BOLT_FADE_MS,
      ease: 'Quad.easeIn',
      onComplete: () => bolt.destroy(),
    });
  }

  // 凝光星凍結場（§46）：命中處光域擴散，域內小怪凍結停擺（主目標一併凍結）；
  // 選敵下沉 combat.pickInRadius，Scene 只管視覺 tween 與凍結套用。
  private freezeField(x: number, y: number, mix: StarMixSpec): void {
    const field = this.add
      .circle(x, y, mix.freezeRadiusPx, 0xdff2ff, 0.22)
      .setStrokeStyle(3, 0xbfe8ff, 0.9)
      .setDepth(59)
      .setScale(0.3);
    this.tweens.add({
      targets: field,
      scale: 1,
      duration: 220,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: field,
      alpha: 0,
      delay: mix.freezeMs - 300,
      duration: 300,
      onComplete: () => field.destroy(),
    });
    const candidates: { x: number; y: number; ref: Phaser.GameObjects.GameObject }[] = [];
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    for (const target of pickInRadius(x, y, candidates, mix.freezeRadiusPx + 20)) {
      this.enemies.freeze(target.ref, mix.freezeMs);
    }
  }

  // 魔王房準星輔助（§54 難度根修）：一般星彈對活動中魔王微幅導向——地面水平彈
  // 自然上彎入盤旋帶，保底線不依賴拍翅精度；轉率遠低於追電星、大致對向才生效。
  // 多本體（§68）：導向星彈最近的存活本體。
  private steerBossAimAssist(deltaMs: number): void {
    if (!this.level.boss || !this.boss.isActive() || this.bossDown) return;
    for (const child of this.player.getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      // 追電星有自己的導向；迴旋星彈道由回程驅動，皆不疊加輔助。
      if (this.starMixOf(star)?.homing || this.starSpecOf(star).boomerang) continue;
      const body = this.nearestBossBody(star.x, star.y);
      const starBody = star.body as Phaser.Physics.Arcade.Body;
      const towardBoss = Math.sign(body.x - star.x);
      if (towardBoss !== 0 && Math.sign(starBody.velocity.x) !== towardBoss) continue;
      if (Phaser.Math.Distance.Between(star.x, star.y, body.x, body.y) > BOSS_AIM_ASSIST.rangePx) {
        continue;
      }
      const steered = steerTowardTarget(
        starBody.velocity.x,
        starBody.velocity.y,
        star.x,
        star.y,
        body.x,
        body.y,
        this.starSpecOf(star).speed,
        BOSS_AIM_ASSIST.turnRadPerMs * deltaMs,
      );
      starBody.setVelocity(steered.vx, steered.vy);
    }
  }

  // 追電星導引（§46）：飛行中朝最近小怪限速轉向；鎖敵與轉向數學下沉 logic/homing.ts，
  // Scene 只管 body velocity 套用。
  private steerHomingStars(deltaMs: number): void {
    for (const child of this.player.getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      const mix = this.starMixOf(star);
      if (!mix?.homing) continue;
      const candidates: { x: number; y: number }[] = [];
      for (const candidate of this.enemies.getGroup().getChildren()) {
        if (!candidate.active) continue;
        const enemy = asSprite(candidate);
        candidates.push({ x: enemy.x, y: enemy.y });
      }
      const nearest = nearestInRange(star.x, star.y, candidates, HOMING_RANGE_PX);
      if (!nearest) continue;
      const body = star.body as Phaser.Physics.Arcade.Body;
      const steered = steerTowardTarget(
        body.velocity.x,
        body.velocity.y,
        star.x,
        star.y,
        nearest.x,
        nearest.y,
        mix.speed,
        HOMING_TURN_RAD_PER_MS * deltaMs,
      );
      body.setVelocity(steered.vx, steered.vy);
    }
  }

  // 磁場吸偏（§59 magno field）：域內玩家星彈逐幀被拉向磁極獸；數學下沉 logic/enemyFsm。
  private steerMagnetizedStars(deltaMs: number): void {
    const magnos: { x: number; y: number }[] = [];
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active || this.enemies.kindOf(child) !== 'magno') continue;
      if (child.getData('magnoPhase') !== 'field') continue;
      const magno = asSprite(child);
      magnos.push({ x: magno.x, y: magno.y });
    }
    if (magnos.length === 0) return;
    for (const child of this.player.getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      const body = star.body as Phaser.Physics.Arcade.Body;
      for (const magno of magnos) {
        const pulled = magnetPull(
          star.x,
          star.y,
          body.velocity.x,
          body.velocity.y,
          magno.x,
          magno.y,
          deltaMs,
        );
        body.setVelocity(pulled.vx, pulled.vy);
      }
    }
  }

  // 爆裂星 AoE（§20/§53）：命中處圓形距離判定波及其他小怪，主目標排除避免重複結算；
  // 毒爆雲（slowMs > 0）對波及未死者加套緩速持續傷。
  private explodeStar(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
  ): void {
    this.fx.burstSmall(x, y, spec.tint);
    for (const child of this.enemies.getGroup().getChildren()) {
      if (child === exclude || !child.active) continue;
      const enemy = asSprite(child);
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= spec.aoeRadiusPx) {
        const outcome = this.enemies.damage(child, spec.aoeDamage);
        if (spec.slowMs > 0 && outcome === 'hurt') {
          this.enemies.applySlow(child, spec.slowMs, spec.dotDamage);
        }
      }
    }
  }

  private syncStarTrails(): void {
    for (const child of this.player.getStars().getChildren()) {
      const star = asSprite(child);
      const trail = star.getData('fxTrail') as TrailHandle | undefined;
      if (star.active && !trail) star.setData('fxTrail', this.fx.attachTrail(star));
      else if (!star.active && trail) {
        trail.stop();
        star.setData('fxTrail', undefined);
      }
    }
  }

  // 教學浮字：偵測首次任一操作輸入，交由 waves 排程淡出。
  private syncTutorialInput(): void {
    const { left, right, jumpHeld, actionHeld } = this.controls.state;
    if (left || right || jumpHeld || actionHeld) this.waves.noteInput();
  }
}
