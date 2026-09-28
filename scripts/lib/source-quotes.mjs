// 空白與破折號表示未報價（null）；0 原文保留，由正規化標為業者停供（suppressed）。其他壞值中止發布。
export function parseSourceRate(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (text === '' || text === '-') return null;
  if (text.length > 96 || !/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) {
    throw new Error('Invalid source rate');
  }
  return text;
}

// Node 24 保留 JSON 價格原文，避免讀入時先經二進位浮點捨入。
export function parseSourceJson(text) {
  return JSON.parse(text, (key, value, context) =>
    (key === 'buyRate' || key === 'sellRate') && typeof value === 'number' ? context.source : value,
  );
}

export function sourcePublishedAt(value) {
  if (value == null) return null;
  if (
    typeof value !== 'string' ||
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new Error('Invalid source publication time');
  }
  return new Date(value).toISOString();
}
