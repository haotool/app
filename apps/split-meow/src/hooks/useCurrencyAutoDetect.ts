import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { detectCurrencyFromTimezone } from '../config/currencies';
import { fetchMoneyboxRate } from '../lib/exchangeRate';

/**
 * App 啟動時執行一次：
 * 1. 始終嘗試從 moneybox CDN 取得最新匯率（TWD 賣出價）
 * 2. 若使用者未手動設定幣別，依時區自動切換
 *    - Asia/Seoul → KRW
 *    - Asia/Taipei → TWD
 *    - 其他時區 → 保持預設（TWD）
 */
export function useCurrencyAutoDetect() {
  useEffect(() => {
    const { currencyManuallySet, setCurrency, setExchangeRate } = useStore.getState();

    // 無論如何都更新匯率（供換算提示使用）
    fetchMoneyboxRate()
      .then(({ krwPerTwd, updatedAt }) => {
        setExchangeRate(krwPerTwd, updatedAt);
      })
      .catch(() => {
        // 靜默失敗：離線時沿用 persist 快取值
      });

    // 使用者手動選過幣別 → 尊重其選擇，不覆蓋
    if (currencyManuallySet) return;

    const detected = detectCurrencyFromTimezone();
    if (detected) setCurrency(detected, false);
  }, []); // 僅 mount 時執行一次
}
