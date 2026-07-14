import Phaser from 'phaser';
import './style.css';
import { CANVAS, GRAVITY_Y } from './game/core/config';
import { SceneKeys, type EnemyKind } from './game/core/types';
import type { EnemySystem } from './game/systems/enemies';
import type { PlayerHandle } from './game/systems/player';
import type { WaveRunner } from './game/systems/waves';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';
import { restoreMutePreference } from './game/systems/hud';

restoreMutePreference();

// iOS 觸控直通（§22 / recon checklist）：長按 loupe 的觸發點是按住不動的 touchstart，
// pointerdown preventDefault 不足，app 與控制層需 passive:false 保險；三指以上留給系統手勢。
const blockTouchStart = (event: TouchEvent): void => {
  if (event.touches.length <= 2) event.preventDefault();
};
for (const id of ['app', 'controls']) {
  document.getElementById(id)?.addEventListener('touchstart', blockTouchStart, { passive: false });
}
// Safari pinch 縮放攔截；contextmenu 關長按/右鍵選單。
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (event) => event.preventDefault());

// Phaser 接線集中於此；數值 SSOT 由 config.ts（純資料）供給。
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#FDEFF6',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS.width,
    height: CANVAS.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
    },
  },
  // 非 pixel-art 美術關閉 roundPixels（US-022 / recon C.8）：與 camera 跟隨的次像素
  // 捲動值互斥，開啟會把小數落差量化成 ±1–2px 逐幀跳動。
  pixelArt: false,
  roundPixels: false,
  scene: [BootScene, TitleScene, GameScene, ResultScene],
});

// iOS orientationchange 後 viewport 尺寸非同步就緒，延遲 350ms 再刷新 Scale（recon C.9）。
window.addEventListener('orientationchange', () => {
  setTimeout(() => game.scale.refresh(), 350);
});

const gameScene = () => game.scene.getScene<GameScene>(SceneKeys.Game);

// 反卡死（§26）：切背景暫停遊戲場景（物理與計時一併停止），回前景恢復。
document.addEventListener('visibilitychange', () => {
  const plugin = gameScene()?.scene;
  if (!plugin) return;
  if (document.hidden) {
    if (plugin.isActive()) plugin.pause();
  } else if (plugin.isPaused()) {
    plugin.resume();
  }
});

// e2e 測試鉤子：查詢場景/關卡狀態、強制勝敗、補滿配額與直達魔王關。
// 僅開發與測試環境掛載（修復包 B）：production bundle 不暴露除錯入口。
declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
      fillQuota: () => void;
      skipToBoss: () => void;
      spawn: (kind: EnemyKind, x?: number, y?: number) => void;
      ammo: () => { ammo: number; flavor: string };
      probe: () => { x: number; scrollX: number };
      alive: () => { total: number; inhalable: number };
      gateOpen: () => boolean;
      quota: () => { killCount: number; killQuota: number };
      listeners: (event: string) => number;
      enemies: () => { kind: string; x: number; y: number }[];
    };
  }
}
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  // 受控 spawn 與彈匣查詢（US-018）：以型別斷言讀場景私有系統，production 不暴露。
  const internals = () =>
    gameScene() as unknown as { enemies: EnemySystem; player: PlayerHandle; waves: WaveRunner };
  window.__sp = {
    scene: () => game.scene.getScenes(true)[0]?.scene.key ?? '',
    stage: () => gameScene().currentLevelId,
    bossHp: () => gameScene().bossHp,
    playerHp: () => gameScene().playerHp,
    win: () => gameScene().forceWin(),
    lose: () => gameScene().forceLose(),
    fillQuota: () => gameScene().forceGate(),
    skipToBoss: () => gameScene().skipToBoss(),
    spawn: (kind, x = 240, y = 300) => internals().enemies.spawn(kind, x, y),
    ammo: () => internals().player.getAmmoState(),
    // 抖動診斷探針（US-022）：逐幀取玩家世界座標與相機捲動，量測 screen-space 穩定度。
    probe: () => ({ x: internals().player.sprite.x, scrollX: gameScene().cameras.main.scrollX }),
    // 反卡死深度 QA 觀測點（US-025）：場上敵數、開門狀態與事件監聽數。
    alive: () => ({
      total: internals().enemies.aliveCount(),
      inhalable: internals().enemies.aliveInhalableCount(),
    }),
    gateOpen: () => internals().waves.isGateOpen(),
    quota: () => internals().waves.getQuota(),
    listeners: (event: string) => gameScene().events.listenerCount(event),
    enemies: () => {
      const list: { kind: string; x: number; y: number }[] = [];
      for (const child of internals().enemies.getGroup().getChildren()) {
        const kind = internals().enemies.kindOf(child);
        if (!kind) continue;
        const sprite = child as unknown as { x: number; y: number };
        list.push({ kind, x: Math.round(sprite.x), y: Math.round(sprite.y) });
      }
      return list;
    },
  };
}
