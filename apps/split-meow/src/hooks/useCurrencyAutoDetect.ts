import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { detectCurrencyFromTimezone, wouldCreateMixedCurrencyTrip } from '../config/currencies';
import { isRateStale } from '../lib/exchangeRate';

/**
 * App 啟動時執行一次：
 * 1. 從 moneybox CDN 取得最新匯率（TWD 賣出價）；回前景且快照過期時 refetch（TTL 6h）
 * 2. 若使用者未手動設定幣別，依時區自動切換
 *    - Asia/Seoul → KRW
 *    - Asia/Taipei → TWD
 *    - 其他時區 → 保持預設（TWD）
 */
export function useCurrencyAutoDetect() {
  useEffect(() => {
    const {
      currencyManuallySet,
      setCurrency,
      refreshExchangeRate,
      currency,
      expenses,
      currentTripId,
    } = useStore.getState();

    // 無論如何都更新匯率（供換算提示使用）
    void refreshExchangeRate();

    // PWA 長開場景：回前景時快照過期即 refetch。
    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isRateStale(useStore.getState().rateUpdatedAtIso)
      ) {
        void useStore.getState().refreshExchangeRate();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 使用者手動選過幣別 → 尊重其選擇，不覆蓋
    if (!currencyManuallySet) {
      const detected = detectCurrencyFromTimezone();
      if (detected) {
        const { calculatorValue, itemizedValues } = useStore.getState();
        // draft 非空時跳過自動切換（靜默保護，不清使用者未儲存輸入）；手動切換仍走 ConfirmDialog。
        const hasDraft =
          calculatorValue.trim() !== '' ||
          Object.values(itemizedValues).some((v) => v.trim() !== '');
        const tripExpenses = expenses.filter((e) => e.tripId === currentTripId);
        if (!hasDraft && !wouldCreateMixedCurrencyTrip(tripExpenses, currency, detected)) {
          setCurrency(detected, false);
        }
      }
    }

    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []); // 僅 mount 時執行一次
}
