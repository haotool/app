import { STAR, STARSTORM } from '../core/config';
import type { StarburstPhase } from '../core/types';

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

// SP 情境鍵點按裁決（§109 天然互斥）：蓄能星存在 → 引爆；無蓄能星且變身資格成立
//（同系 ≥3、地面）→ 立即變身；變身中 → 提前解除。變身中優先於引爆——正常流程兩態
// 不共存（變身起手要求無蓄能星、變身中吸入停用不結晶），僅彩蛋滿彈匣可造出重疊，
// 此時裁決必須與 resolveSpMode 圖示一致（圖示即行為）。
export type SpCommand = 'detonate' | 'transform' | 'dismiss' | 'none';

export function resolveSpPress(opts: {
  phase: StarburstPhase;
  transformActive: boolean;
  eligible: boolean;
  airborne: boolean;
}): SpCommand {
  if (opts.transformActive) return 'dismiss';
  if (opts.phase === 'charged') return 'detonate';
  if (opts.phase === 'detonating') return 'none';
  return opts.eligible && !opts.airborne ? 'transform' : 'none';
}

// SP 鍵可用模式（§109 呈現契約）：hidden 完全隱藏；detonate 金色大星；
// volt/gale/shell 形態色圓徽；dismiss 解除迴旋箭。蓄爆中不可再操作 → hidden。
export type SpMode = 'hidden' | 'detonate' | 'volt' | 'gale' | 'shell' | 'dismiss';

export function resolveSpMode(opts: {
  phase: StarburstPhase;
  transformForm: 'volt' | 'gale' | 'shell' | null;
  eligibleForm: 'volt' | 'gale' | 'shell' | null;
  airborne: boolean;
}): SpMode {
  if (opts.transformForm) return 'dismiss';
  if (opts.phase === 'charged') return 'detonate';
  if (opts.phase === 'detonating') return 'hidden';
  return opts.eligibleForm && !opts.airborne ? opts.eligibleForm : 'hidden';
}
