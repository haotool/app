import {
  PPR_ANCHOR_PRICE,
  PPR_BASE_STEP_MAX,
  PPR_BASE_STEP_MIN,
  PPR_JUMP_CHAIN_PROBABILITY,
  PPR_JUMP_MAX,
  PPR_JUMP_MIN,
  PPR_JUMP_PROBABILITY,
  PPR_JUMP_TAIL_POWER,
  PPR_PRICE_MAX,
  PPR_PRICE_MIN,
  PPR_REGIME_DRIFT,
  PPR_REGIME_NEXT,
  PPR_REGIME_STAY,
  PPR_REVERSION_BASE,
  PPR_REVERSION_OUTBAND,
  PPR_SEED_PRICE,
  PPR_SOFT_MAX,
  PPR_SOFT_MIN,
  PPR_WICK_MAX,
  PPR_WICK_MIN,
  PPR_WICK_PROBABILITY,
  type PprRegime,
} from './config';

export type Rng = () => number;

export interface PprEngine {
  tick(): number;
  getPrice(): number;
  getRegime(): PprRegime;
}

export function uniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

// 冪次長尾取樣：power 越大分佈越貼近 min，極端值稀少地逼近 max（power=1 退化為均勻）。
export function sampleFatTail(rng: Rng, min: number, max: number, power: number): number {
  return min + (max - min) * rng() ** power;
}

function randomSign(rng: Rng): number {
  return rng() < 0.5 ? -1 : 1;
}

// regime 轉移：多數 tick 停留原態；離開時依權重表抽下一態。
export function nextRegime(rng: Rng, current: PprRegime): PprRegime {
  if (rng() < PPR_REGIME_STAY[current]) return current;
  const roll = rng();
  let cumulative = 0;
  for (const [state, weight] of PPR_REGIME_NEXT[current]) {
    cumulative += weight;
    if (roll < cumulative) return state;
  }
  return current;
}

// 跳躍擴散價格引擎（R6-10 強化）：
// regime 漂移＋基準游走 → 機率肥尾跳躍（可連鎖）→ 偶發插針（單 tick、必回彈）
// → log 空間錨回歸 → 硬護欄。護欄與回歸為所有路徑的統一收斂點，新機制不繞過。
export function createPprEngine(seed = PPR_SEED_PRICE, rng: Rng = Math.random): PprEngine {
  let price = seed;
  let jumped = false;
  let regime: PprRegime = 'range';
  let wickRecoveryPrice: number | null = null;

  function settle(raw: number): number {
    const strength =
      raw < PPR_SOFT_MIN || raw > PPR_SOFT_MAX ? PPR_REVERSION_OUTBAND : PPR_REVERSION_BASE;
    const reverted = Math.exp(
      Math.log(raw) + strength * (Math.log(PPR_ANCHOR_PRICE) - Math.log(raw)),
    );
    price = Math.min(PPR_PRICE_MAX, Math.max(PPR_PRICE_MIN, reverted));
    return price;
  }

  function tick(): number {
    // 插針回彈：上一 tick 為插針，本 tick 直接回到插針前價位附近（僅疊基準噪聲），不連鎖。
    if (wickRecoveryPrice !== null) {
      const anchor = wickRecoveryPrice;
      wickRecoveryPrice = null;
      const noise = 1 + randomSign(rng) * uniform(rng, PPR_BASE_STEP_MIN, PPR_BASE_STEP_MAX);
      return settle(anchor * noise);
    }

    regime = nextRegime(rng, regime);

    // 偶發插針：上行 ×(1+m)、下行 ÷(1+m)，log 對稱且恆為正值。
    if (rng() < PPR_WICK_PROBABILITY) {
      wickRecoveryPrice = price;
      const up = randomSign(rng) > 0;
      const magnitude = uniform(rng, PPR_WICK_MIN, PPR_WICK_MAX);
      return settle(price * (up ? 1 + magnitude : 1 / (1 + magnitude)));
    }

    let factor =
      1 +
      PPR_REGIME_DRIFT[regime] +
      randomSign(rng) * uniform(rng, PPR_BASE_STEP_MIN, PPR_BASE_STEP_MAX);
    const jumpChance = jumped ? PPR_JUMP_CHAIN_PROBABILITY : PPR_JUMP_PROBABILITY;
    if (rng() < jumpChance) {
      factor *=
        1 + randomSign(rng) * sampleFatTail(rng, PPR_JUMP_MIN, PPR_JUMP_MAX, PPR_JUMP_TAIL_POWER);
      jumped = true;
    } else {
      jumped = false;
    }
    return settle(price * factor);
  }

  return { tick, getPrice: () => price, getRegime: () => regime };
}
