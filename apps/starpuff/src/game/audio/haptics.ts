// 觸覺回饋（GAME_DESIGN §91／v19 #819 卡 11）：重擊類音效同步短震強化打擊感。
// Android Chrome 支援 navigator.vibrate；iOS Safari 無此 API，靜默降級。
// v19 與靜音解耦：震動由 UserSettings.hapticsEnabled 獨立閘門（本模組單點），
// 靜音玩家仍可保留觸覺、開聲玩家亦可單獨關震動。

import { loadSettings } from '../core/settings';
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

// 震動單一出口：hapticsEnabled 閘門集中於此，呼叫端不得直呼 navigator.vibrate。
export function vibratePattern(pattern: number | number[]): void {
  try {
    if (!loadSettings().hapticsEnabled) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* noop */
  }
}

export function vibrateForSfx(name: SfxName): void {
  const pattern = HAPTIC_PATTERNS[name];
  if (pattern === undefined) return;
  vibratePattern(pattern);
}
