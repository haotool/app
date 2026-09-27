export interface LegacyHistorySnapshot {
  updateTime: string;
  source: string;
  rates: Record<string, number | null>;
}
export interface LegacyHistoryAggregate {
  updateTime: string;
  dates: string[];
  updateTimes?: string[];
  rates: Record<string, (number | null)[]>;
}
export function isHistoryDate(value: unknown): value is string;
export function isHistoryRate(value: unknown): value is number;
export function isValidHistorySnapshot(
  value: unknown,
  date?: string,
): value is LegacyHistorySnapshot;
export function isValidHistoryAggregate(value: unknown): value is LegacyHistoryAggregate;
