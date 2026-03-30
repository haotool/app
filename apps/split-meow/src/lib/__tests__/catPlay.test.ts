import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadCatPlayModule() {
  vi.resetModules();
  return import('../catPlay');
}

describe('catPlay helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
  });

  it('建立 paw 粒子時應保留座標與 emoji', async () => {
    const { makePawParticle } = await loadCatPlayModule();

    expect(makePawParticle(12, 34)).toMatchObject({
      x: 12,
      y: 34,
      emoji: '🐾',
      type: 'paw',
      spin: 0,
    });
  });

  it('建立 celebrate 粒子時應輸出指定數量且落在畫面範圍內', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { makeCelebrateParticles } = await loadCatPlayModule();

    const particles = makeCelebrateParticles(3);

    expect(particles).toHaveLength(3);
    for (const particle of particles) {
      expect(particle.type).toBe('celebrate');
      expect(particle.x).toBeGreaterThanOrEqual(100);
      expect(particle.x).toBeLessThanOrEqual(900);
      expect(particle.y).toBeGreaterThanOrEqual(400);
      expect(particle.y).toBeLessThanOrEqual(640);
      expect(typeof particle.spin).toBe('number');
    }

    randomSpy.mockRestore();
  });
});
