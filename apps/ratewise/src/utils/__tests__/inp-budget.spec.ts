import { describe, expect, it } from 'vitest';
import { INP_LONG_TASK_THRESHOLD_MS, isLongInteraction } from '../interactionBudget';

describe('INP interaction budget', () => {
  it('treats values above threshold as slow interactions', () => {
    expect(isLongInteraction(INP_LONG_TASK_THRESHOLD_MS + 1)).toBe(true);
  });

  it('treats values at or below threshold as acceptable', () => {
    expect(isLongInteraction(INP_LONG_TASK_THRESHOLD_MS)).toBe(false);
  });
});
