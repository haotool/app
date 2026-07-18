import Phaser from 'phaser';
import { GRAVITY_Y, VIEW } from '../core/config';
import { approachPoint } from '../logic/noctraFlight';

// v12 gate 技術 spike（主計畫 §6.3/§10.3）：驗證「單向捲軸＋boss steering＋物理邊界
// 共存」三項。原型不合入 main；驗收由 window.__spike 觀測點＋Playwright 斷言承擔。

const WORLD_W = 4200;
const GROUND_TOP = VIEW.height - 80;
// 單向捲軸速度（追逐段基準）：略低於玩家全速 220，玩家可前後機動。
const CHASE_SPEED = 130;
// boss steering：錨定視窗 70% 位置、速度上限逼近（沿 §64 noctraFlight 模式）。
const BOSS_ANCHOR_RATIO = 0.7;
const BOSS_MAX_SPEED = 360;
// 左緣壓迫牆：玩家落後於此即被推擠（物理邊界共存驗證核心）。
const WALL_W = 24;

export class SpikeChaseScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private wall!: Phaser.GameObjects.Rectangle;
  private boss!: Phaser.GameObjects.Rectangle;
  private elapsedMs = 0;
  private frames = 0;
  private crushed = false;
  private bossErrPeak = 0;

  constructor() {
    super('SpikeChase');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, VIEW.height);
    this.physics.world.gravity.y = GRAVITY_Y;
    this.cameras.main.setBounds(0, 0, WORLD_W, VIEW.height);

    const ground = this.add.rectangle(WORLD_W / 2, VIEW.height - 40, WORLD_W, 80, 0xbff3e0);
    this.physics.add.existing(ground, true);

    // 平台陣（驗證捲軸下碰撞正常）：等距單向平台。
    const platforms: Phaser.GameObjects.Rectangle[] = [];
    for (let x = 500; x < WORLD_W - 400; x += 450) {
      const platform = this.add.rectangle(x, 320, 150, 16, 0xffd1e0);
      this.physics.add.existing(platform, true);
      const body = platform.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      platforms.push(platform);
    }

    // 簡化玩家（bot 駕駛）：自動右走＋週期跳，驗證擠壓與碰撞而非手感。
    this.player = this.add.rectangle(120, GROUND_TOP - 40, 40, 44, 0xa8f0c8);
    this.physics.add.existing(this.player);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setCollideWorldBounds(true);

    // 左緣壓迫牆：immovable 實體，隨相機推進（物理邊界共存主角）。
    this.wall = this.add.rectangle(WALL_W / 2, VIEW.height / 2, WALL_W, VIEW.height, 0xd84b6a);
    this.physics.add.existing(this.wall);
    const wallBody = this.wall.body as Phaser.Physics.Arcade.Body;
    wallBody.setAllowGravity(false);
    wallBody.setImmovable(true);

    // boss（無重力浮空體）：steering 錨定捲軸世界座標（初始位＝動態視寬 70%）。
    this.boss = this.add.rectangle(this.scale.width * BOSS_ANCHOR_RATIO, 200, 90, 80, 0x9b7bd8);
    this.physics.add.existing(this.boss);
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    bossBody.setAllowGravity(false);
    bossBody.setImmovable(true);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, platforms, undefined, (_p, plat) => {
      const rect = plat as Phaser.GameObjects.Rectangle;
      const rb = rect.body as Phaser.Physics.Arcade.StaticBody;
      return playerBody.velocity.y >= 0 && playerBody.bottom <= rb.top + 6;
    });
    this.physics.add.collider(this.player, this.wall, () => {
      // 擠壓判定：牆與右側「障礙」同時受阻＝夾死（v12 主線需死亡重試處理）；
      // 世界右緣為追逐段終點，貼緣等待捲軸完成屬正常收尾不計夾死。
      if (playerBody.blocked.right && this.player.x < WORLD_W - VIEW.minWidth / 2) {
        this.crushed = true;
      }
    });

    // 觀測點：三項驗收指標全數暴露。
    (
      window as unknown as {
        __spike?: {
          scrollX(): number;
          playerX(): number;
          bossRelErr(): number;
          bossRelErrPeak(): number;
          crushed(): boolean;
          onGround(): boolean;
          fps(): number;
          done(): boolean;
        };
      }
    ).__spike = {
      scrollX: () => this.cameras.main.scrollX,
      playerX: () => this.player.x,
      bossRelErr: () =>
        Math.abs(this.boss.x - (this.cameras.main.scrollX + this.scale.width * BOSS_ANCHOR_RATIO)),
      bossRelErrPeak: () => this.bossErrPeak,
      crushed: () => this.crushed,
      onGround: () => (this.player.body as Phaser.Physics.Arcade.Body).blocked.down,
      fps: () => (this.elapsedMs > 0 ? (this.frames * 1000) / this.elapsedMs : 0),
      done: () => this.cameras.main.scrollX >= WORLD_W - this.scale.width - 4,
    };
  }

  override update(_time: number, deltaMs: number): void {
    this.elapsedMs += deltaMs;
    this.frames += 1;
    const cam = this.cameras.main;
    const viewW = this.scale.width;

    // 1) 單向捲軸：相機恆速推進（不跟玩家）、到達世界末端停下。
    const nextScroll = Math.min(cam.scrollX + (CHASE_SPEED * deltaMs) / 1000, WORLD_W - viewW);
    cam.setScroll(nextScroll, 0);

    // 3) 物理邊界共存：壓迫牆以速度貼齊相機左緣——速度夾限防止補差過衝把玩家
    // 吞進牆體後反向分離（推擠走物理解算，上限遠高於捲軸速仍可貼軌）。
    const wallBody = this.wall.body as Phaser.Physics.Arcade.Body;
    const wallTargetX = nextScroll + WALL_W / 2;
    wallBody.setVelocityX(
      Phaser.Math.Clamp(((wallTargetX - this.wall.x) * 1000) / Math.max(1, deltaMs), -400, 400),
    );

    // 玩家 bot：恆右走＋落地週期跳（覆蓋平台與地面路徑）。
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocityX(200);
    if (playerBody.blocked.down && Math.floor(this.elapsedMs / 900) % 2 === 0) {
      playerBody.setVelocityY(-420);
    }

    // 2) boss steering：速度上限逼近錨定點（正弦浮動），沿 noctraFlight 純函式。
    const anchor = {
      x: nextScroll + viewW * BOSS_ANCHOR_RATIO,
      y: 200 + Math.sin(this.elapsedMs * 0.002) * 30,
    };
    const next = approachPoint({ x: this.boss.x, y: this.boss.y }, anchor, BOSS_MAX_SPEED, deltaMs);
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    bossBody.setVelocity(
      ((next.x - this.boss.x) * 1000) / Math.max(1, deltaMs),
      ((next.y - this.boss.y) * 1000) / Math.max(1, deltaMs),
    );
    this.bossErrPeak = Math.max(
      this.bossErrPeak,
      Math.abs(this.boss.x - (nextScroll + viewW * BOSS_ANCHOR_RATIO)),
    );
  }
}
