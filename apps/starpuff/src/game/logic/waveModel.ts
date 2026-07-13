import type { EnemyKind, WaveId } from '../core/types';

// 波次腳本純邏輯（GAME_DESIGN §3，不 import phaser），vitest 對象。

export const WAVE_SEQUENCE: readonly WaveId[] = ['tutorial', 'wave1', 'wave2', 'boss'];

export interface WaveSpec {
  spawns: readonly EnemyKind[];
}

export const WAVE_SPECS: Record<WaveId, WaveSpec> = {
  tutorial: { spawns: [] },
  wave1: { spawns: ['jelly', 'jelly', 'jelly'] },
  wave2: { spawns: ['jelly', 'floaty', 'spiky', 'floaty'] },
  boss: { spawns: [] },
};

// Boss 戰期間持續補生 1–2 隻小怪供彈藥。
export const BOSS_MINION_MIN = 1;
export const BOSS_MINION_MAX = 2;

export function nextWave(current: WaveId): WaveId | null {
  const index = WAVE_SEQUENCE.indexOf(current);
  return WAVE_SEQUENCE[index + 1] ?? null;
}

// TODO(US-004)：波次完成條件（全滅 + 教學浮字停留時間）與補生節奏。
export function shouldSpawnBossMinion(aliveMinions: number): boolean {
  return aliveMinions < BOSS_MINION_MIN;
}
