// 蝕月斗篷純邏輯（GAME_DESIGN §5 / #813）：Noctra P2 起低頻隱形 1.2s，
// 僅月牙軌跡粒子可見；按住吸入產生氣流擾動使輪廓顯形（吸入第二用途）。
// 不 import phaser，vitest 對象；呈現層（systems/noctra.ts）驅動 alpha 與粒子。

export const ECLIPSE_CLOAK = {
  // 進出斗篷淡入淡出：避免瞬間消失/出現的不可讀跳變。
  fadeMs: 180,
  // 隱形期本體透明度（近全隱，僅月牙軌跡可見）。
  hiddenAlpha: 0.06,
  // 吸入氣流擾動顯形：輪廓半可見（反制獎勵，非全破隱）。
  revealedAlpha: 0.5,
  // 月牙軌跡粒子間隔。
  trailIntervalMs: 90,
} as const;

export function cloakActive(elapsedMs: number, durationMs: number): boolean {
  return elapsedMs >= 0 && elapsedMs < durationMs;
}

// 斗篷期本體 alpha：入場 fade 遞減 → 隱形/顯形穩態 → 出場 fade 回復 1。
export function cloakAlpha(elapsedMs: number, durationMs: number, revealed: boolean): number {
  if (!cloakActive(elapsedMs, durationMs)) return 1;
  const steady = revealed ? ECLIPSE_CLOAK.revealedAlpha : ECLIPSE_CLOAK.hiddenAlpha;
  const fadeIn = elapsedMs / ECLIPSE_CLOAK.fadeMs;
  const fadeOut = (durationMs - elapsedMs) / ECLIPSE_CLOAK.fadeMs;
  const progress = Math.min(1, fadeIn, fadeOut);
  return 1 + (steady - 1) * progress;
}
