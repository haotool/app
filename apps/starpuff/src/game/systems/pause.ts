import type Phaser from 'phaser';
import { SceneKeys } from '../core/types';
import { resumeAudio, suspendAudio } from '../audio/sfx';

// 暫停系統（GAME_DESIGN §35）：DOM 覆層選單（旋轉殼下 hit-test 天然正確）+ 場景級
// scene.pause（物理/計時/tween 全停）+ AudioContext suspend（BGM 與 SFX 全停）。
// 離頁自動暫停（visibilitychange/pagehide）與 HUD 暫停鍵共用同一入口，冪等可重入。

interface RestartableGameScene extends Phaser.Scene {
  restartCurrentLevel(): void;
}

let overlay: HTMLElement | null = null;

export function isGamePaused(): boolean {
  return overlay !== null;
}

function addButton(
  card: HTMLElement,
  action: 'resume' | 'restart' | 'quit',
  label: string,
  onPress: () => void,
): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pause-btn';
  button.dataset['pause'] = action;
  button.textContent = label;
  // pointerdown 而非 click：殼層 touchstart preventDefault 會吞 click；
  // 且 resume 於使用者手勢堆疊內呼叫，滿足 iOS interrupted 態解鎖（§33）。
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    onPress();
  });
  card.appendChild(button);
}

function close(): void {
  overlay?.remove();
  overlay = null;
  resumeAudio();
}

export function openPauseMenu(game: Phaser.Game): void {
  if (overlay) return;
  const plugin = game.scene.getScene(SceneKeys.Game)?.scene;
  if (!plugin?.isActive()) return;
  const shell = document.getElementById('game-shell');
  if (!shell) return;

  plugin.pause();
  suspendAudio();

  overlay = document.createElement('div');
  overlay.className = 'pause-overlay';
  const card = document.createElement('div');
  card.className = 'pause-card';
  const title = document.createElement('div');
  title.className = 'pause-title';
  title.textContent = '暫停中';
  card.appendChild(title);

  addButton(card, 'resume', '繼續', () => {
    close();
    plugin.resume();
  });
  addButton(card, 'restart', '重新開始', () => {
    close();
    plugin.resume();
    (game.scene.getScene(SceneKeys.Game) as RestartableGameScene).restartCurrentLevel();
  });
  addButton(card, 'quit', '回主選單', () => {
    close();
    game.scene.stop(SceneKeys.Game);
    game.scene.start(SceneKeys.Title);
  });

  overlay.appendChild(card);
  shell.appendChild(overlay);
}
