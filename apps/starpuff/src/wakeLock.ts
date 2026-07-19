// 螢幕常亮（GAME_DESIGN §94）：遊戲進行中防自動熄屏中斷（觀戰／過場等無觸控段落）。
// Screen Wake Lock API（Chrome 84+／Safari 16.4+）；不支援或被拒（省電模式）靜默降級。
// 生命週期跟隨 #controls.is-active（＝GameScene 進行中，controls 系統生命週期即遊戲場景）：
// 進場取得、離場釋放；頁面隱藏時系統自動釋放，回前景若仍在遊戲中重新取得。

let sentinel: WakeLockSentinel | null = null;

async function acquire(): Promise<void> {
  if (sentinel !== null) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null;
  }
}

function release(): void {
  void sentinel?.release();
  sentinel = null;
}

export function initWakeLock(): void {
  if (!('wakeLock' in navigator)) return;
  const controls = document.getElementById('controls');
  if (!controls) return;

  const isPlaying = (): boolean => controls.classList.contains('is-active');
  const sync = (): void => {
    if (isPlaying()) void acquire();
    else release();
  };

  new MutationObserver(sync).observe(controls, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync();
  });
  sync();
}
