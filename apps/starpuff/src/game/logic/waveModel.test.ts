import { describe, expect, it } from 'vitest';
import { WAVE_SEQUENCE, WAVE_SPECS, nextWave, shouldSpawnBossMinion } from './waveModel';

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

  it('Boss 戰小怪低於下限時補生', () => {
    expect(shouldSpawnBossMinion(0)).toBe(true);
    expect(shouldSpawnBossMinion(2)).toBe(false);
  });
});
