import { STAR, STARSTORM, type MagazineSlot } from '../core/config';
import { starDamage } from './skills';
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
  // 結晶當下封存的魔王傷害（#954 動態傷害）：彈匣在結晶瞬間清空，故必須隨相位
  // 帶走，不能於引爆時回頭讀彈匣。none 相位恆 0。
  bossDamage: number;
}

export function createStarburstState(): StarburstState {
  return { phase: 'none', detonateMs: 0, bossDamage: 0 };
}

// 星暴兌換率（#954）：魔王傷害＝投入星值總和 × 本係數，保底不低於舊固定值。
//
// 修前恆為 STARSTORM.bossDamage（12），而同樣 5 槽拿去直射有 25（素星）到 40
// （強化星）傷——魔王戰的兌換率是明確虧損，且結晶為自動觸發，玩家沒得選。
// 改為隨投入計價後「累積」真的被兌現，且彈匣經營成為有意義的決策。
// 走動關不受影響：該場景的價值來自全屏清場與 5 秒無敵，與魔王傷害無關。
export const STARSTORM_CONVERSION = 1.2;

export function starstormBossDamage(magazine: readonly MagazineSlot[]): number {
  const invested = magazine.reduce((total, slot) => total + starDamage(slot), 0);
  return Math.max(STARSTORM.bossDamage, Math.round(invested * STARSTORM_CONVERSION));
}

// 可結晶裁決（§109／#954 改手動）：彈匣滿且無蓄能星。
//
// 修前為滿匣「自動」結晶並清空整匣——彈匣因此永遠停不在 5 槽，既讓玩家累積的星
// 被無預警沒收，也使 swallowIntoMagazine 的滿匣替換分支近乎不可達。改為 SP 鍵手動
// 觸發：滿匣成為穩定狀態，玩家自行決定何時把彈匣兌換成星暴。
export function canCrystallize(ammo: number, phase: StarburstPhase): boolean {
  return ammo >= STAR.maxAmmo && phase === 'none';
}

export function chargeStarburst(bossDamage: number): StarburstState {
  return { phase: 'charged', detonateMs: 0, bossDamage };
}

export function beginDetonation(state: StarburstState): StarburstState {
  if (state.phase !== 'charged') return state;
  return { phase: 'detonating', detonateMs: STARSTORM.chargeMs, bossDamage: state.bossDamage };
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
  return {
    state: { phase: 'detonating', detonateMs, bossDamage: state.bossDamage },
    detonated: false,
  };
}

// SP 鍵裁決（#952 拆鍵後專責星暴）：蓄能星存在 → 引爆；蓄爆中不可再操作。
//
// 拆鍵理由：修前單鍵承載四義（引爆／變身／解除／無事），唯一分流點是「有蓄能星時
// 點按引爆、長按變身」，且需 resolveSpSecondary 疊小徽才能讓玩家得知長按還有第二
// 語意——註解自陳「否則玩家無從得知」，屬補丁而非解法。變身條件放寬後兩態共存頻率
// 上升會使歧義更嚴重，故改為 SP＝星暴、TF＝變身兩鍵各自單義；長按分流與 secondary
// 徽記一併移除（不再有兩義可分）。
// #954：SP 承載結晶與引爆兩義，但兩者天然互斥（結晶後即進 charged），故每個狀態
// 下仍為單義——不會退回 #952 拆鍵前的重疊歧義。
export type SpCommand = 'crystallize' | 'detonate' | 'none';

export function resolveSpPress(opts: { phase: StarburstPhase; ammo: number }): SpCommand {
  if (opts.phase === 'charged') return 'detonate';
  return canCrystallize(opts.ammo, opts.phase) ? 'crystallize' : 'none';
}

// SP 鍵呈現（§109 圖示即行為）：hidden 完全隱藏；crystallize 滿匣可兌換；
// detonate 金色大星。蓄爆中 → hidden。
export type SpMode = 'hidden' | 'crystallize' | 'detonate';

export function resolveSpMode(opts: { phase: StarburstPhase; ammo: number }): SpMode {
  if (opts.phase === 'charged') return 'detonate';
  return canCrystallize(opts.ammo, opts.phase) ? 'crystallize' : 'hidden';
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
