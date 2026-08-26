// Legacy v1 API compatibility。
//
// 觸控操作教學已收斂到 game/core/learning.ts + guidanceDirector/guidedTutorial 的
// coachmark 管線。保留策略函式與設定欄位的讀取形狀，避免舊存檔或外部 QA 失效，
// 但此模組不再建立任何 modal DOM。
import { CONTROL_HINT_MAX_SESSIONS, type UserSettings } from './game/core/settings';

const noop = (): void => undefined;

export interface ControlHintSettings {
  controlHintsEnabled: boolean;
  controlHintsPlayCount: number;
}

export function shouldShowControlHints(settings: ControlHintSettings): boolean {
  return settings.controlHintsEnabled && settings.controlHintsPlayCount < CONTROL_HINT_MAX_SESSIONS;
}

export function isTouchCapable(input: {
  maxTouchPoints?: number;
  hasTouchEvent?: boolean;
}): boolean {
  return (input.maxTouchPoints ?? 0) > 0 || input.hasTouchEvent === true;
}

/** 舊呼叫點安全降級：教學提示統一由情境 coachmark 管線呈現。 */
export function showControlHintsForSession(): () => void {
  return noop;
}

export function controlHintSettingsOf(settings: UserSettings): ControlHintSettings {
  return {
    controlHintsEnabled: settings.controlHintsEnabled,
    controlHintsPlayCount: settings.controlHintsPlayCount,
  };
}
