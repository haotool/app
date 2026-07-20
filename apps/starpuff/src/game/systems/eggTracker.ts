import type Phaser from 'phaser';
import { EGG_HP_CAP, PLAYER } from '../core/config';
import {
  advanceEgg,
  createEggProgress,
  type EasterEggSpec,
  type EggEvent,
  type EggProgress,
} from '../logic/eggs';
import type { LevelSpec } from '../logic/levels';
import type { PlayerHandle } from './player';

// 彩蛋進度追蹤與獎勵落地（GAME_DESIGN §24）：每關進度鎖存、逐幀事件餵送與
// 觸發獎勵集中於此；存檔寫入與成就佇列留 GameScene（recordEggAndAward 委派）。

export interface EggTrackerHooks {
  player(): PlayerHandle;
  playerHp(): number;
  bossActive(): boolean;
  now(): number;
  // 存檔寫入時機（§38）：彩蛋觸發即記錄（trigger 型別為關內唯一 id）。
  recordEggAndAward(trigger: EasterEggSpec['trigger']): void;
  celebrate(message: string): void;
}

export interface EggTracker {
  // 逐幀事件（§24）：世界座標與平台站立；魔王可擊打起點供時間窗計算。
  sync(): void;
  feed(event: EggEvent): void;
  // 魔王受擊時間窗（crown-early-hit）：入場運鏡完成後起算。
  noteBossHit(): void;
}

export function createEggTracker(level: LevelSpec, hooks: EggTrackerHooks): EggTracker {
  const progress: EggProgress[] = level.easterEggs.map(() => createEggProgress());
  let bossActiveAt = -1;

  function feed(event: EggEvent): void {
    level.easterEggs.forEach((spec, i) => {
      const entry = progress[i];
      if (!entry || entry.done) return;
      const result = advanceEgg(spec, entry, event);
      progress[i] = result.progress;
      if (result.triggered) grantReward(spec);
    });
  }

  // 站立平台判定：腳底貼齊平台頂（rect 高 16 → 頂 = y - 8）且 x 落於平台範圍。
  function standingPlatformY(): number | null {
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down && !body.touching.down) return null;
    for (const spec of level.platforms) {
      if (
        Math.abs(body.bottom - (spec.y - 8)) <= 4 &&
        Math.abs(sprite.x - spec.x) <= spec.w / 2 + 12
      ) {
        return spec.y;
      }
    }
    return null;
  }

  // 獎勵落地（§24）：+1 HP（上限 6）／滿彈匣／金星彈／+1 HP。
  function grantReward(spec: EasterEggSpec): void {
    hooks.recordEggAndAward(spec.trigger);
    switch (spec.reward) {
      case 'hp-up':
        hooks.player().heal(1, EGG_HP_CAP);
        hooks.celebrate('彩虹果凍 +1 HP');
        break;
      case 'full-magazine':
        hooks.player().grantFullMagazine();
        hooks.celebrate('星星雨！彈匣全滿');
        break;
      case 'gold-star':
        hooks.player().grantGoldStar();
        hooks.celebrate('金星彈入匣！');
        break;
      case 'heal':
        // 滿血時 heal 無感（player.heal 靜默略過）：fallback 改給滿彈匣，獎勵必有回饋。
        if (hooks.playerHp() >= PLAYER.maxHp) {
          hooks.player().grantFullMagazine();
          hooks.celebrate('皇冠火花！彈匣全滿');
        } else {
          hooks.player().heal(1, PLAYER.maxHp);
          hooks.celebrate('皇冠火花 +1 HP');
        }
        break;
      default: {
        const exhaustive: never = spec.reward;
        void exhaustive;
      }
    }
  }

  return {
    sync() {
      if (level.boss && bossActiveAt < 0 && hooks.bossActive()) {
        bossActiveAt = hooks.now();
      }
      if (progress.every((entry) => entry.done)) return;
      feed({ kind: 'position', x: hooks.player().sprite.x });
      feed({ kind: 'stand', platformY: standingPlatformY() });
    },
    feed,
    noteBossHit() {
      if (bossActiveAt >= 0) {
        feed({ kind: 'boss-hit', sinceActiveMs: hooks.now() - bossActiveAt });
      }
    },
  };
}
