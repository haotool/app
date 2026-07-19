// 螢幕常亮（GAME_DESIGN §94）：觀戰／過場等無觸控段落防自動熄屏中斷遊戲。
// Screen Wake Lock API（Chrome 84+／Safari 16.4+）；不支援或被拒（省電模式）靜默降級。
// 頁面隱藏時系統自動釋放，回前景重新取得。

let sentinel: WakeLockSentinel | null = null;

async function acquire(): Promise<void> {
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null;
  }
}

export function initWakeLock(): void {
  if (!('wakeLock' in navigator)) return;
  void acquire();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && sentinel === null) void acquire();
  });
}
