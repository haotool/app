import Phaser from 'phaser';
import './style.css';
import { GRAVITY_Y, VIEW, computeLogicalWidth } from './game/core/config';
import { SceneKeys, type EnemyKind } from './game/core/types';
import type { EnemySystem } from './game/systems/enemies';
import type { PlayerHandle } from './game/systems/player';
import type { WaveRunner } from './game/systems/waves';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';
import { pointerToLocal } from './game/systems/controls';
import { restoreMutePreference } from './game/systems/hud';

restoreMutePreference();

// iOS 觸控直通（§22 / recon checklist）：長按 loupe 的觸發點是按住不動的 touchstart，
// pointerdown preventDefault 不足，殼層需 passive:false 保險；三指以上留給系統手勢。
const blockTouchStart = (event: TouchEvent): void => {
  if (event.touches.length <= 2) event.preventDefault();
};
document
  .getElementById('game-shell')
  ?.addEventListener('touchstart', blockTouchStart, { passive: false });
// Safari pinch 縮放攔截；contextmenu 關長按/右鍵選單。
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (event) => event.preventDefault());

// 量測基準（硬規則 5）：殼 clientWidth/Height 為 layout 值，不受 CSS rotate 影響，
// 即 canvas CSS px 所在的殼局部座標空間。
function measureShell(): { w: number; h: number } | null {
  const shell = document.getElementById('game-shell');
  if (!shell || shell.clientWidth <= 0 || shell.clientHeight <= 0) return null;
  return { w: shell.clientWidth, h: shell.clientHeight };
}

// boot 定寬（recon-v4 B.2）：模組執行時殼與樣式已就緒，直接以殼比例決定初始邏輯寬，
// 場景自 create 起讀到的 scale.width 即為正確值。
const initialShell = measureShell();
const initialWidth = initialShell
  ? computeLogicalWidth(initialShell.w, initialShell.h)
  : VIEW.minWidth;

// Phaser 接線集中於此；數值 SSOT 由 config.ts（純資料）供給。
// 置中由 #app CSS grid 負責（NO_CENTER）：autoCenter margin 在旋轉殼下讀 canvas AABB
// （寬高互換）會算出錯誤偏移。
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#FDEFF6',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: initialWidth,
    height: VIEW.height,
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

// FIT 的 canvas 樣式以 parentSize 計算，而 ScaleManager 每次 refresh 內部都以
// getBoundingClientRect 重量測 parent——旋轉殼下該 AABB 寬高互換，會把 canvas 誤縮成
// 直式。改寫量測原語為殼局部尺寸，所有內部 refresh 路徑一次矯正。
game.scale.getParentBounds = function getShellBounds(): boolean {
  const shell = measureShell();
  if (!shell) return false;
  const parentSize = this.parentSize;
  if (parentSize.width === shell.w && parentSize.height === shell.h) return false;
  parentSize.setSize(shell.w, shell.h);
  return true;
};

// canvas 指標補償（recon-v4 A.3 備選）：portrait 殼旋轉下 Phaser 以 canvasBounds AABB 反推
// 座標會錯位（phaser#7175）。改寫座標轉換原語：先轉 canvas 局部座標（90 度逆變換）再換算
// 邏輯座標，殘存 canvas 互動（靜音鈕等）兩種持向皆正確；landscape 走原生路徑。
const nativeTransformPointer = game.input.transformPointer.bind(game.input);
game.input.transformPointer = (pointer, pageX, pageY, wasMove) => {
  if (!window.matchMedia('(orientation: portrait)').matches) {
    nativeTransformPointer(pointer, pageX, pageY, wasMove);
    return;
  }
  const canvas = game.canvas;
  const local = pointerToLocal(
    canvas.getBoundingClientRect(),
    canvas.clientWidth,
    canvas.clientHeight,
    true,
    pageX - window.scrollX,
    pageY - window.scrollY,
  );
  pointer.prevPosition.set(pointer.position.x, pointer.position.y);
  pointer.position.set(
    (local.x * game.scale.width) / canvas.clientWidth,
    (local.y * game.scale.height) / canvas.clientHeight,
  );
};

// 旋轉殼佈局（recon-v4 A/B）：CSS 殼先穩定 → 量測殼 → setGameSize → refresh + updateBounds。
// setGameSize 只在此呼叫（硬規則 7）；scale resize 事件內禁止再呼叫。
function applyShellLayout(): void {
  const shell = measureShell();
  if (!shell) return;
  const width = computeLogicalWidth(shell.w, shell.h);
  game.scale.getParentBounds();
  if (width !== game.scale.width) game.scale.setGameSize(width, VIEW.height);
  game.scale.refresh();
  game.scale.updateBounds();
}

// resize 節流 150ms；orientationchange 後 iOS viewport 尺寸非同步就緒，延遲 350ms（recon C.9）。
let layoutTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleLayout(delayMs: number): void {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(applyShellLayout, delayMs);
}
window.addEventListener('resize', () => scheduleLayout(150));
window.addEventListener('orientationchange', () => scheduleLayout(350));

// boot 定寬：READY 時殼 CSS 已穩定，依殼比例一次設定邏輯寬（854–1200）。
game.events.once(Phaser.Core.Events.READY, applyShellLayout);

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
      view: () => { width: number; height: number };
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
    // 響應寬幅觀測點（US-028）：回報當前邏輯視寬（854–1200）與固定邏輯高。
    view: () => ({ width: game.scale.width, height: game.scale.height }),
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
