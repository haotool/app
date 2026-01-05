export const VSI_GOOD_THRESHOLD = 0.05;
export const VSI_NEEDS_IMPROVEMENT_THRESHOLD = 0.1;

export type VsiRating = 'good' | 'needs-improvement' | 'poor';

export function getVsiRating(value: number): VsiRating {
  if (value <= VSI_GOOD_THRESHOLD) return 'good';
  if (value <= VSI_NEEDS_IMPROVEMENT_THRESHOLD) return 'needs-improvement';
  return 'poor';
}

export function isVsiGood(value: number): boolean {
  return value <= VSI_GOOD_THRESHOLD;
}
