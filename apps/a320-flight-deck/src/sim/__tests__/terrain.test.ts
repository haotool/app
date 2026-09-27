import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUTE } from '../constants';
import { groundHeight, surfaceType, terrainHeight } from '../terrain';

describe('terrain', () => {
  it('airport is flat and runway is paved', () => {
    expect(terrainHeight(0, 0)).toBe(0);
    expect(terrainHeight(1500, 10)).toBe(0);
    expect(surfaceType(1500, 0)).toBe('runway');
    expect(surfaceType(0, -190)).toBe('taxiway');
  });
  it('approach corridor and route stay clear of terrain', () => {
    for (let x = 1600; x < 30000; x += 500) expect(groundHeight(x, 0)).toBeLessThan(60);
    let maxH = -Infinity;
    for (let i = 0; i < DEFAULT_ROUTE.length - 1; i++) {
      const a = DEFAULT_ROUTE[i];
      const b = DEFAULT_ROUTE[i + 1];
      for (let t = 0; t <= 1; t += 0.02) {
        maxH = Math.max(maxH, groundHeight(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t));
      }
    }
    expect(maxH).toBeLessThan(1800);
  });
  it('has mountains north and sea south', () => {
    let peak = 0;
    for (let x = -30000; x < 30000; x += 1000) peak = Math.max(peak, terrainHeight(x, -35000));
    expect(peak).toBeGreaterThan(600);
    expect(surfaceType(0, 20000)).toBe('water');
  });
});
