import Phaser from 'phaser';
import { GRAVITY_Y, PLAYER, VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { loadAssets } from '../core/assetLoader';
import { deferredEntriesForLevel, entriesForLevel } from '../core/assetPlan';
import {
  loadSave,
  persistSave,
  recordEgg,
  recordExClear,
  recordLevelClear,
  type SaveData,
} from '../core/save';
import { SceneKeys, type GameResultData, type LevelId, type TransformForm } from '../core/types';
import { unlockedTransformForms } from '../logic/transform';
import { awardAchievements, getAchievement } from '../logic/achievements';
import { BOSS } from '../logic/bossFsm';
import { buffAccelMul, buffSpeedMul } from '../logic/buffs';
import { createCaramelStatus, type CaramelStatus } from '../systems/caramelStatus';
import {
  LEVELS,
  carryKillsOnDeath,
  checkpointRespawnX,
  getLevel,
  nextLevelId,
  type LevelSpec,
} from '../logic/levels';
import { oneWayLandable } from '../logic/stageModel';
import { createParallaxBackground, type BackgroundHandle } from '../systems/background';
import type { BossDamageSource, BossHandle } from '../systems/boss';
import { createBossKit } from '../systems/bossFactory';
import { createBossRoom, type BossRoomHandle } from '../systems/bossRoom';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createDamageDirector, type DamageDirector } from '../systems/damageDirector';
import { createEggTracker, type EggTracker } from '../systems/eggTracker';
import { createEliteRoom, type EliteRoomHandle } from '../systems/eliteRoom';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem } from '../systems/fx';
import { createHud } from '../systems/hud';
import { createLevelGate, type LevelGateHandle } from '../systems/levelGate';
import { createMercyDirector, type MercyDirector } from '../systems/mercyDirector';
import { openPauseMenu } from '../systems/pause';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createPlayerFeel, type PlayerFeel } from '../systems/playerFeel';
import { wireSceneEvents } from '../systems/sceneEvents';
import { createMeteorSystem, type MeteorSystem } from '../systems/meteor';
import { applyInhalePull, wireCombatOverlaps } from '../systems/overlaps';
import { GROUND_HEIGHT, createStage, createTerrain, type StageHandle } from '../systems/stage';
import { createStarCombat, type StarCombat } from '../systems/starCombat';
import { createStarburstDirector, type StarburstDirector } from '../systems/starburstDirector';
import { createStarSteering, type StarSteering } from '../systems/starSteering';
import { createToasts, type ToastSystem } from '../systems/toasts';
import { createTide, type TideHandle } from '../systems/tide';
import { createWaveRunner, type WaveRunner } from '../systems/waves';
import { playMarketOpenVignette } from '../systems/liudongCinematics';
import { bindSfxToEvents, playSfx, stopSfx } from '../audio/sfx';
import { notifySaveUnavailable } from '../../shellCards';

const GROUND_TOP = VIEW.height - GROUND_HEIGHT;
// 魔王死亡演出：慢動作 0.5s + 星爆 0.9s 後進勝利流程。
const WIN_DELAY_MS = 1500;
// 死亡重試：噗滅演出後 ≤400ms 回到可操作（§15.1 M-09）。
const RETRY_DELAY_MS = 350;

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
  // 慈悲補血（§62）：評估與生成錨點委派 systems/mercyDirector（create 重建即歸零）。
  private mercy!: MercyDirector;
  private startedAt = 0;
  // 魔王擊破瞬間鎖存的通關用時（審查修復 #724）；非 boss 關恆 null 走即時計算。
  private clearTimeMs: number | null = null;
  private finished = false;
  private transitioning = false;
  private bossDown = false;
  // 玩家體感同步（§30/§45/§110）：嘴部錨點/吸入音效/跳躍配音/SP 教學/沉地防護
  // 委派 systems/playerFeel。
  private feel!: PlayerFeel;
  // 星星門流程（§26/§39/§43）：生成/掃掠背擋/過關演出委派 systems/levelGate。
  private levelGate!: LevelGateHandle;
  // 卡點關中點重生（§67）：本命最遠推進 x——越過 checkpoint 後死亡自 checkpoint 重生。
  private farthestX = 0;
  // 成就（§94）：pendingUnlocked 為本局勝利瞬間新頒發清單，經 GameResultData
  // 帶入結算頁防演出期漏看；toast 佇列委派 systems/toasts。
  private pendingUnlocked: string[] = [];
  // 中魔王精英房（§48/§52）：全流程委派 systems/eliteRoom.ts；v8 起一關可多房（L6 雙精英）。
  private eliteRooms: EliteRoomHandle[] = [];

  private unlockedForms: ReadonlySet<TransformForm> = new Set();
  private tide: TideHandle | null = null;
  // 流星雨（§79）：關卡級環境彈幕；無配置關為 null。
  private meteor: MeteorSystem | null = null;
  // 魔王關體系（§69）：前室 prefab 與短期增益狀態；非前室魔王關為 null。
  private bossRoom: BossRoomHandle | null = null;
  // 受擊單一入口與短期增益/環境場效結算（§30/§69/§71/§74/§79）：委派 systems/damageDirector。
  private damage!: DamageDirector;
  private caramel!: CaramelStatus;
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
  private starburstDirector!: StarburstDirector;
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

  // 關卡資產於進關卡時載入（§115）：本關背景／道具／小怪／魔王＋全關共用核心，
  // 由 assetPlan 自 LevelSpec 派生；已在快取者零成本，故重玩不再等待。
  preload(): void {
    loadAssets(this, entriesForLevel(getLevel(this.currentLevelId), LEVELS));
  }

  create(): void {
    this.level = getLevel(this.currentLevelId);
    this.save = loadSave();
    this.startedAt = this.time.now;
    this.clearTimeMs = null;
    this.finished = false;
    this.transitioning = false;
    this.bossDown = false;
    this.playerHp = PLAYER.maxHp;
    this.bossHp = -1;
    this.pendingUnlocked = [];
    this.farthestX = 0;

    this.physics.world.setBounds(0, 0, this.worldWidth(), VIEW.height);
    // 低重力（§81）：關卡級重力係數單點注入（缺省 1.0 零回歸）；世界重力為全域值，
    // 每次 create 必須顯式重設（防前關/Voidra P3 注入殘留）。
    this.physics.world.gravity.y = GRAVITY_Y * (this.level.gravityScale ?? 1);
    this.background = createParallaxBackground(this, this.level);
    const { ground, platforms } = createTerrain(this, this.level, this.worldWidth());
    this.terrainGround = ground;
    this.terrainPlatforms = platforms;
    // v4 平台元素與佈景（§29/§32）：緊接地形建立，維持 平台 < 佈景/元素 < 玩家 繪製序；
    // hooks 以閉包延遲解析（player/enemies 於後續建立，呼叫時已就緒）。
    this.stage = createStage(this, this.level, {
      player: () => this.player,
      spawnAmmoMinion: (x, y) => this.enemies.spawn('jelly', x, y),
      // 折躍瞬移（§66）：重置門掃掠基準，防前後幀大位移被誤判為跨越星星門。
      onWarp: (x) => this.levelGate.noteWarp(x),
      // §77：地形粉紅平台納入下穿裁決（下＋跳可穿落，與 elements oneway 同權）。
      terrainOneWay: () => this.terrainPlatforms,
    });

    this.controls = createControls(this);
    // 玩家體感同步（§30/§45/§110）：委派 systems/playerFeel（create 重建即重置邊緣狀態）。
    this.feel = createPlayerFeel(GROUND_TOP, {
      player: () => this.player,
      controls: () => this.controls,
      fx: () => this.fx,
      toasts: () => this.toasts,
      waves: () => this.waves,
    });
    // 受擊單一入口與短期增益/環境場效（§30/§69/§71/§74/§79）：委派 systems/damageDirector
    //（create 重建即歸零）；hooks 閉包延遲解析（levelGate/boss 等於後續建立）。
    this.damage = createDamageDirector(this, {
      player: () => this.player,
      playerHp: () => this.playerHp,
      fx: () => this.fx,
      caramel: () => this.caramel,
      toasts: () => this.toasts,
      tide: () => this.tide,
      meteor: () => this.meteor,
      boss: () => this.boss,
      bossRoom: () => this.bossRoom,
      jumpHeld: () => this.controls.state.jumpHeld,
      gateX: () => this.levelGate.gateX(),
      isSettled: () => this.finished || this.transitioning,
    });
    this.caramel = createCaramelStatus({
      player: () => this.player,
      fx: () => this.fx,
      toast: (message) => this.toasts.flavor(message),
      buffMods: () => [buffSpeedMul(this.damage.buff()), buffAccelMul(this.damage.buff())] as const,
    });
    // 前室魔王關（§69）：自廊道起點入場；一般魔王關維持 arena 中央。
    const startX = this.level.boss
      ? this.level.anteroomPx !== undefined
        ? 60
        : this.worldWidth() / 2
      : 100;
    // 形態解鎖集（§119）：可觸及最高關派生（不動 save schema），SP/HUD 同一裁決。
    const reach = Math.max(this.currentLevelId, this.save.highestClearedLevel + 1);
    this.unlockedForms = unlockedTransformForms(reach);
    this.player = createPlayer(this, startX, GROUND_TOP - 40, this.unlockedForms);
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
        holdSpawn: () => this.tide?.phase() === 'flood',
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
    createHud(this, this.unlockedForms);
    // 場內浮字與慶祝演出（§24/§46/§94）：委派 systems/toasts（fx 閉包延遲解析）。
    this.toasts = createToasts(this, {
      fx: () => this.fx,
      playerPos: () => ({ x: this.player.sprite.x, y: this.player.sprite.y }),
    });
    // 蓄能星生命週期（§109）：跨關持有/死亡清除/EX 清除/教學浮字委派 director（自清）。
    this.starburstDirector = createStarburstDirector(this, {
      player: () => this.player,
      toasts: () => this.toasts,
      exMode: this.exMode,
    });
    // 星星門流程（§26/§39/§43）：委派 systems/levelGate；存檔寫入時機（§38）
    // 由 persistClear 保持通關即記錄，演出中斷不掉進度。
    this.levelGate = createLevelGate(this, GROUND_TOP, {
      player: () => this.player,
      fx: () => this.fx,
      isBossLevel: () => this.level.boss !== null,
      isSettled: () => this.finished || this.transitioning,
      beginTransition: () => {
        this.transitioning = true;
      },
      worldWidth: () => this.worldWidth(),
      levelId: () => this.currentLevelId,
      noteClear: () => this.starburstDirector.noteClear(),
      persistClear: () =>
        this.persistAndAward(recordLevelClear(this.save, this.currentLevelId, this.levelTimeMs())),
    });
    // 慈悲補血（§62／v19 pity）：委派 systems/mercyDirector（create 重建即每命歸零）。
    this.mercy = createMercyDirector(this, GROUND_TOP, {
      player: () => this.player,
      playerHp: () => this.playerHp,
      fx: () => this.fx,
      isBossLevel: () => this.level.boss !== null,
      exMode: this.exMode,
      elapsedMs: () => this.levelTimeMs(),
      bossRoomEntered: () => this.bossRoom?.entered() === true,
      arenaLeft: () => this.arenaLeft(),
      worldWidth: () => this.worldWidth(),
    });
    // 彩蛋進度追蹤（§24）：每關重建；存檔寫入與成就佇列經 persistAndAward 回流；
    // bossKit 的 feedEggs 回呼僅於魔王事件觸發（此時 tracker 已就緒）。
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
      buff: () => this.damage.buff(),
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
            onPickBuff: (id) => this.damage.applyBuff(id),
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
    // §77 增補：著地裁決共用 oneWayLandable SSOT——固定 +6 帶曾使雙跳/下砸高速下降
    // 相位性直穿浮台（#769 未覆蓋分支）；保底位不可下穿，故不吃 stage 下穿窗。
    const bossPlatforms = this.boss.getPlatforms?.() ?? [];
    if (bossPlatforms.length > 0) {
      this.physics.add.collider(this.player.sprite, bossPlatforms, undefined, (_p, platform) => {
        const rect = platform as Phaser.GameObjects.Rectangle;
        const rectBody = rect.body as Phaser.Physics.Arcade.StaticBody;
        const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        return oneWayLandable(
          playerBody.velocity.y,
          playerBody.bottom,
          rectBody.top,
          playerBody.deltaAbsY(),
        );
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
      damagePlayer: (damage, sourceX) => this.damage.damagePlayer(damage, sourceX),
      damageBossAt: (amount, x, y, source) => this.damageBossAt(amount, x, y, source),
      applyCaramel: () => this.caramel.apply(),
      isSettled: () => this.finished || this.transitioning,
      isBossDown: () => this.bossDown,
      now: () => this.time.now,
    });
    this.bindEvents();

    this.boss.onMinionDrop(() => bossKit.spawnBossMinion());

    // shutdown 清理 Phaser 不接管的資源（scene.events/DOM 監聽、音訊迴圈）；fx/hud
    // 自掛自清，enemies/boss 的 group/timer/tween 由 Phaser 先行銷毀，不得重複呼叫。
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

    // §124 W5a：變身演出級資產背景補載（分鏡／光環／徽章／形態技特效）——不入
    // 進場關鍵路徑，開戰數秒內就緒；未載齊時變身直落立繪（運行期安全回退）。
    const deferred = deferredEntriesForLevel(this.level).filter(
      (entry) => !this.textures.exists(entry.key),
    );
    if (deferred.length > 0) {
      for (const { key, url } of deferred) this.load.image(key, url);
      this.load.start();
    }
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.player) return;
    this.background.update(deltaMs);
    this.controls.update(deltaMs);
    if (!this.finished && !this.transitioning) {
      this.feel.syncTutorialInput();
      this.player.update(this.controls.state, deltaMs);
      this.stage.update(this.controls.state, deltaMs);
      // 下跳指示（§77/§85）：下向意圖（含釋放緩衝窗）＋站台 → 跳鍵變色與箭頭翻轉。
      this.controls.setDropReady(this.stage.isDropReady(this.controls.state.downBuffered));
      this.feel.syncSpMode();
      this.feel.clampAboveGround();
      this.farthestX = Math.max(this.farthestX, this.player.sprite.x);
      this.feel.syncJumpSfx();
      this.feel.syncInhale();
      this.eggTracker.sync();
      this.levelGate.sweep();
      for (const room of this.eliteRooms) room.update();
      this.bossRoom?.update();
      this.damage.advanceBuff(deltaMs);
      this.caramel.update(deltaMs);
      this.starSteering.update(deltaMs);
      this.mercy.update(deltaMs);
      // 側風推移（§52）＋重力場拉移（§123）：委派 enemies 系統結算；迴旋星驅動已
      // 內建於 player.update。引力化抗性（§119 gravityFlipImmune）對重力場免效。
      this.enemies.applyEnvironmentalForces(
        this.player.sprite,
        deltaMs,
        this.starCombat.playerFormSpec()?.gravityFlipImmune === true,
      );
      this.damage.advanceTide(deltaMs);
      this.damage.advanceMeteors(deltaMs);
      this.damage.applyBossVents(deltaMs);
    }
    this.enemies.update(deltaMs);
    // 拉力必須在 enemies AI 之後套用，避免被小怪速度邏輯覆寫。
    // 吸入拉近（§30/#811 移至 overlaps.ts）：錐形收斂、吞下與殼殼暈眩窗強化拉力。
    if (!this.finished && !this.transitioning) {
      applyInhalePull(this, this.player, this.enemies, this.feel.mouth());
    }
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

  // e2e 觀測點（#809）：前室反制提示浮字現值（非魔王關/已讀回空字串）。
  bossHintText(): string {
    return this.bossRoom?.hintText() ?? '';
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

  // 世界有效寬（§28）：捲軸關讀關卡資料；boss 關 = 前室寬＋當前視寬（854–1200 動態）。
  private worldWidth(): number {
    if (!this.level.boss) return this.level.worldWidth;
    return this.scale.width + (this.level.anteroomPx ?? 0);
  }

  // arena 左緣（§69）：前室魔王關的 arena 自前室右緣起算；其餘關恆 0。
  private arenaLeft(): number {
    return this.level.boss ? (this.level.anteroomPx ?? 0) : 0;
  }

  // e2e 觀測點（§79）：墜落中/餘燼/預警圈數量；無流星雨關回 null。
  meteorState(): { falling: number; embers: number; telegraphs: number } | null {
    return this.meteor?.state() ?? null;
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

  // 契約事件路由（§11）：分派表委派 systems/sceneEvents；深耦合 run 狀態的
  // 死亡/擊破流程留在本類（onPlayerDied/onBossDefeated hook 回流）。
  private bindEvents(): void {
    this.unbinders.push(
      wireSceneEvents(this.events, {
        setPlayerHp: (hp) => {
          this.playerHp = hp;
        },
        setBossHp: (hp) => {
          this.bossHp = hp;
        },
        toasts: () => this.toasts,
        starCombat: () => this.starCombat,
        stage: () => this.stage,
        eggTracker: () => this.eggTracker,
        fx: () => this.fx,
        damage: () => this.damage,
        levelGate: () => this.levelGate,
        levelSpec: () => this.level,
        exMode: this.exMode,
        bossRoom: () => this.bossRoom,
        arenaLeft: () => this.arenaLeft(),
        viewWidth: () => this.scale.width,
        onPlayerDied: (x, y) => this.handlePlayerDied(x, y),
        onBossDefeated: () => this.handleBossDefeated(),
        playOutroCinematic: () => this.playOutroCinematic(),
      }),
    );
  }

  // 關卡收尾演出（§127）：依 LevelSpec.outroCinematic 值分派（exhaustive，資料驅動
  // 非關號分支）；L29 市場開盤倒數＝L30 伏筆。
  private playOutroCinematic(): void {
    const outro = this.level.outroCinematic;
    if (outro === undefined) return;
    switch (outro) {
      case 'market-open':
        playMarketOpenVignette(this);
        return;
      default: {
        const unhandled: never = outro;
        throw new Error(`未知收尾演出：${String(unhandled)}`);
      }
    }
  }

  // 敗北語意：走動關死亡重試當前關（卡點關越過中點改自 checkpoint 重生，§67）；
  // 魔王戰死亡進敗北結算（再玩一次直接重試魔王關）。
  private handlePlayerDied(x: number, y: number): void {
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
  }

  private handleBossDefeated(): void {
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
      this.mercy.resetLife();
      // 重生瞬移重置門掃掠基準（§66 同語義）：防大位移被誤判為跨越星星門。
      this.levelGate.noteWarp(respawnX);
      this.fx.burstSmall(respawnX, GROUND_TOP - 40, 0x9fe8ff);
      playSfx('reveal');
      this.transitioning = false;
    });
  }

  // 當前關卡淨用時：死亡重試會重置 startedAt，等同本次成功嘗試的用時。
  private levelTimeMs(): number {
    return this.time.now - this.startedAt;
  }

  // e2e 鉤子（§62／v19 pity）：時間快轉供守門案觸發（生成已確定性）；
  // RNG 固定使生成位置可預期（玩家左側地面錨點）。
  mercyWarp(ms: number): void {
    if (!this.scene.isActive()) return;
    this.mercy.warp(ms);
  }

  // e2e 鉤子（§62）：以正式受擊管線壓低血量（i-frame 期間自然免傷，呼叫端輪詢）。
  hurtPlayer(damage: number): void {
    if (this.scene.isActive()) this.player.takeDamage(damage, this.player.sprite.x + 1);
  }

  // e2e 觀測點（§62）：本命累計愛心生成數。
  mercySpawnedCount(): number {
    return this.mercy.spawnedCount();
  }

  // e2e 觀測點（§69）：當前短期增益狀態與本局累計拾取數。
  buffState(): { id: string | null; remainingMs: number; pickups: number } {
    return this.damage.buffState();
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

  // 存檔寫入單點（§94）：寫入後評估成就增量——頒發、單次持久化、排入 toast 佇列；
  // 成就判定恆由 save 資料派生，同批多解鎖合併單張橫幅（審查 U1）。
  private persistAndAward(save: SaveData): void {
    const newly = awardAchievements(save);
    // 落盤失敗必須外顯（#868）：配額將滿時開機探測會通過，只有實際寫入才會失敗。
    if (!persistSave(save)) notifySaveUnavailable();
    if (newly.length === 0) return;
    this.pendingUnlocked.push(...newly);
    this.toasts.queueAchievements(newly.map((id) => getAchievement(id)?.nameZh ?? id).join('、'));
  }
}
