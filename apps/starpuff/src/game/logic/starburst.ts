import { STAR, STARSTORM } from '../core/config';
import type { StarburstPhase, TransformForm } from '../core/types';

// 星暴 2.0 蓄能結晶純狀態機（GAME_DESIGN §109，不 import phaser），vitest 對象。
// 結晶：彈匣滿 5 槽瞬間自動結晶——清空彈匣、頭頂生成蓄能星；蓄能星存在時再滿匣
// 不再結晶（不疊加）。引爆：SP 點按 → 0.3s 蓄爆（不可取消）→ 全屏清場（starCombat）。
// 跨關持有／死亡清除／EX 進場清除由 systems/starburstDirector 承擔。

export type { StarburstPhase } from '../core/types';

export interface StarburstState {
  phase: StarburstPhase;
  // detonating 剩餘蓄爆毫秒；其餘相位恆 0。
  detonateMs: number;
}

export function createStarburstState(): StarburstState {
  return { phase: 'none', detonateMs: 0 };
}

// 滿匣結晶裁決（§109）：彈匣滿且無蓄能星才結晶；蓄能星存在時滿匣維持可射擊/殼盾。
export function shouldCrystallize(ammo: number, phase: StarburstPhase): boolean {
  return ammo >= STAR.maxAmmo && phase === 'none';
}

export function chargeStarburst(): StarburstState {
  return { phase: 'charged', detonateMs: 0 };
}

export function beginDetonation(state: StarburstState): StarburstState {
  if (state.phase !== 'charged') return state;
  return { phase: 'detonating', detonateMs: STARSTORM.chargeMs };
}

export interface DetonationTick {
  state: StarburstState;
  // 本 tick 蓄爆完成：呼叫端結算星暴（清場＋魔王傷＋無敵窗）。
  detonated: boolean;
}

export function tickDetonation(state: StarburstState, deltaMs: number): DetonationTick {
  if (state.phase !== 'detonating') return { state, detonated: false };
  const detonateMs = state.detonateMs - deltaMs;
  if (detonateMs <= 0) return { state: createStarburstState(), detonated: true };
  return { state: { phase: 'detonating', detonateMs }, detonated: false };
}

// SP 鍵裁決（#952 拆鍵後專責星暴）：蓄能星存在 → 引爆；蓄爆中不可再操作。
//
// 拆鍵理由：修前單鍵承載四義（引爆／變身／解除／無事），唯一分流點是「有蓄能星時
// 點按引爆、長按變身」，且需 resolveSpSecondary 疊小徽才能讓玩家得知長按還有第二
// 語意——註解自陳「否則玩家無從得知」，屬補丁而非解法。變身條件放寬後兩態共存頻率
// 上升會使歧義更嚴重，故改為 SP＝星暴、TF＝變身兩鍵各自單義；長按分流與 secondary
// 徽記一併移除（不再有兩義可分）。
export type SpCommand = 'detonate' | 'none';

export function resolveSpPress(opts: { phase: StarburstPhase }): SpCommand {
  return opts.phase === 'charged' ? 'detonate' : 'none';
}

// SP 鍵呈現（§109 圖示即行為）：hidden 完全隱藏；detonate 金色大星。蓄爆中 → hidden。
export type SpMode = 'hidden' | 'detonate';

export function resolveSpMode(opts: { phase: StarburstPhase }): SpMode {
  return opts.phase === 'charged' ? 'detonate' : 'hidden';
}

// TF 鍵裁決（#952）：變身中 → 提前解除；否則資格成立即變身。與星暴完全無關——
// 蓄能星存在與否不再影響本鍵，兩鍵各自單義。
// #953：地面限制解除——空中亦可變身（起手限地面原為 §57 設計，已由需求取消）。
export type TransformCommand = 'transform' | 'dismiss' | 'none';

export function resolveTransformPress(opts: {
  transformActive: boolean;
  eligible: boolean;
}): TransformCommand {
  if (opts.transformActive) return 'dismiss';
  return opts.eligible ? 'transform' : 'none';
}

// TF 鍵呈現（圖示即行為）：hidden 完全隱藏；形態名＝形態色圓徽（§119 七形態同制）；
// dismiss 解除迴旋箭。#953 起不再受地面限制，與 resolveTransformPress 同一裁決。
export type TransformKeyMode = 'hidden' | TransformForm | 'dismiss';

export function resolveTransformMode(opts: {
  transformForm: TransformForm | null;
  eligibleForm: TransformForm | null;
}): TransformKeyMode {
  if (opts.transformForm) return 'dismiss';
  return opts.eligibleForm ?? 'hidden';
}
