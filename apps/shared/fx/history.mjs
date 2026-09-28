/** Validation for the legacy Taiwan Bank history boundary; v3 has its own contract. */
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isHistoryDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export const isHistoryRate = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;
const isHistoryTime = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.replaceAll('/', '-').replace(/\s+/, 'T');
  return (
    isHistoryDate(normalized.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(
      normalized,
    ) &&
    Number.isFinite(Date.parse(normalized))
  );
};
const providerMatches = (value) =>
  (value.providerId === undefined || value.providerId === 'taiwan-bank') &&
  (value.base === undefined || value.base === 'TWD') &&
  (value.schemaVersion === undefined || value.schemaVersion === '2.0');
const sourceMatches = (source) =>
  typeof source === 'string' && /^Taiwan Bank(?: \(臺灣銀行牌告匯率\))?$/.test(source);

export function isValidHistorySnapshot(value, date) {
  return (
    record(value) &&
    providerMatches(value) &&
    sourceMatches(value.source) &&
    isHistoryTime(value.updateTime) &&
    (date === undefined ||
      (isHistoryDate(date) && (value.snapshotDate === undefined || value.snapshotDate === date))) &&
    record(value.rates) &&
    Object.keys(value.rates).length > 0 &&
    Object.entries(value.rates).every(
      ([currency, rate]) => /^[A-Z]{3}$/.test(currency) && (rate === null || isHistoryRate(rate)),
    ) &&
    Object.values(value.rates).some(isHistoryRate)
  );
}

export function isValidHistoryAggregate(value) {
  if (
    !record(value) ||
    !providerMatches(value) ||
    (value.source !== undefined && !sourceMatches(value.source)) ||
    !Array.isArray(value.dates) ||
    !value.dates.length ||
    !value.dates.every(isHistoryDate) ||
    new Set(value.dates).size !== value.dates.length ||
    !record(value.rates) ||
    !Object.keys(value.rates).length
  )
    return false;
  if (
    value.updateTimes !== undefined &&
    (!Array.isArray(value.updateTimes) ||
      value.updateTimes.length !== value.dates.length ||
      !value.updateTimes.every(isHistoryTime))
  )
    return false;
  return (
    Object.entries(value.rates).every(
      ([currency, rates]) =>
        /^[A-Z]{3}$/.test(currency) &&
        Array.isArray(rates) &&
        rates.length === value.dates.length &&
        rates.every((rate) => rate === null || isHistoryRate(rate)),
    ) &&
    value.dates.every((_, i) => Object.values(value.rates).some((rates) => isHistoryRate(rates[i])))
  );
}
