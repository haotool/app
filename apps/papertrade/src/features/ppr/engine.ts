import {
  PPR_ANCHOR_PRICE,
  PPR_BASE_STEP_MAX,
  PPR_BASE_STEP_MIN,
  PPR_JUMP_CHAIN_PROBABILITY,
  PPR_JUMP_MAX,
  PPR_JUMP_MIN,
  PPR_JUMP_PROBABILITY,
  PPR_PRICE_MAX,
  PPR_PRICE_MIN,
  PPR_REVERSION_BASE,
  PPR_REVERSION_OUTBAND,
  PPR_SEED_PRICE,
  PPR_SOFT_MAX,
  PPR_SOFT_MIN,
} from './config';

export type Rng = () => number;

export interface PprEngine {
  tick(): number;
  getPrice(): number;
}

export function uniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomSign(rng: Rng): number {
  return rng() < 0.5 ? -1 : 1;
}

// 跳躍擴散價格引擎：基準游走 → 機率跳躍（可連鎖）→ log 空間錨回歸 → 硬護欄。
export function createPprEngine(seed = PPR_SEED_PRICE, rng: Rng = Math.random): PprEngine {
  let price = seed;
  let jumped = false;

  function tick(): number {
    let factor = 1 + randomSign(rng) * uniform(rng, PPR_BASE_STEP_MIN, PPR_BASE_STEP_MAX);
    const jumpChance = jumped ? PPR_JUMP_CHAIN_PROBABILITY : PPR_JUMP_PROBABILITY;
    if (rng() < jumpChance) {
      factor *= 1 + randomSign(rng) * uniform(rng, PPR_JUMP_MIN, PPR_JUMP_MAX);
      jumped = true;
    } else {
      jumped = false;
    }
    let next = price * factor;
    const strength =
      next < PPR_SOFT_MIN || next > PPR_SOFT_MAX ? PPR_REVERSION_OUTBAND : PPR_REVERSION_BASE;
    next = Math.exp(Math.log(next) + strength * (Math.log(PPR_ANCHOR_PRICE) - Math.log(next)));
    price = Math.min(PPR_PRICE_MAX, Math.max(PPR_PRICE_MIN, next));
    return price;
  }

  return { tick, getPrice: () => price };
}
