import { useCallback, useEffect, useRef, useState } from 'react';

const KEYS = {
  useDays: 'ratewise_use_days',
  rated: 'ratewise_rated',
  dismissed: 'ratewise_rating_dismissed',
  dismissedAt: 'ratewise_dismissed_at',
  snoozedCount: 'ratewise_snooze_count',
} as const;

const REQUIRED_DAYS = 7;
const SNOOZE_DAYS = 7;
const MAX_SNOOZES = 2;

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

  const updated = [...days, today].slice(-60);
  try {
    localStorage.setItem(KEYS.useDays, JSON.stringify(updated));
  } catch {
    //
  }
  return updated;
}

function getSnoozedCount(): number {
  try {
    return Number(localStorage.getItem(KEYS.snoozedCount) ?? '0');
  } catch {
    return 0;
  }
}

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(KEYS.rated) === '1') return false;
    if (localStorage.getItem(KEYS.dismissed) === '1') return false;
    if (getSnoozedCount() >= MAX_SNOOZES) return false;

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
  isVisible: boolean;
  isFinalChance: boolean;
  markRated: () => void;
  snooze: () => void;
  dismiss: () => void;
}

export function useRatingPrompt(): UseRatingPromptReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [isFinalChance, setIsFinalChance] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (recorded.current) return;
    recorded.current = true;

    recordTodayUsage();

    const timer = setTimeout(() => {
      const show = shouldShow();
      if (show) {
        setIsFinalChance(getSnoozedCount() >= MAX_SNOOZES - 1);
      }
      setIsVisible(show);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const markRated = useCallback(() => {
    try {
      localStorage.setItem(KEYS.rated, '1');
    } catch {
      //
    }
    setIsVisible(false);
  }, []);

  const snooze = useCallback(() => {
    try {
      const next = getSnoozedCount() + 1;
      localStorage.setItem(KEYS.snoozedCount, String(next));
      if (next >= MAX_SNOOZES) {
        localStorage.setItem(KEYS.dismissed, '1');
      } else {
        localStorage.setItem(KEYS.dismissedAt, new Date().toISOString());
      }
    } catch {
      //
    }
    setIsVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEYS.dismissed, '1');
    } catch {
      //
    }
    setIsVisible(false);
  }, []);

  return { isVisible, isFinalChance, markRated, snooze, dismiss };
}
