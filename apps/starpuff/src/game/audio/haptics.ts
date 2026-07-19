// 觸覺回饋（GAME_DESIGN §94）：重擊類音效同步短震強化打擊感。
// Android Chrome 支援 navigator.vibrate；iOS Safari 無此 API，靜默降級。
// 觸覺跟隨音效觸發點（playSfx 內查表），靜音時 playSfx 早退故觸覺同步靜音。

import type { SfxName } from './sfx';

// 僅重擊／里程碑事件配震動；一般音效（跳躍、發射、腳步）不震避免疲勞。
// 單位 ms；陣列為 震-停-震 節奏。
export const HAPTIC_PATTERNS: Partial<Record<SfxName, number | number[]>> = {
  hurt: 60,
  'slam-down': 40,
  'boss-slam': 50,
  'boss-roar': [30, 40, 30],
  starstorm: [20, 30, 60],
  win: [30, 40, 60],
  lose: 80,
};

export function vibrateForSfx(name: SfxName): void {
  const pattern = HAPTIC_PATTERNS[name];
  if (pattern === undefined) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* noop */
  }
}
