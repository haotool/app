import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { detectCurrencyFromTimezone, wouldCreateMixedCurrencyTrip } from '../config/currencies';
import { isRateStale } from '../lib/exchangeRate';

type DraftState = Pick<ReturnType<typeof useStore.getState>, 'calculatorValue' | 'itemizedValues'>;

// draft 非空 = 有未儲存金額（計算機或個別輸入任一非空白）。
function hasDraft(state: DraftState): boolean {
  return (
    state.calculatorValue.trim() !== '' ||
    Object.values(state.itemizedValues).some((v) => v.trim() !== '')
  );
}

// 靜默自動切換：手動設定過、draft 非空或混幣風險時不動作（R11）。
function tryAutoDetect(): void {
  const state = useStore.getState();
  if (state.currencyManuallySet) return;

  const detected = detectCurrencyFromTimezone();
  if (!detected) return;

  // draft 非空時暫緩自動切換（靜默保護，不清使用者未儲存輸入）；手動切換仍走 ConfirmDialog。
  if (hasDraft(state)) return;

  const tripExpenses = state.expenses.filter((e) => e.tripId === state.currentTripId);
  if (!wouldCreateMixedCurrencyTrip(tripExpenses, state.currency, detected)) {
    state.setCurrency(detected, false);
  }
}

/**
 * App 啟動時執行：
 * 1. 從 moneybox CDN 取得最新匯率（TWD 賣出價）；回前景且快照過期時 refetch（TTL 6h）
 * 2. 若使用者未手動設定幣別，依時區自動切換
 *    - Asia/Seoul → KRW
 *    - Asia/Taipei → TWD
 *    - 其他時區 → 保持預設（TWD）
 * 3. R11 生命週期：首載因 draft 非空暫緩時，draft 由非空轉空即重跑偵測（沿用相同靜默語意）
 */
export function useCurrencyAutoDetect() {
  useEffect(() => {
    // 無論如何都更新匯率（供換算提示使用）
    void useStore.getState().refreshExchangeRate();

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

    tryAutoDetect();

    // R11：訂閱 draft 簽名，非空 → 空（AC 清空或完成記帳）且未手動設定幣別時重跑偵測。
    const unsubscribe = useStore.subscribe((state, prevState) => {
      if (hasDraft(prevState) && !hasDraft(state)) {
        tryAutoDetect();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
    };
  }, []); // 僅 mount 時掛載；偵測生命週期由 store 訂閱驅動
}
