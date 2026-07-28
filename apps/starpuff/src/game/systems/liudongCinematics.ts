import type Phaser from 'phaser';
import { LIUDONG, type MarketKind } from '../logic/liudongFsm';
import { playSfx } from '../audio/sfx';
import { getVisualScale } from './visualScale';

// 劉董演出模組（GAME_DESIGN §125，PRD §6.2/§6.3）：入金入場序列、思考／下單
// 前奏、轉段與死亡幀序、L29「市場開盤」收尾演出。boss-liudong 資產組幀數遠超
// 既有魔王——播出邏輯獨立成檔（§106 GameScene strangler 紀律），systems/liudong.ts
// 只負責攻擊結算。全部演出特效不遮玩家與平台（depth 低於玩家層，PRD §6.2）。

// 演出層深：入金特效壓 8（不遮玩家）；思考泡泡懸於頭頂屬預告資訊，置 56 保證可讀。
const FX_DEPTH = 8;
const BUBBLE_DEPTH = 56;
const VIGNETTE_DEPTH = 57;

// 入場節拍（PRD §6.2 全序列 ≈4.8s）：滑入→掏手機→點入金→轉帳光束→短漲→
// 垂直崩跌→全屏箭頭（純演出零傷害）→開戰。
const ENTRY_SLIDE_MS = 900;
const ENTRY_PHONE_MS = 650;
const ENTRY_TAP_MS = 500;
const ENTRY_BEAM_MS = 700;
const ENTRY_RISE_MS = 600;
const ENTRY_CRASH_MS = 700;
const ENTRY_ARROWS_MS = 800;

// 思考泡泡：圖示輪轉節拍。
const THINK_CYCLE_MS = 220;

// 市場圖示（PRD §6.3 預告即機制）：圖示＝該市場攻擊的招牌素材——玩家讀圖示
// 即預判攻擊種類，不依賴文字（B06 若補專屬迷因圖示，單點換鍵）。
export const MARKET_ICON: Record<MarketKind, string> = {
  usstock: 'fx-market-coin',
  crypto: 'fx-market-candle-pin',
  twstock: 'fx-market-circuitwall',
};

interface FrameStep {
  key: string;
  ms: number;
}

export interface LiudongCinematics {
  playEntry(onDone: () => void): void;
  // 思考／下單前奏：think＋order 期滿呼叫 onDone（攻擊執行拍）。
  playThinkOrder(market: MarketKind, onDone: () => void): void;
  playPhaseTransition(phase: 'p2' | 'p3', onDone: () => void): void;
  playDeath(): void;
  // 演出中斷（稜化斷單）：收掉思考泡泡與下單幀序，回當前段落立繪。
  cancelThinkOrder(): void;
  destroy(): void;
}

export function createLiudongCinematics(
  scene: Phaser.Scene,
  body: Phaser.Physics.Arcade.Sprite,
  geometry: { bodyW: number; bodyH: number; arenaCx(): number; groundTop: number },
): LiudongCinematics {
  const vscale = getVisualScale(scene);
  const timers: Phaser.Time.TimerEvent[] = [];
  let bubble: Phaser.GameObjects.Container | null = null;
  let bubbleTimer: Phaser.Time.TimerEvent | null = null;
  let orderRunning = false;
  // 段落立繪（p1 常態 → p2 狂暴 → p3 末日）：下單收招與轉段共用回錨。
  let idleKey = 'boss-liudong';

  const delay = (ms: number, fn: () => void): void => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 換幀單點：保持顯示尺寸並重錨物理基準（§77 解耦；素材幀邊界不一致時防跳尺寸）。
  const setFrame = (key: string): void => {
    if (!scene.textures.exists(key)) return;
    body.setTexture(key);
    body.setDisplaySize(geometry.bodyW, geometry.bodyH);
    vscale.rebase(body);
  };

  // 幀序播放：依步驟表逐幀換圖，播畢回呼。
  const playFrames = (steps: readonly FrameStep[], onDone?: () => void): void => {
    let at = 0;
    for (const step of steps) {
      delay(at, () => setFrame(step.key));
      at += step.ms;
    }
    if (onDone) delay(at, onDone);
  };

  const cancelThinkOrder = (): void => {
    orderRunning = false;
    bubbleTimer?.remove(false);
    bubbleTimer = null;
    if (bubble) {
      const expiring = bubble;
      bubble = null;
      scene.tweens.add({
        targets: expiring,
        alpha: 0,
        duration: 160,
        onComplete: () => expiring.destroy(),
      });
    }
  };

  // 全屏下跌箭頭（入場版）：純演出零傷害、不遮玩家（FX_DEPTH＜玩家層）。
  const entryArrowShower = (): void => {
    const viewW = scene.scale.width;
    for (let i = 0; i < 8; i += 1) {
      const x = geometry.arenaCx() - viewW / 2 + ((i + 0.5) / 8) * viewW;
      delay(i * 70, () => {
        const arrow = scene.add
          .image(x, -30, 'fx-market-down-arrow')
          .setDisplaySize(34, 46)
          .setAlpha(0.8)
          .setDepth(FX_DEPTH);
        scene.tweens.add({
          targets: arrow,
          y: geometry.groundTop - 20,
          alpha: 0,
          duration: ENTRY_ARROWS_MS,
          ease: 'Quad.easeIn',
          onComplete: () => arrow.destroy(),
        });
      });
    }
  };

  // 迷因圖表（入場）：短暫上漲的綠折線 → 垂直崩跌轉紅（全虛構、零真實代號）。
  const entryChart = (riseMs: number, crashMs: number): void => {
    const originX = geometry.arenaCx() - 120;
    const originY = geometry.groundTop - 190;
    const chart = scene.add.graphics().setDepth(FX_DEPTH);
    const drawRise = (t: number): void => {
      chart.clear();
      chart.lineStyle(4, 0x7fe8a8, 0.95);
      chart.beginPath();
      chart.moveTo(originX, originY);
      const seg = Math.max(1, Math.floor(t * 5));
      for (let i = 1; i <= seg; i += 1) {
        chart.lineTo(originX + i * 24, originY - i * 14 - (i % 2) * 6);
      }
      chart.strokePath();
    };
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: riseMs,
      onUpdate: (tween) => drawRise(tween.getValue() ?? 0),
      onComplete: () => {
        // 垂直崩跌：紅線直落＋紅閃。
        playSfx('break', 1.2);
        scene.cameras.main.flash(220, 255, 90, 90);
        chart.lineStyle(5, 0xff6a6a, 1);
        chart.beginPath();
        chart.moveTo(originX + 120, originY - 76);
        chart.lineTo(originX + 132, geometry.groundTop - 24);
        chart.strokePath();
        scene.tweens.add({
          targets: chart,
          alpha: 0,
          delay: crashMs,
          duration: 300,
          onComplete: () => chart.destroy(),
        });
      },
    });
  };

  // 轉帳光束（入場）：手機口飛向圖表基點的光點流。
  const entryBeam = (): void => {
    playSfx('zap', 0.6);
    for (let i = 0; i < 6; i += 1) {
      delay(i * 90, () => {
        const dot = scene.add
          .image(body.x + geometry.bodyW * 0.3, body.y - 10, 'fx-market-deposit-trail')
          .setDisplaySize(22, 22)
          .setAlpha(0.9)
          .setDepth(FX_DEPTH);
        scene.tweens.add({
          targets: dot,
          x: geometry.arenaCx() - 120,
          y: geometry.groundTop - 190,
          alpha: 0.2,
          duration: ENTRY_BEAM_MS - 80,
          ease: 'Sine.easeIn',
          onComplete: () => dot.destroy(),
        });
      });
    }
  };

  const playEntry = (onDone: () => void): void => {
    const cam = scene.cameras.main;
    setFrame('boss-liudong-entry-1');
    body.setPosition(
      geometry.arenaCx() + scene.scale.width / 2 + geometry.bodyW,
      geometry.groundTop - geometry.bodyH / 2,
    );
    // 滑入：自右緣滑步進場（安靜市場）。
    scene.tweens.add({
      targets: body,
      x: geometry.arenaCx() + scene.scale.width * 0.18,
      duration: ENTRY_SLIDE_MS,
      ease: 'Sine.easeOut',
    });
    let at = ENTRY_SLIDE_MS;
    // 掏手機。
    delay(at, () => {
      setFrame('boss-liudong-entry-2');
      playSfx('pop', 0.7);
    });
    at += ENTRY_PHONE_MS;
    // 點「入金」：白閃＋按鍵音。
    delay(at, () => {
      setFrame('boss-liudong-entry-3');
      playSfx('metal', 0.8);
      cam.flash(140, 255, 255, 255);
    });
    at += ENTRY_TAP_MS;
    // 轉帳光束流入。
    delay(at, entryBeam);
    at += ENTRY_BEAM_MS;
    // 圖表短漲（自信）→ 垂直崩跌。
    delay(at, () => {
      setFrame('boss-liudong-entry-4');
      entryChart(ENTRY_RISE_MS, ENTRY_CRASH_MS);
    });
    at += ENTRY_RISE_MS + ENTRY_CRASH_MS;
    // 全屏下跌箭頭（零傷害演出）→ 開戰。
    delay(at, () => {
      entryArrowShower();
      playSfx('boss-roar', 1.0);
      cam.shake(200, 0.006);
    });
    at += ENTRY_ARROWS_MS;
    delay(at, () => {
      setFrame(idleKey);
      onDone();
    });
  };

  // 思考／下單（PRD §6.3 預告即機制）：歪頭思考＋頭頂三市場圖示輪轉 →
  // 拍板鎖定本次市場圖示 → 平板下單（move1 幀）→ 攻擊執行（onDone）。
  const playThinkOrder = (market: MarketKind, onDone: () => void): void => {
    orderRunning = true;
    setFrame('boss-liudong-thinking');
    const shell = scene.add.ellipse(0, 0, 76, 58, 0xffffff, 0.92);
    shell.setStrokeStyle(3, 0x4a3a78, 0.9);
    const tailA = scene.add.circle(26, 34, 7, 0xffffff, 0.9);
    const tailB = scene.add.circle(38, 46, 4, 0xffffff, 0.85);
    const icon = scene.add.image(0, 0, MARKET_ICON[market]).setDisplaySize(34, 34);
    bubble = scene.add
      .container(body.x - geometry.bodyW * 0.42, body.y - geometry.bodyH * 0.72, [
        tailB,
        tailA,
        shell,
        icon,
      ])
      .setDepth(BUBBLE_DEPTH)
      .setAlpha(0);
    scene.tweens.add({ targets: bubble, alpha: 1, duration: 180 });
    // 圖示輪轉：三市場圖示循環，末拍鎖定本次市場（可讀預告、不依賴文字）。
    const icons: readonly MarketKind[] = ['usstock', 'crypto', 'twstock'];
    let cycleAt = icons.indexOf(market);
    bubbleTimer = scene.time.addEvent({
      delay: THINK_CYCLE_MS,
      repeat: Math.floor(LIUDONG.thinkMs / THINK_CYCLE_MS) - 2,
      callback: () => {
        cycleAt += 1;
        const key = icons[cycleAt % icons.length] ?? market;
        icon.setTexture(MARKET_ICON[key]).setDisplaySize(34, 34);
      },
    });
    playSfx('reveal', 0.5);
    // 拍板：鎖定圖示放大＋泡泡脈動；接下單兩拍後執行攻擊。
    delay(LIUDONG.thinkMs, () => {
      if (!orderRunning || !bubble) return;
      bubbleTimer?.remove(false);
      bubbleTimer = null;
      icon.setTexture(MARKET_ICON[market]).setDisplaySize(42, 42);
      playSfx('metal', 1.0);
      scene.tweens.add({
        targets: bubble,
        scale: { from: 1, to: 1.18 },
        duration: 140,
        yoyo: true,
      });
      playFrames(
        [
          { key: 'boss-liudong-move1-windup', ms: LIUDONG.orderMs * 0.45 },
          { key: 'boss-liudong-move1-charge', ms: LIUDONG.orderMs * 0.55 },
        ],
        () => {
          if (!orderRunning) return;
          cancelThinkOrder();
          setFrame('boss-liudong-move1-burst');
          delay(360, () => setFrame('boss-liudong-move1-recover'));
          delay(760, () => setFrame(idleKey));
          onDone();
        },
      );
    });
  };

  const playPhaseTransition = (phase: 'p2' | 'p3', onDone: () => void): void => {
    cancelThinkOrder();
    const prefix = phase === 'p2' ? 'boss-liudong-p2trans' : 'boss-liudong-p3trans';
    const frames = phase === 'p2' ? 6 : 7;
    const steps: FrameStep[] = Array.from({ length: frames }, (_, i) => ({
      key: `${prefix}-${i + 1}`,
      ms: 130,
    }));
    playFrames(steps, () => {
      idleKey = phase === 'p2' ? 'boss-liudong-enraged' : 'boss-liudong-doom';
      setFrame(idleKey);
      onDone();
    });
  };

  const playDeath = (): void => {
    cancelThinkOrder();
    playFrames(
      Array.from({ length: 6 }, (_, i) => ({ key: `boss-liudong-death-${i + 1}`, ms: 170 })),
    );
  };

  return {
    playEntry,
    playThinkOrder,
    playPhaseTransition,
    playDeath,
    cancelThinkOrder,
    destroy(): void {
      timers.forEach((timer) => timer.remove(false));
      timers.length = 0;
      bubbleTimer?.remove(false);
      bubble?.destroy();
      bubble = null;
    },
  };
}

// L29 收尾演出（PRD／§125）：「市場即將開盤」大型倒數＋遠景劉董按下入金——
// L30 伏筆。純 overlay 零傷害、不阻操作；星星門正常生成（LEVEL_GATE_OPENED 觸發）。
const VIGNETTE_COUNT_MS = 700;

export function playMarketOpenVignette(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  // 世界座標錨（遠景剪影）與螢幕座標錨（標語倒數 scrollFactor 0）分開取。
  const cx = cam.scrollX + scene.scale.width / 2;
  const screenCx = scene.scale.width / 2;
  const topY = 96;
  // 遠景劉董剪影：小尺寸暗色立繪＋掏手機幀切換（資產缺件時靜默略過）。
  if (scene.textures.exists('boss-liudong-entry-2')) {
    const silhouette = scene.add
      .image(cx + scene.scale.width * 0.3, topY + 64, 'boss-liudong-entry-2')
      .setDisplaySize(64, 58)
      .setTint(0x2a2438)
      .setAlpha(0)
      .setDepth(VIGNETTE_DEPTH);
    scene.tweens.add({ targets: silhouette, alpha: 0.85, duration: 400 });
    scene.time.delayedCall(VIGNETTE_COUNT_MS * 3, () => {
      if (scene.textures.exists('boss-liudong-entry-3')) {
        silhouette.setTexture('boss-liudong-entry-3').setDisplaySize(64, 58);
      }
      cam.flash(160, 255, 255, 255);
      scene.tweens.add({
        targets: silhouette,
        alpha: 0,
        delay: 500,
        duration: 400,
        onComplete: () => silhouette.destroy(),
      });
    });
  }
  // 「市場即將開盤」標語＋3-2-1 倒數（純繁中演出字，非機制文字依賴）。
  const banner = scene.add
    .text(screenCx, topY, '市場即將開盤', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffdddd',
      stroke: '#7a2a2a',
      strokeThickness: 5,
    })
    .setOrigin(0.5)
    .setDepth(VIGNETTE_DEPTH)
    .setAlpha(0)
    .setScrollFactor(0);
  scene.tweens.add({ targets: banner, alpha: 1, duration: 300 });
  for (let i = 0; i < 3; i += 1) {
    scene.time.delayedCall(400 + i * VIGNETTE_COUNT_MS, () => {
      playSfx('metal', 0.7 + i * 0.15);
      const count = scene.add
        .text(screenCx, topY + 46, String(3 - i), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '40px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#7a2a2a',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(VIGNETTE_DEPTH)
        .setScrollFactor(0);
      scene.tweens.add({
        targets: count,
        scale: { from: 1.4, to: 1 },
        alpha: { from: 1, to: 0 },
        duration: VIGNETTE_COUNT_MS - 60,
        ease: 'Quad.easeOut',
        onComplete: () => count.destroy(),
      });
    });
  }
  scene.time.delayedCall(400 + 3 * VIGNETTE_COUNT_MS + 500, () => {
    scene.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 400,
      onComplete: () => banner.destroy(),
    });
  });
}
