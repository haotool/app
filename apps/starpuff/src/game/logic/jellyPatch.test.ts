import { describe, expect, it } from 'vitest';
import {
  JELLY_PATCH,
  isPatchActive,
  jellyBounceVy,
  patchRemainingRatio,
  prunePatches,
  type JellyPatch,
} from './jellyPatch';

const GROUND_TOP = 400;

const patchAt = (x: number, createdAtMs = 0): JellyPatch => ({ x, createdAtMs });

describe('果凍地塊壽命（§5：果凍化 3s）', () => {
  it('3s 內存活、期滿失效；prune 移除過期地塊', () => {
    const patch = patchAt(100, 1000);
    expect(isPatchActive(patch, 1000 + JELLY_PATCH.lifetimeMs - 1)).toBe(true);
    expect(isPatchActive(patch, 1000 + JELLY_PATCH.lifetimeMs)).toBe(false);
    expect(prunePatches([patch, patchAt(200, 3000)], 1000 + JELLY_PATCH.lifetimeMs)).toEqual([
      patchAt(200, 3000),
    ]);
  });

  it('剩餘壽命比例由 1 遞減至 0（供呈現層淡出）', () => {
    const patch = patchAt(0, 0);
    expect(patchRemainingRatio(patch, 0)).toBe(1);
    expect(patchRemainingRatio(patch, JELLY_PATCH.lifetimeMs / 2)).toBeCloseTo(0.5, 5);
    expect(patchRemainingRatio(patch, JELLY_PATCH.lifetimeMs * 2)).toBe(0);
  });
});

describe('jellyBounceVy（踩上彈起，非傷害）', () => {
  const patches = [patchAt(100)];

  it('地面帶內、範圍內、下落或站立（vy>=0）觸發彈起', () => {
    expect(jellyBounceVy(patches, 0, 100, GROUND_TOP - 20, GROUND_TOP, 0)).toBe(
      JELLY_PATCH.bounceVy,
    );
    expect(
      jellyBounceVy(patches, 0, 100 + JELLY_PATCH.halfWidthPx, GROUND_TOP, GROUND_TOP, 50),
    ).toBe(JELLY_PATCH.bounceVy);
  });

  it('上升中（vy<0）不觸發——彈起單發不連跳', () => {
    expect(jellyBounceVy(patches, 0, 100, GROUND_TOP - 20, GROUND_TOP, -100)).toBeNull();
  });

  it('水平超出半寬或高於地面帶不觸發', () => {
    expect(
      jellyBounceVy(patches, 0, 100 + JELLY_PATCH.halfWidthPx + 1, GROUND_TOP, GROUND_TOP, 0),
    ).toBeNull();
    expect(
      jellyBounceVy(patches, 0, 100, GROUND_TOP - JELLY_PATCH.groundBandPx - 1, GROUND_TOP, 0),
    ).toBeNull();
  });

  it('過期地塊不觸發', () => {
    expect(
      jellyBounceVy(patches, JELLY_PATCH.lifetimeMs, 100, GROUND_TOP, GROUND_TOP, 0),
    ).toBeNull();
  });

  it('彈起初速可接漂浮控高：高於一般跳、低於彈簧超級跳', () => {
    expect(JELLY_PATCH.bounceVy).toBeLessThan(-420);
    expect(JELLY_PATCH.bounceVy).toBeGreaterThan(-640);
  });
});
