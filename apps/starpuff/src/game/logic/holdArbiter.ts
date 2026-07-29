// 點按／長按意圖仲裁（#948，不 import phaser）：SP 鍵與變身期 B 鍵共用。
//
// 設計要點——**只在有歧義時延遲**：點按與長按語意相同時（絕大多數情境）維持
// 按下緣即時結算，零延遲回歸；只有兩義並存的少數態才等門檻判讀意圖。為了少數
// 情境賠上全域手感是不划算的交易。

export interface HoldState {
  armed: boolean;
  heldMs: number;
  fired: boolean;
}

export function createHoldState(): HoldState {
  return { armed: false, heldMs: 0, fired: false };
}

export type HoldOutcome = 'tap' | 'hold' | 'none';

export interface HoldInput {
  pressed: boolean;
  held: boolean;
  deltaMs: number;
  thresholdMs: number;
  // 兩義並存＝需要延遲判讀；false 時按下緣即回 'tap'（呼叫端自行決定語意）。
  ambiguous: boolean;
}

export interface HoldResult {
  state: HoldState;
  outcome: HoldOutcome;
}

export function advanceHold(state: HoldState, input: HoldInput): HoldResult {
  let next: HoldState = { ...state };
  if (input.pressed && !next.armed) {
    if (!input.ambiguous) return { state: next, outcome: 'tap' };
    next = { armed: true, heldMs: 0, fired: false };
  }
  if (!next.armed) return { state: next, outcome: 'none' };
  if (input.held) {
    next = { ...next, heldMs: next.heldMs + input.deltaMs };
    if (!next.fired && next.heldMs >= input.thresholdMs) {
      return { state: createHoldState(), outcome: 'hold' };
    }
    return { state: next, outcome: 'none' };
  }
  // 放開且未達門檻＝點按。
  return { state: createHoldState(), outcome: 'tap' };
}
