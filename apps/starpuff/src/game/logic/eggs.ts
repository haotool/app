import type { StarFlavor } from '../core/config';

// 關卡彩蛋純邏輯（GAME_DESIGN §24，不 import phaser），vitest 對象。
// 觸發器四型表驅動；每關至多觸發一次（done 鎖存），獎勵落地由 GameScene 結算。

export type EggReward = 'hp-up' | 'full-magazine' | 'gold-star' | 'heal';

export type EasterEggSpec =
  | { trigger: 'reach-x'; reward: EggReward; maxX: number }
  | { trigger: 'stand-count'; reward: EggReward; platformY: number; count: number }
  | { trigger: 'eat-sequence'; reward: EggReward; sequence: readonly StarFlavor[] }
  | { trigger: 'crown-early-hit'; reward: EggReward; windowMs: number };

export type EggEvent =
  | { kind: 'position'; x: number }
  | { kind: 'stand'; platformY: number | null }
  | { kind: 'swallow'; flavor: StarFlavor }
  | { kind: 'boss-hit'; sinceActiveMs: number };

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
    default: {
      const exhaustive: never = spec;
      void exhaustive;
      return { progress, triggered: false };
    }
  }
}
