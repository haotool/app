import type Phaser from 'phaser';
import { GameEvents, offGameEvent, onGameEvent } from '../core/events';
import type { PlayerHandle } from './player';
import type { ToastSystem } from './toasts';

// 蓄能星生命週期導演（GAME_DESIGN §109）：跨關持有／死亡清除／EX 進場清除與
// 首次教學浮字。session 記憶體狀態（跨關卡重試保留、重載重置），不動 save schema
// ——與 GameScene 的 seenFlavorHints 同慣例。

// 跨關持有旗標：通關瞬間快照玩家蓄能相位，下一關 create 時授回。
let carryCharged = false;
// 首次教學浮字（每 session 一次）：結晶引爆教學與跨關持有告知。
let taughtCrystallize = false;
let taughtCarry = false;

export interface StarburstDirectorHooks {
  player(): PlayerHandle;
  toasts(): ToastSystem;
  exMode: boolean;
}

export interface StarburstDirector {
  // 通關快照（§109）：走動關 completeLevel 與魔王 BOSS_DEFEATED 共用單一出口。
  noteClear(): void;
}

export function createStarburstDirector(
  scene: Phaser.Scene,
  hooks: StarburstDirectorHooks,
): StarburstDirector {
  // EX 進場清除（§8.4 EX 純度）：進場即棄置持有星，session 旗標一併歸零。
  if (hooks.exMode) carryCharged = false;
  else if (carryCharged) hooks.player().grantStarburstCharge();

  // 首次結晶教學（§3.3）：浮字一次；跨關授回同走此事件，session 旗標防重複。
  const onStarburst = ({ phase }: { phase: string }): void => {
    if (phase !== 'charged' || taughtCrystallize) return;
    taughtCrystallize = true;
    hooks.toasts().flavor('星力結晶！按 SP 鍵引爆');
  };
  // 死亡清除（§3.1）：卡點重生不重建 player，必須顯式清除蓄能星。
  const onDied = (): void => {
    carryCharged = false;
    hooks.player().clearStarburst();
  };
  const onBossDown = (): void => noteClear();

  function noteClear(): void {
    carryCharged = hooks.player().getStarburst().phase === 'charged';
    if (!carryCharged || taughtCarry) return;
    taughtCarry = true;
    hooks.toasts().flavor('蓄能星會跟你到下一關');
  }

  onGameEvent(scene.events, GameEvents.STARBURST_CHANGED, onStarburst);
  onGameEvent(scene.events, GameEvents.PLAYER_DIED, onDied);
  onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDown);
  // 自掛 shutdown 自清（沿 fx/hud 慣例）：restart 不重建 emitter，未解除即跨局累積。
  scene.events.once('shutdown', () => {
    offGameEvent(scene.events, GameEvents.STARBURST_CHANGED, onStarburst);
    offGameEvent(scene.events, GameEvents.PLAYER_DIED, onDied);
    offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDown);
  });

  return { noteClear };
}

// 測試重置鉤子：session 模組狀態在 vitest 間隔離。
export function resetStarburstSession(): void {
  carryCharged = false;
  taughtCrystallize = false;
  taughtCarry = false;
}
