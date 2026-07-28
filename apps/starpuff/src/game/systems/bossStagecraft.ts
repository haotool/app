import type Phaser from 'phaser';
import type { StagecraftBossKind } from '../core/bossAnimAssets';
import { getVisualScale } from './visualScale';

// 四王演出共用件（GAME_DESIGN §125）：L22/L24/L26/L28 動畫組（39 鍵/王）的補載與
// 分鏡播放單點。純呈現層——不動 FSM 常數與判定，分鏡一律鋪在既有 telegraph 窗上；
// 唯一物理相關動作為 vscale.rebase（沿 §77 既有換裝模式，物理箱恆為基準）。
// 缺圖降級：setFrame 以 textures.exists 防衛，未載入幀靜默跳過（維持 base 立繪），
// anti-softlock 與行為零改變由此保證。

// 分鏡節拍：受擊幀短閃、轉段/死亡幀序沿劉董演出節拍（§125 慣例）。
const HIT_FRAME_MS = 110;
const HIT_THROTTLE_MS = 380;
const TRANS_FRAME_MS = 130;
const DEATH_FRAME_MS = 170;
const IDLE_BREATH_MS = 460;
// 三招分鏡錨點：windup 即刻、charge 於 telegraph 中段、burst 對齊 telegraph 結束
//（傷害物生成拍）、recover 後回段落立繪。
const MOVE_CHARGE_RATIO = 0.55;
const MOVE_RECOVER_MS = 320;
const MOVE_SETTLE_MS = 680;

// 背景補載（#883 分階段載入契約）：manifest 走 dynamic import 獨立 chunk，進魔王關
// create 期觸發——前室廊道即補載窗口，不阻塞進關、不佔載入畫面。已載鍵零成本略過。
export function preloadBossStagecraft(scene: Phaser.Scene, kind: StagecraftBossKind): void {
  import('../core/bossAnimAssets')
    .then(({ BOSS_ANIM_ASSETS }) => {
      // 玩家秒退關卡時 scene 可能已銷毀；未載完的幀由下次進關重試補齊。
      if (!scene.sys || !scene.load) return;
      let queued = 0;
      for (const { key, url } of BOSS_ANIM_ASSETS[kind]) {
        if (scene.textures.exists(key)) continue;
        scene.load.image(key, url);
        queued += 1;
      }
      if (queued > 0 && !scene.load.isLoading()) scene.load.start();
    })
    .catch(() => {
      // chunk 載入失敗（離線/瞬時網路故障）靜默降級：setFrame 缺圖防衛維持
      // base 立繪演出（anti-softlock），下次進關重試補載。
    });
}

export interface BossStagecraft {
  // 入場幀（各王在既有入場節拍點呼叫；入場期 active=false 無競爭演出）。
  entryFrame(step: 1 | 2 | 3 | 4): void;
  // 入場收尾：回段落立繪（introReset 完成點呼叫）。
  endEntry(): void;
  // idle 呼吸輪播（P1 限定）：由王的 update 逐幀驅動；排他演出期間讓位。
  idleBreath(deltaMs: number): void;
  // 三招分鏡：鋪在既有 telegraph 窗上（windup→charge→burst→recover→回錨）。
  moveCinematic(move: 1 | 2 | 3, telegraphMs: number): void;
  // 轉段幀序：立即更新段落立繪錨（p2＝enraged），過場幀播畢落錨。
  phaseTransition(phase: 'p2' | 'p3'): void;
  // 受擊短閃（節流；排他演出期間讓位既有 flashWhite）。
  hitFlash(): void;
  // 死亡幀序：時長 1020ms，貼齊既有 dieSequence 的 600ms 延遲＋420ms 收縮節拍。
  playDeath(): void;
  destroy(): void;
}

export function createBossStagecraft(
  scene: Phaser.Scene,
  body: Phaser.Physics.Arcade.Sprite,
  opts: { kind: StagecraftBossKind; bodyW: number; bodyH: number },
): BossStagecraft {
  const vscale = getVisualScale(scene);
  const timers: Phaser.Time.TimerEvent[] = [];
  const frameKey = (suffix: string): string => `boss-${opts.kind}-${suffix}`;
  const baseKey = `boss-${opts.kind}`;

  // 段落立繪錨（p1 base → p2 起 enraged）：分鏡收招與受擊回錨共用。
  let idleKey = baseKey;
  let dead = false;
  // 演出代際：排他演出（move/trans/death）開播即遞增，舊代際的 pending 幀作廢——
  // 高優先演出打斷低優先時不殘留錯幀。
  let generation = 0;
  // 排他演出期限：idle 輪播與受擊幀讓位判定。
  let busyUntilMs = 0;
  let lastHitAtMs = -Infinity;
  let hitToggle = false;
  let idleStep = 0;
  let idleAccMs = 0;

  const delay = (ms: number, fn: () => void): void => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 換幀單點（§125 慣例）：缺圖靜默跳過；保持顯示尺寸並重錨物理基準（§77 解耦）。
  const setFrame = (key: string): void => {
    if (!scene.textures.exists(key)) return;
    body.setTexture(key);
    body.setDisplaySize(opts.bodyW, opts.bodyH);
    vscale.rebase(body);
  };

  // 代際綁定幀：排程當下鎖定代際，被更高優先演出打斷即作廢。
  const frameAt = (ms: number, key: string, gen: number): void => {
    delay(ms, () => {
      if (generation === gen && !dead) setFrame(key);
    });
  };

  return {
    entryFrame(step) {
      if (!dead) setFrame(frameKey(`entry-${step}`));
    },
    endEntry() {
      if (dead) return;
      setFrame(idleKey);
    },
    // idle 呼吸輪播（P1 限定）：enraged 換裝後定格兇相；排他演出期間讓位並重計。
    idleBreath(deltaMs) {
      if (dead || idleKey !== baseKey) return;
      if (scene.time.now < busyUntilMs) {
        idleAccMs = 0;
        return;
      }
      idleAccMs += deltaMs;
      if (idleAccMs < IDLE_BREATH_MS) return;
      idleAccMs = 0;
      idleStep = (idleStep + 1) % 3;
      const frames = [baseKey, frameKey('idle-2'), frameKey('idle-3')] as const;
      setFrame(frames[idleStep] ?? baseKey);
    },
    moveCinematic(move, telegraphMs) {
      if (dead) return;
      generation += 1;
      const gen = generation;
      busyUntilMs = scene.time.now + telegraphMs + MOVE_SETTLE_MS;
      setFrame(frameKey(`move${move}-windup`));
      frameAt(telegraphMs * MOVE_CHARGE_RATIO, frameKey(`move${move}-charge`), gen);
      frameAt(telegraphMs, frameKey(`move${move}-burst`), gen);
      frameAt(telegraphMs + MOVE_RECOVER_MS, frameKey(`move${move}-recover`), gen);
      delay(telegraphMs + MOVE_SETTLE_MS, () => {
        if (generation === gen && !dead) setFrame(idleKey);
      });
    },
    phaseTransition(phase) {
      if (dead) return;
      generation += 1;
      const gen = generation;
      // 段落錨先行更新：即使過場被後續招式分鏡打斷，收招回錨仍落在正確立繪。
      if (phase === 'p2') idleKey = frameKey('enraged');
      const frames = phase === 'p2' ? 6 : 7;
      busyUntilMs = scene.time.now + frames * TRANS_FRAME_MS;
      for (let i = 0; i < frames; i += 1) {
        frameAt(i * TRANS_FRAME_MS, frameKey(`${phase}trans-${i + 1}`), gen);
      }
      delay(frames * TRANS_FRAME_MS, () => {
        if (generation === gen && !dead) setFrame(idleKey);
      });
    },
    hitFlash() {
      if (dead || scene.time.now < busyUntilMs) return;
      if (scene.time.now - lastHitAtMs < HIT_THROTTLE_MS) return;
      lastHitAtMs = scene.time.now;
      const gen = generation;
      hitToggle = !hitToggle;
      setFrame(frameKey(hitToggle ? 'hit-1' : 'hit-2'));
      delay(HIT_FRAME_MS, () => {
        if (generation === gen && !dead) setFrame(idleKey);
      });
    },
    playDeath() {
      if (dead) return;
      dead = true;
      generation += 1;
      let at = 0;
      for (let i = 1; i <= 6; i += 1) {
        delay(at, () => setFrame(frameKey(`death-${i}`)));
        at += DEATH_FRAME_MS;
      }
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      timers.length = 0;
    },
  };
}
