/**
 * useInlineConfirm（E7 wave-B，QA-I D12）：破壞性動作的輕量二段確認。
 *
 * 第一次按下進入確認態（按鈕原地變確認文案，點擊深度最小、對齊韓系慣例）；
 * 確認態內再按一次才執行；逾時未確認自動解除，避免誤觸殘留。
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const CONFIRM_TIMEOUT_MS = 4000;

export function useInlineConfirm(onConfirm: () => void) {
  const [isConfirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const handlePress = useCallback(() => {
    if (!isConfirming) {
      setConfirming(true);
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setConfirming(false);
      }, CONFIRM_TIMEOUT_MS);
      return;
    }
    clearTimer();
    setConfirming(false);
    onConfirm();
  }, [isConfirming, onConfirm, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setConfirming(false);
  }, [clearTimer]);

  return { isConfirming, handlePress, reset };
}
