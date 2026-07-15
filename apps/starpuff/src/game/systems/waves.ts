import type Phaser from 'phaser';
import { GameEvents, emitGameEvent, offGameEvent, onGameEvent } from '../core/events';
import type { EnemyKind, LevelId } from '../core/types';
import {
  advanceLevelSpawn,
  createLevelRun,
  getLevel,
  isInSafeTail,
  pickSpawnKind,
  recordKill,
  type LevelRunState,
} from '../logic/levels';
import type { EnemySystem } from './enemies';

export interface WaveRunner {
  start(): void;
  update(deltaMs: number): void;
  noteInput(): void;
  isGateOpen(): boolean;
  getQuota(): { killCount: number; killQuota: number };
  forceQuota(): void;
  destroy(): void;
}

const SPAWN_MARGIN_X = 48;
// 生成高度按品種（橫式地面頂 y=400）：floaty 定高飄移（240 在跳躍＋拍翅可達範圍內）；
// puffy 高空下飄（§16）；其餘自地面上方落入。
const SPAWN_Y: Record<EnemyKind, number> = {
  jelly: 330,
  floaty: 240,
  spiky: 330,
  puffy: 80,
  chompy: 330,
  shelly: 330,
  zappy: 240,
};

const TUTORIAL_TEXT = '左搖桿 移動　綠鍵 跳躍\n粉鍵 長按吸入・點按發射';
// 教學浮字：首次操作輸入後 1s 淡出；無輸入最多停留 6s。
const TUTORIAL_INPUT_LINGER_MS = 1000;
const TUTORIAL_MAX_MS = 6000;

// 關卡 runner：讀 levels.ts 資料驅動生成與配額推進，禁止每關硬編碼分支。
export function createWaveRunner(
  scene: Phaser.Scene,
  enemies: EnemySystem,
  levelId: LevelId,
): WaveRunner {
  const level = getLevel(levelId);
  let run: LevelRunState = createLevelRun(levelId);
  let stopped = false;
  let spawnCounter = 0;
  // 反卡死（§26）：以 AMMO_CHANGED 事件追蹤彈藥量，判定飢荒強制補可吸怪。
  let playerAmmo = 0;
  let tutorialText: Phaser.GameObjects.Text | null = null;
  let tutorialAgeMs = 0;
  let tutorialDismissAtMs = TUTORIAL_MAX_MS;

  const onAmmoChanged = ({ ammo }: { ammo: number }): void => {
    playerAmmo = ammo;
  };

  // 魔王擊破後停止補生，避免勝利演出期間持續生怪。
  const onBossDefeated = (): void => {
    stopped = true;
  };

  // 擊殺與吞下皆計入配額：兩者都是玩家消滅敵人的手段。
  const onEnemyRemoved = (): void => {
    if (stopped || run.gateOpen) return;
    run = recordAndAnnounce(run);
  };

  function recordAndAnnounce(state: LevelRunState): LevelRunState {
    const next = recordKill(state);
    emitGameEvent(scene.events, GameEvents.LEVEL_QUOTA, {
      killCount: next.killCount,
      killQuota: level.killQuota,
    });
    if (!state.gateOpen && next.gateOpen) {
      emitGameEvent(scene.events, GameEvents.LEVEL_GATE_OPENED, { levelId: level.id });
    }
    return next;
  }

  // 生成位置：玩家前方視野外側；落在尾端安全區時改由後方入場，兩側皆無合法位即跳過。
  // 單屏魔王關（boss）沿用左右邊緣交替入場。
  function spawnAhead(starving: boolean): void {
    spawnCounter += 1;
    const kind = pickSpawnKind(level, Math.random(), starving);
    let x: number;
    if (level.boss) {
      // boss 單屏世界寬 = 當前視寬（§28），右緣入場點隨之計算。
      x = spawnCounter % 2 === 0 ? scene.scale.width - SPAWN_MARGIN_X : SPAWN_MARGIN_X;
    } else {
      // 生成邊距讀動態視寬（§28）：玩家前方「視野外側」隨邏輯寬 854–1200 變化。
      const scrollX = scene.cameras.main.scrollX;
      x = scrollX + scene.scale.width + SPAWN_MARGIN_X + Math.random() * SPAWN_MARGIN_X;
      if (x > level.worldWidth || isInSafeTail(level, x)) {
        x = scrollX - SPAWN_MARGIN_X - Math.random() * SPAWN_MARGIN_X;
        if (x < SPAWN_MARGIN_X) return;
      }
    }
    enemies.spawn(kind, x, SPAWN_Y[kind]);
  }

  function showTutorial(): void {
    tutorialText = scene.add
      .text(scene.scale.width / 2, scene.scale.height * 0.3, TUTORIAL_TEXT, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#3a3a4a',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: tutorialText,
      y: '-=12',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  function dismissTutorial(): void {
    if (!tutorialText) return;
    const text = tutorialText;
    tutorialText = null;
    scene.tweens.killTweensOf(text);
    scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 400,
      onComplete: () => text.destroy(),
    });
  }

  return {
    start() {
      run = createLevelRun(levelId);
      stopped = false;
      tutorialAgeMs = 0;
      tutorialDismissAtMs = TUTORIAL_MAX_MS;
      onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      onGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyRemoved);
      onGameEvent(scene.events, GameEvents.ENEMY_INHALED, onEnemyRemoved);
      onGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
      emitGameEvent(scene.events, GameEvents.LEVEL_CHANGED, {
        levelId: level.id,
        nameZh: level.nameZh,
        killQuota: level.killQuota,
      });
      if (level.tutorial) showTutorial();
    },

    update(deltaMs: number) {
      if (stopped) return;
      if (tutorialText) {
        tutorialAgeMs += deltaMs;
        if (tutorialAgeMs >= tutorialDismissAtMs) dismissTutorial();
      }
      const starving = playerAmmo <= 0 && enemies.aliveInhalableCount() === 0;
      const result = advanceLevelSpawn(run, {
        deltaMs,
        aliveEnemies: enemies.aliveCount(),
        starving,
      });
      run = result.state;
      if (result.spawn) spawnAhead(starving);
    },

    noteInput() {
      if (!tutorialText) return;
      tutorialDismissAtMs = Math.min(tutorialDismissAtMs, tutorialAgeMs + TUTORIAL_INPUT_LINGER_MS);
    },

    isGateOpen() {
      return run.gateOpen;
    },

    // 深度 QA 觀測點（US-025）：當前配額進度。
    getQuota() {
      return { killCount: run.killCount, killQuota: level.killQuota };
    },

    // e2e 除錯鉤子：直接補滿配額觸發開門，仍走正式事件管道。
    forceQuota() {
      while (!level.boss && !run.gateOpen && !stopped) run = recordAndAnnounce(run);
    },

    destroy() {
      offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      offGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyRemoved);
      offGameEvent(scene.events, GameEvents.ENEMY_INHALED, onEnemyRemoved);
      offGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
      if (tutorialText) {
        scene.tweens.killTweensOf(tutorialText);
        tutorialText.destroy();
        tutorialText = null;
      }
    },
  };
}
