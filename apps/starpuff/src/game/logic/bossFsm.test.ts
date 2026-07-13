import { describe, expect, it } from 'vitest';
import { BOSS, attackCycle, jellyRainCount, nextAction, phaseForHp } from './bossFsm';

describe('bossFsm', () => {
  it('HP 高於 50% 為 p1、等於或低於 50% 為 p2', () => {
    expect(phaseForHp(31, BOSS.maxHp)).toBe('p1');
    expect(phaseForHp(30, BOSS.maxHp)).toBe('p2');
    expect(phaseForHp(1, BOSS.maxHp)).toBe('p2');
  });

  it('jellyRain 顆數：p1 為 5、p2 為 7', () => {
    expect(jellyRainCount('p1')).toBe(5);
    expect(jellyRainCount('p2')).toBe(7);
  });

  it('p2 招式循環包含 dash，p1 不含', () => {
    expect(attackCycle('p1')).not.toContain('dash');
    expect(attackCycle('p2')).toContain('dash');
  });

  it('nextAction 依循環推進並回繞', () => {
    expect(nextAction('p1', null)).toBe('jellyRain');
    expect(nextAction('p1', 'jellyRain')).toBe('slam');
    expect(nextAction('p1', 'slam')).toBe('jellyRain');
    expect(nextAction('p2', 'slam')).toBe('dash');
    expect(nextAction('p2', 'dash')).toBe('jellyRain');
  });
});
