import type Phaser from 'phaser';
import { SceneKeys } from '../core/types';
import { resumeAudio, suspendAudio } from '../audio/sfx';
import { isKeyConfigOpen } from './keyConfig';

// 暫停系統（GAME_DESIGN §35）：DOM 覆層選單（旋轉殼下 hit-test 天然正確）+ SceneManager
// 級 pause（sys.pause 立即生效，非 ScenePlugin queueOp 的下一幀）+ AudioContext suspend
// （BGM 與 SFX 全停）。ESC/HUD 暫停鍵/離頁三入口共用此單一入口，冪等可重入。

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
  // 按鈕配置模式中不觸發暫停選單（配置僅存在於 Title，此為離頁事件的防疊保險）。
  if (isKeyConfigOpen()) return;
  const manager = game.scene;
  // 守門：運行中且未暫停才可開（isPaused 明確排除已暫停態，不依賴 isActive 單一語意）。
  if (!manager.isActive(SceneKeys.Game) || manager.isPaused(SceneKeys.Game)) return;
  const shell = document.getElementById('game-shell');
  if (!shell) return;

  // SceneManager.pause 直呼 sys.pause 立即生效：物理/計時/tween 當幀凍結。
  manager.pause(SceneKeys.Game);
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
    manager.resume(SceneKeys.Game);
  });
  addButton(card, 'restart', '重新開始', () => {
    close();
    manager.resume(SceneKeys.Game);
    (manager.getScene(SceneKeys.Game) as RestartableGameScene).restartCurrentLevel();
  });
  addButton(card, 'quit', '回主選單', () => {
    close();
    manager.stop(SceneKeys.Game);
    manager.start(SceneKeys.Title);
  });

  overlay.appendChild(card);
  shell.appendChild(overlay);
}
