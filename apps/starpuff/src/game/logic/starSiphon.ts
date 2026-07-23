// 星光虹吸純邏輯（GAME_DESIGN §5 / #813 W3）：Voidra 紫色吸流 0.8s 窗——
// 窗滿抽走彈匣頂槽 1 發化為自身護盾 1 層（上限 2 層，每層抵銷 1 次受擊）。
// 反制：窗內朝吸流發射＝星彈逆流爆盾＋回傷（把損失變輸出窗；高技巧獎勵）。
// 不 import phaser，vitest 對象；呈現層（systems/voidra.ts）驅動吸流粒子與護盾環。

export const STAR_SIPHON = {
  // 吸流窗＝telegraph（固定不隨狂暴速率縮放，≥600ms 可讀性紅線）。
  windowMs: 800,
  // 護盾層上限：每層抵銷 1 次受擊零傷。
  shieldCap: 2,
  // 逆流爆盾回傷（與來彈傷害取較大值，不懲罰重彈）。
  backfireDamage: 4,
  // 紫色吸流視覺。
  tint: 0x9a6cf0,
  streamParticleIntervalMs: 70,
} as const;

// 吸流強度包絡：進出各 20% 窗長淡入淡出（0..1），窗外 0。
export function siphonStreamStrength(elapsedMs: number, windowMs: number): number {
  if (elapsedMs < 0 || elapsedMs >= windowMs) return 0;
  const edge = windowMs * 0.2;
  return Math.min(1, elapsedMs / edge, (windowMs - elapsedMs) / edge);
}

// 吸收頂槽星（窗滿未被反制）：護盾層數夾限至上限。
export function shieldAfterAbsorb(layers: number): number {
  return Math.min(STAR_SIPHON.shieldCap, layers + 1);
}
