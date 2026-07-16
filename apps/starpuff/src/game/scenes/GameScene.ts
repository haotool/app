import Phaser from 'phaser';
import {
  EGG_HP_CAP,
  ENEMY,
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
import { loadSave, persistSave, recordLevelClear, recordEgg, type SaveData } from '../core/save';
import { SceneKeys, type GameResultData, type LevelId } from '../core/types';
import { BOSS } from '../logic/bossFsm';
import { inhaleFlavor, isInInhaleRange, knockbackVelocity } from '../logic/combat';
import { SHELL_SHIELD, pickChainTargets } from '../logic/skills';
import {
  advanceEgg,
  createEggProgress,
  type EasterEggSpec,
  type EggEvent,
  type EggProgress,
} from '../logic/eggs';
import { getLevel, nextLevelId, type LevelSpec } from '../logic/levels';
import { crossedGate, type BoundsRect } from '../logic/stageModel';
import { createParallaxBackground, type BackgroundHandle } from '../systems/background';
import { createBoss, type BossHandle } from '../systems/boss';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createEliteRoom, type EliteRoomHandle } from '../systems/eliteRoom';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem, type TrailHandle } from '../systems/fx';
import { createHud } from '../systems/hud';
import { openPauseMenu } from '../systems/pause';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createStage, type StageHandle } from '../systems/stage';
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
  // 彩蛋（§24）：每關進度鎖存；bossActiveAt 供 crown-early-hit 時間窗。
  private eggProgress: EggProgress[] = [];
  private bossActiveAt = -1;
  // 中魔王精英房（§48）：全流程委派 systems/eliteRoom.ts，本場景只留逐幀呼叫。
  private eliteRoom!: EliteRoomHandle;
  private unbinders: (() => void)[] = [];
  private terrainGround: Phaser.GameObjects.Rectangle | null = null;
  private background!: BackgroundHandle;
  private controls!: ControlsSystem;
  private player!: PlayerHandle;
  private enemies!: EnemySystem;
  private waves!: WaveRunner;
  private boss!: BossHandle;
  private fx!: FxSystem;
  private stage!: StageHandle;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: GameSceneData): void {
    this.currentLevelId = data.levelId ?? 1;
    this.deaths = data.deaths ?? 0;
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

    this.physics.world.setBounds(0, 0, this.worldWidth(), VIEW.height);
    this.background = createParallaxBackground(this, this.level);
    const { ground, platforms } = this.addTerrain();
    this.terrainGround = ground;
    // v4 平台元素與佈景（§29/§32）：緊接地形建立，維持 平台 < 佈景/元素 < 玩家 繪製序；
    // hooks 以閉包延遲解析（player/enemies 於後續建立，呼叫時已就緒）。
    this.stage = createStage(this, this.level, {
      player: () => this.player,
      spawnAmmoMinion: (x, y) => this.enemies.spawn('jelly', x, y),
    });

    this.controls = createControls(this);
    const startX = this.level.boss ? this.worldWidth() / 2 : 100;
    this.player = createPlayer(this, startX, GROUND_TOP - 40);
    this.enemies = createEnemySystem(this);
    this.waves = createWaveRunner(this, this.enemies, this.currentLevelId);
    this.boss = createBoss(this);
    this.fx = createFx(this);
    createHud(this);
    // 精英房（§48）：boss 關無精英；hooks 閉包延遲解析既有系統。
    this.eliteRoom = createEliteRoom(this, this.level.boss ? null : this.level.elite, GROUND_TOP, {
      player: () => this.player,
      enemies: () => this.enemies,
      fx: () => this.fx,
      playerHp: () => this.playerHp,
      gateOpen: () => this.waves.isGateOpen(),
    });
    const unbindSfx = bindSfxToEvents(this.events);

    this.cameras.main.setBounds(0, 0, this.worldWidth(), VIEW.height);
    // 剛性跟隨（US-022 / recon 硬規則 9）：lerp 1,1 消除 lerp×roundPixels 逐幀往返跳動；
    // boss 關單屏不跟隨，避免剛性跟隨在 preRender 覆寫入場運鏡的 pan/zoom。
    if (!this.level.boss) this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
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

    this.physics.add.collider(this.player.sprite, [ground, ...platforms]);
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
    });

    this.waves.start();
    if (this.level.boss) this.boss.spawn();
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.player) return;
    this.background.update(deltaMs);
    this.controls.update();
    if (!this.finished && !this.transitioning) {
      this.syncTutorialInput();
      this.player.update(this.controls.state, deltaMs);
      this.stage.update(this.controls.state);
      this.syncJumpSfx();
      this.syncInhale();
      this.syncEggs();
      this.syncGateSweep();
      this.eliteRoom.update();
      this.steerHomingStars(deltaMs);
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

  // e2e 鉤子：模擬死亡結果（魔王關敗北進結算、其餘重試當前關）。
  forceLose(): void {
    if (!this.scene.isActive() || this.finished || this.transitioning) return;
    this.deaths += 1;
    if (this.level.boss) this.finish('lost');
    else this.retryLevel();
  }

  // e2e 鉤子：直接補滿配額觸發星星門。
  forceGate(): void {
    if (this.scene.isActive()) this.waves.forceQuota();
  }

  // e2e 鉤子（§48）：以正式傷害管線秒殺場上精英。
  slayElite(): void {
    if (this.scene.isActive()) this.eliteRoom.slay();
  }

  // e2e 觀測點（§48）：精英房狀態與軟鎖門位置。
  eliteState(): { armed: boolean; done: boolean; doorX: number | null } {
    return this.eliteRoom.state();
  }

  // e2e 鉤子：跳至魔王關直達魔王戰。
  skipToBoss(): void {
    if (this.scene.isActive()) this.restartWith({ levelId: 4 });
  }

  // e2e 鉤子：直達任一關（各關反卡關走查用）。
  gotoLevel(levelId: LevelId): void {
    if (this.scene.isActive()) this.restartWith({ levelId });
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

  // 世界有效寬（§28）：捲軸關讀關卡資料；boss 單屏關 = 當前視寬（854–1200 動態）。
  private worldWidth(): number {
    return this.level.boss ? this.scale.width : this.level.worldWidth;
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
      return platform;
    });
    return { ground, platforms };
  }

  private addOverlaps(): void {
    const stars = this.player.getStars();
    const bossBody = this.boss.getBody();

    this.physics.add.overlap(stars, this.enemies.getGroup(), (star, enemy) => {
      const target = enemy as Phaser.GameObjects.GameObject;
      const s = asSprite(star);
      if (!s.active || !this.enemies.kindOf(target)) return;
      const spec = this.starSpecOf(s);
      const outcome = this.enemies.damage(target, this.starDamageOf(s));
      if (outcome === 'ignored') return;
      if (spec.aoeRadiusPx > 0) this.explodeStar(s.x, s.y, spec, target);
      // 雷鏈星（§40）：命中後跳電至半徑內最近敵，主目標排除。
      if (spec.chainCount > 0) this.chainLightning(s.x, s.y, spec, target);
      // 凝光星（§46）：命中處生成凍結光域。
      const mix = this.starMixOf(s);
      if (mix && mix.freezeRadiusPx > 0) this.freezeField(s.x, s.y, mix, target);
      // 未死目標（chompy 扣血）吃掉星彈；擊殺則依穿透續飛。
      this.player.onStarHit(s, outcome === 'killed' ? 'pierce' : 'absorb');
    });

    // group vs sprite 的回調參數順序不保證，取非魔王側為星彈。
    // 入場動畫與死亡演出期間（非 active）星彈直接穿過，不消耗。
    this.physics.add.overlap(stars, bossBody, (a, b) => {
      const star = asSprite(a === bossBody ? b : a);
      if (!star.active || !this.boss.isActive()) return;
      const spec = this.starSpecOf(star);
      if (spec.aoeRadiusPx > 0) this.explodeStar(star.x, star.y, spec, null);
      // 雷鏈星命中魔王同樣跳電波及補給小怪（§40 群戰原型）。
      if (spec.chainCount > 0) this.chainLightning(star.x, star.y, spec, null);
      const mix = this.starMixOf(star);
      if (mix && mix.freezeRadiusPx > 0) this.freezeField(star.x, star.y, mix, null);
      this.player.onStarHit(star, 'absorb');
      this.boss.applyDamage(this.starDamageOf(star));
    });

    // 新怪危險物：puffy 爆刺彈與 chompy 咬合 hitbox（傷害 1，命中即失效）。
    // zappy 放電環（§30）同走此 hazards 管線結算，不另設 overlap。
    this.physics.add.overlap(this.player.sprite, this.enemies.getHazards(), (_p, hz) => {
      const hazard = asSprite(hz);
      if (!hazard.active || this.finished || this.transitioning) return;
      hazard.disableBody(true, true);
      this.player.takeDamage(ENEMY.touchDamage, hazard.x);
    });

    this.physics.add.overlap(this.player.sprite, this.enemies.getGroup(), (_p, enemy) => {
      const kind = this.enemies.kindOf(enemy as Phaser.GameObjects.GameObject);
      if (!kind || this.finished || this.transitioning) return;
      // 半入地無害態（§47 drilly 潛地/前搖）：不結算觸碰傷害。
      if (this.enemies.isPhasedOut(enemy as Phaser.GameObjects.GameObject)) return;
      const target = asSprite(enemy);
      // 吸入錐形內的可吸怪（§30：shelly 僅暈眩窗）交由吞下流程，不結算觸碰傷害。
      const { x, y } = this.player.sprite;
      if (
        this.player.isInhaling() &&
        this.enemies.isInhalable(enemy as Phaser.GameObjects.GameObject) &&
        isInInhaleRange(x, y, this.player.getFacing(), target.x, target.y, INHALE.rangePx)
      ) {
        return;
      }
      this.player.takeDamage(ENEMY.touchDamage, target.x);
    });

    this.physics.add.overlap(this.player.getInhaleZone(), this.enemies.getGroup(), (_z, enemy) => {
      asSprite(enemy).setData('inhalePull', true);
    });

    this.physics.add.overlap(this.player.sprite, bossBody, () => {
      if (this.finished || this.transitioning || this.bossDown) return;
      this.player.takeDamage(BOSS.bodyDamage, asSprite(bossBody).x);
    });

    this.physics.add.overlap(this.player.sprite, this.boss.getProjectiles(), (_p, ball) => {
      const projectile = asSprite(ball);
      if (!projectile.active || this.finished || this.transitioning) return;
      projectile.disableBody(true, true);
      this.player.takeDamage(BOSS.bodyDamage, projectile.x);
    });

    this.physics.add.overlap(this.player.sprite, this.boss.getShockwaves(), (_p, wave) => {
      const shockwave = asSprite(wave);
      if (!shockwave.active || this.finished || this.transitioning) return;
      this.player.takeDamage(BOSS.bodyDamage, shockwave.x);
    });

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
      this.stage.damageBricksInRadius(x, y, SLAM.radiusPx);
    });
    // 殼盾格擋成功（§40）：正面反擊星爆，波及面前小怪。
    bind(GameEvents.SKILL_SHIELD_BLOCK, ({ x, y, facing }) =>
      this.resolveShieldCounter(x, y, facing),
    );
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
    bind(GameEvents.BOSS_PHASE, ({ phase }) => {
      if (phase === 'p3') this.fx.hitStop(P3_HITSTOP_MS);
    });
    bind(GameEvents.BOSS_QUAKE, () => this.resolveBossQuake());
    // 彩蛋事件餵送（§24）：吞噬歷史與魔王首擊時間窗。
    bind(GameEvents.ENEMY_INHALED, ({ kind }) => {
      const flavor = inhaleFlavor(kind);
      if (flavor) this.feedEggs({ kind: 'swallow', flavor });
    });
    // 敗北語意：Stage 1-3 死亡重試當前關；魔王戰死亡進敗北結算（再玩一次直接重試第 4 關）。
    bind(GameEvents.PLAYER_DIED, ({ x, y }) => {
      this.deaths += 1;
      this.player.sprite.setVisible(false);
      this.fx.puff(x, y);
      if (this.level.boss) this.finish('lost');
      else this.retryLevel();
    });
    bind(GameEvents.BOSS_DEFEATED, () => {
      this.bossDown = true;
      this.bossHp = 0;
      // 通關計時單一來源（審查修復 #724）：擊破瞬間擷取用時，存檔與結算共用，
      // 避免 WIN_DELAY_MS 演出期使結算成績比地圖最佳時間多 1.5s。
      this.clearTimeMs = this.levelTimeMs();
      persistSave(recordLevelClear(this.save, this.currentLevelId, this.clearTimeMs));
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
    this.time.delayedCall(result === 'won' ? 1300 : 900, () =>
      this.scene.start(SceneKeys.Result, data),
    );
  }

  // 魔王每損 10 HP 補生可吸小怪（供彈藥），左右邊緣交替入場；品種輪替讀關卡 enemyMix。
  private spawnBossMinion(): void {
    const kinds = this.level.enemyMix.map((entry) => entry.kind);
    const kind = kinds[this.minionDropCount % kinds.length] ?? 'jelly';
    const x = this.minionDropCount % 2 === 0 ? SPAWN_EDGE_X : this.worldWidth() - SPAWN_EDGE_X;
    this.minionDropCount += 1;
    this.enemies.spawn(kind, x, kind === 'floaty' ? SPAWN_AIR_Y : SPAWN_DROP_Y);
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

  // 星彈傷害（§23）：發射端已依槽位（強化 ×1.6 / 金星 20）寫入。
  private starDamageOf(star: Phaser.Physics.Arcade.Sprite): number {
    return (star.getData('damage') as number | undefined) ?? this.starSpecOf(star).damage;
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
    if (this.boss.isActive()) this.boss.applyDamage(STARSTORM.bossDamage);
  }

  // P3 全場震落（§30）：slam 附加全場訊號，站立玩家強制彈起。
  private resolveBossQuake(): void {
    if (this.finished || this.transitioning) return;
    this.fx.shake(10);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) this.player.sprite.setVelocityY(QUAKE_BOUNCE_VY);
  }

  // 下衝擊落地（§23）：60px 圓域傷害 2 + 擊退；未死者被震開。
  private resolveSlamImpact(x: number, y: number): void {
    this.fx.shake(6);
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > SLAM.radiusPx) continue;
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

  // 凝光星凍結場（§46）：命中處光域擴散，域內小怪凍結停擺（主目標一併凍結）。
  private freezeField(
    x: number,
    y: number,
    mix: StarMixSpec,
    exclude: Phaser.GameObjects.GameObject | null,
  ): void {
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
    for (const child of this.enemies.getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = asSprite(child);
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= mix.freezeRadiusPx + 20) {
        this.enemies.freeze(child, mix.freezeMs);
      }
    }
    void exclude;
  }

  // 追電星導引（§46）：飛行中朝最近小怪限速轉向；每幀最大轉角 ∝ deltaMs。
  private steerHomingStars(deltaMs: number): void {
    const HOMING_RANGE_PX = 320;
    const TURN_RAD_PER_MS = 0.006;
    for (const child of this.player.getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      const mix = this.starMixOf(star);
      if (!mix?.homing) continue;
      let nearest: Phaser.Physics.Arcade.Sprite | null = null;
      let bestSq = HOMING_RANGE_PX * HOMING_RANGE_PX;
      for (const candidate of this.enemies.getGroup().getChildren()) {
        if (!candidate.active) continue;
        const enemy = asSprite(candidate);
        const dSq = (enemy.x - star.x) ** 2 + (enemy.y - star.y) ** 2;
        if (dSq < bestSq) {
          bestSq = dSq;
          nearest = enemy;
        }
      }
      if (!nearest) continue;
      const body = star.body as Phaser.Physics.Arcade.Body;
      const speed = body.velocity.length() || mix.speed;
      const current = Math.atan2(body.velocity.y, body.velocity.x);
      const desired = Math.atan2(nearest.y - star.y, nearest.x - star.x);
      let diff = desired - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const step = Math.min(Math.abs(diff), TURN_RAD_PER_MS * deltaMs) * Math.sign(diff);
      const angle = current + step;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  // 爆裂星 AoE（§20）：命中處圓形距離判定波及其他小怪，主目標排除避免重複結算。
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
        this.enemies.damage(child, spec.aoeDamage);
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
