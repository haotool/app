/**
 * 經過時間顯示 SSOT（issue #753 首屏現代化）：hero 卡與記錄卡統一使用本函式，
 * 避免同一筆記錄同時出現相對時間（「1 小時前」）與絕對時間（「上午 03:03」）兩種語言。
 */

/** 相對經過時間：<1 分鐘回傳 justNowLabel，其餘走 Intl.RelativeTimeFormat。 */
export function formatSmartTime(timestamp: number, locale: string, justNowLabel: string): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return justNowLabel;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
  if (minutes < 60) return rtf.format(-minutes, 'minute');

  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');

  return rtf.format(-Math.round(hours / 24), 'day');
}
