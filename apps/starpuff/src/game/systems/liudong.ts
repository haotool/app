import Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind, TransformForm } from '../core/types';
import { approachPoint } from '../logic/noctraFlight';
import {
  LIUDONG,
  createLiudongFsm,
  type LiudongCommand,
  type MarketKind,
} from '../logic/liudongFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { ensureFxTextures, spawnTelegraph } from './fx';
import { createLiudongCinematics } from './liudongCinematics';
import { getVisualScale } from './visualScale';

// 劉董・崩盤之王呈現層（GAME_DESIGN §125，PRD §6）：與九王共用 BossHandle。
// 地面持機型：西裝黑狗董事長於地面帶緩步持機（approachPoint 逼近錨點，禁座標
// 直寫），威脅來自三市場攻擊（思考泡泡預告即機制）、全屏下跌箭頭（≥1 通行路線
// 恆開）、牛熊召喚與 P3 終局招；入場/思考/下單/轉段/死亡演出委派
// liudongCinematics.ts（幀數遠超既有魔王，§106 strangler 紀律）。phase truth 由
// logic/liudongFsm.ts 持有。arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。
// 迷因安全（PRD §1.5）：全虛構圖像與代號、零真實品牌/人物/股票代號；
// 「本關純屬虛構迷因，非投資建議」角標由本模組常駐顯示。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 170;
const BODY_H = 150;
const APPROACH_SPEED = 170;
// 持機踱步錨：偏場右側緩幅擺動（executive 持機語彙）。
const PACE_FREQ = 0.0004;
const PACE_AMP_RATIO = 0.1;
const PACE_ANCHOR_RATIO = 0.68;
// 彈體速度。
const COIN_FALL_SPEED = 230;
const ARROW_FALL_SPEED_BIG = 200;
const ARROW_FALL_SPEED_SMALL = 300;
const PIN_DROP_SPEED = 420;
const NOTICE_FALL_SPEED = 90;
const CHAIN_SPEED = 190;
// K 線柱／熔斷牆幾何。
const PILLAR_W = 34;
const PILLAR_H = 120;
const WALL_W_RATIO = 0.09;
const LASER_H = 26;
// 全屏箭雨：車道數與通行保證（PRD §6.5 固定保留 ≥1 條可通行路線）。
const ARROW_LANES = 6;
// 末日箭走廊寬（白輪廓；EX 窄通道，PRD §6.7）。
const CORRIDOR_W = 132;
const CORRIDOR_W_NARROW = 84;
// 最後轉帳黑洞：玩家牽引（恆低於玩家全速 220，交叉不變式 16）。
const BLACKHOLE_PULL_PX_PER_SEC = 130;
const BLACKHOLE_Y = 150;
// 首見新招減速（PRD §6.7）：彈體速度倍率由指令 firstSeen 消費。
const DISCLAIMER_DEPTH = 61;

// 市場攻擊 → 對應召喚小怪（PRD §6.6 P1「召喚對應小怪」）：全市場均召小熊市
//（L27 前置教學品種——下跌箭頭語彙一致）。
const MARKET_MINION: Record<MarketKind, EnemyKind> = {
  usstock: 'bearlet',
  crypto: 'bearlet',
  twstock: 'bearlet',
};

export interface LiudongHooks {
  // 召喚管線（§54 慣例）：走正式 spawn（bossFactory summonMinion 夾限 cap）。
  summonMinion(kind: EnemyKind, cap: number): void;
  // 爆倉（PRD §6.4 插針命中不即死）：扣一格彈匣頂槽（voidra stealTopStar 同構）。
  stealTopStar(): boolean;
  // 玩家本體（pins/黑洞牽引/斷單 overlap 接線；bossFactory 由 player 單點供給）。
  playerSprite(): Phaser.Physics.Arcade.Sprite;
  // 玩家星彈群（稜化斷單 overlap；tariffang wireStarsOverlap 同構）。
  playerStars(): Phaser.Physics.Arcade.Group;
  // 形態真值（引力化抗黑洞牽引；§119 gravityFlipImmune 同鍵消費）。
  playerForm(): TransformForm | null;
}

export interface LiudongOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入，佈局禁硬編視寬。
  arenaLeft(): number;
}

// 佔位材質：正式 sprite 缺件時以深藍圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(BODY_W / 2, BODY_H / 2, BODY_W, BODY_H);
    g.generateTexture(key, BODY_W, BODY_H);
    g.destroy();
  };
  bake('boss-liudong', 0x2a3858);
  bake('boss-liudong-enraged', 0x483048);
  bake('boss-liudong-doom', 0x201830);
}

export function createLiudong(
  scene: Phaser.Scene,
  hooks: LiudongHooks,
  options: LiudongOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createLiudongFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 最後轉帳黑洞：牽引窗迄點與視覺容器。
  let blackholeUntilMs = 0;
  let blackholeGfx: Phaser.GameObjects.Container | null = null;
  // 脆弱窗金光提示（FSM vulnerable 真值的呈現）。
  let vulnerableGlow: Phaser.GameObjects.Arc | null = null;
  let overlapsWired = false;

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;

  const body = scene.physics.add.sprite(arenaCx(), GROUND_TOP - BODY_H / 2, 'boss-liudong');
  body.setDisplaySize(BODY_W, BODY_H);
  // 物理/視覺縮放解耦（§77 根治）：演出縮放走 fx 代理，物理箱恆為基準。
  const vscale = getVisualScale(scene);
  vscale.register(body);
  const fxScale = vscale.fx(body);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.82, body.height * 0.88);

  const cinematics = createLiudongCinematics(scene, body, {
    bodyW: BODY_W,
    bodyH: BODY_H,
    arenaCx,
    groundTop: GROUND_TOP,
  });

  const projectiles = scene.physics.add.group({ maxSize: 40, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 28, allowGravity: false });
  // 插針（爆倉）獨立群組：不走標準傷害管線——命中扣彈匣頂槽不扣血（PRD §6.4）。
  const pins = scene.physics.add.group({ maxSize: 6, allowGravity: false });

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

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  // 池取出＋本檔身分旗標歸位單點（poolFlags 紀律的檔內延伸）：notice/fake 為
  // 一次性身分標記，全部 spawner 必經此點重設。
  const acquire = (
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    texture: string,
  ): Phaser.Physics.Arcade.Sprite | null => {
    const obj = acquirePooled(group, x, y, texture);
    if (!obj) return null;
    obj.enableBody(true, x, y, true, true);
    obj.setTexture(texture);
    obj.setData('notice', false);
    obj.setData('fake', false);
    obj.setAlpha(1);
    obj.setRotation(0);
    obj.clearTint();
    const objBody = obj.body as Phaser.Physics.Arcade.Body;
    objBody.setAllowGravity(false);
    objBody.setVelocity(0, 0);
    return obj;
  };

  // 首見減速倍率（PRD §6.7 首見新招 −15%）。
  const speedMul = (firstSeen: boolean): number => (firstSeen ? LIUDONG.firstSeenSpeedMul : 1);

  // ===== 三市場攻擊（PRD §6.4）=====

  // 美股・開盤跳水：硬幣落下（落點紅影）＋地面 K 線柱＋開盤鐘震波。
  // 反制：讀紅影走位／風化越 K 線／殼化反彈硬幣（projectiles 標準反彈管線）。
  const doUsstock = (firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    playSfx('metal', 1.2);
    scene.cameras.main.flash(150, 255, 240, 200);
    const aimX = target?.x ?? arenaCx();
    // 硬幣三枚：玩家位置±側offset，紅影先行。
    for (const [i, offset] of [-90, 0, 90].entries()) {
      const x = Phaser.Math.Clamp(aimX + offset, arenaLeft() + 40, arenaLeft() + viewW() - 40);
      spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.usstockTelegraphMs);
      delay(LIUDONG.usstockTelegraphMs + i * 140, () => {
        if (dying) return;
        const coin = acquire(projectiles, x, -24, 'fx-market-coin');
        if (!coin) return;
        coin.setDisplaySize(30, 30);
        (coin.body as Phaser.Physics.Arcade.Body).setVelocity(0, COIN_FALL_SPEED * mul);
        playSfx('pop', 0.8);
      });
    }
    // K 線柱：自魔王朝玩家側連升三根（升起後回落）。
    const direction = aimX < body.x ? -1 : 1;
    for (let i = 0; i < 3; i += 1) {
      const x = body.x + direction * (110 + i * 120);
      spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.usstockTelegraphMs + i * 160);
      delay(LIUDONG.usstockTelegraphMs + i * 160, () => {
        if (dying) return;
        raisePillar(x, 'fx-market-candle-green', 0x7fe8a8, 900);
      });
    }
  };

  // 地面柱共用（K 線柱／K 線海嘯／假突破崩跌柱）：升起→駐留→下沉回收。
  const raisePillar = (x: number, texture: string, tint: number, holdMs: number) => {
    const pillar = acquire(shockwaves, x, GROUND_TOP + PILLAR_H / 2, texture);
    if (!pillar) return;
    pillar.setDisplaySize(PILLAR_W, PILLAR_H);
    pillar.setTint(tint);
    playSfx('boss-slam', 0.5);
    scene.tweens.add({
      targets: pillar,
      y: GROUND_TOP - PILLAR_H / 2 + 8,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        delay(holdMs, () => {
          if (!pillar.active) return;
          scene.tweens.add({
            targets: pillar,
            y: GROUND_TOP + PILLAR_H / 2,
            duration: 300,
            ease: 'Sine.easeIn',
            onComplete: () => pillar.disableBody(true, true),
          });
        });
      },
    });
  };

  // 加密・插針暴跌：綠燭上衝 → 垂直警示線 → 紅針下插（爆倉：扣彈不扣血）＋彈跳硬幣。
  const doCrypto = (firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    const aimX = Phaser.Math.Clamp(
      target?.x ?? arenaCx(),
      arenaLeft() + 50,
      arenaLeft() + viewW() - 50,
    );
    // 綠燭上衝（誘多視覺）＋垂直警示線。
    const candle = scene.add
      .image(aimX, GROUND_TOP - 40, 'fx-market-candle-green')
      .setDisplaySize(26, 80)
      .setAlpha(0.9)
      .setDepth(8);
    scene.tweens.add({
      targets: candle,
      y: GROUND_TOP - 130,
      alpha: 0.4,
      duration: LIUDONG.cryptoTelegraphMs,
      onComplete: () => candle.destroy(),
    });
    const warnLine = scene.add
      .rectangle(aimX, VIEW.height / 2, 4, VIEW.height, 0xff6a6a, 0.55)
      .setDepth(8);
    scene.tweens.add({
      targets: warnLine,
      alpha: { from: 0.25, to: 0.8 },
      duration: 160,
      yoyo: true,
      repeat: Math.floor(LIUDONG.cryptoTelegraphMs / 320),
      onComplete: () => warnLine.destroy(),
    });
    playSfx('reveal', 0.8);
    delay(LIUDONG.cryptoTelegraphMs, () => {
      if (dying) return;
      // 紅針：沿警示線高速下插（pins 群組——命中爆倉不即死）。
      const pin = acquire(pins, aimX, -30, 'fx-market-candle-pin');
      if (pin) {
        pin.setDisplaySize(22, 74);
        (pin.body as Phaser.Physics.Arcade.Body).setVelocity(0, PIN_DROP_SPEED * mul);
        playSfx('zap', 1.0);
      }
      // 彈跳硬幣 ×2：拋物入場、地面反彈兩次（重力開）。
      for (const side of [-1, 1] as const) {
        const coin = acquire(projectiles, aimX + side * 34, -20, 'fx-market-coin');
        if (!coin) continue;
        coin.setDisplaySize(26, 26);
        const coinBody = coin.body as Phaser.Physics.Arcade.Body;
        coinBody.setAllowGravity(true);
        coinBody.setBounce(0.6, 0.6);
        coinBody.setVelocity(side * 90 * mul, 60);
      }
    });
  };

  // 台股・熔斷牆：紅箭雨＋左右紅電路牆（留缺口——白輪廓標記＋牌價尾數提示，
  // 0.8s 警示，PRD 明文）。
  const doTwstock = (firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    // 缺口車道（1..4 內側車道；白輪廓為主要可讀訊號、尾數牌價為迷因提示）。
    const gapLane = 1 + Math.floor(Math.random() * (ARROW_LANES - 2));
    const laneW = viewW() / ARROW_LANES;
    const gapX = arenaLeft() + laneW * (gapLane + 0.5);
    // 白輪廓缺口標記（0.8s 警示）。
    const marker = scene.add
      .rectangle(gapX, GROUND_TOP - 70, laneW * 0.9, 140, 0xffffff, 0.08)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(8);
    scene.tweens.add({
      targets: marker,
      alpha: { from: 0.5, to: 1 },
      duration: 200,
      yoyo: true,
      repeat: Math.floor(LIUDONG.twstockTelegraphMs / 400),
      onComplete: () => marker.destroy(),
    });
    // 迷因牌價：尾數＝缺口車道號（虛構數字、零真實代號）。
    const quote = scene.add
      .text(arenaCx(), 84, `88${gapLane + 1}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ff9e9e',
        stroke: '#5a1a1a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(8);
    scene.tweens.add({
      targets: quote,
      alpha: 0,
      delay: LIUDONG.twstockTelegraphMs + 600,
      duration: 300,
      onComplete: () => quote.destroy(),
    });
    playSfx('boss-roar', 0.6);
    delay(LIUDONG.twstockTelegraphMs, () => {
      if (dying) return;
      // 紅電路牆：全車道除缺口外滑入短牆段（觸傷、駐留後退場）。
      for (let lane = 0; lane < ARROW_LANES; lane += 1) {
        if (lane === gapLane) continue;
        const x = arenaLeft() + laneW * (lane + 0.5);
        const wall = acquire(shockwaves, x, -60, 'fx-market-circuitwall');
        if (!wall) continue;
        wall.setDisplaySize(Math.min(laneW * 0.82, viewW() * WALL_W_RATIO * 2), 150);
        wall.setTint(0xff8a7a);
        scene.tweens.add({
          targets: wall,
          y: GROUND_TOP - 74,
          duration: 340 / mul,
          ease: 'Sine.easeIn',
          onComplete: () => {
            scene.cameras.main.shake(70, 0.003);
            delay(1200, () => {
              if (!wall.active) return;
              scene.tweens.add({
                targets: wall,
                alpha: 0,
                duration: 280,
                onComplete: () => wall.disableBody(true, true),
              });
            });
          },
        });
      }
      playSfx('metal', 1.1);
    });
  };

  // ===== 招牌：全屏下跌箭頭（PRD §6.5）=====
  // 三批（慢大→快小→EX 反向假箭頭）＋中央崩跌衝擊波；每批 ≥1 通行車道恆開、
  // 陰影預警 ≥600ms、假箭頭以素材形狀＋上升方向區分（不依賴紅綠）。
  const doArrowrain = (batches: number, firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    const laneW = viewW() / ARROW_LANES;
    const batchSpecs: { texture: string; size: [number, number]; speed: number; fake: boolean }[] =
      [
        {
          texture: 'fx-market-arrow-big',
          size: [42, 56],
          speed: ARROW_FALL_SPEED_BIG,
          fake: false,
        },
        {
          texture: 'fx-market-arrow-small',
          size: [26, 36],
          speed: ARROW_FALL_SPEED_SMALL,
          fake: false,
        },
        {
          texture: 'fx-market-arrow-fake',
          size: [30, 40],
          speed: ARROW_FALL_SPEED_BIG,
          fake: true,
        },
      ];
    let at = 0;
    for (let batch = 0; batch < Math.min(batches, batchSpecs.length); batch += 1) {
      const spec = batchSpecs[batch];
      if (!spec) continue;
      const gapLane = Math.floor(Math.random() * ARROW_LANES);
      delay(at, () => {
        if (dying) return;
        playSfx('reveal', 0.7);
        for (let lane = 0; lane < ARROW_LANES; lane += 1) {
          if (lane === gapLane) continue;
          const x = arenaLeft() + laneW * (lane + 0.5);
          // 陰影預警 ≥600ms（PRD 硬規則）。
          spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.arrowShadowMs);
          delay(LIUDONG.arrowShadowMs + (lane % 3) * 90, () => {
            if (dying) return;
            if (spec.fake) {
              // 反向假箭頭（EX）：自地面上升、中途消散——零傷害誘導（形狀可區分）。
              const fakeArrow = scene.add
                .image(x, GROUND_TOP - 30, spec.texture)
                .setDisplaySize(spec.size[0], spec.size[1])
                .setAlpha(0.9)
                .setDepth(8);
              scene.tweens.add({
                targets: fakeArrow,
                y: VIEW.height * 0.4,
                alpha: 0,
                duration: 700,
                ease: 'Sine.easeOut',
                onComplete: () => fakeArrow.destroy(),
              });
              return;
            }
            const arrow = acquire(projectiles, x, -30, spec.texture);
            if (!arrow) return;
            arrow.setDisplaySize(spec.size[0], spec.size[1]);
            (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(0, spec.speed * mul);
          });
        }
      });
      at += LIUDONG.arrowShadowMs + 620;
    }
    // 中央崩跌衝擊波：crashwave 環爆＋雙向地面波。
    delay(at + 120, () => {
      if (dying) return;
      playSfx('boss-slam', 1.2);
      scene.cameras.main.shake(180, 0.006);
      const shock = scene.add
        .image(arenaCx(), GROUND_TOP - 60, 'fx-market-crashwave-shock')
        .setDisplaySize(60, 60)
        .setAlpha(0.95)
        .setDepth(8);
      scene.tweens.add({
        targets: shock,
        displayWidth: viewW() * 0.7,
        displayHeight: viewW() * 0.7,
        alpha: 0,
        duration: 620,
        ease: 'Sine.easeOut',
        onComplete: () => shock.destroy(),
      });
      for (const direction of [-1, 1] as const) {
        const wave = acquire(shockwaves, arenaCx() + direction * 40, GROUND_TOP - 16, '__WHITE');
        if (!wave) continue;
        wave.setDisplaySize(30, 26).setTint(0xff8a7a).setAlpha(0.9);
        (wave.body as Phaser.Physics.Arcade.Body).setVelocity(240 * direction * mul, 0);
        delay(1200, () => {
          if (wave.active) wave.disableBody(true, true);
        });
      }
    });
  };

  // K 線海嘯（P2）：紅 K 線柱波列自一側掃向另一側，留 1 缺口車道。
  const doKlinewave = (firstSeen: boolean) => {
    const laneW = viewW() / ARROW_LANES;
    const fromLeft = (target?.x ?? arenaCx()) > arenaCx();
    const gapLane = 1 + Math.floor(Math.random() * (ARROW_LANES - 2));
    playSfx('boss-roar', 0.7);
    const kwShock = scene.add
      .image(arenaX(fromLeft ? 0.06 : 0.94), GROUND_TOP - 70, 'fx-market-klinewave-shock')
      .setDisplaySize(70, 70)
      .setAlpha(0.85)
      .setDepth(8);
    scene.tweens.add({
      targets: kwShock,
      alpha: 0,
      duration: LIUDONG.klinewaveTelegraphMs,
      onComplete: () => kwShock.destroy(),
    });
    for (let i = 0; i < ARROW_LANES; i += 1) {
      const lane = fromLeft ? i : ARROW_LANES - 1 - i;
      if (lane === gapLane) continue;
      const x = arenaLeft() + laneW * (lane + 0.5);
      spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.klinewaveTelegraphMs + i * 150);
      delay(LIUDONG.klinewaveTelegraphMs + i * (150 / speedMul(firstSeen)), () => {
        if (dying) return;
        raisePillar(x, 'fx-market-klinewave-core', 0xff8a7a, 520);
      });
    }
  };

  // 牛熊交叉（P2）／熊市核心（P3）：召喚牛熊怪（正式 spawn 管線、cap 夾限；
  // 對向入場使兩獸攻勢不同時遮蔽所有落點——衝刺與拍地波節奏彼此獨立）。
  const doBullbear = () => {
    spawnTelegraph(scene, arenaX(0.15), GROUND_TOP - 8, LIUDONG.bullbearTelegraphMs);
    spawnTelegraph(scene, arenaX(0.85), GROUND_TOP - 8, LIUDONG.bullbearTelegraphMs);
    playSfx('boss-roar', 0.9);
    delay(LIUDONG.bullbearTelegraphMs, () => {
      if (dying) return;
      hooks.summonMinion('bullrun', 1);
      hooks.summonMinion('bearmarket', 1);
      scene.cameras.main.shake(120, 0.004);
    });
  };

  const doBearcore = () => {
    spawnTelegraph(scene, arenaCx(), GROUND_TOP - 8, LIUDONG.bearcoreTelegraphMs);
    playSfx('boss-roar', 1.0);
    delay(LIUDONG.bearcoreTelegraphMs, () => {
      if (dying) return;
      hooks.summonMinion('bearmarket', 1);
      scene.cameras.main.flash(200, 120, 90, 180);
    });
  };

  // 轉帳鏈（P2）：雙高度光點鏈自魔王側橫掃（段間縫隙可穿）。
  const doTransferchain = (firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    const direction = (target?.x ?? arenaCx()) < body.x ? -1 : 1;
    spawnTelegraph(
      scene,
      body.x + direction * 60,
      GROUND_TOP - 8,
      LIUDONG.transferchainTelegraphMs,
    );
    playSfx('zap', 0.7);
    delay(LIUDONG.transferchainTelegraphMs, () => {
      if (dying) return;
      for (const [row, y] of [GROUND_TOP - 36, GROUND_TOP - 150].entries()) {
        for (let i = 0; i < 4; i += 1) {
          // 段間縫隙：每列 4 段、段距 110（縫 ~54px 可穿）；雙列錯拍。
          delay(i * 200 + row * 340, () => {
            if (dying) return;
            const link = acquire(projectiles, body.x + direction * 30, y, 'fx-market-deposit-core');
            if (!link) return;
            link.setDisplaySize(30, 30);
            (link.body as Phaser.Physics.Arcade.Body).setVelocity(CHAIN_SPEED * direction * mul, 0);
          });
        }
      }
    });
  };

  // 空頭雷射（P2 遠距）：鎖定玩家高度帶（鎖定後不修正）→ 紅雷射橫貫。
  const doShortlaser = (firstSeen: boolean) => {
    const aimY = Phaser.Math.Clamp(target?.y ?? GROUND_TOP - 30, 140, GROUND_TOP - 20);
    const aim = scene.add.rectangle(arenaCx(), aimY, viewW(), 3, 0xff6a6a, 0.5).setDepth(8);
    scene.tweens.add({
      targets: aim,
      alpha: { from: 0.25, to: 0.85 },
      duration: 180,
      yoyo: true,
      repeat: Math.floor(LIUDONG.shortlaserTelegraphMs / 360),
      onComplete: () => aim.destroy(),
    });
    playSfx('reveal', 0.9);
    delay(LIUDONG.shortlaserTelegraphMs, () => {
      if (dying) return;
      const laser = acquire(shockwaves, arenaCx(), aimY, '__WHITE');
      if (!laser) return;
      laser.setDisplaySize(viewW(), LASER_H).setTint(0xff5a5a).setAlpha(0.9);
      playSfx('zap', 1.3);
      scene.cameras.main.shake(110, 0.004);
      delay(420 / speedMul(firstSeen), () => {
        if (laser.active) {
          scene.tweens.add({
            targets: laser,
            alpha: 0,
            duration: 180,
            onComplete: () => laser.disableBody(true, true),
          });
        }
      });
    });
  };

  // 假突破（P2 EX 專屬）：三綠燭誘多上衝（零傷害）→ 同位紅崩跌柱。
  const doFakeout = (firstSeen: boolean) => {
    const laneW = viewW() / ARROW_LANES;
    const lanes = [1, 3, 5].map((lane) => arenaLeft() + laneW * (lane + 0.5));
    for (const x of lanes) {
      const bait = scene.add
        .image(x, GROUND_TOP - 50, 'fx-market-candle-green')
        .setDisplaySize(26, 90)
        .setAlpha(0.85)
        .setDepth(8);
      scene.tweens.add({
        targets: bait,
        y: GROUND_TOP - 150,
        alpha: 0.3,
        duration: LIUDONG.fakeoutTelegraphMs,
        onComplete: () => bait.destroy(),
      });
      // 紅影同步標記真落點（不得純紅綠辨識——位置即資訊）。
      spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.fakeoutTelegraphMs);
    }
    playSfx('reveal', 0.6);
    delay(LIUDONG.fakeoutTelegraphMs, () => {
      if (dying) return;
      for (const x of lanes)
        raisePillar(x, 'fx-market-candle-pin', 0xff6a6a, 620 / speedMul(firstSeen));
      playSfx('break', 1.1);
    });
  };

  // 末日箭（P3）：全屏箭柱雨兩波；唯一走廊白輪廓恆亮（EX 窄通道，PRD §6.7）。
  const doDoomarrow = (narrow: boolean, firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    const corridorW = narrow ? CORRIDOR_W_NARROW : CORRIDOR_W;
    const corridorX = arenaLeft() + corridorW / 2 + Math.random() * (viewW() - corridorW);
    // 白輪廓走廊：telegraph 起亮、全招式期間常駐（anti-softlock 可讀）。
    const outline = scene.add
      .rectangle(corridorX, VIEW.height / 2, corridorW, VIEW.height, 0xffffff, 0.06)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(8);
    playSfx('boss-roar', 1.2);
    const volley = (offsetMs: number) => {
      delay(offsetMs, () => {
        if (dying) return;
        const laneW = viewW() / (ARROW_LANES + 2);
        for (let lane = 0; lane < ARROW_LANES + 2; lane += 1) {
          const x = arenaLeft() + laneW * (lane + 0.5);
          // 走廊帶豁免（含半寬緩衝）。
          if (Math.abs(x - corridorX) < corridorW / 2 + laneW * 0.3) continue;
          spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.doomarrowTelegraphMs);
          delay(LIUDONG.doomarrowTelegraphMs + (lane % 2) * 110, () => {
            if (dying) return;
            const arrow = acquire(projectiles, x, -30, 'fx-market-arrow-big');
            if (!arrow) return;
            arrow.setDisplaySize(38, 52);
            arrow.setTint(0xd8b8ff);
            (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(0, ARROW_FALL_SPEED_SMALL * mul);
          });
        }
      });
    };
    volley(0);
    volley(LIUDONG.doomarrowTelegraphMs + 900);
    delay(LIUDONG.doomarrowDurationMs, () => outline.destroy());
  };

  // 清算通知（P3）：通知單緩降飄落（車道錯拍恆可穿行）；焰化燒單（burn 星彈
  // 命中即銷毀＝形態優勢，tariffang 稅票同構）。
  const doLiquidation = (firstSeen: boolean) => {
    const mul = speedMul(firstSeen);
    const laneW = viewW() / ARROW_LANES;
    playSfx('reveal', 0.8);
    for (let i = 0; i < 10; i += 1) {
      const lane = i % ARROW_LANES;
      // 每拍至多兩張、車道輪轉——任一時刻恆有可穿行帶。
      delay(LIUDONG.liquidationTelegraphMs + Math.floor(i / 2) * 420, () => {
        if (dying) return;
        const x = arenaLeft() + laneW * (lane + 0.5) + (Math.random() - 0.5) * laneW * 0.4;
        const notice = acquire(shockwaves, x, -24, '__WHITE');
        if (!notice) return;
        notice.setDisplaySize(26, 32).setTint(0xffe8e8).setAlpha(0.95);
        notice.setData('notice', true);
        (notice.body as Phaser.Physics.Arcade.Body).setVelocity(
          (Math.random() - 0.5) * 30,
          NOTICE_FALL_SPEED * mul,
        );
      });
    }
  };

  // 熔斷倒數（P3）：倒數大字＋輕箭雨（車道恆開）→ 期滿劉董過熱長脆弱窗
  //（FSM ×2 受擊；金光提示）＝「撐過即反噬」。
  const doCircuitbreaker = (countdownMs: number, vulnerableMs: number) => {
    playSfx('boss-roar', 1.1);
    const steps = 3;
    for (let i = 0; i < steps; i += 1) {
      delay((countdownMs / steps) * i, () => {
        if (dying) return;
        playSfx('metal', 0.7 + i * 0.2);
        const num = scene.add
          .text(scene.scale.width / 2, 110, String(steps - i), {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#ffd0d0',
            stroke: '#5a1a1a',
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(56);
        scene.tweens.add({
          targets: num,
          scale: { from: 1.5, to: 1 },
          alpha: { from: 1, to: 0 },
          duration: (countdownMs / steps) * 0.9,
          ease: 'Quad.easeOut',
          onComplete: () => num.destroy(),
        });
        // 輕箭雨：每拍 2 箭（六車道僅佔二，恆可走位）。
        const laneW = viewW() / ARROW_LANES;
        for (const lane of [(i * 2 + 1) % ARROW_LANES, (i * 3 + 4) % ARROW_LANES]) {
          const x = arenaLeft() + laneW * (lane + 0.5);
          spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.arrowShadowMs);
          delay(LIUDONG.arrowShadowMs, () => {
            if (dying) return;
            const arrow = acquire(projectiles, x, -30, 'fx-market-arrow-small');
            if (!arrow) return;
            arrow.setDisplaySize(26, 36);
            (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(0, ARROW_FALL_SPEED_BIG);
          });
        }
      });
    }
    // 期滿：過熱脆弱窗（金光呼吸）＝長輸出窗。
    delay(countdownMs, () => {
      if (dying) return;
      playSfx('break', 1.3);
      scene.cameras.main.flash(260, 255, 220, 120);
      showVulnerableGlow(vulnerableMs);
    });
  };

  // 最後轉帳（P3 一次性）：市場黑洞強牽引（引力化免疫）＋螺旋箭；撐過 holdMs
  // 黑洞反噬——劉董自傷＋長脆弱窗（PRD「撐過即反噬」）。
  const doFinaltransfer = (holdMs: number) => {
    playSfx('boss-roar', 1.4);
    scene.cameras.main.flash(300, 140, 100, 200);
    const core = scene.add.image(0, 0, 'fx-market-blackhole-core').setDisplaySize(70, 70);
    const halo = scene.add
      .image(0, 0, 'fx-market-blackhole-overlay')
      .setDisplaySize(120, 120)
      .setAlpha(0.8);
    blackholeGfx = scene.add.container(arenaCx(), BLACKHOLE_Y, [halo, core]).setDepth(9);
    blackholeGfx.setScale(0.2);
    scene.tweens.add({
      targets: blackholeGfx,
      scale: 1,
      duration: LIUDONG.finaltransferTelegraphMs,
      ease: 'Back.easeOut',
    });
    scene.tweens.add({
      targets: halo,
      rotation: Math.PI * 2,
      duration: 2600,
      repeat: -1,
    });
    blackholeUntilMs = elapsedMs + holdMs;
    // 螺旋箭：牽引期間三拍點綴（帶陰影預警、車道稀疏）。
    const laneW = viewW() / ARROW_LANES;
    for (let i = 0; i < 3; i += 1) {
      delay(LIUDONG.finaltransferTelegraphMs + i * 1100, () => {
        if (dying) return;
        const lane = (i * 2 + 1) % ARROW_LANES;
        const x = arenaLeft() + laneW * (lane + 0.5);
        spawnTelegraph(scene, x, GROUND_TOP - 8, LIUDONG.arrowShadowMs);
        delay(LIUDONG.arrowShadowMs, () => {
          if (dying) return;
          const arrow = acquire(projectiles, x, -30, 'fx-market-down-arrow');
          if (!arrow) return;
          arrow.setDisplaySize(30, 42);
          (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(0, ARROW_FALL_SPEED_BIG);
        });
      });
    }
    // 反噬：黑洞塌縮衝擊＋自傷＋脆弱窗（FSM 窗已同步開啟）。
    delay(holdMs, () => {
      if (dying) return;
      collapseBlackhole();
      playSfx('boss-slam', 1.4);
      scene.cameras.main.shake(260, 0.008);
      const shock = scene.add
        .image(arenaCx(), BLACKHOLE_Y, 'fx-market-crashwave-shock')
        .setDisplaySize(80, 80)
        .setAlpha(1)
        .setDepth(9);
      scene.tweens.add({
        targets: shock,
        displayWidth: viewW() * 0.9,
        displayHeight: viewW() * 0.9,
        alpha: 0,
        duration: 700,
        onComplete: () => shock.destroy(),
      });
      applyDamageInternal(LIUDONG.finaltransferRecoilDamage);
      showVulnerableGlow(LIUDONG.finaltransferVulnerableMs);
    });
  };

  const collapseBlackhole = () => {
    blackholeUntilMs = 0;
    if (!blackholeGfx) return;
    const expiring = blackholeGfx;
    blackholeGfx = null;
    scene.tweens.add({
      targets: expiring,
      scale: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => expiring.destroy(),
    });
  };

  // 脆弱窗金光（熔斷過熱／黑洞反噬）：呼吸金圈——「打這裡」的無文字提示。
  const showVulnerableGlow = (ms: number) => {
    vulnerableGlow?.destroy();
    const glow = scene.add
      .circle(body.x, body.y, Math.max(BODY_W, BODY_H) * 0.62, 0xffd966, 0)
      .setStrokeStyle(5, 0xffd966, 0.9)
      .setDepth(9);
    vulnerableGlow = glow;
    scene.tweens.add({
      targets: glow,
      scale: { from: 0.92, to: 1.08 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    delay(ms, () => {
      if (vulnerableGlow === glow) vulnerableGlow = null;
      glow.destroy();
    });
  };

  // 市場攻擊統一入口：思考／下單前奏（可被稜化斷單）→ 攻擊執行＋召對應小怪。
  const doMarket = (market: MarketKind, firstSeen: boolean) => {
    cinematics.playThinkOrder(market, () => {
      if (dying) return;
      switch (market) {
        case 'usstock':
          doUsstock(firstSeen);
          break;
        case 'crypto':
          doCrypto(firstSeen);
          break;
        case 'twstock':
          doTwstock(firstSeen);
          break;
        default: {
          const unhandled: never = market;
          throw new Error(`未知市場：${String(unhandled)}`);
        }
      }
      // 召對應小怪（P1 節奏供給；cap 2 防堆積）。
      hooks.summonMinion(MARKET_MINION[market], 2);
    });
  };

  const runCommand = (command: LiudongCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'market':
        doMarket(command.market, command.firstSeen);
        return;
      case 'arrowrain':
        doArrowrain(command.batches, command.firstSeen);
        return;
      case 'klinewave':
        doKlinewave(command.firstSeen);
        return;
      case 'bullbear':
        doBullbear();
        return;
      case 'transferchain':
        doTransferchain(command.firstSeen);
        return;
      case 'shortlaser':
        doShortlaser(command.firstSeen);
        return;
      case 'fakeout':
        doFakeout(command.firstSeen);
        return;
      case 'doomarrow':
        doDoomarrow(command.narrow, command.firstSeen);
        return;
      case 'bearcore':
        doBearcore();
        return;
      case 'liquidation':
        doLiquidation(command.firstSeen);
        return;
      case 'circuitbreaker':
        doCircuitbreaker(command.countdownMs, command.vulnerableMs);
        return;
      case 'finaltransfer':
        doFinaltransfer(command.holdMs);
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  // 死亡冪等（§74 慣例）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    cinematics.cancelThinkOrder();
    collapseBlackhole();
    vulnerableGlow?.destroy();
    vulnerableGlow = null;
    scene.tweens.killTweensOf(body);
    vscale.killFxTweens(body);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    pins.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    cinematics.playDeath();
    delay(1100, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 460, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: body, alpha: 0, duration: 460, ease: 'Back.easeIn' });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    void source;
    for (const event of fsm.takeDamage(amount)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          scene.tweens.add({ targets: body, angle: 2, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: amount,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          if (event.phase === 'p2' || event.phase === 'p3') {
            playSfx('boss-roar', event.phase === 'p2' ? 1.1 : 1.3);
            scene.cameras.main.flash(300, 255, 120, 120);
            scene.cameras.main.shake(200, 0.006);
            cinematics.playPhaseTransition(event.phase, () => {
              /* 立繪已由 cinematics 換裝（狂暴/末日）。 */
            });
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

  // 玩家互動接線（spawn 時機：player 已就緒）：插針爆倉＋稜化斷單。
  const wirePlayerOverlaps = () => {
    if (overlapsWired) return;
    overlapsWired = true;
    // 插針爆倉（PRD §6.4 命中不即死）：扣一格彈匣頂槽＋爆倉演出，零 HP 傷害。
    scene.physics.add.overlap(hooks.playerSprite(), pins, (_p, pinObj) => {
      const pin = pinObj as Phaser.Physics.Arcade.Sprite;
      if (!pin.active || dying) return;
      pin.disableBody(true, true);
      hooks.stealTopStar();
      playSfx('break', 1.2);
      scene.cameras.main.flash(180, 255, 90, 90);
    });
    // 稜化斷單（§125 優勢情境）：prism 星彈命中本體且市場招執行期 → 取消下單。
    scene.physics.add.overlap(hooks.playerStars(), body, (a, b) => {
      const star = ((a as unknown) === (body as unknown) ? b : a) as Phaser.Physics.Arcade.Sprite;
      if (!star.active || !active || dying) return;
      if (star.getData('prism') !== true) return;
      if (fsm.tryInterruptOrder()) {
        cinematics.cancelThinkOrder();
        playSfx('break', 1.0);
        scene.cameras.main.flash(160, 220, 200, 255);
      }
    });
  };

  // 迷因安全角標（PRD §1.5 硬驗收）：常駐右下、半透明不搶畫面。
  const disclaimer = scene.add
    .text(scene.scale.width - 8, VIEW.height - 6, '本關純屬虛構迷因，非投資建議', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
    })
    .setOrigin(1, 1)
    .setAlpha(0.55)
    .setScrollFactor(0)
    .setDepth(DISCLAIMER_DEPTH);

  return {
    spawn() {
      wirePlayerOverlaps();
      const cam = scene.cameras.main;
      cam.fadeOut(240, 18, 16, 30);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.fadeIn(320, 18, 16, 30);
        // 入金入場（PRD §6.2）：序列結束才進入可傷狀態。
        cinematics.playEntry(() => {
          emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
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
                if (dying) return;
                const v = tween.getValue() ?? 0;
                const mix = (from: number, to: number) => Math.round(from + (to - from) * v);
                body.setTint((mix(255, 216) << 16) | (mix(255, 75) << 8) | mix(255, 106));
              },
            });
          }
        });
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageInternal(amount, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      fsm.setTargetDistance(
        target ? Phaser.Math.Distance.Between(body.x, body.y, target.x, target.y) : null,
      );
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 地面持機踱步（禁座標直寫）：緩幅擺動錨＋approachPoint 逼近。
      const anchorX =
        arenaLeft() +
        viewW() * PACE_ANCHOR_RATIO +
        Math.sin(elapsedMs * PACE_FREQ) * viewW() * PACE_AMP_RATIO;
      const next = approachPoint(
        { x: body.x, y: body.y },
        { x: anchorX, y: GROUND_TOP - BODY_H / 2 },
        APPROACH_SPEED * fsm.speedFactor,
        deltaMs,
      );
      body.setPosition(next.x, next.y);
      body.setFlipX((target?.x ?? body.x) < body.x);
      // 脆弱窗金圈跟隨本體。
      vulnerableGlow?.setPosition(body.x, body.y);
      // 最後轉帳黑洞牽引：positional drift（恆低於玩家全速）；引力化免疫
      //（§119 gravityFlipImmune 同鍵消費）。
      if (blackholeGfx && elapsedMs < blackholeUntilMs && target) {
        if (hooks.playerForm() !== 'gravity') {
          const step = (BLACKHOLE_PULL_PX_PER_SEC * deltaMs) / 1000;
          const dx = blackholeGfx.x - target.x;
          target.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
        }
      }
      // 彈體出界回收（§56）。
      const recycle = (obj: Phaser.GameObjects.GameObject) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        if (
          sprite.y > GROUND_TOP + 50 ||
          sprite.y < -80 ||
          sprite.x < arenaLeft() - 100 ||
          sprite.x > arenaLeft() + viewW() + 100
        ) {
          killProjectile(sprite);
        }
      };
      projectiles.getMatching('active', true).forEach(recycle);
      pins.getMatching('active', true).forEach(recycle);
      // 通知單著地即散（清算通知緩降至地面線）。
      shockwaves.getMatching('active', true).forEach((obj) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        if (sprite.getData('notice') === true && sprite.y > GROUND_TOP - 12) {
          killProjectile(sprite);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      cinematics.destroy();
      scene.tweens.killTweensOf(body);
      vscale.unregister(body);
      body.destroy();
      blackholeGfx?.destroy();
      vulnerableGlow?.destroy();
      disclaimer.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      pins.destroy(true);
    },
    isActive() {
      return active;
    },
    // 頭頂 hit window（§58 落地王慣例）：FSM 裁決（生存窗招不可暈）。
    trySlamStun() {
      if (!active || dying) return false;
      const stunned = fsm.stun(800);
      if (stunned) {
        cinematics.cancelThinkOrder();
        flashWhite();
        playSfx('boss-slam', 0.9);
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
    // e2e 觀測（§83 慣例）：FSM 階段/招式即時值。
    getDebugState() {
      return { phase: fsm.phase, state: fsm.state };
    },
  };
}
