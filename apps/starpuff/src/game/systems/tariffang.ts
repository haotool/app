import Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { approachPoint } from '../logic/noctraFlight';
import { TARIFFANG, createTariffangFsm, type TariffangCommand } from '../logic/tariffangFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { createBossStagecraft, preloadBossStagecraft } from './bossStagecraft';
import { FX_TEXTURES, ensureFxTextures, spawnTelegraph } from './fx';
import { getVisualScale } from './visualScale';

// 關稅巨獸 Tariffang 呈現層（GAME_DESIGN §122）：與 boss/noctra/prismix/syrona/voidra
// 共用 BossHandle。地面關卡官型：本體駐守海關崗哨（衝撞後換側），威脅來自貨櫃地形
// 改寫、追蹤稅票與封關閘門；phase truth 由 logic/tariffangFsm.ts 持有，本模組僅結算
// 演出/幾何/物理。arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 170;
const BODY_H = 150;
const STAND_Y = GROUND_TOP - BODY_H / 2;
// 崗哨雙側位（衝撞後換側駐守）；歸位沿 approachPoint 逼近（§64 慣例禁座標直寫）。
const STATION_RATIOS = [0.78, 0.22] as const;
const APPROACH_SPEED = 300;
const RAM_SPEED = 560;
const BRASS_TINT = 0xc8a04a;
const CRATE_TINT = 0xb07840;
const GATE_TINT = 0x8a6a3a;
const TICKET_TINT = 0xffd966;
// 貨櫃：地面滑入的移動地形危害；高度低於平台頂（328）保平台避讓路線。
const CRATE_W = 90;
const CRATE_H = 52;
const CRATE_SPEED = 200;
const CRATE_STAGGER_MS = 700;
// 關稅槌：高空落點打擊（直墜）。
const STAMP_FALL_SPEED = 420;
const STAMP_SPREAD_PX = 130;
// 稅票：緩速追蹤後直線（沿 §30 jellord 追蹤彈 homingMs 慣例）。
const TICKET_TRACK_SPEED = 110;
const TICKET_STRAIGHT_SPEED = 260;
const TICKET_TRACK_MS = 2200;
// 封關閘門：雙側寬區由上而下關閉，中央走廊（30%–70%）恆開（anti-softlock）。
const GATE_ZONE_RATIOS = [0.15, 0.85] as const;
const GATE_W_RATIO = 0.3;
const GATE_H = 340;
const GATE_DESCEND_MS = 600;
const GATE_ASCEND_MS = 400;
// arena 浮台 ×3（§74 慣例，getPlatforms 接 GameScene collider）：低台 ×2 貨櫃避讓、
// 高台 ×1（208）滿拍翅可達的衝撞避難位；全數落於封關走廊內。
const PLATFORM_SPECS = [
  { ratio: 0.34, y: 336 },
  { ratio: 0.5, y: 208 },
  { ratio: 0.66, y: 336 },
] as const;
const PLATFORM_W = 140;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近崗哨 → 巨獸滑入蓋章 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [36, 28, 16] as const;

// 佔位材質：正式 sprite 缺件時以海關銅金圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-tariffang', BRASS_TINT, BODY_W, BODY_H);
  bake('boss-tariffang-enraged', 0xd8784a, BODY_W, BODY_H);
  if (!scene.textures.exists('tariffang-ticket')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(TICKET_TINT, 1);
    g.fillRoundedRect(0, 0, 22, 15, 4);
    g.generateTexture('tariffang-ticket', 22, 15);
    g.destroy();
  }
}

export interface TariffangHooks {
  // 焰化燒稅票（§119 burn 命中端結算）：星彈群由 GameScene 的 player 供給，
  // burn 星彈命中稅票即燒毀（穿透續飛）；一般星彈不與稅票互動（吸入才是清票解）。
  playerStars(): Phaser.Physics.Arcade.Group;
}

export interface TariffangOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createTariffang(
  scene: Phaser.Scene,
  hooks: TariffangHooks,
  options: TariffangOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createTariffangFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 崗哨側位索引（衝撞抵達後翻轉）與衝撞目標（null＝駐守歸位）。
  let stationIndex = 0;
  let ramTargetX: number | null = null;
  let starsOverlapWired = false;

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;
  const stationX = () => arenaX(STATION_RATIOS[stationIndex] ?? 0.78);

  const body = scene.physics.add.sprite(arenaX(0.78), -BODY_H, 'boss-tariffang');
  body.setDisplaySize(BODY_W, BODY_H);
  // 物理/視覺縮放解耦（§77 根治）：脈動/死亡收縮走 fx 代理，物理箱恆為基準。
  const vscale = getVisualScale(scene);
  vscale.register(body);
  const fxScale = vscale.fx(body);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  // 動畫組背景補載＋演出件（§127）：前室廊道即補載窗口，缺圖以 base 立繪降級。
  preloadBossStagecraft(scene, 'tariffang');
  const stagecraft = createBossStagecraft(scene, body, {
    kind: 'tariffang',
    bodyW: BODY_W,
    bodyH: BODY_H,
  });

  const projectiles = scene.physics.add.group({ maxSize: 24, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 12, allowGravity: false });

  // arena 浮台（§74 慣例）：單向靜態平台；collider 由 GameScene 接線（getPlatforms）。
  const platforms = PLATFORM_SPECS.map((spec) => {
    const platform = scene.add.rectangle(
      arenaX(spec.ratio),
      spec.y,
      PLATFORM_W,
      16,
      0xe8c890,
      0.95,
    );
    scene.physics.add.existing(platform, true);
    const platformBody = platform.body as Phaser.Physics.Arcade.StaticBody;
    platformBody.checkCollision.down = false;
    platformBody.checkCollision.left = false;
    platformBody.checkCollision.right = false;
    return platform;
  });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  const flashWhite = () => {
    body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    delay(90, () => {
      body.setTintMode(Phaser.TintModes.MULTIPLY);
      body.clearTint();
    });
  };

  // 場上存活稅票數（被動加收夾限用；呈現層事實）。
  const aliveTickets = (): number =>
    projectiles.getMatching('active', true).filter((obj) => {
      return (obj as Phaser.Physics.Arcade.Sprite).getData('ticket') === true;
    }).length;

  // 追蹤稅票（§122 主題）：吸入回收為彈藥（inhalable 旗標走 overlaps 既有管線）、
  // 焰化 burn 星彈可燒毀；壽命有界逾時必回收（§56）。
  const spawnTicket = (x: number, y: number) => {
    const ticket = acquirePooled(projectiles, x, y, 'tariffang-ticket');
    if (!ticket) return;
    ticket.enableBody(true, x, y, true, true);
    ticket.setTexture('tariffang-ticket');
    ticket.setDisplaySize(22, 15);
    ticket.setTint(TICKET_TINT);
    ticket.setData('ticket', true);
    ticket.setData('inhalable', true);
    ticket.setData('homingMs', TICKET_TRACK_MS);
    ticket.setData('ticketUntil', elapsedMs + TARIFFANG.ticketLifeMs);
    const ticketBody = ticket.body as Phaser.Physics.Arcade.Body;
    ticketBody.setAllowGravity(false);
    ticketBody.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-200, -120));
    playSfx('pop', 0.9);
  };

  // 貨物稽查（P1/P2）：「檢查中」邊緣警示 → 貨櫃沿地面滑入橫越全場；
  // 一般單側錯拍（可背板）、EX 雙向同時（質性差分）。
  const doCargo = (count: number, bothSides: boolean) => {
    for (let wave = 0; wave < count; wave += 1) {
      // 遠側滑入（逼近可讀）：玩家在右半場則自左緣入場，橫越全場朝玩家推進。
      const fromLeft = bothSides ? true : (target?.x ?? arenaCx()) > arenaCx();
      const sides = bothSides ? [true, false] : [wave % 2 === 0 ? fromLeft : !fromLeft];
      delay(wave * CRATE_STAGGER_MS, () => {
        if (dying) return;
        for (const left of sides) {
          const startX = left ? arenaLeft() + 30 : arenaLeft() + viewW() - 30;
          spawnTelegraph(scene, startX, GROUND_TOP - CRATE_H / 2, TARIFFANG.cargoTelegraphMs);
          delay(TARIFFANG.cargoTelegraphMs, () => {
            if (dying) return;
            const crate = acquirePooled(shockwaves, startX, GROUND_TOP - CRATE_H / 2, '__WHITE');
            if (!crate) return;
            crate.enableBody(true, startX, GROUND_TOP - CRATE_H / 2, true, true);
            crate.setDisplaySize(CRATE_W, CRATE_H).setTint(CRATE_TINT).setAlpha(0.95);
            (crate.body as Phaser.Physics.Arcade.Body).setVelocityX(
              left ? CRATE_SPEED : -CRATE_SPEED,
            );
            playSfx('metal', 0.7);
            // 壽命 = 橫越全場時間＋緩衝（逾時必回收 §56）。
            delay((viewW() / CRATE_SPEED) * 1000 + 600, () => crate.disableBody(true, true));
          });
        }
      });
    }
  };

  // 關稅槌（P1/P2）：玩家位置夾擊三落點 telegraph → 槌印直墜。
  const doStamp = (count: number) => {
    flashWhite();
    const centerX = target?.x ?? arenaCx();
    for (let i = 0; i < count; i += 1) {
      const x = Phaser.Math.Clamp(
        centerX + (i - (count - 1) / 2) * STAMP_SPREAD_PX,
        arenaLeft() + 40,
        arenaLeft() + viewW() - 40,
      );
      spawnTelegraph(scene, x, GROUND_TOP - 8, TARIFFANG.stampTelegraphMs);
      delay(TARIFFANG.stampTelegraphMs, () => {
        if (dying) return;
        const stamp = acquirePooled(projectiles, x, 30, '__WHITE');
        if (!stamp) return;
        stamp.enableBody(true, x, 30, true, true);
        stamp.setTexture('__WHITE');
        stamp.setDisplaySize(34, 30).setTint(BRASS_TINT).setAlpha(0.95);
        // 稅票身分/壽命戳記由 poolFlags SSOT 取出即復位（§122 審查收斂）；
        // homingMs 沿 §30 jellord 慣例每發必寫。
        stamp.setData('homingMs', 0);
        const stampBody = stamp.body as Phaser.Physics.Arcade.Body;
        stampBody.setAllowGravity(false);
        stampBody.setVelocity(0, STAMP_FALL_SPEED);
        playSfx('pop', 0.7);
      });
    }
  };

  // 主動查帳（P2/P3）：舉章 telegraph 後撒出追蹤稅票（夾限場上上限）。
  const doLevy = (count: number) => {
    scene.tweens.add({ targets: body, angle: -8, duration: 150, yoyo: true, repeat: 1 });
    playSfx('boss-roar', 0.5);
    delay(TARIFFANG.levyTelegraphMs, () => {
      if (dying) return;
      const room = Math.max(0, fsm.ticketCap - aliveTickets());
      for (let i = 0; i < Math.min(count, room); i += 1) {
        delay(i * 160, () => {
          if (!dying) spawnTicket(body.x, body.y - BODY_H * 0.4);
        });
      }
    });
  };

  // 全面封關（P3）：雙側閘門由上而下關閉（中央走廊恆開）；駐留後升起。
  const doGate = (holdMs: number) => {
    playSfx('boss-slam', 0.6);
    for (const ratio of GATE_ZONE_RATIOS) {
      const x = arenaX(ratio);
      const gateW = viewW() * GATE_W_RATIO;
      spawnTelegraph(scene, x, 60, TARIFFANG.gateTelegraphMs);
      delay(TARIFFANG.gateTelegraphMs, () => {
        if (dying) return;
        const gate = acquirePooled(shockwaves, x, -GATE_H / 2, '__WHITE');
        if (!gate) return;
        gate.enableBody(true, x, -GATE_H / 2, true, true);
        gate.setDisplaySize(gateW, GATE_H).setTint(GATE_TINT).setAlpha(0.88);
        (gate.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        playSfx('metal', 0.9);
        scene.tweens.add({
          targets: gate,
          y: GROUND_TOP - GATE_H / 2 + 10,
          duration: GATE_DESCEND_MS,
          ease: 'Sine.easeIn',
          onComplete: () => {
            scene.cameras.main.shake(90, 0.004);
            delay(holdMs, () => {
              if (!gate.active) return;
              scene.tweens.add({
                targets: gate,
                y: -GATE_H / 2,
                duration: GATE_ASCEND_MS,
                ease: 'Sine.easeIn',
                onComplete: () => gate.disableBody(true, true),
              });
            });
          },
        });
      });
    }
  };

  // 高速衝撞（P3）：三拍閃白前搖 → 直線衝向對側崗哨（跳＋拍翅可越，§58 慣例）；
  // 抵達即換側駐守，位移全程走 approachPoint 速度上限（禁瞬移）。
  const doRam = () => {
    for (let i = 0; i < 3; i += 1) {
      delay((TARIFFANG.ramTelegraphMs / 3) * i, () => {
        if (!dying) flashWhite();
      });
    }
    scene.tweens.add({ targets: body, angle: 6, duration: 80, yoyo: true, repeat: 4 });
    delay(TARIFFANG.ramTelegraphMs, () => {
      if (dying) return;
      stationIndex = stationIndex === 0 ? 1 : 0;
      ramTargetX = stationX();
      playSfx('boss-slam');
    });
  };

  // 三招分鏡映射（§127）：本體發招類接 move 幀組（gate/ram 為場地機關與衝撞，
  // 沿用既有 telegraph 演出）；分鏡窗＝該招既有 telegraph 時長，時序零改變。
  const runCommand = (command: TariffangCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'cargo':
        stagecraft.moveCinematic(1, TARIFFANG.cargoTelegraphMs);
        doCargo(command.count, command.bothSides);
        return;
      case 'stamp':
        stagecraft.moveCinematic(2, TARIFFANG.stampTelegraphMs);
        doStamp(command.count);
        return;
      case 'levy':
        stagecraft.moveCinematic(3, TARIFFANG.levyTelegraphMs);
        doLevy(command.count);
        return;
      case 'gate':
        doGate(command.holdMs);
        return;
      case 'ram':
        doRam();
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

  // 焰化燒稅票（§119 形態優勢）：burn 星彈命中稅票即燒毀且穿透續飛；
  // 一般星彈不與稅票互動（吸入清票／走位等票期滿為保底解）。
  const wireStarsOverlap = () => {
    if (starsOverlapWired) return;
    starsOverlapWired = true;
    scene.physics.add.overlap(hooks.playerStars(), projectiles, (a, b) => {
      const aIsProjectile = (projectiles.getChildren() as unknown[]).includes(a);
      const ticket = (aIsProjectile ? a : b) as Phaser.Physics.Arcade.Sprite;
      const star = (aIsProjectile ? b : a) as Phaser.Physics.Arcade.Sprite;
      if (!star.active || !ticket.active) return;
      if (ticket.getData('ticket') !== true) return;
      if (star.getData('burn') !== true) return;
      ticket.disableBody(true, true);
      // 燒毀演出：單次爆散後即銷毀發射器（不入長駐粒子預算）。
      const burnFx = scene.add
        .particles(ticket.x, ticket.y, FX_TEXTURES.dot, {
          speed: { min: 40, max: 110 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.9, end: 0 },
          lifespan: 320,
          tint: [0xff8a50, 0xffd966],
          emitting: false,
        })
        .setDepth(4);
      burnFx.explode(6);
      delay(420, () => burnFx.destroy());
      playSfx('break', 0.8);
    });
  };

  // 死亡冪等（§74 慣例）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    ramTargetX = null;
    stagecraft.playDeath();
    scene.tweens.killTweensOf(body);
    vscale.killFxTweens(body);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    delay(600, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 420, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: body, alpha: 0, duration: 420, ease: 'Back.easeIn' });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    // 加收費用（§122 P2 主題）：星彈命中即生追蹤稅票（FSM 節流＋場上上限夾限）。
    if (source === 'star' && fsm.tryTax() && aliveTickets() < fsm.ticketCap) {
      spawnTicket(body.x, body.y - BODY_H * 0.4);
    }
    for (const event of fsm.takeDamage(amount)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          stagecraft.hitFlash();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: amount,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          // 狂暴轉段（§17/§127）：P2 播轉段幀序後落 enraged（換裝語義不變，
          // 顯示尺寸與 vscale 基準由 stagecraft 換幀單點回寫）。
          if (event.phase === 'p2') {
            stagecraft.phaseTransition('p2');
            playSfx('boss-roar', 1.1);
            scene.cameras.main.flash(280, 255, 190, 120);
          } else if (event.phase === 'p3') {
            stagecraft.phaseTransition('p3');
            playSfx('boss-roar', 1.3);
            scene.cameras.main.flash(320, 255, 150, 90);
            scene.cameras.main.shake(200, 0.007);
          }
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

  // 入場：關稅巨獸自右側滑入崗哨（與升起/降臨型區隔——「進站」語彙）；
  // entry 四幀鋪在既有節拍（滑入→進站→咆哮→起勢），時序零改變（§127）。
  const introSlide = () => {
    stagecraft.entryFrame(1);
    body.setPosition(arenaLeft() + viewW() + BODY_W, STAND_Y);
    scene.tweens.add({
      targets: body,
      x: arenaX(0.78),
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        stagecraft.entryFrame(2);
        playSfx('boss-slam');
        scene.cameras.main.shake(120, 0.006);
        introRoar();
      },
    });
  };

  const introRoar = () => {
    stagecraft.entryFrame(3);
    emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
    playSfx('boss-roar');
    scene.tweens.add({
      targets: fxScale,
      sx: 1.12,
      sy: 1.1,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    delay(INTRO_ROAR_MS, introReset);
  };

  const introReset = () => {
    stagecraft.entryFrame(4);
    const cam = scene.cameras.main;
    cam.pan(arenaCx(), VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
    cam.zoomTo(1, INTRO_RESET_MS, 'Sine.easeInOut');
    delay(INTRO_RESET_MS, () => {
      active = true;
      stagecraft.endEntry();
      // EX 入場變色（§58 慣例）：緋紅呼吸循環作為變體識別基調。
      if (ex) {
        scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 900,
          yoyo: true,
          repeat: -1,
          onUpdate: (tween) => {
            if (dying) return;
            const v = tween.getValue() ?? 0;
            const mix = (a: number, b: number) => Math.round(a + (b - a) * v);
            body.setTint((mix(255, 216) << 16) | (mix(255, 75) << 8) | mix(255, 106));
          },
        });
      }
    });
  };

  return {
    spawn() {
      wireStarsOverlap();
      const cam = scene.cameras.main;
      const [red, green, blue] = INTRO_FADE_RGB;
      const focusX = arenaX(0.78);
      const focusY = VIEW.height / INTRO_ZOOM / 2;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(focusX, focusY, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS * 0.5, introSlide);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageInternal(amount, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      stagecraft.idleBreath(deltaMs);
      // 距離帶餵送（§111.1 條件欄）。
      fsm.setTargetDistance(
        target ? Phaser.Math.Distance.Between(body.x, body.y, target.x, target.y) : null,
      );
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 駐守/衝撞一律 approachPoint 速度上限逼近（§64 慣例禁座標直寫）：
      // 衝撞期以 RAM_SPEED 直奔對側崗哨，抵達即回駐守節奏。
      const bob = Math.sin(elapsedMs * 0.0022) * 4;
      const ramming = ramTargetX !== null;
      const goal = ramming
        ? { x: ramTargetX ?? stationX(), y: STAND_Y }
        : { x: stationX(), y: STAND_Y + bob };
      const next = approachPoint(
        { x: body.x, y: body.y },
        goal,
        (ramming ? RAM_SPEED : APPROACH_SPEED) * fsm.speedFactor,
        deltaMs,
      );
      body.setPosition(next.x, next.y);
      if (ramming && Math.abs(body.x - (ramTargetX ?? 0)) < 2) {
        ramTargetX = null;
        scene.cameras.main.shake(110, 0.005);
        playSfx('metal', 0.8);
      }
      body.setFlipX((target?.x ?? body.x) < body.x);
      body.setRotation(fsm.state === 'idle' ? 0.05 : 0);
      // 稅票追蹤（沿 §30 homingMs 慣例）＋壽命逾時回收（§56）；出界回收。
      projectiles.getMatching('active', true).forEach((obj) => {
        const shot = obj as Phaser.Physics.Arcade.Sprite;
        const shotBody = shot.body as Phaser.Physics.Arcade.Body;
        if (shot.getData('ticket') === true) {
          if (elapsedMs >= ((shot.getData('ticketUntil') as number) ?? 0)) {
            killProjectile(shot);
            return;
          }
          const homingMs = (shot.getData('homingMs') as number | undefined) ?? 0;
          if (homingMs > 0) {
            const remaining = homingMs - deltaMs;
            shot.setData('homingMs', Math.max(0, remaining));
            if (remaining > 0 && target) {
              scene.physics.moveTo(shot, target.x, target.y, TICKET_TRACK_SPEED);
            } else {
              const heading = Math.atan2(shotBody.velocity.y, shotBody.velocity.x);
              shotBody.setVelocity(
                Math.cos(heading) * TICKET_STRAIGHT_SPEED,
                Math.sin(heading) * TICKET_STRAIGHT_SPEED,
              );
            }
          }
          shot.setRotation(shot.rotation + deltaMs * 0.006);
        }
        if (
          shot.y > GROUND_TOP + 20 ||
          shot.y < -60 ||
          shot.x < arenaLeft() - 60 ||
          shot.x > arenaLeft() + viewW() + 60
        ) {
          killProjectile(shot);
        }
      });
      // 貨櫃出界回收（閘門由 tween 生命週期自管）。
      shockwaves.getMatching('active', true).forEach((obj) => {
        const wave = obj as Phaser.Physics.Arcade.Sprite;
        if (wave.x < arenaLeft() - 120 || wave.x > arenaLeft() + viewW() + 120) {
          killProjectile(wave);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      stagecraft.destroy();
      scene.tweens.killTweensOf(body);
      vscale.unregister(body);
      body.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      platforms.forEach((platform) => platform.destroy());
    },
    isActive() {
      return active;
    },
    // 頭頂 hit window（§58）：下砸命中頭頂觸發短暈（衝撞中免疫，FSM 裁決）。
    trySlamStun() {
      if (!active || dying) return false;
      const stunned = fsm.stun(TARIFFANG.slamStunMs);
      if (stunned) {
        scene.tweens.add({ targets: body, angle: -10, duration: 120, yoyo: true, repeat: 2 });
      }
      return stunned;
    },
    getBody() {
      return body;
    },
    getProjectiles() {
      return projectiles;
    },
    getShockwaves() {
      return shockwaves;
    },
    setTarget(next: { x: number; y: number } | null) {
      target = next;
    },
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
    // arena 浮台（§74 慣例）：GameScene 接玩家 collider。
    getPlatforms() {
      return platforms;
    },
    // e2e 觀測（§83 慣例）：FSM 階段/招式即時值。
    getDebugState() {
      return { phase: fsm.phase, state: fsm.state };
    },
  };
}
