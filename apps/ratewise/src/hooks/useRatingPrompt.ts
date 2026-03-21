/**
 * useRatingPrompt — 控制星評 Modal 顯示時機。
 *
 * 觸發條件：
 *  - 使用者已累積 7 個「使用日」（每日首次開啟 app 計算一次）。
 *  - 尚未評分且尚未永久關閉。
 *
 * localStorage 鍵值：
 *  - ratewise_use_days     — JSON 字串陣列（ISO 日期，去重後最多保留 60 天）
 *  - ratewise_rated        — '1' 代表已評分，不再顯示
 *  - ratewise_rating_dismissed — '1' 代表已永久關閉（最多 1 次「以後再說」機會）
 *  - ratewise_dismissed_at — 最後一次「以後再說」的 ISO 日期（7 天後重新顯示）
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const KEYS = {
  useDays: 'ratewise_use_days',
  rated: 'ratewise_rated',
  dismissed: 'ratewise_rating_dismissed',
  dismissedAt: 'ratewise_dismissed_at',
} as const;

const REQUIRED_DAYS = 7;
const SNOOZE_DAYS = 7;

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function readUseDays(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.useDays);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d): d is string => typeof d === 'string');
  } catch {
    return [];
  }
}

function recordTodayUsage(): string[] {
  const today = getTodayIso();
  const days = readUseDays();
  if (days.includes(today)) return days;

  // 新增今日；保留最近 60 天避免無限增長。
  const updated = [...days, today].slice(-60);
  try {
    localStorage.setItem(KEYS.useDays, JSON.stringify(updated));
  } catch {
    // localStorage 不可用時靜默失敗。
  }
  return updated;
}

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(KEYS.rated) === '1') return false;
    if (localStorage.getItem(KEYS.dismissed) === '1') return false;

    // 7 天暫緩（snooze）邏輯。
    const dismissedAt = localStorage.getItem(KEYS.dismissedAt);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < SNOOZE_DAYS) return false;
    }

    const days = readUseDays();
    return days.length >= REQUIRED_DAYS;
  } catch {
    return false;
  }
}

export interface UseRatingPromptReturn {
  /** Modal 是否應顯示。 */
  isVisible: boolean;
  /** 使用者提交評分後呼叫。 */
  markRated: () => void;
  /** 使用者點「以後再說」呼叫（7 天後重新顯示）。 */
  snooze: () => void;
  /** 使用者點「不再提醒」呼叫。 */
  dismiss: () => void;
}

export function useRatingPrompt(): UseRatingPromptReturn {
  const [isVisible, setIsVisible] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (recorded.current) return;
    recorded.current = true;

    recordTodayUsage();

    // 延遲 3 秒再判斷是否顯示，避免影響首屏載入。
    const timer = setTimeout(() => {
      setIsVisible(shouldShow());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const markRated = useCallback(() => {
    try {
      localStorage.setItem(KEYS.rated, '1');
    } catch {
      // 靜默失敗。
    }
    setIsVisible(false);
  }, []);

  const snooze = useCallback(() => {
    try {
      localStorage.setItem(KEYS.dismissedAt, new Date().toISOString());
    } catch {
      // 靜默失敗。
    }
    setIsVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEYS.dismissed, '1');
    } catch {
      // 靜默失敗。
    }
    setIsVisible(false);
  }, []);

  return { isVisible, markRated, snooze, dismiss };
}
