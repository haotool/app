import { describe, expect, it } from 'vitest';
import { getTopLevelRouteIndex, getTopLevelTransitionDirection } from '../animations';

describe('top-level route transition', () => {
  it('returns expected route indices', () => {
    expect(getTopLevelRouteIndex('/')).toBe(0);
    expect(getTopLevelRouteIndex('/multi')).toBe(1);
    expect(getTopLevelRouteIndex('/favorites/')).toBe(2);
    expect(getTopLevelRouteIndex('/settings')).toBe(3);
  });

  it('returns -1 for non top-level routes', () => {
    expect(getTopLevelRouteIndex('/faq')).toBe(-1);
    expect(getTopLevelRouteIndex('/guide')).toBe(-1);
  });

  it('computes direction correctly for forward/backward transitions', () => {
    expect(getTopLevelTransitionDirection('/', '/multi')).toBe(1);
    expect(getTopLevelTransitionDirection('/settings', '/favorites')).toBe(-1);
  });

  it('uses fade mode for unknown or same routes', () => {
    expect(getTopLevelTransitionDirection('/faq', '/settings')).toBe(0);
    expect(getTopLevelTransitionDirection('/settings', '/settings')).toBe(0);
  });
});
