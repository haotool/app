import React from 'react';
import { markPwaAppReady } from '../utils/pwaDiagnostics';

/**
 * 在首次 React commit 後才送出 app-ready 訊號，避免 bootstrap 成功但首屏 render 失敗時
 * 過早關閉冷啟動 watchdog。
 */
export function PwaAppReadyBeacon() {
  React.useEffect(() => {
    markPwaAppReady();
  }, []);

  return null;
}

export default PwaAppReadyBeacon;
