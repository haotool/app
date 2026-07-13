import { describe, expect, it } from 'vitest';
import { canInhale } from './combat';
import {
  BOSS_RESPAWN_INTERVAL_MS,
  BOSS_RESPAWN_KINDS,
  TUTORIAL_DURATION_MS,
  WAVE_SEQUENCE,
  WAVE_SPAWN_INTERVAL_MS,
  WAVE_SPECS,
  advanceWave,
  createWaveState,
  isWaveCleared,
  nextWave,
  shouldSpawnBossMinion,
  type WaveModelState,
} from './waveModel';

function tick(state: WaveModelState, deltaMs: number, aliveEnemies: number) {
  return advanceWave(state, { deltaMs, aliveEnemies });
}

function bossState(): WaveModelState {
  return { wave: 'boss', spawnedCount: 0, timerMs: 0 };
}

describe('waveModel', () => {
  it('波次順序：tutorial → wave1 → wave2 → boss', () => {
    expect(WAVE_SEQUENCE).toEqual(['tutorial', 'wave1', 'wave2', 'boss']);
  });

  it('Wave1 出 3 隻果凍丁、Wave2 混合 4 隻', () => {
    expect(WAVE_SPECS.wave1.spawns).toHaveLength(3);
    expect(WAVE_SPECS.wave1.spawns.every((kind) => kind === 'jelly')).toBe(true);
    expect(WAVE_SPECS.wave2.spawns).toHaveLength(4);
  });

  it('nextWave 依序推進，boss 之後為 null', () => {
    expect(nextWave('tutorial')).toBe('wave1');
    expect(nextWave('wave2')).toBe('boss');
    expect(nextWave('boss')).toBeNull();
  });

  it('Boss 戰場上小怪 <2 時需補生、滿 2 隻不補', () => {
    expect(shouldSpawnBossMinion(0)).toBe(true);
    expect(shouldSpawnBossMinion(1)).toBe(true);
    expect(shouldSpawnBossMinion(2)).toBe(false);
  });

  it('初始狀態為教學波', () => {
    expect(createWaveState()).toEqual({ wave: 'tutorial', spawnedCount: 0, timerMs: 0 });
  });

  it('清場判定：需全數生成且場上歸零', () => {
    expect(isWaveCleared({ wave: 'wave1', spawnedCount: 3, timerMs: 0 }, 0)).toBe(true);
    expect(isWaveCleared({ wave: 'wave1', spawnedCount: 3, timerMs: 0 }, 1)).toBe(false);
    expect(isWaveCleared({ wave: 'wave1', spawnedCount: 2, timerMs: 0 }, 0)).toBe(false);
  });

  it('教學浮字停留期滿才進 Wave1 並立即出第一隻', () => {
    let result = tick(createWaveState(), TUTORIAL_DURATION_MS - 1, 0);
    expect(result.waveChanged).toBeNull();
    expect(result.spawns).toEqual([]);

    result = tick(result.state, 1, 0);
    expect(result.waveChanged).toBe('wave1');
    expect(result.spawns).toEqual(['jelly']);
  });

  it('Wave1 依間隔陸續出滿 3 隻；清場前不推進、清場後進 Wave2', () => {
    let result = tick(createWaveState(), TUTORIAL_DURATION_MS, 0);
    result = tick(result.state, WAVE_SPAWN_INTERVAL_MS, 1);
    expect(result.spawns).toEqual(['jelly']);
    result = tick(result.state, WAVE_SPAWN_INTERVAL_MS, 2);
    expect(result.spawns).toEqual(['jelly']);
    expect(result.state.spawnedCount).toBe(3);

    result = tick(result.state, WAVE_SPAWN_INTERVAL_MS * 4, 3);
    expect(result.waveChanged).toBeNull();
    expect(result.spawns).toEqual([]);

    result = tick(result.state, 16, 0);
    expect(result.waveChanged).toBe('wave2');
    expect(result.spawns).toEqual(['jelly']);
  });

  it('單一大 delta 可一次補齊多隻生成', () => {
    const entered = tick(createWaveState(), TUTORIAL_DURATION_MS, 0);
    const result = tick(entered.state, WAVE_SPAWN_INTERVAL_MS * 2, 1);
    expect(result.spawns).toEqual(['jelly', 'jelly']);
  });

  it('Wave2 清場後發出 boss 入場訊號，boss 波無腳本生成', () => {
    const result = tick({ wave: 'wave2', spawnedCount: 4, timerMs: 0 }, 16, 0);
    expect(result.waveChanged).toBe('boss');
    expect(result.spawns).toEqual([]);
    expect(result.state.timerMs).toBe(0);
  });

  it('Boss 期補生節流：滿 4s 且場上 <2 才補 1 隻，補後計時歸零', () => {
    let result = tick(bossState(), BOSS_RESPAWN_INTERVAL_MS - 1, 0);
    expect(result.spawns).toEqual([]);

    result = tick(result.state, 1, 0);
    expect(result.spawns).toHaveLength(1);

    result = tick(result.state, BOSS_RESPAWN_INTERVAL_MS - 1, 1);
    expect(result.spawns).toEqual([]);

    result = tick(result.state, 1, 1);
    expect(result.spawns).toHaveLength(1);
  });

  it('Boss 期場上滿 2 隻不補；掉到 1 隻且計時已滿則立即補', () => {
    let result = tick(bossState(), BOSS_RESPAWN_INTERVAL_MS * 3, 2);
    expect(result.spawns).toEqual([]);

    result = tick(result.state, 16, 1);
    expect(result.spawns).toHaveLength(1);
  });

  it('Boss 期只補可吸品種供彈藥', () => {
    expect(BOSS_RESPAWN_KINDS.length).toBeGreaterThan(0);
    expect(BOSS_RESPAWN_KINDS.every((kind) => canInhale(kind))).toBe(true);
  });
});
