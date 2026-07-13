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

// 教學浮字停留時間與波內生成節奏。
export const TUTORIAL_DURATION_MS = 3000;
export const WAVE_SPAWN_INTERVAL_MS = 700;

// Boss 期補生節流：場上 < BOSS_MINION_MAX 時每 4s 補 1 隻；僅補可吸品種供彈藥。
export const BOSS_RESPAWN_INTERVAL_MS = 4000;
export const BOSS_RESPAWN_KINDS: readonly EnemyKind[] = ['jelly', 'floaty'];

export function nextWave(current: WaveId): WaveId | null {
  const index = WAVE_SEQUENCE.indexOf(current);
  return WAVE_SEQUENCE[index + 1] ?? null;
}

export function shouldSpawnBossMinion(aliveMinions: number): boolean {
  return aliveMinions < BOSS_MINION_MAX;
}

export interface WaveModelState {
  wave: WaveId;
  spawnedCount: number;
  timerMs: number;
}

export interface WaveTick {
  deltaMs: number;
  aliveEnemies: number;
}

export interface WaveTickResult {
  state: WaveModelState;
  spawns: EnemyKind[];
  waveChanged: WaveId | null;
}

export function createWaveState(): WaveModelState {
  return { wave: 'tutorial', spawnedCount: 0, timerMs: 0 };
}

// 清場判定：本波腳本全數生成且場上無存活敵人。
export function isWaveCleared(state: WaveModelState, aliveEnemies: number): boolean {
  return state.spawnedCount >= WAVE_SPECS[state.wave].spawns.length && aliveEnemies === 0;
}

// 每 tick 推進：先判轉場、再判生成；timerMs 進入戰鬥波時預載一個間隔使首隻立即生成。
export function advanceWave(state: WaveModelState, tick: WaveTick): WaveTickResult {
  let { wave, spawnedCount, timerMs } = state;
  timerMs += tick.deltaMs;
  const spawns: EnemyKind[] = [];
  let waveChanged: WaveId | null = null;

  const shouldAdvance =
    wave === 'tutorial'
      ? timerMs >= TUTORIAL_DURATION_MS
      : wave !== 'boss' && isWaveCleared({ wave, spawnedCount, timerMs }, tick.aliveEnemies);

  if (shouldAdvance) {
    wave = nextWave(wave) ?? 'boss';
    waveChanged = wave;
    spawnedCount = 0;
    timerMs = wave === 'boss' ? 0 : WAVE_SPAWN_INTERVAL_MS;
  }

  if (wave === 'boss') {
    if (timerMs >= BOSS_RESPAWN_INTERVAL_MS && shouldSpawnBossMinion(tick.aliveEnemies)) {
      timerMs = 0;
      spawns.push(BOSS_RESPAWN_KINDS[spawnedCount % BOSS_RESPAWN_KINDS.length] ?? 'jelly');
      spawnedCount += 1;
    }
  } else {
    const script = WAVE_SPECS[wave].spawns;
    while (spawnedCount < script.length && timerMs >= WAVE_SPAWN_INTERVAL_MS) {
      timerMs -= WAVE_SPAWN_INTERVAL_MS;
      spawns.push(script[spawnedCount] ?? 'jelly');
      spawnedCount += 1;
    }
  }

  return { state: { wave, spawnedCount, timerMs }, spawns, waveChanged };
}
