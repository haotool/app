// lighthouse-drift.mjs 型別宣告（#900）：實作以 .mjs 為 SSOT，本檔僅描述既有 export 形狀。
export const DRIFT_ABSOLUTE_TOLERANCE: {
  performanceScore: number;
  lcpMs: number;
  inpMs: number;
  cls: number;
};

export type DriftDirection = 'higherBetter' | 'lowerBetter';

export interface DriftComparison {
  changed: number | null;
  absoluteChanged: number | null;
  exceed: boolean;
}

export function compareDirection(
  current: number | null,
  baseline: number | null,
  direction: DriftDirection,
  absoluteTolerance?: number,
  driftPercent?: number,
): DriftComparison;

export function isHardThresholdBreached(
  value: number | null,
  options: { direction: DriftDirection; threshold: number },
): boolean;
