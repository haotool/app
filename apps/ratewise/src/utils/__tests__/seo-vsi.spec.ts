import { describe, expect, it } from 'vitest';
import { getVsiRating, isVsiGood, VSI_GOOD_THRESHOLD } from '../vsi';

describe('VSI thresholds', () => {
  it('treats values at or below the good threshold as good', () => {
    expect(isVsiGood(VSI_GOOD_THRESHOLD)).toBe(true);
    expect(getVsiRating(VSI_GOOD_THRESHOLD)).toBe('good');
  });

  it('flags values above the good threshold', () => {
    expect(getVsiRating(VSI_GOOD_THRESHOLD + 0.001)).toBe('needs-improvement');
  });
});
