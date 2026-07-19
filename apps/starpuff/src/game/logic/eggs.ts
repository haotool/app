import type { StarFlavor } from '../core/config';

// 關卡彩蛋純邏輯（GAME_DESIGN §24，不 import phaser），vitest 對象。
// 觸發器表驅動；每關至多觸發一次（done 鎖存），獎勵落地由 GameScene 結算。
// v10（§70）：twin-finish 魔王彩蛋觸發器——時窗判定由 prismixFsm 持有（單一真值），
// GameScene 收到 twinFinish 事件即餵入，本模組只負責鎖存與獎勵對表。
// v11（§75）：vent-hit-count 窯風三連——乘噴口升空命中計數由 syrona 呈現層持有
//（沿 twin-finish 單一真值模式），滿 3 次事件餵入即鎖存。
// v12（§83）：survive-collect 星核共鳴——P2 生存段星屑收集計數由 voidra FSM 持有
//（單一真值），5 枚全收事件餵入即鎖存。

export type EggReward = 'hp-up' | 'full-magazine' | 'gold-star' | 'heal';

export type EasterEggSpec =
  | { trigger: 'reach-x'; reward: EggReward; maxX: number }
  | { trigger: 'stand-count'; reward: EggReward; platformY: number; count: number }
  | { trigger: 'eat-sequence'; reward: EggReward; sequence: readonly StarFlavor[] }
  | { trigger: 'crown-early-hit'; reward: EggReward; windowMs: number }
  | { trigger: 'twin-finish'; reward: EggReward }
  | { trigger: 'vent-hit-count'; reward: EggReward }
  | { trigger: 'survive-collect'; reward: EggReward };

export type EggEvent =
  | { kind: 'position'; x: number }
  | { kind: 'stand'; platformY: number | null }
  | { kind: 'swallow'; flavor: StarFlavor }
  | { kind: 'boss-hit'; sinceActiveMs: number }
  | { kind: 'twin-finish' }
  | { kind: 'vent-hit-count' }
  | { kind: 'survive-collect' };

export interface EggProgress {
  done: boolean;
  standCount: number;
  onTarget: boolean;
  history: readonly StarFlavor[];
}

export function createEggProgress(): EggProgress {
  return { done: false, standCount: 0, onTarget: false, history: [] };
}

export interface EggAdvanceResult {
  progress: EggProgress;
  triggered: boolean;
}

export function advanceEgg(
  spec: EasterEggSpec,
  progress: EggProgress,
  event: EggEvent,
): EggAdvanceResult {
  if (progress.done) return { progress, triggered: false };
  switch (spec.trigger) {
    case 'reach-x': {
      if (event.kind !== 'position' || event.x > spec.maxX) return { progress, triggered: false };
      return { progress: { ...progress, done: true }, triggered: true };
    }
    case 'stand-count': {
      if (event.kind !== 'stand') return { progress, triggered: false };
      const onTarget = event.platformY === spec.platformY;
      // 上升緣計數：離開平台後再站上才算一次。
      const standCount =
        onTarget && !progress.onTarget ? progress.standCount + 1 : progress.standCount;
      const triggered = standCount >= spec.count;
      return { progress: { ...progress, onTarget, standCount, done: triggered }, triggered };
    }
    case 'eat-sequence': {
      if (event.kind !== 'swallow') return { progress, triggered: false };
      const history = [...progress.history, event.flavor].slice(-spec.sequence.length);
      const triggered =
        history.length === spec.sequence.length &&
        history.every((flavor, i) => flavor === spec.sequence[i]);
      return { progress: { ...progress, history, done: triggered }, triggered };
    }
    case 'crown-early-hit': {
      if (event.kind !== 'boss-hit') return { progress, triggered: false };
      if (event.sinceActiveMs > spec.windowMs) return { progress, triggered: false };
      return { progress: { ...progress, done: true }, triggered: true };
    }
    case 'twin-finish': {
      if (event.kind !== 'twin-finish') return { progress, triggered: false };
      return { progress: { ...progress, done: true }, triggered: true };
    }
    case 'vent-hit-count': {
      if (event.kind !== 'vent-hit-count') return { progress, triggered: false };
      return { progress: { ...progress, done: true }, triggered: true };
    }
    case 'survive-collect': {
      if (event.kind !== 'survive-collect') return { progress, triggered: false };
      return { progress: { ...progress, done: true }, triggered: true };
    }
    default: {
      const exhaustive: never = spec;
      void exhaustive;
      return { progress, triggered: false };
    }
  }
}
