import type { BossAction, BossPhase } from '../core/types';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 魔王 FSM 純邏輯（GAME_DESIGN §6，不 import phaser），vitest 對象。

export const BOSS = {
  maxHp: 60,
  phase2HpRatio: 0.5,
  // P3 狂暴皇冠（§30）：HP ≤25% 進入；rain 改追蹤彈 ×5、slam 附加全場震落。
  phase3HpRatio: 0.25,
  bodyDamage: 1,
  enrageSpeedMultiplier: 1.3,
  jellyRainCountP1: 5,
  jellyRainCountP2: 7,
  homingRainCount: 5,
  homingTrackMs: 2000,
  minionSpawnHpStep: 10,
  idleMs: 1200,
  rainDurationMs: 1200,
  slamDurationMs: 1300,
  dashDurationMs: 1400,
  // 頭頂 hit window（§58）：下砸命中頭頂觸發短暈（攻擊循環停拍）。
  slamStunMs: 900,
} as const;

// EX 變體共用倍率（§58）：血量 ×1.5、節奏 ×1.15；兩魔王共用。
export const EX_MODS = {
  hpMul: 1.5,
  speedMul: 1.15,
} as const;

// 果凍王 EX 專屬（§58）：擊破時分裂小果凍（呈現層走正式 spawn 管線）。
export const EX_JELLORD = {
  splitCount: 3,
} as const;

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: BOSS.enrageSpeedMultiplier,
  p3: BOSS.enrageSpeedMultiplier,
  // p4 為 EX 專屬型態（#814）：Jellord 不可達，鍵值僅滿足 BossPhase 全鍵。
  p4: BOSS.enrageSpeedMultiplier,
};

export function phaseForHp(hp: number, maxHp: number): BossPhase {
  if (hp <= maxHp * BOSS.phase3HpRatio) return 'p3';
  return hp <= maxHp * BOSS.phase2HpRatio ? 'p2' : 'p1';
}

export function jellyRainCount(phase: BossPhase): number {
  if (phase === 'p3') return BOSS.homingRainCount;
  return phase === 'p2' ? BOSS.jellyRainCountP2 : BOSS.jellyRainCountP1;
}

// 加權選招表（§5 #813）：固定循環改權重＋條件（HP 帶/距離帶）驅動；
// dash 僅遠距帶啟用（貼身衝撞不可讀），P1 無 dash 維持既有招池。
export const JELLORD_MOVES: Record<BossPhase, readonly WeightedMove<BossAction>[]> = {
  p1: [
    { action: 'jellyRain', weight: 3 },
    { action: 'slam', weight: 3 },
  ],
  p2: [
    { action: 'jellyRain', weight: 3 },
    { action: 'slam', weight: 3 },
    { action: 'dash', weight: 2, condition: { band: 'far' } },
  ],
  p3: [
    { action: 'jellyRain', weight: 3 },
    { action: 'slam', weight: 3 },
    { action: 'dash', weight: 2, condition: { band: 'far' } },
  ],
  // p4 為 EX 專屬型態（#814）：Jellord 不可達，沿 p3 招池滿足全鍵。
  p4: [
    { action: 'jellyRain', weight: 3 },
    { action: 'slam', weight: 3 },
    { action: 'dash', weight: 2, condition: { band: 'far' } },
  ],
};

// tick 輸出給呈現層的指令：進入攻擊發攻擊指令，返回待機發 idle。
// P3（§30）：rain 帶 homing 旗標（追蹤彈）、slam 帶 quake 旗標（全場震落）。
// P2 起 slam 帶 jelly 旗標（§5 果凍回彈：踩踏落點地面果凍化）。
export type BossCommand =
  | { kind: 'idle' }
  | { kind: 'rain'; count: number; homing: boolean }
  | { kind: 'slam'; quake: boolean; jelly: boolean }
  | { kind: 'dash' };

export type BossHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' }
  // EX 擊破分裂（§58）：呈現層據此生成小果凍。
  | { kind: 'split'; count: number };

export interface BossFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: BossAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  tick(deltaMs: number): BossCommand | null;
  takeDamage(amount: number): BossHitEvent[];
  // 頭頂命中短暈（§58）：回待機並停拍 durationMs，期滿接續攻擊循環。
  stun(durationMs: number): void;
  // 距離帶餵送（§5 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface BossFsmOptions {
  ex?: boolean;
  // 加權選招亂數注入（§5：同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createBossFsm(options: BossFsmOptions = {}): BossFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(BOSS.maxHp * (ex ? EX_MODS.hpMul : 1));
  let hp: number = maxHp;
  let phase: BossPhase = 'p1';
  let state: BossAction = 'idle';
  // 近兩次出招（§5 連續同招上限 2）。
  let recentAttacks: BossAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = BOSS.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  // 時長於進入狀態當下依階段速度換算，P2 全節奏 ×1.3。
  const durationMs = (action: BossAction): number => {
    switch (action) {
      case 'idle':
        return BOSS.idleMs / speedFactor();
      case 'jellyRain':
        return BOSS.rainDurationMs / speedFactor();
      case 'slam':
        return BOSS.slamDurationMs / speedFactor();
      case 'dash':
        return BOSS.dashDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: BossAction): BossCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'jellyRain':
        return { kind: 'rain', count: jellyRainCount(phase), homing: phase === 'p3' };
      case 'slam':
        // 果凍回彈（§5）：P2 起踩踏落點地面果凍化，玩家踩上被彈起（非傷害）。
        return { kind: 'slam', quake: phase === 'p3', jelly: phase !== 'p1' };
      case 'dash':
        return { kind: 'dash' };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
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
    tick(deltaMs: number): BossCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        // 加權選招（§5）：權重＋條件（HP 帶/距離帶）＋連續同招上限 2。
        state = pickMove(
          JELLORD_MOVES[phase],
          { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): BossHitEvent[] {
      if (defeated || amount <= 0) return [];
      hp = Math.max(0, hp - amount);
      const events: BossHitEvent[] = [{ kind: 'damaged', hp }];
      const nextPhase = phaseForHp(hp, maxHp);
      if (nextPhase !== phase) {
        // 狂暴即時生效：剩餘計時依新舊速度係數換算（p2→p3 同速不重複縮短）。
        const previousFactor = SPEED_FACTORS[phase];
        phase = nextPhase;
        timerMs *= previousFactor / SPEED_FACTORS[phase];
        events.push({ kind: 'phase', phase });
      }
      if (hp > 0) {
        damageSinceDrop += amount;
        while (damageSinceDrop >= BOSS.minionSpawnHpStep) {
          damageSinceDrop -= BOSS.minionSpawnHpStep;
          events.push({ kind: 'minionDrop' });
        }
      } else {
        defeated = true;
        events.push({ kind: 'defeated' });
        // EX 擊破分裂（§58）：死亡事件後追加，呈現層於魔王位置生成小果凍。
        if (ex) events.push({ kind: 'split', count: EX_JELLORD.splitCount });
      }
      return events;
    },
    stun(durationMs: number): void {
      if (defeated) return;
      state = 'idle';
      timerMs = durationMs;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
