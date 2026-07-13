import Phaser from 'phaser';
import { CANVAS, ENEMY, INHALE, PLAYER, STAR } from '../core/config';
import {
  GameEvents,
  emitGameEvent,
  offGameEvent,
  onGameEvent,
  type GameEventName,
} from '../core/events';
import { SceneKeys, type GameResult, type GameResultData } from '../core/types';
import { BOSS } from '../logic/bossFsm';
import { canInhale, isInInhaleRange } from '../logic/combat';
import { BOSS_RESPAWN_KINDS } from '../logic/waveModel';
import { createBoss, type BossHandle } from '../systems/boss';
import { createControls, type ControlsSystem } from '../systems/controls';
import { createEnemySystem, type EnemySystem } from '../systems/enemies';
import { createFx, type FxSystem, type TrailHandle } from '../systems/fx';
import { createHud } from '../systems/hud';
import { createPlayer, type PlayerHandle } from '../systems/player';
import { createWaveRunner, type WaveRunner } from '../systems/waves';
import { bindSfxToEvents, playSfx, stopSfx } from '../audio/sfx';

const GROUND_HEIGHT = 80;
// 平台高度差 <= 82px，低於單跳最高 98px（420^2 / 2 / 900），全部可跳達。
const PLATFORMS = [
  { x: 240, y: 700, w: 110 },
  { x: 118, y: 618, w: 130 },
  { x: 362, y: 536, w: 130 },
] as const;
const SPAWN_EDGE_X = 48;
const SPAWN_AIR_Y = 260;
const SPAWN_DROP_Y = 700;
const MOUTH_OFFSET_X = 26;
const SWALLOW_RANGE_PX = 46;
const PULL_BASE_SPEED = 160;
const PULL_GAIN = 2.2;
const REPEL_SPEED = 260;
const REPEL_LIFT = -180;
// 魔王死亡演出：慢動作 0.5s + 星爆 0.9s 後進勝利流程。
const WIN_DELAY_MS = 1500;

const asSprite = (obj: unknown): Phaser.Physics.Arcade.Sprite =>
  obj as Phaser.Physics.Arcade.Sprite;

export class GameScene extends Phaser.Scene {
  playerHp: number = PLAYER.maxHp;
  bossHp = -1;

  private startedAt = 0;
  private finished = false;
  private bossDown = false;
  private wasInhaling = false;
  private prevShockwaves = 0;
  private minionDropCount = 0;
  private mouth = { x: 0, y: 0 };
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

  create(): void {
    this.startedAt = this.time.now;
    this.finished = false;
    this.bossDown = false;
    this.wasInhaling = false;
    this.prevShockwaves = 0;
    this.minionDropCount = 0;
    this.playerHp = PLAYER.maxHp;
    this.bossHp = -1;

    this.addBackground();
    const { ground, platforms } = this.addTerrain();

    this.controls = createControls(this);
    this.player = createPlayer(this, CANVAS.width / 2, CANVAS.height - GROUND_HEIGHT - 40);
    this.enemies = createEnemySystem(this);
    this.waves = createWaveRunner(this, this.enemies);
    this.boss = createBoss(this);
    this.fx = createFx(this);
    createHud(this);
    const unbindSfx = bindSfxToEvents(this.events);

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
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.player) return;
    this.controls.update();
    if (!this.finished) {
      this.player.update(this.controls.state, deltaMs);
      this.syncJumpSfx();
      this.syncInhale();
    }
    this.enemies.update(deltaMs);
    // 拉力必須在 enemies AI 之後套用，避免被小怪速度邏輯覆寫。
    if (!this.finished) this.applyInhalePull();
    this.waves.update(deltaMs);
    this.boss.update(deltaMs);
    this.syncStarTrails();
    this.syncSlamSfx();
  }

  forceWin(): void {
    if (this.scene.isActive()) this.finish('won');
  }

  forceLose(): void {
    if (this.scene.isActive()) this.finish('lost');
  }

  private addBackground(): void {
    if (this.textures.exists('bg-arena')) {
      const bg = this.add.image(CANVAS.width / 2, CANVAS.height / 2, 'bg-arena');
      bg.setScale(Math.max(CANVAS.width / bg.width, CANVAS.height / bg.height));
    } else {
      this.add.rectangle(
        CANVAS.width / 2,
        CANVAS.height / 2,
        CANVAS.width,
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
      CANVAS.width / 2,
      CANVAS.height - GROUND_HEIGHT / 2,
      CANVAS.width,
      GROUND_HEIGHT,
      0xbff3e0,
      0.9,
    );
    this.physics.add.existing(ground, true);
    const platforms = PLATFORMS.map((spec) => {
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
    this.physics.add.overlap(stars, bossBody, (a, b) => {
      const star = asSprite(a === bossBody ? b : a);
      if (!star.active) return;
      this.player.onStarHit(star, 'boss');
      this.boss.applyDamage(STAR.damage);
    });

    this.physics.add.overlap(this.player.sprite, this.enemies.getGroup(), (_p, enemy) => {
      const kind = this.enemies.kindOf(enemy as Phaser.GameObjects.GameObject);
      if (!kind || this.finished) return;
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
      if (this.finished || this.bossDown) return;
      this.player.takeDamage(BOSS.bodyDamage, asSprite(bossBody).x);
    });

    this.physics.add.overlap(this.player.sprite, this.boss.getProjectiles(), (_p, ball) => {
      const projectile = asSprite(ball);
      if (!projectile.active || this.finished) return;
      projectile.disableBody(true, true);
      this.player.takeDamage(BOSS.bodyDamage, projectile.x);
    });

    this.physics.add.overlap(this.player.sprite, this.boss.getShockwaves(), (_p, wave) => {
      const shockwave = asSprite(wave);
      if (!shockwave.active || this.finished) return;
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

    bind(GameEvents.WAVE_CHANGED, ({ wave }) => {
      if (wave === 'boss') this.boss.spawn();
    });
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
      this.finish('lost');
    });
    bind(GameEvents.BOSS_DEFEATED, () => {
      this.bossDown = true;
      this.bossHp = 0;
      this.time.delayedCall(WIN_DELAY_MS, () => this.finish('won'));
    });
  }

  private finish(result: GameResult): void {
    if (this.finished) return;
    this.finished = true;
    this.fx.stopInhale();
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).stop();
    const timeMs = this.time.now - this.startedAt;
    emitGameEvent(this.events, result === 'won' ? GameEvents.GAME_WON : GameEvents.GAME_LOST, {
      timeMs,
    });
    const data: GameResultData = { result, timeMs };
    this.time.delayedCall(result === 'won' ? 1300 : 900, () =>
      this.scene.start(SceneKeys.Result, data),
    );
  }

  // 魔王每損 10 HP 補生可吸小怪（供彈藥），左右邊緣交替入場。
  private spawnBossMinion(): void {
    const kind = BOSS_RESPAWN_KINDS[this.minionDropCount % BOSS_RESPAWN_KINDS.length] ?? 'jelly';
    const x = this.minionDropCount % 2 === 0 ? SPAWN_EDGE_X : CANVAS.width - SPAWN_EDGE_X;
    this.minionDropCount += 1;
    this.enemies.spawn(kind, x, kind === 'floaty' ? SPAWN_AIR_Y : SPAWN_DROP_Y);
  }

  // 跳躍/拍翅無契約事件，以當幀速度變化判定配音。
  private syncJumpSfx(): void {
    if (!this.controls.state.jumpPressed) return;
    const vy = (this.player.sprite.body as Phaser.Physics.Arcade.Body).velocity.y;
    if (vy === PLAYER.jumpVelocity) playSfx('jump');
    else if (vy === PLAYER.floatLift) playSfx('flap');
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

  // slam 落地幀無契約事件，以震波出現邊緣判定配音。
  private syncSlamSfx(): void {
    const active = this.boss.getShockwaves().countActive(true);
    if (active > 0 && this.prevShockwaves === 0) playSfx('boss-slam');
    this.prevShockwaves = active;
  }
}
