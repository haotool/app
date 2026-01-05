export const INP_LONG_TASK_THRESHOLD_MS = 50;

export function isLongInteraction(value: number): boolean {
  return value > INP_LONG_TASK_THRESHOLD_MS;
}
