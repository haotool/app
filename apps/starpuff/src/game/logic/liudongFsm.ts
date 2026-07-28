import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 劉董・崩盤之王 Liudong FSM 純邏輯（GAME_DESIGN §126，PRD §6，不 import phaser），
// vitest 對象。迷因終盤魔王三段（地面持機型）：P1 三市場輪替（思考泡泡圖示輪轉＝
// 預告即機制，攻擊前奏召對應小怪、1–2s 輸出窗）→ P2 全屏壓力（箭雨/K 線海嘯/
// 牛熊交叉/轉帳鏈/空頭雷射；每次全屏後有反擊窗、不連續同型全屏）→ P3 終局
//（末日箭/熊市核心/清算通知/熔斷倒數→長脆弱窗；HP ≤12% 一次性最後轉帳黑洞→
// 撐過反噬）。失敗保護（PRD §6.7）：首見新招 −15%、連續三次受傷自動降節奏、
// 招池恆為 phase 的純函式（重試不加新招）；EX 才啟用假突破/反向假箭頭/窄通道。
// phase truth 全數收斂於此，禁止散落 scene。

export const LIUDONG = {
  // 魔王 HP 階梯（終局章接續 §123 遞增）：Gravion 124 → Liudong 148（全遊戲頂點；
  // 落地持機型全程可傷，血池補償 free-hit 面——156 實測 high bot 攻堅不達 P3、
  // 132 實測 26.7s 融化，公平性修正（雙車道缺口/雷射貼地豁免）後收斂 148）。
  maxHp: 148,
  bodyDamage: 1,
  // 階段轉換閾值（PRD §6.6）：P2 ≤70%、P3 ≤35%。
  p2HpRatio: 0.7,
  p3HpRatio: 0.35,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // 最後轉帳（P3 一次性）：HP 閾值與黑洞牽引窗（18%——低於此值脆弱窗融血
  // 會使終盤演出不可達，實測回調）。
  finalTransferHpRatio: 0.18,
  // 輸出窗（PRD P1 1–2s 上緣；僵直窗固定不隨狂暴縮短，§74 慣例）——
  // 1600/1400/1300 實測把 high bot 壓進永久防禦態（射速 3.1→1.5 發/s、
  // 輸出崩潰 0% 通關），輸出窗與攻擊密度必須成對平衡。
  idleMs: { p1: 1900, p2: 1600, p3: 1500, p4: 1500 },
  // 全屏招後反擊窗延長（PRD §6.6 P2「每次全屏後有反擊窗」）。
  fullscreenRecoverBonusMs: 900,
  // 招式時長。
  usstockDurationMs: 2600,
  cryptoDurationMs: 2400,
  twstockDurationMs: 2800,
  arrowrainDurationMs: 4200,
  klinewaveDurationMs: 2800,
  bullbearDurationMs: 1600,
  transferchainDurationMs: 2600,
  shortlaserDurationMs: 2200,
  fakeoutDurationMs: 2000,
  doomarrowDurationMs: 3600,
  bearcoreDurationMs: 1600,
  liquidationDurationMs: 3200,
  circuitbreakerDurationMs: 5600,
  finaltransferDurationMs: 6200,
  // 思考／下單前奏（PRD §6.3 預告即機制）：歪頭＋三圖示輪轉 → 拍板＋平板下單。
  // 兩段皆為可讀前搖（合計 1.8s），呈現層依市場圖示先行顯示攻擊種類。
  thinkMs: 1100,
  orderMs: 700,
  // telegraph 時長（呈現層讀取；固定不隨狂暴縮放，≥600ms 可讀性紅線；
  // 含召喚類一併錨定——W2 540ms 漏網教訓）。
  usstockTelegraphMs: 800,
  cryptoTelegraphMs: 750,
  // 熔斷牆缺口警示 0.8s（PRD §6.4 明文）。
  twstockTelegraphMs: 800,
  // 全屏箭頭陰影預警 ≥600ms（PRD §6.5 硬規則）。
  arrowShadowMs: 650,
  klinewaveTelegraphMs: 800,
  bullbearTelegraphMs: 700,
  transferchainTelegraphMs: 750,
  shortlaserTelegraphMs: 900,
  fakeoutTelegraphMs: 700,
  doomarrowTelegraphMs: 900,
  bearcoreTelegraphMs: 700,
  liquidationTelegraphMs: 700,
  circuitbreakerTelegraphMs: 800,
  finaltransferTelegraphMs: 1000,
  // 熔斷倒數（P3）：倒數撐過後接長脆弱窗（受擊 ×2；窗長實測回調防融血跳段）。
  circuitbreakerCountdownMs: 3600,
  circuitbreakerVulnerableMs: 2600,
  // 最後轉帳：黑洞牽引窗撐過後反噬（自傷）＋長脆弱窗。
  finaltransferHoldMs: 4200,
  finaltransferRecoilDamage: 6,
  finaltransferVulnerableMs: 4000,
  // 脆弱窗受擊倍率。
  vulnerableDamageMul: 2,
  // 失敗保護（PRD §6.7）：首見新招速度 −15%；連續三次受傷自動降攻擊節奏。
  firstSeenSpeedMul: 0.85,
  mercyHitCount: 3,
  mercySlowdownMul: 0.8,
  mercyDurationMs: 8000,
} as const;

// 劉董 EX 專屬差分（§58 EX 慣例：HP/節奏走 EX_MODS 共用倍率）：
// 質性差分＝假突破入池＋箭雨第三批反向假箭頭＋末日箭窄通道（PRD §6.7
// 「EX 才啟用」明文；telegraph 與脆弱窗不縮——只增體不縮窗）。
export const EX_LIUDONG = {
  fakeoutWeight: 2,
  arrowrainBatches: 3,
  doomarrowNarrow: true,
} as const;

export type MarketKind = 'usstock' | 'crypto' | 'twstock';

const MARKETS: readonly MarketKind[] = ['usstock', 'crypto', 'twstock'];

export type LiudongAction =
  | 'idle'
  | 'usstock'
  | 'crypto'
  | 'twstock'
  | 'arrowrain'
  | 'klinewave'
  | 'bullbear'
  | 'transferchain'
  | 'shortlaser'
  | 'fakeout'
  | 'doomarrow'
  | 'bearcore'
  | 'liquidation'
  | 'circuitbreaker'
  | 'finaltransfer';

// 全屏家族（PRD §6.6「不連續同型全屏」）：上一發全屏招不得緊接同型。
const FULLSCREEN_ACTIONS: readonly LiudongAction[] = [
  'arrowrain',
  'klinewave',
  'doomarrow',
  'liquidation',
];

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/liudong.ts／
// liudongCinematics.ts 承擔。firstSeen＝本場首見（呈現層彈體速度 ×0.85）。
export type LiudongCommand =
  | { kind: 'idle' }
  | { kind: 'market'; market: MarketKind; firstSeen: boolean }
  | { kind: 'arrowrain'; batches: number; firstSeen: boolean }
  | { kind: 'klinewave'; firstSeen: boolean }
  | { kind: 'bullbear'; firstSeen: boolean }
  | { kind: 'transferchain'; firstSeen: boolean }
  | { kind: 'shortlaser'; firstSeen: boolean }
  | { kind: 'fakeout'; firstSeen: boolean }
  | { kind: 'doomarrow'; narrow: boolean; firstSeen: boolean }
  | { kind: 'bearcore'; firstSeen: boolean }
  | { kind: 'liquidation'; firstSeen: boolean }
  | {
      kind: 'circuitbreaker';
      countdownMs: number;
      vulnerableMs: number;
      firstSeen: boolean;
    }
  | { kind: 'finaltransfer'; holdMs: number; firstSeen: boolean };

export type LiudongHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: LIUDONG.enrageSpeedMultiplier,
  p3: LIUDONG.enrageSpeedMultiplier,
  p4: LIUDONG.enrageSpeedMultiplier,
};

// 加權選招表（§111.1 moveTable SSOT）：P1 三市場輪替；P2 全屏壓力池（fakeout
// EX 才有權重）；P3 終局池。招池為 phase 的純函式——重試不因死亡數加新招
//（PRD §6.7「前三次死亡不加新招」由結構保證，liudongFsm.test 釘住）。
export function liudongMoveTable(
  phase: BossPhase,
  ex: boolean,
): readonly WeightedMove<LiudongAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'usstock', weight: 3 },
        { action: 'crypto', weight: 3 },
        { action: 'twstock', weight: 3 },
      ];
    case 'p2':
      return [
        { action: 'arrowrain', weight: 3 },
        { action: 'klinewave', weight: 2 },
        { action: 'bullbear', weight: 2 },
        { action: 'transferchain', weight: 2 },
        { action: 'shortlaser', weight: 2, condition: { band: 'far' } },
        { action: 'fakeout', weight: ex ? EX_LIUDONG.fakeoutWeight : 0 },
      ];
    // p4 執行期不可達（無 EX P4 型態）：沿 p3 招池補鍵位。
    case 'p3':
    case 'p4':
      return [
        { action: 'doomarrow', weight: 3 },
        { action: 'bearcore', weight: 2 },
        { action: 'liquidation', weight: 2 },
        { action: 'circuitbreaker', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface LiudongFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: LiudongAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  // 脆弱窗即時值（熔斷倒數撐過／最後轉帳反噬）：呈現層讀取做金光提示。
  readonly vulnerable: boolean;
  tick(deltaMs: number): LiudongCommand | null;
  takeDamage(amount: number): LiudongHitEvent[];
  // 頭頂 hit window（§58 落地王慣例）：衝勢招與終局招不可暈，其餘回待機停拍。
  stun(durationMs: number): boolean;
  // 距離帶餵送（§111.1 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
  // 失敗保護（PRD §6.7）：玩家受傷回報——連續 mercyHitCount 次（期間未反擊）
  // 自動降攻擊節奏 mercyDurationMs。
  notePlayerHurt(): void;
  // 思考下單中斷（稜化優勢情境）：market 前奏期被稜片命中即取消本次下單，
  // 回待機（僅 market 招可斷；成功回 true）。
  tryInterruptOrder(): boolean;
}

export interface LiudongFsmOptions {
  ex?: boolean;
  // 亂數注入（加權選招；同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createLiudongFsm(options: LiudongFsmOptions = {}): LiudongFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(LIUDONG.maxHp * (ex ? EX_MODS.hpMul : 1));

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: LiudongAction = 'idle';
  let recentAttacks: LiudongAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = LIUDONG.idleMs.p1;
  let damageSinceDrop = 0;
  let clockMs = 0;
  let defeated = false;
  // 首見新招（PRD §6.7）：本場已見招式集合——首發速度 −15%（呈現層消費）。
  const seenActions = new Set<LiudongAction>();
  // 上一發全屏招（不連續同型全屏）。
  let lastFullscreen: LiudongAction | null = null;
  // 上一招是否全屏（反擊窗延長）。
  let recoverBonusPending = false;
  // 連續受傷降節奏（PRD §6.7）：玩家連續受傷計數（boss 受擊即歸零）與慈悲窗迄點。
  let consecutiveHurts = 0;
  let mercyUntilMs = Number.NEGATIVE_INFINITY;
  // 脆弱窗（熔斷倒數／最後轉帳反噬）：窗內受擊 ×2。
  let vulnerableFromMs = Number.POSITIVE_INFINITY;
  let vulnerableUntilMs = Number.NEGATIVE_INFINITY;
  // 最後轉帳一次性鎖存。
  let finalTransferUsed = false;
  // 市場輪替錨（P1 連抽避重由 SAME_MOVE_CAP 承擔；市場圖示輪轉由呈現層做）。
  let marketCursor = Math.floor(rng() * MARKETS.length);

  const isVulnerable = (): boolean => clockMs >= vulnerableFromMs && clockMs < vulnerableUntilMs;

  const speedFactor = (): number => {
    const mercy = clockMs < mercyUntilMs ? LIUDONG.mercySlowdownMul : 1;
    return SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1) * mercy;
  };

  // 首見判定＋鎖存：首發回 true（時長 ÷ firstSeenSpeedMul＝變慢 15%）。
  const noteFirstSeen = (action: LiudongAction): boolean => {
    if (seenActions.has(action)) return false;
    seenActions.add(action);
    return true;
  };

  const durationMs = (action: LiudongAction, firstSeen: boolean): number => {
    const slow = firstSeen ? 1 / LIUDONG.firstSeenSpeedMul : 1;
    switch (action) {
      // 僵直窗＝固定輸出窗：不隨狂暴縮短；全屏招後加反擊窗（PRD §6.6）。
      case 'idle': {
        const bonus = recoverBonusPending ? LIUDONG.fullscreenRecoverBonusMs : 0;
        return LIUDONG.idleMs[phase] + bonus;
      }
      case 'usstock':
        return (
          ((LIUDONG.usstockDurationMs + LIUDONG.thinkMs + LIUDONG.orderMs) / speedFactor()) * slow
        );
      case 'crypto':
        return (
          ((LIUDONG.cryptoDurationMs + LIUDONG.thinkMs + LIUDONG.orderMs) / speedFactor()) * slow
        );
      case 'twstock':
        return (
          ((LIUDONG.twstockDurationMs + LIUDONG.thinkMs + LIUDONG.orderMs) / speedFactor()) * slow
        );
      case 'arrowrain':
        return (LIUDONG.arrowrainDurationMs / speedFactor()) * slow;
      case 'klinewave':
        return (LIUDONG.klinewaveDurationMs / speedFactor()) * slow;
      case 'bullbear':
        return (LIUDONG.bullbearDurationMs / speedFactor()) * slow;
      case 'transferchain':
        return (LIUDONG.transferchainDurationMs / speedFactor()) * slow;
      case 'shortlaser':
        return (LIUDONG.shortlaserDurationMs / speedFactor()) * slow;
      case 'fakeout':
        return (LIUDONG.fakeoutDurationMs / speedFactor()) * slow;
      case 'doomarrow':
        return (LIUDONG.doomarrowDurationMs / speedFactor()) * slow;
      case 'bearcore':
        return (LIUDONG.bearcoreDurationMs / speedFactor()) * slow;
      case 'liquidation':
        return (LIUDONG.liquidationDurationMs / speedFactor()) * slow;
      // 熔斷倒數與最後轉帳＝生存窗語彙：時長固定不隨狂暴/首見縮放。
      case 'circuitbreaker':
        return LIUDONG.circuitbreakerDurationMs;
      case 'finaltransfer':
        return LIUDONG.finaltransferDurationMs;
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: LiudongAction, firstSeen: boolean): LiudongCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'usstock':
      case 'crypto':
      case 'twstock':
        return { kind: 'market', market: action, firstSeen };
      case 'arrowrain':
        return {
          kind: 'arrowrain',
          batches: ex ? EX_LIUDONG.arrowrainBatches : 2,
          firstSeen,
        };
      case 'klinewave':
        return { kind: 'klinewave', firstSeen };
      case 'bullbear':
        return { kind: 'bullbear', firstSeen };
      case 'transferchain':
        return { kind: 'transferchain', firstSeen };
      case 'shortlaser':
        return { kind: 'shortlaser', firstSeen };
      case 'fakeout':
        return { kind: 'fakeout', firstSeen };
      case 'doomarrow':
        return {
          kind: 'doomarrow',
          narrow: ex && EX_LIUDONG.doomarrowNarrow,
          firstSeen,
        };
      case 'bearcore':
        return { kind: 'bearcore', firstSeen };
      case 'liquidation':
        return { kind: 'liquidation', firstSeen };
      case 'circuitbreaker': {
        // 脆弱窗鎖存：倒數撐過即開（窗內受擊 ×2＝「撐過即反噬」的獎勵面）。
        vulnerableFromMs = clockMs + LIUDONG.circuitbreakerCountdownMs;
        vulnerableUntilMs =
          clockMs + LIUDONG.circuitbreakerCountdownMs + LIUDONG.circuitbreakerVulnerableMs;
        return {
          kind: 'circuitbreaker',
          countdownMs: LIUDONG.circuitbreakerCountdownMs,
          vulnerableMs: LIUDONG.circuitbreakerVulnerableMs,
          firstSeen,
        };
      }
      case 'finaltransfer': {
        vulnerableFromMs = clockMs + LIUDONG.finaltransferHoldMs;
        vulnerableUntilMs =
          clockMs + LIUDONG.finaltransferHoldMs + LIUDONG.finaltransferVulnerableMs;
        return { kind: 'finaltransfer', holdMs: LIUDONG.finaltransferHoldMs, firstSeen };
      }
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  // P1 市場輪替（PRD「三市場輪替」）：加權抽選後沿輪替錨避免同市場僵持——
  // SAME_MOVE_CAP 防三連，此處再保證輪替感（抽中上次市場時前移一位）。
  const rotateMarket = (picked: LiudongAction): LiudongAction => {
    if (picked !== 'usstock' && picked !== 'crypto' && picked !== 'twstock') return picked;
    const last = recentAttacks[recentAttacks.length - 1];
    if (picked !== last) return picked;
    marketCursor = (marketCursor + 1) % MARKETS.length;
    const next = MARKETS[marketCursor];
    return next === last
      ? (MARKETS[(marketCursor + 1) % MARKETS.length] ?? picked)
      : (next ?? picked);
  };

  const enterPhase = (next: BossPhase, events: LiudongHitEvent[]): void => {
    phase = next;
    state = 'idle';
    recentAttacks = [];
    lastFullscreen = null;
    recoverBonusPending = false;
    timerMs = durationMs('idle', false);
    events.push({ kind: 'phase', phase: next });
  };

  return {
    get hp() {
      return hp;
    },
    get maxHp() {
      return maxHp;
    },
    get phase() {
      return phase;
    },
    get state() {
      return state;
    },
    get speedFactor() {
      return speedFactor();
    },
    get defeated() {
      return defeated;
    },
    get vulnerable() {
      return isVulnerable();
    },
    tick(deltaMs: number): LiudongCommand | null {
      if (defeated) return null;
      clockMs += deltaMs;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        recoverBonusPending = false;
        // 最後轉帳（P3 一次性）：HP 低於閾值後的首個出招位強制接管。
        if (
          !finalTransferUsed &&
          (phase === 'p3' || phase === 'p4') &&
          hp <= maxHp * LIUDONG.finalTransferHpRatio
        ) {
          finalTransferUsed = true;
          state = 'finaltransfer';
        } else {
          // 不連續同型全屏（PRD §6.6）：上一發全屏招自本次候選剔除。
          const table = liudongMoveTable(phase, ex).filter(
            (move) => move.action !== lastFullscreen,
          );
          state = rotateMarket(
            pickMove(
              table,
              { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
              recentAttacks,
              rng,
            ),
          );
        }
        recentAttacks = [...recentAttacks.slice(-1), state];
        const fullscreen = FULLSCREEN_ACTIONS.includes(state);
        lastFullscreen = fullscreen ? state : null;
        recoverBonusPending = fullscreen;
        const firstSeen = noteFirstSeen(state);
        timerMs += durationMs(state, firstSeen);
        return commandOf(state, firstSeen);
      }
      state = 'idle';
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs('idle', false);
      return { kind: 'idle' };
    },
    takeDamage(amount: number): LiudongHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: LiudongHitEvent[] = [];
      // 脆弱窗受擊 ×2（熔斷倒數撐過／最後轉帳反噬）。
      const dealt = isVulnerable() ? amount * LIUDONG.vulnerableDamageMul : amount;
      hp = Math.max(0, hp - dealt);
      // 玩家有效反擊：連續受傷計數歸零（降節奏僅服務「被壓著打」情境）。
      consecutiveHurts = 0;
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += dealt;
      while (damageSinceDrop >= LIUDONG.minionSpawnHpStep) {
        damageSinceDrop -= LIUDONG.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨多閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * LIUDONG.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * LIUDONG.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    stun(durationMs_: number): boolean {
      // 生存窗招（熔斷倒數/最後轉帳）與牛熊召喚不可暈；其餘回待機停拍（§58 落地王慣例）。
      if (defeated) return false;
      if (state === 'circuitbreaker' || state === 'finaltransfer' || state === 'bullbear') {
        return false;
      }
      state = 'idle';
      timerMs = durationMs_;
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
    notePlayerHurt(): void {
      if (defeated) return;
      consecutiveHurts += 1;
      if (consecutiveHurts >= LIUDONG.mercyHitCount) {
        consecutiveHurts = 0;
        mercyUntilMs = clockMs + LIUDONG.mercyDurationMs;
      }
    },
    tryInterruptOrder(): boolean {
      // 稜化斷單（§126 優勢情境，沿 §58 interruptSummon 同構）：市場招執行期
      // 被稜片命中即取消本次下單，回待機輸出窗。
      if (defeated) return false;
      if (state !== 'usstock' && state !== 'crypto' && state !== 'twstock') return false;
      state = 'idle';
      timerMs = durationMs('idle', false);
      return true;
    },
  };
}
