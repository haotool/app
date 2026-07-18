import Phaser from 'phaser';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import {
  EX_PRISMIX,
  PRISMIX,
  createPrismixFsm,
  type PrismixCommand,
  type PrismixSide,
} from '../logic/prismixFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { spawnTelegraph } from './fx';

// 稜晶雙子 Prismix 呈現層（GAME_DESIGN §67）：與 boss/noctra 共用 BossHandle 介面。
// 分裂型三段：P1 合體單體 → P2 鏡像雙子（雙本體、獨立血條）→ P3 裂核＋碎晶盾。
// phase truth 一律由 logic/prismixFsm.ts 持有，本模組僅結算演出與物理。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 170;
const BODY_H = 150;
const STAND_Y = GROUND_TOP - BODY_H / 2;
// 雙子縮比（§67）：同貼圖 0.72x 鏡像＋冷暖 tint 區分，零第二張素材。
const TWIN_SCALE = 0.72;
const TWIN_W = BODY_W * TWIN_SCALE;
const TWIN_H = BODY_H * TWIN_SCALE;
const TWIN_STAND_Y = GROUND_TOP - TWIN_H / 2;
const TWIN_TINT_A = 0xffd8e8;
const TWIN_TINT_B = 0xc8e8ff;
// P1 緩滑追近速度（px/s）與活動邊距。
const GLIDE_SPEED = 60;
const SIDE_MARGIN_X = 150;
// 晶柱/光束/晶雨參數（走 shockwaves／projectiles 既有結算管線）。
const PILLAR_W = 26;
const PILLAR_H = 96;
const PILLAR_GAP_PX = 170;
const PILLAR_ACTIVE_MS = 560;
const BEAM_H = 24;
const BEAM_ACTIVE_MS = 320;
const BEAM_LOW_Y = STAND_Y + 8;
const BEAM_HIGH_Y = STAND_Y - 78;
const PINCER_DASH_MS = 520;
const RAIN_FALL_SPEED = 250;
const RAIN_GAP_PX = 180;
const BARRAGE_SPEED = 165;
// P3 碎晶盾軌道：半徑與角速度；各盾 1 發星彈可破。
const SHARD_ORBIT_R = 95;
const SHARD_SPIN_RAD_PER_MS = 0.0012;
const CRYSTAL_TINT = 0xc5a8e8;
const CORE_TINT = 0x9a7ad0;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近王殿 → 稜晶自天緩降落定 → 稜光共鳴 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [26, 20, 42] as const;

// 佔位材質：正式 sprite 缺件時以稜形烘焙保底避免 runtime crash（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('boss-prismix')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(CRYSTAL_TINT, 1);
    g.fillEllipse(BODY_W / 2, BODY_H / 2, BODY_W, BODY_H);
    g.generateTexture('boss-prismix', BODY_W, BODY_H);
    g.destroy();
  }
  if (!scene.textures.exists('prismix-shot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xd8c8f5, 1);
    g.fillCircle(9, 9, 9);
    g.generateTexture('prismix-shot', 18, 18);
    g.destroy();
  }
  if (!scene.textures.exists('prismix-shard')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe8dcff, 1);
    g.fillTriangle(11, 0, 22, 26, 0, 26);
    g.generateTexture('prismix-shard', 22, 26);
    g.destroy();
  }
}

export interface PrismixHooks {
  // 召喚 mirri（§67 P2）：由 GameScene 依場上現量夾限至 cap，走正式 spawn 管線。
  summonMirri(cap: number): void;
  // 雙子連破（§67/§69）：GameScene 餵彩蛋觸發器＋全屏稜光演出。
  onTwinFinish(): void;
}

export interface PrismixOptions {
  ex?: boolean;
  // 前室魔王關（§68）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createPrismix(
  scene: Phaser.Scene,
  hooks: PrismixHooks,
  options: PrismixOptions,
): BossHandle {
  ensureTextures(scene);

  const ex = options.ex === true;
  const fsm = createPrismixFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  // 雙子期間主本體隱藏停用；damage number 錨點跟隨最後受擊側。
  let twinsAlive = false;
  let struggleSide: PrismixSide | null = null;

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaCx = () => arenaLeft() + viewW() / 2;
  const clampArenaX = (x: number, margin: number) =>
    Phaser.Math.Clamp(x, arenaLeft() + margin, arenaLeft() + viewW() - margin);

  const core = scene.physics.add.sprite(arenaCx(), -BODY_H, 'boss-prismix');
  core.setDisplaySize(BODY_W, BODY_H);
  const coreBody = core.body as Phaser.Physics.Arcade.Body;
  coreBody.setAllowGravity(false);
  coreBody.setImmovable(true);
  coreBody.setSize(core.width * 0.85, core.height * 0.85);

  const makeTwin = (tint: number): Phaser.Physics.Arcade.Sprite => {
    const twin = scene.physics.add.sprite(arenaCx(), TWIN_STAND_Y, 'boss-prismix');
    twin.setDisplaySize(TWIN_W, TWIN_H);
    twin.setTint(tint);
    const body = twin.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(twin.width * 0.85, twin.height * 0.85);
    twin.setVisible(false);
    body.enable = false;
    return twin;
  };
  const twinA = makeTwin(TWIN_TINT_A);
  const twinB = makeTwin(TWIN_TINT_B);
  twinB.setFlipX(true);

  const projectiles = scene.physics.add.group({ maxSize: 20 });
  const shockwaves = scene.physics.add.group({ maxSize: 8, allowGravity: false });
  const shields = scene.physics.add.group({ maxSize: 8, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 常駐晶體浮動；夾擊/演出 tween 接管期間讓位。
  let steering = true;
  let hoverMs = 0;

  const flashWhite = (sprite: Phaser.Physics.Arcade.Sprite, restore: number | null) => {
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    delay(90, () => {
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      if (restore === null) sprite.clearTint();
      else sprite.setTint(restore);
    });
  };

  const shake = (sprite: Phaser.Physics.Arcade.Sprite) => {
    scene.tweens.add({ targets: sprite, angle: 4, duration: 45, yoyo: true, repeat: 3 });
  };

  const emitTwinHp = () => {
    const twins = fsm.twins;
    emitGameEvent(scene.events, GameEvents.BOSS_TWIN_HP, {
      hpA: twins?.a ?? 0,
      hpB: twins?.b ?? 0,
      maxHp: fsm.maxHp,
      active: twins !== null,
    });
  };

  const sideSprite = (side: PrismixSide) => (side === 'a' ? twinA : twinB);
  const sideTint = (side: PrismixSide) => (side === 'a' ? TWIN_TINT_A : TWIN_TINT_B);

  // 受擊側歸屬（§67）：以最近存活本體結算；非 P2 一律主本體。
  const nearestSide = (x: number, y: number): PrismixSide => {
    if (!twinsAlive) return 'a';
    const twins = fsm.twins;
    const aAlive = (twins?.a ?? 0) > 0;
    const bAlive = (twins?.b ?? 0) > 0;
    if (aAlive !== bAlive) return aAlive ? 'a' : 'b';
    const da = Phaser.Math.Distance.Between(x, y, twinA.x, twinA.y);
    const db = Phaser.Math.Distance.Between(x, y, twinB.x, twinB.y);
    return da <= db ? 'a' : 'b';
  };

  const spawnShot = (x: number, y: number): Phaser.Physics.Arcade.Sprite | null => {
    const shot = projectiles.get(x, y, 'prismix-shot') as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    shot.setTint(0xd8c8f5);
    shot.setData('reflected', false);
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    return shot;
  };

  // 晶柱衝擊（§67 P1）：地面尖晶隆起 x3——落點預警後自地升起，走 shockwaves 管線。
  const doPillar = (count: number) => {
    const centerX = clampArenaX(target?.x ?? arenaCx(), 80);
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * PILLAR_GAP_PX;
      const x = clampArenaX(centerX + offset, 40);
      spawnTelegraph(scene, x, GROUND_TOP - 6, PRISMIX.pillarTelegraphMs);
      delay(PRISMIX.pillarTelegraphMs, () => {
        if (dying) return;
        const spike = shockwaves.get(
          x,
          GROUND_TOP - PILLAR_H / 2,
          'prismix-shard',
        ) as Phaser.Physics.Arcade.Sprite | null;
        if (!spike) return;
        spike.enableBody(true, x, GROUND_TOP - PILLAR_H / 2, true, true);
        spike.setDisplaySize(PILLAR_W, PILLAR_H).setTint(CRYSTAL_TINT);
        spike.setScale(spike.scaleX, 0.2);
        playSfx('break', 0.8);
        scene.tweens.add({
          targets: spike,
          scaleY: PILLAR_H / spike.height,
          duration: 140,
          ease: 'Back.easeOut',
        });
        delay(PILLAR_ACTIVE_MS, () => spike.disableBody(true, true));
      });
    }
  };

  // 折射光束（§67）：預示線閃爍後橫掃帶狀判定；low/high 供 P2 交錯光束複用。
  const fireBeam = (from: Phaser.Physics.Arcade.Sprite, beamY: number) => {
    const lineX = arenaCx();
    const line = scene.add.rectangle(lineX, beamY, viewW(), 4, 0xffffff, 0.55).setDepth(58);
    scene.tweens.add({
      targets: line,
      alpha: { from: 0.55, to: 0.15 },
      duration: 130,
      yoyo: true,
      repeat: 2,
      onComplete: () => line.destroy(),
    });
    flashWhite(from, twinsAlive ? (from === twinA ? TWIN_TINT_A : TWIN_TINT_B) : null);
    delay(PRISMIX.beamTelegraphMs, () => {
      if (dying) return;
      playSfx('zap', 0.8);
      const beam = shockwaves.get(lineX, beamY, '__WHITE') as Phaser.Physics.Arcade.Sprite | null;
      if (!beam) return;
      beam.enableBody(true, lineX, beamY, true, true);
      beam.setDisplaySize(viewW(), BEAM_H).setTint(0xe8d8ff).setAlpha(0.85);
      delay(BEAM_ACTIVE_MS, () => beam.disableBody(true, true));
    });
  };

  // 雙生夾擊（§67 P2）：同步閃爍前搖後左右對衝互換位，跳越可躲；交會後雙側僵直。
  const doPincer = () => {
    steering = false;
    const fromAx = twinA.x;
    const fromBx = twinB.x;
    [twinA, twinB].forEach((twin) => {
      flashWhite(twin, sideTint(twin === twinA ? 'a' : 'b'));
      shake(twin);
    });
    playSfx('boss-roar', 1.3);
    const dash = (twin: Phaser.Physics.Arcade.Sprite, toX: number, delayMs: number) => {
      delay(PRISMIX.pincerTelegraphMs + delayMs, () => {
        if (dying || !twin.visible) return;
        scene.tweens.add({
          targets: twin,
          x: toX,
          duration: PINCER_DASH_MS / fsm.speedFactor,
          ease: 'Quad.easeInOut',
          onStart: () => playSfx('flap', 0.6),
        });
      });
    };
    // EX 去同步（§67）：雙子相位錯半拍，讀招難度升級。
    dash(twinA, fromBx, 0);
    dash(twinB, fromAx, ex ? EX_PRISMIX.desyncMs : 0);
    delay(PRISMIX.pincerTelegraphMs + PINCER_DASH_MS + (ex ? EX_PRISMIX.desyncMs : 0) + 60, () => {
      steering = true;
    });
  };

  // 交錯光束（§67 P2）：一具掃地面帶、一具掃空中帶，站位讀招。
  const doCrossbeam = () => {
    fireBeam(twinA, BEAM_LOW_Y);
    delay(ex ? EX_PRISMIX.desyncMs : 140, () => {
      if (!dying) fireBeam(twinB, BEAM_HIGH_Y);
    });
  };

  // 召喚鏡蟲（§67 P2）：短促蓄勢後由 GameScene 依 cap 補場。
  const doSummon = (cap: number) => {
    [twinA, twinB].forEach((twin) => {
      if (!twin.visible) return;
      flashWhite(twin, sideTint(twin === twinA ? 'a' : 'b'));
    });
    playSfx('charge');
    delay(260, () => {
      if (!dying) hooks.summonMirri(cap);
    });
  };

  // 全域折射彈幕（§67 P3）：放射彈環自裂核射出。
  const doBarrage = (count: number) => {
    flashWhite(core, CORE_TINT);
    playSfx('starstorm', 1.2);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const shot = spawnShot(core.x, core.y);
      if (!shot) continue;
      shot.setVelocity(Math.cos(angle) * BARRAGE_SPEED, Math.sin(angle) * BARRAGE_SPEED);
    }
  };

  // 晶雨（§67 P3）：落點預警後晶塊直墜。
  const doRain = (count: number) => {
    const centerX = clampArenaX(target?.x ?? arenaCx(), 80);
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * RAIN_GAP_PX;
      const x = clampArenaX(centerX + offset, 40);
      spawnTelegraph(scene, x, GROUND_TOP - 6, PRISMIX.rainTelegraphMs + 300);
      delay(PRISMIX.rainTelegraphMs, () => {
        if (dying) return;
        const shard = spawnShot(x, -14);
        if (!shard) return;
        shard.setTexture('prismix-shard').setTint(CRYSTAL_TINT);
        shard.setVelocity(0, RAIN_FALL_SPEED * fsm.speedFactor);
      });
    }
  };

  // P2 分裂演出（§67）：主本體隱沒，雙子自中心彈出左右鏡像位。
  const doSplit = () => {
    twinsAlive = true;
    playSfx('break');
    scene.cameras.main.flash(220, 235, 220, 255);
    core.setVisible(false);
    coreBody.enable = false;
    const cx = arenaCx();
    [twinA, twinB].forEach((twin, index) => {
      const dir = index === 0 ? -1 : 1;
      twin.setPosition(cx + dir * 30, TWIN_STAND_Y);
      twin.setVisible(true).setAlpha(1).setAngle(0);
      twin.setDisplaySize(TWIN_W, TWIN_H);
      (twin.body as Phaser.Physics.Arcade.Body).enable = true;
      scene.tweens.add({
        targets: twin,
        x: cx + dir * 150,
        duration: 420,
        ease: 'Back.easeOut',
      });
    });
    emitTwinHp();
  };

  // 殘核掙扎（§67）：擊破側碎裂消散；存活側體色轉暗＋搖擺（telegraph）。
  const doStruggle = (survivor: PrismixSide) => {
    struggleSide = survivor;
    const dead = sideSprite(survivor === 'a' ? 'b' : 'a');
    playSfx('break');
    scene.tweens.add({
      targets: dead,
      alpha: 0,
      scaleX: dead.scaleX * 0.2,
      scaleY: dead.scaleY * 0.2,
      angle: 40,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        dead.setVisible(false);
        (dead.body as Phaser.Physics.Arcade.Body).enable = false;
      },
    });
    const alive = sideSprite(survivor);
    alive.setTint(0x8a7aa8);
    scene.tweens.add({
      targets: alive,
      angle: { from: -6, to: 6 },
      duration: 160,
      yoyo: true,
      repeat: 5,
    });
    emitTwinHp();
  };

  // P3 合體（§67）：存活具吸收殘核化為裂核；環繞碎晶盾登場。
  const doMerge = (coreHp: number, shardCount: number) => {
    void coreHp;
    twinsAlive = false;
    struggleSide = null;
    const survivor = twinA.visible ? twinA : twinB;
    playSfx('boss-roar', 0.9);
    scene.cameras.main.flash(260, 220, 205, 255);
    core.setPosition(survivor.x, STAND_Y);
    survivor.setVisible(false);
    (survivor.body as Phaser.Physics.Arcade.Body).enable = false;
    core.setVisible(true).setAlpha(1);
    coreBody.enable = true;
    core.setTint(CORE_TINT);
    scene.tweens.add({
      targets: core,
      x: arenaCx(),
      duration: 420,
      ease: 'Sine.easeInOut',
    });
    for (let i = 0; i < shardCount; i += 1) {
      const shard = shields.get(
        core.x,
        core.y,
        'prismix-shard',
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!shard) continue;
      shard.enableBody(true, core.x, core.y, true, true);
      shard.setTint(0xe8dcff);
      shard.setData('orbitIndex', i);
      (shard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
    emitTwinHp();
    emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: 'p3' });
  };

  const runCommand = (command: PrismixCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'pillar':
        doPillar(command.count);
        return;
      case 'beam':
        fireBeam(core, BEAM_LOW_Y);
        return;
      case 'pincer':
        doPincer();
        return;
      case 'crossbeam':
        doCrossbeam();
        return;
      case 'summon':
        doSummon(command.cap);
        return;
      case 'barrage':
        doBarrage(command.count);
        return;
      case 'rain':
        doRain(command.count);
        return;
      case 'merge':
        doMerge(command.coreHp, command.shards);
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  // 死亡冪等（§67）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    [core, twinA, twinB].forEach((sprite) => scene.tweens.killTweensOf(sprite));
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    shields.getMatching('active', true).forEach(killProjectile);
    const anchor = twinsAlive ? sideSprite(struggleSide ?? 'a') : core;
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: anchor.x, y: anchor.y });
    delay(600, () => {
      [core, twinA, twinB].forEach((sprite) => {
        if (!sprite.visible) return;
        scene.tweens.add({
          targets: sprite,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 420,
          ease: 'Back.easeIn',
        });
      });
    });
  };

  const applyDamageWithSide = (amount: number, side: PrismixSide, source?: BossDamageSource) => {
    if (!active) return;
    if (source === 'volt' && fsm.interruptSummon()) {
      playSfx('break');
      [twinA, twinB].forEach((twin) => twin.visible && shake(twin));
    }
    for (const event of fsm.takeDamage(amount, side)) {
      switch (event.kind) {
        case 'damaged': {
          const hitSprite = twinsAlive ? sideSprite(struggleSide ?? side) : core;
          // damage number 錨點（fx.attachBoss 綁主本體）：隱藏期跟隨受擊側。
          if (twinsAlive) core.setPosition(hitSprite.x, hitSprite.y);
          flashWhite(
            hitSprite,
            twinsAlive
              ? struggleSide !== null
                ? 0x8a7aa8
                : sideTint(struggleSide ?? side)
              : fsm.phase === 'p3'
                ? CORE_TINT
                : null,
          );
          shake(hitSprite);
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: amount,
          });
          if (twinsAlive) emitTwinHp();
          break;
        }
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          break;
        case 'split':
          doSplit();
          break;
        case 'struggle':
          doStruggle(event.survivor);
          break;
        case 'twinFinish':
          hooks.onTwinFinish();
          break;
        case 'minionDrop':
          minionHandlers.forEach((handler) => handler());
          break;
        case 'defeated':
          dieSequence();
          break;
        default: {
          const unhandled: never = event;
          throw new Error(`未知事件：${String(unhandled)}`);
        }
      }
    }
  };

  // 入場：稜晶自天緩降落定＋稜光共鳴（與地面型三段落座、空中型俯掠區隔）。
  const introDescend = () => {
    core.setPosition(arenaCx(), -BODY_H);
    scene.tweens.add({
      targets: core,
      y: STAND_Y,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        playSfx('boss-slam');
        scene.cameras.main.shake(120, 0.006);
        introRoar();
      },
    });
  };

  const introRoar = () => {
    emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
    playSfx('boss-roar');
    scene.tweens.add({
      targets: core,
      scaleX: core.scaleX * 1.12,
      scaleY: core.scaleY * 1.1,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    delay(INTRO_ROAR_MS, introReset);
  };

  const introReset = () => {
    const cam = scene.cameras.main;
    cam.pan(arenaCx(), VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
    cam.zoomTo(1, INTRO_RESET_MS, 'Sine.easeInOut');
    delay(INTRO_RESET_MS, () => {
      active = true;
      // EX 入場變色（§58 慣例）：緋紅呼吸循環作為變體識別基調。
      if (ex) {
        scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 900,
          yoyo: true,
          repeat: -1,
          onUpdate: (tween) => {
            if (twinsAlive || dying) return;
            const v = tween.getValue() ?? 0;
            const mix = (a: number, b: number) => Math.round(a + (b - a) * v);
            core.setTint((mix(255, 216) << 16) | (mix(255, 75) << 8) | mix(255, 106));
          },
        });
      }
    });
  };

  return {
    spawn() {
      const cam = scene.cameras.main;
      const [red, green, blue] = INTRO_FADE_RGB;
      const focusX = arenaCx();
      const focusY = VIEW.height / INTRO_ZOOM / 2;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(focusX, focusY, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS * 0.5, introDescend);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageWithSide(amount, nearestSide(target?.x ?? core.x, target?.y ?? core.y), source);
    },
    applyDamageAt(amount: number, x: number, y: number, source?: BossDamageSource) {
      applyDamageWithSide(amount, nearestSide(x, y), source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      if (steering) {
        hoverMs += deltaMs * fsm.speedFactor;
        const bob = Math.sin(hoverMs * 0.003) * 6;
        if (!twinsAlive) {
          // P1/P3 緩滑追近：朝玩家 x 慢速滑移，保持稜晶壓迫感。
          const desired = clampArenaX(target?.x ?? core.x, SIDE_MARGIN_X);
          const step = (GLIDE_SPEED * deltaMs) / 1000;
          if (Math.abs(desired - core.x) > step) {
            core.x += Math.sign(desired - core.x) * step;
          }
          core.y = STAND_Y + bob;
          core.setFlipX((target?.x ?? core.x) < core.x);
        } else if (struggleSide === null) {
          // 雙子鏡像浮動：同一驅動左右對稱（單份邏輯鏡像執行）。
          twinA.y = TWIN_STAND_Y + bob;
          twinB.y = TWIN_STAND_Y - bob;
        }
      }
      // 碎晶盾軌道（§67 P3）：繞核公轉；被擊破的盾自然缺位。
      const orbitBase = scene.time.now * SHARD_SPIN_RAD_PER_MS;
      const shardCount = ex ? EX_PRISMIX.shardOrbitCount : PRISMIX.shardOrbitCount;
      shields.getMatching('active', true).forEach((obj) => {
        const shard = obj as Phaser.Physics.Arcade.Sprite;
        const index = (shard.getData('orbitIndex') as number) ?? 0;
        const angle = orbitBase + (Math.PI * 2 * index) / shardCount;
        shard.setPosition(
          core.x + Math.cos(angle) * SHARD_ORBIT_R,
          core.y + Math.sin(angle) * SHARD_ORBIT_R,
        );
        shard.setRotation(angle + Math.PI / 2);
      });
      // 出界/落地回收（anti-softlock §56 投射物壽命慣例）。
      projectiles.getMatching('active', true).forEach((obj) => {
        const shot = obj as Phaser.Physics.Arcade.Sprite;
        if (
          shot.y > GROUND_TOP + 20 ||
          shot.y < -40 ||
          shot.x < arenaLeft() - 60 ||
          shot.x > arenaLeft() + viewW() + 60
        ) {
          killProjectile(shot);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      [core, twinA, twinB].forEach((sprite) => {
        scene.tweens.killTweensOf(sprite);
        sprite.destroy();
      });
      projectiles.destroy(true);
      shockwaves.destroy(true);
      shields.destroy(true);
    },
    isActive() {
      return active;
    },
    // 分裂型無下砸暈窗（§67）：命中頭頂僅回彈免體傷，不觸發僵直。
    trySlamStun() {
      return false;
    },
    getBody() {
      return core;
    },
    getBodies() {
      return [core, twinA, twinB];
    },
    getProjectiles() {
      return projectiles;
    },
    getShockwaves() {
      return shockwaves;
    },
    getShields() {
      return shields;
    },
    setTarget(next: { x: number; y: number } | null) {
      target = next;
    },
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
  };
}
