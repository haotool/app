import type Phaser from 'phaser';
import type { FxSystem } from './fx';
import { GameEvents, offGameEvent, onGameEvent } from '../core/events';
import { playSfx } from '../audio/sfx';

// 場內浮字與慶祝演出（GAME_DESIGN §24/§46/§94）：成就 toast 佇列、星味首遇
// 提示與彩蛋慶祝集中於此；GameScene 只留佇列委派與 e2e 觀測轉發。

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export interface ToastHooks {
  fx(): FxSystem;
  playerPos(): { x: number; y: number };
  // guided sandbox 由 coachmark 統一承擔教學回饋；停用重複 Canvas 浮字，
  // 避免在小螢幕把操作卡與遊戲畫面一起遮住。
  suppressFlavor?: () => boolean;
}

export interface ToastSystem {
  // 星味首遇 toast（§46/§47）：頂部橫幅下方一行小字，淡入停留後上飄淡出。
  flavor(message: string): void;
  // 成就 toast 佇列（§94）：同批合併單張、跨批序列播放。
  queueAchievements(names: string): void;
  // e2e 觀測點（§94）：最近一張成就 toast 文案（canvas 文字無法由 DOM 斷言）。
  lastAchievementToast(): string;
  // 彩蛋慶祝（§24）：金光 popIn + 專屬 jingle + 浮字（既有 fx 組合）。
  celebrate(message: string): void;
}

export function createToasts(scene: Phaser.Scene, hooks: ToastHooks): ToastSystem {
  const achievementQueue: string[] = [];
  let achievementActive = false;
  let lastAchievement = '';

  // 段重試語意提示（W3）：同王雙語意局內區分——每語意每局一次不重複打擾。
  const seenSegmentSemantics = new Set<string>();
  const onSegmentRetry = ({ semantics }: { semantics: 'kept' | 'refill' }): void => {
    if (seenSegmentSemantics.has(semantics)) return;
    seenSegmentSemantics.add(semantics);
    showFlavor(semantics === 'kept' ? '段首重試——魔王傷勢保留' : '段首重試——魔王氣力回復');
  };
  onGameEvent(scene.events, GameEvents.BOSS_SEGMENT_RETRY, onSegmentRetry);
  scene.events.once('shutdown', () => {
    offGameEvent(scene.events, GameEvents.BOSS_SEGMENT_RETRY, onSegmentRetry);
  });

  // 成就 toast 佇列（§94）：一次一張序列播放（跨批不重疊）；轉場即隨場景銷毀，
  // 漏播由 Result 名單與圖鑑成就頁兜底。金色橫幅帶深色底襯（勝利白閃下仍可讀），
  // 禁全屏遮罩。
  function drainAchievements(): void {
    if (achievementActive) return;
    const names = achievementQueue.shift();
    if (names === undefined) return;
    achievementActive = true;
    lastAchievement = names;
    playSfx('pop');
    const toast = scene.add
      .text(scene.scale.width / 2, scene.scale.height * 0.3, `成就解鎖：${names}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ffe9a8',
        stroke: '#8a6a1f',
        strokeThickness: 4,
        backgroundColor: 'rgba(58, 42, 20, 0.82)',
        padding: { x: 14, y: 7 },
        align: 'center',
        // CJK 逐字換行：多重解鎖合併名單在 854 寬不溢出。
        wordWrap: { width: Math.min(scene.scale.width - 160, 700), useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(110)
      .setScrollFactor(0)
      .setAlpha(0);
    scene.tweens.chain({
      targets: toast,
      tweens: [
        { alpha: 1, duration: 220, ease: 'Quad.easeOut' },
        { alpha: 0, y: '-=16', duration: 360, delay: 1500, ease: 'Quad.easeIn' },
      ],
      onComplete: () => {
        toast.destroy();
        achievementActive = false;
        drainAchievements();
      },
    });
  }

  function showFlavor(message: string): void {
    {
      const toast = scene.add
        .text(scene.scale.width / 2, scene.scale.height * 0.22, message, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#7a5fb8',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(110)
        .setScrollFactor(0)
        .setAlpha(0);
      scene.tweens.chain({
        targets: toast,
        tweens: [
          { alpha: 1, duration: 220, ease: 'Quad.easeOut' },
          { alpha: 0, y: '-=16', duration: 360, delay: 1600, ease: 'Quad.easeIn' },
        ],
        onComplete: () => toast.destroy(),
      });
    }
  }

  return {
    flavor(message: string) {
      if (hooks.suppressFlavor?.()) return;
      showFlavor(message);
    },

    queueAchievements(names: string) {
      achievementQueue.push(names);
      drainAchievements();
    },

    lastAchievementToast() {
      return lastAchievement;
    },

    celebrate(message: string) {
      playSfx('jingle');
      const { x: playerX, y } = hooks.playerPos();
      // 浮字夾限於鏡頭視野內，避免世界邊緣觸發時被裁切。
      const view = scene.cameras.main.worldView;
      const x = clamp(playerX, view.x + 110, view.right - 110);
      const glow = scene.add
        .image(x, y, 'fx-star')
        .setDisplaySize(130, 130)
        .setTint(0xffc93c)
        .setAlpha(0)
        .setDepth(94);
      scene.tweens.add({
        targets: glow,
        alpha: { from: 0.9, to: 0 },
        scale: { from: glow.scale * 0.3, to: glow.scale * 1.7 },
        duration: 750,
        ease: 'Quad.easeOut',
        onComplete: () => glow.destroy(),
      });
      hooks.fx().starBurst(x, y - 20);
      const label = scene.add
        .text(x, y - 64, message, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#ffc93c',
          stroke: '#3a3a4a',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(96);
      scene.tweens.add({
        targets: label,
        y: y - 118,
        alpha: { from: 1, to: 0 },
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => label.destroy(),
      });
    },
  };
}
