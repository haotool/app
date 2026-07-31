import { FLAVOR_HINTS, MIX_HINTS } from '../core/codex';
import { GameEvents, offGameEvent, onGameEvent, type GameEventName } from '../core/events';
import { inhaleFlavor } from '../logic/combat';
import type { LevelSpec } from '../logic/levels';
import type { BossRoomHandle } from './bossRoom';
import type { DamageDirector } from './damageDirector';
import type { EggTracker } from './eggTracker';
import type { FxSystem } from './fx';
import type { LevelGateHandle } from './levelGate';
import type { StageHandle } from './stage';
import type { StarCombat } from './starCombat';
import type { ToastSystem } from './toasts';

// GameScene 事件路由（GAME_DESIGN §11/§23/§24/§30/§69）自 GameScene 抽出
//（W2 前置 1200 行閘）：契約事件 → 各系統結算的唯一分派表；深耦合 run 狀態的
// 死亡/擊破流程留在 GameScene（onPlayerDied/onBossDefeated hook 回流）。
// 綁定/解除模式沿 audio/sfx 的 bindSfxToEvents：回傳單一 unbind 出口。

type Bus = Parameters<typeof onGameEvent>[0];

// P3（§30）：進場時停 0.3s。
const P3_HITSTOP_MS = 300;

// 星味首遇提示（§46/§47）：seen 僅存 session 記憶體（跨關卡重試保留、重載重置），
// 不動 save schema。
const seenFlavorHints = new Set<string>();

export interface SceneEventHooks {
  setPlayerHp(hp: number): void;
  setBossHp(hp: number): void;
  toasts(): ToastSystem;
  starCombat(): StarCombat;
  stage(): StageHandle;
  eggTracker(): EggTracker;
  fx(): FxSystem;
  damage(): DamageDirector;
  levelGate(): LevelGateHandle;
  levelSpec(): LevelSpec;
  exMode: boolean;
  bossRoom(): BossRoomHandle | null;
  arenaLeft(): number;
  viewWidth(): number;
  // 敗北/擊破流程深耦合 run 狀態（deaths/bossDown/clearTimeMs/save）：留 GameScene。
  onPlayerDied(x: number, y: number): void;
  onBossDefeated(): void;
  // 關卡收尾演出（§127）：LevelSpec.outroCinematic 有值時觸發（GameScene 依值分派）。
  playOutroCinematic(): void;
}

export function wireSceneEvents(bus: Bus, hooks: SceneEventHooks): () => void {
  const unbinders: (() => void)[] = [];
  const bind = <K extends GameEventName>(
    event: K,
    handler: Parameters<typeof onGameEvent<K>>[2],
  ): void => {
    onGameEvent(bus, event, handler);
    unbinders.push(() => offGameEvent(bus, event, handler));
  };

  bind(GameEvents.PLAYER_DAMAGED, ({ hp }) => {
    hooks.setPlayerHp(hp);
  });
  bind(GameEvents.PLAYER_HEALED, ({ hp }) => {
    hooks.setPlayerHp(hp);
  });
  // 星味首遇提示（§46/§47）：新取得的味/配方必經頂槽，首見即 toast 一次。
  bind(GameEvents.AMMO_CHANGED, ({ magazine }) => {
    const top = magazine[magazine.length - 1];
    if (!top || top.gold) return;
    const key = top.mix ?? top.flavor;
    if (seenFlavorHints.has(key)) return;
    seenFlavorHints.add(key);
    hooks.toasts().flavor(top.mix !== undefined ? MIX_HINTS[top.mix] : FLAVOR_HINTS[top.flavor]);
  });
  // 技能世界結算（§23）：player 只發事件，場上效果委派 starCombat。
  bind(GameEvents.SKILL_STARSTORM, ({ bossDamage }) =>
    hooks.starCombat().resolveStarstorm(bossDamage),
  );
  // 下衝擊落點同步破磚（§29）：磚的 damage 接口由 stage 提供，沿用既有 SKILL 事件契約。
  bind(GameEvents.SKILL_SLAM_LANDED, ({ x, y }) => {
    hooks.starCombat().resolveSlamImpact(x, y);
    hooks.stage().damageBricksInRadius(x, y, hooks.starCombat().slamRadiusPx());
  });
  // 殼盾格擋成功（§40）：正面反擊星爆，波及面前小怪。
  bind(GameEvents.SKILL_SHIELD_BLOCK, ({ x, y, facing }) =>
    hooks.starCombat().resolveShieldCounter(x, y, facing),
  );
  // 星化形態技（§57/§119）：player 發事件、starCombat 單點路由結算（七形態同制）。
  bind(GameEvents.SKILL_TRANSFORM_STRIKE, ({ kind, x, y, facing }) =>
    hooks.starCombat().resolveTransformStrike(kind, x, y, facing),
  );
  bind(GameEvents.BOSS_SPAWNED, ({ maxHp }) => {
    hooks.setBossHp(maxHp);
  });
  bind(GameEvents.BOSS_DAMAGED, ({ hp }) => {
    hooks.setBossHp(hp);
    hooks.eggTracker().noteBossHit();
  });
  // P3 進場演出（§30）：星環衝擊波由 boss 系統呈現，時停以既有 fx API 組合。
  // 高風險位增益投放（§69/§82）：arena 中央高位刷 1 顆；EX 刷新減半＝不投放；
  // 投放階段資料驅動（缺省 P2；Voidra P2 為生存段改 P3）。
  bind(GameEvents.BOSS_PHASE, ({ phase }) => {
    if (phase === 'p3') hooks.fx().hitStop(P3_HITSTOP_MS);
    const level = hooks.levelSpec();
    const bossRoom = hooks.bossRoom();
    const buffPhase = level.arenaBuffPhase ?? 'p2';
    if (phase === buffPhase && !hooks.exMode && level.arenaBuff && bossRoom) {
      bossRoom.dropArenaBuff(level.arenaBuff, hooks.arenaLeft() + hooks.viewWidth() / 2, 190);
    }
  });
  bind(GameEvents.BOSS_QUAKE, () => hooks.damage().resolveBossQuake());
  // 彩蛋事件餵送（§24）：吞噬歷史與魔王首擊時間窗。
  bind(GameEvents.ENEMY_INHALED, ({ kind }) => {
    const flavor = inhaleFlavor(kind);
    if (flavor) hooks.eggTracker().feed({ kind: 'swallow', flavor });
  });
  // 加速票（§120 票券蝠）：擊殺即發疾風靴短加速（掉票語意的最小落地）。
  bind(GameEvents.ENEMY_KILLED, ({ kind }) => {
    if (kind === 'ticketa') hooks.damage().applyBuff('swift');
  });
  // 敗北語意：走動關死亡重試當前關（卡點關越過中點改自 checkpoint 重生，§67）；
  // 魔王戰死亡進敗北結算（再玩一次直接重試魔王關）。
  bind(GameEvents.PLAYER_DIED, ({ x, y }) => hooks.onPlayerDied(x, y));
  bind(GameEvents.BOSS_DEFEATED, () => hooks.onBossDefeated());
  // 關卡收尾演出（§127）：資料驅動自 LevelSpec.outroCinematic（L29 市場開盤倒數），
  // 純 overlay 不阻星星門生成。
  bind(GameEvents.LEVEL_GATE_OPENED, () => {
    hooks.levelGate().spawn();
    if (hooks.levelSpec().outroCinematic !== undefined) hooks.playOutroCinematic();
  });

  return () => unbinders.forEach((off) => off());
}

// 測試重置鉤子：session 模組狀態在 vitest 間隔離（沿 starburstDirector 慣例）。
export function resetSceneEventsSession(): void {
  seenFlavorHints.clear();
}
