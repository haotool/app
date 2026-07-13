import type Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { GameEvents, emitGameEvent, offGameEvent, onGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { advanceWave, createWaveState, type WaveModelState } from '../logic/waveModel';
import type { EnemySystem } from './enemies';

export interface WaveRunner {
  start(): void;
  update(deltaMs: number): void;
  destroy(): void;
}

const SPAWN_MARGIN_X = 48;
const SPAWN_AIR_Y = 260;
const SPAWN_DROP_Y = 700;

const TUTORIAL_TEXT = '◀▶ 移動　Ⓐ 跳躍\nⒷ 長按吸入・點按發射';

export function createWaveRunner(scene: Phaser.Scene, enemies: EnemySystem): WaveRunner {
  let state: WaveModelState | null = null;
  let stopped = false;
  let spawnCounter = 0;
  let tutorialText: Phaser.GameObjects.Text | null = null;

  // 魔王擊破後停止補生，避免勝利演出期間持續生怪。
  const onBossDefeated = (): void => {
    stopped = true;
  };

  function spawnFromEdge(kind: EnemyKind): void {
    spawnCounter += 1;
    const x = spawnCounter % 2 === 0 ? CANVAS.width - SPAWN_MARGIN_X : SPAWN_MARGIN_X;
    const y = kind === 'floaty' ? SPAWN_AIR_Y : SPAWN_DROP_Y;
    enemies.spawn(kind, x, y);
  }

  function showTutorial(): void {
    tutorialText = scene.add
      .text(CANVAS.width / 2, CANVAS.height * 0.3, TUTORIAL_TEXT, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#3a3a4a',
        align: 'center',
      })
      .setOrigin(0.5);
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
      state = createWaveState();
      stopped = false;
      onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      emitGameEvent(scene.events, GameEvents.WAVE_CHANGED, { wave: state.wave });
      showTutorial();
    },

    update(deltaMs: number) {
      if (!state || stopped) return;
      const result = advanceWave(state, { deltaMs, aliveEnemies: enemies.aliveCount() });
      state = result.state;
      if (result.waveChanged) {
        emitGameEvent(scene.events, GameEvents.WAVE_CHANGED, { wave: result.waveChanged });
        dismissTutorial();
      }
      for (const kind of result.spawns) spawnFromEdge(kind);
    },

    destroy() {
      offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      if (tutorialText) {
        scene.tweens.killTweensOf(tutorialText);
        tutorialText.destroy();
        tutorialText = null;
      }
      state = null;
    },
  };
}
