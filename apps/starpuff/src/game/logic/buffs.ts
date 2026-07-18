// 短期增益純邏輯（GAME_DESIGN §69，不 import phaser），vitest 對象。
// 魔王關限定拾取（前室二選一＋arena 高風險位）；同時僅存一個、後拾覆蓋；
// anti-softlock 硬規則：增益永不為破關必需（純加成，時效 10–15s）。

export type BuffId = 'shield' | 'power' | 'swift';

export interface BuffSpec {
  id: BuffId;
  nameZh: string;
  durationMs: number;
  // 星彈傷害倍率（power）；其餘為 1。
  damageMul: number;
  // 移速／加減速倍率（swift）；其餘為 1。
  speedMul: number;
  accelMul: number;
  // 護盾（shield）：吸收 1 次任意傷害後即失效。
  blocksOneHit: boolean;
  tint: number;
}

export const BUFF_SPECS: Record<BuffId, BuffSpec> = {
  shield: {
    id: 'shield',
    nameZh: '護盾泡',
    durationMs: 15_000,
    damageMul: 1,
    speedMul: 1,
    accelMul: 1,
    blocksOneHit: true,
    tint: 0x9fd8f0,
  },
  power: {
    id: 'power',
    nameZh: '星力果',
    durationMs: 10_000,
    damageMul: 1.5,
    speedMul: 1,
    accelMul: 1,
    blocksOneHit: false,
    tint: 0xffc93c,
  },
  swift: {
    id: 'swift',
    nameZh: '疾風靴',
    durationMs: 12_000,
    damageMul: 1,
    speedMul: 1.3,
    accelMul: 1.4,
    blocksOneHit: false,
    tint: 0xa8e8b8,
  },
} as const;

export interface BuffState {
  id: BuffId | null;
  remainingMs: number;
}

export function createBuffState(): BuffState {
  return { id: null, remainingMs: 0 };
}

// 拾取（§69 規則 1）：同時僅存一個，後拾覆蓋重計時效。
export function pickupBuff(_state: BuffState, id: BuffId): BuffState {
  return { id, remainingMs: BUFF_SPECS[id].durationMs };
}

export interface BuffTickResult {
  state: BuffState;
  expired: boolean;
}

export function tickBuff(state: BuffState, deltaMs: number): BuffTickResult {
  if (state.id === null) return { state, expired: false };
  const remainingMs = state.remainingMs - deltaMs;
  if (remainingMs <= 0) return { state: createBuffState(), expired: true };
  return { state: { ...state, remainingMs }, expired: false };
}

export interface ShieldBlockResult {
  state: BuffState;
  blocked: boolean;
}

// 護盾格擋（§69）：吸收 1 次任意傷害（彈幕/接觸/hazard），破盾即失效。
export function consumeShieldBlock(state: BuffState): ShieldBlockResult {
  if (state.id === null || !BUFF_SPECS[state.id].blocksOneHit) return { state, blocked: false };
  return { state: createBuffState(), blocked: true };
}

export function buffDamageMul(state: BuffState): number {
  return state.id === null ? 1 : BUFF_SPECS[state.id].damageMul;
}

export function buffSpeedMul(state: BuffState): number {
  return state.id === null ? 1 : BUFF_SPECS[state.id].speedMul;
}

export function buffAccelMul(state: BuffState): number {
  return state.id === null ? 1 : BUFF_SPECS[state.id].accelMul;
}
