import Phaser from 'phaser';
import { CANVAS, ENEMY, INHALE, PLAYER, STAR } from '../core/config';
import {
  GameEvents,
  emitGameEvent,
  offGameEvent,
  onGameEvent,
  type GameEventName,
} from '../core/events';
import { LevelEvents, SceneKeys, type GameResultData, type LevelId } from '../core/types';
import { BOSS } from '../logic/bossFsm';
import { canInhale, isInInhaleRange } from '../logic/combat';
import { getLevel, nextLevelId, type LevelSpec } from '../logic/levels';
import { createBoss, type BossHandle } from '../systems/boss';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem, type TrailHandle } from '../systems/fx';
import { createHud } from '../systems/hud';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createWaveRunner, type WaveRunner } from '../systems/waves';
import { bindSfxToEvents, playSfx, stopSfx } from '../audio/sfx';

const GROUND_HEIGHT = 80;
const GROUND_TOP = CANVAS.height - GROUND_HEIGHT;
const SPAWN_EDGE_X = 48;
// 與 waves.ts 生成高度一致：飄飄鳥須在跳躍＋拍翅可達高度。
const SPAWN_AIR_Y = 500;
const SPAWN_DROP_Y = 700;
const MOUTH_OFFSET_X = 26;
const SWALLOW_RANGE_PX = 46;
const PULL_BASE_SPEED = 160;
const PULL_GAIN = 2.2;
const REPEL_SPEED = 260;
const REPEL_LIFT = -180;
// 魔王死亡演出：慢動作 0.5s + 星爆 0.9s 後進勝利流程。
const WIN_DELAY_MS = 1500;
// 死亡重試：噗滅演出後 ≤400ms 回到可操作（§15.1 M-09）。
const RETRY_DELAY_MS = 350;
// 星星門：位於世界右端、地面上方；演出時玩家縮小旋轉飛入。
const GATE_MARGIN_X = 120;
const GATE_Y = GROUND_TOP - 90;
const GATE_ABSORB_MS = 700;
const TRANSITION_CARD_MS = 1200;

interface GameSceneData {
  levelId?: LevelId;
  carryMs?: number;
}

const asSprite = (obj: unknown): Phaser.Physics.Arcade.Sprite =>
  obj as Phaser.Physics.Arcade.Sprite;

export class GameScene extends Phaser.Scene {
  playerHp: number = PLAYER.maxHp;
  bossHp = -1;
  currentLevelId: LevelId = 1;

  private level!: LevelSpec;
  // 已完成關卡的累計用時；GAME_WON 回報四關總和。
  private carryMs = 0;
  private startedAt = 0;
  private finished = false;
  private transitioning = false;
  private bossDown = false;
  private prevVy = 0;
  private wasInhaling = false;
  private minionDropCount = 0;
  private mouth = { x: 0, y: 0 };
  private gate: Phaser.GameObjects.Container | null = null;
  private unbinders: (() => void)[] = [];
  private controls!: ControlsSystem;
  private player!: PlayerHandle;
  private enemies!: EnemySystem;
  private waves!: WaveRunner;
  private boss!: BossHandle;
  private fx!: FxSystem;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: GameSceneData): void {
    this.currentLevelId = data.levelId ?? 1;
    this.carryMs = data.carryMs ?? 0;
  }

  create(): void {
    this.level = getLevel(this.currentLevelId);
    this.startedAt = this.time.now;
    this.finished = false;
    this.transitioning = false;
    this.bossDown = false;
    this.wasInhaling = false;
    this.minionDropCount = 0;
    this.playerHp = PLAYER.maxHp;
    this.bossHp = -1;
    this.gate = null;

    this.physics.world.setBounds(0, 0, this.level.worldWidth, CANVAS.height);
    this.addBackground();
    const { ground, platforms } = this.addTerrain();

    this.controls = createControls(this);
    const startX = this.level.boss ? this.level.worldWidth / 2 : 100;
    this.player = createPlayer(this, startX, GROUND_TOP - 40);
    this.enemies = createEnemySystem(this);
    this.waves = createWaveRunner(this, this.enemies, this.currentLevelId);
    this.boss = createBoss(this);
    this.fx = createFx(this);
    createHud(this);
    const unbindSfx = bindSfxToEvents(this.events);

    this.cameras.main.setBounds(0, 0, this.level.worldWidth, CANVAS.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    this.fx.attachPlayer(this.player.sprite);
    this.fx.attachBoss(asSprite(this.boss.getBody()));
    this.enemies.setTarget(this.player.sprite);

    this.physics.add.collider(this.player.sprite, [ground, ...platforms]);
    this.physics.add.collider(this.enemies.getGroup(), ground);
    this.addOverlaps();
    this.bindEvents();

    this.boss.onMinionDrop(() => this.spawnBossMinion());

    // shutdown 僅清理 Phaser 不接管的資源：scene.events 監聽、DOM 監聽、音訊迴圈。
    // 顯示物件 / group / tween / timer 由 Phaser DisplayList 與 UpdateList 於 shutdown 自動銷毀。
    this.events.once('shutdown', () => {
      this.unbinders.forEach((off) => off());
      this.unbinders.length = 0;
      unbindSfx();
      stopSfx('inhale');
      this.waves.destroy();
      this.controls.destroy();
    });

    this.waves.start();
    if (this.level.boss) this.boss.spawn();
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.player) return;
    this.controls.update();
    if (!this.finished && !this.transitioning) {
      this.syncTutorialInput();
      this.player.update(this.controls.state, deltaMs);
      this.syncJumpSfx();
      this.syncInhale();
    }
    this.enemies.update(deltaMs);
    // 拉力必須在 enemies AI 之後套用，避免被小怪速度邏輯覆寫。
    if (!this.finished && !this.transitioning) this.applyInhalePull();
    this.waves.update(deltaMs);
    this.boss.update(deltaMs);
    this.syncStarTrails();
  }

  forceWin(): void {
    if (this.scene.isActive()) this.finish('won');
  }

  forceLose(): void {
    if (this.scene.isActive() && !this.finished && !this.transitioning) this.retryLevel();
  }

  // e2e 鉤子：直接補滿配額觸發星星門。
  forceGate(): void {
    if (this.scene.isActive()) this.waves.forceQuota();
  }

  // e2e 鉤子：跳至魔王關直達魔王戰。
  skipToBoss(): void {
    if (this.scene.isActive()) this.restartWith({ levelId: 4, carryMs: 0 });
  }

  private restartWith(data: GameSceneData): void {
    this.scene.restart(data);
  }

  private addBackground(): void {
    // v2 背景美術另批入庫；紋理缺件時退回 bg-arena。
    const key = this.textures.exists(this.level.bgKey) ? this.level.bgKey : 'bg-arena';
    if (this.textures.exists(key)) {
      const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
      const scale = Math.max(CANVAS.width / src.width, CANVAS.height / src.height);
      for (let x = 0; x < this.level.worldWidth; x += src.width * scale) {
        this.add
          .image(x, CANVAS.height / 2, key)
          .setOrigin(0, 0.5)
          .setScale(scale);
      }
    } else {
      this.add.rectangle(
        this.level.worldWidth / 2,
        CANVAS.height / 2,
        this.level.worldWidth,
        CANVAS.height,
        0xd6ecff,
      );
    }
  }

  private addTerrain(): {
    ground: Phaser.GameObjects.Rectangle;
    platforms: Phaser.GameObjects.Rectangle[];
  } {
    const ground = this.add.rectangle(
      this.level.worldWidth / 2,
      CANVAS.height - GROUND_HEIGHT / 2,
      this.level.worldWidth,
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
      if (!asSprite(star).active || !this.enemies.kindOf(target)) return;
      this.player.onStarHit(star as Phaser.GameObjects.GameObject, 'minion');
      this.enemies.kill(target);
    });

    // group vs sprite 的回調參數順序不保證，取非魔王側為星彈。
    // 入場動畫與死亡演出期間（非 active）星彈直接穿過，不消耗。
    this.physics.add.overlap(stars, bossBody, (a, b) => {
      const star = asSprite(a === bossBody ? b : a);
      if (!star.active || !this.boss.isActive()) return;
      this.player.onStarHit(star, 'boss');
      this.boss.applyDamage(STAR.damage);
    });

    this.physics.add.overlap(this.player.sprite, this.enemies.getGroup(), (_p, enemy) => {
      const kind = this.enemies.kindOf(enemy as Phaser.GameObjects.GameObject);
      if (!kind || this.finished || this.transitioning) return;
      const target = asSprite(enemy);
      // 吸入錐形內的可吸怪交由吞下流程，不結算觸碰傷害。
      const { x, y } = this.player.sprite;
      if (
        this.player.isInhaling() &&
        canInhale(kind) &&
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
    bind(GameEvents.BOSS_SPAWNED, ({ maxHp }) => {
      this.bossHp = maxHp;
    });
    bind(GameEvents.BOSS_DAMAGED, ({ hp }) => {
      this.bossHp = hp;
    });
    bind(GameEvents.PLAYER_DIED, ({ x, y }) => {
      this.player.sprite.setVisible(false);
      this.fx.puff(x, y);
      this.retryLevel();
    });
    bind(GameEvents.BOSS_DEFEATED, () => {
      this.bossDown = true;
      this.bossHp = 0;
      this.time.delayedCall(WIN_DELAY_MS, () => this.finish('won'));
    });

    const onGateOpened = (): void => this.spawnGate();
    this.events.on(LevelEvents.LEVEL_GATE_OPENED, onGateOpened);
    this.unbinders.push(() => this.events.off(LevelEvents.LEVEL_GATE_OPENED, onGateOpened));
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
      this.restartWith({ levelId: this.currentLevelId, carryMs: this.carryMs }),
    );
  }

  // 星星門：fx-star 放大 + 光暈脈動 + 浮動 tween（graphics 組合，不新增美術）。
  private spawnGate(): void {
    if (this.gate || this.level.boss) return;
    const gx = this.level.worldWidth - GATE_MARGIN_X;
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

    const zone = this.add.zone(gx, GATE_Y, 90, 150);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player.sprite, zone, () => this.completeLevel());
  }

  // 過關演出：玩家縮小旋轉飛入門 → 轉場卡 → 下一關。
  private completeLevel(): void {
    if (this.finished || this.transitioning || !this.gate) return;
    this.transitioning = true;
    stopSfx('inhale');
    this.fx.stopInhale();
    playSfx('swallow');
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
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
        this.showTransitionCard();
      },
    });
  }

  // 轉場卡：全屏「STAGE N 關卡名」slide + fade 1.2s 後載入下一關。
  private showTransitionCard(): void {
    const next = nextLevelId(this.currentLevelId);
    if (next === null) return;
    const spec = getLevel(next);
    playSfx('win');
    const cover = this.add
      .rectangle(CANVAS.width / 2, CANVAS.height / 2, CANVAS.width, CANVAS.height, 0x3a3a4a)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(200);
    const label = this.add
      .text(CANVAS.width / 2 + 90, CANVAS.height / 2, `STAGE ${spec.id}\n${spec.nameZh}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        stroke: '#7a5fb8',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(201);
    this.tweens.add({ targets: cover, alpha: 0.94, duration: 250, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: label,
      alpha: 1,
      x: CANVAS.width / 2,
      duration: 420,
      delay: 120,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: [cover, label],
      alpha: 0,
      duration: 260,
      delay: TRANSITION_CARD_MS - 260,
      ease: 'Quad.easeIn',
    });
    const carryMs = this.carryMs + (this.time.now - this.startedAt);
    this.time.delayedCall(TRANSITION_CARD_MS, () => this.restartWith({ levelId: next, carryMs }));
  }

  private finish(result: 'won' | 'lost'): void {
    if (this.finished) return;
    this.finished = true;
    this.fx.stopInhale();
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).stop();
    const timeMs = this.carryMs + (this.time.now - this.startedAt);
    emitGameEvent(this.events, result === 'won' ? GameEvents.GAME_WON : GameEvents.GAME_LOST, {
      timeMs,
    });
    const data: GameResultData = { result, timeMs };
    this.time.delayedCall(result === 'won' ? 1300 : 900, () =>
      this.scene.start(SceneKeys.Result, data),
    );
  }

  // 魔王每損 10 HP 補生可吸小怪（供彈藥），左右邊緣交替入場；品種輪替讀關卡 enemyMix。
  private spawnBossMinion(): void {
    const kinds = this.level.enemyMix.map((entry) => entry.kind);
    const kind = kinds[this.minionDropCount % kinds.length] ?? 'jelly';
    const x = this.minionDropCount % 2 === 0 ? SPAWN_EDGE_X : this.level.worldWidth - SPAWN_EDGE_X;
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
      if (!canInhale(kind)) {
        enemy.setVelocity(REPEL_SPEED * facing, REPEL_LIFT);
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
