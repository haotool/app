/**
 * 時間格式化工具函數
 *
 * 用途：提供統一的時間格式化邏輯，支援多種輸入格式
 * 遵循 Linus KISS 原則：消除特殊情況，保持簡潔
 */

/**
 * 格式化 ISO 8601 時間戳為 MM/DD HH:mm 格式
 *
 * @param iso - ISO 8601 格式的時間字串（例如：2025-10-31T03:30:00+08:00）
 * @returns 格式化後的字串（例如：10/31 03:30）或空字串（如果格式無效）
 *
 * @example
 * formatIsoTimestamp('2025-10-31T03:30:00+08:00') // '10/31 03:30'
 */
export function formatIsoTimestamp(iso: string): string {
  const date = new Date(iso);

  // 驗證日期有效性
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const time = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 強制使用24小時制，避免「上午」「下午」前綴
  });

  return `${month}/${day} ${time}`;
}

/**
 * 格式化通用時間字串（支援多種格式）
 *
 * @param timeString - 可能的格式：
 *   - ISO 8601: "2025-10-31T03:30:00+08:00"
 *   - 台銀格式: "2025-10-31 03:30:00"
 *   - 其他自由格式
 * @returns 格式化後的字串
 *
 * @example
 * formatGenericTimeString('2025-10-31T03:30:00+08:00') // '10/31 03:30'
 * formatGenericTimeString('2025-10-31 03:30:00') // '10/31 03:30:00'
 */
export function formatGenericTimeString(timeString: string): string {
  const trimmed = timeString.trim();

  if (!trimmed) {
    return '';
  }

  // 如果是 ISO 格式，使用 ISO 格式化器
  if (trimmed.includes('T')) {
    return formatIsoTimestamp(trimmed);
  }

  // 嘗試解析台銀格式或其他日期格式
  const [datePart = '', timePart = ''] = trimmed.split(/\s+/);
  const dateMatch = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(datePart);

  if (dateMatch) {
    const [, , month = '', day = ''] = dateMatch;
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');

    // 如果有時間部分，附加上去
    // 修復：使用 || 而不是 ?? 來處理空字串的情況
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const timeCandidate = timePart || /(\d{1,2}:\d{2}(?::\d{2})?)/.exec(trimmed)?.[0] || '';

    return timeCandidate
      ? `${formattedMonth}/${formattedDay} ${timeCandidate}`
      : `${formattedMonth}/${formattedDay}`;
  }

  // 無法解析，返回原始字串
  return trimmed;
}

/**
 * 格式化雙時間顯示（來源時間 · 刷新時間）
 *
 * @param lastUpdate - 數據來源時間（台銀提供的時間戳）
 * @param lastFetchedAt - 前端實際刷新時間（ISO 8601 格式）
 * @returns 格式化後的顯示字串
 *
 * @example
 * formatDisplayTime('2025-10-31 03:30:00', '2025-10-31T03:35:00+08:00')
 * // '來源 10/31 03:30:00 · 刷新 10/31 03:35'
 *
 * formatDisplayTime('2025-10-31T03:30:00+08:00', null)
 * // '刷新 10/31 03:30'
 */
export function formatDisplayTime(lastUpdate: string | null, lastFetchedAt: string | null): string {
  const parts: string[] = [];

  // 處理來源時間（lastUpdate）
  if (lastUpdate?.trim()) {
    const formatted = formatGenericTimeString(lastUpdate);
    if (formatted) {
      // ISO 格式顯示為「刷新」，其他格式顯示為「來源」
      const label = lastUpdate.includes('T') ? '刷新' : '來源';
      parts.push(`${label} ${formatted}`);
    }
  }

  // 處理刷新時間（lastFetchedAt）
  if (lastFetchedAt?.trim()) {
    const formatted = formatIsoTimestamp(lastFetchedAt);
    if (formatted) {
      // 避免重複：如果已經有相同的「刷新」時間，就不重複添加
      const refreshLabel = `刷新 ${formatted}`;
      if (!parts.includes(refreshLabel)) {
        parts.push(refreshLabel);
      }
    }
  }

  return parts.join(' · ');
}
