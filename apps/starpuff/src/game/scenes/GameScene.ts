import Phaser from 'phaser';
import { GRAVITY_Y, INHALE, PLAYER, VIEW } from '../core/config';
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
import { SceneKeys, type GameResultData, type LevelId } from '../core/types';
import { awardAchievements, getAchievement } from '../logic/achievements';
import { BOSS } from '../logic/bossFsm';
import { inhaleFlavor, inhaleGraceUntil, isInInhaleRange } from '../logic/combat';
import {
  buffAccelMul,
  buffSpeedMul,
  consumeShieldBlock,
  createBuffState,
  pickupBuff,
  tickBuff,
  BUFF_SPECS,
  type BuffId,
  type BuffState,
} from '../logic/buffs';
import {
  carryKillsOnDeath,
  checkpointRespawnX,
  getLevel,
  nextLevelId,
  type LevelSpec,
} from '../logic/levels';
import {
  MERCY_HEAL,
  advanceMercyHeal,
  createMercyState,
  type MercyState,
} from '../logic/mercyHeal';
import { crossedGate, type BoundsRect } from '../logic/stageModel';
import { createParallaxBackground, type BackgroundHandle } from '../systems/background';
import type { BossDamageSource, BossHandle } from '../systems/boss';
import { createBossKit } from '../systems/bossFactory';
import { createBossRoom, type BossRoomHandle } from '../systems/bossRoom';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createEggTracker, type EggTracker } from '../systems/eggTracker';
import { createEliteRoom, type EliteRoomHandle } from '../systems/eliteRoom';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem } from '../systems/fx';
import { createHud } from '../systems/hud';
import { openPauseMenu } from '../systems/pause';
import { spawnHealPickup } from '../systems/pickups';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createMeteorSystem, type MeteorSystem } from '../systems/meteor';
import { wireCombatOverlaps } from '../systems/overlaps';
import { createStage, type StageHandle } from '../systems/stage';
import { createStarCombat, type StarCombat } from '../systems/starCombat';
import { createStarSteering, type StarSteering } from '../systems/starSteering';
import { createToasts, type ToastSystem } from '../systems/toasts';
import { createTide, type TideHandle } from '../systems/tide';
import { TIDE, tideSoakVelocity } from '../logic/tide';
import { createWaveRunner, type WaveRunner } from '../systems/waves';
import { bindSfxToEvents, playSfx, stopSfx } from '../audio/sfx';

const GROUND_HEIGHT = 80;
const GROUND_TOP = VIEW.height - GROUND_HEIGHT;
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

interface GameSceneData {
  levelId?: LevelId;
  deaths?: number;
  // EX 變體挑戰（§58）：已通關魔王節點的第二入口。
  ex?: boolean;
  // 教學關死亡配額結轉（§105 D5）：僅 retryLevel 傳入，值由 carryKillsOnDeath 夾限。
  carryKills?: number;
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
  // 教學關死亡配額結轉（§105 D5）：retryLevel 帶入、waves runner 以此為種子。
  private carryKills = 0;
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
  private mouth = { x: 0, y: 0 };
  private gate: Phaser.GameObjects.Container | null = null;
  private gateRect: BoundsRect | null = null;
  private prevPlayerX = 0;
  // 卡點關中點重生（§67）：本命最遠推進 x——越過 checkpoint 後死亡自 checkpoint 重生。
  private farthestX = 0;
  // 成就（§94）：pendingUnlocked 為本局勝利瞬間新頒發清單，經 GameResultData
  // 帶入結算頁防演出期漏看；toast 佇列委派 systems/toasts。
  private pendingUnlocked: string[] = [];
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
  private starCombat!: StarCombat;
  private starSteering!: StarSteering;
  private toasts!: ToastSystem;
  // 彩蛋（§24）：每關進度與 crown-early-hit 時間窗委派 systems/eggTracker。
  private eggTracker!: EggTracker;

  // e2e 觀測點（§94）：最近一張成就 toast 文案（canvas 文字無法由 DOM 斷言）。
  get lastAchievementToast(): string {
    return this.toasts ? this.toasts.lastAchievementToast() : '';
  }

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: GameSceneData): void {
    this.currentLevelId = data.levelId ?? 1;
    this.deaths = data.deaths ?? 0;
    this.exMode = data.ex === true;
    this.carryKills = data.carryKills ?? 0;
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
    this.playerHp = PLAYER.maxHp;
    this.bossHp = -1;
    this.gate = null;
    this.gateRect = null;
    this.pendingUnlocked = [];
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
    this.waves = createWaveRunner(
      this,
      this.enemies,
      this.currentLevelId,
      {
        adjustSpawn: (kind, y) =>
          this.tide
            ? { kind: this.tide.filterSpawnKind(kind), y: this.tide.adjustSpawnY(y) }
            : { kind, y },
      },
      this.carryKills,
    );
    // 雙魔王（§54）：品種唯一分派點 systems/bossFactory；非 boss 關建 jellord 待命殼
    //（永不 spawn）。hooks 閉包延遲解析（fx 於後續建立，回呼觸發時已就緒）。
    const bossKit = createBossKit(this, this.level, GROUND_TOP, {
      exMode: this.exMode,
      arenaLeft: () => this.arenaLeft(),
      worldWidth: () => this.worldWidth(),
      enemies: () => this.enemies,
      fx: () => this.fx,
      player: () => this.player,
      playerHp: () => this.playerHp,
      tide: () => this.tide,
      replaceTide: (spec) => {
        this.tide?.destroy();
        this.tide = createTide(this, spec, this.worldWidth());
      },
      meteor: () => this.meteor,
      feedEggs: (event) => this.eggTracker.feed(event),
    });
    this.boss = bossKit.handle;
    this.bossTouchDamage = bossKit.bodyDamage;
    this.fx = createFx(this);
    createHud(this);
    // 場內浮字與慶祝演出（§24/§46/§94）：委派 systems/toasts。
    this.toasts = createToasts(this, {
      fx: () => this.fx,
      playerPos: () => ({ x: this.player.sprite.x, y: this.player.sprite.y }),
    });
    // 彩蛋進度追蹤（§24）：每關重建；存檔寫入與成就佇列經 persistAndAward 回流。
    this.eggTracker = createEggTracker(this.level, {
      player: () => this.player,
      playerHp: () => this.playerHp,
      bossActive: () => this.boss.isActive(),
      now: () => this.time.now,
      recordEggAndAward: (trigger) =>
        this.persistAndAward(recordEgg(this.save, this.currentLevelId, trigger)),
      celebrate: (message) => this.toasts.celebrate(message),
    });
    // 星彈規格與技能世界結算（§23/§46/§57）：委派 systems/starCombat；
    // GameScene 只留事件路由與 overlap 接線。
    this.starCombat = createStarCombat(this, {
      enemies: () => this.enemies,
      fx: () => this.fx,
      boss: () => this.boss,
      player: () => this.player,
      buff: () => this.buff,
      bossBodies: () => this.bossBodies(),
      damageBossAt: (amount, x, y, source) => this.damageBossAt(amount, x, y, source),
    });
    // 星彈飛行導向與拖尾（§46/§54/§59）：候選過濾與 velocity 套用委派 starSteering。
    this.starSteering = createStarSteering({
      player: () => this.player,
      enemies: () => this.enemies,
      boss: () => this.boss,
      combat: () => this.starCombat,
      fx: () => this.fx,
      isBossLevel: () => this.level.boss !== null,
      isBossDown: () => this.bossDown,
      nearestBossBody: (x, y) => this.nearestBossBody(x, y),
    });
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
    // 戰鬥碰撞接線（§29/§58/§68/§79）：委派 systems/overlaps，接線順序凍結。
    wireCombatOverlaps(this, {
      player: () => this.player,
      enemies: () => this.enemies,
      boss: () => this.boss,
      fx: () => this.fx,
      meteor: () => this.meteor,
      stage: () => this.stage,
      combat: () => this.starCombat,
      bossBodies: () => this.bossBodies(),
      nearestBossBody: (x, y) => this.nearestBossBody(x, y),
      bossTouchDamage: () => this.bossTouchDamage,
      damagePlayer: (damage, sourceX) => this.damagePlayer(damage, sourceX),
      damageBossAt: (amount, x, y, source) => this.damageBossAt(amount, x, y, source),
      isSettled: () => this.finished || this.transitioning,
      isBossDown: () => this.bossDown,
      now: () => this.time.now,
    });
    this.bindEvents();

    this.boss.onMinionDrop(() => bossKit.spawnBossMinion());

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
      this.eggTracker.sync();
      this.syncGateSweep();
      for (const room of this.eliteRooms) room.update();
      this.bossRoom?.update();
      this.advanceBuff(deltaMs);
      this.starSteering.update(deltaMs);
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
    this.starSteering.syncTrails();
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

  // e2e 鉤子：直達任一關（各關反卡關走查用）；ex 供 EX 變體直達（§86）。
  gotoLevel(levelId: LevelId, ex = false): void {
    if (this.scene.isActive()) this.restartWith({ levelId, ex });
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
      ex: this.exMode,
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
    this.toasts.flavor(`${BUFF_SPECS[id].nameZh}！短暫強化`);
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
      this.toasts.flavor(top.mix !== undefined ? MIX_HINTS[top.mix] : FLAVOR_HINTS[top.flavor]);
    });
    // 技能世界結算（§23）：player 只發事件，場上效果委派 starCombat。
    bind(GameEvents.SKILL_STARSTORM, () => this.starCombat.resolveStarstorm());
    // 下衝擊落點同步破磚（§29）：磚的 damage 接口由 stage 提供，沿用既有 SKILL 事件契約。
    bind(GameEvents.SKILL_SLAM_LANDED, ({ x, y }) => {
      this.starCombat.resolveSlamImpact(x, y);
      this.stage.damageBricksInRadius(x, y, this.starCombat.slamRadiusPx());
    });
    // 殼盾格擋成功（§40）：正面反擊星爆，波及面前小怪。
    bind(GameEvents.SKILL_SHIELD_BLOCK, ({ x, y, facing }) =>
      this.starCombat.resolveShieldCounter(x, y, facing),
    );
    // 星化形態技（§57）：雷化鏈電束／風化落地衝擊由 player 發事件、starCombat 結算。
    bind(GameEvents.SKILL_TRANSFORM_STRIKE, ({ kind, x, y, facing }) => {
      if (kind === 'volt-beam') this.starCombat.resolveVoltBeam(x, y, facing);
      else this.starCombat.resolveGaleLanding(x, y);
    });
    bind(GameEvents.BOSS_SPAWNED, ({ maxHp }) => {
      this.bossHp = maxHp;
    });
    bind(GameEvents.BOSS_DAMAGED, ({ hp }) => {
      this.bossHp = hp;
      this.eggTracker.noteBossHit();
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
      if (flavor) this.eggTracker.feed({ kind: 'swallow', flavor });
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
      if (this.exMode) this.persistAndAward(recordExClear(this.save, this.currentLevelId));
      else this.persistAndAward(recordLevelClear(this.save, this.currentLevelId, this.clearTimeMs));
      this.time.delayedCall(WIN_DELAY_MS, () => this.finish('won'));
    });
    bind(GameEvents.LEVEL_GATE_OPENED, () => this.spawnGate());
  }

  // 死亡重試當前關：已完成關卡的累計用時保留，當前關計時重來。
  // 教學關配額結轉（§105 D5）：保留一半擊殺數軟化新手死亡懲罰；非教學關全重置。
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
        carryKills: carryKillsOnDeath(this.level, this.waves.getQuota().killCount),
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
    this.persistAndAward(recordLevelClear(this.save, this.currentLevelId, this.levelTimeMs()));
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
      exMode: this.exMode,
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

  // v13 觀測點（§86 bot 迴避取樣）：shockwave 型危害群組。
  bossHazardBodies(): Phaser.Physics.Arcade.Group {
    return this.boss.getShockwaves();
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
      ex: this.exMode,
      // 成就名單（§94）：勝利瞬間新頒發 id 帶入結算，多重解鎖不因演出期轉場漏看。
      unlocked: [...this.pendingUnlocked],
    };
    // 謝幕（§84）：全破最終魔王關（鏈末魔王關，資料驅動非硬編關號）先播星光復甦再結算。
    const finale =
      result === 'won' && this.level.boss !== null && nextLevelId(this.currentLevelId) === null;
    this.time.delayedCall(result === 'won' ? 1300 : 900, () =>
      this.scene.start(finale ? SceneKeys.Credits : SceneKeys.Result, data),
    );
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

  // 存檔寫入單點（§94）：寫入後評估成就增量——頒發、單次持久化、排入 toast 佇列。
  // 成就判定恆由 save 資料派生（awardAchievements 內部 diff），此處不做侵入式鉤子。
  // 同批多解鎖合併為單張橫幅（審查 U1）：勝利轉場 2.8s 窗口內必可播完整批。
  private persistAndAward(save: SaveData): void {
    const newly = awardAchievements(save);
    persistSave(save);
    if (newly.length === 0) return;
    this.pendingUnlocked.push(...newly);
    this.toasts.queueAchievements(newly.map((id) => getAchievement(id)?.nameZh ?? id).join('、'));
  }

  // P3 全場震落（§30）：slam 附加全場訊號，站立玩家強制彈起。
  private resolveBossQuake(): void {
    if (this.finished || this.transitioning) return;
    this.fx.shake(10);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) this.player.sprite.setVelocityY(QUAKE_BOUNCE_VY);
  }

  // 教學浮字：偵測首次任一操作輸入，交由 waves 排程淡出。
  private syncTutorialInput(): void {
    const { left, right, jumpHeld, actionHeld } = this.controls.state;
    if (left || right || jumpHeld || actionHeld) this.waves.noteInput();
  }
}
